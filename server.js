import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const __filename = fileURLTPath(import.meta.url) || import.meta.url;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

        const lastUserMessage = messages[messages.length - 1]?.content || "";
        
        let webSearchResults = "";
        if (lastUserMessage.length > 2) {
            try {
                const encodedQuery = encodeURIComponent(lastUserMessage);
                const response = await fetch(`https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`);
                const data = await response.json();
                
                let snippets = [];
                if (data.AbstractText) {
                    snippets.push(data.AbstractText);
                }
                if (data.RelatedTopics && data.RelatedTopics.length > 0) {
                    data.RelatedTopics.slice(0, 3).forEach(topic => {
                        if (topic.Text) snippets.push(topic.Text);
                    });
                }

                if (snippets.length > 0) {
                    webSearchResults = "Σχετικές πληροφορίες από το internet:\n" + snippets.join("\n");
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
Να απαντάς σύντομα, άμεσα και φυσικά στα ελληνικά, σαν να μιλάς σε φωνητική συνομιλία. Αν υπάρχουν πληροφορίες από το internet παραπάνω, χρησιμοποίησέ τις για να απαντήσεις σωστά.`
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
