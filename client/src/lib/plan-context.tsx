import React, { createContext, useContext, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/lib/theme-context';
import { 
  clientTaskSchema, clientUpdateTaskSchema, type Task, type ClientTask, type ClientUpdateTask,
  clientGoalSchema, clientUpdateGoalSchema, type Goal, type ClientGoal, type ClientUpdateGoal,
  clientObjectiveSchema, clientUpdateObjectiveSchema, type Objective, type ClientObjective, type ClientUpdateObjective,
  clientVisionSchema, clientUpdateVisionSchema, type Vision, type ClientVision, type ClientUpdateVision
} from '@shared/schema';
import { z } from 'zod';

// Extended task creation schema with template data
const createTaskWithTemplateSchema = clientTaskSchema.extend({
  templateData: z.record(z.any()).optional(),
});

type CreateTaskWithTemplate = z.infer<typeof createTaskWithTemplateSchema>;

interface PlanContextType {
  // Task data
  tasks: Task[];
  isLoading: boolean;
  error: any;

  // Task mutations
  createTask: (taskData: CreateTaskWithTemplate) => Promise<void>;
  updateTask: (id: string, updates: ClientUpdateTask) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string, actualHours: number) => Promise<void>;

  // Goal data (monthly planning)
  goals: Goal[];
  goalsLoading: boolean;
  goalsError: any;

  // Goal mutations
  createGoal: (goalData: ClientGoal) => Promise<void>;
  updateGoal: (id: string, updates: ClientUpdateGoal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // Objective data (quarterly planning)
  objectives: Objective[];
  objectivesLoading: boolean;
  objectivesError: any;

  // Objective mutations
  createObjective: (objectiveData: ClientObjective) => Promise<void>;
  updateObjective: (id: string, updates: ClientUpdateObjective) => Promise<void>;
  deleteObjective: (id: string) => Promise<void>;

  // Vision data (yearly planning)
  visions: Vision[];
  visionsLoading: boolean;
  visionsError: any;

  // Vision mutations
  createVision: (visionData: ClientVision) => Promise<void>;
  updateVision: (id: string, updates: ClientUpdateVision) => Promise<void>;
  deleteVision: (id: string) => Promise<void>;

  // Planning-specific utilities
  getTasksForDate: (date: Date) => Task[];
  getTasksForDateRange: (startDate: Date, endDate: Date) => Task[];
  getTasksForHour: (date: Date, hour: number) => Task[];
  rescheduleTask: (id: string, newDate: Date, newHour?: number) => Promise<void>;

  // Goal utilities
  getGoalsForMonth: (month: number, year: number) => Goal[];
  getGoalsForDate: (date: Date) => Goal[];

  // Objective utilities
  getObjectivesForQuarter: (quarter: number, year: number) => Objective[];
  getObjectivesForMonth: (month: number, year: number) => Objective[];

  // Vision utilities
  getVisionsForYear: (year: number) => Vision[];

  // Analytics calculations
  getDomainStats: () => DomainStats[];
  getCompletionStats: (timeRange: 'week' | 'month' | 'quarter') => CompletionStats;
  getHourlyDistribution: () => HourlyDistribution[];
  getXpStats: (timeRange: 'week' | 'month' | 'quarter') => XpStats;
}

interface DomainStats {
  domain: string;
  completed: number;
  planned: number;
  hours: number;
  completionRate: number;
  color: string;
}

interface CompletionStats {
  totalTasks: number;
  completedTasks: number;
  totalHours: number;
  completedHours: number;
  completionRate: number;
}

interface HourlyDistribution {
  hour: string;
  planned: number;
  completed: number;
  xp: number;
}

interface XpStats {
  total: number;
  average: number;
  byDomain: Record<string, number>;
}

const PlanContext = createContext<PlanContextType | null>(null);

const DOMAIN_COLORS: Record<string, string> = {
  academic: '#3b82f6',
  fitness: '#10b981', 
  creative: '#8b5cf6',
  social: '#f59e0b',
  maintenance: '#6b7280',
  islamic_studies: '#059669',
};

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const { calculateEU } = useTheme();
  const queryClient = useQueryClient();

  // Fetch tasks using the same query as tasks.tsx
  const { data: tasks = [], isLoading, error } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  // Fetch goals
  const { data: goals = [], isLoading: goalsLoading, error: goalsError } = useQuery<Goal[]>({
    queryKey: ['/api/goals'],
  });

  // Fetch objectives
  const { data: objectives = [], isLoading: objectivesLoading, error: objectivesError } = useQuery<Objective[]>({
    queryKey: ['/api/objectives'],
  });

  // Fetch visions
  const { data: visions = [], isLoading: visionsLoading, error: visionsError } = useQuery<Vision[]>({
    queryKey: ['/api/visions'],
  });

  // Create task mutation with template support
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: CreateTaskWithTemplate) => {
      // Remove templateData from the API request (it's for UI only)
      const { templateData, ...apiData } = taskData;
      return apiRequest('POST', '/api/tasks', apiData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: 'Mission Created',
        description: 'Your new task has been added to the planning system.',
      });
    },
    onError: () => {
      toast({
        title: 'Mission Failed',
        description: 'Failed to create task. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ClientUpdateTask }) => {
      return apiRequest('PATCH', `/api/tasks/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
    onError: () => {
      toast({
        title: 'Update Failed',
        description: 'Failed to update task. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: 'Task Removed',
        description: 'Task has been deleted from the planning system.',
      });
    },
  });

  // Complete task mutation
  const completeTaskMutation = useMutation({
    mutationFn: async ({ id, actualHours }: { id: string; actualHours: number }) => {
      return apiRequest('PATCH', `/api/tasks/${id}`, {
        isCompleted: true,
        actualHours,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: 'Mission Accomplished',
        description: 'XP and EU rewards have been calculated and added to your profile.',
      });
    },
  });

  // Goal mutations
  const createGoalMutation = useMutation({
    mutationFn: async (goalData: ClientGoal) => {
      return apiRequest('POST', '/api/goals', goalData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      toast({
        title: 'Goal Created',
        description: 'Your monthly goal has been added to the planning system.',
      });
    },
    onError: () => {
      toast({
        title: 'Goal Creation Failed',
        description: 'Failed to create goal. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ClientUpdateGoal }) => {
      return apiRequest('PATCH', `/api/goals/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
    },
    onError: () => {
      toast({
        title: 'Goal Update Failed',
        description: 'Failed to update goal. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/goals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      toast({
        title: 'Goal Removed',
        description: 'Goal has been deleted from the planning system.',
      });
    },
  });

  // Objective mutations
  const createObjectiveMutation = useMutation({
    mutationFn: async (objectiveData: ClientObjective) => {
      return apiRequest('POST', '/api/objectives', objectiveData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/objectives'] });
      toast({
        title: 'Objective Created',
        description: 'Your quarterly objective has been added to the planning system.',
      });
    },
    onError: () => {
      toast({
        title: 'Objective Creation Failed',
        description: 'Failed to create objective. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const updateObjectiveMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ClientUpdateObjective }) => {
      return apiRequest('PATCH', `/api/objectives/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/objectives'] });
    },
    onError: () => {
      toast({
        title: 'Objective Update Failed',
        description: 'Failed to update objective. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const deleteObjectiveMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/objectives/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/objectives'] });
      toast({
        title: 'Objective Removed',
        description: 'Objective has been deleted from the planning system.',
      });
    },
  });

  // Vision mutations
  const createVisionMutation = useMutation({
    mutationFn: async (visionData: ClientVision) => {
      return apiRequest('POST', '/api/visions', visionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/visions'] });
      toast({
        title: 'Vision Created',
        description: 'Your yearly vision has been added to the planning system.',
      });
    },
    onError: () => {
      toast({
        title: 'Vision Creation Failed',
        description: 'Failed to create vision. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const updateVisionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ClientUpdateVision }) => {
      return apiRequest('PATCH', `/api/visions/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/visions'] });
    },
    onError: () => {
      toast({
        title: 'Vision Update Failed',
        description: 'Failed to update vision. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const deleteVisionMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/visions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/visions'] });
      toast({
        title: 'Vision Removed',
        description: 'Vision has been deleted from the planning system.',
      });
    },
  });

  // Planning utility functions
  const getTasksForDate = (date: Date): Task[] => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getTasksForDateRange = (startDate: Date, endDate: Date): Task[] => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate >= startDate && taskDate <= endDate;
    });
  };

  const getTasksForHour = (date: Date, hour: number): Task[] => {
    return getTasksForDate(date).filter(task => {
      const taskDate = new Date(task.dueDate!);
      return taskDate.getHours() === hour;
    });
  };

  const rescheduleTask = async (id: string, newDate: Date, newHour?: number): Promise<void> => {
    const scheduledDate = new Date(newDate);
    if (newHour !== undefined) {
      scheduledDate.setHours(newHour, 0, 0, 0);
    }
    
    await updateTaskMutation.mutateAsync({
      id,
      updates: { dueDate: scheduledDate.toISOString() }
    });
  };

  // Goal utility functions
  const getGoalsForMonth = (month: number, year: number): Goal[] => {
    return goals.filter(goal => goal.month === month && goal.year === year);
  };

  const getGoalsForDate = (date: Date): Goal[] => {
    return goals.filter(goal => {
      if (!goal.deadline) return false;
      const goalDate = new Date(goal.deadline);
      return (
        goalDate.getDate() === date.getDate() &&
        goalDate.getMonth() === date.getMonth() &&
        goalDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Objective utility functions
  const getObjectivesForQuarter = (quarter: number, year: number): Objective[] => {
    return objectives.filter(obj => obj.quarter === quarter && obj.year === year);
  };

  const getObjectivesForMonth = (month: number, year: number): Objective[] => {
    const quarter = Math.floor((month - 1) / 3) + 1;
    return getObjectivesForQuarter(quarter, year);
  };

  // Vision utility functions
  const getVisionsForYear = (year: number): Vision[] => {
    return visions.filter(vision => vision.year === year);
  };

  // Analytics calculations with real data
  const getDomainStats = (): DomainStats[] => {
    const domainMap = new Map<string, { completed: number; planned: number; hours: number }>();

    tasks.forEach(task => {
      const domain = task.domain || 'other';
      const current = domainMap.get(domain) || { completed: 0, planned: 0, hours: 0 };
      
      current.planned += 1;
      if (task.isCompleted) {
        current.completed += 1;
      }
      
      const hours = typeof task.estimatedHours === 'string' 
        ? parseFloat(task.estimatedHours) 
        : task.estimatedHours;
      current.hours += hours || 0;
      
      domainMap.set(domain, current);
    });

    return Array.from(domainMap.entries()).map(([domain, stats]) => ({
      domain,
      ...stats,
      completionRate: stats.planned > 0 ? Math.round((stats.completed / stats.planned) * 100) : 0,
      color: DOMAIN_COLORS[domain] || '#6b7280'
    }));
  };

  const getCompletionStats = (timeRange: 'week' | 'month' | 'quarter'): CompletionStats => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        break;
    }

    const rangeTasks = getTasksForDateRange(startDate, now);
    const completedTasks = rangeTasks.filter(t => t.isCompleted);

    const totalHours = rangeTasks.reduce((sum, task) => {
      const hours = typeof task.estimatedHours === 'string' 
        ? parseFloat(task.estimatedHours) 
        : task.estimatedHours;
      return sum + (hours || 0);
    }, 0);

    const completedHours = completedTasks.reduce((sum, task) => {
      const hours = typeof task.actualHours === 'string' 
        ? parseFloat(task.actualHours) 
        : task.actualHours;
      return sum + (hours || 0);
    }, 0);

    return {
      totalTasks: rangeTasks.length,
      completedTasks: completedTasks.length,
      totalHours,
      completedHours,
      completionRate: rangeTasks.length > 0 ? Math.round((completedTasks.length / rangeTasks.length) * 100) : 0
    };
  };

  const getHourlyDistribution = (): HourlyDistribution[] => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return hours.map(hour => {
      const hourTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        return new Date(task.dueDate).getHours() === hour;
      });

      const completed = hourTasks.filter(t => t.isCompleted);
      const xp = completed.reduce((sum, task) => sum + (task.xpReward || 0), 0);

      return {
        hour: `${hour.toString().padStart(2, '0')}:00`,
        planned: hourTasks.length,
        completed: completed.length,
        xp
      };
    });
  };

  const getXpStats = (timeRange: 'week' | 'month' | 'quarter'): XpStats => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        break;
    }

    const rangeTasks = getTasksForDateRange(startDate, now).filter(t => t.isCompleted);
    const total = rangeTasks.reduce((sum, task) => sum + (task.xpReward || 0), 0);
    
    const byDomain: Record<string, number> = {};
    rangeTasks.forEach(task => {
      const domain = task.domain || 'other';
      byDomain[domain] = (byDomain[domain] || 0) + (task.xpReward || 0);
    });

    return {
      total,
      average: rangeTasks.length > 0 ? Math.round(total / rangeTasks.length) : 0,
      byDomain
    };
  };

  const contextValue = useMemo(() => ({
    // Task data
    tasks,
    isLoading,
    error,

    // Task mutations
    createTask: (taskData: CreateTaskWithTemplate) => createTaskMutation.mutateAsync(taskData),
    updateTask: (id: string, updates: ClientUpdateTask) => updateTaskMutation.mutateAsync({ id, updates }),
    deleteTask: (id: string) => deleteTaskMutation.mutateAsync(id),
    completeTask: (id: string, actualHours: number) => completeTaskMutation.mutateAsync({ id, actualHours }),

    // Goal data
    goals,
    goalsLoading,
    goalsError,

    // Goal mutations
    createGoal: (goalData: ClientGoal) => createGoalMutation.mutateAsync(goalData),
    updateGoal: (id: string, updates: ClientUpdateGoal) => updateGoalMutation.mutateAsync({ id, updates }),
    deleteGoal: (id: string) => deleteGoalMutation.mutateAsync(id),

    // Objective data
    objectives,
    objectivesLoading,
    objectivesError,

    // Objective mutations
    createObjective: (objectiveData: ClientObjective) => createObjectiveMutation.mutateAsync(objectiveData),
    updateObjective: (id: string, updates: ClientUpdateObjective) => updateObjectiveMutation.mutateAsync({ id, updates }),
    deleteObjective: (id: string) => deleteObjectiveMutation.mutateAsync(id),

    // Vision data
    visions,
    visionsLoading,
    visionsError,

    // Vision mutations
    createVision: (visionData: ClientVision) => createVisionMutation.mutateAsync(visionData),
    updateVision: (id: string, updates: ClientUpdateVision) => updateVisionMutation.mutateAsync({ id, updates }),
    deleteVision: (id: string) => deleteVisionMutation.mutateAsync(id),

    // Task utilities
    getTasksForDate,
    getTasksForDateRange,
    getTasksForHour,
    rescheduleTask,

    // Goal utilities
    getGoalsForMonth,
    getGoalsForDate,

    // Objective utilities
    getObjectivesForQuarter,
    getObjectivesForMonth,

    // Vision utilities
    getVisionsForYear,

    // Analytics
    getDomainStats,
    getCompletionStats,
    getHourlyDistribution,
    getXpStats,
  }), [
    tasks, isLoading, error,
    goals, goalsLoading, goalsError,
    objectives, objectivesLoading, objectivesError,
    visions, visionsLoading, visionsError,
    createTaskMutation, updateTaskMutation, deleteTaskMutation, completeTaskMutation,
    createGoalMutation, updateGoalMutation, deleteGoalMutation,
    createObjectiveMutation, updateObjectiveMutation, deleteObjectiveMutation,
    createVisionMutation, updateVisionMutation, deleteVisionMutation
  ]);

  return (
    <PlanContext.Provider value={contextValue}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlanContext() {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlanContext must be used within a PlanProvider');
  }
  return context;
}