/**
 * Cloudflare Workers Function for Admin API Routes
 * Handles all /api/admin/* routes
 * 
 * This uses the shared service layer for business logic.
 * For local development, Express routes in server/admin-routes.ts are used.
 */

import { AuthService, ApplicationsService, type SessionData } from "../../../server/services/admin-service";
import { adminStorage } from "../../../server/admin-storage";

// TODO: Implement encrypted cookie session management
// For now, this is a placeholder structure
function getSessionFromCookie(cookieHeader: string | null): SessionData {
  // TODO: Decrypt and parse session cookie
  // Use Cloudflare's Workers crypto API or a library like @cloudflare/workers-types
  return {};
}

function setSessionCookie(session: SessionData): string {
  // TODO: Encrypt and set session cookie
  // Format: "session=encrypted_value; HttpOnly; Secure; SameSite=Lax; Max-Age=86400"
  return "";
}

export async function onRequest(context: {
  request: Request;
  env: { DATABASE_URL: string; SESSION_SECRET: string };
  params: { path?: string[] };
}): Promise<Response> {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const path = params.path || [];
  const method = request.method;
  const pathStr = path.join("/");

  // Get session from cookie
  const cookieHeader = request.headers.get("Cookie");
  const session = getSessionFromCookie(cookieHeader);

  // Get IP address
  const ipAddress = request.headers.get("CF-Connecting-IP") || 
                    request.headers.get("X-Forwarded-For")?.split(",")[0] || 
                    null;

  try {
    // Auth routes
    if (pathStr === "auth/login" && method === "POST") {
      const body = await request.json();
      const result = await AuthService.login(body.email, body.password, ipAddress);

      if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      const newSession: SessionData = {
        adminId: result.admin!.id,
        adminEmail: result.admin!.email,
        adminRole: result.admin!.role,
      };

      const cookie = setSessionCookie(newSession);
      return new Response(JSON.stringify({
        id: result.admin!.id,
        email: result.admin!.email,
        name: result.admin!.name,
        role: result.admin!.role,
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": cookie,
        },
      });
    }

    if (pathStr === "auth/logout" && method === "POST") {
      const authCheck = AuthService.requireAuth(session);
      if (!authCheck.authorized) {
        return new Response(JSON.stringify({ error: authCheck.error }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      await adminStorage.createAuditLog({
        adminId: session.adminId!,
        adminEmail: session.adminEmail!,
        action: "logout",
        entityType: "auth",
        entityId: session.adminId!,
        reason: "Admin logged out",
        ipAddress,
      });

      const cookie = setSessionCookie({});
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": cookie,
        },
      });
    }

    if (pathStr === "auth/me" && method === "GET") {
      const authCheck = AuthService.requireAuth(session);
      if (!authCheck.authorized) {
        return new Response(JSON.stringify({ error: authCheck.error }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      const admin = await AuthService.getCurrentAdmin(session);
      if (!admin) {
        return new Response(JSON.stringify({ error: "Admin not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // All other routes require authentication
    const authCheck = AuthService.requireAuth(session);
    if (!authCheck.authorized) {
      return new Response(JSON.stringify({ error: authCheck.error }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Applications routes
    if (pathStr === "applications" && method === "GET") {
      const status = url.searchParams.get("status") || undefined;
      const apps = await ApplicationsService.list(status);
      return new Response(JSON.stringify(apps), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (pathStr.startsWith("applications/") && method === "GET") {
      const id = path[1];
      const app = await ApplicationsService.get(id);
      if (!app) {
        return new Response(JSON.stringify({ error: "Application not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(app), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (pathStr.startsWith("applications/") && path[2] === "approve" && method === "POST") {
      const id = path[1];
      const body = await request.json();
      const reason = body.reason || "";
      const result = await ApplicationsService.approve(id, session.adminId!, reason, session, ipAddress);
      if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: result.error === "Application not found" ? 404 : 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(result.application), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (pathStr.startsWith("applications/") && path[2] === "reject" && method === "POST") {
      const id = path[1];
      const body = await request.json();
      const reason = body.reason || "";
      const result = await ApplicationsService.reject(id, session.adminId!, reason, session, ipAddress);
      if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: result.error === "Application not found" ? 404 : 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(result.application), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // TODO: Add remaining routes (electricians, jobs, disputes, customers, transactions, configs, audit-logs, metrics, leads)
    // For now, these will be handled by Express in local development
    // They can be added incrementally to this Workers Function

    // 404 for unhandled routes
    return new Response(JSON.stringify({ error: "Route not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in admin API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

