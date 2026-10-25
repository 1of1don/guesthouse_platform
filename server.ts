import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: [
    path.join(__dirname, '.env.local'),
    path.join(__dirname, '.env'),
  ],
});

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Multi-turn Chat API endpoint with strict role & scope guardrails
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], model = 'gemini-3.8-flash' } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message content is required.' });
    }
    if (!ai) {
      return res.status(503).json({
        error: 'Chat is not configured. Set GEMINI_API_KEY in .env.local and restart the server.',
      });
    }

    // Supported models per user prompt specifications:
    // - gemini-4-argon: for particularly complex tasks
    // - gemini-3.8-flash: for general tasks
    // - gemini-3.1-flash-lite: for tasks that should happen fast
    const allowedModels = ['gemini-4-argon', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    const selectedModel = allowedModels.includes(model) ? model : 'gemini-3.8-flash';

    const systemInstruction = `You are the MiCasa SuCasa Hospitality Assistant, an intelligent and polite AI concierge and administrative assistant for the MiCasa SuCasa boutique guesthouse platform in Botswana.

YOUR ROLE & IN-SCOPE RESPONSIBILITIES:
1. Provide accurate information and guidance about Botswana travel, destinations, and lodging (e.g. Gaborone, Maun, Kasane, Palapye, Francistown, Ghanzi, Okavango Delta, Chobe National Park).
2. Answer questions about registered boutique guesthouses, amenities, room prices (in Botswana Pula BWP and supported currencies), and travel planning.
3. Assist administrators with understanding portal workflows (how to register a guesthouse via the Add Guesthouse page, how to configure currency settings, how admin team access works).
4. Maintain a refined, welcoming, and professional hospitality tone.

CRITICAL OUT-OF-SCOPE BOUNDARIES & SAFETY RULES:
You must strictly enforce scope boundaries. If anything requested CANNOT be performed by the chatbot, you MUST clearly, politely, and proactively inform the user that it is out of scope:
- Direct database mutations: You CANNOT directly create, edit, or delete database records through conversation. You must let the user know and direct them to use the "Add Guesthouse" or "Edit" buttons on the admin portal.
- Financial transactions: You CANNOT process credit cards, collect payments, or execute bank transfers. Direct the user to contact the property or finance team directly.
- Direct booking confirmations: You cannot directly issue binding room keys or confirm room reservations directly in chat; direct the user to the contact phone/email on each guesthouse listing.
- Non-hospitality requests: If a request is completely unrelated to Botswana travel, lodging, or managing the MiCasa SuCasa platform (such as medical advice, global airline tickets, or arbitrary code execution), politely inform the user that it is outside your scope and redirect them to platform features.
- When appropriate, recommend contacting the platform administrator Ontiretse Bagwasi at onty@micasa.com.`;

    // Map conversation history into @google/genai contents format
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [
      ...history.map((msg: any) => ({
        role: msg.role === 'model' || msg.role === 'assistant' ? ('model' as const) : ('user' as const),
        parts: [{ text: String(msg.text || msg.content || '') }],
      })),
      {
        role: 'user' as const,
        parts: [{ text: message }],
      },
    ];

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || 'I apologize, but I could not generate a response. Please try again.';

    res.json({
      reply,
      model: selectedModel,
    });
  } catch (error: any) {
    console.error('Gemini chat endpoint error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to communicate with the Gemini AI model.',
    });
  }
});

// Start Express server and mount Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MiCasa SuCasa server running on port ${PORT}`);
  });
}

startServer();
