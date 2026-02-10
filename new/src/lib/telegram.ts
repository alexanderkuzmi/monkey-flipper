import type { WebApp, WebAppUser } from 'telegram-web-app'

function getWebApp(): WebApp | null {
  try {
    const wa = window.Telegram?.WebApp
    if (wa && wa.initData) return wa
  } catch {}
  return null
}

export function getTelegramUser(): WebAppUser | null {
  return getWebApp()?.initDataUnsafe?.user ?? null
}

export function isTelegramEnv(): boolean {
  return getWebApp() !== null
}
