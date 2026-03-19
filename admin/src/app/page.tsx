import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TrackR — The Premium Home for Your Coaster Life',
  description:
    'Track rides, rate coasters, collect trading cards, and connect with the coaster community. The app built by enthusiasts, for enthusiasts.',
};

/* ── Card data for the showcase ──────────────────────────────── */
const HERO_CARDS = [
  { src: '/cards/steel-vengeance.webp', name: 'Steel Vengeance', park: 'Cedar Point' },
  { src: '/cards/fury-325.webp', name: 'Fury 325', park: 'Carowinds' },
  { src: '/cards/el-toro.webp', name: 'El Toro', park: 'Six Flags Great Adventure' },
  { src: '/cards/maverick.webp', name: 'Maverick', park: 'Cedar Point' },
  { src: '/cards/tatsu.webp', name: 'Tatsu', park: 'Six Flags Magic Mountain' },
];

const GRID_CARDS = [
  { src: '/cards/millennium-force.webp', name: 'Millennium Force' },
  { src: '/cards/kingda-ka.webp', name: 'Kingda Ka' },
  { src: '/cards/x2.webp', name: 'X2' },
  { src: '/cards/twisted-colossus.webp', name: 'Twisted Colossus' },
  { src: '/cards/orion.webp', name: 'Orion' },
  { src: '/cards/valravn.webp', name: 'Valravn' },
  { src: '/cards/banshee.webp', name: 'Banshee' },
  { src: '/cards/steel-vengeance.webp', name: 'Steel Vengeance' },
];

/* ── Feature data ────────────────────────────────────────────── */
const FEATURES = [
  {
    title: 'Track Every Ride',
    description: 'Log your rides with timestamps, parks, and personal notes. Your complete coaster history, always with you.',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  },
  {
    title: 'Rate Coasters',
    description: 'Multi-criteria ratings that go beyond stars. Evaluate airtime, theming, intensity, and more.',
    icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  },
  {
    title: 'Collect Trading Cards',
    description: 'Stunning AI-illustrated coaster art cards. Collect, trade, and play a Top Trumps-style game in line.',
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  },
  {
    title: 'Apple Wallet Passes',
    description: 'Park passes in your Apple Wallet. Show your stats at the gate with geo-fenced arrival notifications.',
    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  },
  {
    title: 'Community',
    description: 'Connect with friends, compare stats, see what the community is riding, and climb the leaderboards.',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  },
  {
    title: 'Live Wait Times',
    description: 'Real-time queue data for parks worldwide. Plan your day, avoid the crowds, maximize rides.',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
];

/* ── Icon component ──────────────────────────────────────────── */
function FeatureIcon({ path }: { path: string }) {
  return (
    <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={path} />
    </svg>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-page overflow-x-hidden">

      {/* ── Smart App Banner (mobile only) ─────────────────── */}
      <div className="sm:hidden fixed top-0 left-0 right-0 z-[60] bg-white/95 backdrop-blur-lg border-b border-black/[0.06] px-4 py-2.5 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-accent to-[#B85557] rounded-[10px] flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(207,103,105,0.3)]">
          <span className="text-white text-sm font-bold tracking-tight">TR</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-text-primary leading-tight">TrackR</p>
          <p className="text-[11px] text-text-meta leading-tight">Track, rate, collect. Free.</p>
        </div>
        <a
          href="#download"
          className="px-4 py-1.5 bg-accent text-white text-[13px] font-semibold rounded-full
            active:scale-[0.96] transition-transform"
        >
          GET
        </a>
      </div>

      {/* ── Navigation (desktop) ───────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-page/80 backdrop-blur-xl border-b border-black/[0.04]
        hidden sm:block">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-accent to-[#B85557] rounded-lg flex items-center justify-center shadow-[0_2px_8px_rgba(207,103,105,0.25)]">
              <span className="text-white text-[11px] font-bold tracking-tight">TR</span>
            </div>
            <span className="text-lg font-bold text-text-primary tracking-[-0.03em]">TrackR</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-200">
              Features
            </a>
            <a href="#cards" className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-200">
              Cards
            </a>
            <a
              href="#download"
              className="px-5 py-2 bg-accent text-white text-sm font-medium rounded-lg
                hover:bg-accent-hover active:scale-[0.97] transition-all duration-200
                shadow-[0_2px_12px_rgba(207,103,105,0.25)]"
            >
              Download
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="pt-[72px] sm:pt-32 pb-4 sm:pb-20 px-5 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-[10px] sm:text-xs font-semibold text-accent uppercase tracking-[0.2em] mb-3 sm:mb-4">
              Built by enthusiasts, for enthusiasts
            </p>
            <h1 className="text-[2.25rem] leading-[1.08] sm:text-5xl lg:text-6xl font-bold text-text-primary tracking-[-0.03em] sm:leading-[1.08] mb-4 sm:mb-6">
              The premium home for{' '}
              <span className="text-accent">your coaster life</span>
            </h1>
            <p className="text-[15px] sm:text-lg text-text-secondary leading-relaxed mb-7 sm:mb-10 max-w-xl mx-auto">
              Track every ride, rate every coaster, collect stunning trading cards, and
              connect with the community. Designed with the care your hobby deserves.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <a
                href="#download"
                className="w-full sm:w-auto px-8 py-3.5 bg-accent text-white text-base font-medium rounded-xl
                  hover:bg-accent-hover active:scale-[0.97]
                  shadow-[0_4px_20px_rgba(207,103,105,0.3)]
                  transition-all duration-200 text-center"
              >
                Download for iOS
              </a>
              <a
                href="#features"
                className="w-full sm:w-auto px-8 py-3.5 bg-card text-text-primary text-base font-medium rounded-xl
                  shadow-card hover:shadow-card-hover
                  active:scale-[0.97] transition-all duration-200 text-center"
              >
                See Features
              </a>
            </div>
          </div>

          {/* ── Hero Card Fan ──────────────────────────────── */}
          <div className="mt-10 sm:mt-16 max-w-4xl mx-auto">
            <div className="relative h-[280px] sm:h-[420px] flex items-center justify-center">
              {HERO_CARDS.map((card, i) => {
                const total = HERO_CARDS.length;
                const mid = Math.floor(total / 2);
                const offset = i - mid;
                const rotate = offset * 8;
                const zIndex = total - Math.abs(offset);

                return (
                  <div
                    key={card.name}
                    className="card-fan-item absolute w-[120px] sm:w-[180px] aspect-[2/3] rounded-xl sm:rounded-2xl overflow-hidden
                      shadow-[0_8px_40px_rgba(50,50,50,0.2)] border border-white/20"
                    style={{
                      '--fan-offset': offset,
                      '--fan-rotate': `${rotate}deg`,
                      '--fan-ty': `${Math.abs(offset) * 12}px`,
                      '--fan-scale': i === mid ? '1' : '0.92',
                      zIndex,
                    } as React.CSSProperties}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={card.src}
                      alt={`${card.name} trading card art`}
                      className="w-full h-full object-cover"
                      loading={i === mid ? 'eager' : 'lazy'}
                    />
                    {/* Card name overlay */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2.5 sm:p-4">
                      <p className="text-white text-[9px] sm:text-xs font-semibold leading-tight">{card.name}</p>
                      <p className="text-white/60 text-[7px] sm:text-[10px] leading-tight mt-0.5">{card.park}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section id="features" className="py-12 sm:py-24 px-5 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-16">
            <p className="text-[10px] sm:text-xs font-semibold text-accent uppercase tracking-[0.2em] mb-2 sm:mb-3">
              Features
            </p>
            <h2 className="text-2xl sm:text-4xl font-bold text-text-primary tracking-[-0.02em]">
              Everything a thoosie needs
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-card rounded-xl sm:rounded-2xl shadow-card p-5 sm:p-8 hover:shadow-card-hover transition-shadow duration-300
                  group"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/[0.08] rounded-xl flex items-center justify-center mb-3 sm:mb-5
                  group-hover:bg-accent/[0.12] transition-colors duration-300">
                  <FeatureIcon path={feature.icon} />
                </div>
                <h3 className="text-[15px] sm:text-lg font-semibold text-text-primary mb-1 sm:mb-2">{feature.title}</h3>
                <p className="text-[13px] sm:text-sm text-text-secondary leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trading Card Game Teaser ───────────────────────── */}
      <section id="cards" className="py-12 sm:py-24 px-5 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-card rounded-2xl sm:rounded-3xl shadow-section overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Text */}
              <div className="p-6 sm:p-12 lg:p-16 flex flex-col justify-center order-2 lg:order-1">
                <p className="text-[10px] sm:text-xs font-semibold text-accent uppercase tracking-[0.2em] mb-2 sm:mb-3">
                  Coming Soon
                </p>
                <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold text-text-primary tracking-[-0.02em] mb-3 sm:mb-5 leading-tight">
                  The first coaster{' '}
                  <span className="text-accent">trading card game</span>
                </h2>
                <p className="text-[13px] sm:text-base text-text-secondary leading-relaxed mb-4 sm:mb-6">
                  Collect beautifully illustrated coaster cards with real stats.
                  Play a Top Trumps-style game with friends while waiting in line,
                  complete with app-powered voice narration. Physical cards ship
                  to your door, and you need the app to play.
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {['200+ unique coasters', 'Holographic rares', 'Park deck packs', 'Voice narration'].map((tag) => (
                    <span key={tag} className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-page rounded-lg text-[10px] sm:text-xs font-medium text-text-secondary">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card art grid */}
              <div className="relative min-h-[240px] sm:min-h-[400px] lg:min-h-0 order-1 lg:order-2 overflow-hidden bg-gradient-to-br from-page via-[#EDEDED] to-page">
                <div className="absolute inset-0 grid grid-cols-4 gap-1.5 sm:gap-2 p-3 sm:p-6 rotate-[-6deg] scale-[1.15] origin-center">
                  {GRID_CARDS.map((card, i) => (
                    <div
                      key={`${card.name}-${i}`}
                      className="aspect-[2/3] rounded-lg sm:rounded-xl overflow-hidden shadow-[0_4px_16px_rgba(50,50,50,0.12)]"
                      style={{ transform: `translateY(${i % 2 === 0 ? 0 : 16}px)` }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={card.src}
                        alt={card.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
                {/* Fade overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent lg:bg-gradient-to-l lg:from-card lg:via-transparent lg:to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ────────────────────────────────────── */}
      <section className="py-10 sm:py-20 px-5 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center">
            {[
              { value: '200+', label: 'Coaster cards' },
              { value: '40+', label: 'Park decks' },
              { value: '5', label: 'Wallet pass styles' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl sm:text-4xl font-bold text-text-primary tracking-tight">{stat.value}</p>
                <p className="text-[10px] sm:text-sm text-text-meta mt-0.5 sm:mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Download CTA ───────────────────────────────────── */}
      <section id="download" className="py-12 sm:py-24 px-5 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-card rounded-2xl sm:rounded-3xl shadow-section p-6 sm:p-12 lg:p-16 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary tracking-[-0.02em] mb-3 sm:mb-4">
              Ready to track?
            </h2>
            <p className="text-[13px] sm:text-base text-text-secondary max-w-lg mx-auto mb-5 sm:mb-8 leading-relaxed">
              Join the community of coaster enthusiasts who demand more from their ride tracker.
              Free to download, with optional Pro for supporters.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              {/* App Store badge */}
              <a
                href="#"
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-text-primary text-white text-base font-medium rounded-xl
                  hover:opacity-90 active:scale-[0.97] transition-all duration-200
                  inline-flex items-center justify-center gap-3"
              >
                <svg className="w-6 sm:w-7 h-6 sm:h-7 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <div className="text-left">
                  <p className="text-[10px] leading-none opacity-80">Download on the</p>
                  <p className="text-base sm:text-lg font-semibold leading-tight">App Store</p>
                </div>
              </a>
              {/* Kickstarter teaser */}
              <a
                href="#"
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-page text-text-primary text-base font-medium rounded-xl
                  shadow-card hover:shadow-card-hover active:scale-[0.97]
                  transition-all duration-200 inline-flex items-center justify-center gap-3"
              >
                <svg className="w-5 sm:w-6 h-5 sm:h-6 text-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <div className="text-left">
                  <p className="text-[10px] leading-none text-text-meta">Coming soon on</p>
                  <p className="text-base sm:text-lg font-semibold leading-tight">Kickstarter</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="py-8 sm:py-12 px-5 sm:px-6 border-t border-black/[0.04]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-gradient-to-br from-accent to-[#B85557] rounded-md flex items-center justify-center">
              <span className="text-white text-[8px] font-bold tracking-tight">TR</span>
            </div>
            <span className="text-sm font-semibold text-text-primary tracking-[-0.02em]">TrackR</span>
          </div>
          <p className="text-xs text-text-meta">
            &copy; {new Date().getFullYear()} Lanting Digital LLC. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-xs text-text-meta hover:text-text-secondary transition-colors">Privacy</a>
            <a href="#" className="text-xs text-text-meta hover:text-text-secondary transition-colors">Terms</a>
            <a href="#" className="text-xs text-text-meta hover:text-text-secondary transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
