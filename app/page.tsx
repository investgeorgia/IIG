import { Cormorant_Garamond } from 'next/font/google'
import Link from 'next/link'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

export default function HomePage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover opacity-85"
      >
        <source src="/video_background.mp4" type="video/mp4" />
      </video>

      {/* Dark Overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />

      {/* Main Content Layout */}
      <div className="relative z-10 flex min-h-screen flex-col justify-between px-6 py-12 md:px-16 md:py-16">
        
        {/* Top Spacer or Header */}
        <div className="w-full flex justify-between items-center">
          {/* Logo Placeholder or Link */}
          <Link href="/login" className="text-white/60 hover:text-white text-xs font-semibold uppercase tracking-widest transition-colors">
            Staff Portal
          </Link>
        </div>

        {/* Center Section: Hero Title */}
        <div className="flex flex-col items-center text-center mt-[12vh] mb-auto max-w-5xl mx-auto px-4">
          <h1 className={`${cormorant.className} text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-wide text-white drop-shadow-md`}>
            <span className="md:whitespace-nowrap">From Dubai to Georgia</span> <br />
            <span className="italic md:whitespace-nowrap">Your Investment Journey Begins Here</span>
          </h1>
          <p className="mt-6 text-sm md:text-base max-w-xl text-white/95 leading-relaxed font-light drop-shadow-sm">
            Connecting UAE investors with premium real estate opportunities across Tbilisi, Batumi, and Georgia's most promising destinations.
          </p>
          <div className="mt-8">
            <Link
              href="/iigprojects"
              className="inline-block bg-white/80 hover:bg-white text-neutral-900 backdrop-blur-md px-10 py-3 rounded-full text-sm font-semibold transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
            >
              View Projects
            </Link>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="w-full flex flex-col md:flex-row justify-between items-end gap-8 mt-auto">
          
          {/* Bottom Left: Info & Stats */}
          <div className="text-left max-w-lg">
            <h3 className={`${cormorant.className} text-2xl md:text-4xl font-normal tracking-wide text-white`}>
              Your Gateway to <br />
              <span className="italic">Georgian Real Estate</span>
            </h3>
            <p className="mt-2 text-xs md:text-sm text-white/90 font-light max-w-sm">
              Premium property investments in one of Europe's fastest-growing markets.
            </p>
            
            {/* Stats */}
            <div className="mt-6 flex items-center gap-10">
              <div>
                <div className="text-lg md:text-xl font-bold text-white">200+</div>
                <div className="text-[10px] uppercase tracking-wider text-white/80 mt-0.5">Properties</div>
              </div>
              <div>
                <div className="text-lg md:text-xl font-bold text-white">4.9</div>
                <div className="text-[10px] uppercase tracking-wider text-white/80 mt-0.5">Rating</div>
              </div>
              <div>
                <div className="text-lg md:text-xl font-bold text-white">5+</div>
                <div className="text-[10px] uppercase tracking-wider text-white/80 mt-0.5">Developer</div>
              </div>
            </div>
          </div>

          {/* Bottom Right: Consultation & Contact Button */}
          <div className="flex flex-col items-start md:items-end text-left md:text-right max-w-xs md:max-w-sm">
            <p className="text-xs md:text-sm text-white/80 font-light leading-relaxed mb-4">
              Discover Georgia's Real Estate<br className="hidden md:inline" />
              Opportunities. Get expert guidance<br className="hidden md:inline" />
              tailored to your investment goals.<br className="hidden md:inline" />
              Take the first step towards owning
            </p>
            <a
              href="https://investingeorgia.ae/en/contact-us/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-white/80 hover:bg-white text-neutral-900 backdrop-blur-md pl-6 pr-2 py-2 rounded-full text-xs font-bold transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
            >
              <span>Book a Session</span>
              <span className="w-7 h-7 bg-black rounded-full flex items-center justify-center text-white">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path>
                </svg>
              </span>
            </a>
          </div>

        </div>

      </div>
    </div>
  )
}
