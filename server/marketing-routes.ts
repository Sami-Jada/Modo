import { Router, Request, Response } from "express";
import * as fs from "fs";
import * as path from "path";
import { adminStorage } from "./admin-storage";

const router = Router();

function serveMarketingPage(templateName: string, req: Request, res: Response) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "marketing",
    templateName
  );

  if (!fs.existsSync(templatePath)) {
    return res.status(404).send("Page not found");
  }

  const html = fs.readFileSync(templatePath, "utf-8");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}

router.get("/styles.css", (req: Request, res: Response) => {
  const cssPath = path.resolve(process.cwd(), "server", "public", "marketing.css");
  if (fs.existsSync(cssPath)) {
    res.setHeader("Content-Type", "text/css");
    res.sendFile(cssPath);
  } else {
    res.status(404).send("/* CSS not found */");
  }
});

router.get("/", (req: Request, res: Response) => {
  serveMarketingPage("home.html", req, res);
});

router.get("/what-we-do", (req: Request, res: Response) => {
  serveMarketingPage("what-we-do.html", req, res);
});

router.post("/contact", async (req: Request, res: Response) => {
  try {
    const { name, phone, email, address, description } = req.body;

    if (!name || !phone || !address || !description) {
      return res.status(400).json({ error: "Please fill in all required fields" });
    }

    const phoneRegex = /^\+?[0-9\s-]{8,15}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
      return res.status(400).json({ error: "Please enter a valid phone number" });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }

    const lead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: "marketing_site" as const,
      status: "pending" as const,
      customerName: name,
      customerPhone: phone,
      customerEmail: email || null,
      serviceAddress: address,
      issueDescription: description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adminStorage.createMarketingLead(lead);

    console.log(`New marketing lead created: ${lead.id}`);

    res.status(201).json({ 
      success: true, 
      message: "Your request has been submitted successfully. We will contact you soon.",
      leadId: lead.id 
    });
  } catch (error) {
    console.error("Error creating marketing lead:", error);
    res.status(500).json({ error: "Unable to submit your request. Please try again later." });
  }
});

router.get("/leads", async (req: Request, res: Response) => {
  try {
    const leads = await adminStorage.getMarketingLeads();
    res.json(leads);
  } catch (error) {
    console.error("Error fetching marketing leads:", error);
    res.status(500).json({ error: "Unable to fetch leads" });
  }
});

export default router;
