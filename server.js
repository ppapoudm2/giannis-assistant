import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;
const XAI_API_KEY = process.env.XAI_API_KEY || process.env.GROK_API_KEY;

app.use(express.json({ limit: '1mb' }));
app.use(express.static('.'));

app.post('/api/chat', async (req, res) => {
    try {
        let { messages } = req.body;

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                reply: "Δεν έλαβα ερώτηση."
            });
        }

        if (!XAI_API_KEY) {
            return res.status(500).json({
                reply: "Δεν έχει ρυθμιστεί το XAI_API_KEY στον server."
            });
        }

        // Κρατάμε μόνο το πρόσφατο ιστορικό.
        messages = messages
            .filter(
                m =>
                    m &&
                    (m.role === 'user' || m.role === 'assistant') &&
                    typeof m.content === 'string'
            )
            .slice(-5);

        const systemPrompt = {
            role: "system",
            content:
                "Είσαι ο Γιάννης, ένας φιλικός προσωπικός φωνητικός βοηθός. " +
                "Απάντησε στα ελληνικά, φυσικά και εξαιρετικά σύντομα: το πολύ 1-2 προτάσεις. " +
                "Μην χρησιμοποιείς markdown, λίστες ή περιττές αναλύσεις, επειδή η απάντηση θα εκφωνηθεί."
        };

        const response = await fetch(
            'https://api.x.ai/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${XAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "grok-4.6",
                    messages: [systemPrompt, ...messages],
                    max_tokens: 120,
                    temperature: 0.7
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("xAI API error:", data);

            return res.status(response.status).json({
                reply:
                    data?.error?.message ||
                    "Σφάλμα επικοινωνίας με το xAI."
            });
        }

        const reply =
            data?.choices?.[0]?.message?.content?.trim();

        if (!reply) {
            return res.status(502).json({
                reply: "Δεν έλαβα απάντηση από το xAI."
            });
        }

        res.json({ reply });

    } catch (error) {
        console.error("Server error:", error);

        res.status(500).json({
            reply: "Σφάλμα επικοινωνίας με τον server."
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
