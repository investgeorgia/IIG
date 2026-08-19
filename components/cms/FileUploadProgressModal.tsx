'use client'

import React from 'react'
import { UploadProgressInfo, formatBytes } from '@/hooks/useFileUpload'
import { Loader2, CheckCircle2, AlertCircle, X, Zap, Clock, HardDrive, Files } from 'lucide-react'

interface FileUploadProgressModalProps {
  progressInfo: UploadProgressInfo
  onCancel: () => void
  onClose?: () => void
  title?: string
}

export function FileUploadProgressModal({
  progressInfo,
  onCancel,
  onClose,
  title = 'Uploading Files'
}: FileUploadProgressModalProps) {
  const {
    isUploading,
    currentFileIndex,
    totalFiles,
    transferredBytes,
    totalBytes,
    speed,
    eta,
    remainingBytes,
    overallPercentage,
    fileStates,
  } = progressInfo

  if (!isUploading && fileStates.length === 0) return null

  const isFinished = !isUploading && fileStates.length > 0
  const completedCount = fileStates.filter(f => f.status === 'completed').length
  const failedCount = fileStates.filter(f => f.status === 'error').length
  const remainingCount = Math.max(0, totalFiles - completedCount - failedCount)

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0">
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : failedCount > 0 ? (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {isFinished ? 'Upload Complete' : title}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {isFinished
                  ? `Processed ${totalFiles} file(s): ${completedCount} successful${failedCount > 0 ? `, ${failedCount} failed` : ''}`
                  : `Uploading file ${currentFileIndex} of ${totalFiles} (${remainingCount} remaining)`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={isUploading ? onCancel : (onClose || onCancel)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title={isUploading ? 'Cancel Upload' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Progress Bar */}
        <div className="space-y-2 mb-5">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-700">Overall Progress</span>
            <span className="text-red-600 font-bold">{overallPercentage}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${overallPercentage}%` }}
            />
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
          {/* Transfer Count */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-slate-500 font-medium text-[11px]">
              <Files className="w-3.5 h-3.5 text-slate-400" />
              <span>Files</span>
            </div>
            <p className="font-bold text-slate-900 text-xs truncate">
              {completedCount} / {totalFiles}
            </p>
          </div>

          {/* Data Transferred */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-slate-500 font-medium text-[11px]">
              <HardDrive className="w-3.5 h-3.5 text-slate-400" />
              <span>Data</span>
            </div>
            <p className="font-bold text-slate-900 text-xs truncate" title={`${formatBytes(transferredBytes)} / ${formatBytes(totalBytes)}`}>
              {formatBytes(transferredBytes)} / {formatBytes(totalBytes)}
            </p>
          </div>

          {/* Transfer Speed */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-slate-500 font-medium text-[11px]">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Speed</span>
            </div>
            <p className="font-bold text-slate-900 text-xs truncate">
              {isUploading ? speed : '0 KB/s'}
            </p>
          </div>

          {/* Remaining Time */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-slate-500 font-medium text-[11px]">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>Remaining</span>
            </div>
            <p className="font-bold text-slate-900 text-xs truncate">
              {isUploading ? (eta || 'Calculating...') : 'Done'}
            </p>
          </div>
        </div>

        {/* Detailed File Status List */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            File Queue Details
          </p>

          {fileStates.map((file, idx) => (
            <div
              key={file.name + '-' + idx}
              className={`p-3 rounded-xl border text-xs transition-all ${
                file.status === 'uploading'
                  ? 'bg-red-50/50 border-red-200 text-slate-900'
                  : file.status === 'completed'
                  ? 'bg-emerald-50/30 border-emerald-100 text-slate-700'
                  : file.status === 'error'
                  ? 'bg-rose-50/50 border-rose-200 text-rose-800'
                  : 'bg-slate-50/50 border-slate-200/60 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-medium truncate text-slate-900">
                    {file.name}
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    ({formatBytes(file.size)})
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 font-semibold text-[11px]">
                  {file.status === 'uploading' && (
                    <span className="text-red-600 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {file.progress}%
                    </span>
                  )}
                  {file.status === 'completed' && (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Done
                    </span>
                  )}
                  {file.status === 'error' && (
                    <span className="text-rose-600 flex items-center gap-1" title={file.error}>
                      <AlertCircle className="w-3.5 h-3.5" />
                      Failed
                    </span>
                  )}
                  {file.status === 'pending' && (
                    <span className="text-slate-400">Waiting...</span>
                  )}
                </div>
              </div>

              {/* Progress bar for current uploading file */}
              {file.status === 'uploading' && (
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="h-full bg-red-600 rounded-full transition-all duration-150"
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-medium">
            {isUploading ? `Remaining: ${formatBytes(remainingBytes)}` : 'All transfers finished'}
          </span>

          <div className="flex gap-2">
            {isUploading ? (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
              >
                Cancel Upload
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose || onCancel}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors shadow-sm"
              >
                Close
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
