// ==================== REFERRAL SCENE ====================
class ReferralScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ReferralScene' });
        this.referralStats = null;
    }

    async create() {
        // Фон
        this.background = this.add.image(0, 0, 'background_img_menu').setOrigin(0, 0);
        this.background.setDisplaySize(CONSTS.WIDTH, CONSTS.HEIGHT);

        // Заголовок
        this.add.text(CONSTS.WIDTH / 2, 45, '🎁 Рефералы', {
            fontSize: '28px',
            fill: '#FFFFFF',
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

        // Загружаем статистику
        const userData = getTelegramUserId();
        await this.loadReferralStats(userData.id);

        // Кнопка назад
        this.createBackButton();
    }

    async loadReferralStats(userId) {
        try {
            const response = await fetch(`${API_SERVER_URL}/api/referral/stats/${userId}`);
            const data = await response.json();

            this.statusText.destroy();

            if (data.success) {
                this.referralStats = data;
                this.displayReferralUI(userId);
            } else {
                this.showError('Ошибка загрузки');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки рефералов:', error);
            this.statusText.setText('❌ Ошибка соединения');
        }
    }

    displayReferralUI(userId) {
        let y = 90;

        // Реферальная ссылка
        this.createCard(20, y, CONSTS.WIDTH - 40, 130, 0x1a237e);
        
        this.add.text(CONSTS.WIDTH / 2, y + 20, '📤 Твоя реферальная ссылка:', {
            fontSize: '14px',
            fill: '#AAAAAA',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Формируем ссылку для Mini App
        const botUsername = 'monkey_test_crypto_bot'; // Имя бота
        const referralLink = `https://t.me/${botUsername}?startapp=ref_${userId}`;
        
        // Показываем короткую версию
        const shortLink = `t.me/${botUsername}?startapp=ref_${userId}`;
        
        this.add.text(CONSTS.WIDTH / 2, y + 50, shortLink, {
            fontSize: '13px',
            fill: '#00BFFF',
            fontFamily: 'Arial',
            wordWrap: { width: CONSTS.WIDTH - 60 }
        }).setOrigin(0.5);

        // Кнопка копирования/отправки
        this.createButton(
            CONSTS.WIDTH / 2, y + 95,
            '📋 Поделиться ссылкой',
            0x4CAF50,
            () => this.shareReferralLink(referralLink)
        );

        y += 150;

        // Статистика
        this.createCard(20, y, CONSTS.WIDTH - 40, 120, 0x2e7d32);
        
        this.add.text(CONSTS.WIDTH / 2, y + 20, '📊 Твоя статистика', {
            fontSize: '16px',
            fill: '#FFFFFF',
            fontFamily: 'Arial Black'
        }).setOrigin(0.5);

        const stats = this.referralStats.stats;
        
        this.add.text(CONSTS.WIDTH / 2 - 60, y + 50, `👥 Приглашено:`, {
            fontSize: '14px',
            fill: '#CCCCCC',
            fontFamily: 'Arial'
        }).setOrigin(0, 0.5);
        
        this.add.text(CONSTS.WIDTH / 2 + 80, y + 50, `${stats.totalReferrals}`, {
            fontSize: '14px',
            fill: '#FFFFFF',
            fontFamily: 'Arial Black'
        }).setOrigin(1, 0.5);

        this.add.text(CONSTS.WIDTH / 2 - 60, y + 75, `💰 Заработано:`, {
            fontSize: '14px',
            fill: '#CCCCCC',
            fontFamily: 'Arial'
        }).setOrigin(0, 0.5);
        
        this.add.text(CONSTS.WIDTH / 2 + 80, y + 75, `${stats.totalEarned} 🪙`, {
            fontSize: '14px',
            fill: '#FFD700',
            fontFamily: 'Arial Black'
        }).setOrigin(1, 0.5);

        this.add.text(CONSTS.WIDTH / 2 - 60, y + 100, `🎁 За друга:`, {
            fontSize: '14px',
            fill: '#CCCCCC',
            fontFamily: 'Arial'
        }).setOrigin(0, 0.5);
        
        this.add.text(CONSTS.WIDTH / 2 + 80, y + 100, `+${stats.bonusPerReferral} 🪙`, {
            fontSize: '14px',
            fill: '#00FF00',
            fontFamily: 'Arial Black'
        }).setOrigin(1, 0.5);

        y += 140;

        // Список приглашённых
        this.createCard(20, y, CONSTS.WIDTH - 40, 180, 0x37474f);
        
        this.add.text(CONSTS.WIDTH / 2, y + 20, '👥 Приглашённые друзья', {
            fontSize: '16px',
            fill: '#FFFFFF',
            fontFamily: 'Arial Black'
        }).setOrigin(0.5);

        const referrals = this.referralStats.referrals;
        
        if (referrals.length === 0) {
            this.add.text(CONSTS.WIDTH / 2, y + 90, 'Пока никого не пригласили\nПоделись ссылкой с друзьями!', {
                fontSize: '13px',
                fill: '#888888',
                fontFamily: 'Arial',
                align: 'center'
            }).setOrigin(0.5);
        } else {
            // Показываем до 5 последних рефералов
            const displayRefs = referrals.slice(0, 5);
            displayRefs.forEach((ref, i) => {
                const refY = y + 45 + (i * 25);
                const statusIcon = ref.bonusPaid ? '✅' : '⏳';
                const username = ref.username.length > 15 
                    ? ref.username.slice(0, 15) + '...' 
                    : ref.username;
                
                this.add.text(40, refY, `${statusIcon} @${username}`, {
                    fontSize: '12px',
                    fill: '#FFFFFF',
                    fontFamily: 'Arial'
                });
                
                this.add.text(CONSTS.WIDTH - 40, refY, ref.bonusPaid ? `+${ref.bonusAmount}🪙` : 'ждём игру', {
                    fontSize: '12px',
                    fill: ref.bonusPaid ? '#00FF00' : '#FFD700',
                    fontFamily: 'Arial'
                }).setOrigin(1, 0);
            });
            
            if (referrals.length > 5) {
                this.add.text(CONSTS.WIDTH / 2, y + 165, `... и ещё ${referrals.length - 5}`, {
                    fontSize: '11px',
                    fill: '#888888',
                    fontFamily: 'Arial'
                }).setOrigin(0.5);
            }
        }

        y += 200;

        // Инструкция
        this.add.text(CONSTS.WIDTH / 2, y + 10, '💡 Ты получишь бонус, когда друг\nсыграет свою первую игру!', {
            fontSize: '12px',
            fill: '#AAAAAA',
            fontFamily: 'Arial',
            align: 'center'
        }).setOrigin(0.5);
    }

    shareReferralLink(link) {
        const text = `🐵 Играй в Crypto Monkey!\n\n🎮 Прыгай, собирай монеты и соревнуйся с друзьями!\n\n🎁 Переходи по ссылке и получи бонус:`;
        
        // Используем Telegram Share
        if (window.Telegram?.WebApp) {
            // Открываем Telegram share диалог
            const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
            window.Telegram.WebApp.openTelegramLink(shareUrl);
        } else {
            // Fallback - копируем в буфер
            navigator.clipboard.writeText(link).then(() => {
                this.showMessage('✅ Ссылка скопирована!');
            }).catch(() => {
                this.showError('Не удалось скопировать');
            });
        }
    }

    showMessage(message) {
        const msgText = this.add.text(CONSTS.WIDTH / 2, CONSTS.HEIGHT - 100, message, {
            fontSize: '16px',
            fill: '#00FF00',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.time.delayedCall(2000, () => msgText.destroy());
    }

    createButton(x, y, text, color, callback) {
        const btnWidth = 200;
        const btnHeight = 40;

        const btnGraphics = this.add.graphics();
        btnGraphics.fillStyle(color, 1);
        btnGraphics.fillRoundedRect(x - btnWidth/2, y - btnHeight/2, btnWidth, btnHeight, 8);

        const btnText = this.add.text(x, y, text, {
            fontSize: '14px',
            fill: '#FFFFFF',
            fontFamily: 'Arial Black'
        }).setOrigin(0.5);

        const btnZone = this.add.rectangle(x, y, btnWidth, btnHeight, 0x000000, 0)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', callback)
            .on('pointerover', () => {
                btnGraphics.clear();
                btnGraphics.fillStyle(color, 0.8);
                btnGraphics.fillRoundedRect(x - btnWidth/2, y - btnHeight/2, btnWidth, btnHeight, 8);
            })
            .on('pointerout', () => {
                btnGraphics.clear();
                btnGraphics.fillStyle(color, 1);
                btnGraphics.fillRoundedRect(x - btnWidth/2, y - btnHeight/2, btnWidth, btnHeight, 8);
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
