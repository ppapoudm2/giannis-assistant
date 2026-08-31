import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// Initialize GoogleGenAI
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("CRITICAL ERROR: GEMINI_API_KEY environment variable is missing!");
}
const ai = new GoogleGenAI({ apiKey: apiKey });

app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, location, image } = req.body;

    const currentTime = new Date().toLocaleString('el-GR', { timeZone: 'Europe/Athens' });
    let systemContext = `Είσαι ο 'Γιάννης', ένας φιλικός φωνητικός βοηθός. Απάντα σύντομα (1-2 προτάσεις) στα ελληνικά. Τρέχουσα ώρα: ${currentTime}.`;

    if (location && location.lat && location.lon) {
      systemContext += ` Το γεωγραφικό πλάτος/μήκος του χρήστη είναι (${location.lat}, ${location.lon}).`;
    }

    let contentsArray = [];
    if (image) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      contentsArray.push({
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg'
        }
      });
    }
    
    if (prompt && prompt.trim() !== '') {
      contentsArray.push(prompt);
    } else {
      contentsArray.push("Γεια σου Γιάννη!");
    }

    // Call Gemini 2.5 Flash model
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contentsArray,
      config: {
        systemInstruction: systemContext
      }
    });

    const replyText = response.text || "Δεν κατάλαβα, μπορείς να το επαναλάβεις;";
    res.json({ text: replyText });
  } catch (error) {
    console.error("Gemini API Error Detail:", error);
    res.status(500).json({ error: 'Πρόβλημα επικοινωνίας με το Gemini API', details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
