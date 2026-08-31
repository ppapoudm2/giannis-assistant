// server.js - Πλήρης κώδικας backend για τον Γιάννη με υποστήριξη Tokens
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Σύνδεση με OpenAI χρησιμοποιώντας το API key από το Render environment
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Σερβίρισμα των στατικών αρχείων από τον φάκελο public
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint συνομιλίας
app.post('/api/chat', async (req, res) => {
    try {
        const { message, image } = req.body;

        let messages = [
            { role: "system", content: "Εσύ είσαι ο Γιάννης, ένας προσωπικός βοηθός φωνής και τεχνητής νοημοσύνης." }
        ];

        if (image) {
            messages.push({
                role: "user",
                content: [
                    { type: "text", text: message || "Τι βλέπεις εδώ;" },
                    { type: "image_url", image_url: { url: image } }
                ]
            });
        } else {
            messages.push({ role: "user", content: message });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
        });

        const reply = completion.choices[0].message.content;
        const usage = completion.usage; // Τα tokens από την OpenAI

        res.json({
            reply: reply,
            usage: usage // Στέλνουμε πίσω τα tokens στον browser
        });

    } catch (error) {
        console.error("Σφάλμα στο API της OpenAI:", error);
        res.status(500).json({ error: "Υπήρξε κάποιο σφάλμα στην επεξεργασία." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Ο server του Γιάννη τρέχει στην πόρτα ${PORT}`);
});
