/**
 * Cloudflare Pages Function for Marketing Routes
 * Handles /marketing/* API endpoints (contact form, electrician application)
 */

import { createDb, type Env } from "../_shared/db";
import { storage } from "../_shared/storage";

interface PagesContext {
  request: Request;
  env: Env;
  params: { path?: string[] };
}

export async function onRequest(context: PagesContext): Promise<Response> {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const path = params.path || [];
  const method = request.method;
  const pathStr = path.join("/");

  // CORS headers for API responses
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Handle preflight requests
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Initialize database connection
    const db = createDb(env);

    // Contact form submission
    if (pathStr === "contact" && method === "POST") {
      const body = await request.json() as {
        name?: string;
        phone?: string;
        email?: string;
        address?: string;
        description?: string;
      };
      
      const { name, phone, email, address, description } = body;

      // Validation
      if (!name || !phone || !address || !description) {
        return new Response(JSON.stringify({ error: "Please fill in all required fields" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const phoneRegex = /^\+?[0-9\s-]{8,15}$/;
      if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
        return new Response(JSON.stringify({ error: "Please enter a valid phone number" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return new Response(JSON.stringify({ error: "Please enter a valid email address" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const lead = await storage.createMarketingLead(db, {
        id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source: "marketing_site",
        status: "pending",
        customerName: name,
        customerPhone: phone,
        customerEmail: email || null,
        serviceAddress: address,
        issueDescription: description,
      });

      return new Response(JSON.stringify({
        success: true,
        message: "Your request has been submitted successfully. We will contact you soon.",
        leadId: lead.id,
      }), {
        status: 201,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Electrician application submission
    if (pathStr === "electrician-application" && method === "POST") {
      const body = await request.json() as {
        name?: string;
        email?: string;
        phone?: string;
        serviceArea?: string;
        yearsExperience?: string | number;
        message?: string;
      };
      
      const { name, email, phone, serviceArea, yearsExperience, message } = body;

      // Validation
      if (!name || !email || !phone || !serviceArea) {
        return new Response(JSON.stringify({ error: "Please fill in all required fields" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(JSON.stringify({ error: "Please enter a valid email address" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const phoneRegex = /^\+?[0-9\s-]{8,15}$/;
      if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
        return new Response(JSON.stringify({ error: "Please enter a valid phone number" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const application = await storage.createApplication(db, {
        name,
        email,
        phone,
        nationalId: "", // Will be collected during verification
        specializations: [], // Will be collected during verification
        yearsExperience: yearsExperience ? parseInt(String(yearsExperience)) : 0,
        certifications: [], // Will be collected during verification
      });

      // Log additional info (service area and message) - in production you might store this differently
      console.log(`Application ${application.id} - Service Area: ${serviceArea}${message ? `, Message: ${message}` : ''}`);

      return new Response(JSON.stringify({
        success: true,
        message: "Your application has been submitted successfully. We will contact you within 24 hours.",
        applicationId: application.id,
      }), {
        status: 201,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get leads (for admin use - might want to protect this later)
    if (pathStr === "leads" && method === "GET") {
      const status = url.searchParams.get("status") || undefined;
      const leads = await storage.getMarketingLeads(db, status);
      return new Response(JSON.stringify(leads), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // 404 for unhandled routes
    return new Response(JSON.stringify({ error: "Route not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error) {
    console.error("Error in marketing API:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}



