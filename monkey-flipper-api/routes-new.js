const express = require('express');
const router = express.Router();

module.exports = function (pool) {
  router.get('/balances/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
      const wallet = await pool.query(
        'SELECT monkey_coin_balance, stars_balance, ton_balance FROM wallets WHERE user_id = $1',
        [userId]
      );

      if (wallet.rows.length === 0) {
        return res.json({ success: true, gameCoins: 0, starsCoins: 0, tonCoins: 0 });
      }

      const row = wallet.rows[0];
      return res.json({
        success: true,
        gameCoins: parseFloat(row.monkey_coin_balance) || 0,
        starsCoins: parseFloat(row.stars_balance) || 0,
        tonCoins: parseFloat(row.ton_balance) || 0,
      });
    } catch (err) {
      console.error('Get balances error', err);
      return res.status(500).json({ success: false, error: 'DB error' });
    }
  });

  return router;
};
