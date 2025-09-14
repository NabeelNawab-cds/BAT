import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertTaskSchema, updateTaskSchema, clientTaskSchema, clientUpdateTaskSchema,
  insertGoalSchema, updateGoalSchema, clientGoalSchema, clientUpdateGoalSchema,
  insertObjectiveSchema, updateObjectiveSchema, clientObjectiveSchema, clientUpdateObjectiveSchema,
  insertVisionSchema, updateVisionSchema, clientVisionSchema, clientUpdateVisionSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { generateTaskSuggestions, explainTaskStrategy, generateAlfredResponse } from "./gemini";

export async function registerRoutes(app: Express): Promise<Server> {
  // Task management routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const tasks = await storage.getTasks(userId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Use client schema for validation and conversion
      const validatedData = clientTaskSchema.parse(req.body);
      // Convert to server format with decimal hours and ISO dates
      const taskData: any = {
        ...validatedData,
        userId,
        estimatedHours: validatedData.estimatedHours.toString(), // Store as string for numeric field
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
      };
      // Clean undefined values and parse with server schema
      Object.keys(taskData).forEach(key => {
        if (taskData[key] === undefined) delete taskData[key];
      });
      const task = await storage.createTask(insertTaskSchema.parse(taskData));
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid task data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const taskId = req.params.id;
      const existingTask = await storage.getTask(taskId);
      
      if (!existingTask || existingTask.userId !== userId) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Use client update schema for validation (prevents reward tampering)
      const validatedUpdate = clientUpdateTaskSchema.parse(req.body);
      
      // Prevent un-completing tasks to maintain reward integrity
      if (validatedUpdate.isCompleted === false && existingTask.isCompleted) {
        return res.status(400).json({ 
          error: "Cannot un-complete a task", 
          message: "Tasks cannot be marked as incomplete once completed to maintain reward integrity." 
        });
      }
      
      // Convert to server format
      const updateData: any = {
        ...validatedUpdate,
        estimatedHours: validatedUpdate.estimatedHours ? validatedUpdate.estimatedHours.toString() : undefined,
        actualHours: validatedUpdate.actualHours ? validatedUpdate.actualHours.toString() : undefined,
        dueDate: validatedUpdate.dueDate ? new Date(validatedUpdate.dueDate) : undefined,
        completedAt: validatedUpdate.isCompleted ? new Date() : undefined,
      };
      // Clean undefined values and parse with server schema
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) delete updateData[key];
      });
      const updatedTask = await storage.updateTask(taskId, updateTaskSchema.parse(updateData));
      
      if (!updatedTask) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      res.json(updatedTask);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid update data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const taskId = req.params.id;
      const existingTask = await storage.getTask(taskId);
      
      if (!existingTask || existingTask.userId !== userId) {
        return res.status(404).json({ error: "Task not found" });
      }

      const deleted = await storage.deleteTask(taskId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // AI-powered task suggestions
  app.get("/api/tasks/suggestions", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const existingTasks = await storage.getTasks(userId);
      const suggestions = await generateTaskSuggestions(existingTasks);
      
      res.json(suggestions);
    } catch (error) {
      console.error('Task suggestions error:', error);
      res.status(500).json({ error: "ALFRED is currently offline" });
    }
  });

  // AI task strategy explanation
  app.post("/api/tasks/:id/explain", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const taskId = req.params.id;
      const task = await storage.getTask(taskId);
      
      if (!task || task.userId !== userId) {
        return res.status(404).json({ error: "Task not found" });
      }

      const explanation = await explainTaskStrategy(task);
      
      res.json({ explanation });
    } catch (error) {
      console.error('Task explanation error:', error);
      res.status(500).json({ error: "ALFRED is currently offline" });
    }
  });

  // ALFRED general chat endpoint
  app.post("/api/alfred/chat", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { message, context = [] } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Message is required" });
      }

      const response = await generateAlfredResponse(message, context, userId);
      
      res.json({ response });
    } catch (error) {
      console.error('ALFRED chat error:', error);
      res.status(500).json({ error: "ALFRED is currently offline" });
    }
  });

  // Goals management routes (monthly planning)
  app.get("/api/goals", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { month, year } = req.query;
      const goals = month && year 
        ? await storage.getGoalsForMonth(userId, parseInt(month as string), parseInt(year as string))
        : await storage.getGoals(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  app.post("/api/goals", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const validatedData = clientGoalSchema.parse(req.body);
      const goalData: any = {
        ...validatedData,
        userId,
        targetValue: validatedData.targetValue.toString(),
        currentValue: validatedData.currentValue.toString(),
        deadline: validatedData.deadline ? new Date(validatedData.deadline) : null,
      };
      
      Object.keys(goalData).forEach(key => {
        if (goalData[key] === undefined) delete goalData[key];
      });
      
      const goal = await storage.createGoal(insertGoalSchema.parse(goalData));
      res.status(201).json(goal);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid goal data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create goal" });
    }
  });

  app.patch("/api/goals/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const goalId = req.params.id;
      const existingGoal = await storage.getGoal(goalId);
      
      if (!existingGoal || existingGoal.userId !== userId) {
        return res.status(404).json({ error: "Goal not found" });
      }

      const validatedUpdate = clientUpdateGoalSchema.parse(req.body);
      const updateData: any = {
        ...validatedUpdate,
        targetValue: validatedUpdate.targetValue ? validatedUpdate.targetValue.toString() : undefined,
        currentValue: validatedUpdate.currentValue ? validatedUpdate.currentValue.toString() : undefined,
        deadline: validatedUpdate.deadline ? new Date(validatedUpdate.deadline) : undefined,
      };
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) delete updateData[key];
      });
      
      const updatedGoal = await storage.updateGoal(goalId, updateGoalSchema.parse(updateData));
      if (!updatedGoal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      
      res.json(updatedGoal);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid update data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update goal" });
    }
  });

  app.delete("/api/goals/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const goalId = req.params.id;
      const existingGoal = await storage.getGoal(goalId);
      
      if (!existingGoal || existingGoal.userId !== userId) {
        return res.status(404).json({ error: "Goal not found" });
      }

      const deleted = await storage.deleteGoal(goalId);
      if (!deleted) {
        return res.status(404).json({ error: "Goal not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete goal" });
    }
  });

  // Objectives management routes (quarterly planning)
  app.get("/api/objectives", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { quarter, year } = req.query;
      const objectives = quarter && year 
        ? await storage.getObjectivesForQuarter(userId, parseInt(quarter as string), parseInt(year as string))
        : await storage.getObjectives(userId);
      res.json(objectives);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch objectives" });
    }
  });

  app.post("/api/objectives", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const validatedData = clientObjectiveSchema.parse(req.body);
      const objectiveData: any = {
        ...validatedData,
        userId,
        targetMetric: validatedData.targetMetric.toString(),
        currentProgress: validatedData.currentProgress.toString(),
        deadline: validatedData.deadline ? new Date(validatedData.deadline) : null,
      };
      
      Object.keys(objectiveData).forEach(key => {
        if (objectiveData[key] === undefined) delete objectiveData[key];
      });
      
      const objective = await storage.createObjective(insertObjectiveSchema.parse(objectiveData));
      res.status(201).json(objective);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid objective data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create objective" });
    }
  });

  app.patch("/api/objectives/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const objectiveId = req.params.id;
      const existingObjective = await storage.getObjective(objectiveId);
      
      if (!existingObjective || existingObjective.userId !== userId) {
        return res.status(404).json({ error: "Objective not found" });
      }

      const validatedUpdate = clientUpdateObjectiveSchema.parse(req.body);
      const updateData: any = {
        ...validatedUpdate,
        targetMetric: validatedUpdate.targetMetric ? validatedUpdate.targetMetric.toString() : undefined,
        currentProgress: validatedUpdate.currentProgress ? validatedUpdate.currentProgress.toString() : undefined,
        deadline: validatedUpdate.deadline ? new Date(validatedUpdate.deadline) : undefined,
      };
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) delete updateData[key];
      });
      
      const updatedObjective = await storage.updateObjective(objectiveId, updateObjectiveSchema.parse(updateData));
      if (!updatedObjective) {
        return res.status(404).json({ error: "Objective not found" });
      }
      
      res.json(updatedObjective);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid update data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update objective" });
    }
  });

  app.delete("/api/objectives/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const objectiveId = req.params.id;
      const existingObjective = await storage.getObjective(objectiveId);
      
      if (!existingObjective || existingObjective.userId !== userId) {
        return res.status(404).json({ error: "Objective not found" });
      }

      const deleted = await storage.deleteObjective(objectiveId);
      if (!deleted) {
        return res.status(404).json({ error: "Objective not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete objective" });
    }
  });

  // Visions management routes (yearly planning)
  app.get("/api/visions", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { year } = req.query;
      const visions = year 
        ? await storage.getVisionsForYear(userId, parseInt(year as string))
        : await storage.getVisions(userId);
      res.json(visions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch visions" });
    }
  });

  app.post("/api/visions", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const validatedData = clientVisionSchema.parse(req.body);
      const visionData: any = {
        ...validatedData,
        userId,
      };
      
      Object.keys(visionData).forEach(key => {
        if (visionData[key] === undefined) delete visionData[key];
      });
      
      const vision = await storage.createVision(insertVisionSchema.parse(visionData));
      res.status(201).json(vision);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid vision data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create vision" });
    }
  });

  app.patch("/api/visions/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const visionId = req.params.id;
      const existingVision = await storage.getVision(visionId);
      
      if (!existingVision || existingVision.userId !== userId) {
        return res.status(404).json({ error: "Vision not found" });
      }

      const validatedUpdate = clientUpdateVisionSchema.parse(req.body);
      
      const updatedVision = await storage.updateVision(visionId, updateVisionSchema.parse(validatedUpdate));
      if (!updatedVision) {
        return res.status(404).json({ error: "Vision not found" });
      }
      
      res.json(updatedVision);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid update data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update vision" });
    }
  });

  app.delete("/api/visions/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const visionId = req.params.id;
      const existingVision = await storage.getVision(visionId);
      
      if (!existingVision || existingVision.userId !== userId) {
        return res.status(404).json({ error: "Vision not found" });
      }

      const deleted = await storage.deleteVision(visionId);
      if (!deleted) {
        return res.status(404).json({ error: "Vision not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete vision" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
