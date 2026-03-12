import { Router, type IRouter, type Request, type Response } from "express";
import { db, studentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateStudentBody } from "@workspace/api-zod";

const router: IRouter = Router();

function requireTeacher(req: Request, res: Response, next: () => void) {
  const session = req.session as any;
  if (session.role !== "teacher") {
    res.status(403).json({ error: "Teacher access required" });
    return;
  }
  next();
}

function generateStudentId(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `STU-${num}`;
}

router.get("/", requireTeacher, async (_req: Request, res: Response) => {
  const students = await db.select().from(studentsTable).orderBy(studentsTable.createdAt);
  res.json(students.map(s => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
  })));
});

router.post("/", requireTeacher, async (req: Request, res: Response) => {
  const parsed = CreateStudentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  let studentId = generateStudentId();
  let attempts = 0;
  while (attempts < 10) {
    const existing = await db.select().from(studentsTable).where(eq(studentsTable.studentId, studentId));
    if (existing.length === 0) break;
    studentId = generateStudentId();
    attempts++;
  }

  const [student] = await db.insert(studentsTable).values({
    studentId,
    name: parsed.data.name,
    instrument: parsed.data.instrument,
  }).returning();

  res.status(201).json({
    ...student,
    createdAt: student.createdAt.toISOString(),
  });
});

router.delete("/:studentId", requireTeacher, async (req: Request, res: Response) => {
  const id = parseInt(req.params.studentId);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid student ID" });
    return;
  }
  await db.delete(studentsTable).where(eq(studentsTable.id, id));
  res.json({ success: true, message: "Student deleted" });
});

export default router;
