import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { Zap, Trophy, Target, Maximize2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/lib/theme-context';
import { motion, AnimatePresence } from 'framer-motion';
import { useXPSystem } from '@/lib/xp-system';

interface GamificationCardProps {
  onTaskComplete?: (xpGained: number) => void;
}

export function GamificationCard({
  onTaskComplete
}: GamificationCardProps) {
  const { gamificationType } = useTheme();
  const { userProgress, awardTaskXP, getLevelProgressPercent } = useXPSystem();
  const cardRef = useRef<HTMLDivElement>(null);
  const saplingRef = useRef<HTMLDivElement>(null);
  const mountainRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  
  // Get level progress from XP system
  const levelProgress = getLevelProgressPercent();
  
  // Initialize animations
  useEffect(() => {
    if (!cardRef.current) return;
    
    // Initial card entrance animation
    gsap.fromTo(cardRef.current,
      { y: 50, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' }
    );
    
    // Set initial animation progress based on level
    setAnimationProgress(levelProgress);
  }, [levelProgress]);

  // Sapling Growth Animation
  const animateSaplingGrowth = useCallback((progress: number) => {
    if (!saplingRef.current) return;
    
    const tl = gsap.timeline();
    const normalizedProgress = Math.min(progress / 100, 1);
    
    // Trunk growth
    const trunk = saplingRef.current.querySelector('[data-trunk]');
    if (trunk) {
      tl.to(trunk, {
        scaleY: 0.3 + (normalizedProgress * 0.7),
        duration: 1.5,
        ease: 'power2.out'
      }, 0);
    }
    
    // Leaves appearance in stages
    const leaves = saplingRef.current.querySelectorAll('[data-leaf]');
    leaves.forEach((leaf, index) => {
      const leafProgress = (normalizedProgress * leaves.length) - index;
      if (leafProgress > 0) {
        tl.to(leaf, {
          opacity: Math.min(leafProgress, 1),
          scale: Math.min(leafProgress * 0.8 + 0.2, 1),
          duration: 0.8,
          ease: 'power2.out'
        }, index * 0.2);
      }
    });
    
    // Holographic glow effect
    const glow = saplingRef.current.querySelector('[data-glow]');
    if (glow) {
      tl.to(glow, {
        opacity: 0.3 + (normalizedProgress * 0.4),
        scale: 1 + (normalizedProgress * 0.2),
        duration: 2,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true
      }, 0);
    }
  }, []);

  // Mountain Climbing Animation
  const animateMountainClimb = useCallback((progress: number) => {
    if (!mountainRef.current) return;
    
    const tl = gsap.timeline();
    const normalizedProgress = Math.min(progress / 100, 1);
    
    // Avatar climbing position
    const avatar = mountainRef.current.querySelector('[data-avatar]');
    if (avatar) {
      tl.to(avatar, {
        y: -normalizedProgress * 180, // Climb height
        x: normalizedProgress * 20 * Math.sin(normalizedProgress * Math.PI * 2), // Slight zigzag path
        duration: 2,
        ease: 'power2.inOut'
      }, 0);
    }
    
    // Altitude lines lighting up
    const altitudeLines = mountainRef.current.querySelectorAll('[data-altitude]');
    altitudeLines.forEach((line, index) => {
      const lineProgress = (normalizedProgress * altitudeLines.length) - index;
      if (lineProgress > 0) {
        tl.to(line, {
          opacity: Math.min(lineProgress, 1),
          boxShadow: `0 0 ${Math.min(lineProgress * 10, 10)}px hsl(var(--primary))`,
          duration: 0.5,
          ease: 'power2.out'
        }, index * 0.1);
      }
    });
    
    // Camera tilt effect
    if (normalizedProgress > 0.5) {
      tl.to(mountainRef.current, {
        rotateX: -(normalizedProgress - 0.5) * 10,
        transformPerspective: 1000,
        duration: 1,
        ease: 'power2.out'
      }, 0);
    }
  }, []);

  // Update animations when progress changes
  useEffect(() => {
    if (gamificationType === 'sapling') {
      animateSaplingGrowth(animationProgress);
    } else {
      animateMountainClimb(animationProgress);
    }
  }, [animationProgress, gamificationType, animateSaplingGrowth, animateMountainClimb]);

  // Task completion celebration  
  const celebrateTaskCompletion = (xpGained: number) => {
    // Award the XP first, then recalculate progress
    awardTaskXP('medium', 'academic', 2, 1.5);
    const newProgress = getLevelProgressPercent();
    
    // XP burst animation
    if (cardRef.current) {
      const burst = document.createElement('div');
      burst.textContent = `+${xpGained} XP`;
      burst.className = 'absolute top-4 right-4 text-primary font-bold text-lg pointer-events-none';
      cardRef.current.appendChild(burst);
      
      gsap.fromTo(burst,
        { y: 0, opacity: 1, scale: 0.8 },
        { 
          y: -50, 
          opacity: 0, 
          scale: 1.2, 
          duration: 2,
          ease: 'power2.out',
          onComplete: () => burst.remove()
        }
      );
    }
    
    setAnimationProgress(newProgress);
    onTaskComplete?.(xpGained);
  };

  // Test function for task completion (for demonstration)
  const testTaskCompletion = () => {
    const xpGained = 100; // Show burst animation with static value
    celebrateTaskCompletion(xpGained);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Render Sapling Hologram
  const renderSaplingHologram = () => (
    <div ref={saplingRef} className="relative h-full flex items-end justify-center">
      {/* Holographic base glow */}
      <div 
        data-glow
        className="absolute bottom-0 w-32 h-32 bg-gradient-to-t from-green-500/30 to-transparent rounded-full blur-lg"
      />
      
      {/* Trunk */}
      <div 
        data-trunk
        className="w-3 bg-gradient-to-t from-amber-700 to-green-600 rounded-t-full transform-origin-bottom origin-bottom"
        style={{ height: '120px' }}
      />
      
      {/* Leaves at different growth stages */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
        {/* Stage 1 leaves */}
        <div data-leaf className="absolute -left-4 -top-2 w-3 h-3 bg-green-400 rounded-full opacity-0" />
        <div data-leaf className="absolute -right-4 -top-2 w-3 h-3 bg-green-400 rounded-full opacity-0" />
        
        {/* Stage 2 leaves */}
        <div data-leaf className="absolute -left-6 -top-6 w-4 h-4 bg-green-500 rounded-full opacity-0" />
        <div data-leaf className="absolute -right-6 -top-6 w-4 h-4 bg-green-500 rounded-full opacity-0" />
        <div data-leaf className="absolute -top-8 w-4 h-4 bg-green-500 rounded-full opacity-0" />
        
        {/* Stage 3 leaves */}
        <div data-leaf className="absolute -left-8 -top-10 w-5 h-5 bg-green-600 rounded-full opacity-0" />
        <div data-leaf className="absolute -right-8 -top-10 w-5 h-5 bg-green-600 rounded-full opacity-0" />
        <div data-leaf className="absolute -left-2 -top-12 w-5 h-5 bg-green-600 rounded-full opacity-0" />
        <div data-leaf className="absolute -right-2 -top-12 w-5 h-5 bg-green-600 rounded-full opacity-0" />
      </div>
      
      {/* Holographic scan lines */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-green-500/10 to-transparent opacity-50">
        <div className="absolute inset-0 bg-repeating-linear-gradient-to-t from-transparent via-green-500/5 to-transparent bg-repeat" style={{ backgroundSize: '100% 8px' }} />
      </div>
    </div>
  );

  // Render Mountain Hologram
  const renderMountainHologram = () => (
    <div ref={mountainRef} className="relative h-full flex items-end justify-center">
      {/* Mountain outline (low-poly style) */}
      <div className="relative">
        <svg width="200" height="200" viewBox="0 0 200 200" className="text-slate-400">
          <polygon 
            points="20,180 50,120 80,140 100,80 120,100 150,60 180,180" 
            fill="currentColor" 
            fillOpacity="0.3"
            stroke="currentColor"
            strokeWidth="2"
          />
          <polygon 
            points="50,180 80,130 100,110 120,80 140,100 170,180" 
            fill="currentColor" 
            fillOpacity="0.2"
            stroke="currentColor"
            strokeWidth="1"
          />
        </svg>
        
        {/* Altitude lines */}
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i}
              data-altitude
              className="absolute left-0 right-0 h-px bg-primary/50 opacity-0"
              style={{ bottom: `${20 + i * 20}px` }}
            />
          ))}
        </div>
        
        {/* Climbing avatar */}
        <div 
          data-avatar
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-primary rounded-full shadow-lg"
          style={{ 
            boxShadow: '0 0 10px hsl(var(--primary)), 0 0 20px hsl(var(--primary))/50' 
          }}
        >
          {/* Avatar trail effect */}
          <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-30" />
        </div>
        
        {/* Peak glow when nearing completion */}
        {animationProgress > 80 && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-primary/30 rounded-full blur-lg animate-pulse" />
        )}
      </div>
      
      {/* Holographic grid overlay */}
      <div className="absolute inset-0 opacity-20">
        <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
          {[...Array(64)].map((_, i) => (
            <div key={i} className="border border-primary/10" />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Main Card */}
      <motion.div
        ref={cardRef}
        className={`relative group ${isFullscreen ? 'hidden' : ''}`}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="h-[600px] hover-elevate bg-card/95 backdrop-blur-sm border-border/50 overflow-hidden">
          {/* Header */}
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <span>Progress {gamificationType === 'sapling' ? 'Growth' : 'Ascent'}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 h-[500px] flex flex-col">
            {/* Stats Header */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-orbitron font-bold text-primary">{userProgress.level}</div>
                <div className="text-xs text-muted-foreground">Level</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-orbitron font-bold text-chart-2">{userProgress.totalXP.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Total XP</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-orbitron font-bold text-amber-500">{userProgress.currentStreak}</div>
                <div className="text-xs text-muted-foreground">Day Streak</div>
              </div>
            </div>

            {/* Level Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Level {userProgress.level}</span>
                <span>Level {userProgress.level + 1}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-primary to-chart-2"
                  initial={{ width: 0 }}
                  animate={{ width: `${levelProgress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1 text-center">
                {Math.round(levelProgress)}% to next level
              </div>
            </div>

            {/* Hologram Display */}
            <div className="flex-1 mb-6 bg-black/20 rounded-lg border border-primary/20 overflow-hidden">
              {gamificationType === 'sapling' ? renderSaplingHologram() : renderMountainHologram()}
            </div>

            {/* Daily Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Today's Progress</span>
                <span className="text-sm font-semibold">+{userProgress.dailyXP} XP</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-chart-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((userProgress.dailyXP / 2500) * 100 * 7, 100)}%` }}
                />
              </div>
            </div>

            {/* Achievements */}
            {userProgress.achievements && userProgress.achievements.length > 0 && (
              <div className="mt-4">
                <div className="text-xs text-muted-foreground mb-2">Recent Achievements</div>
                <div className="flex flex-wrap gap-1">
                  {userProgress.achievements.slice(0, 3).map((achievement, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      <Trophy className="h-3 w-3 mr-1" />
                      {achievement.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4"
            onClick={toggleFullscreen}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-4xl w-full h-[80vh] bg-card/95 backdrop-blur-sm rounded-lg border border-primary/30 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Fullscreen Header */}
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <h2 className="text-2xl font-orbitron font-bold">
                  {gamificationType === 'sapling' ? '🌱 Growth Progress' : '🏔️ Peak Ascent'}
                </h2>
                <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Fullscreen Content */}
              <div className="p-8 h-[calc(100%-80px)] flex flex-col lg:flex-row gap-8">
                {/* Large Hologram Display */}
                <div className="flex-1 bg-black/30 rounded-lg border border-primary/30 p-8">
                  {gamificationType === 'sapling' ? renderSaplingHologram() : renderMountainHologram()}
                </div>

                {/* Detailed Stats */}
                <div className="lg:w-80 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4">
                      <div className="text-center">
                        <div className="text-3xl font-orbitron font-bold text-primary">{userProgress.level}</div>
                        <div className="text-sm text-muted-foreground">Current Level</div>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-center">
                        <div className="text-3xl font-orbitron font-bold text-chart-2">{userProgress.currentStreak}</div>
                        <div className="text-sm text-muted-foreground">Day Streak</div>
                      </div>
                    </Card>
                  </div>

                  <Card className="p-4">
                    <h3 className="font-semibold mb-4">Experience Points</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total XP</span>
                        <span className="font-orbitron font-bold">{userProgress.totalXP.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Today's XP</span>
                        <span className="font-orbitron font-bold text-primary">+{userProgress.dailyXP}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Next Level</span>
                        <span className="font-orbitron font-bold">{((userProgress.level + 1) * 1000).toLocaleString()}</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h3 className="font-semibold mb-4">All Achievements</h3>
                    <div className="space-y-2">
                      {userProgress.achievements?.map((achievement, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-amber-500" />
                          <span className="text-sm">{achievement.name}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}