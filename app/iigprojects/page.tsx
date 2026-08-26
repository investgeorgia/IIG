"use client"

import React, { useState, useEffect, useRef } from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  CircleDollarSign, 
  Home, 
  Calendar, 
  Maximize, 
  TrendingUp, 
  Clock,
  Eye,
  EyeOff
} from 'lucide-react'
import { projectsData, Project } from './data'

export default function IIGProjectsPage() {
  const [projectsList, setProjectsList] = useState<Project[]>(projectsData)
  const [activeProjectId, setActiveProjectId] = useState<number>(projectsData[0].id)
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0)
  
  const initialDefaultImg = projectsData[0].images[0]
  const initialFormattedImg = initialDefaultImg.startsWith('/') ? initialDefaultImg : `/${initialDefaultImg}`
  const [bgImage, setBgImage] = useState<string>(initialFormattedImg)
  const [bgOpacity, setBgOpacity] = useState<number>(1)
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false)
  const [imageNameOpacity, setImageNameOpacity] = useState<number>(1)

  const [isUIHidden, setIsUIHidden] = useState<boolean>(false)

  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true)
  const [loadProgress, setLoadProgress] = useState<number>(0)

  // Salesperson referral system state
  const [salesperson, setSalesperson] = useState<any>(null)
  const [isInquiryOpen, setIsInquiryOpen] = useState(false)
  const [inquiryForm, setInquiryForm] = useState({ name: '', email: '', phone: '', notes: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleClearCacheAndReload = async () => {
    try {
      if (typeof window !== 'undefined') {
        if ('caches' in window) {
          const cacheKeys = await caches.keys()
          await Promise.all(cacheKeys.map(key => caches.delete(key)))
        }
        if (window.localStorage) localStorage.clear()
        if (window.sessionStorage) sessionStorage.clear()
      }
    } catch (e) {
      console.error('Error clearing cache:', e)
    }
    const cleanUrl = window.location.origin + window.location.pathname + '?reload=' + Date.now()
    window.location.href = cleanUrl
  }

  // Fetch dynamic projects, pre-cache all assets into browser memory & animate preloader screen
  useEffect(() => {
    let isMounted = true

    const loadAllDataAndAssets = async () => {
      let fetchedProjects: Project[] = projectsData
      try {
        const res = await fetch(`/api/iigprojects?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        })
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          fetchedProjects = data
          if (isMounted) {
            setProjectsList(data)
            setActiveProjectId(data[0].id)
          }
        }
      } catch (err) {
        console.error('Error fetching dynamic projects:', err)
      }

      // Fetch salesperson in parallel
      fetch('/api/salesperson/current')
        .then(res => res.json())
        .then(data => { if (data && isMounted) setSalesperson(data) })
        .catch(err => console.error('Error fetching salesperson', err))

      // Collect all image URLs across all projects to pre-decode into browser memory
      const urlsToPreload: string[] = []
      fetchedProjects.forEach(proj => {
        if (proj.thumbnail) {
          const formatted = proj.thumbnail.startsWith('/') ? proj.thumbnail : `/${proj.thumbnail}`
          if (!urlsToPreload.includes(formatted)) urlsToPreload.push(formatted)
        }
        if (proj.images && proj.images.length > 0) {
          proj.images.forEach(imgUrl => {
            const formatted = imgUrl.startsWith('/') ? imgUrl : `/${imgUrl}`
            if (!urlsToPreload.includes(formatted) && !formatted.endsWith('.mp4') && !formatted.endsWith('.webm')) {
              urlsToPreload.push(formatted)
            }
          })
        }
      })

      if (urlsToPreload.length === 0) {
        if (isMounted) {
          setLoadProgress(100)
          setTimeout(() => setIsInitialLoading(false), 300)
        }
        return
      }

      let loadedCount = 0
      const totalCount = urlsToPreload.length

      const updateProgress = () => {
        loadedCount++
        const percentage = Math.min(Math.round((loadedCount / totalCount) * 100), 100)
        if (isMounted) setLoadProgress(percentage)

        if (loadedCount >= totalCount) {
          setTimeout(() => {
            if (isMounted) setIsInitialLoading(false)
          }, 300)
        }
      }

      // Preload & pre-decode images directly into browser cache
      urlsToPreload.forEach(url => {
        const img = new Image()
        img.onload = updateProgress
        img.onerror = updateProgress
        img.src = url
      })

      // Maximum safety timeout (3.5s max preloader duration)
      setTimeout(() => {
        if (isMounted) {
          setLoadProgress(100)
          setTimeout(() => setIsInitialLoading(false), 200)
        }
      }, 3500)
    }

    loadAllDataAndAssets()

    return () => {
      isMounted = false
    }
  }, [])

  // Track global pageview
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    fetch('/api/tracking/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        utm_source: urlParams.get('utm_source'),
        utm_medium: urlParams.get('utm_medium'),
        utm_campaign: urlParams.get('utm_campaign'),
        referrer_url: document.referrer || undefined
      })
    }).catch(err => console.error('Failed to track pageview', err))
  }, [])

  const carouselContainerRef = useRef<HTMLDivElement>(null)
  const bottomWrapperRef = useRef<HTMLDivElement>(null)
  
  // Touch swipe state
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const minSwipeDistance = 35

  const activeProject = projectsList.find(p => p.id === activeProjectId) || projectsList[0]
  const activeMediaUrl = activeProject?.images?.[activeImageIndex] || activeProject?.thumbnail || ''
  const isCurrentMediaVideo = activeMediaUrl?.endsWith('.mp4') || activeMediaUrl?.endsWith('.webm') || (activeProject as any)?.mediaDetails?.[activeImageIndex]?.type === 'VIDEO'

  // Check if project qualifies for VR 3D QR Code (Ortachala & Kavtaradze only)
  const isVRProject = (() => {
    if (!activeProject) return false
    const name = (activeProject.name || '').toLowerCase()
    const slug = ((activeProject as any).slug || '').toLowerCase()
    return (
      name.includes('ortachal') || slug.includes('ortachal') ||
      name.includes('kavtaradze') || name.includes('kavataradze') || slug.includes('kavtaradze') || slug.includes('kavataradze')
    )
  })()

  // Auto-reset to first project after 3 minutes of inactivity
  useEffect(() => {
    let idleTimer: NodeJS.Timeout

    const resetIdleTimer = () => {
      clearTimeout(idleTimer)
      idleTimer = setTimeout(() => {
        if (projectsList && projectsList.length > 0) {
          setActiveProjectId(projectsList[0].id)
          setActiveImageIndex(0)
        }
      }, 3 * 60 * 1000)
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click']
    events.forEach(event => window.addEventListener(event, resetIdleTimer, { passive: true }))

    resetIdleTimer()

    return () => {
      clearTimeout(idleTimer)
      events.forEach(event => window.removeEventListener(event, resetIdleTimer))
    }
  }, [projectsList])

  // Normalize image URL helper
  const appendVersion = (url: string) => url

  // Preload next image of active project for instant carousel browsing
  useEffect(() => {
    if (!activeProject || !activeProject.images || activeProject.images.length <= 1) return
    const nextIndex = (activeImageIndex + 1) % activeProject.images.length
    const nextUrl = activeProject.images[nextIndex]
    if (nextUrl && !nextUrl.endsWith('.mp4') && !nextUrl.endsWith('.webm')) {
      const nextImg = new Image()
      const formattedUrl = nextUrl.startsWith('/') ? nextUrl : `/${nextUrl}`
      nextImg.src = formattedUrl
    }
  }, [activeProjectId, activeImageIndex, activeProject])

  // Handle active image loading & instant display
  useEffect(() => {
    if (!activeProject || !activeProject.images || activeProject.images.length === 0) return

    const rawUrl = activeProject.images[activeImageIndex] || activeProject.thumbnail
    if (!rawUrl) return

    const formattedUrl = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`
    const isVid = formattedUrl.endsWith('.mp4') || formattedUrl.endsWith('.webm') || (activeProject as any)?.mediaDetails?.[activeImageIndex]?.type === 'VIDEO'

    // Set background image state immediately for instant rendering without waiting for onload
    setBgImage(formattedUrl)
    setBgOpacity(1)
    setIsTransitioning(false)

    if (isVid) return

    // Preload image object into browser memory
    const img = new Image()
    img.src = formattedUrl
  }, [activeProjectId, activeImageIndex, activeProject])

  // Dynamic mobile viewport height calculation
  const setMobileHeroHeight = () => {
    if (typeof window === 'undefined') return
    if (window.innerWidth <= 768) {
      const panelHeight = bottomWrapperRef.current ? bottomWrapperRef.current.offsetHeight : 0
      const viewportHeight = window.innerHeight
      const heroHeight = Math.max(viewportHeight - panelHeight, 120)
      document.documentElement.style.setProperty('--hero-visible-height', `${heroHeight}px`)
    } else {
      document.documentElement.style.setProperty('--hero-visible-height', '100dvh')
    }
  }

  useEffect(() => {
    setMobileHeroHeight()
    const handleResize = () => setMobileHeroHeight()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const timer = setTimeout(setMobileHeroHeight, 50)
    return () => clearTimeout(timer)
  }, [activeProjectId])

  // Navigation handlers (non-blocking for fast interaction)
  const handlePrevImage = () => {
    if (!activeProject?.images?.length) return
    setActiveImageIndex(prev => (prev - 1 + activeProject.images.length) % activeProject.images.length)
  }

  const handleNextImage = () => {
    if (!activeProject?.images?.length) return
    setActiveImageIndex(prev => (prev + 1) % activeProject.images.length)
  }

  const selectProject = (id: number) => {
    if (activeProjectId !== id) {
      setActiveProjectId(id)
      setActiveImageIndex(0)
    }
  }

  const openInquiry = () => {
    setInquiryForm({
      name: '',
      email: '',
      phone: '',
      notes: `I'm interested in the ${activeProject.name} project.`
    })
    setSubmitSuccess(false)
    setIsInquiryOpen(true)
  }

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inquiryForm.name) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/public/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...inquiryForm,
          salesperson_id: salesperson ? salesperson.id : null
        })
      })
      if (!res.ok) throw new Error('Failed to submit inquiry')
      setSubmitSuccess(true)
      setInquiryForm({ name: '', email: '', phone: '', notes: '' })
      setTimeout(() => setIsInquiryOpen(false), 2000)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Draggable & Mouse Wheel carousel scrolling behavior
  const isDown = useRef(false)
  const isDragOccurring = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    const slider = carouselContainerRef.current
    if (!slider) return
    isDown.current = true
    isDragOccurring.current = false
    slider.classList.add('active')
    startX.current = e.pageX - slider.offsetLeft
    scrollLeft.current = slider.scrollLeft
  }

  const handleMouseLeaveOrUp = () => {
    const slider = carouselContainerRef.current
    if (!slider) return
    isDown.current = false
    slider.classList.remove('active')
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current) return
    e.preventDefault()
    const slider = carouselContainerRef.current
    if (!slider) return
    const x = e.pageX - slider.offsetLeft
    const walk = (x - startX.current) * 2
    if (Math.abs(x - startX.current) > 5) {
      isDragOccurring.current = true
    }
    slider.scrollLeft = scrollLeft.current - walk
  }

  const handleWheel = (e: React.WheelEvent) => {
    const slider = carouselContainerRef.current
    if (!slider) return
    slider.scrollLeft += e.deltaY
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const slider = carouselContainerRef.current
    if (!slider) return
    isDown.current = true
    isDragOccurring.current = false
    startX.current = e.touches[0].pageX - slider.offsetLeft
    scrollLeft.current = slider.scrollLeft
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDown.current) return
    const slider = carouselContainerRef.current
    if (!slider) return
    const x = e.touches[0].pageX - slider.offsetLeft
    const walk = (x - startX.current) * 2
    if (Math.abs(x - startX.current) > 5) {
      isDragOccurring.current = true
    }
    slider.scrollLeft = scrollLeft.current - walk
  }

  // Carousel arrow scrolling
  const scrollCarousel = (direction: 'left' | 'right') => {
    const slider = carouselContainerRef.current
    if (slider) {
      const scrollAmount = direction === 'left' ? -200 : 200
      slider.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  // Swipe gesture handlers on the main view
  const handleHeroTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.carousel-container')) return
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleHeroTouchEnd = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.carousel-container')) return
    const endX = e.changedTouches[0].clientX
    const endY = e.changedTouches[0].clientY
    
    const deltaX = endX - touchStartX.current
    const deltaY = endY - touchStartY.current

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) >= minSwipeDistance) {
      if (deltaX < 0) {
        handleNextImage()
      } else {
        handlePrevImage()
      }
    }
  }

  // Auto-scroll carousel to keep active item in view
  useEffect(() => {
    const activeItem = carouselContainerRef.current?.querySelector('.carousel-item.active') as HTMLElement
    const slider = carouselContainerRef.current
    if (activeItem && slider) {
      const sliderRect = slider.getBoundingClientRect()
      const itemRect = activeItem.getBoundingClientRect()
      if (itemRect.left < sliderRect.left || itemRect.right > sliderRect.right) {
        slider.scrollTo({
          left: activeItem.offsetLeft - slider.offsetWidth / 2 + activeItem.offsetWidth / 2,
          behavior: 'smooth'
        })
      }
    }
  }, [activeProjectId])

  return (
    <div 
      className="portfolio-body"
      onTouchStart={handleHeroTouchStart}
      onTouchEnd={handleHeroTouchEnd}
    >
      {/* Initial Fullscreen Preloader Overlay */}
      {isInitialLoading && (
        <div className={`initial-preloader ${loadProgress === 100 ? 'fade-out' : ''}`}>
          <div className="preloader-content">
            <img 
              src="/logo.svg" 
              alt="Invest Georgia UAE Logo" 
              className="preloader-logo" 
              width="200" 
              height="60"
            />
            <div className="preloader-spinner-wrapper">
              <div 
                className="preloader-bar" 
                style={{ width: `${loadProgress}%` }}
              />
            </div>
            <div className="preloader-status">
              <span className="preloader-text">Loading Portfolio Assets</span>
              <span className="preloader-percent">{loadProgress}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Hero Video or Image Display */}
      {isCurrentMediaVideo ? (
        <video 
          key={activeMediaUrl}
          src={activeMediaUrl}
          autoPlay 
          loop 
          muted 
          playsInline
          className="hero-background w-full h-full object-cover fixed inset-0"
          style={{ opacity: bgOpacity, pointerEvents: 'none' }}
        />
      ) : (
        <div 
          className="hero-background" 
          style={{ 
            backgroundImage: bgImage ? `url("${encodeURI(bgImage)}")` : 'none',
            opacity: bgOpacity
          }}
        />
      )}
      <div className="hero-overlay" />

      {/* Main Container */}
      <main className="main-container">
        
        {/* Navigation Arrows */}
        <button className="nav-arrow nav-left" onClick={handlePrevImage}>
          <ChevronLeft size={24} />
        </button>
        <button className="nav-arrow nav-right" onClick={handleNextImage}>
          <ChevronRight size={24} />
        </button>

        {/* Top Left Logo */}
        <header className="header">
          <a href="#" className="logo">
            <img 
              src="/logo.svg" 
              alt="Invest Georgia UAE Logo" 
              className="main-logo" 
              width="200" 
              height="60"
            />
          </a>
        </header>

        {/* Top Right: Active Project Name */}
        <div className="top-right-header">
          <div 
            className="hero-project-name"
            style={{ opacity: imageNameOpacity }}
          >
            {activeProject.name}
          </div>
        </div>

        {/* Bottom Layout Wrapper */}
        <div className={`bottom-wrapper ${isUIHidden ? 'ui-hidden' : ''}`} ref={bottomWrapperRef}>

          {/* Left Column: VR QR Code + Property Details Card */}
          <div className="left-details-column">
            
            {/* VR 3D QR Code Card (Positioned Above Details Card) */}
            {isVRProject && (
              <div className="vr-qr-card" title="Scan to View in VR 3D">
                <div className="vr-qr-code-wrapper">
                  {(activeProject.name.toLowerCase().includes('ortachal') || (activeProject as any)?.slug?.toLowerCase()?.includes('ortachal')) ? (
                    <img 
                      src="/media/qr/ortachala-vr-qr.png" 
                      alt="Ortachala View in VR 3D QR Code" 
                      className="w-full h-full object-contain rounded"
                    />
                  ) : (
                    <svg width="76" height="76" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                      <path fillRule="evenodd" clipRule="evenodd" d="M2 2H9V9H2V2ZM4 4H7V7H4V4ZM15 2H22V9H15V2ZM17 4H20V7H17V4ZM2 15H9V22H2V15ZM4 17H7V20H4V17ZM11 2H13V5H11V2ZM11 7H13V9H11V7ZM11 11H13V13H11V11ZM15 11H17V13H15V11ZM18 11H20V13H18V11ZM20 13H22V15H20V13ZM18 15H20V17H18V15ZM15 17H17V20H15V17ZM17 20H20V22H17V20ZM20 18H22V22H20V18ZM13 15H15V18H13V15ZM11 19H13V22H11V19ZM13 8H15V10H13V8ZM8 11H10V13H8V11ZM2 11H4V13H2V11ZM5 11H7V13H5V11ZM8 13H10V15H8V13Z" fill="#000000"/>
                    </svg>
                  )}
                </div>
                <div className="vr-qr-text-group">
                  <span className="vr-qr-title">View in VR 3D</span>
                  <span className="vr-qr-subtitle">Scan QR Code</span>
                </div>
              </div>
            )}

            {/* Property Details Card */}
            <section className="property-details-card" id="property-details">
              <h2 className="prop-title">{activeProject.name}</h2>

              <div className="details-grid">
                <div className="detail-item">
                  <CircleDollarSign className="detail-icon" />
                  <span className="detail-label">Starting Price:</span>
                  <span className="detail-value highlight">{activeProject.startingPrice}</span>
                </div>

                <div className="detail-item">
                  <Home className="detail-icon" />
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">{activeProject.type}</span>
                </div>

                <div className="detail-item">
                  <Calendar className="detail-icon" />
                  <span className="detail-label">Payment Plan:</span>
                  <span className="detail-value highlight">{activeProject.paymentPlan}</span>
                </div>

                <div className="detail-item">
                  <Maximize className="detail-icon" />
                  <span className="detail-label">Size:</span>
                  <span className="detail-value">{activeProject.size}</span>
                </div>

                <div className="detail-item">
                  <TrendingUp className="detail-icon" />
                  <span className="detail-label">ROI:</span>
                  <span className="detail-value">
                    {activeProject.roi?.includes('%') ? activeProject.roi : `${activeProject.roi}%`}
                  </span>
                </div>

                <div className="detail-item">
                  <Clock className="detail-icon" />
                  <span className="detail-label">Completion:</span>
                  <span className="detail-value">{activeProject.completion}</span>
                </div>
              </div>

              {/* Inquiry / WhatsApp CTA */}
              {(() => {
                const phone = salesperson?.phone || salesperson?.whatsappPhone || '+995599000000'
                const cleanPhone = phone.replace(/[^\d+]/g, '')
                const message = encodeURIComponent(
                  `Hello ${salesperson?.name || 'Invest Georgia Team'}, I am interested in ${activeProject.name} (${activeProject.type}, Starting Price: ${activeProject.startingPrice}).`
                )
                const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`

                const handleContact = async (e: React.MouseEvent) => {
                  e.preventDefault()
                  if (salesperson?.id) {
                    try {
                      const res = await fetch('/api/tracking/whatsapp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          salespersonId: salesperson.id,
                          projectName: activeProject.name,
                          source: 'iigprojects_card'
                        })
                      })
                      const data = await res.json()
                      window.open(data.url || whatsappUrl, '_blank')
                    } catch {
                      window.open(whatsappUrl, '_blank')
                    }
                  } else {
                    window.open(whatsappUrl, '_blank')
                  }
                }

                return (
                  <button
                    onClick={handleContact}
                    className="contact-btn"
                  >
                    Contact Now
                  </button>
                )
              })()}

            </section>
          </div>

          {/* Right Side: Projects Carousel */}
          <section className="projects-section">
            <div className="projects-header">
              <h3 className="section-title">Projects</h3>
              <div className="flex items-center gap-2">
                <button 
                  className="ui-toggle-btn"
                  onClick={() => setIsUIHidden(!isUIHidden)}
                  title={isUIHidden ? "Show Thumbnails & Details" : "Hide Thumbnails (Full Image View)"}
                >
                  {isUIHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                  <span>{isUIHidden ? "Show Thumbnails" : "Hide Thumbnails"}</span>
                </button>
                <div className="carousel-nav">
                  <button className="carousel-nav-btn" onClick={() => scrollCarousel('left')}>
                    <ChevronLeft size={16} />
                  </button>
                  <button className="carousel-nav-btn" onClick={() => scrollCarousel('right')}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
            
            <div 
              className="carousel-container"
              ref={carouselContainerRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeaveOrUp}
              onMouseUp={handleMouseLeaveOrUp}
              onMouseMove={handleMouseMove}
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleMouseLeaveOrUp}
              onTouchMove={handleTouchMove}
            >
              <div className="carousel-track">
                {projectsList.map(project => (
                  <div 
                    key={project.id}
                    className="carousel-item-wrapper"
                    onClick={() => {
                      if (!isDragOccurring.current) {
                        selectProject(project.id)
                      }
                    }}
                  >
                    <span className="carousel-label">{project.name}</span>
                    <div className={`carousel-item ${project.id === activeProjectId ? 'active' : ''}`}>
                      <img 
                        src={project.thumbnail ? (project.thumbnail.startsWith('/') ? project.thumbnail : `/${project.thumbnail}`) : (project.images[0] ? (project.images[0].startsWith('/') ? project.images[0] : `/${project.images[0]}`) : '')} 
                        alt={project.name}
                        width={200}
                        height={112}
                        loading={project.id === activeProjectId ? 'eager' : 'lazy'}
                        decoding="async"
                        style={{ contentVisibility: 'auto', objectFit: 'cover' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Floating Toggle Button (Appears when UI elements are hidden) */}
      {isUIHidden && (
        <div className="floating-toggle-container">
          <button 
            className="ui-toggle-btn"
            onClick={() => setIsUIHidden(false)}
            title="Show Thumbnails & Details"
          >
            <Eye size={16} />
            <span>Show Thumbnails</span>
          </button>
        </div>
      )}

      {/* Small Clear Cache & Reload Text (Bottom Right Corner) */}
      <div className="clear-cache-wrapper">
        <button 
          onClick={handleClearCacheAndReload}
          className="clear-cache-link"
          title="Purge local browser cache and force hard reload from server"
        >
          Clear Cache & Reload
        </button>
      </div>

      {/* Inquiry Modal */}
      {isInquiryOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsInquiryOpen(false) }}>
          <div className="modal-content">
            <div className="modal-header">
              <span className="modal-title">Register Your Interest</span>
              <button className="close-btn" onClick={() => setIsInquiryOpen(false)}>×</button>
            </div>

            {submitSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>✓</div>
                <p style={{ fontWeight: 600, fontSize: '16px' }}>Thank you!</p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginTop: '6px' }}>
                  We'll be in touch with you soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit}>
                {salesperson && (
                  <div className="salesperson-badge">
                    {salesperson.profileImage ? (
                      <img src={salesperson.profileImage} alt={salesperson.name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                        {salesperson.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span>Your dedicated contact: <strong>{salesperson.name}</strong></span>
                  </div>
                )}

                <div className="form-group" style={{ marginTop: salesperson ? '16px' : '0' }}>
                  <label className="form-label">Full Name *</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Your full name"
                    value={inquiryForm.name}
                    onChange={e => setInquiryForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    className="form-input"
                    type="tel"
                    placeholder="+971 50 000 0000"
                    value={inquiryForm.phone}
                    onChange={e => setInquiryForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="your@email.com"
                    value={inquiryForm.email}
                    onChange={e => setInquiryForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Your message..."
                    value={inquiryForm.notes}
                    onChange={e => setInquiryForm(prev => ({ ...prev, notes: e.target.value }))}
                    style={{ resize: 'none' }}
                  />
                </div>

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isSubmitting || !inquiryForm.name}
                >
                  {isSubmitting ? 'Submitting...' : 'Send Inquiry'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
