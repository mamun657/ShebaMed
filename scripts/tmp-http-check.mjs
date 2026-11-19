const url = process.argv[2] ?? "http://localhost:3000/";
const response = await fetch(url);
const body = await response.arrayBuffer();
console.log(
  url,
  "->",
  response.status,
  response.headers.get("content-type"),
  body.byteLength,
  "bytes",
);
