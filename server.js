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

const apiKey = process.env.GEMINI_API_KEY;
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

    contentsArray.push({ text: prompt && prompt.trim() !== '' ? prompt : "Γεια σου Γιάννη!" });

    // Υποστηριζόμενο μοντέλο για το @google/genai SDK
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contentsArray,
      config: {
        systemInstruction: {
          parts: [{ text: systemContext }]
        }
      }
    });

    const replyText = response.text || "Δεν κατάλαβα, μπορείς να το επαναλάβεις;";
    res.json({ text: replyText });
  } catch (error) {
    console.error("Gemini API Error Detail:", error);
    
    if (error.status === 429) {
      return res.json({ text: "Γιάννη, στέλνεις πολλά αιτήματα μαζί. Περίμενε μισό λεπτό και ξαναπές το!" });
    }
    if (error.status === 503) {
      return res.json({ text: "Το σύστημα είναι λίγο φορτωμένο αυτή τη στιγμή, δοκίμασε ξανά σε λίγο." });
    }

    res.status(500).json({ error: 'Πρόβλημα επικοινωνίας με το Gemini API', details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
