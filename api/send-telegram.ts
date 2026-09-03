/**
 * Vercel serverless function: forwards a receipt image to a Telegram chat via
 * the Bot API. Exists so the Telegram bot token never reaches the browser —
 * it lives only as a server-side environment variable (TELEGRAM_BOT_TOKEN),
 * read here, never shipped in client JS.
 *
 * Required Vercel project environment variables:
 *   TELEGRAM_BOT_TOKEN — from @BotFather
 *   TELEGRAM_CHAT_ID   — the chat/group the bot should post receipts into
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    res.status(500).json({ error: 'Server sozlanmagan: TELEGRAM_BOT_TOKEN yoki TELEGRAM_CHAT_ID yo\'q.' });
    return;
  }

  try {
    const { imageBase64, caption } = req.body || {};
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      res.status(400).json({ error: 'imageBase64 talab qilinadi.' });
      return;
    }

    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const form = new FormData();
    form.append('chat_id', chatId);
    if (caption) form.append('caption', String(caption).slice(0, 1024));
    form.append('photo', new Blob([imageBuffer], { type: 'image/png' }), 'chek.png');

    const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: 'POST',
      body: form
    });

    const telegramData = await telegramRes.json();

    if (!telegramRes.ok || !telegramData.ok) {
      console.error('Telegram API error:', telegramData);
      res.status(502).json({ error: telegramData.description || 'Telegram API xatosi.' });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('send-telegram error:', err);
    res.status(500).json({ error: err.message || 'Server xatosi.' });
  }
}
