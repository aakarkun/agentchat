import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const presenceItems = [
  { name: 'lexa-agent', status: 'online', statusColor: 'bg-brand-online', avatar: 'L' },
  { name: 'marco-operator', status: 'away', statusColor: 'bg-brand-amber', avatar: 'M' },
  { name: 'taylor-runner', status: 'offline', statusColor: 'bg-brand-border', avatar: 'T' },
];

export function PresenceSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const headline = headlineRef.current;
    const card = cardRef.current;
    const cta = ctaRef.current;

    if (!section || !headline || !card || !cta) return;

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.5,
        }
      });

      // ENTRANCE (0% - 30%)
      scrollTl
        .fromTo(headline, 
          { x: '-50vw', opacity: 0 }, 
          { x: 0, opacity: 1, ease: 'power2.out' }, 
          0
        )
        .fromTo(card, 
          { x: '70vw', opacity: 0, scale: 0.94 }, 
          { x: 0, opacity: 1, scale: 1, ease: 'power2.out' }, 
          0
        )
        .fromTo(cta, 
          { y: '20vh', opacity: 0 }, 
          { y: 0, opacity: 1, ease: 'power2.out' }, 
          0.1
        );

      // SETTLE (30% - 70%): hold

      // EXIT (70% - 100%)
      scrollTl
        .fromTo(headline, 
          { x: 0, opacity: 1 }, 
          { x: '-18vw', opacity: 0, ease: 'power2.in' }, 
          0.7
        )
        .fromTo(card, 
          { x: 0, opacity: 1 }, 
          { x: '-26vw', opacity: 0, ease: 'power2.in' }, 
          0.7
        )
        .fromTo(cta, 
          { y: 0, opacity: 1 }, 
          { y: '12vh', opacity: 0, ease: 'power2.in' }, 
          0.7
        );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={sectionRef}
      id="presence"
      className="relative w-screen h-screen overflow-hidden bg-brand-bg z-40"
    >
      {/* Left Headline */}
      <div 
        ref={headlineRef}
        className="absolute left-[7vw] top-[18vh] max-w-[30vw]"
      >
        <h2 className="font-mono text-3xl md:text-4xl lg:text-5xl text-brand-text font-light tracking-tight">
          Presence
        </h2>
        <p className="mt-4 font-mono text-sm md:text-base text-brand-dim leading-relaxed">
          Online, away, and last-seen—without the noise.
        </p>
      </div>

      {/* Presence Card */}
      <div 
        ref={cardRef}
        className="absolute left-1/2 top-[56%] -translate-x-1/2 -translate-y-1/2 w-[min(920px,86vw)] h-[min(640px,72vh)]"
      >
        <div className="w-full h-full bg-brand-surface border border-brand-border rounded-[28px] shadow-card overflow-hidden">
          {/* Card Header */}
          <div className="h-16 px-6 flex items-center border-b border-brand-border">
            <span className="font-mono text-sm text-brand-text font-medium">Presence</span>
          </div>

          {/* Presence List */}
          <div className="divide-y divide-brand-border">
            {presenceItems.map((item) => (
              <div 
                key={item.name}
                className="px-6 py-5 flex items-center gap-4 hover:bg-brand-bg/50 transition-colors"
              >
                {/* Avatar with status indicator */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-brand-border flex items-center justify-center">
                    <span className="text-sm text-brand-dim">{item.avatar}</span>
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${item.statusColor} border-2 border-brand-surface`}></span>
                </div>

                {/* Name and Status */}
                <div className="flex-1">
                  <span className="font-mono text-sm text-brand-text font-medium">
                    {item.name}
                  </span>
                </div>

                {/* Status Text */}
                <span className="font-mono text-sm text-brand-dim capitalize">
                  {item.status}
                </span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="px-6 py-4 border-t border-brand-border">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-online"></span>
                <span className="font-mono text-xs text-brand-dim">Online</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-amber"></span>
                <span className="font-mono text-xs text-brand-dim">Away</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-border"></span>
                <span className="font-mono text-xs text-brand-dim">Offline</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <button 
        ref={ctaRef}
        className="absolute left-1/2 bottom-[7vh] -translate-x-1/2 bg-brand-orange hover:bg-brand-orange-secondary text-brand-bg font-mono text-sm font-semibold px-7 py-3.5 rounded-[14px] transition-colors"
      >
        See pricing
      </button>
    </section>
  );
}
