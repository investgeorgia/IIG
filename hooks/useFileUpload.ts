import { useState, useRef, useCallback } from 'react'

export interface FileUploadState {
  name: string
  size: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  progress: number
  error?: string
}

export interface UploadProgressInfo {
  isUploading: boolean
  currentFileIndex: number
  totalFiles: number
  transferredBytes: number
  totalBytes: number
  speed: string // e.g. "2.4 MB/s" or "350 KB/s"
  eta: string   // e.g. "12s" or "1m 05s"
  remainingBytes: number
  overallPercentage: number
  fileStates: FileUploadState[]
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

export function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec <= 0) return '0 KB/s'
  return `${formatBytes(bytesPerSec)}/s`
}

export function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return 'Calculating...'
  if (seconds < 60) return `${Math.ceil(seconds)}s remaining`
  const mins = Math.floor(seconds / 60)
  const secs = Math.ceil(seconds % 60)
  return `${mins}m ${secs}s remaining`
}

export function useFileUpload() {
  const [progressInfo, setProgressInfo] = useState<UploadProgressInfo>({
    isUploading: false,
    currentFileIndex: 0,
    totalFiles: 0,
    transferredBytes: 0,
    totalBytes: 0,
    speed: '0 KB/s',
    eta: '',
    remainingBytes: 0,
    overallPercentage: 0,
    fileStates: [],
  })

  const xhrRef = useRef<XMLHttpRequest | null>(null)
  const isCancelledRef = useRef<boolean>(false)

  const cancelUpload = useCallback(() => {
    isCancelledRef.current = true
    if (xhrRef.current) {
      xhrRef.current.abort()
      xhrRef.current = null
    }
    setProgressInfo(prev => ({
      ...prev,
      isUploading: false,
    }))
  }, [])

  const uploadFiles = useCallback(async (
    files: File[],
    options: {
      endpoint?: string
      type?: string
      projectId?: string
      onSingleSuccess?: (file: File, responseData: any) => Promise<void> | void
    } = {}
  ): Promise<{ successful: number; failed: number }> => {
    if (!files || files.length === 0) return { successful: 0, failed: 0 }

    const endpoint = options.endpoint || '/api/uploads'
    isCancelledRef.current = false

    const initialFileStates: FileUploadState[] = files.map(f => ({
      name: f.name,
      size: f.size,
      status: 'pending',
      progress: 0,
    }))

    const totalBytes = files.reduce((acc, f) => acc + f.size, 0)

    setProgressInfo({
      isUploading: true,
      currentFileIndex: 0,
      totalFiles: files.length,
      transferredBytes: 0,
      totalBytes,
      speed: '0 KB/s',
      eta: '',
      remainingBytes: totalBytes,
      overallPercentage: 0,
      fileStates: initialFileStates,
    })

    let completedPreviousFilesBytes = 0
    let successfulCount = 0
    let failedCount = 0

    const startTime = Date.now()
    let lastTime = startTime
    let lastLoadedAll = 0

    for (let i = 0; i < files.length; i++) {
      if (isCancelledRef.current) break

      const file = files[i]

      // Update current file to uploading
      initialFileStates[i].status = 'uploading'
      setProgressInfo(prev => ({
        ...prev,
        currentFileIndex: i + 1,
        fileStates: [...initialFileStates],
      }))

      const formData = new FormData()
      formData.append('file', file)
      if (options.type) formData.append('type', options.type)
      if (options.projectId) formData.append('projectId', options.projectId)

      try {
        const responseData = await new Promise<any>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhrRef.current = xhr

          xhr.upload.onprogress = (event) => {
            if (!event.lengthComputable) return

            const now = Date.now()
            const timeDelta = (now - lastTime) / 1000 // in seconds

            const currentFileLoaded = event.loaded
            const currentFileProgress = Math.round((currentFileLoaded / file.size) * 100)

            const totalTransferredSoFar = completedPreviousFilesBytes + currentFileLoaded
            const remainingBytes = Math.max(0, totalBytes - totalTransferredSoFar)
            const overallPercentage = totalBytes > 0 ? Math.min(100, Math.round((totalTransferredSoFar / totalBytes) * 100)) : 0

            // Speed calculation over last interval or overall average
            let currentSpeed = 0
            if (timeDelta >= 0.3) {
              const loadedDelta = totalTransferredSoFar - lastLoadedAll
              currentSpeed = loadedDelta / timeDelta
              lastTime = now
              lastLoadedAll = totalTransferredSoFar
            } else {
              // Overall average speed
              const totalElapsedSecs = (now - startTime) / 1000
              if (totalElapsedSecs > 0) {
                currentSpeed = totalTransferredSoFar / totalElapsedSecs
              }
            }

            const remainingSeconds = currentSpeed > 0 ? remainingBytes / currentSpeed : 0

            initialFileStates[i].progress = currentFileProgress

            setProgressInfo(prev => ({
              ...prev,
              transferredBytes: totalTransferredSoFar,
              remainingBytes,
              overallPercentage,
              speed: formatSpeed(currentSpeed),
              eta: formatDuration(remainingSeconds),
              fileStates: [...initialFileStates],
            }))
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const resJson = JSON.parse(xhr.responseText)
                resolve(resJson)
              } catch {
                resolve({ raw: xhr.responseText })
              }
            } else {
              try {
                const errJson = JSON.parse(xhr.responseText)
                reject(new Error(errJson.error || errJson.message || `HTTP ${xhr.status}`))
              } catch {
                reject(new Error(`Upload failed with status ${xhr.status}`))
              }
            }
          }

          xhr.onerror = () => reject(new Error('Network error during file upload'))
          xhr.onabort = () => reject(new Error('Upload cancelled'))

          xhr.open('POST', endpoint, true)
          xhr.send(formData)
        })

        if (options.onSingleSuccess) {
          await options.onSingleSuccess(file, responseData)
        }

        initialFileStates[i].status = 'completed'
        initialFileStates[i].progress = 100
        successfulCount++
      } catch (err: any) {
        if (isCancelledRef.current) break
        initialFileStates[i].status = 'error'
        initialFileStates[i].error = err.message || 'Upload failed'
        failedCount++
      } finally {
        completedPreviousFilesBytes += file.size
        xhrRef.current = null
      }
    }

    // Final finish state
    setProgressInfo(prev => ({
      ...prev,
      isUploading: false,
      transferredBytes: totalBytes,
      remainingBytes: 0,
      overallPercentage: 100,
      speed: '0 KB/s',
      eta: '',
      fileStates: [...initialFileStates],
    }))

    return { successful: successfulCount, failed: failedCount }
  }, [])

  return {
    progressInfo,
    uploadFiles,
    cancelUpload,
    resetProgress: useCallback(() => {
      setProgressInfo({
        isUploading: false,
        currentFileIndex: 0,
        totalFiles: 0,
        transferredBytes: 0,
        totalBytes: 0,
        speed: '0 KB/s',
        eta: '',
        remainingBytes: 0,
        overallPercentage: 0,
        fileStates: [],
      })
    }, [])
  }
}
