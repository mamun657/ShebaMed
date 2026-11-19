const key = process.env.GROQ_API_KEY;
const model = process.env.GROQ_TEXT_MODEL;
console.log("model:", model, "keyLen:", key ? key.length : 0);
const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + key,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model,
    temperature: 0,
    max_completion_tokens: 200,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: 'Return JSON {"answer":string}' },
      { role: "user", content: "Say ok" },
    ],
  }),
});
console.log("status:", response.status);
console.log((await response.text()).slice(0, 3000));
