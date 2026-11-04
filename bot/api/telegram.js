// Vercel serverless function: Telegram webhook for @TurkceYolBot.
// Telegram POSTs every new message here; the answer is returned in the response body ({ method: "sendMessage", ... }),
// so the bot replies instantly and this function never needs the bot token.
// TG_SECRET (set at deploy) must match the X-Telegram-Bot-Api-Secret-Token header — other requests are refused.
// The deploy workflow (.github/workflows/telegram-bot-deploy.yml) copies tools/ and the content files next to this folder.
const { handle } = require("../tools/telegram-bot.js");

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(200).send("Türkçe Yo'l bot ishlayapti"); return; }
  if (!process.env.TG_SECRET || req.headers["x-telegram-bot-api-secret-token"] !== process.env.TG_SECRET) { res.status(401).send("no"); return; }
  let u = req.body;
  if (typeof u === "string") { try { u = JSON.parse(u); } catch (e) { u = null; } }
  let call = null;
  try { call = handle(u); } catch (e) { console.error(e); }
  if (!call) { res.status(200).json({}); return; }
  res.status(200).json(call);
};
