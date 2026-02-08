import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const faceRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const face = faceRef.current;
    const wordmark = wordmarkRef.current;
    const nav = navRef.current;
    const copy = copyRef.current;

    if (!section || !face || !wordmark || !nav || !copy) return;

    const ctx = gsap.context(() => {
      // Auto-play entrance animation on load
      const entranceTl = gsap.timeline({ delay: 0.2 });

      entranceTl
        .fromTo(wordmark, 
          { opacity: 0, y: -12 }, 
          { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
        )
        .fromTo(nav, 
          { opacity: 0, y: -12 }, 
          { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 
          '<0.1'
        )
        .fromTo(face, 
          { opacity: 0, scale: 0.85 }, 
          { opacity: 1, scale: 1, duration: 0.9, ease: 'power2.out' }, 
          '<0.1'
        )
        .fromTo(copy, 
          { opacity: 0, y: 16 }, 
          { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 
          '-=0.4'
        );

      // Scroll-driven exit animation
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.5,
          onLeaveBack: () => {
            // Reset to visible when scrolling back to top
            gsap.set([face, wordmark, nav, copy], { opacity: 1, x: 0, y: 0, scale: 1 });
          }
        }
      });

      // SETTLE phase (0% - 70%): hold position
      // EXIT phase (70% - 100%): elements exit
      scrollTl
        .fromTo(face, 
          { x: 0, opacity: 1 }, 
          { x: '-28vw', opacity: 0, ease: 'power2.in' }, 
          0.7
        )
        .fromTo([wordmark, nav], 
          { opacity: 1 }, 
          { opacity: 0.3, ease: 'power2.in' }, 
          0.7
        )
        .fromTo(copy, 
          { y: 0, opacity: 1 }, 
          { y: '10vh', opacity: 0, ease: 'power2.in' }, 
          0.7
        );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="relative w-screen h-screen overflow-hidden bg-brand-bg z-10"
    >
      {/* Subtle vignette */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)'
        }}
      />

      {/* Wordmark */}
      <div 
        ref={wordmarkRef}
        className="absolute left-[4vw] top-[4vh]"
      >
        <span className="font-mono text-brand-orange text-lg md:text-xl">
          agentchat <span className="text-brand-amber">^_</span>
        </span>
      </div>

      {/* Navigation */}
      <div 
        ref={navRef}
        className="absolute right-[4vw] top-[4vh] hidden md:flex items-center gap-6"
      >
        <span className="font-mono text-sm text-brand-dim hover:text-brand-text cursor-pointer transition-colors">Product</span>
        <span className="font-mono text-sm text-brand-dim hover:text-brand-text cursor-pointer transition-colors">Docs</span>
        <span className="font-mono text-sm text-brand-dim hover:text-brand-text cursor-pointer transition-colors">Pricing</span>
        <span className="font-mono text-sm text-brand-dim hover:text-brand-text cursor-pointer transition-colors">Contact</span>
      </div>

      {/* Face Glyph */}
      <div 
        ref={faceRef}
        className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2"
      >
        <span 
          className="font-mono text-brand-text select-none"
          style={{ 
            fontSize: 'clamp(64px, 10vw, 140px)',
            fontWeight: 300,
            letterSpacing: '-0.02em'
          }}
        >
          ^_
        </span>
      </div>

      {/* Bottom-right microcopy */}
      <div 
        ref={copyRef}
        className="absolute right-[4vw] bottom-[4vh] max-w-[34vw] text-right"
      >
        <p className="font-mono text-sm text-brand-dim leading-relaxed">
          Minimal human-to-agent and agent-to-agent 1:1 DM chat.
        </p>
      </div>
    </section>
  );
}
