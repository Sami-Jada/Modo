import { Router, Request, Response, NextFunction } from "express";
import "express-session";
import { adminStorage } from "./admin-storage";
import { z } from "zod";

const router = Router();

declare module "express-session" {
  interface SessionData {
    adminId?: string;
    adminEmail?: string;
    adminRole?: string;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.adminId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

function requireSuperadmin(req: Request, res: Response, next: NextFunction) {
  if (req.session?.adminRole !== "superadmin") {
    return res.status(403).json({ error: "Forbidden: Superadmin required" });
  }
  next();
}

async function logAction(
  req: Request,
  action: string,
  entityType: "electrician_application" | "electrician" | "job" | "dispute" | "customer" | "balance" | "credit" | "config" | "auth",
  entityId: string | null,
  reason: string,
  details?: Record<string, unknown>
) {
  if (req.session?.adminId && req.session?.adminEmail) {
    await adminStorage.createAuditLog({
      adminId: req.session.adminId,
      adminEmail: req.session.adminEmail,
      action,
      entityType,
      entityId,
      reason,
      details,
      ipAddress: req.ip || null,
    });
  }
}

router.post("/auth/login", async (req: Request, res: Response) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: "Invalid credentials format" });
  }

  const { email, password } = result.data;
  const admin = await adminStorage.getAdminByEmail(email);

  if (!admin) {
    await adminStorage.createAuditLog({
      adminId: "unknown",
      adminEmail: email,
      action: "login_failed",
      entityType: "auth",
      entityId: null,
      reason: "Invalid credentials",
      ipAddress: req.ip || null,
    });
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await adminStorage.verifyPassword(admin, password);
  if (!valid) {
    await adminStorage.createAuditLog({
      adminId: admin.id,
      adminEmail: email,
      action: "login_failed",
      entityType: "auth",
      entityId: null,
      reason: "Invalid password",
      ipAddress: req.ip || null,
    });
    return res.status(401).json({ error: "Invalid credentials" });
  }

  req.session.adminId = admin.id;
  req.session.adminEmail = admin.email;
  req.session.adminRole = admin.role;

  await adminStorage.updateAdminLastLogin(admin.id);
  await logAction(req, "login_success", "auth", admin.id, "Admin logged in successfully");

  res.json({
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  });
});

router.post("/auth/logout", requireAuth, async (req: Request, res: Response) => {
  await logAction(req, "logout", "auth", req.session.adminId!, "Admin logged out");
  req.session.destroy(() => {});
  res.json({ success: true });
});

router.get("/auth/me", requireAuth, async (req: Request, res: Response) => {
  const admin = await adminStorage.getAdminById(req.session.adminId!);
  if (!admin) {
    return res.status(404).json({ error: "Admin not found" });
  }
  res.json({
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  });
});

router.get("/applications", requireAuth, async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const applications = await adminStorage.listApplications(status);
  res.json(applications);
});

router.get("/applications/:id", requireAuth, async (req: Request, res: Response) => {
  const app = await adminStorage.getApplication(req.params.id);
  if (!app) {
    return res.status(404).json({ error: "Application not found" });
  }
  res.json(app);
});

router.post("/applications/:id/approve", requireAuth, async (req: Request, res: Response) => {
  const schema = z.object({
    reason: z.string().min(1, "Reason is required"),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.errors[0].message });
  }

  const app = await adminStorage.updateApplicationStatus(
    req.params.id,
    "approved",
    req.session.adminId!,
    result.data.reason
  );

  if (!app) {
    return res.status(404).json({ error: "Application not found" });
  }

  await logAction(req, "application_approved", "electrician_application", app.id, result.data.reason, {
    applicantName: app.name,
    applicantEmail: app.email,
  });

  res.json(app);
});

router.post("/applications/:id/reject", requireAuth, async (req: Request, res: Response) => {
  const schema = z.object({
    reason: z.string().min(1, "Reason is required"),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.errors[0].message });
  }

  const app = await adminStorage.updateApplicationStatus(
    req.params.id,
    "rejected",
    req.session.adminId!,
    result.data.reason
  );

  if (!app) {
    return res.status(404).json({ error: "Application not found" });
  }

  await logAction(req, "application_rejected", "electrician_application", app.id, result.data.reason, {
    applicantName: app.name,
    applicantEmail: app.email,
  });

  res.json(app);
});

router.get("/electricians", requireAuth, async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const electricians = await adminStorage.listElectricians(status);
  res.json(electricians);
});

router.get("/electricians/:id", requireAuth, async (req: Request, res: Response) => {
  const electrician = await adminStorage.getElectrician(req.params.id);
  if (!electrician) {
    return res.status(404).json({ error: "Electrician not found" });
  }
  res.json(electrician);
});

router.post("/electricians/:id/status", requireAuth, async (req: Request, res: Response) => {
  const schema = z.object({
    status: z.enum(["active", "suspended", "inactive"]),
    reason: z.string().min(1, "Reason is required"),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.errors[0].message });
  }

  const electrician = await adminStorage.updateElectricianStatus(req.params.id, result.data.status);
  if (!electrician) {
    return res.status(404).json({ error: "Electrician not found" });
  }

  await logAction(req, `electrician_status_${result.data.status}`, "electrician", electrician.id, result.data.reason, {
    electricianName: electrician.name,
    newStatus: result.data.status,
  });

  res.json(electrician);
});

router.get("/jobs", requireAuth, async (req: Request, res: Response) => {
  const filters = {
    status: req.query.status as string | undefined,
    electricianId: req.query.electricianId as string | undefined,
    customerId: req.query.customerId as string | undefined,
  };
  const jobs = await adminStorage.listJobs(filters);
  res.json(jobs);
});

router.get("/jobs/:id", requireAuth, async (req: Request, res: Response) => {
  const job = await adminStorage.getJob(req.params.id);
  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }
  res.json(job);
});

router.post("/jobs/:id/event", requireAuth, async (req: Request, res: Response) => {
  const schema = z.object({
    status: z.enum([
      "CREATED", "BROADCAST", "ACCEPTED", "EN_ROUTE", "ARRIVED", "IN_PROGRESS", "COMPLETED", "SETTLED", "CANCELLED"
    ]),
    reason: z.string().min(1, "Reason is required"),
    metadata: z.record(z.unknown()).optional(),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.errors[0].message });
  }

  const job = await adminStorage.addJobEvent(req.params.id, {
    status: result.data.status,
    actorType: "admin",
    actorId: req.session.adminId!,
    metadata: { ...result.data.metadata, adminReason: result.data.reason },
  });

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  await logAction(req, `job_status_${result.data.status}`, "job", job.id, result.data.reason, {
    newStatus: result.data.status,
  });

  res.json(job);
});

router.get("/disputes", requireAuth, async (req: Request, res: Response) => {
  const filters = {
    status: req.query.status as string | undefined,
    priority: req.query.priority as string | undefined,
  };
  const disputes = await adminStorage.listDisputes(filters);
  res.json(disputes);
});

router.get("/disputes/:id", requireAuth, async (req: Request, res: Response) => {
  const dispute = await adminStorage.getDispute(req.params.id);
  if (!dispute) {
    return res.status(404).json({ error: "Dispute not found" });
  }
  res.json(dispute);
});

router.patch("/disputes/:id", requireAuth, async (req: Request, res: Response) => {
  const schema = z.object({
    status: z.enum(["open", "investigating", "resolved", "escalated", "closed"]).optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    resolution: z.string().optional(),
    assignedTo: z.string().nullable().optional(),
    reason: z.string().min(1, "Reason is required"),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.errors[0].message });
  }

  const { reason, ...updates } = result.data;
  const dispute = await adminStorage.updateDispute(req.params.id, updates);

  if (!dispute) {
    return res.status(404).json({ error: "Dispute not found" });
  }

  await logAction(req, "dispute_updated", "dispute", dispute.id, reason, updates);

  res.json(dispute);
});

router.get("/customers", requireAuth, async (req: Request, res: Response) => {
  const customers = await adminStorage.listCustomers();
  res.json(customers);
});

router.get("/customers/:id", requireAuth, async (req: Request, res: Response) => {
  const customer = await adminStorage.getCustomer(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: "Customer not found" });
  }
  res.json(customer);
});

router.post("/customers/:id/adjust-balance", requireAuth, async (req: Request, res: Response) => {
  const schema = z.object({
    amount: z.number(),
    reason: z.string().min(1, "Reason is required"),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.errors[0].message });
  }

  const customer = await adminStorage.getCustomer(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: "Customer not found" });
  }

  const balanceBefore = customer.balance;
  const updated = await adminStorage.updateCustomerBalance(req.params.id, result.data.amount);

  await adminStorage.createBalanceTransaction({
    entityType: "customer",
    entityId: req.params.id,
    type: result.data.amount >= 0 ? "credit" : "debit",
    amount: result.data.amount,
    balanceBefore,
    balanceAfter: updated!.balance,
    reason: result.data.reason,
    adminId: req.session.adminId!,
    jobId: null,
  });

  await logAction(req, "balance_adjusted", "balance", req.params.id, result.data.reason, {
    customerName: customer.name,
    amount: result.data.amount,
    balanceBefore,
    balanceAfter: updated!.balance,
  });

  res.json(updated);
});

router.post("/customers/:id/adjust-credits", requireAuth, async (req: Request, res: Response) => {
  const schema = z.object({
    amount: z.number(),
    reason: z.string().min(1, "Reason is required"),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.errors[0].message });
  }

  const customer = await adminStorage.getCustomer(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: "Customer not found" });
  }

  const creditsBefore = customer.credits;
  const updated = await adminStorage.updateCustomerCredits(req.params.id, result.data.amount);

  await logAction(req, "credits_adjusted", "credit", req.params.id, result.data.reason, {
    customerName: customer.name,
    amount: result.data.amount,
    creditsBefore,
    creditsAfter: updated!.credits,
  });

  res.json(updated);
});

router.get("/transactions", requireAuth, async (req: Request, res: Response) => {
  const entityType = req.query.entityType as string | undefined;
  const entityId = req.query.entityId as string | undefined;
  const transactions = await adminStorage.listBalanceTransactions(entityType, entityId);
  res.json(transactions);
});

router.get("/configs", requireAuth, async (req: Request, res: Response) => {
  const configs = await adminStorage.listAllConfigs();
  res.json(configs);
});

router.get("/configs/:key", requireAuth, async (req: Request, res: Response) => {
  const config = await adminStorage.getConfig(req.params.key);
  if (!config) {
    return res.status(404).json({ error: "Config not found" });
  }
  res.json(config);
});

router.get("/configs/:key/history", requireAuth, async (req: Request, res: Response) => {
  const history = await adminStorage.listConfigHistory(req.params.key);
  res.json(history);
});

router.put("/configs/:key", requireAuth, requireSuperadmin, async (req: Request, res: Response) => {
  const schema = z.object({
    value: z.unknown(),
    reason: z.string().min(1, "Reason is required"),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.errors[0].message });
  }

  const config = await adminStorage.setConfig(
    req.params.key,
    result.data.value,
    req.session.adminId!,
    result.data.reason
  );

  await logAction(req, "config_updated", "config", req.params.key, result.data.reason, {
    key: req.params.key,
    value: result.data.value,
    version: config.version,
  });

  res.json(config);
});

router.get("/audit-logs", requireAuth, async (req: Request, res: Response) => {
  const filters = {
    entityType: req.query.entityType as string | undefined,
    entityId: req.query.entityId as string | undefined,
    adminId: req.query.adminId as string | undefined,
    fromDate: req.query.fromDate as string | undefined,
    toDate: req.query.toDate as string | undefined,
  };
  const logs = await adminStorage.listAuditLogs(filters);
  res.json(logs);
});

router.get("/metrics", requireAuth, async (req: Request, res: Response) => {
  const metrics = await adminStorage.getMetrics();
  res.json(metrics);
});

export default router;
