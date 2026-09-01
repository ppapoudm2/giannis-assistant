import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(express.json({ limit: "1mb" }));
app.use(express.static("."));

app.post("/api/chat", async (req, res) => {
  try {
    let { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        reply: "Δεν έλαβα ερώτηση."
      });
    }

    if (!OPENAI_API_KEY) {
      return res.status(500).json({
        reply: "Δεν έχει ρυθμιστεί το OPENAI_API_KEY."
      });
    }

    messages = messages
      .filter(
        m =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string"
      )
      .slice(-10);

    const systemPrompt = {
      role: "system",
      content:
        "Είσαι ο Γιάννης, ένας φιλικός προσωπικός φωνητικός βοηθός. Απαντάς πάντα στα ελληνικά με σύντομες φυσικές απαντήσεις κατάλληλες για εκφώνηση."
    };

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [systemPrompt, ...messages],
          temperature: 0.7,
          max_tokens: 150
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);

      return res.status(response.status).json({
        reply: data?.error?.message || "Σφάλμα OpenAI."
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "Δεν έχω απάντηση.";

    res.json({ reply });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      reply: "Σφάλμα server."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
