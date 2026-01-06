/**
 * Shared Admin Service Layer
 * Contains business logic that can be used by both Express routes and Workers Functions
 */

import { adminStorage } from "../admin-storage";
import type {
  AdminUser,
  ElectricianApplication,
  Electrician,
  Job,
  Dispute,
  Customer,
  BalanceTransaction,
  Config,
  AuditLog,
  TrustMetrics,
  MarketingLead,
} from "@shared/admin-types";
import { z } from "zod";

// Session interface (shared between Express and Workers)
export interface SessionData {
  adminId?: string;
  adminEmail?: string;
  adminRole?: string;
}

// Auth Service
export class AuthService {
  static async login(email: string, password: string, ipAddress?: string | null): Promise<{
    success: boolean;
    admin?: AdminUser;
    error?: string;
  }> {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(1),
    });

    const result = schema.safeParse({ email, password });
    if (!result.success) {
      return { success: false, error: "Invalid credentials format" };
    }

    const admin = await adminStorage.getAdminByEmail(email);
    if (!admin) {
      await adminStorage.createAuditLog({
        adminId: "unknown",
        adminEmail: email,
        action: "login_failed",
        entityType: "auth",
        entityId: null,
        reason: "Invalid credentials",
        ipAddress: ipAddress || null,
      });
      return { success: false, error: "Invalid credentials" };
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
        ipAddress: ipAddress || null,
      });
      return { success: false, error: "Invalid credentials" };
    }

    await adminStorage.updateAdminLastLogin(admin.id);
    await adminStorage.createAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "login_success",
      entityType: "auth",
      entityId: admin.id,
      reason: "Admin logged in successfully",
      ipAddress: ipAddress || null,
    });

    return { success: true, admin };
  }

  static async getCurrentAdmin(session: SessionData): Promise<AdminUser | null> {
    if (!session.adminId) return null;
    const admin = await adminStorage.getAdminById(session.adminId);
    return admin || null;
  }

  static requireAuth(session: SessionData): { authorized: boolean; error?: string } {
    if (!session.adminId) {
      return { authorized: false, error: "Unauthorized" };
    }
    return { authorized: true };
  }

  static requireSuperadmin(session: SessionData): { authorized: boolean; error?: string } {
    if (session.adminRole !== "superadmin") {
      return { authorized: false, error: "Forbidden: Superadmin required" };
    }
    return { authorized: true };
  }
}

// Applications Service
export class ApplicationsService {
  static async list(status?: string): Promise<ElectricianApplication[]> {
    return adminStorage.listApplications(status);
  }

  static async get(id: string): Promise<ElectricianApplication | null> {
    return (await adminStorage.getApplication(id)) || null;
  }

  static async approve(
    id: string,
    reviewedBy: string,
    reason: string,
    session: SessionData,
    ipAddress?: string | null
  ): Promise<{ success: boolean; application?: ElectricianApplication; error?: string }> {
    const app = await adminStorage.updateApplicationStatus(id, "approved", reviewedBy, reason);
    if (!app) {
      return { success: false, error: "Application not found" };
    }

    await adminStorage.createAuditLog({
      adminId: session.adminId!,
      adminEmail: session.adminEmail!,
      action: "application_approved",
      entityType: "electrician_application",
      entityId: app.id,
      reason,
      details: { applicantName: app.name, applicantEmail: app.email },
      ipAddress: ipAddress || null,
    });

    return { success: true, application: app };
  }

  static async reject(
    id: string,
    reviewedBy: string,
    reason: string,
    session: SessionData,
    ipAddress?: string | null
  ): Promise<{ success: boolean; application?: ElectricianApplication; error?: string }> {
    const app = await adminStorage.updateApplicationStatus(id, "rejected", reviewedBy, reason);
    if (!app) {
      return { success: false, error: "Application not found" };
    }

    await adminStorage.createAuditLog({
      adminId: session.adminId!,
      adminEmail: session.adminEmail!,
      action: "application_rejected",
      entityType: "electrician_application",
      entityId: app.id,
      reason,
      details: { applicantName: app.name, applicantEmail: app.email },
      ipAddress: ipAddress || null,
    });

    return { success: true, application: app };
  }
}

// Marketing Service
export class MarketingService {
  static async createLead(data: {
    name: string;
    phone: string;
    email?: string | null;
    address: string;
    description: string;
  }): Promise<{ success: boolean; lead?: MarketingLead; error?: string }> {
    // Validation
    if (!data.name || !data.phone || !data.address || !data.description) {
      return { success: false, error: "Please fill in all required fields" };
    }

    const phoneRegex = /^\+?[0-9\s-]{8,15}$/;
    if (!phoneRegex.test(data.phone.replace(/\s/g, ""))) {
      return { success: false, error: "Please enter a valid phone number" };
    }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return { success: false, error: "Please enter a valid email address" };
    }

    try {
      const lead = await adminStorage.createMarketingLead({
        id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source: "marketing_site",
        status: "pending",
        customerName: data.name,
        customerPhone: data.phone,
        customerEmail: data.email || null,
        serviceAddress: data.address,
        issueDescription: data.description,
      });

      return { success: true, lead };
    } catch (error) {
      console.error("Error creating marketing lead:", error);
      return { success: false, error: "Unable to submit your request. Please try again later." };
    }
  }

  static async createApplication(data: {
    name: string;
    email: string;
    phone: string;
    serviceArea: string;
    yearsExperience?: number;
    message?: string;
  }): Promise<{ success: boolean; application?: ElectricianApplication; error?: string }> {
    // Validation
    if (!data.name || !data.email || !data.phone || !data.serviceArea) {
      return { success: false, error: "Please fill in all required fields" };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { success: false, error: "Please enter a valid email address" };
    }

    const phoneRegex = /^\+?[0-9\s-]{8,15}$/;
    if (!phoneRegex.test(data.phone.replace(/\s/g, ""))) {
      return { success: false, error: "Please enter a valid phone number" };
    }

    try {
      const application = await adminStorage.createApplication({
        name: data.name,
        email: data.email,
        phone: data.phone,
        nationalId: "", // Will be collected during verification
        specializations: [], // Will be collected during verification
        yearsExperience: data.yearsExperience || 0,
        certifications: [], // Will be collected during verification
      });

      // Log additional info
      if (data.message || data.serviceArea) {
        const notes = `Service Area: ${data.serviceArea}${data.message ? `\n\nMessage: ${data.message}` : ''}`;
        console.log(`Application ${application.id} - Additional info: ${notes}`);
      }

      return { success: true, application };
    } catch (error) {
      console.error("Error creating electrician application:", error);
      return { success: false, error: "Unable to submit your application. Please try again later." };
    }
  }
}

// Export all services
export const services = {
  auth: AuthService,
  applications: ApplicationsService,
  marketing: MarketingService,
};




