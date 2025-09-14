import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export function serveStatic(app: Express) {
  // In the bundled Netlify function, __dirname will be something like /var/task/dist/functions/api
  // The static assets are in /var/task/dist/public
  const distPath = path.resolve(__dirname, "..", "..", "public");

  if (!fs.existsSync(distPath)) {
    // Log a more helpful error message in case of failure
    console.error(`Could not find the build directory at: ${distPath}`);
    console.error(`__dirname is: ${__dirname}`);
    throw new Error(
      `Could not find the build directory. Please ensure the client has been built and the path is correct.`,
    );
  }

  app.use(express.static(distPath));

  // Fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
