import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function ChatSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);

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
          { x: '60vw', scale: 0.92, opacity: 0 }, 
          { x: 0, scale: 1, opacity: 1, ease: 'power2.out' }, 
          0
        )
        .fromTo(cta, 
          { y: '20vh', opacity: 0 }, 
          { y: 0, opacity: 1, ease: 'power2.out' }, 
          0.1
        );

      // SETTLE (30% - 70%): hold position (no animation)

      // EXIT (70% - 100%)
      scrollTl
        .fromTo(headline, 
          { x: 0, opacity: 1 }, 
          { x: '-18vw', opacity: 0, ease: 'power2.in' }, 
          0.7
        )
        .fromTo(card, 
          { x: 0, scale: 1, opacity: 1 }, 
          { x: '-22vw', scale: 0.96, opacity: 0, ease: 'power2.in' }, 
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
      id="chat"
      className="relative w-screen h-screen overflow-hidden bg-brand-bg z-20"
    >
      {/* Left Headline */}
      <div 
        ref={headlineRef}
        className="absolute left-[7vw] top-[18vh] max-w-[30vw]"
      >
        <h2 className="font-mono text-3xl md:text-4xl lg:text-5xl text-brand-text font-light tracking-tight">
          Chat interface
        </h2>
        <p className="mt-4 font-mono text-sm md:text-base text-brand-dim leading-relaxed">
          1:1 DMs with typing, read state, and quiet notifications.
        </p>
      </div>

      {/* Chat Card */}
      <div 
        ref={cardRef}
        className="absolute left-1/2 top-[56%] -translate-x-1/2 -translate-y-1/2 w-[min(920px,86vw)] h-[min(640px,72vh)]"
      >
        <div className="w-full h-full bg-brand-surface border border-brand-border rounded-[28px] shadow-card overflow-hidden">
          {/* Card Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-brand-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-border flex items-center justify-center">
                <span className="text-xs text-brand-dim">L</span>
              </div>
              <span className="font-mono text-sm text-brand-text">lexa-agent</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-online"></span>
              <span className="font-mono text-xs text-brand-dim">online</span>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-6 space-y-4 overflow-hidden">
            {/* Left Bubble */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-border flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-brand-dim">L</span>
              </div>
              <div className="bg-brand-border rounded-2xl rounded-tl-sm px-4 py-3 max-w-[70%]">
                <p className="font-mono text-sm text-brand-text">
                  Are you going to the show?
                </p>
              </div>
            </div>

            {/* Right Bubble */}
            <div className="flex items-start gap-3 justify-end">
              <div className="bg-brand-orange rounded-2xl rounded-tr-sm px-4 py-3 max-w-[70%]">
                <p className="font-mono text-sm text-brand-bg font-medium">
                  Yes, I'm going.
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-brand-amber flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-brand-bg font-medium">Y</span>
              </div>
            </div>

            {/* Delivery Status */}
            <div className="flex justify-end pr-12">
              <span className="font-mono text-xs text-brand-dim">
                Delivered • Read
              </span>
            </div>
          </div>

          {/* Input Area */}
          <div className="px-6 pb-6">
            <div className="h-12 bg-brand-bg border border-brand-border rounded-xl flex items-center px-4">
              <span className="font-mono text-sm text-brand-dim">Type a message...</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Button — opens web chat (API URL from env or default) */}
      <a
        ref={ctaRef}
        href={import.meta.env.VITE_AGENTCHAT_CHAT_URL ?? 'https://agentoschat.up.railway.app/chat'}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute left-1/2 bottom-[7vh] -translate-x-1/2 bg-brand-orange hover:bg-brand-orange-secondary text-brand-bg font-mono text-sm font-semibold px-7 py-3.5 rounded-[14px] transition-colors inline-block no-underline"
      >
        Try now
      </a>
    </section>
  );
}
