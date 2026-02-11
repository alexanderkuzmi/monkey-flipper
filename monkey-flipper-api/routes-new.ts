import type { Request, Response } from 'express';
import express from 'express';
import { eq } from 'drizzle-orm';
import { wallets } from './schema.ts';
import type { Db } from './db.ts';

const router = express.Router();

export default function (db: Db) {
  router.get('/balances/:userId', async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
      const rows = await db
        .select({
          monkeyCoinBalance: wallets.monkeyCoinBalance,
          starsBalance: wallets.starsBalance,
          tonBalance: wallets.tonBalance,
        })
        .from(wallets)
        .where(eq(wallets.userId, userId));

      if (rows.length === 0) {
        return res.json({ success: true, gameCoins: 0, starsCoins: 0, tonCoins: 0 });
      }

      const row = rows[0];
      return res.json({
        success: true,
        gameCoins: Number(row.monkeyCoinBalance) || 0,
        starsCoins: parseFloat(row.starsBalance ?? '0') || 0,
        tonCoins: parseFloat(row.tonBalance ?? '0') || 0,
      });
    } catch (err: unknown) {
      console.error('Get balances error', err);
      return res.status(500).json({ success: false, error: 'DB error' });
    }
  });

  router.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return router;
}
