import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TrackR — The Premium Home for Your Coaster Life',
  description:
    'Track rides, rate coasters, collect trading cards, and connect with the coaster community. The app built by enthusiasts, for enthusiasts.',
};

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-2xl shadow-card p-8 hover:shadow-card-hover transition-shadow duration-300">
      <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-page">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-page/80 backdrop-blur-xl border-b border-black/[0.04]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">T</span>
            </div>
            <span className="text-lg font-bold text-text-primary tracking-tight">TrackR</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="#features"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-200"
            >
              Features
            </a>
            <a
              href="#cards"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-200"
            >
              Cards
            </a>
            <a
              href="#download"
              className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg
                hover:bg-accent-hover active:scale-[0.97] transition-all duration-200"
            >
              Download
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-medium text-accent uppercase tracking-[0.2em] mb-4">
              Built by enthusiasts, for enthusiasts
            </p>
            <h1 className="text-5xl sm:text-6xl font-bold text-text-primary tracking-tight leading-[1.08] mb-6">
              The premium home for{' '}
              <span className="text-accent">your coaster life</span>
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed mb-10 max-w-xl mx-auto">
              Track every ride, rate every coaster, collect stunning trading cards, and
              connect with the community. Designed with the care your hobby deserves.
            </p>
            <div className="flex items-center justify-center gap-4">
              <a
                href="#download"
                className="px-8 py-3.5 bg-accent text-white text-base font-medium rounded-xl
                  hover:bg-accent-hover active:scale-[0.97]
                  shadow-[0_4px_20px_rgba(207,103,105,0.3)]
                  transition-all duration-200"
              >
                Download for iOS
              </a>
              <a
                href="#features"
                className="px-8 py-3.5 bg-card text-text-primary text-base font-medium rounded-xl
                  shadow-card hover:shadow-card-hover
                  active:scale-[0.97] transition-all duration-200"
              >
                See Features
              </a>
            </div>
          </div>

          {/* App mockup placeholder */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="bg-card rounded-3xl shadow-section p-2 overflow-hidden">
              <div
                className="w-full aspect-[16/9] rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #F7F7F7 0%, #EDEDED 50%, #F7F7F7 100%)',
                }}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg font-bold">T</span>
                    </div>
                  </div>
                  <p className="text-sm text-text-meta">App screenshots coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-medium text-accent uppercase tracking-[0.2em] mb-3">
              Features
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
              Everything a thoosie needs
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              title="Track Every Ride"
              description="Log your rides with timestamps, parks, and personal notes. Your complete coaster history, always with you."
              icon={
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              }
            />
            <FeatureCard
              title="Rate Coasters"
              description="A multi-criteria rating system that goes beyond a simple star rating. Evaluate airtime, theming, intensity, and more."
              icon={
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              }
            />
            <FeatureCard
              title="Collect Trading Cards"
              description="Stunning coaster art cards you can collect, trade, and use to play a Top Trumps-style card game with friends in line."
              icon={
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              }
            />
            <FeatureCard
              title="Apple Wallet Passes"
              description="Beautiful park passes right in your Apple Wallet. Show your stats at the gate. Geo-fenced notifications when you arrive."
              icon={
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              }
            />
            <FeatureCard
              title="Community"
              description="Connect with friends, compare stats, see what the community is riding, and climb the rankings."
              icon={
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            />
            <FeatureCard
              title="Live Wait Times"
              description="Real-time queue data for parks worldwide. Plan your day, avoid the crowds, maximize your rides."
              icon={
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* Trading Card Game Teaser */}
      <section id="cards" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-card rounded-3xl shadow-section overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Left: Text */}
              <div className="p-12 lg:p-16 flex flex-col justify-center">
                <p className="text-xs font-medium text-accent uppercase tracking-[0.2em] mb-3">
                  Coming Soon
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight mb-5 leading-tight">
                  The first coaster{' '}
                  <span className="text-accent">trading card game</span>
                </h2>
                <p className="text-base text-text-secondary leading-relaxed mb-6">
                  Collect beautifully illustrated coaster cards with real stats.
                  Play a Top Trumps-style game with friends while waiting in line,
                  complete with app-powered voice narration. Physical cards ship
                  to your door, and you need the app to play.
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="px-3 py-1.5 bg-page rounded-lg text-xs font-medium text-text-secondary">
                    200+ unique coasters
                  </span>
                  <span className="px-3 py-1.5 bg-page rounded-lg text-xs font-medium text-text-secondary">
                    Holographic rares
                  </span>
                  <span className="px-3 py-1.5 bg-page rounded-lg text-xs font-medium text-text-secondary">
                    Park deck packs
                  </span>
                  <span className="px-3 py-1.5 bg-page rounded-lg text-xs font-medium text-text-secondary">
                    Voice narration
                  </span>
                </div>
              </div>

              {/* Right: Card mockup placeholder */}
              <div
                className="aspect-square lg:aspect-auto flex items-center justify-center p-12"
                style={{
                  background: 'linear-gradient(135deg, #F7F7F7 0%, #EDEDED 50%, #F7F7F7 100%)',
                }}
              >
                <div className="text-center">
                  <div className="w-48 h-64 bg-card rounded-xl shadow-card mx-auto mb-4 flex items-center justify-center border border-black/[0.04]">
                    <div className="text-center">
                      <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <div className="w-5 h-5 bg-accent rounded flex items-center justify-center">
                          <span className="text-white text-[10px] font-bold">T</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-text-meta">Card preview</p>
                    </div>
                  </div>
                  <p className="text-xs text-text-meta">Card art previews coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof / stats */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-text-primary">200+</p>
              <p className="text-sm text-text-meta mt-1">Coaster cards</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-text-primary">40+</p>
              <p className="text-sm text-text-meta mt-1">Park decks</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-text-primary">5</p>
              <p className="text-sm text-text-meta mt-1">Apple Wallet pass styles</p>
            </div>
          </div>
        </div>
      </section>

      {/* Download CTA */}
      <section id="download" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-card rounded-3xl shadow-section p-12 lg:p-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight mb-4">
              Ready to track?
            </h2>
            <p className="text-base text-text-secondary max-w-lg mx-auto mb-8 leading-relaxed">
              Join the community of coaster enthusiasts who demand more from their ride tracker.
              Free to download, with optional Pro for supporters.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {/* App Store badge placeholder */}
              <a
                href="#"
                className="px-8 py-4 bg-text-primary text-white text-base font-medium rounded-xl
                  hover:opacity-90 active:scale-[0.97] transition-all duration-200
                  inline-flex items-center gap-3"
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <div className="text-left">
                  <p className="text-[10px] leading-none opacity-80">Download on the</p>
                  <p className="text-lg font-semibold leading-tight">App Store</p>
                </div>
              </a>
              {/* Kickstarter teaser */}
              <a
                href="#"
                className="px-8 py-4 bg-page text-text-primary text-base font-medium rounded-xl
                  shadow-card hover:shadow-card-hover active:scale-[0.97]
                  transition-all duration-200 inline-flex items-center gap-3"
              >
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <div className="text-left">
                  <p className="text-[10px] leading-none text-text-meta">Coming soon on</p>
                  <p className="text-lg font-semibold leading-tight">Kickstarter</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-black/[0.04]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-accent rounded-md flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">T</span>
            </div>
            <span className="text-sm font-semibold text-text-primary tracking-tight">TrackR</span>
          </div>
          <p className="text-xs text-text-meta">
            &copy; {new Date().getFullYear()} Lanting Digital LLC. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-xs text-text-meta hover:text-text-secondary transition-colors">
              Privacy
            </a>
            <a href="#" className="text-xs text-text-meta hover:text-text-secondary transition-colors">
              Terms
            </a>
            <a href="#" className="text-xs text-text-meta hover:text-text-secondary transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
