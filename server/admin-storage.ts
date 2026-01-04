import { randomUUID } from "crypto";
import * as bcrypt from "bcrypt";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { db } from "./db";
import {
  marketingLeads,
  adminUsers,
  electricianApplications,
  electricians,
  jobs,
  jobEvents,
  disputes,
  customers,
  balanceTransactions,
  configs,
  auditLogs,
} from "@shared/schema";
import type {
  AdminUser,
  ElectricianApplication,
  Electrician,
  Job,
  JobEvent,
  Dispute,
  AuditLog,
  Customer,
  BalanceTransaction,
  Config,
  TrustMetrics,
  MarketingLead,
} from "@shared/admin-types";

// Helper function to convert numeric database values to numbers
function num(value: string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return parseFloat(value);
}

// Helper function to convert database row to AdminUser type
function dbRowToAdminUser(row: typeof adminUsers.$inferSelect): AdminUser {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    name: row.name,
    role: row.role as "superadmin" | "operator",
    createdAt: row.createdAt.toISOString(),
    lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
  };
}

// Helper function to convert database row to ElectricianApplication type
function dbRowToApplication(row: typeof electricianApplications.$inferSelect): ElectricianApplication {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    nationalId: row.nationalId,
    specializations: row.specializations as string[],
    yearsExperience: num(row.yearsExperience),
    certifications: row.certifications as string[],
    status: row.status as "pending" | "approved" | "rejected",
    submittedAt: row.submittedAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    reviewedBy: row.reviewedBy ?? null,
    reviewReason: row.reviewReason ?? null,
  };
}

// Helper function to convert database row to Electrician type
function dbRowToElectrician(row: typeof electricians.$inferSelect): Electrician {
  return {
    id: row.id,
    applicationId: row.applicationId,
    name: row.name,
    email: row.email,
    phone: row.phone,
    nationalId: row.nationalId,
    specializations: row.specializations as string[],
    yearsExperience: num(row.yearsExperience),
    certifications: row.certifications as string[],
    status: row.status as "active" | "suspended" | "inactive",
    rating: num(row.rating),
    totalJobs: num(row.totalJobs),
    completedJobs: num(row.completedJobs),
    cancelledJobs: num(row.cancelledJobs),
    balance: num(row.balance),
    createdAt: row.createdAt.toISOString(),
  };
}

// Helper function to convert job event row to JobEvent type
function dbRowToJobEvent(row: typeof jobEvents.$inferSelect): JobEvent {
  return {
    id: row.id,
    jobId: row.jobId,
    status: row.status as Job["status"],
    timestamp: row.timestamp.toISOString(),
    actorType: row.actorType as "system" | "customer" | "electrician" | "admin",
    actorId: row.actorId ?? null,
    metadata: row.metadata as Record<string, unknown> | undefined,
  };
}

// Helper function to convert job row to Job type (with timeline loaded separately)
function dbRowToJob(row: typeof jobs.$inferSelect, timeline: JobEvent[]): Job {
  return {
    id: row.id,
    customerId: row.customerId,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    electricianId: row.electricianId ?? null,
    electricianName: row.electricianName ?? null,
    serviceType: row.serviceType,
    description: row.description,
    address: row.address,
    latitude: row.latitude ? num(row.latitude) : null,
    longitude: row.longitude ? num(row.longitude) : null,
    quotedPrice: num(row.quotedPrice),
    finalPrice: row.finalPrice ? num(row.finalPrice) : null,
    status: row.status as Job["status"],
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    timeline,
  };
}

// Helper function to convert database row to Dispute type
function dbRowToDispute(row: typeof disputes.$inferSelect): Dispute {
  return {
    id: row.id,
    jobId: row.jobId,
    customerId: row.customerId,
    customerName: row.customerName,
    electricianId: row.electricianId ?? null,
    electricianName: row.electricianName ?? null,
    type: row.type as Dispute["type"],
    description: row.description,
    status: row.status as Dispute["status"],
    priority: row.priority as Dispute["priority"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    resolution: row.resolution ?? null,
    assignedTo: row.assignedTo ?? null,
  };
}

// Helper function to convert database row to Customer type
function dbRowToCustomer(row: typeof customers.$inferSelect): Customer {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? null,
    phone: row.phone,
    balance: num(row.balance),
    credits: num(row.credits),
    totalJobs: num(row.totalJobs),
    createdAt: row.createdAt.toISOString(),
  };
}

// Helper function to convert database row to BalanceTransaction type
function dbRowToBalanceTransaction(row: typeof balanceTransactions.$inferSelect): BalanceTransaction {
  return {
    id: row.id,
    entityType: row.entityType as "customer" | "electrician",
    entityId: row.entityId,
    type: row.type as BalanceTransaction["type"],
    amount: num(row.amount),
    balanceBefore: num(row.balanceBefore),
    balanceAfter: num(row.balanceAfter),
    reason: row.reason,
    adminId: row.adminId ?? null,
    jobId: row.jobId ?? null,
    timestamp: row.timestamp.toISOString(),
  };
}

// Helper function to convert database row to Config type
function dbRowToConfig(row: typeof configs.$inferSelect): Config {
  return {
    id: row.id,
    key: row.key,
    value: row.value,
    version: num(row.version),
    updatedBy: row.updatedBy,
    updatedAt: row.updatedAt.toISOString(),
    reason: row.reason,
  };
}

// Helper function to convert database row to AuditLog type
function dbRowToAuditLog(row: typeof auditLogs.$inferSelect): AuditLog {
  return {
    id: row.id,
    adminId: row.adminId,
    adminEmail: row.adminEmail,
    action: row.action,
    entityType: row.entityType as AuditLog["entityType"],
    entityId: row.entityId ?? null,
    reason: row.reason,
    details: row.details as Record<string, unknown> | undefined,
    timestamp: row.timestamp.toISOString(),
    ipAddress: row.ipAddress ?? null,
  };
}

class AdminStorage {
  async initializeDefaultAdmin(): Promise<void> {
    const existing = await db.select().from(adminUsers);
    if (existing.length === 0) {
      const passwordHash = await bcrypt.hash("admin123", 10);
      await db.insert(adminUsers).values({
        id: randomUUID(),
        email: "admin@modo.jo",
        passwordHash,
        name: "System Admin",
        role: "superadmin",
      });
      console.log("Default admin created: admin@modo.jo / admin123");
    }
  }

  async getAdminByEmail(email: string): Promise<AdminUser | undefined> {
    const rows = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    if (rows.length === 0) return undefined;
    return dbRowToAdminUser(rows[0]);
  }

  async getAdminById(id: string): Promise<AdminUser | undefined> {
    const rows = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    if (rows.length === 0) return undefined;
    return dbRowToAdminUser(rows[0]);
  }

  async updateAdminLastLogin(id: string): Promise<void> {
    await db.update(adminUsers)
      .set({ lastLoginAt: new Date() })
      .where(eq(adminUsers.id, id));
  }

  async verifyPassword(user: AdminUser, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  async listApplications(status?: string): Promise<ElectricianApplication[]> {
    const query = status
      ? db.select().from(electricianApplications).where(eq(electricianApplications.status, status))
      : db.select().from(electricianApplications);
    const rows = await query;
    return rows.map(dbRowToApplication);
  }

  async getApplication(id: string): Promise<ElectricianApplication | undefined> {
    const rows = await db.select().from(electricianApplications).where(eq(electricianApplications.id, id));
    if (rows.length === 0) return undefined;
    return dbRowToApplication(rows[0]);
  }

  async createApplication(
    data: Omit<ElectricianApplication, "id" | "status" | "submittedAt" | "reviewedAt" | "reviewedBy" | "reviewReason">
  ): Promise<ElectricianApplication> {
    const id = randomUUID();
    const result = await db.insert(electricianApplications).values({
      id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      nationalId: data.nationalId,
      specializations: data.specializations,
      yearsExperience: data.yearsExperience.toString(),
      certifications: data.certifications,
      status: "pending",
    }).returning();
    return dbRowToApplication(result[0]);
  }

  async updateApplicationStatus(
    id: string,
    status: "approved" | "rejected",
    reviewedBy: string,
    reason: string
  ): Promise<ElectricianApplication | undefined> {
    const result = await db.update(electricianApplications)
      .set({
        status,
        reviewedAt: new Date(),
        reviewedBy,
        reviewReason: reason,
      })
      .where(eq(electricianApplications.id, id))
      .returning();
    
    if (result.length === 0) return undefined;
    const app = dbRowToApplication(result[0]);

    if (status === "approved") {
      await this.createElectricianFromApplication(app);
    }

    return app;
  }

  async createElectricianFromApplication(app: ElectricianApplication): Promise<Electrician> {
    const id = randomUUID();
    const result = await db.insert(electricians).values({
      id,
      applicationId: app.id,
      name: app.name,
      email: app.email,
      phone: app.phone,
      nationalId: app.nationalId,
      specializations: app.specializations,
      yearsExperience: app.yearsExperience.toString(),
      certifications: app.certifications,
      status: "active",
      rating: "0",
      totalJobs: "0",
      completedJobs: "0",
      cancelledJobs: "0",
      balance: "0",
    }).returning();
    return dbRowToElectrician(result[0]);
  }

  async listElectricians(status?: string): Promise<Electrician[]> {
    const query = status
      ? db.select().from(electricians).where(eq(electricians.status, status))
      : db.select().from(electricians);
    const rows = await query;
    return rows.map(dbRowToElectrician);
  }

  async getElectrician(id: string): Promise<Electrician | undefined> {
    const rows = await db.select().from(electricians).where(eq(electricians.id, id));
    if (rows.length === 0) return undefined;
    return dbRowToElectrician(rows[0]);
  }

  async updateElectricianStatus(
    id: string,
    status: "active" | "suspended" | "inactive"
  ): Promise<Electrician | undefined> {
    const result = await db.update(electricians)
      .set({ status })
      .where(eq(electricians.id, id))
      .returning();
    if (result.length === 0) return undefined;
    return dbRowToElectrician(result[0]);
  }

  async listJobs(filters?: { status?: string; electricianId?: string; customerId?: string }): Promise<Job[]> {
    let query = db.select().from(jobs);
    
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(jobs.status, filters.status));
    }
    if (filters?.electricianId) {
      conditions.push(eq(jobs.electricianId, filters.electricianId));
    }
    if (filters?.customerId) {
      conditions.push(eq(jobs.customerId, filters.customerId));
    }
    
    if (conditions.length > 0) {
      query = db.select().from(jobs).where(and(...conditions));
    }
    
    const rows = await query.orderBy(desc(jobs.createdAt));
    
    // Load timeline for each job
    const jobsWithTimeline: Job[] = [];
    for (const row of rows) {
      const events = await db.select().from(jobEvents)
        .where(eq(jobEvents.jobId, row.id))
        .orderBy(jobEvents.timestamp);
      const timeline = events.map(dbRowToJobEvent);
      jobsWithTimeline.push(dbRowToJob(row, timeline));
    }
    
    return jobsWithTimeline;
  }

  async getJob(id: string): Promise<Job | undefined> {
    const rows = await db.select().from(jobs).where(eq(jobs.id, id));
    if (rows.length === 0) return undefined;
    
    const jobRow = rows[0];
    const events = await db.select().from(jobEvents)
      .where(eq(jobEvents.jobId, id))
      .orderBy(jobEvents.timestamp);
    const timeline = events.map(dbRowToJobEvent);
    
    return dbRowToJob(jobRow, timeline);
  }

  async createJob(data: Omit<Job, "id" | "createdAt" | "completedAt" | "timeline">): Promise<Job> {
    const id = randomUUID();
    const result = await db.insert(jobs).values({
      id,
      customerId: data.customerId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      electricianId: data.electricianId ?? null,
      electricianName: data.electricianName ?? null,
      serviceType: data.serviceType,
      description: data.description,
      address: data.address,
      latitude: data.latitude?.toString() ?? null,
      longitude: data.longitude?.toString() ?? null,
      quotedPrice: data.quotedPrice.toString(),
      finalPrice: null,
      status: data.status,
    }).returning();
    
    // Create initial event
    const eventId = randomUUID();
    await db.insert(jobEvents).values({
      id: eventId,
      jobId: id,
      status: data.status,
      actorType: "system",
      actorId: null,
    });
    
    const jobRow = result[0];
    const event = dbRowToJobEvent({
      id: eventId,
      jobId: id,
      status: data.status,
      timestamp: jobRow.createdAt,
      actorType: "system",
      actorId: null,
      metadata: null,
    } as typeof jobEvents.$inferSelect);
    
    return dbRowToJob(jobRow, [event]);
  }

  async addJobEvent(jobId: string, event: Omit<JobEvent, "id" | "jobId" | "timestamp">): Promise<Job | undefined> {
    const jobRows = await db.select().from(jobs).where(eq(jobs.id, jobId));
    if (jobRows.length === 0) return undefined;
    
    const eventId = randomUUID();
    const now = new Date();
    
    // Insert event
    await db.insert(jobEvents).values({
      id: eventId,
      jobId,
      status: event.status,
      actorType: event.actorType,
      actorId: event.actorId ?? null,
      metadata: event.metadata ?? null,
    });
    
    // Update job status
    const updateData: { status: string; completedAt?: Date } = { status: event.status };
    if (event.status === "COMPLETED" || event.status === "SETTLED") {
      updateData.completedAt = now;
    }
    
    const updatedRows = await db.update(jobs)
      .set(updateData)
      .where(eq(jobs.id, jobId))
      .returning();
    
    if (updatedRows.length === 0) return undefined;
    
    // Load full timeline
    const events = await db.select().from(jobEvents)
      .where(eq(jobEvents.jobId, jobId))
      .orderBy(jobEvents.timestamp);
    const timeline = events.map(dbRowToJobEvent);
    
    return dbRowToJob(updatedRows[0], timeline);
  }

  async listDisputes(filters?: { status?: string; priority?: string }): Promise<Dispute[]> {
    let query = db.select().from(disputes);
    
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(disputes.status, filters.status));
    }
    if (filters?.priority) {
      conditions.push(eq(disputes.priority, filters.priority));
    }
    
    if (conditions.length > 0) {
      query = db.select().from(disputes).where(and(...conditions));
    }
    
    const rows = await query.orderBy(desc(disputes.createdAt));
    return rows.map(dbRowToDispute);
  }

  async getDispute(id: string): Promise<Dispute | undefined> {
    const rows = await db.select().from(disputes).where(eq(disputes.id, id));
    if (rows.length === 0) return undefined;
    return dbRowToDispute(rows[0]);
  }

  async createDispute(
    data: Omit<Dispute, "id" | "createdAt" | "updatedAt" | "resolvedAt" | "resolution" | "assignedTo">
  ): Promise<Dispute> {
    const id = randomUUID();
    const result = await db.insert(disputes).values({
      id,
      jobId: data.jobId,
      customerId: data.customerId,
      customerName: data.customerName,
      electricianId: data.electricianId ?? null,
      electricianName: data.electricianName ?? null,
      type: data.type,
      description: data.description,
      status: data.status,
      priority: data.priority,
    }).returning();
    return dbRowToDispute(result[0]);
  }

  async updateDispute(
    id: string,
    updates: Partial<Pick<Dispute, "status" | "priority" | "resolution" | "assignedTo">>
  ): Promise<Dispute | undefined> {
    const updateData: {
      status?: string;
      priority?: string;
      resolution?: string | null;
      assignedTo?: string | null;
      updatedAt: Date;
      resolvedAt?: Date;
    } = {
      updatedAt: new Date(),
    };
    
    if (updates.status) updateData.status = updates.status;
    if (updates.priority) updateData.priority = updates.priority;
    if (updates.resolution !== undefined) updateData.resolution = updates.resolution;
    if (updates.assignedTo !== undefined) updateData.assignedTo = updates.assignedTo;
    
    if (updates.status === "resolved" || updates.status === "closed") {
      updateData.resolvedAt = new Date();
    }
    
    const result = await db.update(disputes)
      .set(updateData)
      .where(eq(disputes.id, id))
      .returning();
    
    if (result.length === 0) return undefined;
    return dbRowToDispute(result[0]);
  }

  async createAuditLog(
    data: Omit<AuditLog, "id" | "timestamp">
  ): Promise<AuditLog> {
    const id = randomUUID();
    const result = await db.insert(auditLogs).values({
      id,
      adminId: data.adminId,
      adminEmail: data.adminEmail,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId ?? null,
      reason: data.reason,
      details: data.details ?? null,
      ipAddress: data.ipAddress ?? null,
    }).returning();
    return dbRowToAuditLog(result[0]);
  }

  async listAuditLogs(filters?: {
    entityType?: string;
    entityId?: string;
    adminId?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<AuditLog[]> {
    let query = db.select().from(auditLogs);
    
    const conditions = [];
    if (filters?.entityType) {
      conditions.push(eq(auditLogs.entityType, filters.entityType));
    }
    if (filters?.entityId) {
      conditions.push(eq(auditLogs.entityId, filters.entityId));
    }
    if (filters?.adminId) {
      conditions.push(eq(auditLogs.adminId, filters.adminId));
    }
    if (filters?.fromDate) {
      conditions.push(gte(auditLogs.timestamp, new Date(filters.fromDate)));
    }
    if (filters?.toDate) {
      conditions.push(lte(auditLogs.timestamp, new Date(filters.toDate)));
    }
    
    if (conditions.length > 0) {
      query = db.select().from(auditLogs).where(and(...conditions));
    }
    
    const rows = await query.orderBy(desc(auditLogs.timestamp));
    return rows.map(dbRowToAuditLog);
  }

  async listCustomers(): Promise<Customer[]> {
    const rows = await db.select().from(customers);
    return rows.map(dbRowToCustomer);
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const rows = await db.select().from(customers).where(eq(customers.id, id));
    if (rows.length === 0) return undefined;
    return dbRowToCustomer(rows[0]);
  }

  async updateCustomerBalance(id: string, amount: number): Promise<Customer | undefined> {
    const customerRows = await db.select().from(customers).where(eq(customers.id, id));
    if (customerRows.length === 0) return undefined;
    
    const currentBalance = num(customerRows[0].balance);
    const newBalance = (currentBalance + amount).toString();
    
    const result = await db.update(customers)
      .set({ balance: newBalance })
      .where(eq(customers.id, id))
      .returning();
    
    if (result.length === 0) return undefined;
    return dbRowToCustomer(result[0]);
  }

  async updateCustomerCredits(id: string, amount: number): Promise<Customer | undefined> {
    const customerRows = await db.select().from(customers).where(eq(customers.id, id));
    if (customerRows.length === 0) return undefined;
    
    const currentCredits = num(customerRows[0].credits);
    const newCredits = (currentCredits + amount).toString();
    
    const result = await db.update(customers)
      .set({ credits: newCredits })
      .where(eq(customers.id, id))
      .returning();
    
    if (result.length === 0) return undefined;
    return dbRowToCustomer(result[0]);
  }

  async createBalanceTransaction(
    data: Omit<BalanceTransaction, "id" | "timestamp">
  ): Promise<BalanceTransaction> {
    const id = randomUUID();
    const result = await db.insert(balanceTransactions).values({
      id,
      entityType: data.entityType,
      entityId: data.entityId,
      type: data.type,
      amount: data.amount.toString(),
      balanceBefore: data.balanceBefore.toString(),
      balanceAfter: data.balanceAfter.toString(),
      reason: data.reason,
      adminId: data.adminId ?? null,
      jobId: data.jobId ?? null,
    }).returning();
    return dbRowToBalanceTransaction(result[0]);
  }

  async listBalanceTransactions(entityType?: string, entityId?: string): Promise<BalanceTransaction[]> {
    let query = db.select().from(balanceTransactions);
    
    const conditions = [];
    if (entityType) {
      conditions.push(eq(balanceTransactions.entityType, entityType));
    }
    if (entityId) {
      conditions.push(eq(balanceTransactions.entityId, entityId));
    }
    
    if (conditions.length > 0) {
      query = db.select().from(balanceTransactions).where(and(...conditions));
    }
    
    const rows = await query.orderBy(desc(balanceTransactions.timestamp));
    return rows.map(dbRowToBalanceTransaction);
  }

  async getConfig(key: string): Promise<Config | undefined> {
    const rows = await db.select().from(configs)
      .where(eq(configs.key, key))
      .orderBy(desc(configs.version));
    
    if (rows.length === 0) return undefined;
    return dbRowToConfig(rows[0]); // First row is highest version
  }

  async setConfig(key: string, value: unknown, updatedBy: string, reason: string): Promise<Config> {
    // Get max version
    const existing = await db.select().from(configs).where(eq(configs.key, key));
    const maxVersion = existing.length > 0 
      ? Math.max(...existing.map(c => num(c.version))) 
      : 0;

    const id = randomUUID();
    const result = await db.insert(configs).values({
      id,
      key,
      value: value as unknown,
      version: (maxVersion + 1).toString(),
      updatedBy,
      reason,
    }).returning();
    
    return dbRowToConfig(result[0]);
  }

  async listConfigHistory(key: string): Promise<Config[]> {
    const rows = await db.select().from(configs)
      .where(eq(configs.key, key))
      .orderBy(desc(configs.version));
    return rows.map(dbRowToConfig);
  }

  async listAllConfigs(): Promise<Config[]> {
    // Get all configs, ordered by key and version descending
    // This ensures for each key, the highest version comes first
    const allRows = await db.select().from(configs)
      .orderBy(configs.key, desc(configs.version));
    
    // Group by key and get latest version for each
    const latestByKey = new Map<string, Config>();
    for (const row of allRows) {
      if (!latestByKey.has(row.key)) {
        latestByKey.set(row.key, dbRowToConfig(row));
      }
    }
    
    return Array.from(latestByKey.values());
  }

  async getMetrics(): Promise<TrustMetrics> {
    const [electriciansRows, jobsRows, disputesRows, applicationsRows] = await Promise.all([
      db.select().from(electricians),
      db.select().from(jobs),
      db.select().from(disputes),
      db.select().from(electricianApplications),
    ]);

    const electriciansList = electriciansRows.map(dbRowToElectrician);
    const disputesList = disputesRows.map(dbRowToDispute);
    const applicationsList = applicationsRows.map(dbRowToApplication);

    const activeElectricians = electriciansList.filter((e) => e.status === "active");
    const completedJobs = jobsRows.filter((j) => j.status === "COMPLETED" || j.status === "SETTLED");
    const cancelledJobs = jobsRows.filter((j) => j.status === "CANCELLED");
    const openDisputes = disputesList.filter((d) => d.status === "open" || d.status === "investigating");
    const pendingApps = applicationsList.filter((a) => a.status === "pending");

    const totalRating = activeElectricians.reduce((sum, e) => sum + e.rating, 0);
    const avgRating = activeElectricians.length > 0 ? totalRating / activeElectricians.length : 0;

    const totalRevenue = completedJobs.reduce((sum, j) => {
      const finalPrice = j.finalPrice ? num(j.finalPrice) : null;
      const quotedPrice = num(j.quotedPrice);
      return sum + (finalPrice || quotedPrice);
    }, 0);
    const avgJobValue = completedJobs.length > 0 ? totalRevenue / completedJobs.length : 0;

    return {
      totalElectricians: electriciansList.length,
      activeElectricians: activeElectricians.length,
      pendingApplications: pendingApps.length,
      totalJobs: jobsRows.length,
      completedJobs: completedJobs.length,
      cancelledJobs: cancelledJobs.length,
      averageRating: Math.round(avgRating * 10) / 10,
      openDisputes: openDisputes.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageJobValue: Math.round(avgJobValue * 100) / 100,
    };
  }

  async seedDemoData(): Promise<void> {
    const existingApps = await db.select().from(electricianApplications);
    if (existingApps.length > 0) return;

    const demoApps = [
      {
        id: randomUUID(),
        name: "Ahmad Al-Masri",
        email: "ahmad@example.com",
        phone: "+962791234567",
        nationalId: "9851234567",
        specializations: ["residential", "commercial"],
        yearsExperience: "8",
        certifications: ["Licensed Electrician", "Safety Certified"],
        status: "pending",
      },
      {
        id: randomUUID(),
        name: "Mohammad Khalil",
        email: "mohammad.k@example.com",
        phone: "+962797654321",
        nationalId: "9859876543",
        specializations: ["industrial", "maintenance"],
        yearsExperience: "12",
        certifications: ["Master Electrician", "Industrial Safety"],
        status: "pending",
      },
    ];

    await db.insert(electricianApplications).values(demoApps);

    const demoCustomers = [
      {
        id: randomUUID(),
        name: "Sarah Ibrahim",
        email: "sarah.i@example.com",
        phone: "+962791111111",
        balance: "0",
        credits: "50",
        totalJobs: "3",
      },
      {
        id: randomUUID(),
        name: "Khaled Nasser",
        email: "khaled.n@example.com",
        phone: "+962792222222",
        balance: "25",
        credits: "0",
        totalJobs: "1",
      },
    ];

    await db.insert(customers).values(demoCustomers);
    console.log("Demo data seeded");
  }

  async createMarketingLead(lead: {
    id?: string;
    source: string;
    status: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string | null;
    serviceAddress?: string | null;
    issueDescription?: string | null;
    notes?: string | null;
  }): Promise<MarketingLead> {
    const result = await db.insert(marketingLeads).values({
      id: lead.id || randomUUID(),
      source: lead.source,
      status: lead.status,
      customerName: lead.customerName,
      customerPhone: lead.customerPhone,
      customerEmail: lead.customerEmail || null,
      serviceAddress: lead.serviceAddress || null,
      issueDescription: lead.issueDescription || null,
      notes: lead.notes || null,
    }).returning();
    
    const row = result[0];
    return {
      id: row.id,
      source: row.source as "marketing_site",
      status: row.status as MarketingLead["status"],
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      customerEmail: row.customerEmail ?? null,
      serviceAddress: row.serviceAddress || "",
      issueDescription: row.issueDescription || "",
      notes: row.notes || undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async getMarketingLeads(status?: string): Promise<MarketingLead[]> {
    const rows = status 
      ? await db.select().from(marketingLeads).where(eq(marketingLeads.status, status)).orderBy(desc(marketingLeads.createdAt))
      : await db.select().from(marketingLeads).orderBy(desc(marketingLeads.createdAt));
    
    return rows.map((row) => ({
      id: row.id,
      source: row.source as "marketing_site",
      status: row.status as MarketingLead["status"],
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      customerEmail: row.customerEmail ?? null,
      serviceAddress: row.serviceAddress || "",
      issueDescription: row.issueDescription || "",
      notes: row.notes || undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async getMarketingLead(id: string): Promise<MarketingLead | undefined> {
    const rows = await db.select().from(marketingLeads).where(eq(marketingLeads.id, id));
    if (rows.length === 0) return undefined;
    const row = rows[0];
    return {
      id: row.id,
      source: row.source as "marketing_site",
      status: row.status as MarketingLead["status"],
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      customerEmail: row.customerEmail ?? null,
      serviceAddress: row.serviceAddress || "",
      issueDescription: row.issueDescription || "",
      notes: row.notes || undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async updateMarketingLeadStatus(
    id: string,
    status: "pending" | "contacted" | "converted" | "closed",
    notes?: string
  ): Promise<MarketingLead | undefined> {
    const updateData: { status: string; updatedAt: Date; notes?: string } = {
      status,
      updatedAt: new Date(),
    };
    if (notes) {
      updateData.notes = notes;
    }
    
    const result = await db.update(marketingLeads)
      .set(updateData)
      .where(eq(marketingLeads.id, id))
      .returning();
    
    if (result.length === 0) return undefined;
    const row = result[0];
    return {
      id: row.id,
      source: row.source as "marketing_site",
      status: row.status as MarketingLead["status"],
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      customerEmail: row.customerEmail ?? null,
      serviceAddress: row.serviceAddress || "",
      issueDescription: row.issueDescription || "",
      notes: row.notes || undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

export const adminStorage = new AdminStorage();
