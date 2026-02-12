import { useQuery } from '@tanstack/react-query'
import { API_SERVER_URL } from '../config'
import { getTelegramUser } from './telegram'

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

async function fetchBalances(userId: number | string): Promise<Balances | null> {
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

export function useBalances() {
  const userId = getTelegramUser()?.id
  return useQuery({
    queryKey: ['balances', userId],
    queryFn: () => fetchBalances(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  })
}

export interface LeaderboardEntry {
  user_id: string
  username: string
  score: number
}

async function fetchLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch(`${API_SERVER_URL}/api/leaderboard?limit=${limit}`)
    const data = await res.json()
    if (!data.success) return []
    return data.rows ?? []
  } catch {
    return []
  }
}

export function useLeaderboard(limit = 13) {
  return useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: () => fetchLeaderboard(limit),
    staleTime: 60_000,
  })
}
