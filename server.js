import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, location } = req.body;

    const currentTime = new Date().toLocaleString('el-GR', { timeZone: 'Europe/Athens' });
    let systemContext = `Είσαι ο 'Γιάννης', ένας φιλικός φωνητικός βοηθός. Απάντα σύντομα (1-2 προτάσεις) στα ελληνικά. Τρέχουσα ώρα: ${currentTime}.`;

    if (location && location.lat && location.lon) {
      systemContext += ` Το γεωγραφικό πλάτος/μήκος του χρήστη είναι (${location.lat}, ${location.lon}).`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemContext },
        { role: "user", content: message }
      ],
      max_tokens: 150
    });

    res.json({
      reply: response.choices[0].message.content,
      usage: response.usage
    });
  } catch (error) {
    console.error("OpenAI Error:", error);
    res.status(500).json({ error: 'Σφάλμα επικοινωνίας' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
