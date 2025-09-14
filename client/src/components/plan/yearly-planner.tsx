import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Target, TrendingUp } from 'lucide-react';
import { usePlanContext } from '@/lib/plan-context';
import type { Vision } from '@shared/schema';

interface YearlyPlannerProps {
  currentDate: Date;
}


export default function YearlyPlanner({ currentDate }: YearlyPlannerProps) {
  const { visions, getVisionsForYear, createVision, updateVision, deleteVision } = usePlanContext();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const year = currentDate.getFullYear();
  
  // Animation effects
  useEffect(() => {
    if (!containerRef.current) return;

    gsap.fromTo(containerRef.current, {
      opacity: 0,
      scale: 0.95,
      rotationX: -5,
    }, {
      opacity: 1,
      scale: 1,
      rotationX: 0,
      duration: 0.8,
      ease: 'power2.out',
    });
  }, [currentDate]);

  const PRIORITY_THEMES = {
    foundational: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/50', label: 'Foundation' },
    growth: { color: 'bg-green-500/20 text-green-400 border-green-500/50', label: 'Growth' },
    aspirational: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/50', label: 'Vision' },
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Year Overview */}
      <Card className="bg-card/30 backdrop-blur-md border-primary/30 shadow-lg shadow-primary/10">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary flex items-center gap-2">
            <Target className="w-8 h-8" />
            {year} Vision & Strategic Plan
          </CardTitle>
          <p className="text-muted-foreground text-lg">
            Long-term vision with quarterly milestones and measurable outcomes
          </p>
        </CardHeader>

        <CardContent>
          {/* Year Timeline */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {['Q1', 'Q2', 'Q3', 'Q4'].map((quarter, index) => {
              const isCurrentQuarter = Math.floor(currentDate.getMonth() / 3) === index;
              
              return (
                <motion.div
                  key={quarter}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    p-4 rounded-lg text-center border transition-all
                    ${isCurrentQuarter 
                      ? 'bg-primary/20 border-primary/50 text-primary' 
                      : 'bg-card/20 border-border/30 text-muted-foreground'
                    }
                  `}
                >
                  <Calendar className="w-5 h-5 mx-auto mb-2" />
                  <div className="font-bold text-lg">{quarter}</div>
                  <div className="text-xs mt-1">{year}</div>
                </motion.div>
              );
            })}
          </div>

          {/* Year Stats Placeholder */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">5</div>
              <div className="text-xs text-muted-foreground">Vision Areas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">12</div>
              <div className="text-xs text-muted-foreground">Quarterly Goals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">47</div>
              <div className="text-xs text-muted-foreground">Monthly Targets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">73%</div>
              <div className="text-xs text-muted-foreground">Annual Progress</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vision Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sample vision card - this would be populated with real data */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-card/40 backdrop-blur-sm border-border/30 hover:border-primary/50 transition-all h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-primary">Academic Excellence</h3>
                  <Badge variant="outline" className={PRIORITY_THEMES.foundational.color}>
                    Foundation
                  </Badge>
                </div>
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Establish strong academic foundation with consistent study habits, 
                improved grades, and mastery of core subjects.
              </p>

              {/* Quarterly Breakdown */}
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">Quarterly Milestones</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { quarter: 'Q1', goals: ['Study System', 'Grade Baseline'] },
                    { quarter: 'Q2', goals: ['Advanced Topics', 'Research Skills'] },
                    { quarter: 'Q3', goals: ['Project Work', 'Peer Learning'] },
                    { quarter: 'Q4', goals: ['Mastery Test', 'Knowledge Gap Review'] }
                  ].map(({ quarter, goals }) => (
                    <div key={quarter} className="bg-card/20 p-2 rounded border border-border/20">
                      <div className="text-sm font-medium text-primary">{quarter}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {goals.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metrics */}
              <div className="space-y-2">
                <h4 className="font-semibold text-primary">Key Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">GPA Target</span>
                    <span className="text-sm font-medium text-green-400">3.8/4.0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Study Hours/Week</span>
                    <span className="text-sm font-medium text-yellow-400">25h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Courses Completed</span>
                    <span className="text-sm font-medium text-blue-400">8/10</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Add more vision cards as needed */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-card/20 backdrop-blur-sm border-dashed border-primary/50 hover:border-primary transition-all cursor-pointer h-full flex items-center justify-center">
            <CardContent className="text-center p-8">
              <Target className="w-12 h-12 mx-auto mb-4 text-primary/60" />
              <h3 className="font-semibold text-primary mb-2">Add Vision Area</h3>
              <p className="text-sm text-muted-foreground">
                Define a strategic focus area for {year}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Annual Review Section */}
      <Card className="bg-card/30 backdrop-blur-md border-primary/30">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-primary">Annual Review Framework</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-card/20 rounded-lg border border-border/20">
              <div className="text-3xl mb-2">🎯</div>
              <h4 className="font-semibold text-primary">Goals</h4>
              <p className="text-sm text-muted-foreground mt-1">
                What do you want to achieve?
              </p>
            </div>
            <div className="text-center p-4 bg-card/20 rounded-lg border border-border/20">
              <div className="text-3xl mb-2">📊</div>
              <h4 className="font-semibold text-primary">Metrics</h4>
              <p className="text-sm text-muted-foreground mt-1">
                How will you measure success?
              </p>
            </div>
            <div className="text-center p-4 bg-card/20 rounded-lg border border-border/20">
              <div className="text-3xl mb-2">🔄</div>
              <h4 className="font-semibold text-primary">Review</h4>
              <p className="text-sm text-muted-foreground mt-1">
                When will you assess progress?
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}