// ==================== ACHIEVEMENTS SCENE ====================
class AchievementsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'AchievementsScene' });
        this.achievementsData = null;
        this.scrollY = 0;
        this.maxScroll = 0;
        this.achievementCards = [];
    }

    async create() {
        // Фон
        this.background = this.add.image(0, 0, 'background_img_menu').setOrigin(0, 0);
        this.background.setDisplaySize(CONSTS.WIDTH, CONSTS.HEIGHT);

        // Заголовок
        this.add.text(CONSTS.WIDTH / 2, 45, '🎯 Достижения', {
            fontSize: '28px',
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

        // Загружаем достижения
        const userData = getTelegramUserId();
        
        // Сначала проверяем новые достижения
        await this.checkNewAchievements(userData.id);
        await this.loadAchievements(userData.id);

        // Кнопка назад
        this.createBackButton();
        
        // Настраиваем скролл
        this.setupScroll();
    }

    async checkNewAchievements(userId) {
        try {
            await fetch(`${API_SERVER_URL}/api/achievements/check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
        } catch (error) {
            console.error('Check achievements error:', error);
        }
    }

    async loadAchievements(userId) {
        try {
            const response = await fetch(`${API_SERVER_URL}/api/achievements/${userId}`);
            const data = await response.json();

            this.statusText.destroy();

            if (data.success) {
                this.achievementsData = data;
                this.displayAchievementsUI(userId);
            } else {
                this.showError('Ошибка загрузки');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки достижений:', error);
            this.statusText.setText('❌ Ошибка соединения');
        }
    }

    displayAchievementsUI(userId) {
        const stats = this.achievementsData.stats;
        let y = 85;

        // Статистика сверху
        this.createCard(20, y, CONSTS.WIDTH - 40, 70, 0x1a237e);
        
        this.add.text(CONSTS.WIDTH / 2, y + 20, `🏆 ${stats.unlocked}/${stats.total} достижений`, {
            fontSize: '18px',
            fill: '#FFD700',
            fontFamily: 'Arial Black'
        }).setOrigin(0.5);

        if (stats.unclaimedRewards > 0) {
            const claimAllBtn = this.add.text(CONSTS.WIDTH / 2, y + 48, `💰 Забрать всё: +${stats.unclaimedRewards} 🪙`, {
                fontSize: '14px',
                fill: '#00FF00',
                fontFamily: 'Arial Black',
                backgroundColor: '#2e7d32',
                padding: { x: 15, y: 5 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            
            claimAllBtn.on('pointerdown', () => this.claimAllRewards(userId));
        }

        y += 90;

        // Создаём контейнер для скролла
        this.scrollContainer = this.add.container(0, 0);
        
        // Группируем по категориям
        const categories = [
            { id: 'game', name: '🎮 Игровые', color: 0x1976d2 },
            { id: 'progress', name: '📈 Прогресс', color: 0x7b1fa2 },
            { id: 'social', name: '👥 Социальные', color: 0x388e3c },
            { id: 'economy', name: '💰 Экономика', color: 0xf57c00 },
            { id: 'duel', name: '⚔️ Дуэли', color: 0xd32f2f },
            { id: 'streak', name: '🔥 Серии', color: 0x512da8 }
        ];

        let scrollY = y;
        
        categories.forEach(cat => {
            const catAchievements = this.achievementsData.achievements.filter(a => a.category === cat.id);
            if (catAchievements.length === 0) return;
            
            // Заголовок категории
            const catTitle = this.add.text(25, scrollY, cat.name, {
                fontSize: '16px',
                fill: '#FFFFFF',
                fontFamily: 'Arial Black'
            });
            this.scrollContainer.add(catTitle);
            
            scrollY += 30;
            
            // Достижения в категории
            catAchievements.forEach(ach => {
                const card = this.createAchievementCard(20, scrollY, ach, userId, cat.color);
                this.scrollContainer.add(card);
                this.achievementCards.push({ y: scrollY, card });
                scrollY += 75;
            });
            
            scrollY += 10;
        });

        this.maxScroll = Math.max(0, scrollY - CONSTS.HEIGHT + 150);
        
        // Маска для скролла
        const maskShape = this.make.graphics();
        maskShape.fillRect(0, y - 10, CONSTS.WIDTH, CONSTS.HEIGHT - y - 60);
        const mask = maskShape.createGeometryMask();
        this.scrollContainer.setMask(mask);
    }

    createAchievementCard(x, y, achievement, userId, categoryColor) {
        const container = this.add.container(0, 0);
        const cardWidth = CONSTS.WIDTH - 40;
        const cardHeight = 65;
        
        // Фон карточки
        const bg = this.add.graphics();
        const bgColor = achievement.unlocked ? (achievement.claimed ? 0x37474f : 0x2e7d32) : 0x263238;
        bg.fillStyle(bgColor, 0.9);
        bg.fillRoundedRect(x, y, cardWidth, cardHeight, 10);
        
        // Граница
        const borderColor = achievement.unlocked ? (achievement.claimed ? 0x546e7a : 0x4caf50) : 0x455a64;
        bg.lineStyle(2, borderColor, 1);
        bg.strokeRoundedRect(x, y, cardWidth, cardHeight, 10);
        container.add(bg);
        
        // Иконка
        const icon = this.add.text(x + 30, y + cardHeight/2, achievement.icon, {
            fontSize: '28px'
        }).setOrigin(0.5);
        container.add(icon);
        
        // Название
        const nameColor = achievement.unlocked ? '#FFFFFF' : '#888888';
        const name = this.add.text(x + 60, y + 15, achievement.name, {
            fontSize: '14px',
            fill: nameColor,
            fontFamily: 'Arial Black'
        });
        container.add(name);
        
        // Описание
        const desc = this.add.text(x + 60, y + 33, achievement.description, {
            fontSize: '11px',
            fill: '#AAAAAA',
            fontFamily: 'Arial'
        });
        container.add(desc);
        
        // Прогресс или награда
        if (!achievement.unlocked) {
            // Прогресс бар
            const progressWidth = 80;
            const progressPercent = Math.min(achievement.progress / achievement.target, 1);
            
            const progressBg = this.add.graphics();
            progressBg.fillStyle(0x455a64, 1);
            progressBg.fillRoundedRect(x + cardWidth - progressWidth - 15, y + 20, progressWidth, 12, 6);
            container.add(progressBg);
            
            if (progressPercent > 0) {
                const progressFill = this.add.graphics();
                progressFill.fillStyle(categoryColor, 1);
                progressFill.fillRoundedRect(x + cardWidth - progressWidth - 15, y + 20, progressWidth * progressPercent, 12, 6);
                container.add(progressFill);
            }
            
            const progressText = this.add.text(x + cardWidth - progressWidth/2 - 15, y + 26, 
                `${achievement.progress}/${achievement.target}`, {
                fontSize: '9px',
                fill: '#FFFFFF',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
            container.add(progressText);
            
            // Награда внизу
            const rewardText = this.add.text(x + cardWidth - 50, y + 48, `+${achievement.reward}🪙`, {
                fontSize: '11px',
                fill: '#888888',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
            container.add(rewardText);
        } else if (!achievement.claimed) {
            // Кнопка забрать
            const claimBtn = this.add.graphics();
            claimBtn.fillStyle(0x4caf50, 1);
            claimBtn.fillRoundedRect(x + cardWidth - 90, y + 18, 75, 30, 8);
            container.add(claimBtn);
            
            const claimText = this.add.text(x + cardWidth - 52, y + 33, `+${achievement.reward}🪙`, {
                fontSize: '12px',
                fill: '#FFFFFF',
                fontFamily: 'Arial Black'
            }).setOrigin(0.5);
            container.add(claimText);
            
            const claimZone = this.add.rectangle(x + cardWidth - 52, y + 33, 75, 30, 0x000000, 0)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.claimReward(userId, achievement.id));
            container.add(claimZone);
        } else {
            // Уже забрано
            const claimed = this.add.text(x + cardWidth - 50, y + 33, '✅', {
                fontSize: '20px'
            }).setOrigin(0.5);
            container.add(claimed);
        }
        
        return container;
    }

    async claimReward(userId, achievementId) {
        try {
            const response = await fetch(`${API_SERVER_URL}/api/achievements/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, achievementId })
            });

            const data = await response.json();

            if (data.success) {
                this.showRewardPopup(data.achievement, data.reward);
                this.time.delayedCall(1500, () => this.scene.restart());
            } else {
                this.showError(data.error || 'Ошибка');
            }
        } catch (error) {
            console.error('Claim error:', error);
            this.showError('Ошибка соединения');
        }
    }

    async claimAllRewards(userId) {
        try {
            const response = await fetch(`${API_SERVER_URL}/api/achievements/claim-all`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            const data = await response.json();

            if (data.success && data.claimed > 0) {
                this.showBigRewardPopup(data.claimed, data.totalReward);
                this.time.delayedCall(2000, () => this.scene.restart());
            } else if (data.claimed === 0) {
                this.showError('Нет наград для получения');
            }
        } catch (error) {
            console.error('Claim all error:', error);
            this.showError('Ошибка соединения');
        }
    }

    showRewardPopup(achievement, reward) {
        const overlay = this.add.rectangle(0, 0, CONSTS.WIDTH, CONSTS.HEIGHT, 0x000000, 0.7)
            .setOrigin(0, 0).setDepth(100);
        
        const popup = this.add.graphics().setDepth(101);
        popup.fillStyle(0x2e7d32, 1);
        popup.fillRoundedRect(CONSTS.WIDTH/2 - 120, CONSTS.HEIGHT/2 - 60, 240, 120, 12);
        
        this.add.text(CONSTS.WIDTH/2, CONSTS.HEIGHT/2 - 30, `${achievement.icon} ${achievement.name}`, {
            fontSize: '16px',
            fill: '#FFFFFF',
            fontFamily: 'Arial Black'
        }).setOrigin(0.5).setDepth(102);
        
        this.add.text(CONSTS.WIDTH/2, CONSTS.HEIGHT/2 + 10, `+${reward} 🪙`, {
            fontSize: '28px',
            fill: '#FFD700',
            fontFamily: 'Arial Black'
        }).setOrigin(0.5).setDepth(102);
    }

    showBigRewardPopup(count, totalReward) {
        const overlay = this.add.rectangle(0, 0, CONSTS.WIDTH, CONSTS.HEIGHT, 0x000000, 0.8)
            .setOrigin(0, 0).setDepth(100);
        
        const popup = this.add.graphics().setDepth(101);
        popup.fillStyle(0x4caf50, 1);
        popup.fillRoundedRect(CONSTS.WIDTH/2 - 140, CONSTS.HEIGHT/2 - 80, 280, 160, 15);
        popup.lineStyle(4, 0xffd700, 1);
        popup.strokeRoundedRect(CONSTS.WIDTH/2 - 140, CONSTS.HEIGHT/2 - 80, 280, 160, 15);
        
        this.add.text(CONSTS.WIDTH/2, CONSTS.HEIGHT/2 - 50, '🎉 Награды получены!', {
            fontSize: '18px',
            fill: '#FFFFFF',
            fontFamily: 'Arial Black'
        }).setOrigin(0.5).setDepth(102);
        
        this.add.text(CONSTS.WIDTH/2, CONSTS.HEIGHT/2, `${count} достижений`, {
            fontSize: '14px',
            fill: '#CCCCCC',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(102);
        
        this.add.text(CONSTS.WIDTH/2, CONSTS.HEIGHT/2 + 40, `+${totalReward} 🪙`, {
            fontSize: '32px',
            fill: '#FFD700',
            fontFamily: 'Arial Black'
        }).setOrigin(0.5).setDepth(102);
    }

    setupScroll() {
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY * 0.5, 0, this.maxScroll);
            if (this.scrollContainer) {
                this.scrollContainer.y = -this.scrollY;
            }
        });
        
        // Touch scroll
        let startY = 0;
        let startScrollY = 0;
        
        this.input.on('pointerdown', (pointer) => {
            startY = pointer.y;
            startScrollY = this.scrollY;
        });
        
        this.input.on('pointermove', (pointer) => {
            if (pointer.isDown) {
                const deltaY = startY - pointer.y;
                this.scrollY = Phaser.Math.Clamp(startScrollY + deltaY, 0, this.maxScroll);
                if (this.scrollContainer) {
                    this.scrollContainer.y = -this.scrollY;
                }
            }
        });
    }

    createCard(x, y, width, height, color) {
        const card = this.add.graphics();
        card.fillStyle(color, 0.85);
        card.fillRoundedRect(x, y, width, height, 12);
        card.lineStyle(2, 0xffffff, 0.3);
        card.strokeRoundedRect(x, y, width, height, 12);
    }

    createBackButton() {
        const btn = this.add.text(80, CONSTS.HEIGHT - 45, '← Назад', {
            fontSize: '18px',
            fill: '#FFFFFF',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(200);

        this.add.rectangle(80, CONSTS.HEIGHT - 45, 120, 50, 0x000000, 0)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('MenuScene'))
            .setDepth(200);
    }

    showError(message) {
        const errorText = this.add.text(CONSTS.WIDTH / 2, CONSTS.HEIGHT - 100, `❌ ${message}`, {
            fontSize: '14px',
            fill: '#FF6666',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(200);

        this.time.delayedCall(3000, () => errorText.destroy());
    }
}
