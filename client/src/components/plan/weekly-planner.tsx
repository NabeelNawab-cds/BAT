import { useState, useRef, useEffect } from 'react';
import { usePlanContext } from '@/lib/plan-context';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Plus, Edit3, Trash2, CheckCircle2 } from 'lucide-react';

interface WeeklyPlannerProps {
  currentDate: Date;
}

interface PlanTask {
  id: string;
  title: string;
  description?: string;
  domain: 'academic' | 'fitness' | 'creative' | 'social' | 'maintenance' | 'islamic_studies';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedHours: number;
  isCompleted: boolean;
  dueDate: string;
  xpReward: number;
  templateData?: any;
}

const DOMAIN_COLORS = {
  academic: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  fitness: 'bg-green-500/20 text-green-400 border-green-500/30',
  creative: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  social: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  maintenance: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  islamic_studies: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const PRIORITY_COLORS = {
  low: 'border-l-gray-400',
  medium: 'border-l-yellow-400',
  high: 'border-l-orange-400',
  urgent: 'border-l-red-400',
};

export default function WeeklyPlanner({ currentDate }: WeeklyPlannerProps) {
  const { tasks, getTasksForHour, rescheduleTask, completeTask } = usePlanContext();
  const [draggedTask, setDraggedTask] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'5day' | '7day'>('7day');
  
  const gridRef = useRef<HTMLDivElement>(null);

  // Generate week days based on current date and view mode
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    
    // Adjust to start on Monday
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(startOfWeek.getDate() + mondayOffset);

    const days = [];
    const totalDays = viewMode === '5day' ? 5 : 7;

    for (let i = 0; i < totalDays; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }

    return days;
  };

  const weekDays = getWeekDays();
  const timeSlots = Array.from({ length: 24 }, (_, i) => i);

  // Animation effects
  useEffect(() => {
    if (!gridRef.current) return;

    gsap.fromTo(gridRef.current.children, {
      opacity: 0,
      y: 20,
      scale: 0.95,
    }, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.5,
      stagger: 0.05,
      ease: 'power2.out',
    });
  }, [weekDays, viewMode]);

  const handleDragStart = (e: React.DragEvent, task: PlanTask) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetDate: Date, targetHour: number) => {
    e.preventDefault();
    if (!draggedTask) return;

    try {
      // Reschedule task using PlanContext
      await rescheduleTask(draggedTask.id, targetDate, targetHour);

      // Animate the drop
      const dropTarget = e.currentTarget as HTMLElement;
      gsap.fromTo(dropTarget, {
        scale: 1.05,
        backgroundColor: 'rgba(0, 217, 255, 0.1)',
      }, {
        scale: 1,
        backgroundColor: 'transparent',
        duration: 0.3,
        ease: 'power2.out',
      });
    } catch (error) {
      console.error('Failed to reschedule task:', error);
    } finally {
      setDraggedTask(null);
    }
  };

  const toggleTaskCompletion = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      if (!task.isCompleted) {
        // Complete the task - prompt for actual hours
        const estimatedHours = typeof task.estimatedHours === 'string' 
          ? parseFloat(task.estimatedHours) 
          : task.estimatedHours;
        const actualHours = prompt(
          `How many hours did you spend on "${task.title}"?`, 
          estimatedHours.toString()
        );
        
        if (actualHours !== null) {
          await completeTask(taskId, parseFloat(actualHours) || estimatedHours);
          
          // Trigger completion animation
          gsap.fromTo(`.task-${taskId}`, {
            scale: 1,
          }, {
            scale: 1.1,
            duration: 0.2,
            yoyo: true,
            repeat: 1,
            ease: 'power2.inOut',
          });
        }
      }
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
    }
  };

  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const getTasksForDateAndHour = (date: Date, hour: number) => {
    return getTasksForHour(date, hour);
  };

  return (
    <Card className="bg-card/30 backdrop-blur-md border-primary/30 shadow-lg shadow-primary/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-primary">
            Weekly Mission Planning
          </CardTitle>
          
          {/* View Toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === '5day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('5day')}
              className="border-primary/30"
            >
              5-Day
            </Button>
            <Button
              variant={viewMode === '7day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('7day')}
              className="border-primary/30"
            >
              7-Day
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-8 gap-2 h-[600px] overflow-y-auto" ref={gridRef}>
          {/* Time column */}
          <div className="border-r border-border/30">
            <div className="h-12 border-b border-border/30"></div>
            {timeSlots.map(hour => (
              <div
                key={hour}
                className="h-12 px-2 py-1 text-xs text-muted-foreground border-b border-border/20 flex items-center"
              >
                {formatTime(hour)}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIndex) => (
            <div key={dayIndex} className="border-r border-border/20 last:border-r-0">
              {/* Day header */}
              <div className="h-12 border-b border-border/30 p-2 text-center">
                <div className="text-sm font-medium text-primary">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="text-xs text-muted-foreground">
                  {day.getDate()}
                </div>
              </div>

              {/* Hour slots */}
              {timeSlots.map(hour => {
                const tasksInSlot = getTasksForDateAndHour(day, hour);
                
                return (
                  <div
                    key={hour}
                    className="h-12 border-b border-border/20 p-1 relative hover:bg-primary/5 transition-colors"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, day, hour)}
                  >
                    <AnimatePresence>
                      {tasksInSlot.map(task => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          draggable
                          onDragStart={(e) => handleDragStart(e as any, task)}
                          className={`
                            task-${task.id} absolute inset-1 rounded p-1 text-xs cursor-move
                            border-l-2 ${PRIORITY_COLORS[task.priority]}
                            ${task.isCompleted ? 'opacity-60 line-through' : ''}
                            bg-card/80 backdrop-blur-sm border border-border/30
                            hover:shadow-lg hover:shadow-primary/20 transition-all
                            flex items-center justify-between group
                          `}
                          style={{
                            minHeight: `${task.estimatedHours * 48 - 8}px`,
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate text-primary">
                              {task.title}
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-xs ${DOMAIN_COLORS[task.domain]} mt-1`}
                            >
                              {task.domain.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleTaskCompletion(task.id)}
                              className="h-6 w-6 p-0"
                            >
                              <CheckCircle2 className={`w-3 h-3 ${task.isCompleted ? 'text-green-400' : 'text-muted-foreground'}`} />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{tasks.length}</div>
            <div className="text-xs text-muted-foreground">Total Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{tasks.filter(t => t.isCompleted).length}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {tasks.reduce((sum, task) => sum + task.estimatedHours, 0)}h
            </div>
            <div className="text-xs text-muted-foreground">Planned Hours</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {tasks.reduce((sum, task) => task.isCompleted ? sum + task.xpReward : sum, 0)}
            </div>
            <div className="text-xs text-muted-foreground">XP Earned</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}