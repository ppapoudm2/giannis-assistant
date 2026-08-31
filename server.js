import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import { search } from 'duckduckgo-search';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json());
app.use(express.static(__dirname));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages, location } = req.body;

        let locationString = "Άγνωστη τοποθεσία";
        if (location && location.lat && location.lon) {
            locationString = `Γεωγραφικό πλάτος: ${location.lat}, Μήκος: ${location.lon}`;
        }

        // Παίρνουμε το τελευταίο μήνυμα του χρήστη για να δούμε αν ζητάει αναζήτηση
        const lastUserMessage = messages[messages.length - 1]?.content || "";
        
        let webSearchResults = "";
        // Αν ο χρήστης ζητήσει κάτι που μοιάζει με αναζήτηση ή ερώτηση επικαιρότητας
        if (lastUserMessage.length > 2) {
            try {
                const searchResults = await search(lastUserMessage, {
                    safesearch: 'moderate',
                    locale: 'el-GR',
                    limit: 3
                });
                
                if (searchResults && searchResults.length > 0) {
                    webSearchResults = "Αποτελέσματα αναζήτησης στο internet:\n" + 
                        searchResults.map(r => `- ${r.title}: ${r.snippet} (${r.link})`).join("\n");
                }
            } catch (searchError) {
                console.error("Σφάλμα κατά την αναζήτηση web:", searchError);
            }
        }

        const systemPrompt = {
            role: "system",
            content: `Εσύ είσαι ο Γιάννης, ένας προσωπικός φωνητικός βοηθός. 
Τρέχουσα τοποθεσία χρήστη: ${locationString}. 
Τρέχουσα ημερομηνία και ώρα: ${new Date().toLocaleString('el-GR', { timeZone: 'Europe/Athens' })}.
${webSearchResults}
Να απαντάς σύντομα, άμεσα και φυσικά στα ελληνικά, σαν να μιλάς σε φωνητική συνομιλία. Αν υπάρχουν αποτελέσματα αναζήτησης, χρησιμοποίησέ τα για να ενημερώσεις τον χρήστη.`
        };

        const fullMessages = [systemPrompt, ...messages];

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: fullMessages,
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
