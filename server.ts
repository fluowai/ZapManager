import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";

const db = new Database("instances.db");
const JWT_SECRET = process.env.JWT_SECRET || "zap-manager-secret-key-2026";
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "https://api.consultio.com.br";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "8b90148caf66df22c8212b810d64270b";

// Helper for Evolution API
async function callEvolutionApi(endpoint: string, method: string = "GET", body: any = null) {
  try {
    // Ensure no double slashes by normalizing base URL and endpoint
    const baseUrl = EVOLUTION_API_URL.replace(/\/+$/, "");
    const path = endpoint.replace(/^\/+/, "");
    const url = `${baseUrl}/${path}`;
    
    console.log(`Calling Evolution API: ${method} ${url}`);
    if (body) console.log("Request Body:", JSON.stringify(body, null, 2));
    
    const options: any = {
      method,
      headers: {
        "Content-Type": "application/json",
        "apikey": EVOLUTION_API_KEY
      }
    };
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(url, options);
    console.log(`Response Status: ${response.status} ${response.statusText}`);
    
    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error(`Evolution API returned non-JSON (${response.status}):`, text.substring(0, 500));
      return { ok: false, error: `Invalid response format: ${text.substring(0, 50)}` };
    }

    const data = await response.json();
    console.log("Response Data:", JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error(`Evolution API Error (${response.status}):`, JSON.stringify(data));
    }
    
    return { ok: response.ok, data };
  } catch (error) {
    console.error(`Evolution API Network Error (${endpoint}):`, error);
    return { ok: false, error };
  }
}

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'operator'
  );

  CREATE TABLE IF NOT EXISTS instances (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'disconnected',
    phone TEXT,
    webhook_url TEXT,
    alert_enabled INTEGER DEFAULT 0,
    alert_email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS llm_configs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    api_key TEXT NOT NULL,
    model TEXT NOT NULL,
    is_active INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    username TEXT,
    action TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Create default admin if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE username = ?").get("admin");
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)").run(
    Math.random().toString(36).substring(2, 9),
    "admin",
    hashedPassword,
    "administrator"
  );
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  const authorize = (roles: string[]) => (req: any, res: any, next: any) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };

  const logAction = (userId: string | null, username: string | null, action: string, details: string | null = null) => {
    try {
      db.prepare("INSERT INTO audit_logs (user_id, username, action, details) VALUES (?, ?, ?, ?)").run(
        userId,
        username,
        action,
        details
      );
    } catch (err) {
      console.error("Failed to log action:", err);
    }
  };

  // Auth Routes
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      logAction(null, username, "LOGIN_FAILED", "Tentativa de login inválida");
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
    logAction(user.id, user.username, "LOGIN_SUCCESS");
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  });

  app.post("/api/auth/register", authenticate, authorize(["administrator"]), (req: any, res) => {
    const { username, password, role } = req.body;
    const id = Math.random().toString(36).substring(2, 9);
    const hashedPassword = bcrypt.hashSync(password, 10);
    try {
      db.prepare("INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)").run(id, username, hashedPassword, role);
      logAction(req.user.id, req.user.username, "USER_REGISTERED", `Novo usuário: ${username} (${role})`);
      res.status(201).json({ id, username, role });
    } catch (err) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  app.get("/api/users", authenticate, authorize(["administrator"]), (req, res) => {
    const users = db.prepare("SELECT id, username, role FROM users").all();
    res.json(users);
  });

  // Instance Routes
  app.get("/api/instances", authenticate, async (req, res) => {
    try {
      // Sync with Evolution API
      const { ok, data } = await callEvolutionApi("/instance/fetchInstances");
      
      if (ok && Array.isArray(data)) {
        // Update local DB based on Evolution data
        const evolutionInstances = data;
        const existingInstances = db.prepare("SELECT * FROM instances").all() as any[];
        
        // Update existing or insert new from Evolution
        for (const evoInst of evolutionInstances) {
          const exists = existingInstances.find(i => i.name === evoInst.instance.instanceName);
          
          let status = "disconnected";
          if (evoInst.instance.status === "open") status = "connected";
          else if (evoInst.instance.status === "connecting") status = "connecting";
          
          if (exists) {
            db.prepare("UPDATE instances SET status = ?, phone = ? WHERE id = ?").run(
              status, 
              evoInst.instance.owner, 
              exists.id
            );
          } else {
            // If it exists in Evolution but not locally, add it
            const id = Math.random().toString(36).substring(2, 9);
            db.prepare("INSERT INTO instances (id, name, status, phone) VALUES (?, ?, ?, ?)").run(
              id, 
              evoInst.instance.instanceName, 
              status,
              evoInst.instance.owner
            );
          }
        }
      }
      
      const instances = db.prepare("SELECT * FROM instances ORDER BY created_at DESC").all();
      res.json(instances);
    } catch (error) {
      console.error("Failed to sync instances:", error);
      // Fallback to local DB
      const instances = db.prepare("SELECT * FROM instances ORDER BY created_at DESC").all();
      res.json(instances);
    }
  });

  app.get("/api/evolution/check", authenticate, authorize(["administrator"]), async (req, res) => {
    const { ok, data, error } = await callEvolutionApi("/instance/fetchInstances");
    res.json({ ok, data, error });
  });

  app.post("/api/instances", authenticate, authorize(["administrator"]), async (req: any, res) => {
    const { name, webhook_url } = req.body;
    const id = Math.random().toString(36).substring(2, 9);
    
    try {
      // Create in Evolution API
      const createBody: any = {
        instanceName: name,
        token: Math.random().toString(36).substring(2, 15),
        qrcode: true
      };
      
      const { ok, data, error } = await callEvolutionApi("/instance/create", "POST", createBody);
      
      // Handle "Instance already exists" case
      let instanceData = data;
      const errorData = data as any;
      if (!ok) {
        // Check if error indicates instance already exists
        const errorMsg = JSON.stringify(error || "").toLowerCase();
        if (errorMsg.includes("already exists") || (errorData && errorData.error && typeof errorData.error === 'string' && errorData.error.includes("already exists"))) {
           console.log(`Instance ${name} already exists in Evolution API, syncing local DB...`);
           // Fetch the existing instance to get its details
           const fetchRes = await callEvolutionApi(`/instance/fetchInstances`);
           if (fetchRes.ok && Array.isArray(fetchRes.data)) {
             const existing = fetchRes.data.find((i: any) => i.instance.instanceName === name);
             if (existing) {
               instanceData = existing.instance;
             }
           }
        } else {
           return res.status(500).json({ error: "Failed to create instance in Evolution API", details: error || data });
        }
      }

      // Set Webhook if provided
      if (webhook_url) {
        await callEvolutionApi(`/webhook/set/${name}`, "POST", {
          webhook: webhook_url,
          webhookByEvents: false,
          events: ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "SEND_MESSAGE"]
        });
      }

      const existingLocal = db.prepare("SELECT * FROM instances WHERE name = ?").get(name) as any;
      let localId = existingLocal ? existingLocal.id : id;

      if (existingLocal) {
        db.prepare("UPDATE instances SET webhook_url = ? WHERE id = ?").run(webhook_url || null, localId);
      } else {
        db.prepare("INSERT INTO instances (id, name, webhook_url, status) VALUES (?, ?, ?, ?)").run(localId, name, webhook_url || null, "disconnected");
      }
      
      const newInstance = db.prepare("SELECT * FROM instances WHERE id = ?").get(localId) as any;
      logAction(req.user.id, req.user.username, "INSTANCE_CREATED", `Instância: ${name} (${localId})`);
      
      // Return instance + qrcode if available
      const responseData = { ...newInstance };
      
      // If we just created it, data might have qrcode. If it existed, we might need to fetch it.
      const createData = data as any;
      if (ok && createData && (createData.qrcode || createData.base64)) {
        responseData.qrcode = createData.qrcode || createData.base64;
      } else {
        // Try to fetch QR code explicitly
        try {
          // Wait a moment for instance to initialize
          await new Promise(resolve => setTimeout(resolve, 1000));
          const qrRes = await callEvolutionApi(`/instance/connect/${name}`);
          const qrData = qrRes.data as any;
          if (qrRes.ok && qrData && (qrData.base64 || qrData.qrcode)) {
             responseData.qrcode = qrData.base64 || qrData.qrcode;
          }
        } catch (qrError) {
          console.error("Failed to fetch QR code after creation:", qrError);
        }
      }
      
      res.status(201).json(responseData);
    } catch (error) {
      console.error("Create instance error:", error);
      res.status(500).json({ error: "Failed to create instance" });
    }
  });

  app.delete("/api/instances/:id", authenticate, authorize(["administrator"]), async (req: any, res) => {
    const { id } = req.params;
    try {
      const instance = db.prepare("SELECT name FROM instances WHERE id = ?").get(id) as any;
      if (!instance) return res.status(404).json({ error: "Instance not found" });

      // Delete from Evolution API
      await callEvolutionApi(`/instance/delete/${instance.name}`, "DELETE");

      db.prepare("DELETE FROM instances WHERE id = ?").run(id);
      logAction(req.user.id, req.user.username, "INSTANCE_DELETED", `Instância: ${instance.name}`);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete instance" });
    }
  });

  app.post("/api/instances/:id/toggle", authenticate, async (req: any, res) => {
    const { id } = req.params;
    const instance = db.prepare("SELECT * FROM instances WHERE id = ?").get(id) as any;
    if (!instance) return res.status(404).json({ error: "Instance not found" });

    if (instance.status === "connected") {
      // Logout
      await callEvolutionApi(`/instance/logout/${instance.name}`, "DELETE");
      db.prepare("UPDATE instances SET status = 'disconnected' WHERE id = ?").run(id);
      res.json({ ...instance, status: "disconnected" });
    } else {
      // Connect (just set status to connecting, frontend will fetch QR)
      db.prepare("UPDATE instances SET status = 'connecting' WHERE id = ?").run(id);
      res.json({ ...instance, status: "connecting" });
    }
  });

  app.get("/api/instances/:id/connect", authenticate, async (req: any, res) => {
    const { id } = req.params;
    const instance = db.prepare("SELECT name FROM instances WHERE id = ?").get(id) as any;
    if (!instance) return res.status(404).json({ error: "Instance not found" });

    try {
      const { ok, data } = await callEvolutionApi(`/instance/connect/${instance.name}`);
      const qrData = data as any;
      if (ok && qrData && (qrData.base64 || qrData.qrcode)) {
        res.json({ base64: qrData.base64 || qrData.qrcode });
      } else {
        res.status(400).json({ error: "Failed to get QR code" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to connect" });
    }
  });

  app.post("/api/instances/:id/restart", authenticate, async (req: any, res) => {
    const { id } = req.params;
    const instance = db.prepare("SELECT name FROM instances WHERE id = ?").get(id) as any;
    if (!instance) return res.status(404).json({ error: "Instance not found" });

    await callEvolutionApi(`/instance/restart/${instance.name}`, "POST");
    logAction(req.user.id, req.user.username, "INSTANCE_RESTART", `Instância: ${instance.name}`);
    
    res.json({ message: "Restarting..." });
  });

  app.post("/api/instances/:id/alerts", authenticate, (req: any, res) => {
    const { id } = req.params;
    const { alert_enabled, alert_email } = req.body;
    try {
      const instance = db.prepare("SELECT name FROM instances WHERE id = ?").get(id);
      db.prepare("UPDATE instances SET alert_enabled = ?, alert_email = ? WHERE id = ?").run(
        alert_enabled ? 1 : 0,
        alert_email,
        id
      );
      logAction(req.user.id, req.user.username, "INSTANCE_ALERTS_UPDATE", `Instância: ${instance?.name || id}, Alertas: ${alert_enabled ? 'Ativos' : 'Inativos'}`);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update alerts" });
    }
  });

  app.post("/api/instances/:id/settings", authenticate, (req: any, res) => {
    const { id } = req.params;
    const { phone, alert_enabled, alert_email } = req.body;
    try {
      const instance = db.prepare("SELECT name FROM instances WHERE id = ?").get(id);
      if (!instance) return res.status(404).json({ error: "Instance not found" });
      
      db.prepare("UPDATE instances SET phone = ?, alert_enabled = ?, alert_email = ? WHERE id = ?").run(
        phone,
        alert_enabled ? 1 : 0,
        alert_email,
        id
      );
      
      logAction(req.user.id, req.user.username, "INSTANCE_SETTINGS_UPDATE", `Instância: ${instance.name}, Fone: ${phone}, Alertas: ${alert_enabled ? 'Ativos' : 'Inativos'}`);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  app.get("/api/audit-logs", authenticate, authorize(["administrator"]), (req, res) => {
    const logs = db.prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100").all();
    res.json(logs);
  });

  // LLM Config Routes
app.get("/api/llms", authenticate, (req: any, res) => {
  const llms = db.prepare("SELECT id, name, provider, model, is_active, created_at FROM llm_configs ORDER BY created_at DESC").all();
  res.json(llms);
});

app.post("/api/llms", authenticate, (req: any, res) => {
  if (req.user.role !== "administrator") return res.status(403).json({ error: "Forbidden" });
  
  const { name, provider, api_key, model } = req.body;
  if (!name || !provider || !api_key || !model) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const id = Math.random().toString(36).substr(2, 9);
  try {
    const stmt = db.prepare("INSERT INTO llm_configs (id, name, provider, api_key, model) VALUES (?, ?, ?, ?, ?)");
    stmt.run(id, name, provider, api_key, model);
    
    logAction(req.user.id, req.user.username, "LLM_CONFIG_CREATED", `Created LLM config: ${name} (${provider})`);
    res.status(201).json({ id, name, provider, model });
  } catch (err) {
    res.status(500).json({ error: "Failed to create LLM config" });
  }
});

app.delete("/api/llms/:id", authenticate, (req: any, res) => {
  if (req.user.role !== "administrator") return res.status(403).json({ error: "Forbidden" });
  
  try {
    const stmt = db.prepare("DELETE FROM llm_configs WHERE id = ?");
    const result = stmt.run(req.params.id);
    
    if (result.changes > 0) {
      logAction(req.user.id, req.user.username, "LLM_CONFIG_DELETED", `Deleted LLM config ID: ${req.params.id}`);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Config not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to delete config" });
  }
});

app.post("/api/llms/:id/toggle", authenticate, (req: any, res) => {
  if (req.user.role !== "administrator") return res.status(403).json({ error: "Forbidden" });

  try {
    // First, deactivate all others if we want only one active (optional, but good for simplicity)
    // For now, let's just toggle the specific one. Or maybe we want only one active per provider?
    // Let's stick to simple toggle.
    
    const current = db.prepare("SELECT is_active FROM llm_configs WHERE id = ?").get(req.params.id) as any;
    if (!current) return res.status(404).json({ error: "Config not found" });

    const newStatus = current.is_active ? 0 : 1;
    db.prepare("UPDATE llm_configs SET is_active = ? WHERE id = ?").run(newStatus, req.params.id);
    
    logAction(req.user.id, req.user.username, "LLM_CONFIG_TOGGLED", `Toggled LLM config ${req.params.id} to ${newStatus ? 'active' : 'inactive'}`);
    res.json({ success: true, is_active: newStatus });
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle config" });
  }
});

// Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Global Server Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error", details: err.message });
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
