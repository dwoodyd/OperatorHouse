import { config } from "dotenv";
config();

const key = process.env.RESEND_API_KEY;
console.log("Key set:", !!key);
console.log("Key prefix:", key ? key.substring(0, 8) : "none");

const res = await fetch("https://api.resend.com/domains", {
  headers: { Authorization: `Bearer ${key}` },
});
console.log("Status:", res.status);
const body = await res.json();
console.log("Response:", JSON.stringify(body).substring(0, 400));
