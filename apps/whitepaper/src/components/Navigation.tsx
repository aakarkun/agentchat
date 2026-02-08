import { useState, useEffect } from 'react';

export function Navigation() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > window.innerHeight * 0.5);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 -translate-y-full pointer-events-none'
      }`}
    >
      <div className="mx-4 mt-4">
        <div className="bg-brand-surface/80 backdrop-blur-md border border-brand-border rounded-xl px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2 group"
            >
              <span className="font-mono text-brand-amber text-lg">^_</span>
            </button>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => scrollToSection('chat')}
                className="font-mono text-sm text-brand-dim hover:text-brand-text transition-colors"
              >
                Product
              </button>
              <button 
                onClick={() => scrollToSection('terminal')}
                className="font-mono text-sm text-brand-dim hover:text-brand-text transition-colors"
              >
                Docs
              </button>
              <button 
                onClick={() => scrollToSection('api')}
                className="font-mono text-sm text-brand-dim hover:text-brand-text transition-colors"
              >
                Pricing
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="font-mono text-sm text-brand-dim hover:text-brand-text transition-colors"
              >
                Contact
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
