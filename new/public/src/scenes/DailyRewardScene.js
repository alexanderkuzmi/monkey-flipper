// ==================== DAILY REWARD SCENE ====================
class DailyRewardScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DailyRewardScene' });
        this.rewardStatus = null;
    }

    async create() {
        // Фон
        this.background = this.add.image(0, 0, 'background_img_menu').setOrigin(0, 0);
        this.background.setDisplaySize(CONSTS.WIDTH, CONSTS.HEIGHT);

        // Заголовок
        this.add.text(CONSTS.WIDTH / 2, 45, '🏆 Ежедневные награды', {
            fontSize: '26px',
            fill: '#FFD700',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Загрузка
        this.statusText = this.add.text(CONSTS.WIDTH / 2, CONSTS.HEIGHT / 2, '⏳ Загрузка...', {
            fontSize: '18px',
            fill: '#FFFFFF',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Загружаем статус
        const userData = getTelegramUserId();
        await this.loadRewardStatus(userData.id);

        // Кнопка назад
        this.createBackButton();
    }

    async loadRewardStatus(userId) {
        try {
            const response = await fetch(`${API_SERVER_URL}/api/daily-reward/status/${userId}`);
            const data = await response.json();

            this.statusText.destroy();

            if (data.success) {
                this.rewardStatus = data;
                this.displayRewardUI(userId);
            } else {
                this.showError('Ошибка загрузки');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки наград:', error);
            this.statusText.setText('❌ Ошибка соединения');
        }
    }

    displayRewardUI(userId) {
        let y = 90;

        // Статус streak
        this.createCard(20, y, CONSTS.WIDTH - 40, 80, 0x1a237e);
        
        const streakText = this.rewardStatus.currentStreak === 0 
            ? 'Начни серию!' 
            : `🔥 Серия: ${this.rewardStatus.currentStreak} дней`;
        
        this.add.text(CONSTS.WIDTH / 2, y + 25, streakText, {
            fontSize: '20px',
            fill: '#FFD700',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.add.text(CONSTS.WIDTH / 2, y + 55, `Всего получено: ${this.rewardStatus.totalClaimed} 🪙`, {
            fontSize: '14px',
            fill: '#AAAAAA',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        y += 100;

        // Календарь наград (7 дней)
        this.createCard(20, y, CONSTS.WIDTH - 40, 280, 0x2e3b4e);
        
        this.add.text(CONSTS.WIDTH / 2, y + 20, '📅 Награды по дням', {
            fontSize: '16px',
            fill: '#FFFFFF',
            fontFamily: 'Arial Black'
        }).setOrigin(0.5);

        // Рисуем календарь (3 ряда по дням)
        const rewards = this.rewardStatus.rewards;
        const cardSize = 80;
        const gap = 15;
        const startX = (CONSTS.WIDTH - (3 * cardSize + 2 * gap)) / 2;
        
        rewards.forEach((reward, i) => {
            if (i >= 7) return; // Показываем только текущую неделю
            
            const row = Math.floor(i / 3);
            const col = i % 3;
            const cardX = startX + col * (cardSize + gap);
            const cardY = y + 55 + row * (cardSize + gap);
            
            this.drawRewardCard(cardX, cardY, cardSize, reward, i + 1);
        });

        y += 300;

        // Кнопка получения награды или информация
        if (this.rewardStatus.canClaim) {
            const nextReward = this.rewardStatus.nextReward;
            
            // Информация о награде
            this.add.text(CONSTS.WIDTH / 2, y, `День ${nextReward.day}`, {
                fontSize: '16px',
                fill: '#FFFFFF',
                fontFamily: 'Arial Black'
            }).setOrigin(0.5);
            
            const rewardText = nextReward.multiplier 
                ? `+${nextReward.coins} 🪙 (${nextReward.multiplier})`
                : `+${nextReward.coins} 🪙`;
            
            this.add.text(CONSTS.WIDTH / 2, y + 25, rewardText, {
                fontSize: '24px',
                fill: '#FFD700',
                fontFamily: 'Arial Black',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
            
            if (nextReward.bonus) {
                this.add.text(CONSTS.WIDTH / 2, y + 55, nextReward.bonus, {
                    fontSize: '14px',
                    fill: '#00FF00',
                    fontFamily: 'Arial'
                }).setOrigin(0.5);
            }
            
            // Кнопка забрать
            this.createButton(
                CONSTS.WIDTH / 2, y + 90,
                '🎁 Забрать награду',
                0x4CAF50,
                () => this.claimReward(userId)
            );
        } else {
            // Уже забрал сегодня
            this.add.text(CONSTS.WIDTH / 2, y + 20, '✅ Награда получена!', {
                fontSize: '18px',
                fill: '#00FF00',
                fontFamily: 'Arial Black'
            }).setOrigin(0.5);
            
            this.add.text(CONSTS.WIDTH / 2, y + 50, 'Возвращайся завтра за новой наградой', {
                fontSize: '13px',
                fill: '#AAAAAA',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        }
    }

    drawRewardCard(x, y, size, reward, dayNum) {
        const card = this.add.graphics();
        
        // Определяем цвет карточки
        let bgColor = 0x37474f; // Серый (не получено)
        let borderColor = 0x546e7a;
        
        if (reward.completed) {
            bgColor = 0x2e7d32; // Зелёный (получено)
            borderColor = 0x4caf50;
        } else if (reward.current) {
            bgColor = 0x1976d2; // Синий (текущий день)
            borderColor = 0x2196f3;
        }
        
        // Рисуем карточку
        card.fillStyle(bgColor, 0.9);
        card.fillRoundedRect(x, y, size, size, 8);
        card.lineStyle(2, borderColor, 1);
        card.strokeRoundedRect(x, y, size, size, 8);
        
        // День
        const dayText = this.add.text(x + size / 2, y + 15, `День ${dayNum}`, {
            fontSize: '11px',
            fill: '#FFFFFF',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Награда
        const coinText = this.add.text(x + size / 2, y + 40, `${reward.coins}`, {
            fontSize: '18px',
            fill: '#FFD700',
            fontFamily: 'Arial Black'
        }).setOrigin(0.5);
        
        this.add.text(x + size / 2, y + 58, '🪙', {
            fontSize: '14px',
        }).setOrigin(0.5);
        
        // Статус
        if (reward.completed) {
            this.add.text(x + size / 2, y + size - 10, '✅', {
                fontSize: '12px',
            }).setOrigin(0.5);
        } else if (reward.current) {
            // Анимация мерцания для текущего дня
            this.tweens.add({
                targets: [dayText, coinText],
                alpha: 0.5,
                duration: 800,
                yoyo: true,
                repeat: -1
            });
        }
    }

    async claimReward(userId) {
        try {
            const response = await fetch(`${API_SERVER_URL}/api/daily-reward/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            const data = await response.json();

            if (data.success) {
                // Показываем анимацию получения награды
                this.showRewardAnimation(data.reward);
                
                // Перезагружаем сцену через 3 секунды
                this.time.delayedCall(3000, () => {
                    this.scene.restart();
                });
            } else if (data.alreadyClaimed) {
                this.showError('Уже забрал сегодня!');
            } else {
                this.showError(data.error || 'Ошибка');
            }
        } catch (error) {
            console.error('❌ Ошибка получения награды:', error);
            this.showError('Ошибка соединения');
        }
    }

    showRewardAnimation(reward) {
        // Затемнение
        const overlay = this.add.rectangle(0, 0, CONSTS.WIDTH, CONSTS.HEIGHT, 0x000000, 0.8)
            .setOrigin(0, 0)
            .setDepth(100);

        // Контейнер награды
        const rewardBg = this.add.graphics().setDepth(101);
        rewardBg.fillStyle(0x4caf50, 1);
        rewardBg.fillRoundedRect(CONSTS.WIDTH / 2 - 140, CONSTS.HEIGHT / 2 - 100, 280, 200, 12);
        rewardBg.lineStyle(4, 0xffd700, 1);
        rewardBg.strokeRoundedRect(CONSTS.WIDTH / 2 - 140, CONSTS.HEIGHT / 2 - 100, 280, 200, 12);

        // Текст
        const congrats = this.add.text(CONSTS.WIDTH / 2, CONSTS.HEIGHT / 2 - 60, '🎉 Награда получена!', {
            fontSize: '20px',
            fill: '#FFFFFF',
            fontFamily: 'Arial Black'
        }).setOrigin(0.5).setDepth(102);

        const coins = this.add.text(CONSTS.WIDTH / 2, CONSTS.HEIGHT / 2 - 10, `+${reward.coins} 🪙`, {
            fontSize: '32px',
            fill: '#FFD700',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(102);

        if (reward.bonus) {
            this.add.text(CONSTS.WIDTH / 2, CONSTS.HEIGHT / 2 + 35, reward.bonus, {
                fontSize: '14px',
                fill: '#00FF00',
                fontFamily: 'Arial'
            }).setOrigin(0.5).setDepth(102);
        }

        const streak = this.add.text(CONSTS.WIDTH / 2, CONSTS.HEIGHT / 2 + 65, `🔥 Серия: ${reward.newStreak || 1} дней`, {
            fontSize: '16px',
            fill: '#FFFFFF',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(102);

        // Анимация появления
        [overlay, rewardBg, congrats, coins, streak].forEach(obj => {
            obj.setAlpha(0);
            this.tweens.add({
                targets: obj,
                alpha: 1,
                duration: 500,
                ease: 'Power2'
            });
        });

        // Анимация монет
        this.tweens.add({
            targets: coins,
            scale: { from: 0.5, to: 1.2 },
            duration: 600,
            ease: 'Back.easeOut'
        });
    }

    createButton(x, y, text, color, callback) {
        const btnWidth = 220;
        const btnHeight = 45;

        const btnGraphics = this.add.graphics();
        btnGraphics.fillStyle(color, 1);
        btnGraphics.fillRoundedRect(x - btnWidth/2, y - btnHeight/2, btnWidth, btnHeight, 10);

        const btnText = this.add.text(x, y, text, {
            fontSize: '16px',
            fill: '#FFFFFF',
            fontFamily: 'Arial Black'
        }).setOrigin(0.5);

        const btnZone = this.add.rectangle(x, y, btnWidth, btnHeight, 0x000000, 0)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', callback)
            .on('pointerover', () => {
                btnGraphics.clear();
                btnGraphics.fillStyle(color, 0.8);
                btnGraphics.fillRoundedRect(x - btnWidth/2, y - btnHeight/2, btnWidth, btnHeight, 10);
            })
            .on('pointerout', () => {
                btnGraphics.clear();
                btnGraphics.fillStyle(color, 1);
                btnGraphics.fillRoundedRect(x - btnWidth/2, y - btnHeight/2, btnWidth, btnHeight, 10);
            });

        return { graphics: btnGraphics, text: btnText, zone: btnZone };
    }

    createCard(x, y, width, height, color) {
        const card = this.add.graphics();
        card.fillStyle(color, 0.85);
        card.fillRoundedRect(x, y, width, height, 12);
        card.lineStyle(2, 0xffffff, 0.3);
        card.strokeRoundedRect(x, y, width, height, 12);
    }

    createBackButton() {
        this.add.text(80, CONSTS.HEIGHT - 45, '← Назад', {
            fontSize: '18px',
            fill: '#FFFFFF',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.add.rectangle(80, CONSTS.HEIGHT - 45, 120, 50, 0x000000, 0)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('MenuScene'));
    }

    showError(message) {
        const errorText = this.add.text(CONSTS.WIDTH / 2, CONSTS.HEIGHT - 100, `❌ ${message}`, {
            fontSize: '14px',
            fill: '#FF6666',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.time.delayedCall(3000, () => errorText.destroy());
    }
}
