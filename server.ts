import express from "express";
import type { Request } from "express";
import path from "path";
import multer from "multer";
import fs from "fs";
import { DatabaseSync } from "node:sqlite";

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

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const dataDir = process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : process.cwd();

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Ensure uploads directory exists
  const uploadsDir = path.join(dataDir, "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const SUBMISSIONS_FILE = path.join(dataDir, "submissions.json");
  const SETTINGS_FILE = path.join(dataDir, "settings.json");
  const SQLITE_DB_FILE = path.join(dataDir, "sqlite.db");
  const LEGACY_SUBMISSIONS_FILE = SUBMISSIONS_FILE;
  const db = new DatabaseSync(SQLITE_DB_FILE);

  await db.exec(`
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
    );
  `);

  const legacySubmissions = fs.existsSync(LEGACY_SUBMISSIONS_FILE)
    ? JSON.parse(fs.readFileSync(LEGACY_SUBMISSIONS_FILE, "utf-8"))
    : [];

  if (Array.isArray(legacySubmissions) && legacySubmissions.length > 0) {
    const stats = db
      .prepare("SELECT COUNT(*) AS count FROM submissions")
      .get() as { count: number } | undefined;

    if (!stats?.count) {
      const insert = db.prepare(`
        INSERT INTO submissions (
          id, name, email, phone, age, college, course, gradYear, partner,
          domain, appName, ideaDesc, problem, unique_text, timestamp,
          liveLink, pdfUrl, ytLink
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      try {
        db.exec("BEGIN");
        for (const item of legacySubmissions as Submission[]) {
          insert.run(
            item.id,
            item.name,
            item.email,
            item.phone,
            item.age,
            item.college,
            item.course,
            item.gradYear,
            item.partner || "",
            item.domain,
            item.appName,
            item.ideaDesc,
            item.problem,
            item.unique_text,
            item.timestamp,
            item.liveLink || "",
            item.pdfUrl || "",
            item.ytLink || ""
          );
        }
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    }
  }

  async function readSubmissions(): Promise<Submission[]> {
    return db.prepare(`
      SELECT
        id, name, email, phone, age, college, course, gradYear, partner,
        domain, appName, ideaDesc, problem, unique_text, timestamp,
        liveLink, pdfUrl, ytLink
      FROM submissions
      ORDER BY ROWID DESC
    `).all() as unknown as Submission[];
  }

  async function insertSubmission(data: Submission) {
    db.prepare(
      `
        INSERT INTO submissions (
          id, name, email, phone, age, college, course, gradYear, partner,
          domain, appName, ideaDesc, problem, unique_text, timestamp,
          liveLink, pdfUrl, ytLink
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    ).run(
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
    );
  }

  async function deleteSubmission(id: string) {
    db.prepare("DELETE FROM submissions WHERE id = ?").run(id);
  }

  function readSettings(): Settings {
    if (!fs.existsSync(SETTINGS_FILE)) {
      return {};
    }
    try {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
    } catch (e) {
      console.error("Failed to read settings file, resetting to empty", e);
      return {};
    }
  }

  function writeSettings(data: Settings) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), "utf-8");
  }

  const CERTIFICATES_FILE = path.join(dataDir, "certificates.json");

  function readCertificates(): Certificate[] {
    if (!fs.existsSync(CERTIFICATES_FILE)) {
      const initial = [
        {
          certNumber: "TM-2026-001",
          name: "Amit Sharma",
          issueDate: "2026-07-01",
          projectName: "AI Education Assistant"
        }
      ];
      fs.writeFileSync(CERTIFICATES_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    try {
      return JSON.parse(fs.readFileSync(CERTIFICATES_FILE, "utf-8"));
    } catch (e) {
      console.error("Failed to read certificates file, resetting to empty", e);
      return [];
    }
  }

  function writeCertificates(data: Certificate[]) {
    fs.writeFileSync(CERTIFICATES_FILE, JSON.stringify(data, null, 2), "utf-8");
  }

  // Seed default settings if empty
  const defaultSettings = {
    adminPasscode: "admin123", // Set default admin passcode
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

  const currentSettings = readSettings();
  if (Object.keys(currentSettings).length === 0) {
    writeSettings(defaultSettings);
  } else if (!currentSettings.adminPasscode) {
    // Ensure adminPasscode always exists in settings
    currentSettings.adminPasscode = "admin123";
    writeSettings(currentSettings);
  }

  // Multer Storage Configuration for PDF Uploads
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const fileExt = path.extname(file.originalname);
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `project-${uniqueSuffix}${fileExt}`);
    }
  });

  const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype === "application/pdf") {
        cb(null, true);
      } else {
        cb(new Error("Only PDF files are allowed!"));
      }
    }
  });

  app.use(express.json());
  app.use("/uploads", express.static(uploadsDir));

  // API Routes
  // 1. Get health
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // 2. File upload route
  app.post("/api/upload", (req, res) => {
    upload.single("file")(req, res, (err) => {
      const uploadReq = req as Request & { file?: Express.Multer.File };
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ error: err.message });
      }
      if (!uploadReq.file) {
        return res.status(400).json({ error: "No file was uploaded." });
      }
      res.json({ fileUrl: `/uploads/${uploadReq.file.filename}` });
    });
  });

  // 3. Settings endpoint (Get) - Strips sensitive data like adminPasscode
  app.get("/api/settings", (req, res) => {
    try {
      const settingsMap = readSettings();
      const sanitized = { ...settingsMap };
      delete sanitized.adminPasscode; // Remove passcode so it isn't public
      res.json(sanitized);
    } catch (error: any) {
      console.error("Failed to fetch settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // 4. Settings endpoint (Save)
  app.post("/api/settings", (req, res) => {
    try {
      const updates = req.body;
      if (!updates || typeof updates !== "object") {
        return res.status(400).json({ error: "Invalid payload" });
      }

      const existing = readSettings();
      // Retain existing passcode in case client didn't supply it
      const adminPasscode = existing.adminPasscode || "admin123";
      const updated = { ...existing, ...updates, adminPasscode };
      writeSettings(updated);

      res.json({ success: true });
    } catch (error: any) {
      console.error("Failed to save settings:", error);
      res.status(500).json({ error: "Failed to save settings" });
    }
  });

  // 4a. Admin Login Verification
  app.post("/api/admin/login", (req, res) => {
    try {
      const { passcode } = req.body;
      if (!passcode) {
        return res.status(400).json({ error: "Passcode is required" });
      }

      const currentSettings = readSettings();
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
  app.post("/api/admin/change-passcode", (req, res) => {
    try {
      const { currentPasscode, newPasscode } = req.body;
      if (!currentPasscode || !newPasscode) {
        return res.status(400).json({ error: "Both current and new passcodes are required." });
      }
      if (newPasscode.trim().length < 4) {
        return res.status(400).json({ error: "New passcode must be at least 4 characters long." });
      }

      const currentSettings = readSettings();
      const correctPasscode = currentSettings.adminPasscode || "admin123";

      if (currentPasscode !== correctPasscode) {
        return res.status(401).json({ error: "Current passcode is incorrect." });
      }

      currentSettings.adminPasscode = newPasscode;
      writeSettings(currentSettings);

      res.json({ success: true });
    } catch (error) {
      console.error("Passcode change failed:", error);
      res.status(500).json({ error: "Could not change passcode" });
    }
  });

  // 5. Submit new idea
  app.post("/api/submissions", (req, res) => {
    (async () => {
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

      // Return matching interface
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
    })();
  });

  // 6. Get all submissions (for admin preview)
  app.get("/api/submissions", (req, res) => {
    (async () => {
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
    })();
  });

  // 7. Delete a submission
  app.delete("/api/submissions/:id", (req, res) => {
    (async () => {
      try {
      const { id } = req.params;
      await deleteSubmission(id);
      res.json({ success: true });
      } catch (error: any) {
      console.error("Failed to delete submission:", error);
      res.status(500).json({ error: error.message || "Failed to delete submission" });
      }
    })();
  });

  // 8. Get verifiable certificate by certNumber (Public)
  app.get("/api/certificates/:certNumber", (req, res) => {
    try {
      const { certNumber } = req.params;
      const certs = readCertificates();
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
  app.get("/api/certificates", (req, res) => {
    try {
      const certs = readCertificates();
      res.json(certs);
    } catch (error: any) {
      console.error("Failed to fetch certificates:", error);
      res.status(500).json({ error: error.message || "Failed to fetch certificates" });
    }
  });

  // 10. Create a verifiable certificate (Admin)
  app.post("/api/certificates", (req, res) => {
    try {
      const { certNumber, name, issueDate, projectName } = req.body;
      if (!certNumber || !name || !issueDate || !projectName) {
        return res.status(400).json({ error: "All certificate fields (certNumber, name, issueDate, projectName) are required." });
      }

      const certs = readCertificates();
      if (certs.some(c => c.certNumber.toLowerCase() === certNumber.trim().toLowerCase())) {
        return res.status(400).json({ error: "A certificate with this number already exists!" });
      }

      const newCert: Certificate = {
        certNumber: certNumber.trim(),
        name: name.trim(),
        issueDate: issueDate.trim(),
        projectName: projectName.trim()
      };

      certs.unshift(newCert);
      writeCertificates(certs);

      res.status(201).json(newCert);
    } catch (error: any) {
      console.error("Failed to create certificate:", error);
      res.status(500).json({ error: error.message || "Failed to create certificate" });
    }
  });

  // 11. Delete a certificate (Admin)
  app.delete("/api/certificates/:certNumber", (req, res) => {
    try {
      const { certNumber } = req.params;
      const certs = readCertificates();
      const filtered = certs.filter(c => c.certNumber.toLowerCase() !== certNumber.trim().toLowerCase());
      writeCertificates(filtered);
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
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
