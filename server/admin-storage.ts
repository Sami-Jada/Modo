import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";
import * as bcrypt from "bcrypt";
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

const DATA_DIR = path.resolve(process.cwd(), "data");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJsonFile<T>(filename: string, defaultValue: T): T {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return defaultValue;
  }
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return defaultValue;
  }
}

function writeJsonFile<T>(filename: string, data: T): void {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

class AdminStorage {
  private getAdminUsers(): AdminUser[] {
    return readJsonFile<AdminUser[]>("admin_users.json", []);
  }

  private setAdminUsers(users: AdminUser[]): void {
    writeJsonFile("admin_users.json", users);
  }

  async initializeDefaultAdmin(): Promise<void> {
    const users = this.getAdminUsers();
    if (users.length === 0) {
      const passwordHash = await bcrypt.hash("admin123", 10);
      const defaultAdmin: AdminUser = {
        id: randomUUID(),
        email: "admin@kahraba.jo",
        passwordHash,
        name: "System Admin",
        role: "superadmin",
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
      };
      this.setAdminUsers([defaultAdmin]);
      console.log("Default admin created: admin@kahraba.jo / admin123");
    }
  }

  async getAdminByEmail(email: string): Promise<AdminUser | undefined> {
    const users = this.getAdminUsers();
    return users.find((u) => u.email === email);
  }

  async getAdminById(id: string): Promise<AdminUser | undefined> {
    const users = this.getAdminUsers();
    return users.find((u) => u.id === id);
  }

  async updateAdminLastLogin(id: string): Promise<void> {
    const users = this.getAdminUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index !== -1) {
      users[index].lastLoginAt = new Date().toISOString();
      this.setAdminUsers(users);
    }
  }

  async verifyPassword(user: AdminUser, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  private getApplications(): ElectricianApplication[] {
    return readJsonFile<ElectricianApplication[]>("applications.json", []);
  }

  private setApplications(apps: ElectricianApplication[]): void {
    writeJsonFile("applications.json", apps);
  }

  async listApplications(status?: string): Promise<ElectricianApplication[]> {
    const apps = this.getApplications();
    if (status) {
      return apps.filter((a) => a.status === status);
    }
    return apps;
  }

  async getApplication(id: string): Promise<ElectricianApplication | undefined> {
    const apps = this.getApplications();
    return apps.find((a) => a.id === id);
  }

  async createApplication(
    data: Omit<ElectricianApplication, "id" | "status" | "submittedAt" | "reviewedAt" | "reviewedBy" | "reviewReason">
  ): Promise<ElectricianApplication> {
    const apps = this.getApplications();
    const app: ElectricianApplication = {
      ...data,
      id: randomUUID(),
      status: "pending",
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      reviewReason: null,
    };
    apps.push(app);
    this.setApplications(apps);
    return app;
  }

  async updateApplicationStatus(
    id: string,
    status: "approved" | "rejected",
    reviewedBy: string,
    reason: string
  ): Promise<ElectricianApplication | undefined> {
    const apps = this.getApplications();
    const index = apps.findIndex((a) => a.id === id);
    if (index === -1) return undefined;

    apps[index].status = status;
    apps[index].reviewedAt = new Date().toISOString();
    apps[index].reviewedBy = reviewedBy;
    apps[index].reviewReason = reason;
    this.setApplications(apps);

    if (status === "approved") {
      await this.createElectricianFromApplication(apps[index]);
    }

    return apps[index];
  }

  private getElectricians(): Electrician[] {
    return readJsonFile<Electrician[]>("electricians.json", []);
  }

  private setElectricians(electricians: Electrician[]): void {
    writeJsonFile("electricians.json", electricians);
  }

  async createElectricianFromApplication(app: ElectricianApplication): Promise<Electrician> {
    const electricians = this.getElectricians();
    const electrician: Electrician = {
      id: randomUUID(),
      applicationId: app.id,
      name: app.name,
      email: app.email,
      phone: app.phone,
      nationalId: app.nationalId,
      specializations: app.specializations,
      yearsExperience: app.yearsExperience,
      certifications: app.certifications,
      status: "active",
      rating: 0,
      totalJobs: 0,
      completedJobs: 0,
      cancelledJobs: 0,
      balance: 0,
      createdAt: new Date().toISOString(),
    };
    electricians.push(electrician);
    this.setElectricians(electricians);
    return electrician;
  }

  async listElectricians(status?: string): Promise<Electrician[]> {
    const electricians = this.getElectricians();
    if (status) {
      return electricians.filter((e) => e.status === status);
    }
    return electricians;
  }

  async getElectrician(id: string): Promise<Electrician | undefined> {
    const electricians = this.getElectricians();
    return electricians.find((e) => e.id === id);
  }

  async updateElectricianStatus(
    id: string,
    status: "active" | "suspended" | "inactive"
  ): Promise<Electrician | undefined> {
    const electricians = this.getElectricians();
    const index = electricians.findIndex((e) => e.id === id);
    if (index === -1) return undefined;
    electricians[index].status = status;
    this.setElectricians(electricians);
    return electricians[index];
  }

  private getJobs(): Job[] {
    return readJsonFile<Job[]>("jobs.json", []);
  }

  private setJobs(jobs: Job[]): void {
    writeJsonFile("jobs.json", jobs);
  }

  async listJobs(filters?: { status?: string; electricianId?: string; customerId?: string }): Promise<Job[]> {
    let jobs = this.getJobs();
    if (filters?.status) {
      jobs = jobs.filter((j) => j.status === filters.status);
    }
    if (filters?.electricianId) {
      jobs = jobs.filter((j) => j.electricianId === filters.electricianId);
    }
    if (filters?.customerId) {
      jobs = jobs.filter((j) => j.customerId === filters.customerId);
    }
    return jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getJob(id: string): Promise<Job | undefined> {
    const jobs = this.getJobs();
    return jobs.find((j) => j.id === id);
  }

  async createJob(data: Omit<Job, "id" | "createdAt" | "completedAt" | "timeline">): Promise<Job> {
    const jobs = this.getJobs();
    const job: Job = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      completedAt: null,
      timeline: [],
    };
    const event: JobEvent = {
      id: randomUUID(),
      jobId: job.id,
      status: job.status,
      timestamp: job.createdAt,
      actorType: "system",
      actorId: null,
    };
    job.timeline.push(event);
    jobs.push(job);
    this.setJobs(jobs);
    return job;
  }

  async addJobEvent(jobId: string, event: Omit<JobEvent, "id" | "jobId" | "timestamp">): Promise<Job | undefined> {
    const jobs = this.getJobs();
    const index = jobs.findIndex((j) => j.id === jobId);
    if (index === -1) return undefined;

    const jobEvent: JobEvent = {
      ...event,
      id: randomUUID(),
      jobId,
      timestamp: new Date().toISOString(),
    };
    jobs[index].timeline.push(jobEvent);
    jobs[index].status = event.status;

    if (event.status === "COMPLETED" || event.status === "SETTLED") {
      jobs[index].completedAt = jobEvent.timestamp;
    }

    this.setJobs(jobs);
    return jobs[index];
  }

  private getDisputes(): Dispute[] {
    return readJsonFile<Dispute[]>("disputes.json", []);
  }

  private setDisputes(disputes: Dispute[]): void {
    writeJsonFile("disputes.json", disputes);
  }

  async listDisputes(filters?: { status?: string; priority?: string }): Promise<Dispute[]> {
    let disputes = this.getDisputes();
    if (filters?.status) {
      disputes = disputes.filter((d) => d.status === filters.status);
    }
    if (filters?.priority) {
      disputes = disputes.filter((d) => d.priority === filters.priority);
    }
    return disputes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getDispute(id: string): Promise<Dispute | undefined> {
    const disputes = this.getDisputes();
    return disputes.find((d) => d.id === id);
  }

  async createDispute(
    data: Omit<Dispute, "id" | "createdAt" | "updatedAt" | "resolvedAt" | "resolution" | "assignedTo">
  ): Promise<Dispute> {
    const disputes = this.getDisputes();
    const dispute: Dispute = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolvedAt: null,
      resolution: null,
      assignedTo: null,
    };
    disputes.push(dispute);
    this.setDisputes(disputes);
    return dispute;
  }

  async updateDispute(
    id: string,
    updates: Partial<Pick<Dispute, "status" | "priority" | "resolution" | "assignedTo">>
  ): Promise<Dispute | undefined> {
    const disputes = this.getDisputes();
    const index = disputes.findIndex((d) => d.id === id);
    if (index === -1) return undefined;

    if (updates.status) disputes[index].status = updates.status;
    if (updates.priority) disputes[index].priority = updates.priority;
    if (updates.resolution !== undefined) disputes[index].resolution = updates.resolution;
    if (updates.assignedTo !== undefined) disputes[index].assignedTo = updates.assignedTo;

    disputes[index].updatedAt = new Date().toISOString();

    if (updates.status === "resolved" || updates.status === "closed") {
      disputes[index].resolvedAt = new Date().toISOString();
    }

    this.setDisputes(disputes);
    return disputes[index];
  }

  private getAuditLogs(): AuditLog[] {
    return readJsonFile<AuditLog[]>("audit_logs.json", []);
  }

  private appendAuditLog(log: AuditLog): void {
    const logs = this.getAuditLogs();
    logs.push(log);
    writeJsonFile("audit_logs.json", logs);
  }

  async createAuditLog(
    data: Omit<AuditLog, "id" | "timestamp">
  ): Promise<AuditLog> {
    const log: AuditLog = {
      ...data,
      id: randomUUID(),
      timestamp: new Date().toISOString(),
    };
    this.appendAuditLog(log);
    return log;
  }

  async listAuditLogs(filters?: {
    entityType?: string;
    entityId?: string;
    adminId?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<AuditLog[]> {
    let logs = this.getAuditLogs();

    if (filters?.entityType) {
      logs = logs.filter((l) => l.entityType === filters.entityType);
    }
    if (filters?.entityId) {
      logs = logs.filter((l) => l.entityId === filters.entityId);
    }
    if (filters?.adminId) {
      logs = logs.filter((l) => l.adminId === filters.adminId);
    }
    if (filters?.fromDate) {
      logs = logs.filter((l) => new Date(l.timestamp) >= new Date(filters.fromDate!));
    }
    if (filters?.toDate) {
      logs = logs.filter((l) => new Date(l.timestamp) <= new Date(filters.toDate!));
    }

    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  private getCustomers(): Customer[] {
    return readJsonFile<Customer[]>("customers.json", []);
  }

  private setCustomers(customers: Customer[]): void {
    writeJsonFile("customers.json", customers);
  }

  async listCustomers(): Promise<Customer[]> {
    return this.getCustomers();
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const customers = this.getCustomers();
    return customers.find((c) => c.id === id);
  }

  async updateCustomerBalance(id: string, amount: number): Promise<Customer | undefined> {
    const customers = this.getCustomers();
    const index = customers.findIndex((c) => c.id === id);
    if (index === -1) return undefined;
    customers[index].balance += amount;
    this.setCustomers(customers);
    return customers[index];
  }

  async updateCustomerCredits(id: string, amount: number): Promise<Customer | undefined> {
    const customers = this.getCustomers();
    const index = customers.findIndex((c) => c.id === id);
    if (index === -1) return undefined;
    customers[index].credits += amount;
    this.setCustomers(customers);
    return customers[index];
  }

  private getBalanceTransactions(): BalanceTransaction[] {
    return readJsonFile<BalanceTransaction[]>("balance_transactions.json", []);
  }

  private setBalanceTransactions(transactions: BalanceTransaction[]): void {
    writeJsonFile("balance_transactions.json", transactions);
  }

  async createBalanceTransaction(
    data: Omit<BalanceTransaction, "id" | "timestamp">
  ): Promise<BalanceTransaction> {
    const transactions = this.getBalanceTransactions();
    const transaction: BalanceTransaction = {
      ...data,
      id: randomUUID(),
      timestamp: new Date().toISOString(),
    };
    transactions.push(transaction);
    this.setBalanceTransactions(transactions);
    return transaction;
  }

  async listBalanceTransactions(entityType?: string, entityId?: string): Promise<BalanceTransaction[]> {
    let transactions = this.getBalanceTransactions();
    if (entityType) {
      transactions = transactions.filter((t) => t.entityType === entityType);
    }
    if (entityId) {
      transactions = transactions.filter((t) => t.entityId === entityId);
    }
    return transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  private getConfigs(): Config[] {
    return readJsonFile<Config[]>("configs.json", []);
  }

  private setConfigs(configs: Config[]): void {
    writeJsonFile("configs.json", configs);
  }

  async getConfig(key: string): Promise<Config | undefined> {
    const configs = this.getConfigs();
    const filtered = configs.filter((c) => c.key === key);
    if (filtered.length === 0) return undefined;
    return filtered.reduce((a, b) => (a.version > b.version ? a : b));
  }

  async setConfig(key: string, value: unknown, updatedBy: string, reason: string): Promise<Config> {
    const configs = this.getConfigs();
    const existing = configs.filter((c) => c.key === key);
    const maxVersion = existing.length > 0 ? Math.max(...existing.map((c) => c.version)) : 0;

    const config: Config = {
      id: randomUUID(),
      key,
      value,
      version: maxVersion + 1,
      updatedBy,
      updatedAt: new Date().toISOString(),
      reason,
    };
    configs.push(config);
    this.setConfigs(configs);
    return config;
  }

  async listConfigHistory(key: string): Promise<Config[]> {
    const configs = this.getConfigs();
    return configs.filter((c) => c.key === key).sort((a, b) => b.version - a.version);
  }

  async listAllConfigs(): Promise<Config[]> {
    const configs = this.getConfigs();
    const latestByKey = new Map<string, Config>();
    for (const config of configs) {
      const existing = latestByKey.get(config.key);
      if (!existing || config.version > existing.version) {
        latestByKey.set(config.key, config);
      }
    }
    return Array.from(latestByKey.values());
  }

  async getMetrics(): Promise<TrustMetrics> {
    const electricians = this.getElectricians();
    const jobs = this.getJobs();
    const disputes = this.getDisputes();
    const applications = this.getApplications();

    const activeElectricians = electricians.filter((e) => e.status === "active");
    const completedJobs = jobs.filter((j) => j.status === "COMPLETED" || j.status === "SETTLED");
    const cancelledJobs = jobs.filter((j) => j.status === "CANCELLED");
    const openDisputes = disputes.filter((d) => d.status === "open" || d.status === "investigating");
    const pendingApps = applications.filter((a) => a.status === "pending");

    const totalRating = activeElectricians.reduce((sum, e) => sum + e.rating, 0);
    const avgRating = activeElectricians.length > 0 ? totalRating / activeElectricians.length : 0;

    const totalRevenue = completedJobs.reduce((sum, j) => sum + (j.finalPrice || j.quotedPrice), 0);
    const avgJobValue = completedJobs.length > 0 ? totalRevenue / completedJobs.length : 0;

    return {
      totalElectricians: electricians.length,
      activeElectricians: activeElectricians.length,
      pendingApplications: pendingApps.length,
      totalJobs: jobs.length,
      completedJobs: completedJobs.length,
      cancelledJobs: cancelledJobs.length,
      averageRating: Math.round(avgRating * 10) / 10,
      openDisputes: openDisputes.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageJobValue: Math.round(avgJobValue * 100) / 100,
    };
  }

  async seedDemoData(): Promise<void> {
    const apps = this.getApplications();
    if (apps.length > 0) return;

    const demoApps: ElectricianApplication[] = [
      {
        id: randomUUID(),
        name: "Ahmad Al-Masri",
        email: "ahmad@example.com",
        phone: "+962791234567",
        nationalId: "9851234567",
        specializations: ["residential", "commercial"],
        yearsExperience: 8,
        certifications: ["Licensed Electrician", "Safety Certified"],
        status: "pending",
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedAt: null,
        reviewedBy: null,
        reviewReason: null,
      },
      {
        id: randomUUID(),
        name: "Mohammad Khalil",
        email: "mohammad.k@example.com",
        phone: "+962797654321",
        nationalId: "9859876543",
        specializations: ["industrial", "maintenance"],
        yearsExperience: 12,
        certifications: ["Master Electrician", "Industrial Safety"],
        status: "pending",
        submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedAt: null,
        reviewedBy: null,
        reviewReason: null,
      },
    ];

    this.setApplications(demoApps);

    const demoCustomers: Customer[] = [
      {
        id: randomUUID(),
        name: "Sarah Ibrahim",
        email: "sarah.i@example.com",
        phone: "+962791111111",
        balance: 0,
        credits: 50,
        totalJobs: 3,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: randomUUID(),
        name: "Khaled Nasser",
        email: "khaled.n@example.com",
        phone: "+962792222222",
        balance: 25,
        credits: 0,
        totalJobs: 1,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    this.setCustomers(demoCustomers);
    console.log("Demo data seeded");
  }

  private readMarketingLeads(): MarketingLead[] {
    return readJsonFile<MarketingLead[]>("marketing_leads.json", []);
  }

  private writeMarketingLeads(leads: MarketingLead[]): void {
    writeJsonFile("marketing_leads.json", leads);
  }

  async createMarketingLead(lead: MarketingLead): Promise<MarketingLead> {
    const leads = this.readMarketingLeads();
    leads.push(lead);
    this.writeMarketingLeads(leads);
    return lead;
  }

  async getMarketingLeads(status?: string): Promise<MarketingLead[]> {
    let leads = this.readMarketingLeads();
    if (status) {
      leads = leads.filter((l) => l.status === status);
    }
    return leads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getMarketingLead(id: string): Promise<MarketingLead | undefined> {
    const leads = this.readMarketingLeads();
    return leads.find((l) => l.id === id);
  }

  async updateMarketingLeadStatus(
    id: string,
    status: "pending" | "contacted" | "converted" | "closed",
    notes?: string
  ): Promise<MarketingLead | undefined> {
    const leads = this.readMarketingLeads();
    const index = leads.findIndex((l) => l.id === id);
    if (index === -1) return undefined;
    leads[index].status = status;
    leads[index].updatedAt = new Date().toISOString();
    if (notes) {
      leads[index].notes = notes;
    }
    this.writeMarketingLeads(leads);
    return leads[index];
  }
}

export const adminStorage = new AdminStorage();
