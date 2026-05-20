import { z } from "zod";
import { getDefaultCompanyId } from "../companies/company.repository.js";
import { listAttendance, upsertAttendance } from "./attendance.repository.js";

const attendanceSchema = z.object({
  employeeId: z.string(),
  workDate: z.string(),
  checkIn: z.string().nullable().optional(),
  checkOut: z.string().nullable().optional(),
  totalHours: z.coerce.number().optional(),
  status: z.enum(["Present", "Late", "Absent", "Leave", "Overtime"]),
  location: z.string().nullable().optional(),
  note: z.string().optional()
});

export async function listAttendanceHandler(req, res) {
  res.json(await listAttendance({ date: req.query.date }));
}

export async function upsertAttendanceHandler(req, res) {
  const data = attendanceSchema.parse(req.body);
  const companyId = await getDefaultCompanyId();
  res.status(201).json(await upsertAttendance(companyId, data));
}
