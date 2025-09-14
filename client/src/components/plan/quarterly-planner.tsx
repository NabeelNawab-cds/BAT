import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, Calendar, Plus } from 'lucide-react';
import { usePlanContext } from '@/lib/plan-context';
import type { Objective } from '@shared/schema';

interface QuarterlyPlannerProps {
  currentDate: Date;
}


const CATEGORY_THEMES = {
  academic: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/50', icon: '📚' },
  fitness: { color: 'bg-green-500/20 text-green-400 border-green-500/50', icon: '💪' },
  creative: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/50', icon: '🎨' },
  social: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50', icon: '👥' },
  maintenance: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/50', icon: '⚙️' },
  islamic_studies: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50', icon: '🕌' },
  career: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/50', icon: '💼' },
};

export default function QuarterlyPlanner({ currentDate }: QuarterlyPlannerProps) {
  const { objectives, getObjectivesForQuarter, createObjective, updateObjective, deleteObjective } = usePlanContext();
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Get current quarter info
  const getCurrentQuarter = () => {
    const month = currentDate.getMonth();
    const quarter = Math.floor(month / 3) + 1;
    const year = currentDate.getFullYear();
    
    const quarterStart = new Date(year, (quarter - 1) * 3, 1);
    const quarterEnd = new Date(year, quarter * 3, 0);
    
    return {
      quarter,
      year,
      quarterStart,
      quarterEnd,
      label: `Q${quarter} ${year}`,
      monthsInQuarter: [
        new Date(year, (quarter - 1) * 3, 1),
        new Date(year, (quarter - 1) * 3 + 1, 1),
        new Date(year, (quarter - 1) * 3 + 2, 1),
      ]
    };
  };

  const quarterInfo = getCurrentQuarter();

  // Animation effects
  useEffect(() => {
    if (!containerRef.current) return;

    const tl = gsap.timeline();
    
    tl.fromTo(containerRef.current, {
      opacity: 0,
      rotationY: -20,
      scale: 0.9,
    }, {
      opacity: 1,
      rotationY: 0,
      scale: 1,
      duration: 0.8,
      ease: 'power2.out',
    });

    // Animate objective cards
    const cards = containerRef.current.querySelectorAll('.objective-card');
    if (cards.length > 0) {
      gsap.fromTo(cards, {
        opacity: 0,
        y: 50,
        scale: 0.9,
      }, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        stagger: 0.15,
        delay: 0.3,
        ease: 'power2.out',
      });
    }
  }, [currentDate]);

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'bg-green-400';
    if (progress >= 70) return 'bg-yellow-400';
    if (progress >= 40) return 'bg-orange-400';
    return 'bg-red-400';
  };

  const getTimeRemaining = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Overdue', color: 'text-red-400' };
    if (diffDays === 0) return { text: 'Due Today', color: 'text-orange-400' };
    if (diffDays <= 7) return { text: `${diffDays} days left`, color: 'text-yellow-400' };
    return { text: `${diffDays} days left`, color: 'text-green-400' };
  };

  const getCompletedMilestonesCount = (objective: QuarterlyObjective) => {
    return objective.milestones.filter(m => m.isCompleted).length;
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Quarter Overview Header */}
      <Card className="bg-card/30 backdrop-blur-md border-primary/30 shadow-lg shadow-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <Target className="w-6 h-6" />
            Strategic Quarterly Planning
          </CardTitle>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              {quarterInfo.label} • {quarterInfo.quarterStart.toLocaleDateString()} - {quarterInfo.quarterEnd.toLocaleDateString()}
            </p>
            <Badge variant="outline" className="text-primary border-primary/50">
              {objectives.length} Active Objectives
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {/* Quarter Timeline */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {quarterInfo.monthsInQuarter.map((month, index) => {
              const monthName = month.toLocaleDateString('en-US', { month: 'long' });
              const isCurrentMonth = month.getMonth() === currentDate.getMonth();
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    p-4 rounded-lg text-center border transition-all
                    ${isCurrentMonth 
                      ? 'bg-primary/20 border-primary/50 text-primary' 
                      : 'bg-card/20 border-border/30 text-muted-foreground'
                    }
                  `}
                >
                  <Calendar className="w-5 h-5 mx-auto mb-2" />
                  <div className="font-medium">{monthName}</div>
                  <div className="text-xs mt-1">
                    {objectives.filter(obj => {
                      const objMonth = new Date(obj.deadline).getMonth();
                      return objMonth === month.getMonth();
                    }).length} objectives
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Quarter Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{objectives.length}</div>
              <div className="text-xs text-muted-foreground">Total Objectives</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {objectives.filter(obj => (obj.currentProgress / obj.targetMetric) >= 1).length}
              </div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {objectives.filter(obj => {
                  const progress = obj.currentProgress / obj.targetMetric;
                  return progress >= 0.5 && progress < 1;
                }).length}
              </div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {objectives.length > 0 ? Math.round(
                  objectives.reduce((sum, obj) => sum + (obj.currentProgress / obj.targetMetric), 0) / objectives.length * 100
                ) : 0}%
              </div>
              <div className="text-xs text-muted-foreground">Avg Progress</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Objectives Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {objectives.map((objective) => {
          const progress = Math.min((objective.currentProgress / objective.targetMetric) * 100, 100);
          const theme = CATEGORY_THEMES[objective.category];
          const timeRemaining = getTimeRemaining(objective.deadline);
          const completedMilestones = getCompletedMilestonesCount(objective);
          
          return (
            <motion.div
              key={objective.id}
              className="objective-card"
              whileHover={{ scale: 1.02, rotateY: 1 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className={`
                bg-card/40 backdrop-blur-sm border-border/30 hover:border-primary/50 
                transition-all duration-300 cursor-pointer h-full
                ${selectedObjective?.id === objective.id ? 'ring-2 ring-primary/50' : ''}
              `}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{theme.icon}</span>
                      <div>
                        <h3 className="font-semibold text-primary line-clamp-2">{objective.title}</h3>
                        <Badge variant="outline" className={`text-xs ${theme.color} mt-1`}>
                          {objective.category.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${timeRemaining.color}`}>
                        {timeRemaining.text}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {objective.description}
                  </p>

                  {/* Progress Metrics */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Progress</span>
                      <span className="text-sm font-medium">
                        {objective.currentProgress} / {objective.targetMetric} {objective.unit}
                      </span>
                    </div>
                    
                    <Progress 
                      value={progress} 
                      className={`h-2 ${getProgressColor(progress)}`}
                    />
                    
                    <div className="text-center">
                      <span className={`text-lg font-bold ${
                        progress >= 90 ? 'text-green-400' :
                        progress >= 70 ? 'text-yellow-400' :
                        progress >= 40 ? 'text-orange-400' : 'text-red-400'
                      }`}>
                        {Math.round(progress)}%
                      </span>
                    </div>
                  </div>

                  {/* Milestones Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Milestones</span>
                      <span className="text-sm">
                        {completedMilestones} / {objective.milestones.length}
                      </span>
                    </div>
                    
                    <div className="flex gap-1">
                      {objective.milestones.map((milestone, index) => (
                        <div
                          key={milestone.id}
                          className={`
                            h-2 flex-1 rounded-full transition-colors
                            ${milestone.isCompleted ? 'bg-green-400' : 'bg-muted/30'}
                          `}
                          title={milestone.title}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-primary/30 text-primary hover:bg-primary/10"
                      onClick={() => setSelectedObjective(objective)}
                    >
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-primary/30 text-primary hover:bg-primary/10"
                    >
                      Update
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {/* Add New Objective Card */}
        <motion.div
          className="objective-card"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card className="bg-card/20 backdrop-blur-sm border-dashed border-primary/50 hover:border-primary transition-all duration-300 cursor-pointer h-full flex items-center justify-center">
            <CardContent className="text-center p-8">
              <Plus className="w-12 h-12 mx-auto mb-4 text-primary/60" />
              <h3 className="font-semibold text-primary mb-2">Add New Objective</h3>
              <p className="text-sm text-muted-foreground">
                Define a strategic goal for this quarter
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Objective Details Modal - Simple for now */}
      <AnimatePresence>
        {selectedObjective && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedObjective(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card/95 backdrop-blur-md rounded-lg border border-border/50 p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold text-primary mb-4">{selectedObjective.title}</h3>
              <p className="text-muted-foreground mb-6">{selectedObjective.description}</p>
              
              <div className="space-y-4">
                {selectedObjective.milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className={`
                      p-3 rounded border transition-all
                      ${milestone.isCompleted 
                        ? 'bg-green-500/20 border-green-500/50 text-green-400' 
                        : 'bg-card/50 border-border/30'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className={milestone.isCompleted ? 'line-through' : ''}>{milestone.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(milestone.targetDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                className="mt-6 w-full border-primary/30"
                onClick={() => setSelectedObjective(null)}
              >
                Close
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}