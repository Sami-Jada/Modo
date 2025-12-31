import { z } from "zod";

export const AdminUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  passwordHash: z.string(),
  name: z.string(),
  role: z.enum(["superadmin", "operator"]),
  createdAt: z.string(),
  lastLoginAt: z.string().nullable(),
});

export type AdminUser = z.infer<typeof AdminUserSchema>;

export const ElectricianApplicationSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  nationalId: z.string(),
  specializations: z.array(z.string()),
  yearsExperience: z.number(),
  certifications: z.array(z.string()),
  status: z.enum(["pending", "approved", "rejected"]),
  submittedAt: z.string(),
  reviewedAt: z.string().nullable(),
  reviewedBy: z.string().nullable(),
  reviewReason: z.string().nullable(),
});

export type ElectricianApplication = z.infer<typeof ElectricianApplicationSchema>;

export const ElectricianSchema = z.object({
  id: z.string(),
  applicationId: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  nationalId: z.string(),
  specializations: z.array(z.string()),
  yearsExperience: z.number(),
  certifications: z.array(z.string()),
  status: z.enum(["active", "suspended", "inactive"]),
  rating: z.number().min(0).max(5),
  totalJobs: z.number(),
  completedJobs: z.number(),
  cancelledJobs: z.number(),
  balance: z.number(),
  createdAt: z.string(),
});

export type Electrician = z.infer<typeof ElectricianSchema>;

export const JobStatusSchema = z.enum([
  "CREATED",
  "BROADCAST",
  "ACCEPTED",
  "EN_ROUTE",
  "ARRIVED",
  "IN_PROGRESS",
  "COMPLETED",
  "SETTLED",
  "CANCELLED",
]);

export type JobStatus = z.infer<typeof JobStatusSchema>;

export const JobEventSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  status: JobStatusSchema,
  timestamp: z.string(),
  actorType: z.enum(["system", "customer", "electrician", "admin"]),
  actorId: z.string().nullable(),
  metadata: z.record(z.unknown()).optional(),
});

export type JobEvent = z.infer<typeof JobEventSchema>;

export const JobSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  customerPhone: z.string(),
  electricianId: z.string().nullable(),
  electricianName: z.string().nullable(),
  serviceType: z.string(),
  description: z.string(),
  address: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  quotedPrice: z.number(),
  finalPrice: z.number().nullable(),
  status: JobStatusSchema,
  createdAt: z.string(),
  completedAt: z.string().nullable(),
  timeline: z.array(JobEventSchema),
});

export type Job = z.infer<typeof JobSchema>;

export const DisputeStatusSchema = z.enum([
  "open",
  "investigating",
  "resolved",
  "escalated",
  "closed",
]);

export type DisputeStatus = z.infer<typeof DisputeStatusSchema>;

export const DisputeSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  electricianId: z.string().nullable(),
  electricianName: z.string().nullable(),
  type: z.enum(["quality", "pricing", "no_show", "damage", "behavior", "other"]),
  description: z.string(),
  status: DisputeStatusSchema,
  priority: z.enum(["low", "medium", "high", "urgent"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  resolvedAt: z.string().nullable(),
  resolution: z.string().nullable(),
  assignedTo: z.string().nullable(),
});

export type Dispute = z.infer<typeof DisputeSchema>;

export const AuditLogSchema = z.object({
  id: z.string(),
  adminId: z.string(),
  adminEmail: z.string(),
  action: z.string(),
  entityType: z.enum([
    "electrician_application",
    "electrician",
    "job",
    "dispute",
    "customer",
    "balance",
    "credit",
    "config",
    "auth",
  ]),
  entityId: z.string().nullable(),
  reason: z.string(),
  details: z.record(z.unknown()).optional(),
  timestamp: z.string(),
  ipAddress: z.string().nullable(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;

export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().nullable(),
  phone: z.string(),
  balance: z.number(),
  credits: z.number(),
  totalJobs: z.number(),
  createdAt: z.string(),
});

export type Customer = z.infer<typeof CustomerSchema>;

export const BalanceTransactionSchema = z.object({
  id: z.string(),
  entityType: z.enum(["customer", "electrician"]),
  entityId: z.string(),
  type: z.enum(["credit", "debit", "adjustment", "payout", "refund"]),
  amount: z.number(),
  balanceBefore: z.number(),
  balanceAfter: z.number(),
  reason: z.string(),
  adminId: z.string().nullable(),
  jobId: z.string().nullable(),
  timestamp: z.string(),
});

export type BalanceTransaction = z.infer<typeof BalanceTransactionSchema>;

export const ConfigSchema = z.object({
  id: z.string(),
  key: z.string(),
  value: z.unknown(),
  version: z.number(),
  updatedBy: z.string(),
  updatedAt: z.string(),
  reason: z.string(),
});

export type Config = z.infer<typeof ConfigSchema>;

export const TrustMetricsSchema = z.object({
  totalElectricians: z.number(),
  activeElectricians: z.number(),
  pendingApplications: z.number(),
  totalJobs: z.number(),
  completedJobs: z.number(),
  cancelledJobs: z.number(),
  averageRating: z.number(),
  openDisputes: z.number(),
  totalRevenue: z.number(),
  averageJobValue: z.number(),
});

export type TrustMetrics = z.infer<typeof TrustMetricsSchema>;

export const MarketingLeadSchema = z.object({
  id: z.string(),
  source: z.literal("marketing_site"),
  status: z.enum(["pending", "contacted", "converted", "closed"]),
  customerName: z.string(),
  customerPhone: z.string(),
  customerEmail: z.string().nullable(),
  serviceAddress: z.string(),
  issueDescription: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  notes: z.string().optional(),
  assignedTo: z.string().nullable().optional(),
});

export type MarketingLead = z.infer<typeof MarketingLeadSchema>;
