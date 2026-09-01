app.post('/api/chat', async (req, res) => {
    try {
        let { messages, location } = req.body;

        // 1. Κρατάμε μόνο τα τελευταία 5 μηνύματα για να μην καθυστερεί η αποστολή/επεξεργασία
        if (messages && messages.length > 5) {
            messages = messages.slice(-5);
        }

        // 2. Προσθέτουμε σύστημα οδηγιών για εξαιρετικά σύντομες απαντήσεις (1-2 προτάσεις)
        const systemPrompt = {
            role: "system",
            content: "Είσαι ο Γιάννης, ένας φιλικός φωνητικός βοηθός. Απάντησε ΠΑΝΤΑ εξαιρετικά σύντομα, αυστηρά σε 1 έως 2 προτάσεις μέγιστο, χωρίς περιττές αναλύσεις, ώστε να διαβάζεται γρήγορα."
        };

        const apiMessages = [systemPrompt, ...messages];

        // Κλήση στο API (π.χ. Grok / OpenAI compatible)
        const response = await fetch('https://api.x.ai/v1/chat/completions', { // ή το endpoint που χρησιμοποιείς
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROK_API_KEY}`
            },
            body: JSON.stringify({
                model: "grok-beta", // ή το μοντέλο σου
                messages: apiMessages,
                max_tokens: 100, // Περιορισμός μεγέθους απάντησης σε tokens
                temperature: 0.7
            })
        });

        const data = await response.json();
        const reply = data.choices[0].message.content;

        res.json({ reply, usage: data.usage });
    } catch (error) {
        console.error(error);
        res.status(500).json({ reply: "Σφάλμα στον server." });
    }
});
