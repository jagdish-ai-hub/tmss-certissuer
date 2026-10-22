import express from "express";
import path from "path";
import { createClient } from "@libsql/client";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

interface Submission {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: string;
  college: string;
  course: string;
  gradYear: string;
  partner: string;
  domain: string;
  appName: string;
  ideaDesc: string;
  problem: string;
  unique_text: string;
  timestamp: string;
  liveLink?: string;
  pdfUrl?: string;
  ytLink?: string;
}

interface Settings {
  [key: string]: string;
}

interface Certificate {
  certNumber: string;
  name: string;
  issueDate: string;
  projectName: string;
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;
const db = createClient(
  TURSO_URL
    ? TURSO_TOKEN
      ? { url: TURSO_URL, authToken: TURSO_TOKEN }
      : { url: TURSO_URL }
    : { url: "file:local.db" }
);

const defaultSettings: Settings = {
  adminPasscode: "admin123",
  heroTitle: "Build Real AI Apps. Win Real Rewards.",
  heroSub: "A project-based internship where your idea becomes a product. Brainstorm, build, and potentially launch on the Play Store — with mentors by your side.",
  heroCompany: "TM Software Solutions · A Unit of TM Asset Management",
  badgeText: "Applications Open — 8 to 10 Days Window",
  rewardTitle: "Rewards & Recognition",
  prize1: "₹3000",
  prize1Desc: "1st Place Cash Prize",
  prize2: "₹2000",
  prize2Desc: "2nd Place Cash Prize",
  prize3: "₹1000",
  prize3Desc: "3rd Place Cash Prize",
  prize4: "₹500",
  prize4Desc: "Next 7 places each",
  prize5: "₹200",
  prize5Desc: "Gift Cards for All Participants",
  aboutTitle: "Turn Your Idea Into a Working App",
  aboutBody: "We're inviting motivated students to transform creative ideas into real-world AI applications. Every successful app started as just an idea — this is your chance to take action, gain hands-on experience, and potentially launch on the Google Play Store.",
  phase1Title: "Ideathon",
  phase1Desc: "Brainstorm unique AI-powered app ideas solving real problems in education or any domain. Ideas must be practical, innovative, and capable of attracting real users.",
  phase2Title: "Mentorship & Refinement",
  phase2Desc: "Selected ideas are reviewed by TM Software mentors who guide participants in refining concepts, improving feasibility, and shaping them into viable products.",
  phase3Title: "App Development",
  phase3Desc: "Build end-to-end using React, Node.js, and modern AI tools like Google AI Studio. Strong apps may be published on the Google Play Store."
};

const ready = (async () => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      age TEXT NOT NULL,
      college TEXT NOT NULL,
      course TEXT NOT NULL,
      gradYear TEXT NOT NULL,
      partner TEXT NOT NULL DEFAULT '',
      domain TEXT NOT NULL,
      appName TEXT NOT NULL,
      ideaDesc TEXT NOT NULL,
      problem TEXT NOT NULL,
      unique_text TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      liveLink TEXT NOT NULL DEFAULT '',
      pdfUrl TEXT NOT NULL DEFAULT '',
      ytLink TEXT NOT NULL DEFAULT ''
    )
  `);
  await db.execute(
    "CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)"
  );
  await db.execute(`
    CREATE TABLE IF NOT EXISTS certificates (
      certNumber TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      issueDate TEXT NOT NULL,
      projectName TEXT NOT NULL
    )
  `);

  const settingsCount = await db.execute("SELECT COUNT(*) AS count FROM settings");
  if (Number(settingsCount.rows[0]?.count ?? 0) === 0) {
    for (const [key, value] of Object.entries(defaultSettings)) {
      await db.execute({
        sql: "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
        args: [key, value]
      });
    }
  }

  const certCount = await db.execute("SELECT COUNT(*) AS count FROM certificates");
  if (Number(certCount.rows[0]?.count ?? 0) === 0) {
    await db.execute({
      sql: "INSERT OR REPLACE INTO certificates (certNumber, name, issueDate, projectName) VALUES (?, ?, ?, ?)",
      args: ["TM-2026-001", "Amit Sharma", "2026-07-01", "AI Education Assistant"]
    });
  }
})();

async function readSubmissions(): Promise<Submission[]> {
  const result = await db.execute(`
    SELECT
      id, name, email, phone, age, college, course, gradYear, partner,
      domain, appName, ideaDesc, problem, unique_text, timestamp,
      liveLink, pdfUrl, ytLink
    FROM submissions
    ORDER BY ROWID DESC
  `);
  return result.rows as unknown as Submission[];
}

async function insertSubmission(data: Submission) {
  await db.execute({
    sql: `
      INSERT INTO submissions (
        id, name, email, phone, age, college, course, gradYear, partner,
        domain, appName, ideaDesc, problem, unique_text, timestamp,
        liveLink, pdfUrl, ytLink
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      data.id,
      data.name,
      data.email,
      data.phone,
      data.age,
      data.college,
      data.course,
      data.gradYear,
      data.partner || "",
      data.domain,
      data.appName,
      data.ideaDesc,
      data.problem,
      data.unique_text,
      data.timestamp,
      data.liveLink || "",
      data.pdfUrl || "",
      data.ytLink || ""
    ]
  });
}

async function deleteSubmission(id: string) {
  await db.execute({ sql: "DELETE FROM submissions WHERE id = ?", args: [id] });
}

async function readSettings(): Promise<Settings> {
  const result = await db.execute("SELECT key, value FROM settings");
  const settings: Settings = {};
  for (const row of result.rows) {
    settings[String(row.key)] = String(row.value);
  }
  return settings;
}

async function writeSettings(data: Settings) {
  for (const [key, value] of Object.entries(data)) {
    await db.execute({
      sql: "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      args: [key, String(value)]
    });
  }
}

async function readCertificates(): Promise<Certificate[]> {
  const result = await db.execute(
    "SELECT certNumber, name, issueDate, projectName FROM certificates ORDER BY ROWID ASC"
  );
  return result.rows as unknown as Certificate[];
}

app.use((req, res, next) => {
  ready.then(() => next()).catch(next);
});
app.use(express.json({ limit: "2mb" }));

// API Routes
// 1. Get health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// 2. Vercel Blob client-upload token
app.post("/api/blob-upload", async (req, res) => {
  try {
    const body = req.body as HandleUploadBody;
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["application/pdf"],
        maximumSizeInBytes: 10 * 1024 * 1024,
        addRandomSuffix: true
      }),
      onUploadCompleted: async () => {}
    });
    res.json(jsonResponse);
  } catch (error: any) {
    console.error("Blob upload token failed:", error);
    res.status(400).json({ error: error.message || "Could not start upload" });
  }
});

// 3. Settings endpoint (Get) - Strips sensitive data like adminPasscode
app.get("/api/settings", async (req, res) => {
  try {
    const settingsMap = await readSettings();
    const sanitized = { ...settingsMap };
    delete sanitized.adminPasscode;
    res.json(sanitized);
  } catch (error: any) {
    console.error("Failed to fetch settings:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// 4. Settings endpoint (Save)
app.post("/api/settings", async (req, res) => {
  try {
    const updates = req.body;
    if (!updates || typeof updates !== "object") {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const existing = await readSettings();
    const adminPasscode = existing.adminPasscode || "admin123";
    const updated = { ...existing, ...updates, adminPasscode };
    await writeSettings(updated);

    res.json({ success: true });
  } catch (error: any) {
    console.error("Failed to save settings:", error);
    res.status(500).json({ error: "Failed to save settings" });
  }
});

// 4a. Admin Login Verification
app.post("/api/admin/login", async (req, res) => {
  try {
    const { passcode } = req.body;
    if (!passcode) {
      return res.status(400).json({ error: "Passcode is required" });
    }

    const currentSettings = await readSettings();
    const correctPasscode = currentSettings.adminPasscode || "admin123";

    if (passcode === correctPasscode) {
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "Incorrect passcode" });
    }
  } catch (error) {
    console.error("Login verification failed:", error);
    res.status(500).json({ error: "Login system error" });
  }
});

// 4b. Admin Change Passcode
app.post("/api/admin/change-passcode", async (req, res) => {
  try {
    const { currentPasscode, newPasscode } = req.body;
    if (!currentPasscode || !newPasscode) {
      return res.status(400).json({ error: "Both current and new passcodes are required." });
    }
    if (newPasscode.trim().length < 4) {
      return res.status(400).json({ error: "New passcode must be at least 4 characters long." });
    }

    const currentSettings = await readSettings();
    const correctPasscode = currentSettings.adminPasscode || "admin123";

    if (currentPasscode !== correctPasscode) {
      return res.status(401).json({ error: "Current passcode is incorrect." });
    }

    currentSettings.adminPasscode = newPasscode;
    await writeSettings({ adminPasscode: newPasscode });

    res.json({ success: true });
  } catch (error) {
    console.error("Passcode change failed:", error);
    res.status(500).json({ error: "Could not change passcode" });
  }
});

// 5. Submit new idea
app.post("/api/submissions", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      age,
      college,
      course,
      gradYear,
      partner,
      domain,
      appName,
      ideaDesc,
      problem,
      unique: unique_text,
      liveLink,
      pdfUrl,
      ytLink
    } = req.body;

    if (!name || !email || !phone || !age || !college || !course || !gradYear || !domain || !appName || !ideaDesc || !problem || !unique_text) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const id = Date.now().toString();
    const timestamp = new Date().toLocaleString();

    const newSub: Submission = {
      id,
      name,
      email,
      phone,
      age,
      college,
      course,
      gradYear,
      partner: partner || "",
      domain,
      appName,
      ideaDesc,
      problem,
      unique_text,
      timestamp,
      liveLink: liveLink || "",
      pdfUrl: pdfUrl || "",
      ytLink: ytLink || ""
    };

    await insertSubmission(newSub);

    res.status(201).json({
      id: newSub.id,
      name: newSub.name,
      email: newSub.email,
      phone: newSub.phone,
      age: newSub.age,
      college: newSub.college,
      course: newSub.course,
      gradYear: newSub.gradYear,
      partner: newSub.partner,
      domain: newSub.domain,
      appName: newSub.appName,
      ideaDesc: newSub.ideaDesc,
      problem: newSub.problem,
      unique: newSub.unique_text,
      timestamp: newSub.timestamp,
      liveLink: newSub.liveLink,
      pdfUrl: newSub.pdfUrl,
      ytLink: newSub.ytLink
    });
  } catch (error: any) {
    console.error("Failed to insert submission:", error);
    res.status(500).json({ error: error.message || "Failed to save submission" });
  }
});

// 6. Get all submissions (for admin preview)
app.get("/api/submissions", async (req, res) => {
  try {
    const rows = await readSubmissions();
    const mapped = rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      age: row.age,
      college: row.college,
      course: row.course,
      gradYear: row.gradYear,
      partner: row.partner,
      domain: row.domain,
      appName: row.appName,
      ideaDesc: row.ideaDesc,
      problem: row.problem,
      unique: row.unique_text,
      timestamp: row.timestamp,
      liveLink: row.liveLink || "",
      pdfUrl: row.pdfUrl || "",
      ytLink: row.ytLink || ""
    }));
    res.json(mapped);
  } catch (error: any) {
    console.error("Failed to fetch submissions:", error);
    res.status(500).json({ error: error.message || "Failed to fetch submissions" });
  }
});

// 7. Delete a submission
app.delete("/api/submissions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await deleteSubmission(id);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete submission:", error);
    res.status(500).json({ error: error.message || "Failed to delete submission" });
  }
});

// 8. Get verifiable certificate by certNumber (Public)
app.get("/api/certificates/:certNumber", async (req, res) => {
  try {
    const { certNumber } = req.params;
    const certs = await readCertificates();
    const found = certs.find(c => c.certNumber.toLowerCase() === certNumber.trim().toLowerCase());
    if (found) {
      res.json({ found: true, certificate: found });
    } else {
      res.json({ found: false });
    }
  } catch (error: any) {
    console.error("Failed to verify certificate:", error);
    res.status(500).json({ error: error.message || "Failed to verify certificate" });
  }
});

// 9. Get all certificates
app.get("/api/certificates", async (req, res) => {
  try {
    const certs = await readCertificates();
    res.json(certs);
  } catch (error: any) {
    console.error("Failed to fetch certificates:", error);
    res.status(500).json({ error: error.message || "Failed to fetch certificates" });
  }
});

// 10. Create a verifiable certificate (Admin)
app.post("/api/certificates", async (req, res) => {
  try {
    const { certNumber, name, issueDate, projectName } = req.body;
    if (!certNumber || !name || !issueDate || !projectName) {
      return res.status(400).json({ error: "All certificate fields (certNumber, name, issueDate, projectName) are required." });
    }

    const certs = await readCertificates();
    if (certs.some(c => c.certNumber.toLowerCase() === certNumber.trim().toLowerCase())) {
      return res.status(400).json({ error: "A certificate with this number already exists!" });
    }

    const newCert: Certificate = {
      certNumber: certNumber.trim(),
      name: name.trim(),
      issueDate: issueDate.trim(),
      projectName: projectName.trim()
    };

    await db.execute({
      sql: "INSERT INTO certificates (certNumber, name, issueDate, projectName) VALUES (?, ?, ?, ?)",
      args: [newCert.certNumber, newCert.name, newCert.issueDate, newCert.projectName]
    });

    res.status(201).json(newCert);
  } catch (error: any) {
    console.error("Failed to create certificate:", error);
    res.status(500).json({ error: error.message || "Failed to create certificate" });
  }
});

// 11. Delete a certificate (Admin)
app.delete("/api/certificates/:certNumber", async (req, res) => {
  try {
    const { certNumber } = req.params;
    await db.execute({
      sql: "DELETE FROM certificates WHERE lower(certNumber) = lower(?)",
      args: [certNumber.trim()]
    });
    res.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete certificate:", error);
    res.status(500).json({ error: error.message || "Failed to delete certificate" });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa"
  });
  app.use(vite.middlewares);
} else {
  const publicDir = path.join(process.cwd(), "public");
  app.use(express.static(publicDir));
  app.get("*", (req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;

if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
