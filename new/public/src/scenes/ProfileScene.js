// ==================== PROFILE SCENE ====================
// Личный кабинет: достижения, награды, инвентарь, кошелёк
class ProfileScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ProfileScene' });
    }

    create() {
        // Фон
        this.add.rectangle(0, 0, CONSTS.WIDTH, CONSTS.HEIGHT, 0x1a1a2e).setOrigin(0);
        
        // Заголовок
        const userData = getTelegramUserId();
        this.add.text(CONSTS.WIDTH / 2, 50, '👤 Личный кабинет', {
            fontSize: '28px',
            fill: '#FFD700',
            fontFamily: 'Arial Black',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Имя пользователя
        this.add.text(CONSTS.WIDTH / 2, 95, `@${userData.username}`, {
            fontSize: '16px',
            fill: '#AAAAAA',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Кнопки личного кабинета
        const profileButtons = [
            { text: '🎯 Достижения', y: 170, color: 0xE91E63, scene: 'AchievementsScene' },
            { text: '💰 Награды', y: 240, color: 0xFFD700, scene: 'DailyRewardScene' },
            { text: '🎒 Инвентарь', y: 310, color: 0x9C27B0, scene: 'InventoryScene' },
            { text: '💎 Кошелёк', y: 380, color: 0x00BCD4, scene: 'WalletScene' },
        ];
        
        profileButtons.forEach(btn => {
            this.createProfileButton(btn.y, btn.text, btn.color, () => this.scene.start(btn.scene));
        });
        
        // Кнопка назад
        const backBtn = this.add.text(CONSTS.WIDTH / 2, CONSTS.HEIGHT - 60, '← Назад в меню', {
            fontSize: '20px',
            fill: '#FFFFFF',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        backBtn.on('pointerover', () => backBtn.setFill('#FFD700'));
        backBtn.on('pointerout', () => backBtn.setFill('#FFFFFF'));
        // backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
        backBtn.on('pointerdown', () => { window.location.href = '/'; });
    }
    
    createProfileButton(y, text, color, callback) {
        // Фон кнопки
        const btnBg = this.add.graphics();
        btnBg.fillStyle(color, 0.25);
        btnBg.fillRoundedRect(40, y - 28, CONSTS.WIDTH - 80, 56, 10);
        btnBg.lineStyle(2, color, 0.8);
        btnBg.strokeRoundedRect(40, y - 28, CONSTS.WIDTH - 80, 56, 10);
        
        // Интерактивная зона
        const btnZone = this.add.rectangle(CONSTS.WIDTH / 2, y, CONSTS.WIDTH - 80, 56, 0x000000, 0)
            .setInteractive({ useHandCursor: true });
        
        // Текст
        const btnText = this.add.text(CONSTS.WIDTH / 2, y, text, {
            fontSize: '20px',
            fill: '#FFFFFF',
            fontFamily: 'Arial Black'
        }).setOrigin(0.5);
        
        // Стрелка
        this.add.text(CONSTS.WIDTH - 60, y, '›', {
            fontSize: '28px',
            fill: '#666666',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Hover эффект
        btnZone.on('pointerover', () => {
            btnBg.clear();
            btnBg.fillStyle(color, 0.4);
            btnBg.fillRoundedRect(40, y - 28, CONSTS.WIDTH - 80, 56, 10);
            btnBg.lineStyle(2, color, 1);
            btnBg.strokeRoundedRect(40, y - 28, CONSTS.WIDTH - 80, 56, 10);
        });
        
        btnZone.on('pointerout', () => {
            btnBg.clear();
            btnBg.fillStyle(color, 0.25);
            btnBg.fillRoundedRect(40, y - 28, CONSTS.WIDTH - 80, 56, 10);
            btnBg.lineStyle(2, color, 0.8);
            btnBg.strokeRoundedRect(40, y - 28, CONSTS.WIDTH - 80, 56, 10);
        });
        
        btnZone.on('pointerdown', callback);
    }
}
