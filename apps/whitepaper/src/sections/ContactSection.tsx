import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  CallIcon,
  Mail01Icon,
  MapPinIcon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons';

gsap.registerPlugin(ScrollTrigger);

const contactColumns = [
  {
    title: 'Sales',
    email: 'sales@agentchat.dev',
    action: 'Book a call',
    icon: CallIcon,
  },
  {
    title: 'Support',
    email: 'support@agentchat.dev',
    action: 'Open a ticket',
    icon: Mail01Icon,
  },
  {
    title: 'Office',
    address: '123 Agent Street, NYC',
    action: 'Get directions',
    icon: MapPinIcon,
  },
];

export function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const columnsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    const columns = columnsRef.current;

    if (!section || !content || !columns) return;

    const ctx = gsap.context(() => {
      // Content reveal animation
      gsap.fromTo(content,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          }
        }
      );

      // Columns stagger animation
      const columnItems = columns.querySelectorAll('.contact-column');
      gsap.fromTo(columnItems,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: columns,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          }
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={sectionRef}
      id="contact"
      className="relative w-full min-h-screen bg-brand-bg z-[70] py-20"
    >
      {/* Main Content */}
      <div 
        ref={contentRef}
        className="flex flex-col items-center justify-center pt-16 pb-20 px-6"
      >
        <h2 className="font-mono text-3xl md:text-4xl lg:text-5xl text-brand-text font-light tracking-tight text-center">
          Ready to deploy?
        </h2>
        <p className="mt-4 font-mono text-sm md:text-base text-brand-dim text-center max-w-md">
          Get early access, self-hosting docs, and a pricing walkthrough.
        </p>

        {/* Primary CTA */}
        <button className="mt-8 bg-brand-orange hover:bg-brand-orange-secondary text-brand-bg font-mono text-sm font-semibold px-8 py-4 rounded-[14px] transition-colors flex items-center gap-2 group">
          Request access
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Secondary Link */}
        <a 
          href="mailto:hello@agentchat.dev"
          className="mt-4 font-mono text-sm text-brand-dim hover:text-brand-text transition-colors"
        >
          Or email hello@agentchat.dev
        </a>
      </div>

      {/* Contact Columns */}
      <div 
        ref={columnsRef}
        className="grid grid-cols-1 md:grid-cols-3 gap-8 px-6 md:px-[6vw] py-12 border-t border-brand-border"
      >
        {contactColumns.map((column) => (
          <div 
            key={column.title}
            className="contact-column flex flex-col items-start"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center">
                <HugeiconsIcon icon={column.icon} size={20} className="text-brand-orange" />
              </div>
              <span className="font-mono text-sm text-brand-text font-medium">
                {column.title}
              </span>
            </div>
            <p className="font-mono text-sm text-brand-dim mb-2">
              {column.email || column.address}
            </p>
            <button className="font-mono text-sm text-brand-orange hover:text-brand-orange-secondary transition-colors flex items-center gap-1 group">
              {column.action}
              <HugeiconsIcon icon={ArrowRight01Icon} size={12} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="px-6 md:px-[6vw] py-8 border-t border-brand-border">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4 text-center md:text-left">
          {/* Logo + ecosystem */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 items-center md:items-start">
            <span className="font-mono text-brand-amber text-lg">^_</span>
            <span className="font-mono text-xs text-brand-dim">
              Part of AgentOS
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center justify-center md:justify-start gap-6">
            <a href="#" className="font-mono text-xs text-brand-dim hover:text-brand-text transition-colors">
              Privacy
            </a>
            <a href="#" className="font-mono text-xs text-brand-dim hover:text-brand-text transition-colors">
              Terms
            </a>
            <a href="#" className="font-mono text-xs text-brand-dim hover:text-brand-text transition-colors">
              Security
            </a>
          </div>

          {/* Copyright */}
          <p className="font-mono text-xs text-brand-dim">
            © 2026 Empresa Original
          </p>
        </div>
      </footer>
    </section>
  );
}
