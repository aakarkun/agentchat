import { useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LoadingScreen } from './components/LoadingScreen';
import { Navigation } from './components/Navigation';
import { HeroSection } from './sections/HeroSection';
import { ChatSection } from './sections/ChatSection';
import { InboxSection } from './sections/InboxSection';
import { PresenceSection } from './sections/PresenceSection';
import { TerminalSection } from './sections/TerminalSection';
import { ApiSection } from './sections/ApiSection';
import { ContactSection } from './sections/ContactSection';
import './App.css';

gsap.registerPlugin(ScrollTrigger);

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        setShowContent(true);
        
        // Refresh ScrollTrigger after content is visible
        ScrollTrigger.refresh();
        
        // Setup global snap after all sections are mounted
        setupGlobalSnap();
      }, 100);
    }
  }, [isLoading]);

  const setupGlobalSnap = () => {
    // Wait for all section ScrollTriggers to be created
    setTimeout(() => {
      const pinned = ScrollTrigger.getAll()
        .filter(st => st.vars.pin)
        .sort((a, b) => a.start - b.start);
      
      const maxScroll = ScrollTrigger.maxScroll(window);
      
      if (!maxScroll || pinned.length === 0) return;

      // Build ranges and snap targets from pinned sections
      const pinnedRanges = pinned.map(st => ({
        start: st.start / maxScroll,
        end: (st.end ?? st.start) / maxScroll,
        center: (st.start + ((st.end ?? st.start) - st.start) * 0.5) / maxScroll,
      }));

      ScrollTrigger.create({
        snap: {
          snapTo: (value: number) => {
            // Check if within any pinned range (allow small buffer)
            const inPinned = pinnedRanges.some(
              r => value >= r.start - 0.02 && value <= r.end + 0.02
            );
            
            // If not in pinned section, allow free scroll
            if (!inPinned) return value;

            // Find nearest pinned center
            const target = pinnedRanges.reduce((closest, r) =>
              Math.abs(r.center - value) < Math.abs(closest - value) 
                ? r.center 
                : closest,
              pinnedRanges[0]?.center ?? 0
            );
            
            return target;
          },
          duration: { min: 0.15, max: 0.35 },
          delay: 0,
          ease: 'power2.out',
        }
      });
    }, 500);
  };

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <>
      {/* Loading Screen */}
      {isLoading && <LoadingScreen onComplete={handleLoadingComplete} />}

      {/* Main Content */}
      {showContent && (
        <div className="relative">
          {/* Grain Overlay */}
          <div className="grain-overlay" />

          {/* Navigation */}
          <Navigation />

          {/* Sections */}
          <main className="relative">
            <HeroSection />
            <ChatSection />
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

export default App;
