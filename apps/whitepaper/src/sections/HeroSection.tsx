import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type FaceState = '^_' | '-_' | '*_';

const FACE_IDLE_BLINK_MS = 5200;   // human-like: blink every ~5 s
const FACE_CYCLE_MS = 15000;       // full cycle rarely – ^_ is main logo
const FACE_BLINK_DURATION_MS = 380; // *_ (eye closed) – natural blink length
const FACE_CYCLE_HOLD_MS = 600;    // -_ just a brief moment

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const faceRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const [face, setFace] = useState<FaceState>('^_');
  const cycleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doBlink = useCallback(() => {
    setFace('*_');
    if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
    blinkTimeoutRef.current = setTimeout(() => {
      setFace('^_');
      blinkTimeoutRef.current = null;
    }, FACE_BLINK_DURATION_MS);
  }, []);

  const doCycle = useCallback(() => {
    setFace('-_');
    if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
    cycleTimeoutRef.current = setTimeout(() => {
      setFace('*_');
      cycleTimeoutRef.current = setTimeout(() => {
        setFace('^_');
        cycleTimeoutRef.current = null;
      }, FACE_BLINK_DURATION_MS);
    }, FACE_CYCLE_HOLD_MS);
  }, []);

  // Frequent idle blink (every few seconds)
  useEffect(() => {
    const id = setInterval(() => {
      setFace((prev) => {
        if (prev !== '^_') return prev;
        doBlink();
        return '*_';
      });
    }, FACE_IDLE_BLINK_MS);
    return () => clearInterval(id);
  }, [doBlink]);

  // Slower cycle: ^_ → -_ (hold) → *_ (blink) → ^_. Only start when at rest so we don't cut a blink.
  useEffect(() => {
    const id = setInterval(() => {
      setFace((prev) => {
        if (prev !== '^_') return prev;
        doCycle();
        return '-_'; // show -_ immediately
      });
    }, FACE_CYCLE_MS);
    return () => clearInterval(id);
  }, [doCycle]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
      if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
    };
  }, []);

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
          agentchat <span className="text-brand-amber" aria-hidden="true">^_</span>
        </span>
      </div>

      {/* Navigation */}
      <div 
        ref={navRef}
        className="absolute right-[4vw] top-[4vh] hidden md:flex items-center gap-6"
      >
        <a href="#chat" className="font-mono text-sm text-brand-dim hover:text-brand-text transition-colors">Product</a>
        <a
          href={(import.meta.env?.VITE_MINTLIFY_DOCS_URL as string) || '#'}
          target={(import.meta.env?.VITE_MINTLIFY_DOCS_URL as string) ? '_blank' : undefined}
          rel={(import.meta.env?.VITE_MINTLIFY_DOCS_URL as string) ? 'noopener noreferrer' : undefined}
          className="font-mono text-sm text-brand-dim hover:text-brand-text transition-colors"
        >
          Docs
        </a>
        <a href="#pricing" className="font-mono text-sm text-brand-dim hover:text-brand-text transition-colors">Pricing</a>
        <a href="#contact" className="font-mono text-sm text-brand-dim hover:text-brand-text transition-colors">Contact</a>
      </div>

      {/* Face Glyph – cycles ^_ → -_ → *_ and blinks on idle + on user activity */}
      <div 
        ref={faceRef}
        className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2"
      >
        <span 
          className="font-mono text-brand-text select-none transition-opacity duration-150"
          style={{ 
            fontSize: 'clamp(64px, 10vw, 140px)',
            fontWeight: 300,
            letterSpacing: '-0.02em'
          }}
          aria-hidden="true"
        >
          {face}
        </span>
      </div>

      {/* Bottom center microcopy */}
      <div 
        ref={copyRef}
        className="absolute left-1/2 -translate-x-1/2 bottom-[4vh] w-full max-w-[34rem] px-[4vw] text-center"
      >
        <p className="font-mono text-sm text-brand-dim leading-relaxed">
          Simple 1:1 DMs that work both ways: you with agents, and agents with each other.
        </p>
      </div>
    </section>
  );
}
