/**
 * Storage layer for Cloudflare Workers
 * Workers-compatible version of admin-storage.ts
 * Uses bcryptjs instead of bcrypt, and accepts db connection as parameter
 */

import * as bcrypt from "bcryptjs";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import type { Database } from "./db";
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
} from "../../shared/schema";

// Types
export interface AdminUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: "superadmin" | "operator";
  createdAt: string;
  lastLoginAt: string | null;
}

export interface ElectricianApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationalId: string;
  specializations: string[];
  yearsExperience: number;
  certifications: string[];
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewReason: string | null;
}

export interface Electrician {
  id: string;
  applicationId: string;
  name: string;
  email: string;
  phone: string;
  nationalId: string;
  specializations: string[];
  yearsExperience: number;
  certifications: string[];
  status: "active" | "suspended" | "inactive";
  rating: number;
  totalJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  balance: number;
  createdAt: string;
}

export interface JobEvent {
  id: string;
  jobId: string;
  status: string;
  timestamp: string;
  actorType: "system" | "customer" | "electrician" | "admin";
  actorId: string | null;
  metadata?: Record<string, unknown>;
}

export interface Job {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  electricianId: string | null;
  electricianName: string | null;
  serviceType: string;
  description: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  quotedPrice: number;
  finalPrice: number | null;
  status: string;
  createdAt: string;
  completedAt: string | null;
  timeline: JobEvent[];
}

export interface Dispute {
  id: string;
  jobId: string;
  customerId: string;
  customerName: string;
  electricianId: string | null;
  electricianName: string | null;
  type: "quality" | "pricing" | "no_show" | "damage" | "behavior" | "other";
  description: string;
  status: "open" | "investigating" | "resolved" | "escalated" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  resolution: string | null;
  assignedTo: string | null;
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  balance: number;
  credits: number;
  totalJobs: number;
  createdAt: string;
}

export interface BalanceTransaction {
  id: string;
  entityType: "customer" | "electrician";
  entityId: string;
  type: "credit" | "debit" | "adjustment" | "payout" | "refund";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reason: string;
  adminId: string | null;
  jobId: string | null;
  timestamp: string;
}

export interface Config {
  id: string;
  key: string;
  value: unknown;
  version: number;
  updatedBy: string;
  updatedAt: string;
  reason: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  entityType: "electrician_application" | "electrician" | "job" | "dispute" | "customer" | "balance" | "credit" | "config" | "auth";
  entityId: string | null;
  reason: string;
  details?: Record<string, unknown>;
  timestamp: string;
  ipAddress: string | null;
}

export interface MarketingLead {
  id: string;
  source: "marketing_site";
  status: "pending" | "contacted" | "converted" | "closed";
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  serviceAddress: string;
  issueDescription: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrustMetrics {
  totalElectricians: number;
  activeElectricians: number;
  pendingApplications: number;
  totalJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  averageRating: number;
  openDisputes: number;
  totalRevenue: number;
  averageJobValue: number;
}

// Helper function to convert numeric database values to numbers
function num(value: string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return parseFloat(value);
}

// Generate UUID
function generateUUID(): string {
  return crypto.randomUUID();
}

// Helper functions to convert database rows to types
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

function dbRowToJobEvent(row: typeof jobEvents.$inferSelect): JobEvent {
  return {
    id: row.id,
    jobId: row.jobId,
    status: row.status,
    timestamp: row.timestamp.toISOString(),
    actorType: row.actorType as "system" | "customer" | "electrician" | "admin",
    actorId: row.actorId ?? null,
    metadata: row.metadata as Record<string, unknown> | undefined,
  };
}

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
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    timeline,
  };
}

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

/**
 * Storage class for Workers - all methods accept db as first parameter
 */
export class WorkersStorage {
  // Admin Users
  async getAdminByEmail(db: Database, email: string): Promise<AdminUser | undefined> {
    const rows = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    if (rows.length === 0) return undefined;
    return dbRowToAdminUser(rows[0]);
  }

  async getAdminById(db: Database, id: string): Promise<AdminUser | undefined> {
    const rows = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    if (rows.length === 0) return undefined;
    return dbRowToAdminUser(rows[0]);
  }

  async updateAdminLastLogin(db: Database, id: string): Promise<void> {
    await db.update(adminUsers)
      .set({ lastLoginAt: new Date() })
      .where(eq(adminUsers.id, id));
  }

  async verifyPassword(user: AdminUser, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  // Applications
  async listApplications(db: Database, status?: string): Promise<ElectricianApplication[]> {
    const query = status
      ? db.select().from(electricianApplications).where(eq(electricianApplications.status, status))
      : db.select().from(electricianApplications);
    const rows = await query;
    return rows.map(dbRowToApplication);
  }

  async getApplication(db: Database, id: string): Promise<ElectricianApplication | undefined> {
    const rows = await db.select().from(electricianApplications).where(eq(electricianApplications.id, id));
    if (rows.length === 0) return undefined;
    return dbRowToApplication(rows[0]);
  }

  async createApplication(
    db: Database,
    data: Omit<ElectricianApplication, "id" | "status" | "submittedAt" | "reviewedAt" | "reviewedBy" | "reviewReason">
  ): Promise<ElectricianApplication> {
    const id = generateUUID();
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
    db: Database,
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
      await this.createElectricianFromApplication(db, app);
    }

    return app;
  }

  async createElectricianFromApplication(db: Database, app: ElectricianApplication): Promise<Electrician> {
    const id = generateUUID();
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

  // Electricians
  async listElectricians(db: Database, status?: string): Promise<Electrician[]> {
    const query = status
      ? db.select().from(electricians).where(eq(electricians.status, status))
      : db.select().from(electricians);
    const rows = await query;
    return rows.map(dbRowToElectrician);
  }

  async getElectrician(db: Database, id: string): Promise<Electrician | undefined> {
    const rows = await db.select().from(electricians).where(eq(electricians.id, id));
    if (rows.length === 0) return undefined;
    return dbRowToElectrician(rows[0]);
  }

  async updateElectricianStatus(
    db: Database,
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

  // Jobs
  async listJobs(db: Database, filters?: { status?: string; electricianId?: string; customerId?: string }): Promise<Job[]> {
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
    
    const query = conditions.length > 0
      ? db.select().from(jobs).where(and(...conditions))
      : db.select().from(jobs);
    
    const rows = await query.orderBy(desc(jobs.createdAt));
    
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

  async getJob(db: Database, id: string): Promise<Job | undefined> {
    const rows = await db.select().from(jobs).where(eq(jobs.id, id));
    if (rows.length === 0) return undefined;
    
    const jobRow = rows[0];
    const events = await db.select().from(jobEvents)
      .where(eq(jobEvents.jobId, id))
      .orderBy(jobEvents.timestamp);
    const timeline = events.map(dbRowToJobEvent);
    
    return dbRowToJob(jobRow, timeline);
  }

  async addJobEvent(
    db: Database,
    jobId: string,
    event: Omit<JobEvent, "id" | "jobId" | "timestamp">
  ): Promise<Job | undefined> {
    const jobRows = await db.select().from(jobs).where(eq(jobs.id, jobId));
    if (jobRows.length === 0) return undefined;
    
    const eventId = generateUUID();
    const now = new Date();
    
    await db.insert(jobEvents).values({
      id: eventId,
      jobId,
      status: event.status,
      actorType: event.actorType,
      actorId: event.actorId ?? null,
      metadata: event.metadata ?? null,
    });
    
    const updateData: { status: string; completedAt?: Date } = { status: event.status };
    if (event.status === "COMPLETED" || event.status === "SETTLED") {
      updateData.completedAt = now;
    }
    
    const updatedRows = await db.update(jobs)
      .set(updateData)
      .where(eq(jobs.id, jobId))
      .returning();
    
    if (updatedRows.length === 0) return undefined;
    
    const events = await db.select().from(jobEvents)
      .where(eq(jobEvents.jobId, jobId))
      .orderBy(jobEvents.timestamp);
    const timeline = events.map(dbRowToJobEvent);
    
    return dbRowToJob(updatedRows[0], timeline);
  }

  // Disputes
  async listDisputes(db: Database, filters?: { status?: string; priority?: string }): Promise<Dispute[]> {
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(disputes.status, filters.status));
    }
    if (filters?.priority) {
      conditions.push(eq(disputes.priority, filters.priority));
    }
    
    const query = conditions.length > 0
      ? db.select().from(disputes).where(and(...conditions))
      : db.select().from(disputes);
    
    const rows = await query.orderBy(desc(disputes.createdAt));
    return rows.map(dbRowToDispute);
  }

  async getDispute(db: Database, id: string): Promise<Dispute | undefined> {
    const rows = await db.select().from(disputes).where(eq(disputes.id, id));
    if (rows.length === 0) return undefined;
    return dbRowToDispute(rows[0]);
  }

  async updateDispute(
    db: Database,
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

  // Customers
  async listCustomers(db: Database): Promise<Customer[]> {
    const rows = await db.select().from(customers);
    return rows.map(dbRowToCustomer);
  }

  async getCustomer(db: Database, id: string): Promise<Customer | undefined> {
    const rows = await db.select().from(customers).where(eq(customers.id, id));
    if (rows.length === 0) return undefined;
    return dbRowToCustomer(rows[0]);
  }

  async updateCustomerBalance(db: Database, id: string, amount: number): Promise<Customer | undefined> {
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

  async updateCustomerCredits(db: Database, id: string, amount: number): Promise<Customer | undefined> {
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

  // Balance Transactions
  async createBalanceTransaction(
    db: Database,
    data: Omit<BalanceTransaction, "id" | "timestamp">
  ): Promise<BalanceTransaction> {
    const id = generateUUID();
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

  async listBalanceTransactions(db: Database, entityType?: string, entityId?: string): Promise<BalanceTransaction[]> {
    const conditions = [];
    if (entityType) {
      conditions.push(eq(balanceTransactions.entityType, entityType));
    }
    if (entityId) {
      conditions.push(eq(balanceTransactions.entityId, entityId));
    }
    
    const query = conditions.length > 0
      ? db.select().from(balanceTransactions).where(and(...conditions))
      : db.select().from(balanceTransactions);
    
    const rows = await query.orderBy(desc(balanceTransactions.timestamp));
    return rows.map(dbRowToBalanceTransaction);
  }

  // Configs
  async getConfig(db: Database, key: string): Promise<Config | undefined> {
    const rows = await db.select().from(configs)
      .where(eq(configs.key, key))
      .orderBy(desc(configs.version));
    
    if (rows.length === 0) return undefined;
    return dbRowToConfig(rows[0]);
  }

  async setConfig(db: Database, key: string, value: unknown, updatedBy: string, reason: string): Promise<Config> {
    const existing = await db.select().from(configs).where(eq(configs.key, key));
    const maxVersion = existing.length > 0 
      ? Math.max(...existing.map(c => num(c.version))) 
      : 0;

    const id = generateUUID();
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

  async listConfigHistory(db: Database, key: string): Promise<Config[]> {
    const rows = await db.select().from(configs)
      .where(eq(configs.key, key))
      .orderBy(desc(configs.version));
    return rows.map(dbRowToConfig);
  }

  async listAllConfigs(db: Database): Promise<Config[]> {
    const allRows = await db.select().from(configs)
      .orderBy(configs.key, desc(configs.version));
    
    const latestByKey = new Map<string, Config>();
    for (const row of allRows) {
      if (!latestByKey.has(row.key)) {
        latestByKey.set(row.key, dbRowToConfig(row));
      }
    }
    
    return Array.from(latestByKey.values());
  }

  // Audit Logs
  async createAuditLog(
    db: Database,
    data: Omit<AuditLog, "id" | "timestamp">
  ): Promise<AuditLog> {
    const id = generateUUID();
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

  async listAuditLogs(db: Database, filters?: {
    entityType?: string;
    entityId?: string;
    adminId?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<AuditLog[]> {
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
    
    const query = conditions.length > 0
      ? db.select().from(auditLogs).where(and(...conditions))
      : db.select().from(auditLogs);
    
    const rows = await query.orderBy(desc(auditLogs.timestamp));
    return rows.map(dbRowToAuditLog);
  }

  // Metrics
  async getMetrics(db: Database): Promise<TrustMetrics> {
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

  // Marketing Leads
  async createMarketingLead(db: Database, lead: {
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
      id: lead.id || generateUUID(),
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

  async getMarketingLeads(db: Database, status?: string): Promise<MarketingLead[]> {
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

  async getMarketingLead(db: Database, id: string): Promise<MarketingLead | undefined> {
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
    db: Database,
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

// Export singleton instance
export const storage = new WorkersStorage();

