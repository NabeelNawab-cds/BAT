import React, { useState } from 'react';
import { usePlanContext } from '@/lib/plan-context';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dumbbell, BookOpen, Palette, Users, Wrench, Star, Target, Calendar, Clock } from 'lucide-react';

interface TaskTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated?: (task: any) => void; // Made optional since we handle creation internally
}

interface TemplateField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  options?: string[];
  required?: boolean;
  placeholder?: string;
}

const DOMAIN_TEMPLATES = {
  athletics: {
    icon: Dumbbell,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    title: 'Athletics Training',
    description: 'Track workouts, sets, reps, and fitness goals',
    fields: [
      { key: 'workoutType', label: 'Workout Type', type: 'select', options: ['Cardio', 'Calisthenics', 'Weight Training', 'Flexibility', 'Sports'], required: true },
      { key: 'exercises', label: 'Exercises', type: 'textarea', placeholder: 'List exercises or activities...' },
      { key: 'sets', label: 'Sets', type: 'number', placeholder: '3' },
      { key: 'reps', label: 'Reps per Set', type: 'text', placeholder: '10-12 or 30 seconds' },
      { key: 'restTime', label: 'Rest Time (seconds)', type: 'number', placeholder: '60' },
      { key: 'weight', label: 'Weight (optional)', type: 'text', placeholder: '20kg or bodyweight' },
    ] as TemplateField[]
  },
  islamic_studies: {
    icon: Star,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    title: 'Islamic Studies',
    description: 'Quran, Hadith, and Islamic learning activities',
    fields: [
      { key: 'studyType', label: 'Study Type', type: 'select', options: ['Quran Reading', 'Hadith Study', 'Tafseer', 'Memorization', 'Islamic History', 'Fiqh'], required: true },
      { key: 'surahNumber', label: 'Surah Number (if applicable)', type: 'number', placeholder: '1-114' },
      { key: 'verses', label: 'Verses/Pages', type: 'text', placeholder: 'Verses 1-10 or Pages 5-8' },
      { key: 'memorization', label: 'Memorization Goal', type: 'text', placeholder: 'Verses to memorize' },
      { key: 'review', label: 'Review Previous', type: 'select', options: ['Yes', 'No'] },
      { key: 'notes', label: 'Study Notes', type: 'textarea', placeholder: 'Key learnings and reflections...' },
    ] as TemplateField[]
  },
  academics: {
    icon: BookOpen,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    title: 'Academic Work',
    description: 'Assignments, projects, and study sessions',
    fields: [
      { key: 'subject', label: 'Subject', type: 'text', required: true, placeholder: 'Mathematics, Physics, etc.' },
      { key: 'taskType', label: 'Task Type', type: 'select', options: ['Assignment', 'Project', 'Study Session', 'Exam Prep', 'Research', 'Reading'], required: true },
      { key: 'chapter', label: 'Chapter/Topic', type: 'text', placeholder: 'Chapter 5: Calculus' },
      { key: 'pages', label: 'Pages/Problems', type: 'text', placeholder: 'Pages 120-150 or Problems 1-20' },
      { key: 'deadline', label: 'Assignment Deadline', type: 'text', placeholder: 'Leave empty if not applicable' },
      { key: 'studyMethod', label: 'Study Method', type: 'select', options: ['Reading', 'Practice Problems', 'Flashcards', 'Group Study', 'Online Course'] },
    ] as TemplateField[]
  },
  creative: {
    icon: Palette,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    title: 'Creative Projects',
    description: 'Art, writing, music, and creative pursuits',
    fields: [
      { key: 'projectType', label: 'Project Type', type: 'select', options: ['Writing', 'Drawing/Art', 'Music', 'Design', 'Photography', 'Video', 'Crafts'], required: true },
      { key: 'medium', label: 'Medium/Tools', type: 'text', placeholder: 'Digital art, watercolor, guitar, etc.' },
      { key: 'goal', label: 'Session Goal', type: 'text', placeholder: 'Complete sketch, write 500 words, etc.' },
      { key: 'inspiration', label: 'Inspiration/Reference', type: 'text', placeholder: 'Reference materials or inspiration' },
      { key: 'technique', label: 'Technique to Practice', type: 'text', placeholder: 'Shading, chord progressions, etc.' },
    ] as TemplateField[]
  },
  social: {
    icon: Users,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    title: 'Social Activities',
    description: 'Connect with friends, family, and community',
    fields: [
      { key: 'activityType', label: 'Activity Type', type: 'select', options: ['Family Time', 'Friends Hangout', 'Community Event', 'Networking', 'Team Activity', 'Phone Call'], required: true },
      { key: 'people', label: 'Who', type: 'text', placeholder: 'Names or group description' },
      { key: 'location', label: 'Where', type: 'text', placeholder: 'Location or platform' },
      { key: 'activity', label: 'What Activity', type: 'text', placeholder: 'Dinner, game night, video call, etc.' },
      { key: 'preparation', label: 'Preparation Needed', type: 'text', placeholder: 'Book restaurant, prepare snacks, etc.' },
    ] as TemplateField[]
  },
  maintenance: {
    icon: Wrench,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    title: 'Life Maintenance',
    description: 'Chores, errands, and organizational tasks',
    fields: [
      { key: 'taskType', label: 'Task Type', type: 'select', options: ['Cleaning', 'Organizing', 'Shopping', 'Administrative', 'Maintenance', 'Errands'], required: true },
      { key: 'location', label: 'Location/Area', type: 'text', placeholder: 'Room, store, office, etc.' },
      { key: 'supplies', label: 'Supplies Needed', type: 'text', placeholder: 'Cleaning supplies, documents, etc.' },
      { key: 'checklist', label: 'Checklist', type: 'textarea', placeholder: 'List of specific tasks to complete...' },
    ] as TemplateField[]
  },
};

export default function TaskTemplateModal({ open, onOpenChange, onTaskCreated }: TaskTemplateModalProps) {
  const { createTask } = usePlanContext();
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    estimatedHours: 1,
    priority: 'medium' as const,
    dueDate: '',
    templateData: {} as Record<string, any>
  });

  const handleDomainSelect = (domain: string) => {
    setSelectedDomain(domain);
    setTaskData(prev => ({
      ...prev,
      templateData: {}
    }));
  };

  const handleTemplateFieldChange = (fieldKey: string, value: any) => {
    setTaskData(prev => ({
      ...prev,
      templateData: {
        ...prev.templateData,
        [fieldKey]: value
      }
    }));

    // Special handling for Islamic Studies - auto-fill Surah name
    if (selectedDomain === 'islamic_studies' && fieldKey === 'surahNumber') {
      const surahNames = [
        '', 'Al-Fatihah', 'Al-Baqarah', 'Ali-Imran', 'An-Nisa', 'Al-Ma\'idah', 'Al-An\'am', 
        'Al-A\'raf', 'Al-Anfal', 'At-Tawbah', 'Yunus', 'Hud', 'Yusuf', 'Ar-Ra\'d', 'Ibrahim',
        // Add more as needed - this is a sample
      ];
      const surahNumber = parseInt(value);
      if (surahNumber >= 1 && surahNumber <= 114) {
        const surahName = surahNames[surahNumber] || `Surah ${surahNumber}`;
        setTaskData(prev => ({
          ...prev,
          title: `${surahName} - ${prev.templateData.studyType || 'Study'}`,
          templateData: {
            ...prev.templateData,
            surahName
          }
        }));
      }
    }
  };

  const handleCreateTask = async () => {
    if (!taskData.title.trim()) return;

    setIsCreating(true);
    try {
      // Map domain names to match schema
      const domainMapping: Record<string, string> = {
        athletics: 'fitness',
        islamic_studies: 'islamic_studies', 
        academics: 'academic',
        creative: 'creative',
        social: 'social',
        maintenance: 'maintenance'
      };

      const mappedDomain = domainMapping[selectedDomain] || selectedDomain;

      const newTaskData = {
        title: taskData.title,
        description: taskData.description,
        domain: mappedDomain,
        priority: taskData.priority,
        estimatedHours: taskData.estimatedHours,
        dueDate: taskData.dueDate || undefined,
        templateData: taskData.templateData
      };

      await createTask(newTaskData);
      
      // Call the optional callback if provided
      if (onTaskCreated) {
        onTaskCreated({ ...newTaskData, domain: selectedDomain, id: 'temp' });
      }

      onOpenChange(false);

      // Reset form
      setSelectedDomain('');
      setTaskData({
        title: '',
        description: '',
        estimatedHours: 1,
        priority: 'medium',
        dueDate: '',
        templateData: {}
      });
    } catch (error) {
      console.error('Failed to create task from template:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-md border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <Target className="w-6 h-6" />
            Create Mission Template
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!selectedDomain ? (
            /* Domain Selection */
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Choose Mission Category</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(DOMAIN_TEMPLATES).map(([key, template]) => {
                  const IconComponent = template.icon;
                  return (
                    <motion.div
                      key={key}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className={`cursor-pointer border-border/30 hover:border-primary/50 transition-all ${template.bgColor} backdrop-blur-sm`}
                        onClick={() => handleDomainSelect(key)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2">
                            <IconComponent className={`w-5 h-5 ${template.color}`} />
                            <CardTitle className="text-sm">{template.title}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-muted-foreground">{template.description}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Template Form */
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedDomain}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Header with selected domain */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {React.createElement(DOMAIN_TEMPLATES[selectedDomain as keyof typeof DOMAIN_TEMPLATES].icon, {
                      className: `w-6 h-6 ${DOMAIN_TEMPLATES[selectedDomain as keyof typeof DOMAIN_TEMPLATES].color}`
                    })}
                    <h3 className="text-lg font-semibold text-primary">
                      {DOMAIN_TEMPLATES[selectedDomain as keyof typeof DOMAIN_TEMPLATES].title}
                    </h3>
                  </div>
                  <Button variant="ghost" onClick={() => setSelectedDomain('')}>
                    Change Category
                  </Button>
                </div>

                {/* Basic Task Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Mission Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter mission title..."
                      value={taskData.title}
                      onChange={(e) => setTaskData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimatedHours">Estimated Hours</Label>
                    <Input
                      id="estimatedHours"
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={taskData.estimatedHours}
                      onChange={(e) => setTaskData(prev => ({ ...prev, estimatedHours: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={taskData.priority}
                      onValueChange={(value) => setTaskData(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date (optional)</Label>
                    <Input
                      id="dueDate"
                      type="datetime-local"
                      value={taskData.dueDate}
                      onChange={(e) => setTaskData(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the mission objectives..."
                    value={taskData.description}
                    onChange={(e) => setTaskData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                {/* Template-specific fields */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-primary">Category-Specific Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {DOMAIN_TEMPLATES[selectedDomain as keyof typeof DOMAIN_TEMPLATES].fields.map((field) => (
                      <div key={field.key} className="space-y-2">
                        <Label htmlFor={field.key}>
                          {field.label} {field.required && <span className="text-red-400">*</span>}
                        </Label>
                        
                        {field.type === 'select' ? (
                          <Select
                            value={taskData.templateData[field.key] || ''}
                            onValueChange={(value) => handleTemplateFieldChange(field.key, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={field.placeholder} />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options?.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : field.type === 'textarea' ? (
                          <Textarea
                            id={field.key}
                            placeholder={field.placeholder}
                            value={taskData.templateData[field.key] || ''}
                            onChange={(e) => handleTemplateFieldChange(field.key, e.target.value)}
                          />
                        ) : (
                          <Input
                            id={field.key}
                            type={field.type}
                            placeholder={field.placeholder}
                            value={taskData.templateData[field.key] || ''}
                            onChange={(e) => handleTemplateFieldChange(field.key, 
                              field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                            )}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t border-border/30">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateTask}
                    disabled={!taskData.title.trim() || isCreating}
                    className="bg-gradient-to-r from-primary to-primary/80"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    {isCreating ? 'Creating Mission...' : 'Create Mission'}
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}