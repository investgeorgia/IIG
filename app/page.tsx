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
        <div className="flex flex-col items-center text-center my-auto max-w-4xl mx-auto px-4">
          <h1 className={`${cormorant.className} text-4xl md:text-6xl lg:text-7xl font-normal leading-tight tracking-wide text-white drop-shadow-md`}>
            From Dubai to Georgia <br />
            <span className="italic">Your Investment Journey Begins Here</span>
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
          <div className="flex flex-col items-start md:items-end text-left md:text-right">
            <span className="text-[11px] uppercase tracking-widest font-semibold text-white/90 mb-3 block">
              Book Free Consultation
            </span>
            <a
              href="https://investingeorgia.ae/en/contact-us/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white/80 hover:bg-white text-neutral-900 backdrop-blur-md px-12 py-3 rounded-full text-sm font-semibold transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
            >
              Contact
            </a>
          </div>

        </div>

      </div>
    </div>
  )
}
