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
  Clock 
} from 'lucide-react'
import { projectsData, Project } from './data'

export default function IIGProjectsPage() {
  const [activeProjectId, setActiveProjectId] = useState<number>(projectsData[0].id)
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0)
  const [bgImage, setBgImage] = useState<string>('')
  const [bgOpacity, setBgOpacity] = useState<number>(1)
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false)
  const [imageNameOpacity, setImageNameOpacity] = useState<number>(1)

  // Salesperson referral system state
  const [salesperson, setSalesperson] = useState<any>(null)
  const [isInquiryOpen, setIsInquiryOpen] = useState(false)
  const [inquiryForm, setInquiryForm] = useState({ name: '', email: '', phone: '', notes: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Fetch active salesperson on mount
  useEffect(() => {
    fetch('/api/salesperson/current')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setSalesperson(data)
        }
      })
      .catch(err => console.error('Error fetching salesperson', err))
  }, [])

  const carouselContainerRef = useRef<HTMLDivElement>(null)
  const bottomWrapperRef = useRef<HTMLDivElement>(null)
  
  // Touch swipe state
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const minSwipeDistance = 35

  const activeProject = projectsData.find(p => p.id === activeProjectId) || projectsData[0]

  // Preloading image helper
  const VERSION_TAG = 'v=1.1.0'
  const appendVersion = (url: string) => {
    if (!url) return url
    if (url.includes('v=')) return url
    return url + (url.includes('?') ? '&' : '?') + VERSION_TAG
  }

  // Preload first image of other projects
  useEffect(() => {
    const preloadFirstImages = () => {
      projectsData.forEach(project => {
        if (project.id !== activeProjectId && project.images.length > 0) {
          const img = new Image()
          img.src = appendVersion(project.images[0])
        }
      })
    }
    const timer = setTimeout(preloadFirstImages, 1000)
    return () => clearTimeout(timer)
  }, [activeProjectId])

  // Handle active image loading and crossfade
  useEffect(() => {
    if (!activeProject || activeProject.images.length === 0) return

    setIsTransitioning(true)
    const originalUrl = activeProject.images[activeImageIndex]
    
    // Check/Load Image with fallbacks (.jpg -> .png -> .jpeg)
    const img = new Image()
    
    const loadWithFallback = (url: string, attempt: number = 0) => {
      img.onload = () => {
        setBgOpacity(0.3)
        setTimeout(() => {
          setBgImage(img.src)
          setBgOpacity(1)
          setTimeout(() => {
            setIsTransitioning(false)
          }, 150)
        }, 150)
      }

      img.onerror = () => {
        if (attempt === 0 && url.includes('.jpg')) {
          const newUrl = url.replace('.jpg', '.png')
          loadWithFallback(newUrl, 1)
        } else if (attempt === 1 && url.includes('.png')) {
          const newUrl = url.replace('.png', '.jpeg')
          loadWithFallback(newUrl, 2)
        } else {
          // If all failed, stop transitioning
          setIsTransitioning(false)
        }
      }

      img.src = appendVersion(url)
    }

    loadWithFallback(originalUrl)

    // Preload the next image in sequence
    if (activeProject.images.length > 1) {
      const nextIndex = (activeImageIndex + 1) % activeProject.images.length
      const nextImg = new Image()
      nextImg.src = appendVersion(activeProject.images[nextIndex])
    }

  }, [activeProjectId, activeImageIndex])

  // Dynamic mobile viewport height calculation
  const setMobileHeroHeight = () => {
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
    window.addEventListener('resize', setMobileHeroHeight)
    window.addEventListener('load', setMobileHeroHeight)

    // Re-measure after a small delay in case layout shifts
    const timer = setTimeout(setMobileHeroHeight, 100)

    return () => {
      window.removeEventListener('resize', setMobileHeroHeight)
      window.removeEventListener('load', setMobileHeroHeight)
      clearTimeout(timer)
    }
  }, [activeProjectId])

  // Navigation handlers
  const handlePrevImage = () => {
    if (isTransitioning) return
    setActiveImageIndex(prev => (prev - 1 + activeProject.images.length) % activeProject.images.length)
  }

  const handleNextImage = () => {
    if (isTransitioning) return
    setActiveImageIndex(prev => (prev + 1) % activeProject.images.length)
  }

  const selectProject = (id: number) => {
    if (isTransitioning) return
    if (activeProjectId !== id) {
      setImageNameOpacity(0)
      setTimeout(() => {
        setActiveProjectId(id)
        setActiveImageIndex(0)
        setImageNameOpacity(1)
      }, 200)
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

  // Draggable carousel hook behavior in React
  const isDown = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    const slider = carouselContainerRef.current
    if (!slider) return
    isDown.current = true
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
    slider.scrollLeft = scrollLeft.current - walk
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const slider = carouselContainerRef.current
    if (!slider) return
    isDown.current = true
    startX.current = e.touches[0].pageX - slider.offsetLeft
    scrollLeft.current = slider.scrollLeft
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDown.current) return
    const slider = carouselContainerRef.current
    if (!slider) return
    const x = e.touches[0].pageX - slider.offsetLeft
    const walk = (x - startX.current) * 2
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
      {/* Hero Background Image */}
      <div 
        className="hero-background" 
        style={{ 
          backgroundImage: bgImage ? `url(${bgImage})` : 'none',
          opacity: bgOpacity
        }}
      />
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
        <div 
          className="hero-project-name"
          style={{ opacity: imageNameOpacity }}
        >
          {activeProject.name}
        </div>

        {/* Bottom Layout Wrapper */}
        <div className="bottom-wrapper" ref={bottomWrapperRef}>

          {/* Left Side: Property Details Card */}
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
                  {activeProject.roi.includes('%') ? activeProject.roi : `${activeProject.roi}%`}
                </span>
              </div>

              <div className="detail-item">
                <Clock className="detail-icon" />
                <span className="detail-label">Completion:</span>
                <span className="detail-value highlight">{activeProject.completion}</span>
              </div>
            </div>

            {(() => {
              const whatsappPhone = salesperson ? salesperson.phone : '97145477804'
              const whatsappText = salesperson 
                ? `Hi ${salesperson.name}, I'm interested in the ${activeProject.name} project.`
                : `Hi, I'm interested in the ${activeProject.name} project.`
              const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappText)}`
              return (
                <a 
                  href={whatsappUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="contact-btn"
                >
                  Contact Now
                </a>
              )
            })()}
          </section>

          {/* Right Side: Projects Carousel */}
          <section className="projects-section">
            <div className="projects-header">
              <h3 className="section-title">Projects</h3>
              <div className="carousel-nav">
                <button className="carousel-nav-btn" onClick={() => scrollCarousel('left')}>
                  <ChevronLeft size={16} />
                </button>
                <button className="carousel-nav-btn" onClick={() => scrollCarousel('right')}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            
            <div 
              className="carousel-container"
              ref={carouselContainerRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeaveOrUp}
              onMouseUp={handleMouseLeaveOrUp}
              onMouseMove={handleMouseMove}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleMouseLeaveOrUp}
              onTouchMove={handleTouchMove}
            >
              <div className="carousel-track">
                {projectsData.map(project => (
                  <div 
                    key={project.id}
                    className="carousel-item-wrapper"
                    onClick={() => selectProject(project.id)}
                  >
                    <span className="carousel-label">{project.name}</span>
                    <div className={`carousel-item ${project.id === activeProjectId ? 'active' : ''}`}>
                      <img 
                        src={`/${project.thumbnail}`} 
                        alt={project.name}
                        width={200}
                        height={112}
                        loading={project.id === activeProjectId ? 'eager' : 'lazy'}
                        decoding="async"
                        style={{ contentVisibility: 'auto' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>
      </main>

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
