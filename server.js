import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Σερβίρει το index.html
app.use(express.static(__dirname));

// Διαβάζει το API Key με ασφάλεια από τις μεταβλητές περιβάλλοντος
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/chat', async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "Είσαι ο 'Γιάννης', ένας φιλικός φωνητικός βοηθός. Απάντα πολύ σύντομα (1-2 προτάσεις το πολύ) στα ελληνικά, ώστε η απάντησή σου να διαβάζεται εύκολα φωνητικά."
      }
    });

    res.json({ text: response.text });
  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: 'Πρόβλημα επικοινωνίας με το Gemini API' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
