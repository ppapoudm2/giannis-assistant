import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Αυξημένο όριο για αποστολή εικόνων base64

app.use(express.static(__dirname));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, location, image } = req.body;

    const currentTime = new Date().toLocaleString('el-GR', { timeZone: 'Europe/Athens' });
    let systemContext = `Είσαι ο 'Γιάννης', ένας φιλικός φωνητικός βοηθός. Απάντα πολύ σύντομα (1-2 προτάσεις το πολύ) στα ελληνικά. Τρέχουσα ώρα: ${currentTime}.`;

    if (location && location.lat && location.lon) {
      systemContext += ` Το γεωγραφικό πλάτος/μήκος του χρήστη είναι (${location.lat}, ${location.lon}). Χρησιμοποίησέ το αν σε ρωτήσει πού βρίσκεται ή για τον καιρό.`;
    }

    let contents = [];
    if (image) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      contents = [
        {
          inlineData: {
            data: base64Data,
            mimeType: 'image/jpeg'
          }
        },
        prompt || "Τι βλέπεις;"
      ];
    } else {
      contents = prompt;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemContext
      }
    });

    let replyText = "";
    if (response && response.text) {
      replyText = response.text;
    } else if (response && response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
      replyText = response.candidates[0].content.parts[0].text;
    } else {
      replyText = "Δεν μπορώ να επεξεργαστώ την απάντηση αυτή τη στιγμή.";
    }

    res.json({ text: replyText });
  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: 'Πρόβλημα επικοινωνίας με το Gemini API' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});