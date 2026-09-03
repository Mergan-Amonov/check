/**
 * Vercel serverless function: forwards a receipt file to a Telegram chat via
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
    const { fileBase64, caption, fileType, fileName } = req.body || {};
    if (!fileBase64 || typeof fileBase64 !== 'string') {
      res.status(400).json({ error: 'fileBase64 talab qilinadi.' });
      return;
    }

    const type: 'photo' | 'document' = fileType === 'document' ? 'document' : 'photo';
    const base64Data = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64;
    const fileBuffer = Buffer.from(base64Data, 'base64');

    const isDocument = type === 'document';
    const mimeType = isDocument ? 'application/pdf' : 'image/png';
    const defaultName = isDocument ? 'chek.pdf' : 'chek.png';
    const telegramField = isDocument ? 'document' : 'photo';
    const telegramMethod = isDocument ? 'sendDocument' : 'sendPhoto';

    const form = new FormData();
    form.append('chat_id', chatId);
    if (caption) form.append('caption', String(caption).slice(0, 1024));
    form.append(telegramField, new Blob([fileBuffer], { type: mimeType }), fileName || defaultName);

    const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/${telegramMethod}`, {
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
