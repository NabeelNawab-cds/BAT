import { useState, useEffect, useCallback } from 'react';

// XP System Configuration
export interface XPConfig {
  baseXPPerLevel: number;
  levelMultiplier: number;
  maxLevel: number;
  priorityMultipliers: Record<string, number>;
  domainMultipliers: Record<string, number>;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  requirement: {
    type: 'level' | 'xp' | 'streak' | 'tasks' | 'domain_tasks';
    value: number;
    domain?: string;
  };
}

export interface UserProgress {
  totalXP: number;
  level: number;
  currentLevelXP: number;
  xpToNextLevel: number;
  currentStreak: number;
  dailyXP: number;
  weeklyXP: number;
  monthlyXP: number;
  achievements: Achievement[];
  lastActivityDate: Date;
}

// Default XP Configuration
const DEFAULT_XP_CONFIG: XPConfig = {
  baseXPPerLevel: 1000,
  levelMultiplier: 1.1,
  maxLevel: 100,
  priorityMultipliers: {
    low: 1.0,
    medium: 1.5,
    high: 2.0,
    urgent: 3.0,
  },
  domainMultipliers: {
    academic: 1.0,
    fitness: 1.2,
    creative: 1.1,
    social: 1.0,
    maintenance: 0.8,
  },
};

// Available Achievements
const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Complete your first task',
    icon: '🚀',
    requirement: { type: 'tasks', value: 1 },
  },
  {
    id: 'level_up',
    name: 'Leveling Up',
    description: 'Reach level 5',
    icon: '⬆️',
    requirement: { type: 'level', value: 5 },
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    requirement: { type: 'streak', value: 7 },
  },
  {
    id: 'peak_climber',
    name: 'Peak Climber',
    description: 'Reach level 10',
    icon: '🏔️',
    requirement: { type: 'level', value: 10 },
  },
  {
    id: 'xp_master',
    name: 'XP Master',
    description: 'Earn 10,000 XP',
    icon: '💎',
    requirement: { type: 'xp', value: 10000 },
  },
  {
    id: 'academic_focus',
    name: 'Academic Focus',
    description: 'Complete 20 academic tasks',
    icon: '📚',
    requirement: { type: 'domain_tasks', value: 20, domain: 'academic' },
  },
  {
    id: 'fitness_enthusiast',
    name: 'Fitness Enthusiast',
    description: 'Complete 15 fitness tasks',
    icon: '💪',
    requirement: { type: 'domain_tasks', value: 15, domain: 'fitness' },
  },
  {
    id: 'creative_mind',
    name: 'Creative Mind',
    description: 'Complete 10 creative tasks',
    icon: '🎨',
    requirement: { type: 'domain_tasks', value: 10, domain: 'creative' },
  },
];

// XP Calculation Functions
export class XPSystem {
  private config: XPConfig;
  
  constructor(config: XPConfig = DEFAULT_XP_CONFIG) {
    this.config = config;
  }

  // Calculate XP required for a specific level
  calculateXPForLevel(level: number): number {
    if (level <= 1) return 0;
    
    let totalXP = 0;
    for (let i = 1; i < level; i++) {
      totalXP += Math.floor(this.config.baseXPPerLevel * Math.pow(this.config.levelMultiplier, i - 1));
    }
    return totalXP;
  }

  // Calculate current level from total XP
  calculateLevelFromXP(totalXP: number): number {
    let level = 1;
    while (level < this.config.maxLevel && this.calculateXPForLevel(level + 1) <= totalXP) {
      level++;
    }
    return level;
  }

  // Calculate XP progress within current level
  calculateLevelProgress(totalXP: number): { currentLevelXP: number; xpToNextLevel: number; progressPercent: number } {
    const currentLevel = this.calculateLevelFromXP(totalXP);
    const currentLevelRequiredXP = this.calculateXPForLevel(currentLevel);
    const nextLevelRequiredXP = this.calculateXPForLevel(currentLevel + 1);
    
    const currentLevelXP = totalXP - currentLevelRequiredXP;
    const xpToNextLevel = nextLevelRequiredXP - totalXP;
    const progressPercent = (currentLevelXP / (nextLevelRequiredXP - currentLevelRequiredXP)) * 100;
    
    return {
      currentLevelXP,
      xpToNextLevel,
      progressPercent: Math.min(progressPercent, 100),
    };
  }

  // Calculate XP reward for task completion
  calculateTaskXP(
    priority: string,
    domain: string,
    estimatedHours: number,
    actualHours?: number
  ): number {
    const hours = actualHours || estimatedHours;
    const priorityMultiplier = this.config.priorityMultipliers[priority] || 1.0;
    const domainMultiplier = this.config.domainMultipliers[domain] || 1.0;
    
    // Base XP: 50 XP per hour
    const baseXP = 50 * hours;
    const totalXP = Math.round(baseXP * priorityMultiplier * domainMultiplier);
    
    return Math.max(totalXP, 10); // Minimum 10 XP per task
  }

  // Check for new achievements
  checkAchievements(
    currentProgress: UserProgress,
    taskStats: {
      totalTasks: number;
      domainTaskCounts: Record<string, number>;
    }
  ): Achievement[] {
    const newAchievements: Achievement[] = [];
    const unlockedIds = new Set(currentProgress.achievements.map(a => a.id));

    for (const achievement of ACHIEVEMENTS) {
      if (unlockedIds.has(achievement.id)) continue;

      let unlocked = false;
      const req = achievement.requirement;

      switch (req.type) {
        case 'level':
          unlocked = currentProgress.level >= req.value;
          break;
        case 'xp':
          unlocked = currentProgress.totalXP >= req.value;
          break;
        case 'streak':
          unlocked = currentProgress.currentStreak >= req.value;
          break;
        case 'tasks':
          unlocked = taskStats.totalTasks >= req.value;
          break;
        case 'domain_tasks':
          unlocked = !!(req.domain && (taskStats.domainTaskCounts[req.domain] || 0) >= req.value);
          break;
      }

      if (unlocked) {
        newAchievements.push({
          ...achievement,
          unlockedAt: new Date(),
        });
      }
    }

    return newAchievements;
  }

  // Calculate streak based on activity dates
  calculateStreak(activityDates: Date[]): number {
    if (activityDates.length === 0) return 0;

    const sortedDates = activityDates
      .map(date => new Date(date.getFullYear(), date.getMonth(), date.getDate()))
      .sort((a, b) => b.getTime() - a.getTime());

    let streak = 1;
    let currentDate = sortedDates[0];

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(currentDate);
      prevDate.setDate(prevDate.getDate() - 1);

      if (sortedDates[i].getTime() === prevDate.getTime()) {
        streak++;
        currentDate = sortedDates[i];
      } else {
        break;
      }
    }

    return streak;
  }
}

// React Hook for XP System
export function useXPSystem() {
  const [userProgress, setUserProgress] = useState<UserProgress>({
    totalXP: 7245,
    level: 12,
    currentLevelXP: 245,
    xpToNextLevel: 755,
    currentStreak: 7,
    dailyXP: 325,
    weeklyXP: 1850,
    monthlyXP: 7245,
    achievements: [
      { ...ACHIEVEMENTS[0], unlockedAt: new Date() },
      { ...ACHIEVEMENTS[2], unlockedAt: new Date() },
      { ...ACHIEVEMENTS[3], unlockedAt: new Date() },
    ],
    lastActivityDate: new Date(),
  });

  const [xpSystem] = useState(() => new XPSystem());

  // Update progress when XP changes
  const updateProgress = useCallback((newXP: number) => {
    const level = xpSystem.calculateLevelFromXP(newXP);
    const levelProgress = xpSystem.calculateLevelProgress(newXP);
    
    setUserProgress(prev => ({
      ...prev,
      totalXP: newXP,
      level,
      currentLevelXP: levelProgress.currentLevelXP,
      xpToNextLevel: levelProgress.xpToNextLevel,
    }));
  }, [xpSystem]);

  // Award XP for task completion
  const awardTaskXP = useCallback((
    priority: string,
    domain: string,
    estimatedHours: number,
    actualHours?: number
  ) => {
    const xpGained = xpSystem.calculateTaskXP(priority, domain, estimatedHours, actualHours);
    const newTotalXP = userProgress.totalXP + xpGained;
    
    // Update daily/weekly XP
    const today = new Date();
    const isToday = userProgress.lastActivityDate.toDateString() === today.toDateString();
    
    setUserProgress(prev => {
      const level = xpSystem.calculateLevelFromXP(newTotalXP);
      const levelProgress = xpSystem.calculateLevelProgress(newTotalXP);
      
      return {
        ...prev,
        totalXP: newTotalXP,
        level,
        currentLevelXP: levelProgress.currentLevelXP,
        xpToNextLevel: levelProgress.xpToNextLevel,
        dailyXP: isToday ? prev.dailyXP + xpGained : xpGained,
        weeklyXP: prev.weeklyXP + xpGained,
        monthlyXP: prev.monthlyXP + xpGained,
        lastActivityDate: today,
      };
    });

    return xpGained;
  }, [userProgress, xpSystem]);

  // Check and unlock achievements
  const checkAchievements = useCallback((taskStats: { totalTasks: number; domainTaskCounts: Record<string, number> }) => {
    const newAchievements = xpSystem.checkAchievements(userProgress, taskStats);
    
    if (newAchievements.length > 0) {
      setUserProgress(prev => ({
        ...prev,
        achievements: [...prev.achievements, ...newAchievements],
      }));
    }

    return newAchievements;
  }, [userProgress, xpSystem]);

  // Get level progress percentage
  const getLevelProgressPercent = useCallback(() => {
    const progress = xpSystem.calculateLevelProgress(userProgress.totalXP);
    return progress.progressPercent;
  }, [userProgress.totalXP, xpSystem]);

  return {
    userProgress,
    awardTaskXP,
    checkAchievements,
    getLevelProgressPercent,
    updateProgress,
    xpSystem,
  };
}