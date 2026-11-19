const key = process.env.GROQ_API_KEY;
const model = process.env.GROQ_TEXT_MODEL;
const payload = {
  question: "Have I done an HbA1c test before?",
  language: "English",
  structuredObservations: [
    {
      test: "HbA1c",
      result: "6.8",
      unit: "%",
      referenceRange: "4.0 - 5.6 %",
      page: 1,
      documentId: "6af813f3c916ab52f1f60142",
      filename: "synthetic-hba1c.pdf",
      reportDate: "2026-01-12",
      verification: "AI_EXTRACTED",
    },
  ],
  evidence: [],
};
const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + key,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model,
    temperature: 0,
    max_completion_tokens: 1200,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You retrieve documented medical history. You never provide clinical advice. Return JSON {answer:string,citations:[{documentId:string,page:integer,quote:string}]}.",
      },
      { role: "user", content: JSON.stringify(payload) },
    ],
  }),
});
console.log("status:", response.status);
console.log((await response.text()).slice(0, 3000));
