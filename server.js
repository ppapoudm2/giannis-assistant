import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Αρχικοποίηση του OpenAI με το κλειδί σου
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json());

// Σερβίρει τα αρχεία του frontend
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint για τη συνομιλία με δυνατότητα web search
app.post('/api/chat', async (req, res) => {
    try {
        const { messages, location } = req.body;

        let locationString = "Άγνωστη τοποθεσία";
        if (location && location.lat && location.lon) {
            locationString = `Γεωγραφικό πλάτος: ${location.lat}, Μήκος: ${location.lon}`;
        }

        const systemPrompt = {
            role: "system",
            content: `Εσύ είσαι ο Γιάννης, ένας προσωπικός φωνητικός βοηθός. 
Τρέχουσα τοποθεσία χρήστη: ${locationString}. 
Τρέχουσα ημερομηνία και ώρα: ${new Date().toLocaleString('el-GR', { timeZone: 'Europe/Athens' })}.
Να απαντάς σύντομα, άμεσα και φυσικά στα ελληνικά, σαν να μιλάς σε φωνητική συνομιλία.`
        };

        const fullMessages = [systemPrompt, ...messages];

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: fullMessages,
            tools: [{ type: "web_search" }],
            temperature: 0.7,
        });

        const reply = completion.choices[0].message.content;
        const usage = completion.usage || { total_tokens: 0 };

        res.json({
            reply: reply,
            usage: usage
        });

    } catch (error) {
        console.error("Σφάλμα στον server:", error);
        res.status(500).json({ reply: "Συνέβη κάποιο σφάλμα σύνδεσης με τον διακομιστή.", usage: { total_tokens: 0 } });
    }
});

app.listen(port, () => {
    console.log(`Ο server τρέχει στη θύρα ${port}`);
});
