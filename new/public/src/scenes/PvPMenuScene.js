// ==================== PVP MENU SCENE ====================
// Объединённое меню для дуэлей и 1v1 онлайн
class PvPMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PvPMenuScene' });
    }

    create() {
        // Фон
        this.add.rectangle(0, 0, CONSTS.WIDTH, CONSTS.HEIGHT, 0x1a1a2e).setOrigin(0);
        
        // Заголовок
        this.add.text(CONSTS.WIDTH / 2, 60, '⚔️ PvP Режимы', {
            fontSize: '32px',
            fill: '#FFD700',
            fontFamily: 'Arial Black',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Описание
        this.add.text(CONSTS.WIDTH / 2, 110, 'Выбери режим соревнования', {
            fontSize: '14px',
            fill: '#AAAAAA',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Кнопка 1v1 Онлайн
        this.createPvPButton(
            CONSTS.HEIGHT / 2 - 80,
            '🎮 1v1 Онлайн',
            'Мгновенный матч с рандомным\nигроком в реальном времени',
            0x4CAF50,
            () => this.scene.start('MatchmakingScene')
        );
        
        // Кнопка Дуэли
        this.createPvPButton(
            CONSTS.HEIGHT / 2 + 60,
            '🎯 Дуэли',
            'Вызови друга по ссылке!\nИграйте когда удобно',
            0x2196F3,
            () => this.scene.start('DuelHistoryScene')
        );
        
        // Кнопка назад
        const backBtn = this.add.text(CONSTS.WIDTH / 2, CONSTS.HEIGHT - 60, '← Назад', {
            fontSize: '20px',
            fill: '#FFFFFF',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        backBtn.on('pointerover', () => backBtn.setFill('#FFD700'));
        backBtn.on('pointerout', () => backBtn.setFill('#FFFFFF'));
        // backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
        backBtn.on('pointerdown', () => { window.location.href = '/'; });
    }
    
    createPvPButton(y, title, description, color, callback) {
        // Фон кнопки
        const btnBg = this.add.graphics();
        btnBg.fillStyle(color, 0.3);
        btnBg.fillRoundedRect(30, y - 50, CONSTS.WIDTH - 60, 100, 12);
        btnBg.lineStyle(2, color, 1);
        btnBg.strokeRoundedRect(30, y - 50, CONSTS.WIDTH - 60, 100, 12);
        
        // Интерактивная зона
        const btnZone = this.add.rectangle(CONSTS.WIDTH / 2, y, CONSTS.WIDTH - 60, 100, 0x000000, 0)
            .setInteractive({ useHandCursor: true });
        
        // Заголовок
        const titleText = this.add.text(CONSTS.WIDTH / 2, y - 20, title, {
            fontSize: '22px',
            fill: '#FFFFFF',
            fontFamily: 'Arial Black'
        }).setOrigin(0.5);
        
        // Описание
        this.add.text(CONSTS.WIDTH / 2, y + 18, description, {
            fontSize: '12px',
            fill: '#CCCCCC',
            fontFamily: 'Arial',
            align: 'center'
        }).setOrigin(0.5);
        
        // Hover эффект
        btnZone.on('pointerover', () => {
            btnBg.clear();
            btnBg.fillStyle(color, 0.5);
            btnBg.fillRoundedRect(30, y - 50, CONSTS.WIDTH - 60, 100, 12);
            btnBg.lineStyle(2, color, 1);
            btnBg.strokeRoundedRect(30, y - 50, CONSTS.WIDTH - 60, 100, 12);
        });
        
        btnZone.on('pointerout', () => {
            btnBg.clear();
            btnBg.fillStyle(color, 0.3);
            btnBg.fillRoundedRect(30, y - 50, CONSTS.WIDTH - 60, 100, 12);
            btnBg.lineStyle(2, color, 1);
            btnBg.strokeRoundedRect(30, y - 50, CONSTS.WIDTH - 60, 100, 12);
        });
        
        btnZone.on('pointerdown', callback);
    }
}
