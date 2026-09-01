import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static('.')); // Εξυπηρετεί το index.html και τα στατικά αρχεία

app.post('/api/chat', async (req, res) => {
    try {
        let { messages, location } = req.body;

        // Κράτημα μόνο των τελευταίων 5 μηνυμάτων για γρηγορότερη απόκριση
        if (messages && messages.length > 5) {
            messages = messages.slice(-5);
        }

        const systemPrompt = {
            role: "system",
            content: "Είσαι ο Γιάννης, ένας φιλικός φωνητικός βοηθός. Απάντησε ΠΑΝΤΑ εξαιρετικά σύντομα, αυστηρά σε 1 έως 2 προτάσεις μέγιστο, χωρίς περιττές αναλύσεις, ώστε να διαβάζεται γρήγορα."
        };

        const apiMessages = [systemPrompt, ...messages];

        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROK_API_KEY}`
            },
            body: JSON.stringify({
                model: "grok-beta",
                messages: apiMessages,
                max_tokens: 100,
                temperature: 0.7
            })
        });

        const data = await response.json();
        
        if (!data.choices || !data.choices[0]) {
            throw new Error("Μη έγκυρη απάντηση από το API");
        }

        const reply = data.choices[0].message.content;

        res.json({ reply, usage: data.usage });
    } catch (error) {
        console.error("Σφάλμα API:", error);
        res.status(500).json({ reply: "Σφάλμα στον server." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
