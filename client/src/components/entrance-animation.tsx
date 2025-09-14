import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface EntranceAnimationProps {
  onComplete?: () => void;
}

export default function EntranceAnimation({ onComplete }: EntranceAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftDoorRef = useRef<HTMLDivElement>(null);
  const rightDoorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !leftDoorRef.current || !rightDoorRef.current) return;

    // Create entrance timeline
    const tl = gsap.timeline({
      onComplete: () => {
        if (onComplete) onComplete();
      }
    });

    // Initial setup - doors closed
    gsap.set([leftDoorRef.current, rightDoorRef.current], {
      scale: 1,
      opacity: 1
    });

    // Stage 1: Brief pause for dramatic effect
    tl.to({}, { duration: 0.8 })

    // Stage 2: Doors begin to separate with heavy easing
    .to(leftDoorRef.current, {
      x: '-50vw',
      rotationY: -15,
      duration: 2.5,
      ease: 'power2.out'
    }, 'doors')
    .to(rightDoorRef.current, {
      x: '50vw',
      rotationY: 15,
      duration: 2.5,
      ease: 'power2.out'
    }, 'doors')

    // Stage 3: Add glow effects during opening
    .to(leftDoorRef.current, {
      boxShadow: '-20px 0 40px rgba(0, 217, 255, 0.3)',
      duration: 1.5,
      ease: 'power2.inOut'
    }, 'doors+=0.5')
    .to(rightDoorRef.current, {
      boxShadow: '20px 0 40px rgba(0, 217, 255, 0.3)',
      duration: 1.5,
      ease: 'power2.inOut'
    }, 'doors+=0.5')

    // Stage 4: Final fade out
    .to([leftDoorRef.current, rightDoorRef.current], {
      opacity: 0,
      duration: 1,
      ease: 'power2.inOut'
    }, '-=0.5');

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 pointer-events-none"
      style={{ perspective: '1000px' }}
    >
      {/* Left Door */}
      <div
        ref={leftDoorRef}
        className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700"
        style={{
          transformOrigin: 'right center',
          background: `
            linear-gradient(135deg, 
              rgba(15, 23, 42, 0.95) 0%, 
              rgba(30, 41, 59, 0.9) 50%, 
              rgba(51, 65, 85, 0.85) 100%
            ),
            radial-gradient(circle at 90% 50%, rgba(0, 217, 255, 0.1) 0%, transparent 50%)
          `,
          borderRight: '2px solid rgba(0, 217, 255, 0.4)',
          boxShadow: `
            inset -4px 0 8px rgba(0, 217, 255, 0.2),
            inset 0 0 20px rgba(0, 217, 255, 0.1)
          `
        }}
      >
        {/* Left door geometric patterns */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 right-4 w-2 h-32 bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent transform -translate-y-1/2" />
          <div className="absolute top-1/4 right-8 w-16 h-px bg-gradient-to-l from-cyan-400/40 to-transparent" />
          <div className="absolute top-3/4 right-8 w-12 h-px bg-gradient-to-l from-cyan-400/40 to-transparent" />
          
          {/* Hexagonal tech pattern */}
          <div className="absolute top-1/2 right-16 transform -translate-y-1/2">
            <div className="w-8 h-8 border border-cyan-400/30 transform rotate-45" />
            <div className="absolute top-1 left-1 w-6 h-6 border border-cyan-400/20 transform rotate-45" />
          </div>
        </div>
      </div>

      {/* Right Door */}
      <div
        ref={rightDoorRef}
        className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-gray-900 via-gray-800 to-gray-700"
        style={{
          transformOrigin: 'left center',
          background: `
            linear-gradient(225deg, 
              rgba(15, 23, 42, 0.95) 0%, 
              rgba(30, 41, 59, 0.9) 50%, 
              rgba(51, 65, 85, 0.85) 100%
            ),
            radial-gradient(circle at 10% 50%, rgba(0, 217, 255, 0.1) 0%, transparent 50%)
          `,
          borderLeft: '2px solid rgba(0, 217, 255, 0.4)',
          boxShadow: `
            inset 4px 0 8px rgba(0, 217, 255, 0.2),
            inset 0 0 20px rgba(0, 217, 255, 0.1)
          `
        }}
      >
        {/* Right door geometric patterns */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-4 w-2 h-32 bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent transform -translate-y-1/2" />
          <div className="absolute top-1/4 left-8 w-16 h-px bg-gradient-to-r from-cyan-400/40 to-transparent" />
          <div className="absolute top-3/4 left-8 w-12 h-px bg-gradient-to-r from-cyan-400/40 to-transparent" />
          
          {/* Hexagonal tech pattern */}
          <div className="absolute top-1/2 left-16 transform -translate-y-1/2">
            <div className="w-8 h-8 border border-cyan-400/30 transform rotate-45" />
            <div className="absolute top-1 left-1 w-6 h-6 border border-cyan-400/20 transform rotate-45" />
          </div>
        </div>
      </div>

      {/* Central seam light */}
      <div 
        className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-cyan-400/60 to-transparent transform -translate-x-1/2"
        style={{
          boxShadow: '0 0 20px rgba(0, 217, 255, 0.6)',
          filter: 'blur(1px)'
        }}
      />
    </div>
  );
}