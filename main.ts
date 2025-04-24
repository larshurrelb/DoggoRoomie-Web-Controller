// main.ts

// to run deno app:
// deno --allow-net --allow-read main.ts
import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { CONFIG } from "./public/config.js";

const app = new Application();
const router = new Router();
const wsClients = new Set<WebSocket>();
const port = 3000;

// Configuration
const VALETUDO_HOST = `http://${CONFIG.VALETUDO_HOST}`;
const AUTH_USERNAME = "valetudo";
const AUTH_PASSWORD = "weepT2dFeAqdfdLd";

const ARDUINO_HOST = `http://${CONFIG.ARDUINO_HOST}`;
let servoActive = false;

// Use btoa for Base64 encoding
const basicAuth = `Basic ${btoa(`${AUTH_USERNAME}:${AUTH_PASSWORD}`)}`;

// Add CORS middleware
app.use(oakCors());

// Add MIME type mapping
const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.html': 'text/html',
  '.wav': 'audio/wav',
};

// Update static file serving middleware
app.use(async (ctx, next) => {
  try {
    const path = ctx.request.url.pathname;
    const extension = path.substring(path.lastIndexOf('.'));
    if (MIME_TYPES[extension]) {
      ctx.response.headers.set('Content-Type', MIME_TYPES[extension]);
    }
    
    await ctx.send({
      root: `${Deno.cwd()}/public`,
      index: "index.html",
    });
  } catch {
    await next();
  }
});

// Add WebSocket endpoint
router.get("/ws", async (ctx) => {
  if (!ctx.isUpgradable) {
    ctx.throw(400, "Connection is not upgradable");
  }

  const ws = await ctx.upgrade();
  wsClients.add(ws);
  console.log("Client connected");

  ws.onmessage = (msg) => {
    console.log("Received trigger:", msg.data);
    // Broadcast to all other clients
    wsClients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(msg.data);
      }
    });
  };

  ws.onclose = () => {
    wsClients.delete(ws);
    console.log("Client disconnected");
  };
});

interface CommandRequest {
  command: string;
}

// Control endpoint
router.post("/control", async (ctx) => {
  try {
    // Correctly access the request body
    const body = ctx.request.body({ type: "json" });
    const value = await body.value as CommandRequest;
    const command = value.command;

    console.log(`Received command: ${command}`);

    const endpoint = "/api/v2/robot/capabilities/ManualControlCapability";
    let payload: Record<string, unknown> = {};

    if (command === "ENABLE" || command === "DISABLE") {
      payload = {
        action: command === "ENABLE" ? "enable" : "disable",
      };
    } else if (
      ["FORWARD", "BACKWARD", "ROTATE_CLOCKWISE", "ROTATE_COUNTERCLOCKWISE"].includes(command)
    ) {
      payload = {
        action: "move",
        movementCommand: command.toLowerCase(),
      };
    } else if (command === "STOP") {
      payload = {
        action: "move",
      };
    } else if (command === "TOGGLE_SERVO") {
      servoActive = !servoActive;
      try {
        const response = await fetch(`${ARDUINO_HOST}/${servoActive ? 'start' : 'stop'}`);
        if (!response.ok) {
          throw new Error('Arduino command failed');
        }
        ctx.response.status = 200;
        ctx.response.body = { success: true };
      } catch (error) {
        console.error("Error communicating with Arduino:", error);
        ctx.response.status = 500;
        ctx.response.body = { error: "Communication error with Arduino" };
      }
      return;
    } else if (command.startsWith('SERVO_')) {
      let arduinoCommand = 'x'; // default stop command
      switch (command) {
          case 'SERVO_SPEED1':
              arduinoCommand = 's';  // slow speed
              break;
          case 'SERVO_SPEED2':
              arduinoCommand = 'n';  // medium speed
              break;
          case 'SERVO_SPEED3':
              arduinoCommand = 'f';  // fast speed
              break;
          case 'SERVO_STOP':
              arduinoCommand = 'x';  // stop
              break;
      }
      
      try {
          const response = await fetch(`${ARDUINO_HOST}/${arduinoCommand}`);
          if (!response.ok) {
              throw new Error('Arduino command failed');
          }
          ctx.response.status = 200;
          ctx.response.body = { success: true };
      } catch (error) {
          console.error("Error communicating with Arduino:", error);
          ctx.response.status = 500;
          ctx.response.body = { error: "Communication error with Arduino" };
      }
      return;
    } else {
      ctx.response.status = 400;
      ctx.response.body = { error: "Invalid command" };
      return;
    }

    try {
      const response = await fetch(`${VALETUDO_HOST}${endpoint}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": basicAuth,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(`Valetudo API error: ${response.statusText}`);
        ctx.response.status = 500;
        ctx.response.body = { error: "Valetudo API error" };
        return;
      }

      console.log(`Command ${command} sent successfully`);
      ctx.response.status = 200;
      ctx.response.body = { success: true };
    } catch (error) {
      console.error("Error communicating with Valetudo API:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Communication error with Valetudo API" };
    }
  } catch (error) {
    console.error("Error parsing request body:", error);
    ctx.response.status = 400;
    ctx.response.body = { error: "Failed to parse request body" };
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

console.log(`Server running at http://localhost:${port}`);
await app.listen({ port });