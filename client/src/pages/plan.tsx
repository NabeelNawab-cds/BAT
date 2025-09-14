import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Target, Trophy, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

import { PlanProvider } from '@/lib/plan-context';
import WeeklyPlanner from '@/components/plan/weekly-planner';
import MonthlyPlanner from '@/components/plan/monthly-planner';
import QuarterlyPlanner from '@/components/plan/quarterly-planner';
import YearlyPlanner from '@/components/plan/yearly-planner';
import TaskTemplateModal from '@/components/plan/task-template-modal';
import PlanAnalytics from '@/components/plan/plan-analytics';

type PlanView = 'week' | 'month' | 'quarter' | 'year';

interface PlanPageProps {}

function PlanPageContent({}: PlanPageProps) {
  const [activeView, setActiveView] = useState<PlanView>('week');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const containerRef = useRef<HTMLDivElement>(null);
  const viewContentRef = useRef<HTMLDivElement>(null);

  // Entrance animation effect
  useEffect(() => {
    if (!containerRef.current) return;

    // Holographic wave entry animation
    const tl = gsap.timeline();
    
    tl.fromTo(containerRef.current, {
      opacity: 0,
      scale: 0.9,
      rotationY: -15,
    }, {
      opacity: 1,
      scale: 1,
      rotationY: 0,
      duration: 0.8,
      ease: 'power2.out',
    });

    // Stagger child elements
    const cards = containerRef.current.querySelectorAll('.plan-card, .plan-tab');
    if (cards.length > 0) {
      gsap.fromTo(cards, {
        opacity: 0,
        y: 30,
        rotationX: -10,
      }, {
        opacity: 1,
        y: 0,
        rotationX: 0,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.1,
        delay: 0.3,
      });
    }
  }, []);

  // View transition animation
  const handleViewChange = (newView: PlanView) => {
    if (newView === activeView || !viewContentRef.current) return;

    // Animate out current view
    gsap.to(viewContentRef.current, {
      opacity: 0,
      scale: 0.95,
      rotationY: 10,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        setActiveView(newView);
        
        // Animate in new view
        gsap.fromTo(viewContentRef.current, {
          opacity: 0,
          scale: 1.05,
          rotationY: -10,
        }, {
          opacity: 1,
          scale: 1,
          rotationY: 0,
          duration: 0.4,
          ease: 'power2.out',
        });
      }
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (activeView) {
      case 'week':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'quarter':
        newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 3 : -3));
        break;
      case 'year':
        newDate.setFullYear(currentDate.getFullYear() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const getDateRangeText = () => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
      day: 'numeric'
    });

    switch (activeView) {
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${formatter.format(weekStart)} - ${formatter.format(weekEnd)}`;
      
      case 'month':
        return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate);
      
      case 'quarter':
        const quarter = Math.floor(currentDate.getMonth() / 3) + 1;
        return `Q${quarter} ${currentDate.getFullYear()}`;
      
      case 'year':
        return currentDate.getFullYear().toString();
      
      default:
        return '';
    }
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 p-6"
      style={{ perspective: '1000px' }}
    >
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-4xl font-bold font-orbitron tracking-wider text-primary mb-2">
            MISSION PLANNING
          </h1>
          <p className="text-muted-foreground text-lg">
            Strategic command center for your productivity missions
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-4">
          <Card className="plan-card bg-card/50 backdrop-blur-sm border-primary/20">
            <CardContent className="p-4 text-center">
              <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-primary">1,247</div>
              <div className="text-xs text-muted-foreground">Total XP</div>
            </CardContent>
          </Card>
          
          <Card className="plan-card bg-card/50 backdrop-blur-sm border-primary/20">
            <CardContent className="p-4 text-center">
              <Target className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-primary">78%</div>
              <div className="text-xs text-muted-foreground">Weekly Goal</div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Navigation & View Controls */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <Card className="plan-card bg-card/30 backdrop-blur-md border-primary/30 shadow-lg shadow-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              
              {/* View Toggle Tabs */}
              <Tabs 
                value={activeView} 
                onValueChange={(value) => handleViewChange(value as PlanView)}
                className="flex-1"
              >
                <TabsList className="plan-tab bg-muted/20 backdrop-blur-sm">
                  <TabsTrigger value="week" className="plan-tab font-medium">Week</TabsTrigger>
                  <TabsTrigger value="month" className="plan-tab font-medium">Month</TabsTrigger>
                  <TabsTrigger value="quarter" className="plan-tab font-medium">Quarter</TabsTrigger>
                  <TabsTrigger value="year" className="plan-tab font-medium">Year</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Date Navigation */}
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateDate('prev')}
                  className="hover:bg-primary/10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="text-center min-w-[200px]">
                  <div className="text-lg font-semibold text-primary">
                    {getDateRangeText()}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateDate('next')}
                  className="hover:bg-primary/10"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                  className="ml-4 border-primary/30 text-primary hover:bg-primary/10"
                >
                  Today
                </Button>
              </div>

              {/* Add Task Button */}
              <Button
                onClick={() => setShowTemplateModal(true)}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Mission
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Planning View */}
      <div ref={viewContentRef} className="mb-6">
        <AnimatePresence mode="wait">
          {activeView === 'week' && (
            <motion.div
              key="week"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <WeeklyPlanner currentDate={currentDate} />
            </motion.div>
          )}

          {activeView === 'month' && (
            <motion.div
              key="month"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <MonthlyPlanner currentDate={currentDate} />
            </motion.div>
          )}

          {activeView === 'quarter' && (
            <motion.div
              key="quarter"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <QuarterlyPlanner currentDate={currentDate} />
            </motion.div>
          )}

          {activeView === 'year' && (
            <motion.div
              key="year"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <YearlyPlanner currentDate={currentDate} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Analytics Mini-Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <PlanAnalytics />
      </motion.div>

      {/* Task Template Modal */}
      <TaskTemplateModal
        open={showTemplateModal}
        onOpenChange={setShowTemplateModal}
        onTaskCreated={() => {
          // Task is automatically created and synced via PlanContext
          console.log('Mission template completed successfully');
        }}
      />
    </div>
  );
}

export default function PlanPage(props: PlanPageProps) {
  return (
    <PlanProvider>
      <PlanPageContent {...props} />
    </PlanProvider>
  );
}