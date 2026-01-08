/**
 * Database schema for Cloudflare Workers
 * This is a copy of shared/schema.ts to ensure functions are self-contained
 * Keep in sync with shared/schema.ts when making changes
 */

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, numeric } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export type User = typeof users.$inferSelect;

export const marketingLeads = pgTable("marketing_leads", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  source: text("source").notNull().default("marketing_site"),
  status: text("status").notNull().default("pending"),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  serviceAddress: text("service_address"),
  issueDescription: text("issue_description"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type MarketingLeadDB = typeof marketingLeads.$inferSelect;

// Admin Users Table
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(), // "superadmin" | "operator"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
});

// Electrician Applications Table
export const electricianApplications = pgTable("electrician_applications", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  nationalId: text("national_id").notNull(),
  specializations: jsonb("specializations").$type<string[]>().notNull().default([]),
  yearsExperience: numeric("years_experience").notNull().default("0"),
  certifications: jsonb("certifications").$type<string[]>().notNull().default([]),
  status: text("status").notNull().default("pending"), // "pending" | "approved" | "rejected"
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by"),
  reviewReason: text("review_reason"),
});

// Electricians Table
export const electricians = pgTable("electricians", {
  id: varchar("id").primaryKey(),
  applicationId: varchar("application_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  nationalId: text("national_id").notNull(),
  specializations: jsonb("specializations").$type<string[]>().notNull().default([]),
  yearsExperience: numeric("years_experience").notNull().default("0"),
  certifications: jsonb("certifications").$type<string[]>().notNull().default([]),
  status: text("status").notNull().default("active"), // "active" | "suspended" | "inactive"
  rating: numeric("rating").notNull().default("0"),
  totalJobs: numeric("total_jobs").notNull().default("0"),
  completedJobs: numeric("completed_jobs").notNull().default("0"),
  cancelledJobs: numeric("cancelled_jobs").notNull().default("0"),
  balance: numeric("balance").notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Jobs Table
export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey(),
  customerId: varchar("customer_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  electricianId: varchar("electrician_id"),
  electricianName: text("electrician_name"),
  serviceType: text("service_type").notNull(),
  description: text("description").notNull(),
  address: text("address").notNull(),
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  quotedPrice: numeric("quoted_price").notNull(),
  finalPrice: numeric("final_price"),
  status: text("status").notNull(), // Job status enum
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Job Events Table (for timeline)
export const jobEvents = pgTable("job_events", {
  id: varchar("id").primaryKey(),
  jobId: varchar("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  actorType: text("actor_type").notNull(), // "system" | "customer" | "electrician" | "admin"
  actorId: varchar("actor_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
});

// Disputes Table
export const disputes = pgTable("disputes", {
  id: varchar("id").primaryKey(),
  jobId: varchar("job_id").notNull(),
  customerId: varchar("customer_id").notNull(),
  customerName: text("customer_name").notNull(),
  electricianId: varchar("electrician_id"),
  electricianName: text("electrician_name"),
  type: text("type").notNull(), // "quality" | "pricing" | "no_show" | "damage" | "behavior" | "other"
  description: text("description").notNull(),
  status: text("status").notNull().default("open"), // "open" | "investigating" | "resolved" | "escalated" | "closed"
  priority: text("priority").notNull().default("medium"), // "low" | "medium" | "high" | "urgent"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
  resolution: text("resolution"),
  assignedTo: varchar("assigned_to"),
});

// Customers Table
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  balance: numeric("balance").notNull().default("0"),
  credits: numeric("credits").notNull().default("0"),
  totalJobs: numeric("total_jobs").notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Balance Transactions Table
export const balanceTransactions = pgTable("balance_transactions", {
  id: varchar("id").primaryKey(),
  entityType: text("entity_type").notNull(), // "customer" | "electrician"
  entityId: varchar("entity_id").notNull(),
  type: text("type").notNull(), // "credit" | "debit" | "adjustment" | "payout" | "refund"
  amount: numeric("amount").notNull(),
  balanceBefore: numeric("balance_before").notNull(),
  balanceAfter: numeric("balance_after").notNull(),
  reason: text("reason").notNull(),
  adminId: varchar("admin_id"),
  jobId: varchar("job_id"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Configs Table
export const configs = pgTable("configs", {
  id: varchar("id").primaryKey(),
  key: text("key").notNull(),
  value: jsonb("value").notNull(),
  version: numeric("version").notNull(),
  updatedBy: varchar("updated_by").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  reason: text("reason").notNull(),
});

// Audit Logs Table
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey(),
  adminId: varchar("admin_id").notNull(),
  adminEmail: text("admin_email").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id"),
  reason: text("reason").notNull(),
  details: jsonb("details").$type<Record<string, unknown>>(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ipAddress: text("ip_address"),
});



