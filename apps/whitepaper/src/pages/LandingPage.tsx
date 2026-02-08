import { useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LoadingScreen } from '../components/LoadingScreen';
import { Navigation } from '../components/Navigation';
import { HeroSection } from '../sections/HeroSection';
import { ChatSection } from '../sections/ChatSection';
import { PricingSection } from '../sections/PricingSection';
import { InboxSection } from '../sections/InboxSection';
import { PresenceSection } from '../sections/PresenceSection';
import { TerminalSection } from '../sections/TerminalSection';
import { ApiSection } from '../sections/ApiSection';
import { ContactSection } from '../sections/ContactSection';
import '../App.css';

gsap.registerPlugin(ScrollTrigger);

export function LandingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        setShowContent(true);
        ScrollTrigger.refresh();
        setupGlobalSnap();
      }, 100);
    }
  }, [isLoading]);

  const setupGlobalSnap = () => {
    setTimeout(() => {
      const pinned = ScrollTrigger.getAll()
        .filter((st: { vars: { pin?: boolean } }) => st.vars.pin)
        .sort((a: { start: number }, b: { start: number }) => a.start - b.start);

      const maxScroll = ScrollTrigger.maxScroll(window);

      if (!maxScroll || pinned.length === 0) return;

      const pinnedRanges = pinned.map((st: { start: number; end?: number }) => ({
        start: st.start / maxScroll,
        end: (st.end ?? st.start) / maxScroll,
        center: (st.start + ((st.end ?? st.start) - st.start) * 0.5) / maxScroll,
      }));

      ScrollTrigger.create({
        snap: {
          snapTo: (value: number) => {
            const inPinned = pinnedRanges.some(
              (r: { start: number; end: number }) => value >= r.start - 0.02 && value <= r.end + 0.02
            );
            if (!inPinned) return value;
            const target = pinnedRanges.reduce(
              (closest: number, r: { center: number }) =>
                Math.abs(r.center - value) < Math.abs(closest - value) ? r.center : closest,
              pinnedRanges[0]?.center ?? 0
            );
            return target;
          },
          duration: { min: 0.15, max: 0.35 },
          delay: 0,
          ease: 'power2.out',
        },
      });
    }, 500);
  };

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <>
      {isLoading && <LoadingScreen onComplete={handleLoadingComplete} />}

      {showContent && (
        <div className="relative min-h-screen">
          <div className="grain-overlay" />
          <Navigation />
          <main className="relative">
            <HeroSection />
            <ChatSection />
            <PricingSection />
            <InboxSection />
            <PresenceSection />
            <TerminalSection />
            <ApiSection />
            <ContactSection />
          </main>
        </div>
      )}
    </>
  );
}
