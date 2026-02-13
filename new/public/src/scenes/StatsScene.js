// ==================== STATS SCENE ====================
class StatsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StatsScene' });
        this.stats = null;
    }

    async create() {
        // Фон
        this.background = this.add.image(0, 0, 'background_img_menu').setOrigin(0, 0);
        this.background.setDisplaySize(CONSTS.WIDTH, CONSTS.HEIGHT);

        // Заголовок
        this.add.text(CONSTS.WIDTH / 2, 45, '📊 Статистика', {
            fontSize: '28px',
            fill: '#FFFFFF',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Загрузка...
        this.loadingText = this.add.text(CONSTS.WIDTH / 2, CONSTS.HEIGHT / 2, '⏳ Загрузка...', {
            fontSize: '20px',
            fill: '#FFFFFF',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Загружаем данные
        const userData = getTelegramUserId();
        await this.loadStats(userData.id, userData.username);

        // Кнопка назад
        const backBtn = this.add.graphics();
        backBtn.fillStyle(0xFF4444, 1);
        backBtn.fillRoundedRect(20, CONSTS.HEIGHT - 70, 120, 50, 8);
        
        this.add.text(80, CONSTS.HEIGHT - 45, 'Назад', {
            fontSize: '18px',
            fill: '#FFFFFF',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.add.rectangle(80, CONSTS.HEIGHT - 45, 120, 50, 0x000000, 0)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('MenuScene'));
    }

    async loadStats(userId, username) {
        try {
            const response = await fetch(`${API_SERVER_URL}/api/stats/${userId}`);
            const data = await response.json();

            if (data.success) {
                this.stats = data.stats;
                this.loadingText.destroy();
                this.displayStats(username);
            } else {
                this.loadingText.setText('❌ Ошибка загрузки');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки статистики:', error);
            this.loadingText.setText('❌ Ошибка соединения');
        }
    }

    displayStats(username) {
        const s = this.stats;
        const startY = 90;
        const lineHeight = 32;
        let y = startY;

        // Имя игрока и ранг
        this.createCard(20, y, CONSTS.WIDTH - 40, 70, 0x4a148c);
        this.add.text(CONSTS.WIDTH / 2, y + 20, `👤 ${username}`, {
            fontSize: '22px',
            fill: '#FFFFFF',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        const rankText = s.rank !== '-' ? `🏆 #${s.rank} в рейтинге` : '🏆 Нет в рейтинге';
        this.add.text(CONSTS.WIDTH / 2, y + 48, rankText, {
            fontSize: '14px',
            fill: '#FFD700',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        y += 85;

        // Секция: Игры
        this.createSectionTitle(y, '🎮 Игры');
        y += 30;
        
        this.createCard(20, y, CONSTS.WIDTH - 40, 100, 0x1a237e);
        this.createStatRow(y + 15, '📈 Всего игр:', s.totalGames.toLocaleString());
        this.createStatRow(y + 40, '🏅 Лучший счёт:', s.bestScore.toLocaleString());
        this.createStatRow(y + 65, '📊 Средний счёт:', s.avgScore.toLocaleString());
        y += 115;

        // Секция: Дуэли
        this.createSectionTitle(y, '⚔️ Дуэли');
        y += 30;
        
        this.createCard(20, y, CONSTS.WIDTH - 40, 100, 0x1b5e20);
        this.createStatRow(y + 15, '🎯 Всего дуэлей:', s.totalDuels.toLocaleString());
        this.createStatRow(y + 40, '✅ Победы:', `${s.duelsWon} (${s.winRate}%)`);
        this.createStatRow(y + 65, '❌ Поражения:', s.duelsLost.toLocaleString());
        y += 115;

        // Секция: Экономика
        this.createSectionTitle(y, '💰 Экономика');
        y += 30;
        
        this.createCard(20, y, CONSTS.WIDTH - 40, 75, 0xb71c1c);
        this.createStatRow(y + 15, '🍌 Monkey Coins:', s.monkeyCoins.toLocaleString());
        this.createStatRow(y + 40, '🛒 Покупки:', s.totalPurchases.toLocaleString());
        y += 90;

        // Общий счёт внизу
        this.createCard(20, y, CONSTS.WIDTH - 40, 50, 0xff6f00);
        this.add.text(CONSTS.WIDTH / 2, y + 25, `🔥 Всего очков: ${s.totalScore.toLocaleString()}`, {
            fontSize: '18px',
            fill: '#FFFFFF',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
    }

    createCard(x, y, width, height, color) {
        const card = this.add.graphics();
        card.fillStyle(color, 0.85);
        card.fillRoundedRect(x, y, width, height, 12);
        card.lineStyle(2, 0xffffff, 0.3);
        card.strokeRoundedRect(x, y, width, height, 12);
    }

    createSectionTitle(y, text) {
        this.add.text(30, y + 5, text, {
            fontSize: '16px',
            fill: '#FFFFFF',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 3
        });
    }

    createStatRow(y, label, value) {
        this.add.text(35, y, label, {
            fontSize: '14px',
            fill: '#CCCCCC',
            fontFamily: 'Arial'
        });
        
        this.add.text(CONSTS.WIDTH - 35, y, String(value), {
            fontSize: '14px',
            fill: '#FFFFFF',
            fontFamily: 'Arial Black'
        }).setOrigin(1, 0);
    }
}
