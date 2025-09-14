import { 
  type Profile as User, type InsertProfile as InsertUser, type Task, type InsertTask, type UpdateTask,
  type Goal, type InsertGoal, type UpdateGoal,
  type Objective, type InsertObjective, type UpdateObjective,
  type Vision, type InsertVision, type UpdateVision,
  profiles as users, tasks, goals, objectives, visions
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Task management
  getTasks(userId: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: UpdateTask): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;

  // Goal management (monthly planning)
  getGoals(userId: string): Promise<Goal[]>;
  getGoalsForMonth(userId: string, month: number, year: number): Promise<Goal[]>;
  getGoal(id: string): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: string, goal: UpdateGoal): Promise<Goal | undefined>;
  deleteGoal(id: string): Promise<boolean>;

  // Objective management (quarterly planning)
  getObjectives(userId: string): Promise<Objective[]>;
  getObjectivesForQuarter(userId: string, quarter: number, year: number): Promise<Objective[]>;
  getObjective(id: string): Promise<Objective | undefined>;
  createObjective(objective: InsertObjective): Promise<Objective>;
  updateObjective(id: string, objective: UpdateObjective): Promise<Objective | undefined>;
  deleteObjective(id: string): Promise<boolean>;

  // Vision management (yearly planning)
  getVisions(userId: string): Promise<Vision[]>;
  getVisionsForYear(userId: string, year: number): Promise<Vision[]>;
  getVision(id: string): Promise<Vision | undefined>;
  createVision(vision: InsertVision): Promise<Vision>;
  updateVision(id: string, vision: UpdateVision): Promise<Vision | undefined>;
  deleteVision(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private tasks: Map<string, Task>;
  private goals: Map<string, Goal>;
  private objectives: Map<string, Objective>;
  private visions: Map<string, Vision>;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.goals = new Map();
    this.objectives = new Map();
    this.visions = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    // Hash password for security
    const hashedPassword = await bcrypt.hash(insertUser.password, 12);
    const user: User = { ...insertUser, id, password: hashedPassword };
    this.users.set(id, user);
    return user;
  }

  async getTasks(userId: string): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter((task) => task.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const now = new Date();
    const task: Task = {
      ...insertTask,
      description: insertTask.description ?? null,
      priority: insertTask.priority ?? "medium",
      estimatedHours: insertTask.estimatedHours ?? "1.0", // Store as string for numeric field
      actualHours: null,
      dueDate: insertTask.dueDate ?? null,
      id,
      xpReward: 0,
      euReward: 0,
      isCompleted: false,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, updateData: UpdateTask): Promise<Task | undefined> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) return undefined;

    // Calculate XP and EU rewards if task is being completed
    let calculatedRewards = {};
    if (updateData.isCompleted && !existingTask.isCompleted) {
      const actualHours = updateData.actualHours || existingTask.estimatedHours;
      // Convert string hours to number for calculation
      const hoursAsNumber = typeof actualHours === 'string' ? parseFloat(actualHours) : actualHours;
      const xpReward = this.calculateXPReward(existingTask.priority, hoursAsNumber);
      const euReward = this.calculateEUReward(existingTask.domain, hoursAsNumber);
      
      calculatedRewards = {
        xpReward,
        euReward,
        actualHours,
      };
    }

    const updatedTask: Task = {
      ...existingTask,
      ...updateData,
      ...calculatedRewards,
      updatedAt: new Date(),
    };
    
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  private calculateXPReward(priority: string, hours: number): number {
    const basePriorityMultipliers = {
      low: 10,
      medium: 15,
      high: 25,
      urgent: 40,
    };
    const baseXP = basePriorityMultipliers[priority as keyof typeof basePriorityMultipliers] || 15;
    // Handle fractional hours properly
    return Math.round(baseXP * hours);
  }

  private calculateEUReward(domain: string, hours: number): number {
    const domainMultipliers = {
      academic: 1.0,
      fitness: 2.5,
      creative: 0.8,
      social: 1.2,
      maintenance: 0.6,
    };
    const multiplier = domainMultipliers[domain as keyof typeof domainMultipliers] || 1.0;
    // Handle fractional hours properly and scale for storage as integer
    return Math.round((hours * multiplier) * 10);
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // Goal management (simplified implementations for MemStorage)
  async getGoals(userId: string): Promise<Goal[]> {
    return Array.from(this.goals.values()).filter((goal) => goal.userId === userId);
  }

  async getGoalsForMonth(userId: string, month: number, year: number): Promise<Goal[]> {
    return Array.from(this.goals.values()).filter(
      (goal) => goal.userId === userId && goal.month === month && goal.year === year
    );
  }

  async getGoal(id: string): Promise<Goal | undefined> {
    return this.goals.get(id);
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const id = randomUUID();
    const now = new Date();
    const goal: Goal = {
      ...insertGoal,
      id,
      isCompleted: false,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.goals.set(id, goal);
    return goal;
  }

  async updateGoal(id: string, updateData: UpdateGoal): Promise<Goal | undefined> {
    const existingGoal = this.goals.get(id);
    if (!existingGoal) return undefined;

    const updatedGoal: Goal = {
      ...existingGoal,
      ...updateData,
      updatedAt: new Date(),
    };
    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }

  async deleteGoal(id: string): Promise<boolean> {
    return this.goals.delete(id);
  }

  // Objective management (simplified implementations)
  async getObjectives(userId: string): Promise<Objective[]> {
    return Array.from(this.objectives.values()).filter((obj) => obj.userId === userId);
  }

  async getObjectivesForQuarter(userId: string, quarter: number, year: number): Promise<Objective[]> {
    return Array.from(this.objectives.values()).filter(
      (obj) => obj.userId === userId && obj.quarter === quarter && obj.year === year
    );
  }

  async getObjective(id: string): Promise<Objective | undefined> {
    return this.objectives.get(id);
  }

  async createObjective(insertObjective: InsertObjective): Promise<Objective> {
    const id = randomUUID();
    const now = new Date();
    const objective: Objective = {
      ...insertObjective,
      id,
      isCompleted: false,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.objectives.set(id, objective);
    return objective;
  }

  async updateObjective(id: string, updateData: UpdateObjective): Promise<Objective | undefined> {
    const existingObjective = this.objectives.get(id);
    if (!existingObjective) return undefined;

    const updatedObjective: Objective = {
      ...existingObjective,
      ...updateData,
      updatedAt: new Date(),
    };
    this.objectives.set(id, updatedObjective);
    return updatedObjective;
  }

  async deleteObjective(id: string): Promise<boolean> {
    return this.objectives.delete(id);
  }

  // Vision management (simplified implementations)
  async getVisions(userId: string): Promise<Vision[]> {
    return Array.from(this.visions.values()).filter((vision) => vision.userId === userId);
  }

  async getVisionsForYear(userId: string, year: number): Promise<Vision[]> {
    return Array.from(this.visions.values()).filter(
      (vision) => vision.userId === userId && vision.year === year
    );
  }

  async getVision(id: string): Promise<Vision | undefined> {
    return this.visions.get(id);
  }

  async createVision(insertVision: InsertVision): Promise<Vision> {
    const id = randomUUID();
    const now = new Date();
    const vision: Vision = {
      ...insertVision,
      id,
      isCompleted: false,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.visions.set(id, vision);
    return vision;
  }

  async updateVision(id: string, updateData: UpdateVision): Promise<Vision | undefined> {
    const existingVision = this.visions.get(id);
    if (!existingVision) return undefined;

    const updatedVision: Vision = {
      ...existingVision,
      ...updateData,
      updatedAt: new Date(),
    };
    this.visions.set(id, updatedVision);
    return updatedVision;
  }

  async deleteVision(id: string): Promise<boolean> {
    return this.visions.delete(id);
  }
}

// DatabaseStorage implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash password for security
    const hashedPassword = await bcrypt.hash(insertUser.password, 12);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  async getTasks(userId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.userId, userId));
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values(insertTask)
      .returning();
    return task;
  }

  async updateTask(id: string, updateData: UpdateTask): Promise<Task | undefined> {
    // Get the existing task to check completion status
    const existingTask = await this.getTask(id);
    if (!existingTask) return undefined;

    // Calculate XP and EU rewards if task is being completed
    let calculatedRewards = {};
    if (updateData.isCompleted && !existingTask.isCompleted) {
      const actualHours = updateData.actualHours || existingTask.estimatedHours;
      // Convert to number for calculation if it's a string
      const hoursAsNumber = typeof actualHours === 'string' ? parseFloat(actualHours) : Number(actualHours);
      const xpReward = this.calculateXPReward(existingTask.priority, hoursAsNumber);
      const euReward = this.calculateEUReward(existingTask.domain, hoursAsNumber);
      
      calculatedRewards = {
        xpReward,
        euReward,
        actualHours,
        completedAt: new Date(),
      };
    }

    const finalUpdateData = {
      ...updateData,
      ...calculatedRewards,
      updatedAt: new Date(),
    };

    const [task] = await db
      .update(tasks)
      .set(finalUpdateData)
      .where(eq(tasks.id, id))
      .returning();
    return task || undefined;
  }

  private calculateXPReward(priority: string, hours: number): number {
    const basePriorityMultipliers = {
      low: 10,
      medium: 15,
      high: 25,
      urgent: 40,
    };
    const baseXP = basePriorityMultipliers[priority as keyof typeof basePriorityMultipliers] || 15;
    return Math.round(baseXP * hours);
  }

  private calculateEUReward(domain: string, hours: number): number {
    const domainMultipliers = {
      academic: 1.0,
      fitness: 2.5,
      creative: 0.8,
      social: 1.2,
      maintenance: 0.6,
    };
    const multiplier = domainMultipliers[domain as keyof typeof domainMultipliers] || 1.0;
    return Math.round((hours * multiplier) * 10);
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Goal management (monthly planning)
  async getGoals(userId: string): Promise<Goal[]> {
    return await db.select().from(goals).where(eq(goals.userId, userId));
  }

  async getGoalsForMonth(userId: string, month: number, year: number): Promise<Goal[]> {
    return await db.select().from(goals).where(
      and(eq(goals.userId, userId), eq(goals.month, month), eq(goals.year, year))
    );
  }

  async getGoal(id: string): Promise<Goal | undefined> {
    const [goal] = await db.select().from(goals).where(eq(goals.id, id));
    return goal || undefined;
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const [goal] = await db.insert(goals).values(insertGoal).returning();
    return goal;
  }

  async updateGoal(id: string, updateData: UpdateGoal): Promise<Goal | undefined> {
    const [goal] = await db
      .update(goals)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(goals.id, id))
      .returning();
    return goal || undefined;
  }

  async deleteGoal(id: string): Promise<boolean> {
    const result = await db.delete(goals).where(eq(goals.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Objective management (quarterly planning)
  async getObjectives(userId: string): Promise<Objective[]> {
    return await db.select().from(objectives).where(eq(objectives.userId, userId));
  }

  async getObjectivesForQuarter(userId: string, quarter: number, year: number): Promise<Objective[]> {
    return await db.select().from(objectives).where(
      and(eq(objectives.userId, userId), eq(objectives.quarter, quarter), eq(objectives.year, year))
    );
  }

  async getObjective(id: string): Promise<Objective | undefined> {
    const [objective] = await db.select().from(objectives).where(eq(objectives.id, id));
    return objective || undefined;
  }

  async createObjective(insertObjective: InsertObjective): Promise<Objective> {
    const [objective] = await db.insert(objectives).values(insertObjective).returning();
    return objective;
  }

  async updateObjective(id: string, updateData: UpdateObjective): Promise<Objective | undefined> {
    const [objective] = await db
      .update(objectives)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(objectives.id, id))
      .returning();
    return objective || undefined;
  }

  async deleteObjective(id: string): Promise<boolean> {
    const result = await db.delete(objectives).where(eq(objectives.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Vision management (yearly planning)
  async getVisions(userId: string): Promise<Vision[]> {
    return await db.select().from(visions).where(eq(visions.userId, userId));
  }

  async getVisionsForYear(userId: string, year: number): Promise<Vision[]> {
    return await db.select().from(visions).where(
      and(eq(visions.userId, userId), eq(visions.year, year))
    );
  }

  async getVision(id: string): Promise<Vision | undefined> {
    const [vision] = await db.select().from(visions).where(eq(visions.id, id));
    return vision || undefined;
  }

  async createVision(insertVision: InsertVision): Promise<Vision> {
    const [vision] = await db.insert(visions).values(insertVision).returning();
    return vision;
  }

  async updateVision(id: string, updateData: UpdateVision): Promise<Vision | undefined> {
    const [vision] = await db
      .update(visions)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(visions.id, id))
      .returning();
    return vision || undefined;
  }

  async deleteVision(id: string): Promise<boolean> {
    const result = await db.delete(visions).where(eq(visions.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
