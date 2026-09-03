/**
 * Minimal integration with the Telegram Web App (Mini App) platform.
 * When this site is opened via the bot's menu button / Mini App link inside
 * Telegram, `window.Telegram.WebApp` is injected by the Telegram client
 * (loaded via the telegram-web-app.js script tag in index.html). Outside of
 * Telegram (a normal browser tab), it's simply undefined — every call here
 * is a no-op in that case, so this is safe to run unconditionally.
 */
export function initTelegramWebApp(): void {
  const webApp = (window as any).Telegram?.WebApp;
  if (!webApp) return;

  webApp.ready();
  webApp.expand();

  // Match the app's dark theme instead of Telegram's default chrome.
  try {
    webApp.setHeaderColor('#0f172a'); // slate-900
    webApp.setBackgroundColor('#020617'); // slate-950
  } catch {
    // Older Telegram clients may not support these — safe to ignore.
  }

  // Guard against an accidental swipe-down closing the app mid-sale.
  try {
    webApp.enableClosingConfirmation();
  } catch {
    // Not supported on this client version.
  }
}

export function isRunningInTelegram(): boolean {
  return !!(window as any).Telegram?.WebApp?.initData;
}
