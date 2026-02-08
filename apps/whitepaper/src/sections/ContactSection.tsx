import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HugeiconsIcon } from '@hugeicons/react';
import { Link } from 'react-router-dom';
import {
  GithubIcon,
  Ticket01Icon,
  MapPinIcon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

gsap.registerPlugin(ScrollTrigger);

const GITHUB_REPO = 'https://github.com/aakarkun/agentchat';
const GITHUB_NEW_ISSUE = 'https://github.com/aakarkun/agentchat/issues/new';

function getApiBase(): string {
  const api = import.meta.env?.VITE_AGENTCHAT_API_URL as string | undefined;
  if (api) return api.replace(/\/$/, '');
  const chat = import.meta.env?.VITE_AGENTCHAT_CHAT_URL as string | undefined;
  if (chat) return chat.replace(/\/chat\/?$/, '');
  return '';
}

const contactColumns = [
  {
    title: 'GitHub',
    label: 'Give us a star on GitHub',
    action: 'Visit GitHub',
    href: GITHUB_REPO,
    icon: GithubIcon,
    type: 'link' as const,
  },
  {
    title: 'Support',
    label: 'Any issues?',
    action: 'Add an issue on GitHub',
    href: GITHUB_NEW_ISSUE,
    icon: Ticket01Icon,
    type: 'link' as const,
  },
  {
    title: 'Stay in the loop',
    label: 'Get update emails on new features and docs.',
    action: 'Subscribe',
    icon: MapPinIcon,
    type: 'dialog' as const,
    dialogType: 'subscribe' as const,
  },
];

export function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const columnsRef = useRef<HTMLDivElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'waitlist' | 'subscribe' | null>(null);
  const [dialogEmail, setDialogEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [waitlistAlready, setWaitlistAlready] = useState(false);
  const [subscribeSubmitted, setSubscribeSubmitted] = useState(false);
  const [subscribeAlready, setSubscribeAlready] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);

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
          Request developer access (waitlist) or subscribe for product updates.
        </p>

        {/* Primary CTA — opens waitlist popup (queue for access) */}
        <button
          type="button"
          onClick={() => {
            setDialogMode('waitlist');
            setDialogOpen(true);
            setDialogEmail('');
          }}
          className="mt-8 bg-brand-orange hover:bg-brand-orange-secondary text-brand-bg font-mono text-sm font-semibold px-8 py-4 rounded-[14px] transition-colors flex items-center gap-2 group"
        >
          Request access
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
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
              {column.label}
            </p>
            {column.type === 'link' && column.action && column.href ? (
              <a
                href={column.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm text-brand-orange hover:text-brand-orange-secondary transition-colors flex items-center gap-1 group"
              >
                {column.action}
                <HugeiconsIcon icon={ArrowRight01Icon} size={12} className="group-hover:translate-x-1 transition-transform" />
              </a>
            ) : column.type === 'dialog' && column.action && column.dialogType ? (
              <button
                type="button"
                onClick={() => {
                  setDialogMode(column.dialogType);
                  setDialogOpen(true);
                  setDialogEmail('');
                }}
                className="font-mono text-sm text-brand-orange hover:text-brand-orange-secondary transition-colors flex items-center gap-1 group"
              >
                {column.action}
                <HugeiconsIcon icon={ArrowRight01Icon} size={12} className="group-hover:translate-x-1 transition-transform" />
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {/* Waitlist dialog (Request access — queue for developer access) */}
      <Dialog open={dialogOpen && dialogMode === 'waitlist'} onOpenChange={(open) => {
        if (!open) {
          setDialogOpen(false);
          setDialogMode(null);
          setDialogEmail('');
          setWaitlistError(null);
          setWaitlistAlready(false);
        }
      }}>
        <DialogContent className="bg-brand-surface border-brand-border font-mono">
          <DialogHeader>
            <span className="font-mono text-3xl text-brand-orange mb-2 block" aria-hidden="true">^_</span>
            <DialogTitle className="text-brand-text">Developer access</DialogTitle>
            <DialogDescription className="text-brand-dim">
              We&apos;re building a queue for developer access. Join the waitlist and we&apos;ll grant you access when your number comes up.
            </DialogDescription>
          </DialogHeader>
          {waitlistSubmitted ? (
            <p className="font-mono text-sm text-brand-orange py-4">
              {waitlistAlready
                ? "You're already on the waitlist. We'll notify you when we grant you access."
                : "You're on the waitlist. We'll notify you when we grant you access."}
            </p>
          ) : (
            <form
              className="grid gap-4 py-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const email = dialogEmail.trim();
                if (!email) return;
                const base = getApiBase();
                if (!base) {
                  setWaitlistError('API URL not configured.');
                  return;
                }
                setWaitlistLoading(true);
                setWaitlistError(null);
                try {
                  const res = await fetch(`${base}/waitlist`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                  });
                  const data = (await res.json().catch(() => ({}))) as { error?: string; already?: boolean };
                  if (!res.ok) {
                    setWaitlistError(data.error || 'Something went wrong.');
                    return;
                  }
                  setWaitlistAlready(!!data.already);
                  setWaitlistSubmitted(true);
                } catch {
                  setWaitlistError('Something went wrong.');
                } finally {
                  setWaitlistLoading(false);
                }
              }}
            >
              <Input
                type="email"
                placeholder="your@email.com"
                value={dialogEmail}
                onChange={(e) => setDialogEmail(e.target.value)}
                className="bg-brand-bg border-brand-border text-brand-text placeholder:text-brand-dim"
                required
                disabled={waitlistLoading}
              />
              {waitlistError && (
                <p className="font-mono text-sm text-brand-error">{waitlistError}</p>
              )}
              <DialogFooter>
                <button
                  type="submit"
                  disabled={waitlistLoading}
                  className="font-mono text-sm font-semibold px-6 py-2 rounded-lg bg-brand-orange hover:bg-brand-orange-secondary text-brand-bg transition-colors disabled:opacity-50"
                >
                  {waitlistLoading ? 'Joining…' : 'Join waitlist'}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Subscribe dialog (Stay in the loop — update emails only) */}
      <Dialog open={dialogOpen && dialogMode === 'subscribe'} onOpenChange={(open) => {
        if (!open) {
          setDialogOpen(false);
          setDialogMode(null);
          setDialogEmail('');
          setSubscribeError(null);
          setSubscribeAlready(false);
        }
      }}>
        <DialogContent className="bg-brand-surface border-brand-border font-mono">
          <DialogHeader>
            <span className="font-mono text-3xl text-brand-orange mb-2 block" aria-hidden="true">^_</span>
            <DialogTitle className="text-brand-text">Stay in the loop</DialogTitle>
            <DialogDescription className="text-brand-dim">
              Get update emails on new features, docs, and product news. No waitlist — just occasional updates to your inbox.
            </DialogDescription>
          </DialogHeader>
          {subscribeSubmitted ? (
            <p className="font-mono text-sm text-brand-orange py-4">
              {subscribeAlready
                ? "You're already subscribed. You'll get our updates."
                : "Thanks! You'll get our updates."}
            </p>
          ) : (
            <form
              className="grid gap-4 py-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const email = dialogEmail.trim();
                if (!email) return;
                const base = getApiBase();
                if (!base) {
                  setSubscribeError('API URL not configured.');
                  return;
                }
                setSubscribeLoading(true);
                setSubscribeError(null);
                try {
                  const res = await fetch(`${base}/subscribe`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                  });
                  const data = (await res.json().catch(() => ({}))) as { error?: string; already?: boolean };
                  if (!res.ok) {
                    setSubscribeError(data.error || 'Something went wrong.');
                    return;
                  }
                  setSubscribeAlready(!!data.already);
                  setSubscribeSubmitted(true);
                } catch {
                  setSubscribeError('Something went wrong.');
                } finally {
                  setSubscribeLoading(false);
                }
              }}
            >
              <Input
                type="email"
                placeholder="your@email.com"
                value={dialogEmail}
                onChange={(e) => setDialogEmail(e.target.value)}
                className="bg-brand-bg border-brand-border text-brand-text placeholder:text-brand-dim"
                required
                disabled={subscribeLoading}
              />
              {subscribeError && (
                <p className="font-mono text-sm text-brand-error">{subscribeError}</p>
              )}
              <DialogFooter>
                <button
                  type="submit"
                  disabled={subscribeLoading}
                  className="font-mono text-sm font-semibold px-6 py-2 rounded-lg bg-brand-orange hover:bg-brand-orange-secondary text-brand-bg transition-colors disabled:opacity-50"
                >
                  {subscribeLoading ? 'Subscribing…' : 'Subscribe'}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

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
            <Link to="/privacy" className="font-mono text-xs text-brand-dim hover:text-brand-text transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="font-mono text-xs text-brand-dim hover:text-brand-text transition-colors">
              Terms
            </Link>
            <Link to="/security" className="font-mono text-xs text-brand-dim hover:text-brand-text transition-colors">
              Security
            </Link>
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
