import { useState, useEffect } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [eye, setEye] = useState<'^' | '*'>('^');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Blink animation: ^_ ↔ *_
    const blinkInterval = setInterval(() => {
      setEye((prev) => (prev === '^' ? '*' : '^'));
    }, 500);

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          clearInterval(blinkInterval);
          setTimeout(onComplete, 300);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    // Safety: always show app after 3s in case intervals get stuck (e.g. tab backgrounded)
    const safetyTimeout = setTimeout(onComplete, 3000);

    return () => {
      clearInterval(blinkInterval);
      clearInterval(progressInterval);
      clearTimeout(safetyTimeout);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-brand-bg">
      {/* Blinking Face */}
      <div className="flex items-center justify-center">
        <span 
          className="text-6xl md:text-8xl font-mono text-brand-text tracking-tight"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          <span 
            className="inline-block transition-opacity duration-75"
            style={{ opacity: eye === '^' ? 1 : 0.4 }}
          >
            {eye}
          </span>
          <span>_</span>
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mt-12 w-48 h-0.5 bg-brand-border rounded-full overflow-hidden">
        <div 
          className="h-full bg-brand-orange transition-all duration-100 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Loading Text */}
      <p className="mt-4 text-sm font-mono text-brand-dim">
        loading agentchat...
      </p>
    </div>
  );
}
