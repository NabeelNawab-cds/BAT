import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { useLocation } from 'wouter';
import ParticlesBackground from '../components/particles-background';
import EntranceAnimation from '../components/entrance-animation';

interface LandingPageProps {
  onEnter?: () => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  const [, navigate] = useLocation();
  const [showTitle, setShowTitle] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [doorsAnimating, setDoorsAnimating] = useState(false);
  const [skipAnimations, setSkipAnimations] = useState(false);
  const [doorResolve, setDoorResolve] = useState<(() => void) | null>(null);
  
  const titleRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check for reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  // Listen for reduced motion preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Handle SPACE key to skip animations
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !skipAnimations && !doorsAnimating) {
        event.preventDefault();
        setSkipAnimations(true);
        setShowTitle(true);
        setShowButton(true);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [skipAnimations, doorsAnimating]);

  useEffect(() => {
    if (prefersReducedMotion || skipAnimations) {
      // Skip animations for accessibility or user preference
      setShowTitle(true);
      setShowButton(true);
      return;
    }

    // Show title and button immediately - NO automatic door opening
    const timer = setTimeout(() => {
      setShowTitle(true);
      setTimeout(() => setShowButton(true), 600);
    }, 200);

    return () => clearTimeout(timer);
  }, [prefersReducedMotion, skipAnimations]);

  const handleDoorsComplete = () => {
    setDoorsAnimating(false);
    
    // Call the resolver to continue with handleEnterCave
    if (doorResolve) {
      doorResolve();
      setDoorResolve(null);
    }
  };

  const handleEnterCave = async () => {
    if (isEntering) return;
    setIsEntering(true);

    // First, open the doors if animations are enabled
    if (!prefersReducedMotion && !skipAnimations) {
      setDoorsAnimating(true); // This will mount the EntranceAnimation component
      
      // Wait for doors to complete opening
      await new Promise<void>((resolve) => {
        setDoorResolve(() => resolve);
      });
    }

    // Then do the zoom-in transition
    if (!prefersReducedMotion && containerRef.current) {
      await new Promise<void>((resolve) => {
        gsap.to(containerRef.current, {
          scale: 1.5,
          filter: 'blur(10px)',
          duration: 1,
          ease: 'power2.in',
          onComplete: resolve
        });
      });
    }

    // Navigate to dashboard
    if (onEnter) {
      onEnter();
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-black overflow-hidden relative"
    >
      {/* Gradient Light Sweep */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent w-full h-full"
          style={{
            animation: !prefersReducedMotion ? 'gradientSweep 8s ease-in-out infinite' : 'none',
            transform: 'translateX(-100%)',
          }}
        />
      </div>

      {/* Particles Background - only render if animations are enabled */}
      {!prefersReducedMotion && <ParticlesBackground />}

      {/* Entrance Animation (Doors) */}
      <AnimatePresence>
        {doorsAnimating && !prefersReducedMotion && !skipAnimations && (
          <EntranceAnimation onComplete={handleDoorsComplete} />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        
        {/* Title Section */}
        <AnimatePresence>
          {showTitle && (
            <motion.div
              ref={titleRef}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="text-center mb-16"
            >
              <h1 
                className={`text-6xl md:text-8xl lg:text-9xl font-bold tracking-wider mb-6 ${
                  !prefersReducedMotion ? 'animate-pulse' : ''
                }`}
                style={{
                  fontFamily: 'Orbitron, monospace',
                  background: 'linear-gradient(135deg, #00d9ff 0%, #0ea5e9 50%, #3b82f6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: '0 0 20px rgba(0, 217, 255, 0.5)',
                  letterSpacing: '0.1em',
                  animation: !prefersReducedMotion ? 'titleGlitch 3s ease-in-out infinite' : 'none'
                }}
              >
                BATCAVE
              </h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="text-xl md:text-2xl text-gray-300 tracking-wide max-w-2xl mx-auto"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Your Mission Control for Productivity
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enter Button */}
        <AnimatePresence>
          {showButton && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <button
                ref={buttonRef}
                onClick={handleEnterCave}
                disabled={isEntering}
                className={`
                  relative px-12 py-4 text-lg font-semibold tracking-wide
                  bg-transparent border-2 border-cyan-400/60 
                  text-cyan-400 rounded-lg
                  backdrop-blur-sm bg-black/20
                  transition-all duration-300
                  hover:bg-cyan-400/10 hover:border-cyan-300
                  hover:shadow-lg hover:shadow-cyan-400/25
                  focus:outline-none focus:ring-2 focus:ring-cyan-400/50
                  disabled:opacity-50 disabled:cursor-not-allowed
                  group overflow-hidden
                `}
                style={{ 
                  fontFamily: 'Space Grotesk, sans-serif',
                  textShadow: '0 0 10px rgba(0, 217, 255, 0.5)'
                }}
                onMouseEnter={() => {
                  if (!prefersReducedMotion && buttonRef.current) {
                    gsap.to(buttonRef.current, {
                      scale: 1.05,
                      duration: 0.2,
                      ease: 'power2.out'
                    });
                  }
                }}
                onMouseLeave={() => {
                  if (!prefersReducedMotion && buttonRef.current) {
                    gsap.to(buttonRef.current, {
                      scale: 1,
                      duration: 0.2,
                      ease: 'power2.out'
                    });
                  }
                }}
              >
                {/* Button background glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/10 to-cyan-400/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                
                <span className="relative z-10">
                  {isEntering ? 'ENTERING...' : 'ENTER THE CAVE'}
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading indicator during transition */}
        {isEntering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          >
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-cyan-400 text-lg font-medium">
                Initializing Command Center...
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Ambient sound indicator (for future implementation) */}
      <div className="absolute bottom-6 right-6 text-cyan-400/60 text-sm z-10">
        <span className="hidden md:block">Press SPACE to skip animations</span>
      </div>
    </div>
  );
}