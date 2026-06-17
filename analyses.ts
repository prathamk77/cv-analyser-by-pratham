import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { eq, desc } from "drizzle-orm";
import { db, analysesTable } from "@workspace/db";
import {
  CreateAnalysisBody,
  GetAnalysisParams,
  DeleteAnalysisParams,
  ListAnalysesResponseItem,
} from "@workspace/api-zod";
import { analyseCv } from "../lib/cv-analyser";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const workspaceRoot = process.cwd().endsWith(path.join("artifacts", "api-server"))
  ? path.resolve(process.cwd(), "../..")
  : process.cwd();

const uploadsDir = path.resolve(workspaceRoot, "artifacts/api-server/uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "text/plain"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only PDF and plain text files are allowed"));
  },
});

router.post("/analyses/upload", upload.single("file"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const filePath = req.file.path;
  const fileName = req.file.originalname;

  try {
    let text = "";
    if (req.file.mimetype === "application/pdf") {
      const { extractText } = await import("unpdf");
      const buffer = fs.readFileSync(filePath);
      const result = await extractText(new Uint8Array(buffer), { mergePages: true });
      text = Array.isArray(result.text) ? result.text.join("\n") : (result.text as string);
    } else {
      text = fs.readFileSync(filePath, "utf-8");
    }

    fs.unlinkSync(filePath);
    res.json({ fileName, text: text.trim() });
  } catch (err) {
    req.log.error({ err }, "Failed to parse file");
    try { fs.unlinkSync(filePath); } catch {}
    res.status(500).json({ error: "Failed to extract text from file" });
  }
});

router.get("/analyses", async (_req, res): Promise<void> => {
  const rows = await db.select().from(analysesTable).orderBy(desc(analysesTable.createdAt));
  res.json(rows.map(r => ListAnalysesResponseItem.parse({ ...r, createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt })));
});

router.post("/analyses", async (req, res): Promise<void> => {
  const parsed = CreateAnalysisBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { fileName, roleTitle, jobDescription, cvText } = parsed.data;

  const [inserted] = await db
    .insert(analysesTable)
    .values({ fileName, roleTitle, jobDescription, cvText, status: "pending" })
    .returning();

  try {
    const result = analyseCv(cvText, roleTitle ?? undefined, jobDescription ?? undefined);
    const [updated] = await db
      .update(analysesTable)
      .set({ ...result, status: "completed" })
      .where(eq(analysesTable.id, inserted.id))
      .returning();
    res.status(201).json(updated);
  } catch (err) {
    logger.error({ err }, "Analysis failed");
    await db
      .update(analysesTable)
      .set({ status: "failed" })
      .where(eq(analysesTable.id, inserted.id));
    res.status(201).json({ ...inserted, status: "failed" });
  }
});

router.get("/analyses/stats", async (_req, res): Promise<void> => {
  const rows = await db.select().from(analysesTable);

  const totalAnalyses = rows.length;
  const averageScore = totalAnalyses > 0
    ? Math.round(rows.reduce((s, r) => s + r.overallScore, 0) / totalAnalyses)
    : 0;

  const skillCounts: Record<string, number> = {};
  for (const row of rows) {
    for (const skill of (row.skillsFound as string[] ?? [])) {
      skillCounts[skill] = (skillCounts[skill] ?? 0) + 1;
    }
  }
  const topSkills = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([skill, count]) => ({ skill, count }));

  const scoreDistribution = { excellent: 0, good: 0, fair: 0, poor: 0 };
  for (const row of rows) {
    if (row.overallScore >= 75) scoreDistribution.excellent++;
    else if (row.overallScore >= 50) scoreDistribution.good++;
    else if (row.overallScore >= 25) scoreDistribution.fair++;
    else scoreDistribution.poor++;
  }

  res.json({ totalAnalyses, averageScore, topSkills, scoreDistribution });
});

router.get("/analyses/:id", async (req, res): Promise<void> => {
  const params = GetAnalysisParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select()
    .from(analysesTable)
    .where(eq(analysesTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }

  res.json(row);
});

router.delete("/analyses/:id", async (req, res): Promise<void> => {
  const params = DeleteAnalysisParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(analysesTable)
    .where(eq(analysesTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
