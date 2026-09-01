import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(express.json());
app.use(express.static("."));

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "Είσαι ο Γιάννης, ένας σύντομος ελληνόφωνος φωνητικός βοηθός. Απάναντα φυσικά και σύντομα."
            },
            ...(messages || [])
          ],
          temperature: 0.7,
          max_tokens: 150
        })
      }
    );

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "Δεν μπόρεσα να απαντήσω.";

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      reply: "Σφάλμα επικοινωνίας με το ChatGPT."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
