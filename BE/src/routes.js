import { Router } from "express";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { departmentsRouter } from "./modules/departments/departments.routes.js";
import { employeesRouter } from "./modules/employees/employees.routes.js";
import { attendanceRouter } from "./modules/attendance/attendance.routes.js";
import { shiftsRouter } from "./modules/shifts/shifts.routes.js";
import { schedulesRouter } from "./modules/schedules/schedules.routes.js";
import { payrollRouter } from "./modules/payroll/payroll.routes.js";
import { leavesRouter } from "./modules/leaves/leaves.routes.js";
import { notificationsRouter } from "./modules/notifications/notifications.routes.js";
import { settingsRouter } from "./modules/settings/settings.routes.js";
import { aiRouter } from "./modules/ai/ai.routes.js";

export const apiRouter = Router();

apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/departments", departmentsRouter);
apiRouter.use("/employees", employeesRouter);
apiRouter.use("/attendance", attendanceRouter);
apiRouter.use("/shifts", shiftsRouter);
apiRouter.use("/schedules", schedulesRouter);
apiRouter.use("/payroll", payrollRouter);
apiRouter.use("/leaves", leavesRouter);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.use("/settings", settingsRouter);
apiRouter.use("/ai", aiRouter);
