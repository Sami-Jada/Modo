import { Router, Request, Response } from "express";
import * as fs from "fs";
import * as path from "path";
import { MarketingService } from "./services/admin-service";
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

router.get("/become-electrician", (req: Request, res: Response) => {
  serveMarketingPage("become-electrician.html", req, res);
});

router.post("/contact", async (req: Request, res: Response) => {
  try {
    const { name, phone, email, address, description } = req.body;

    const result = await MarketingService.createLead({
      name,
      phone,
      email,
      address,
      description,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json({ 
      success: true, 
      message: "Your request has been submitted successfully. We will contact you soon.",
      leadId: result.lead?.id 
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

router.post("/electrician-application", async (req: Request, res: Response) => {
  try {
    const { name, email, phone, serviceArea, yearsExperience, message } = req.body;

    const result = await MarketingService.createApplication({
      name,
      email,
      phone,
      serviceArea,
      yearsExperience: yearsExperience ? parseInt(yearsExperience) : undefined,
      message,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json({ 
      success: true, 
      message: "Your application has been submitted successfully. We will contact you within 24 hours.",
      applicationId: result.application?.id 
    });
  } catch (error) {
    console.error("Error creating electrician application:", error);
    res.status(500).json({ error: "Unable to submit your application. Please try again later." });
  }
});

export default router;
