/**
 * Cloudflare Workers Function for Marketing Routes
 * Handles /marketing/* routes
 */

import { MarketingService } from "../../server/services/admin-service";

export async function onRequest(context: {
  request: Request;
  env: { DATABASE_URL: string };
  params: { path?: string[] };
}): Promise<Response> {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const path = params.path || [];
  const method = request.method;
  const pathStr = path.join("/");

  try {
    // Serve CSS
    if (pathStr === "styles.css" && method === "GET") {
      // CSS will be served by Cloudflare Pages as static file
      // This route is kept for compatibility but should be handled by Pages
      return new Response("/* CSS served by Pages */", {
        status: 404,
        headers: { "Content-Type": "text/css" },
      });
    }

    // Marketing pages (HTML) will be served by Cloudflare Pages
    // These routes are for API endpoints only

    // Contact form submission
    if (pathStr === "contact" && method === "POST") {
      const body = await request.json();
      const { name, phone, email, address, description } = body;

      const result = await MarketingService.createLead({
        name,
        phone,
        email,
        address,
        description,
      });

      if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: "Your request has been submitted successfully. We will contact you soon.",
        leadId: result.lead?.id,
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Electrician application
    if (pathStr === "electrician-application" && method === "POST") {
      const body = await request.json();
      const { name, email, phone, serviceArea, yearsExperience, message } = body;

      const result = await MarketingService.createApplication({
        name,
        email,
        phone,
        serviceArea,
        yearsExperience: yearsExperience ? parseInt(yearsExperience) : undefined,
        message,
      });

      if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: "Your application has been submitted successfully. We will contact you within 24 hours.",
        applicationId: result.application?.id,
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Leads list (for admin, but keeping here for now)
    if (pathStr === "leads" && method === "GET") {
      const { adminStorage } = await import("../../server/admin-storage");
      const status = url.searchParams.get("status") || undefined;
      const leads = await adminStorage.getMarketingLeads(status);
      return new Response(JSON.stringify(leads), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // 404 for unhandled routes
    return new Response(JSON.stringify({ error: "Route not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in marketing API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

