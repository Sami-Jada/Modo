/**
 * Cloudflare Pages Function for Admin API Routes
 * Handles all /api/admin/* endpoints
 */

import { createDb, type Env } from "../../_shared/db";
import { storage, type AuditLog } from "../../_shared/storage";
import {
  getSession,
  createSessionCookie,
  clearSessionCookie,
  isAuthenticated,
  isSuperadmin,
  type SessionData,
} from "../../_shared/session";

interface PagesContext {
  request: Request;
  env: Env;
  params: { path?: string[] };
}

// Helper to create JSON response with CORS
function jsonResponse(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Credentials": "true",
      ...extraHeaders,
    },
  });
}

// Helper to get IP address from request
function getIpAddress(request: Request): string | null {
  return request.headers.get("CF-Connecting-IP") || 
         request.headers.get("X-Forwarded-For")?.split(",")[0] || 
         null;
}

export async function onRequest(context: PagesContext): Promise<Response> {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const path = params.path || [];
  const method = request.method;
  const pathStr = path.join("/");

  // Handle preflight requests
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }

  try {
    // Initialize database connection
    const db = createDb(env);
    
    // Get session from cookie
    const session = await getSession(request, env.SESSION_SECRET);
    const ipAddress = getIpAddress(request);

    // ==================== AUTH ROUTES ====================

    // POST /api/admin/auth/login
    if (pathStr === "auth/login" && method === "POST") {
      const body = await request.json() as { email?: string; password?: string };
      const { email, password } = body;

      if (!email || !password) {
        return jsonResponse({ error: "Email and password are required" }, 400);
      }

      const admin = await storage.getAdminByEmail(db, email);
      if (!admin) {
        await storage.createAuditLog(db, {
          adminId: "unknown",
          adminEmail: email,
          action: "login_failed",
          entityType: "auth",
          entityId: null,
          reason: "Invalid credentials",
          ipAddress,
        });
        return jsonResponse({ error: "Invalid credentials" }, 401);
      }

      const valid = await storage.verifyPassword(admin, password);
      if (!valid) {
        await storage.createAuditLog(db, {
          adminId: admin.id,
          adminEmail: email,
          action: "login_failed",
          entityType: "auth",
          entityId: null,
          reason: "Invalid password",
          ipAddress,
        });
        return jsonResponse({ error: "Invalid credentials" }, 401);
      }

      await storage.updateAdminLastLogin(db, admin.id);
      await storage.createAuditLog(db, {
        adminId: admin.id,
        adminEmail: admin.email,
        action: "login_success",
        entityType: "auth",
        entityId: admin.id,
        reason: "Admin logged in successfully",
        ipAddress,
      });

      const newSession: SessionData = {
        adminId: admin.id,
        adminEmail: admin.email,
        adminRole: admin.role,
      };

      const cookie = await createSessionCookie(newSession, env.SESSION_SECRET);
      
      return jsonResponse({
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      }, 200, { "Set-Cookie": cookie });
    }

    // POST /api/admin/auth/logout
    if (pathStr === "auth/logout" && method === "POST") {
      if (isAuthenticated(session)) {
        await storage.createAuditLog(db, {
          adminId: session.adminId!,
          adminEmail: session.adminEmail!,
          action: "logout",
          entityType: "auth",
          entityId: session.adminId!,
          reason: "Admin logged out",
          ipAddress,
        });
      }

      const cookie = clearSessionCookie();
      return jsonResponse({ success: true }, 200, { "Set-Cookie": cookie });
    }

    // GET /api/admin/auth/me
    if (pathStr === "auth/me" && method === "GET") {
      if (!isAuthenticated(session)) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }

      const admin = await storage.getAdminById(db, session.adminId!);
      if (!admin) {
        return jsonResponse({ error: "Admin not found" }, 404);
      }

      return jsonResponse({
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      });
    }

    // PATCH /api/admin/auth/change-password
    if (pathStr === "auth/change-password" && method === "PATCH") {
      if (!isAuthenticated(session)) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }

      const body = await request.json() as { currentPassword?: string; newPassword?: string };
      const { currentPassword, newPassword } = body;

      if (!currentPassword || !newPassword) {
        return jsonResponse({ error: "Current password and new password are required" }, 400);
      }

      if (newPassword.length < 6) {
        return jsonResponse({ error: "New password must be at least 6 characters" }, 400);
      }

      const admin = await storage.getAdminById(db, session.adminId!);
      if (!admin) {
        return jsonResponse({ error: "Admin not found" }, 404);
      }

      const valid = await storage.verifyPassword(admin, currentPassword);
      if (!valid) {
        return jsonResponse({ error: "Current password is incorrect" }, 400);
      }

      await storage.updateAdminPassword(db, session.adminId!, newPassword);

      await storage.createAuditLog(db, {
        adminId: session.adminId!,
        adminEmail: session.adminEmail!,
        action: "password_changed",
        entityType: "auth",
        entityId: session.adminId!,
        reason: "Admin changed their password",
        ipAddress,
      });

      return jsonResponse({ success: true, message: "Password updated successfully" });
    }

    // ==================== PROTECTED ROUTES ====================
    // All routes below require authentication

    if (!isAuthenticated(session)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // Helper to create audit log
    async function logAction(
      action: string,
      entityType: AuditLog["entityType"],
      entityId: string | null,
      reason: string,
      details?: Record<string, unknown>
    ) {
      await storage.createAuditLog(db, {
        adminId: session.adminId!,
        adminEmail: session.adminEmail!,
        action,
        entityType,
        entityId,
        reason,
        details,
        ipAddress,
      });
    }

    // ==================== APPLICATIONS ====================

    // GET /api/admin/applications
    if (pathStr === "applications" && method === "GET") {
      const status = url.searchParams.get("status") || undefined;
      const applications = await storage.listApplications(db, status);
      return jsonResponse(applications);
    }

    // GET /api/admin/applications/:id
    if (pathStr.match(/^applications\/[^/]+$/) && method === "GET") {
      const id = path[1];
      const app = await storage.getApplication(db, id);
      if (!app) {
        return jsonResponse({ error: "Application not found" }, 404);
      }
      return jsonResponse(app);
    }

    // POST /api/admin/applications/:id/approve
    if (pathStr.match(/^applications\/[^/]+\/approve$/) && method === "POST") {
      const id = path[1];
      const body = await request.json() as { reason?: string };
      const reason = body.reason || "";

      if (!reason) {
        return jsonResponse({ error: "Reason is required" }, 400);
      }

      const app = await storage.updateApplicationStatus(db, id, "approved", session.adminId!, reason);
      if (!app) {
        return jsonResponse({ error: "Application not found" }, 404);
      }

      await logAction("application_approved", "electrician_application", app.id, reason, {
        applicantName: app.name,
        applicantEmail: app.email,
      });

      return jsonResponse(app);
    }

    // POST /api/admin/applications/:id/reject
    if (pathStr.match(/^applications\/[^/]+\/reject$/) && method === "POST") {
      const id = path[1];
      const body = await request.json() as { reason?: string };
      const reason = body.reason || "";

      if (!reason) {
        return jsonResponse({ error: "Reason is required" }, 400);
      }

      const app = await storage.updateApplicationStatus(db, id, "rejected", session.adminId!, reason);
      if (!app) {
        return jsonResponse({ error: "Application not found" }, 404);
      }

      await logAction("application_rejected", "electrician_application", app.id, reason, {
        applicantName: app.name,
        applicantEmail: app.email,
      });

      return jsonResponse(app);
    }

    // ==================== ELECTRICIANS ====================

    // GET /api/admin/electricians
    if (pathStr === "electricians" && method === "GET") {
      const status = url.searchParams.get("status") || undefined;
      const electricians = await storage.listElectricians(db, status);
      return jsonResponse(electricians);
    }

    // GET /api/admin/electricians/:id
    if (pathStr.match(/^electricians\/[^/]+$/) && method === "GET") {
      const id = path[1];
      const electrician = await storage.getElectrician(db, id);
      if (!electrician) {
        return jsonResponse({ error: "Electrician not found" }, 404);
      }
      return jsonResponse(electrician);
    }

    // POST /api/admin/electricians/:id/status
    if (pathStr.match(/^electricians\/[^/]+\/status$/) && method === "POST") {
      const id = path[1];
      const body = await request.json() as { status?: string; reason?: string };
      const { status, reason } = body;

      if (!status || !["active", "suspended", "inactive"].includes(status)) {
        return jsonResponse({ error: "Valid status is required (active, suspended, inactive)" }, 400);
      }
      if (!reason) {
        return jsonResponse({ error: "Reason is required" }, 400);
      }

      const electrician = await storage.updateElectricianStatus(db, id, status as "active" | "suspended" | "inactive");
      if (!electrician) {
        return jsonResponse({ error: "Electrician not found" }, 404);
      }

      await logAction(`electrician_status_${status}`, "electrician", electrician.id, reason, {
        electricianName: electrician.name,
        newStatus: status,
      });

      return jsonResponse(electrician);
    }

    // ==================== JOBS ====================

    // GET /api/admin/jobs
    if (pathStr === "jobs" && method === "GET") {
      const filters = {
        status: url.searchParams.get("status") || undefined,
        electricianId: url.searchParams.get("electricianId") || undefined,
        customerId: url.searchParams.get("customerId") || undefined,
      };
      const jobs = await storage.listJobs(db, filters);
      return jsonResponse(jobs);
    }

    // GET /api/admin/jobs/:id
    if (pathStr.match(/^jobs\/[^/]+$/) && method === "GET") {
      const id = path[1];
      const job = await storage.getJob(db, id);
      if (!job) {
        return jsonResponse({ error: "Job not found" }, 404);
      }
      return jsonResponse(job);
    }

    // POST /api/admin/jobs/:id/event
    if (pathStr.match(/^jobs\/[^/]+\/event$/) && method === "POST") {
      const id = path[1];
      const body = await request.json() as { status?: string; reason?: string; metadata?: Record<string, unknown> };
      const { status, reason, metadata } = body;

      const validStatuses = ["CREATED", "BROADCAST", "ACCEPTED", "EN_ROUTE", "ARRIVED", "IN_PROGRESS", "COMPLETED", "SETTLED", "CANCELLED"];
      if (!status || !validStatuses.includes(status)) {
        return jsonResponse({ error: `Valid status is required (${validStatuses.join(", ")})` }, 400);
      }
      if (!reason) {
        return jsonResponse({ error: "Reason is required" }, 400);
      }

      const job = await storage.addJobEvent(db, id, {
        status,
        actorType: "admin",
        actorId: session.adminId!,
        metadata: { ...metadata, adminReason: reason },
      });

      if (!job) {
        return jsonResponse({ error: "Job not found" }, 404);
      }

      await logAction(`job_status_${status}`, "job", job.id, reason, { newStatus: status });

      return jsonResponse(job);
    }

    // ==================== DISPUTES ====================

    // GET /api/admin/disputes
    if (pathStr === "disputes" && method === "GET") {
      const filters = {
        status: url.searchParams.get("status") || undefined,
        priority: url.searchParams.get("priority") || undefined,
      };
      const disputes = await storage.listDisputes(db, filters);
      return jsonResponse(disputes);
    }

    // GET /api/admin/disputes/:id
    if (pathStr.match(/^disputes\/[^/]+$/) && method === "GET") {
      const id = path[1];
      const dispute = await storage.getDispute(db, id);
      if (!dispute) {
        return jsonResponse({ error: "Dispute not found" }, 404);
      }
      return jsonResponse(dispute);
    }

    // PATCH /api/admin/disputes/:id
    if (pathStr.match(/^disputes\/[^/]+$/) && method === "PATCH") {
      const id = path[1];
      const body = await request.json() as {
        status?: string;
        priority?: string;
        resolution?: string;
        assignedTo?: string | null;
        reason?: string;
      };
      const { status, priority, resolution, assignedTo, reason } = body;

      if (!reason) {
        return jsonResponse({ error: "Reason is required" }, 400);
      }

      const updates: {
        status?: "open" | "investigating" | "resolved" | "escalated" | "closed";
        priority?: "low" | "medium" | "high" | "urgent";
        resolution?: string;
        assignedTo?: string | null;
      } = {};

      if (status && ["open", "investigating", "resolved", "escalated", "closed"].includes(status)) {
        updates.status = status as typeof updates.status;
      }
      if (priority && ["low", "medium", "high", "urgent"].includes(priority)) {
        updates.priority = priority as typeof updates.priority;
      }
      if (resolution !== undefined) updates.resolution = resolution;
      if (assignedTo !== undefined) updates.assignedTo = assignedTo;

      const dispute = await storage.updateDispute(db, id, updates);
      if (!dispute) {
        return jsonResponse({ error: "Dispute not found" }, 404);
      }

      await logAction("dispute_updated", "dispute", dispute.id, reason, updates);

      return jsonResponse(dispute);
    }

    // ==================== CUSTOMERS ====================

    // GET /api/admin/customers
    if (pathStr === "customers" && method === "GET") {
      const customers = await storage.listCustomers(db);
      return jsonResponse(customers);
    }

    // GET /api/admin/customers/:id
    if (pathStr.match(/^customers\/[^/]+$/) && method === "GET") {
      const id = path[1];
      const customer = await storage.getCustomer(db, id);
      if (!customer) {
        return jsonResponse({ error: "Customer not found" }, 404);
      }
      return jsonResponse(customer);
    }

    // POST /api/admin/customers/:id/adjust-balance
    if (pathStr.match(/^customers\/[^/]+\/adjust-balance$/) && method === "POST") {
      const id = path[1];
      const body = await request.json() as { amount?: number; reason?: string };
      const { amount, reason } = body;

      if (typeof amount !== "number") {
        return jsonResponse({ error: "Amount is required" }, 400);
      }
      if (!reason) {
        return jsonResponse({ error: "Reason is required" }, 400);
      }

      const customer = await storage.getCustomer(db, id);
      if (!customer) {
        return jsonResponse({ error: "Customer not found" }, 404);
      }

      const balanceBefore = customer.balance;
      const updated = await storage.updateCustomerBalance(db, id, amount);

      await storage.createBalanceTransaction(db, {
        entityType: "customer",
        entityId: id,
        type: amount >= 0 ? "credit" : "debit",
        amount,
        balanceBefore,
        balanceAfter: updated!.balance,
        reason,
        adminId: session.adminId!,
        jobId: null,
      });

      await logAction("balance_adjusted", "balance", id, reason, {
        customerName: customer.name,
        amount,
        balanceBefore,
        balanceAfter: updated!.balance,
      });

      return jsonResponse(updated);
    }

    // POST /api/admin/customers/:id/adjust-credits
    if (pathStr.match(/^customers\/[^/]+\/adjust-credits$/) && method === "POST") {
      const id = path[1];
      const body = await request.json() as { amount?: number; reason?: string };
      const { amount, reason } = body;

      if (typeof amount !== "number") {
        return jsonResponse({ error: "Amount is required" }, 400);
      }
      if (!reason) {
        return jsonResponse({ error: "Reason is required" }, 400);
      }

      const customer = await storage.getCustomer(db, id);
      if (!customer) {
        return jsonResponse({ error: "Customer not found" }, 404);
      }

      const creditsBefore = customer.credits;
      const updated = await storage.updateCustomerCredits(db, id, amount);

      await logAction("credits_adjusted", "credit", id, reason, {
        customerName: customer.name,
        amount,
        creditsBefore,
        creditsAfter: updated!.credits,
      });

      return jsonResponse(updated);
    }

    // ==================== TRANSACTIONS ====================

    // GET /api/admin/transactions
    if (pathStr === "transactions" && method === "GET") {
      const entityType = url.searchParams.get("entityType") || undefined;
      const entityId = url.searchParams.get("entityId") || undefined;
      const transactions = await storage.listBalanceTransactions(db, entityType, entityId);
      return jsonResponse(transactions);
    }

    // ==================== CONFIGS ====================

    // GET /api/admin/configs
    if (pathStr === "configs" && method === "GET") {
      const configs = await storage.listAllConfigs(db);
      return jsonResponse(configs);
    }

    // GET /api/admin/configs/:key
    if (pathStr.match(/^configs\/[^/]+$/) && method === "GET" && !pathStr.includes("/history")) {
      const key = path[1];
      const config = await storage.getConfig(db, key);
      if (!config) {
        return jsonResponse({ error: "Config not found" }, 404);
      }
      return jsonResponse(config);
    }

    // GET /api/admin/configs/:key/history
    if (pathStr.match(/^configs\/[^/]+\/history$/) && method === "GET") {
      const key = path[1];
      const history = await storage.listConfigHistory(db, key);
      return jsonResponse(history);
    }

    // PUT /api/admin/configs/:key
    if (pathStr.match(/^configs\/[^/]+$/) && method === "PUT") {
      if (!isSuperadmin(session)) {
        return jsonResponse({ error: "Forbidden: Superadmin required" }, 403);
      }

      const key = path[1];
      const body = await request.json() as { value?: unknown; reason?: string };
      const { value, reason } = body;

      if (value === undefined) {
        return jsonResponse({ error: "Value is required" }, 400);
      }
      if (!reason) {
        return jsonResponse({ error: "Reason is required" }, 400);
      }

      const config = await storage.setConfig(db, key, value, session.adminId!, reason);

      await logAction("config_updated", "config", key, reason, {
        key,
        value,
        version: config.version,
      });

      return jsonResponse(config);
    }

    // ==================== AUDIT LOGS ====================

    // GET /api/admin/audit-logs
    if (pathStr === "audit-logs" && method === "GET") {
      const filters = {
        entityType: url.searchParams.get("entityType") || undefined,
        entityId: url.searchParams.get("entityId") || undefined,
        adminId: url.searchParams.get("adminId") || undefined,
        fromDate: url.searchParams.get("fromDate") || undefined,
        toDate: url.searchParams.get("toDate") || undefined,
      };
      const logs = await storage.listAuditLogs(db, filters);
      return jsonResponse(logs);
    }

    // ==================== METRICS ====================

    // GET /api/admin/metrics
    if (pathStr === "metrics" && method === "GET") {
      const metrics = await storage.getMetrics(db);
      return jsonResponse(metrics);
    }

    // ==================== LEADS ====================

    // GET /api/admin/leads
    if (pathStr === "leads" && method === "GET") {
      const status = url.searchParams.get("status") || undefined;
      const leads = await storage.getMarketingLeads(db, status);
      return jsonResponse(leads);
    }

    // GET /api/admin/leads/:id
    if (pathStr.match(/^leads\/[^/]+$/) && method === "GET") {
      const id = path[1];
      const lead = await storage.getMarketingLead(db, id);
      if (!lead) {
        return jsonResponse({ error: "Lead not found" }, 404);
      }
      return jsonResponse(lead);
    }

    // PATCH /api/admin/leads/:id/status
    if (pathStr.match(/^leads\/[^/]+\/status$/) && method === "PATCH") {
      const id = path[1];
      const body = await request.json() as { status?: string; notes?: string };
      const { status, notes } = body;

      if (!status || !["pending", "contacted", "converted", "closed"].includes(status)) {
        return jsonResponse({ error: "Valid status is required (pending, contacted, converted, closed)" }, 400);
      }

      const lead = await storage.updateMarketingLeadStatus(db, id, status as "pending" | "contacted" | "converted" | "closed", notes);
      if (!lead) {
        return jsonResponse({ error: "Lead not found" }, 404);
      }

      await logAction(`lead_status_changed_to_${status}`, "customer", id, notes || "Status updated", {
        leadId: id,
        newStatus: status,
      });

      return jsonResponse(lead);
    }

    // ==================== ADMIN USERS ====================

    // GET /api/admin/admins
    if (pathStr === "admins" && method === "GET") {
      if (!isSuperadmin(session)) {
        return jsonResponse({ error: "Forbidden: Superadmin access required" }, 403);
      }

      const admins = await storage.listAdmins(db);
      return jsonResponse(admins.map(admin => ({
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        createdAt: admin.createdAt.toISOString(),
        lastLoginAt: admin.lastLoginAt?.toISOString() || null,
      })));
    }

    // POST /api/admin/admins
    if (pathStr === "admins" && method === "POST") {
      if (!isSuperadmin(session)) {
        return jsonResponse({ error: "Forbidden: Superadmin access required" }, 403);
      }

      const body = await request.json() as { email?: string; password?: string; name?: string; role?: string };
      const { email, password, name, role } = body;

      if (!email || !password || !name || !role) {
        return jsonResponse({ error: "Email, password, name, and role are required" }, 400);
      }

      if (!["superadmin", "operator"].includes(role)) {
        return jsonResponse({ error: "Role must be 'superadmin' or 'operator'" }, 400);
      }

      if (password.length < 6) {
        return jsonResponse({ error: "Password must be at least 6 characters" }, 400);
      }

      // Check if admin with email already exists
      const existing = await storage.getAdminByEmail(db, email);
      if (existing) {
        return jsonResponse({ error: "Admin with this email already exists" }, 400);
      }

      const admin = await storage.createAdmin(db, {
        email,
        password,
        name,
        role: role as "superadmin" | "operator",
      });

      await logAction("admin_created", "admin_user", admin.id, `Created admin user: ${email}`, {
        adminEmail: email,
        adminName: name,
        adminRole: role,
      });

      return jsonResponse({
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        createdAt: admin.createdAt.toISOString(),
      }, 201);
    }

    // PATCH /api/admin/admins/:id/password
    if (pathStr.match(/^admins\/[^/]+\/password$/) && method === "PATCH") {
      if (!isSuperadmin(session)) {
        return jsonResponse({ error: "Forbidden: Superadmin access required" }, 403);
      }

      const id = path[1];
      const body = await request.json() as { newPassword?: string };
      const { newPassword } = body;

      if (!newPassword) {
        return jsonResponse({ error: "New password is required" }, 400);
      }

      if (newPassword.length < 6) {
        return jsonResponse({ error: "Password must be at least 6 characters" }, 400);
      }

      const admin = await storage.getAdminById(db, id);
      if (!admin) {
        return jsonResponse({ error: "Admin not found" }, 404);
      }

      await storage.updateAdminPassword(db, id, newPassword);

      await logAction("admin_password_changed", "admin_user", id, `Password changed for admin: ${admin.email}`, {
        adminEmail: admin.email,
      });

      return jsonResponse({ success: true, message: "Password updated successfully" });
    }

    // ==================== 404 ====================

    return jsonResponse({ error: "Route not found" }, 404);

  } catch (error) {
    console.error("Error in admin API:", error);
    return jsonResponse({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    }, 500);
  }
}


