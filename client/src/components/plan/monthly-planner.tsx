import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Target } from 'lucide-react';
import { usePlanContext } from '@/lib/plan-context';
import type { Goal } from '@shared/schema';

interface MonthlyPlannerProps {
  currentDate: Date;
}

export default function MonthlyPlanner({ currentDate }: MonthlyPlannerProps) {
  const { goals, getGoalsForMonth, getGoalsForDate, createGoal, updateGoal, deleteGoal } = usePlanContext();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const currentMonth = currentDate.getMonth() + 1; // 1-based month
  const currentYear = currentDate.getFullYear();
  const monthlyGoals = getGoalsForMonth(currentMonth, currentYear);
  
  const gridRef = useRef<HTMLDivElement>(null);

  // Get calendar grid for the month
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return { days, firstDay, lastDay };
  };

  const { days, firstDay, lastDay } = getCalendarDays();

  // Animation effects
  useEffect(() => {
    if (!gridRef.current) return;

    gsap.fromTo(gridRef.current.children, {
      opacity: 0,
      scale: 0.8,
      rotationY: -10,
    }, {
      opacity: 1,
      scale: 1,
      rotationY: 0,
      duration: 0.6,
      stagger: 0.02,
      ease: 'power2.out',
    });
  }, [currentDate]);

  const isInCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    
    // Animate clicked date
    const dateElements = gridRef.current?.children;
    if (dateElements) {
      const dateIndex = days.findIndex(d => 
        d.getDate() === date.getDate() && 
        d.getMonth() === date.getMonth()
      );
      
      if (dateIndex >= 0 && dateElements[dateIndex]) {
        gsap.fromTo(dateElements[dateIndex], {
          scale: 1,
          boxShadow: '0 0 0px rgba(0, 217, 255, 0)',
        }, {
          scale: 1.05,
          boxShadow: '0 0 20px rgba(0, 217, 255, 0.4)',
          duration: 0.3,
          yoyo: true,
          repeat: 1,
          ease: 'power2.inOut',
        });
      }
    }
  };

  const getProgressColor = (goal: Goal) => {
    const currentValue = typeof goal.currentValue === 'string' ? parseFloat(goal.currentValue) : goal.currentValue;
    const targetValue = typeof goal.targetValue === 'string' ? parseFloat(goal.targetValue) : goal.targetValue;
    const progress = (currentValue / targetValue) * 100;
    if (progress >= 80) return 'text-green-400';
    if (progress >= 50) return 'text-yellow-400';
    if (progress >= 20) return 'text-orange-400';
    return 'text-red-400';
  };

  const CATEGORY_COLORS = {
    academic: 'bg-blue-500/20 border-blue-500/50',
    fitness: 'bg-green-500/20 border-green-500/50',
    creative: 'bg-purple-500/20 border-purple-500/50',
    social: 'bg-yellow-500/20 border-yellow-500/50',
    maintenance: 'bg-gray-500/20 border-gray-500/50',
    islamic_studies: 'bg-emerald-500/20 border-emerald-500/50',
    default: 'bg-primary/20 border-primary/50',
  };

  return (
    <Card className="bg-card/30 backdrop-blur-md border-primary/30 shadow-lg shadow-primary/10">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Monthly Goals Overview
        </CardTitle>
        <p className="text-muted-foreground">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Calendar Grid */}
        <div className="space-y-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2" ref={gridRef}>
            {days.map((date, index) => {
              const goalsForDate = getGoalsForDate(date);
              const isCurrentMonth = isInCurrentMonth(date);
              const isCurrentDay = isToday(date);
              
              return (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDateClick(date)}
                  className={`
                    relative h-20 p-2 rounded-lg border cursor-pointer transition-all
                    ${isCurrentMonth ? 'bg-card/50 border-border/30' : 'bg-card/20 border-border/20 opacity-60'}
                    ${isCurrentDay ? 'ring-2 ring-primary/50 bg-primary/10' : ''}
                    ${selectedDate?.getDate() === date.getDate() && selectedDate?.getMonth() === date.getMonth() ? 'bg-primary/20' : ''}
                    hover:bg-card/70 hover:border-primary/30
                  `}
                >
                  <div className="text-sm font-medium text-foreground">
                    {date.getDate()}
                  </div>
                  
                  {/* Goal indicators */}
                  <div className="mt-1 space-y-1">
                    {goalsForDate.slice(0, 2).map(goal => {
                      const currentValue = typeof goal.currentValue === 'string' ? parseFloat(goal.currentValue) : goal.currentValue;
                      const targetValue = typeof goal.targetValue === 'string' ? parseFloat(goal.targetValue) : goal.targetValue;
                      const progress = (currentValue / targetValue) * 100;
                      return (
                        <div
                          key={goal.id}
                          className={`
                            text-xs px-1 py-0.5 rounded truncate
                            ${CATEGORY_COLORS[goal.category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.default}
                          `}
                          title={goal.title}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate flex-1">{goal.title}</span>
                            <span className={`text-xs ${getProgressColor(goal)}`}>
                              {Math.round(progress)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    
                    {goalsForDate.length > 2 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{goalsForDate.length - 2} more
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Monthly Goals Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {monthlyGoals.slice(0, 6).map(goal => {
            const currentValue = typeof goal.currentValue === 'string' ? parseFloat(goal.currentValue) : goal.currentValue;
            const targetValue = typeof goal.targetValue === 'string' ? parseFloat(goal.targetValue) : goal.targetValue;
            const progress = (currentValue / targetValue) * 100;
            
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card/40 backdrop-blur-sm rounded-lg p-4 border border-border/30 hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-primary">{goal.title}</h3>
                    <p className="text-sm text-muted-foreground">{goal.category.replace('_', ' ')}</p>
                  </div>
                  <Badge variant="outline" className={getProgressColor(goal)}>
                    {Math.round(progress)}%
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span>{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
                  </div>
                  
                  <div className="w-full bg-muted/30 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progress, 100)}%` }}
                      transition={{ duration: 0.8, ease: 'power2.out' }}
                      className={`h-2 rounded-full ${
                        progress >= 80 ? 'bg-green-400' :
                        progress >= 50 ? 'bg-yellow-400' :
                        progress >= 20 ? 'bg-orange-400' : 'bg-red-400'
                      }`}
                    />
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Due: {new Date(goal.deadline).toLocaleDateString()}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Add Goal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="outline"
            className="w-full border-primary/30 text-primary hover:bg-primary/10 border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Monthly Goal
          </Button>
        </motion.div>

        {/* Monthly Stats */}
        <div className="grid grid-cols-4 gap-4 pt-4 border-t border-border/30">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{goals.length}</div>
            <div className="text-xs text-muted-foreground">Total Goals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {goals.filter(g => (g.currentValue / g.targetValue) >= 1).length}
            </div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {goals.filter(g => {
                const progress = (g.currentValue / g.targetValue);
                return progress >= 0.5 && progress < 1;
              }).length}
            </div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {goals.length > 0 ? Math.round(
                goals.reduce((sum, goal) => sum + (goal.currentValue / goal.targetValue), 0) / goals.length * 100
              ) : 0}%
            </div>
            <div className="text-xs text-muted-foreground">Avg Progress</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}