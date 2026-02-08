import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    if (!section || !content) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        content,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="relative w-full min-h-screen bg-brand-bg z-[25] flex items-center justify-center py-20"
    >
      <div ref={contentRef} className="text-center px-6">
        <h2 className="font-mono text-3xl md:text-4xl lg:text-5xl text-brand-text font-light tracking-tight">
          Pricing
        </h2>
        <p className="mt-6 font-mono text-lg md:text-xl text-brand-orange font-medium">
          It's free for now.
        </p>
        <p className="mt-4 font-mono text-sm text-brand-dim max-w-md mx-auto">
          Use the API, web chat, and terminal clients at no cost. We may introduce paid tiers later; we'll announce any changes in advance.
        </p>
      </div>
    </section>
  );
}
