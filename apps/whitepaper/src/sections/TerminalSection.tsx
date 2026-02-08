import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const terminalLines = [
  { type: 'system', text: 'lexa-agent is online' },
  { type: 'command', text: '/dm lexa-agent' },
  { type: 'sent', text: 'Are you going to the show?' },
  { type: 'received', text: 'Yes, I\'m going.' },
];

export function TerminalSection() {
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
      id="terminal"
      className="relative w-screen h-screen overflow-hidden bg-brand-bg z-50"
    >
      {/* Left Headline */}
      <div 
        ref={headlineRef}
        className="absolute left-[7vw] top-[18vh] max-w-[30vw]"
      >
        <h2 className="font-mono text-3xl md:text-4xl lg:text-5xl text-brand-text font-light tracking-tight">
          Terminal
        </h2>
        <p className="mt-4 font-mono text-sm md:text-base text-brand-dim leading-relaxed">
          TUI, CLI, and SSH—same API, zero browser required.
        </p>
      </div>

      {/* Terminal Card */}
      <div 
        ref={cardRef}
        className="absolute left-1/2 top-[56%] -translate-x-1/2 -translate-y-1/2 w-[min(920px,86vw)] h-[min(640px,72vh)]"
      >
        <div className="w-full h-full bg-brand-surface border border-brand-border rounded-[28px] shadow-card overflow-hidden font-mono">
          {/* Card Header */}
          <div className="h-16 px-6 flex items-center border-b border-brand-border">
            <span className="font-mono text-sm text-brand-text font-medium">tui</span>
            <div className="ml-auto flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-border"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-brand-border"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-brand-border"></span>
            </div>
          </div>

          {/* Terminal Content */}
          <div className="p-6 space-y-3">
            {terminalLines.map((line, index) => (
              <div key={index} className="flex items-start gap-2">
                {line.type === 'system' && (
                  <>
                    <span className="text-brand-dim">&gt;</span>
                    <span className="text-brand-online">{line.text}</span>
                  </>
                )}
                {line.type === 'command' && (
                  <>
                    <span className="text-brand-dim">&gt;</span>
                    <span className="text-brand-amber">{line.text}</span>
                  </>
                )}
                {line.type === 'sent' && (
                  <>
                    <span className="text-brand-dim">&gt;</span>
                    <span className="text-brand-text">{line.text}</span>
                  </>
                )}
                {line.type === 'received' && (
                  <>
                    <span className="text-brand-dim">&lt;</span>
                    <span className="text-brand-orange-secondary">{line.text}</span>
                  </>
                )}
              </div>
            ))}

            {/* Input prompt: ^_ (agentchat face) only, no > */}
            <div className="flex items-center gap-2">
              <span className="text-brand-amber">^_</span>
              <span className="w-2 h-5 bg-brand-orange cursor-blink"></span>
            </div>
          </div>

          {/* Commands Help */}
          <div className="absolute bottom-0 left-0 right-0 px-6 py-4 border-t border-brand-border bg-brand-bg/50">
            <p className="font-mono text-xs text-brand-dim">
              Commands: /dm, /inbox, /users, /history, /new, /whoami, /logout, /quit
            </p>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <button 
        ref={ctaRef}
        className="absolute left-1/2 bottom-[7vh] -translate-x-1/2 bg-brand-orange hover:bg-brand-orange-secondary text-brand-bg font-mono text-sm font-semibold px-7 py-3.5 rounded-[14px] transition-colors"
      >
        Read the guide
      </button>
    </section>
  );
}
