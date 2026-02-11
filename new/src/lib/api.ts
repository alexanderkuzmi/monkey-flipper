import { API_SERVER_URL } from '../config'

export interface Balances {
  gameCoins: number
  starsCoins: number
  tonCoins: number
}

interface BalancesResponse {
  success: boolean
  gameCoins: number
  starsCoins: number
  tonCoins: number
  error?: string
}

export async function fetchBalances(userId: number | string): Promise<Balances | null> {
  try {
    const res = await fetch(`${API_SERVER_URL}/api/new/balances/${userId}`)
    const data: BalancesResponse = await res.json()
    if (!data.success) return null
    return {
      gameCoins: data.gameCoins,
      starsCoins: data.starsCoins,
      tonCoins: data.tonCoins,
    }
  } catch {
    return null
  }
}
