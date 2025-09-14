import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, numeric, uuid, jsonb, unique, foreignKey, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User profiles table that links to Supabase auth.users for production security
export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey(), // Links to auth.users.id in Supabase
  username: text("username").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  avatar: text("avatar"),
  timezone: text("timezone").notNull().default("UTC"),
  locale: text("locale").notNull().default("en"),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  usernameIdx: index("profiles_username_idx").on(table.username),
  timezoneIdx: index("profiles_timezone_idx").on(table.timezone),
}));

export const insertProfileSchema = createInsertSchema(profiles).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;

// User preferences for customization and settings
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  // Theme and UI preferences
  theme: text("theme").notNull().default("dark_knight"), // dark_knight, neon_grid, stealth_ops, aurora, minimal_white
  fontFamily: text("font_family").notNull().default("orbitron"), // orbitron, space_grotesk, jetbrains_mono, inter
  gamificationType: text("gamification_type").notNull().default("sapling"), // sapling, mountain
  // Effort Unit multipliers
  academicMultiplier: numeric("academic_multiplier", { precision: 3, scale: 1 }).notNull().default("1.0"),
  fitnessMultiplier: numeric("fitness_multiplier", { precision: 3, scale: 1 }).notNull().default("2.5"),
  creativeMultiplier: numeric("creative_multiplier", { precision: 3, scale: 1 }).notNull().default("0.8"),
  socialMultiplier: numeric("social_multiplier", { precision: 3, scale: 1 }).notNull().default("1.2"),
  maintenanceMultiplier: numeric("maintenance_multiplier", { precision: 3, scale: 1 }).notNull().default("0.6"),
  // Notification preferences
  emailNotifications: boolean("email_notifications").notNull().default(true),
  pushNotifications: boolean("push_notifications").notNull().default(true),
  reminderTime: text("reminder_time").notNull().default("09:00"), // HH:MM format
  weeklyGoal: integer("weekly_goal").notNull().default(2500), // XP goal per week
  // Dashboard preferences
  defaultView: text("default_view").notNull().default("dashboard"), // dashboard, tasks, calendar, analytics
  sidebarCollapsed: boolean("sidebar_collapsed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// User gamification data for XP system
export const userGameData = pgTable("user_game_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => profiles.id, { onDelete: "cascade" }),
  totalXP: integer("total_xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  dailyXP: integer("daily_xp").notNull().default(0),
  weeklyXP: integer("weekly_xp").notNull().default(0),
  monthlyXP: integer("monthly_xp").notNull().default(0),
  totalTasks: integer("total_tasks").notNull().default(0),
  totalEU: integer("total_eu").notNull().default(0),
  // Domain-specific counters
  academicTasks: integer("academic_tasks").notNull().default(0),
  fitnessTasks: integer("fitness_tasks").notNull().default(0),
  creativeTasks: integer("creative_tasks").notNull().default(0),
  socialTasks: integer("social_tasks").notNull().default(0),
  maintenanceTasks: integer("maintenance_tasks").notNull().default(0),
  // Streak tracking
  lastActivityDate: timestamp("last_activity_date").default(sql`now()`),
  streakStartDate: timestamp("streak_start_date").default(sql`now()`),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Achievement definitions
export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  category: text("category").notNull(), // tasks, streaks, xp, domain, special
  icon: text("icon").notNull(), // emoji or icon class
  requirement: text("requirement").notNull(), // JSON string of requirement criteria
  xpReward: integer("xp_reward").notNull().default(100),
  isSecret: boolean("is_secret").notNull().default(false),
  rarity: text("rarity").notNull().default("common"), // common, rare, epic, legendary
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  nameIdx: index("achievements_name_idx").on(table.name),
  categoryIdx: index("achievements_category_idx").on(table.category),
  rarityIdx: index("achievements_rarity_idx").on(table.rarity),
}));

// User achievement progress
export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  achievementId: varchar("achievement_id").notNull().references(() => achievements.id, { onDelete: "cascade" }),
  unlockedAt: timestamp("unlocked_at").notNull().default(sql`now()`),
  progress: integer("progress").notNull().default(0), // For achievements with progress tracking
  maxProgress: integer("max_progress").notNull().default(1),
  isCompleted: boolean("is_completed").notNull().default(false),
}, (table) => ({
  userAchievementIdx: index("user_achievements_user_achievement_idx").on(table.userId, table.achievementId),
  userIdx: index("user_achievements_user_idx").on(table.userId),
  uniqueUserAchievement: unique("unique_user_achievement").on(table.userId, table.achievementId),
}));

// User analytics data
export const userAnalytics = pgTable("user_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull().default(sql`now()`),
  // Daily metrics
  tasksCompleted: integer("tasks_completed").notNull().default(0),
  xpEarned: integer("xp_earned").notNull().default(0),
  euEarned: integer("eu_earned").notNull().default(0),
  hoursWorked: numeric("hours_worked", { precision: 4, scale: 1 }).notNull().default("0.0"),
  // Domain breakdown
  academicHours: numeric("academic_hours", { precision: 4, scale: 1 }).notNull().default("0.0"),
  fitnessHours: numeric("fitness_hours", { precision: 4, scale: 1 }).notNull().default("0.0"),
  creativeHours: numeric("creative_hours", { precision: 4, scale: 1 }).notNull().default("0.0"),
  socialHours: numeric("social_hours", { precision: 4, scale: 1 }).notNull().default("0.0"),
  maintenanceHours: numeric("maintenance_hours", { precision: 4, scale: 1 }).notNull().default("0.0"),
  // Time tracking
  activeTime: integer("active_time").notNull().default(0), // minutes
  focusTime: integer("focus_time").notNull().default(0), // minutes of deep work
  breakTime: integer("break_time").notNull().default(0), // minutes of breaks
}, (table) => ({
  userDateIdx: index("user_analytics_user_date_idx").on(table.userId, table.date),
  dateIdx: index("user_analytics_date_idx").on(table.date),
  uniqueUserDate: unique("unique_user_date").on(table.userId, table.date),
}));

// User sessions for authentication management (optional - mainly if not using Supabase Auth)
export const userSessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  sessionToken: text("session_token").notNull().unique(), // Should be hashed in production
  device: text("device"), // browser, mobile app, etc.
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  location: text("location"), // city, country
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  lastUsedAt: timestamp("last_used_at").notNull().default(sql`now()`),
}, (table) => ({
  userIdx: index("user_sessions_user_idx").on(table.userId),
  sessionTokenIdx: index("user_sessions_token_idx").on(table.sessionToken),
  expiresAtIdx: index("user_sessions_expires_idx").on(table.expiresAt),
  isActiveIdx: index("user_sessions_active_idx").on(table.isActive),
}));

// Schemas for the new tables
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserGameDataSchema = createInsertSchema(userGameData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  unlockedAt: true,
});

export const insertUserAnalyticsSchema = createInsertSchema(userAnalytics).omit({
  id: true,
  date: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  createdAt: true,
  lastUsedAt: true,
});

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserGameData = typeof userGameData.$inferSelect;
export type InsertUserGameData = z.infer<typeof insertUserGameDataSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserAnalytics = typeof userAnalytics.$inferSelect;
export type InsertUserAnalytics = z.infer<typeof insertUserAnalyticsSchema>;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;

// Tasks table for productivity management
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  domain: text("domain").notNull(), // academic, fitness, creative, social, maintenance
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  estimatedHours: numeric("estimated_hours", { precision: 4, scale: 1 }).notNull().default("1.0"),
  actualHours: numeric("actual_hours", { precision: 4, scale: 1 }),
  xpReward: integer("xp_reward").notNull().default(0),
  euReward: integer("eu_reward").notNull().default(0),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  xpReward: true,
  euReward: true,
  isCompleted: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
});

// Secure update schema - excludes reward fields that must be server-controlled
export const updateTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  userId: true,
  xpReward: true,
  euReward: true,
  createdAt: true,
  updatedAt: true,
}).partial();

// Transform numeric fields from database strings to numbers
const numericFieldTransform = z.string().transform((val) => parseFloat(val));

// Client-side schema that validates input with proper data types (strings for dates)
export const clientTaskSchema = insertTaskSchema.extend({
  estimatedHours: z.number().min(0.5).max(24).multipleOf(0.5),
  dueDate: z.string().optional(),
}).omit({
  userId: true,
});

// Update schema for client with proper validation (strings for dates)
export const clientUpdateTaskSchema = updateTaskSchema.extend({
  actualHours: z.number().min(0.1).max(100).multipleOf(0.1).optional(),
  estimatedHours: z.number().min(0.5).max(24).multipleOf(0.5).optional(),
  dueDate: z.string().optional(),
}).omit({
  completedAt: true, // Server-controlled when completion happens
});

// Database response schema - transforms numeric strings to numbers for frontend consumption
export const taskResponseSchema = createInsertSchema(tasks).extend({
  estimatedHours: numericFieldTransform,
  actualHours: z.string().transform((val) => val ? parseFloat(val) : null).nullable(),
}).omit({});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type ClientTask = z.infer<typeof clientTaskSchema>;
export type ClientUpdateTask = z.infer<typeof clientUpdateTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Events table for calendar module
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("personal"), // academic, fitness, creative, social, maintenance, personal, meeting
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  allDay: boolean("all_day").notNull().default(false),
  recurrence: text("recurrence"), // none, daily, weekly, monthly, yearly
  recurrenceEnd: timestamp("recurrence_end"),
  taskId: varchar("task_id"), // Link to associated task if applicable
  location: text("location"),
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  isCompleted: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const updateEventSchema = createInsertSchema(events).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).partial();

// Client-side schema for events with proper validation
export const clientEventSchema = insertEventSchema.extend({
  startTime: z.string(),
  endTime: z.string(),
  recurrenceEnd: z.string().optional(),
}).omit({
  userId: true,
});

export const clientUpdateEventSchema = updateEventSchema.extend({
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  recurrenceEnd: z.string().optional(),
}).omit({
  completedAt: true,
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type UpdateEvent = z.infer<typeof updateEventSchema>;
export type ClientEvent = z.infer<typeof clientEventSchema>;
export type ClientUpdateEvent = z.infer<typeof clientUpdateEventSchema>;
export type Event = typeof events.$inferSelect;

// Goals table for monthly planning
export const goals = pgTable("goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // academic, fitness, creative, social, maintenance, islamic_studies
  priority: text("priority").notNull().default("medium"), // low, medium, high
  targetValue: numeric("target_value", { precision: 10, scale: 2 }).notNull(),
  currentValue: numeric("current_value", { precision: 10, scale: 2 }).notNull().default("0"),
  unit: text("unit").notNull(), // hours, pages, workouts, etc.
  deadline: timestamp("deadline").notNull(),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  tasks: text("tasks").array().default([]), // Associated task IDs
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  isCompleted: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const updateGoalSchema = createInsertSchema(goals).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export const clientGoalSchema = insertGoalSchema.extend({
  targetValue: z.number().min(0),
  currentValue: z.number().min(0),
  deadline: z.string(),
}).omit({
  userId: true,
});

export const clientUpdateGoalSchema = updateGoalSchema.extend({
  targetValue: z.number().min(0).optional(),
  currentValue: z.number().min(0).optional(),
  deadline: z.string().optional(),
}).omit({
  completedAt: true,
});

export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type UpdateGoal = z.infer<typeof updateGoalSchema>;
export type ClientGoal = z.infer<typeof clientGoalSchema>;
export type ClientUpdateGoal = z.infer<typeof clientUpdateGoalSchema>;
export type Goal = typeof goals.$inferSelect;

// Objectives table for quarterly planning
export const objectives = pgTable("objectives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // academic, fitness, creative, social, maintenance, islamic_studies, career
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical
  targetMetric: numeric("target_metric", { precision: 10, scale: 2 }).notNull(),
  currentProgress: numeric("current_progress", { precision: 10, scale: 2 }).notNull().default("0"),
  unit: text("unit").notNull(),
  deadline: timestamp("deadline").notNull(),
  quarter: integer("quarter").notNull(), // 1-4
  year: integer("year").notNull(),
  milestones: text("milestones").array().default([]), // JSON strings of milestone objects
  linkedGoals: text("linked_goals").array().default([]), // Goal IDs
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertObjectiveSchema = createInsertSchema(objectives).omit({
  id: true,
  isCompleted: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const updateObjectiveSchema = createInsertSchema(objectives).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export const clientObjectiveSchema = insertObjectiveSchema.extend({
  targetMetric: z.number().min(0),
  currentProgress: z.number().min(0),
  deadline: z.string(),
}).omit({
  userId: true,
});

export const clientUpdateObjectiveSchema = updateObjectiveSchema.extend({
  targetMetric: z.number().min(0).optional(),
  currentProgress: z.number().min(0).optional(),
  deadline: z.string().optional(),
}).omit({
  completedAt: true,
});

export type InsertObjective = z.infer<typeof insertObjectiveSchema>;
export type UpdateObjective = z.infer<typeof updateObjectiveSchema>;
export type ClientObjective = z.infer<typeof clientObjectiveSchema>;
export type ClientUpdateObjective = z.infer<typeof clientUpdateObjectiveSchema>;
export type Objective = typeof objectives.$inferSelect;

// Visions table for yearly planning
export const visions = pgTable("visions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  priority: text("priority").notNull().default("growth"), // foundational, growth, aspirational
  year: integer("year").notNull(),
  quarterlyBreakdown: text("quarterly_breakdown").notNull(), // JSON string of quarterly goals
  metrics: text("metrics").array().default([]), // JSON strings of metric objects
  linkedObjectives: text("linked_objectives").array().default([]), // Objective IDs
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertVisionSchema = createInsertSchema(visions).omit({
  id: true,
  isCompleted: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const updateVisionSchema = createInsertSchema(visions).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export const clientVisionSchema = insertVisionSchema.omit({
  userId: true,
});

export const clientUpdateVisionSchema = updateVisionSchema.omit({
  completedAt: true,
});

export type InsertVision = z.infer<typeof insertVisionSchema>;
export type UpdateVision = z.infer<typeof updateVisionSchema>;
export type ClientVision = z.infer<typeof clientVisionSchema>;
export type ClientUpdateVision = z.infer<typeof clientUpdateVisionSchema>;
export type Vision = typeof visions.$inferSelect;
