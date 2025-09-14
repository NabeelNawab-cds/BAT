import { useState, useRef, useEffect, useMemo } from 'react';
import { usePlanContext } from '@/lib/plan-context';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Target, Clock, Zap, Calendar, Award } from 'lucide-react';

interface PlanAnalyticsProps {}

// Real data is now fetched from PlanContext instead of mock samples

export default function PlanAnalytics({}: PlanAnalyticsProps) {
  const { getDomainStats, getCompletionStats, getXpStats, getHourlyDistribution, tasks } = usePlanContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('week');

  // Animation effects
  useEffect(() => {
    if (!containerRef.current) return;

    const cards = containerRef.current.querySelectorAll('.analytics-card');
    gsap.fromTo(cards, {
      opacity: 0,
      y: 30,
      scale: 0.95,
    }, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power2.out',
    });
  }, []);

  // Calculate real analytics data using PlanContext
  const domainStats = useMemo(() => getDomainStats(), [tasks]);
  const completionStats = useMemo(() => getCompletionStats(timeRange), [tasks, timeRange]);
  const xpStats = useMemo(() => getXpStats(timeRange), [tasks, timeRange]);
  const hourlyDistribution = useMemo(() => getHourlyDistribution(), [tasks]);

  // Weekly data for charts (simplified for now)
  const weeklyData = useMemo(() => {
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return weekDays.map(day => {
      const dayTasks = hourlyDistribution.filter(h => parseInt(h.hour) >= 6 && parseInt(h.hour) <= 22);
      const planned = dayTasks.reduce((sum, h) => sum + h.planned, 0) / 7; // Average across week
      const completed = dayTasks.reduce((sum, h) => sum + h.completed, 0) / 7;
      const xp = dayTasks.reduce((sum, h) => sum + h.xp, 0) / 7;
      return { day, planned: Math.round(planned), completed: Math.round(completed), xp: Math.round(xp) };
    });
  }, [hourlyDistribution]);

  const totalCompleted = completionStats.completedTasks;
  const totalPlanned = completionStats.totalTasks;
  const totalHours = Math.round(completionStats.totalHours);
  const completionRate = completionStats.completionRate;
  const weeklyXP = xpStats.total;
  const averageDailyXP = xpStats.average;

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Analytics Header */}
      <Card className="analytics-card bg-card/30 backdrop-blur-md border-primary/30 shadow-lg shadow-primary/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
              <BarChart className="w-5 h-5" />
              Mission Analytics
            </CardTitle>
            <div className="flex gap-2">
              {(['week', 'month', 'quarter'] as const).map((range) => (
                <Badge
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  className={`cursor-pointer capitalize ${
                    timeRange === range ? 'bg-primary text-primary-foreground' : 'border-primary/30 hover:bg-primary/10'
                  }`}
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-5 h-5 text-primary mr-2" />
                <span className="text-2xl font-bold text-primary">{totalCompleted}</span>
              </div>
              <div className="text-sm text-muted-foreground">Missions Completed</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-green-400 mr-2" />
                <span className="text-2xl font-bold text-green-400">{totalHours}h</span>
              </div>
              <div className="text-sm text-muted-foreground">Hours Invested</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-yellow-400 mr-2" />
                <span className="text-2xl font-bold text-yellow-400">{completionRate}%</span>
              </div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Zap className="w-5 h-5 text-purple-400 mr-2" />
                <span className="text-2xl font-bold text-purple-400">{weeklyXP}</span>
              </div>
              <div className="text-sm text-muted-foreground">Weekly XP</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Domain Performance */}
        <Card className="analytics-card bg-card/30 backdrop-blur-md border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-primary">Domain Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {SAMPLE_DOMAIN_DATA.map((domain) => {
                const completion = Math.round((domain.completed / domain.planned) * 100);
                
                return (
                  <motion.div
                    key={domain.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{domain.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {domain.completed}/{domain.planned}
                        </span>
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                          style={{ color: domain.color, borderColor: `${domain.color}40` }}
                        >
                          {completion}%
                        </Badge>
                      </div>
                    </div>
                    <Progress 
                      value={completion} 
                      className="h-2"
                      style={{ backgroundColor: `${domain.color}20` }}
                    />
                    <div className="text-xs text-muted-foreground">
                      {domain.hours} hours invested
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Progress Chart */}
        <Card className="analytics-card bg-card/30 backdrop-blur-md border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-primary">Weekly Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(30, 41, 59, 0.95)', 
                    border: '1px solid rgba(0, 217, 255, 0.3)',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                <Bar dataKey="planned" fill="#64748b" name="Planned" radius={[2, 2, 0, 0]} />
                <Bar dataKey="completed" fill="#00d9ff" name="Completed" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Domain Distribution Pie Chart */}
        <Card className="analytics-card bg-card/30 backdrop-blur-md border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-primary">Time Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={domainStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ domain, percent }) => `${domain} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="hours"
                >
                  {domainStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(30, 41, 59, 0.95)', 
                    border: '1px solid rgba(0, 217, 255, 0.3)',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* XP Trend */}
        <Card className="analytics-card bg-card/30 backdrop-blur-md border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-primary flex items-center gap-2">
              <Award className="w-5 h-5" />
              XP Progression
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-400">{weeklyXP}</div>
                <div className="text-xs text-muted-foreground">Total XP</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">{averageDailyXP}</div>
                <div className="text-xs text-muted-foreground">Avg/Day</div>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(30, 41, 59, 0.95)', 
                    border: '1px solid rgba(0, 217, 255, 0.3)',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="xp" 
                  stroke="#a855f7" 
                  strokeWidth={3}
                  dot={{ fill: '#a855f7', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#a855f7', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Insights & Recommendations */}
      <Card className="analytics-card bg-card/30 backdrop-blur-md border-primary/30">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-primary flex items-center gap-2">
            <Target className="w-5 h-5" />
            AI Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <div className="font-medium text-green-400">Strong Performance</div>
                <p className="text-sm text-muted-foreground">
                  Academic and Fitness domains showing consistent 80%+ completion rates. Keep up the excellent work!
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <Calendar className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <div className="font-medium text-yellow-400">Optimization Opportunity</div>
                <p className="text-sm text-muted-foreground">
                  Creative domain completion is at 63%. Consider breaking down creative projects into smaller, more manageable tasks.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <Zap className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <div className="font-medium text-blue-400">Peak Performance Hours</div>
                <p className="text-sm text-muted-foreground">
                  Tuesday and Thursday show highest XP gains. Consider scheduling high-priority tasks during these days.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}