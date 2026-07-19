import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Safe lazy initializer for Gemini Client
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined in environment variables. Please provide it via the Secrets panel in AI Studio.");
      }
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  }

  // API endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", startup: "S-CODERS" });
  });

  // Chat agent endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      let client;
      try {
        client = getGeminiClient();
      } catch (keyErr: any) {
        return res.status(400).json({ 
          error: "API Key missing. S-CODERS AI Agent is in offline demonstration mode. Please configure your GEMINI_API_KEY in Secrets to activate live consulting." 
        });
      }

      const systemInstruction = `You are the S-CODERS AI Agent, an interactive technology consultant representing S-CODERS (Bharath Tech Developers), a premier software and AI startup based in Bengaluru, Karnataka.

S-CODERS specialize in AI Agent Development, Mobile App Dev (React Native), Website Dev (Next.js, React), Custom Software, UI/UX design, and Technical Workshops.

Team Members:
- Suhas Gowda: Founder & Chief AI Architect. Expert in generative AI and n8n automations.
- Prathiksha R: Co-Founder & Head of UI/UX. Expert in gorgeous interfaces and Framer Motion.
- Manoj Kumar: Lead Full-Stack Developer. Expert in backend pipelines, PostgreSQL, and Firebase.
- Aishwarya Shenoy: AI Automation & Workshop Lead. Expert in n8n integration and developer training.

Key achievements:
- Selected into GOAT Founder Club and NASSCOM Startups ecosystem.
- Hosted premier workshops at Microsoft Reactor Bangalore (150+ attendees), RV College of Engineering (250+ students), and eChai Ventures.
- Shipped 15+ high-fidelity customized projects.

Your objective is to:
1. Greet visitors enthusiastically and professionally.
2. Pitch our services (AI Agents, Mobile Apps, Custom Web/SaaS, UI/UX, workshops).
3. Help visitors brainstorm their project requirements.
4. Encourage them to fill out the service request/enquiry form on our website or get in touch.
5. Answer questions about S-CODERS, Bengaluru startup events, or tech stack.

Keep your responses professional, friendly, concise (within 2-3 paragraphs or structured bullet points), and elegant. Use Markdown for formatting.`;

      // Format history into contents structure
      const contents = [];
      if (history && Array.isArray(history)) {
        for (const msg of history) {
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          });
        }
      }

      // Add the latest message
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ response: response.text });
    } catch (error: any) {
      console.error("Gemini Chat Error:", error);
      res.status(500).json({ error: error.message || "An error occurred during response generation." });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Server start error:", err);
});
