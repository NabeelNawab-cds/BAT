import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./static";
import http from 'http';

// Extend Express Request interface to include session
declare module "express-serve-static-core" {
  interface Request {
    session?: session.Session & {
      userId?: string;
    };
  }
}

export async function createApp(): Promise<{ app: express.Express, server: http.Server }> {
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    if (process.env.NODE_ENV === 'production') {
      app.set('trust proxy', 1);
    }

    if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
      throw new Error("SESSION_SECRET environment variable is required in production");
    }

    app.use(session({
      secret: process.env.SESSION_SECRET || 'batcave-dev-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
      }
    }));

    app.use((req, res, next) => {
      const start = Date.now();
      const path = req.path;
      let capturedJsonResponse: Record<string, any> | undefined = undefined;

      const originalResJson = res.json;
      res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
      };

      res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
          let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
          if (capturedJsonResponse) {
            logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
          }
          if (logLine.length > 80) {
            logLine = logLine.slice(0, 79) + "…";
          }
          log(logLine);
        }
      });

      next();
    });

    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
        throw err;
    });

    if (process.env.NODE_ENV === "development") {
        const { setupVite } = await import("./vite.js");
        await setupVite(app, server);
    } else {
        serveStatic(app);
    }

    return { app, server };
}


// This part is for running the server directly (for local dev)
// It will not run when imported by the Netlify function
// see: https://github.com/privatenumber/tsx/issues/311
if (import.meta.url.endsWith(process.argv[1])) {
    (async () => {
        const { server } = await createApp();
        const port = parseInt(process.env.PORT || '5000', 10);
        server.listen({
            port,
            host: "0.0.0.0",
            reusePort: true,
        }, () => {
            log(`serving on port ${port}`);
        });
    })();
}
