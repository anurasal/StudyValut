import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limits for PDF base64 handling
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy initialization for Gemini client
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// API Health
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    hasSupabaseUrl: Boolean(process.env.VITE_SUPABASE_URL),
  });
});

// AI FEATURE 1 — AUTOMATIC ORGANIZATION SUGGESTIONS
app.post("/api/gemini/suggest-organization", async (req, res) => {
  try {
    const { resourceName, resourceType, textSnippet, existingFolders, existingTags } = req.body;
    const ai = getGeminiClient();

    const prompt = `Analyze this student resource and suggest organization metadata.
Resource Name: "${resourceName}"
Resource Type: "${resourceType}"
Text Content/Snippet: "${(textSnippet || "").slice(0, 1000)}"

Existing Folders in Vault: ${JSON.stringify(existingFolders || [])}
Existing Tags in Vault: ${JSON.stringify(existingTags || [])}

Provide:
1. Suggested Tags (3 to 5 concise tags such as "DBMS", "Important", "Previous Year", "Exam Prep", "Revision", etc.). You can reuse existing tags or suggest new relevant study tags.
2. Suggested Folder (If it fits one of the existing folders, give that folder name or ID. If not, suggest a short, clear new folder name).

Respond strictly in JSON matching the schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedTags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 3-5 suggested tag names",
            },
            suggestedFolderName: {
              type: Type.STRING,
              description: "Suggested folder name for organizing this resource",
            },
          },
          required: ["suggestedTags", "suggestedFolderName"],
        },
      },
    });

    const jsonText = response.text ? response.text.trim() : "{}";
    const data = JSON.parse(jsonText);
    res.json({ success: true, suggestions: data });
  } catch (error: any) {
    console.error("Error in /api/gemini/suggest-organization:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate AI organization suggestions",
    });
  }
});

// AI FEATURE 2 — PDF SUMMARY
app.post("/api/gemini/summarize-pdf", async (req, res) => {
  try {
    const { pdfBase64, textContent, fileName } = req.body;
    const ai = getGeminiClient();

    let cleanBase64 = pdfBase64;
    if (cleanBase64 && cleanBase64.includes(",")) {
      cleanBase64 = cleanBase64.split(",")[1];
    }

    let contentsPayload: any[];

    if (cleanBase64 && cleanBase64.trim().length > 0) {
      contentsPayload = [
        {
          inlineData: {
            mimeType: "application/pdf",
            data: cleanBase64.trim(),
          },
        },
        {
          text: `Summarize this study PDF document ("${fileName || "Resource"}") for exam preparation.
Create a structured, highly readable summary focusing on:
1. Core Concepts & Big Picture
2. Key Definitions & Formulae (if applicable)
3. Crucial High-Yield Topics for Exams
4. Summary Checklist for Quick Revision

Format clearly using markdown headers and bullet points.`,
        },
      ];
    } else if (textContent && textContent.trim().length > 0) {
      contentsPayload = [
        `Summarize this study document text ("${fileName || "Resource"}") for exam preparation.
Content snippet:
${textContent.slice(0, 15000)}

Create a structured, highly readable summary focusing on:
1. Core Concepts & Big Picture
2. Key Definitions & Formulae (if applicable)
3. Crucial High-Yield Topics for Exams
4. Summary Checklist for Quick Revision

Format clearly using markdown headers and bullet points.`,
      ];
    } else {
      contentsPayload = [
        `Summarize key academic study concepts, exam revision notes, definitions, and high-yield topics for the study material titled "${fileName || "Study Material"}".
Create a structured, highly readable summary focusing on:
1. Core Concepts & Big Picture
2. Key Definitions & Formulae (if applicable)
3. Crucial High-Yield Topics for Exams
4. Summary Checklist for Quick Revision

Format clearly using markdown headers and bullet points.`,
      ];
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: contentsPayload,
      config: {
        systemInstruction: "You are an expert academic tutor helping students study efficiently for exams. Provide clear, well-structured, precise summaries.",
      },
    });

    res.json({ success: true, summary: response.text || "No summary could be generated." });
  } catch (error: any) {
    console.error("Error in /api/gemini/summarize-pdf:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate PDF summary",
    });
  }
});

// AI FEATURE 3 — ASK QUESTIONS ABOUT PDF
app.post("/api/gemini/qa-pdf", async (req, res) => {
  try {
    const { question, pdfBase64, textContent, fileName, history } = req.body;
    if (!question) {
      return res.status(400).json({ success: false, error: "Question is required." });
    }

    const ai = getGeminiClient();

    let cleanBase64 = pdfBase64;
    if (cleanBase64 && cleanBase64.includes(",")) {
      cleanBase64 = cleanBase64.split(",")[1];
    }

    const systemInstruction = `You are a strict, helpful academic AI assistant answering questions about a specific study resource ("${fileName || "Document"}").
If document content or text is provided, answer the student's question strictly using that content.
If full binary document content is omitted, answer the question accurately in an academic context for the topic "${fileName || "Document"}".`;

    let parts: any[] = [];

    if (cleanBase64 && cleanBase64.trim().length > 0) {
      parts.push({
        inlineData: {
          mimeType: "application/pdf",
          data: cleanBase64.trim(),
        },
      });
    } else if (textContent && textContent.trim().length > 0) {
      parts.push({
        text: `Document Content Snippet:\n${textContent.slice(0, 15000)}\n\n`,
      });
    }

    if (history && Array.isArray(history) && history.length > 0) {
      const formattedHistory = history
        .map((h: { role: string; text: string }) => `${h.role === "user" ? "Student" : "Assistant"}: ${h.text}`)
        .join("\n");
      parts.push({ text: `Previous Conversation:\n${formattedHistory}\n\n` });
    }

    parts.push({ text: `Student Question: ${question}` });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: { parts },
      config: {
        systemInstruction,
      },
    });

    res.json({ success: true, answer: response.text || "No response received." });
  } catch (error: any) {
    console.error("Error in /api/gemini/qa-pdf:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process question about PDF",
    });
  }
});

// API Error Handler
app.use("/api", (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("API error handler caught:", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "An internal server error occurred in API route.",
  });
});

// API 404 Fallback (prevents passing unhandled /api requests to Vite SPA HTML handler)
app.use("/api", (req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

async function startServer() {
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
    console.log(`[StudyVault] Server running on http://localhost:${PORT}`);
  });
}

startServer();
