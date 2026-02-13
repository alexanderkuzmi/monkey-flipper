// ==================== LEADERBOARD SCENE ====================
// Встроенный лидерборд без выхода из приложения
class LeaderboardScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LeaderboardScene' });
        this.leaderboardData = [];
        this.loadingText = null;
    }
    
    create() {
        // Фон
        this.background = this.add.image(0, 0, 'background_img').setOrigin(0, 0);
        this.background.setDisplaySize(CONSTS.WIDTH, CONSTS.HEIGHT);
        
        // Заголовок - КОМПАКТНЕЕ
        this.add.text(CONSTS.WIDTH / 2, 40, '🏆 РЕЙТИНГ', {
            fontSize: '32px',
            fill: '#FFD700',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Статус загрузки
        this.loadingText = this.add.text(CONSTS.WIDTH / 2, CONSTS.HEIGHT / 2, '⏳ Загрузка...', {
            fontSize: '20px',
            fill: '#FFFFFF',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Кнопка "Назад"
        this.createBackButton();
        
        // Загружаем данные
        this.loadLeaderboard();
    }
    
    createBackButton() {
        const buttonY = CONSTS.HEIGHT - 35;
        
        const backGraphics = this.add.graphics();
        backGraphics.fillStyle(0x2196F3, 1);
        backGraphics.fillRoundedRect(CONSTS.WIDTH / 2 - 70, buttonY - 18, 140, 36, 8);
        
        const backZone = this.add.rectangle(CONSTS.WIDTH / 2, buttonY, 140, 36, 0x000000, 0)
            .setInteractive({ useHandCursor: true });
        
        const backText = this.add.text(CONSTS.WIDTH / 2, buttonY, '← Назад', {
            fontSize: '20px',
            fill: '#FFF',
            fontFamily: 'Arial Black'
        }).setOrigin(0.5);
        
        backZone.on('pointerdown', () => {
            console.log('🔙 Возврат в меню');
            this.scene.start('MenuScene');
        });
    }
    
    async loadLeaderboard() {
        try {
            const response = await fetch(`${API_SERVER_URL}/api/leaderboard?limit=20`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error('Failed to load leaderboard');
            }
            
            this.leaderboardData = data.rows || [];
            this.displayLeaderboard();
            
        } catch (error) {
            console.error('❌ Ошибка загрузки рейтинга:', error);
            this.loadingText.setText('❌ Ошибка загрузки');
        }
    }
    
    displayLeaderboard() {
        // Удаляем loading text
        if (this.loadingText) {
            this.loadingText.destroy();
        }
        
        if (this.leaderboardData.length === 0) {
            this.add.text(CONSTS.WIDTH / 2, CONSTS.HEIGHT / 2, 'Пока нет записей', {
                fontSize: '20px',
                fill: '#FFFFFF',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
            return;
        }
        
        // Создаем компактный список для телефона
        const startY = 90;
        const rowHeight = 38;
        const maxVisible = 12;
        
        this.leaderboardData.slice(0, maxVisible).forEach((player, index) => {
            const rank = index + 1;
            const y = startY + index * rowHeight;
            
            // Фон строки - компактнее
            const rowBg = this.add.graphics();
            rowBg.fillStyle(index % 2 === 0 ? 0x333333 : 0x222222, 0.7);
            rowBg.fillRoundedRect(15, y - 15, CONSTS.WIDTH - 30, 32, 5);
            
            // Место - меньше
            let rankText = `${rank}`;
            let rankColor = '#FFFFFF';
            if (rank === 1) {
                rankText = '🥇';
                rankColor = '#FFD700';
            } else if (rank === 2) {
                rankText = '🥈';
                rankColor = '#C0C0C0';
            } else if (rank === 3) {
                rankText = '🥉';
                rankColor = '#CD7F32';
            }
            
            this.add.text(30, y, rankText, {
                fontSize: '16px',
                fill: rankColor,
                fontFamily: 'Arial Black'
            }).setOrigin(0, 0.5);
            
            // Имя игрока - короче
            const username = player.username || 'Anonymous';
            this.add.text(70, y, username.length > 12 ? username.substring(0, 12) + '...' : username, {
                fontSize: '15px',
                fill: '#FFFFFF',
                fontFamily: 'Arial'
            }).setOrigin(0, 0.5);
            
            // Счет - меньше
            this.add.text(CONSTS.WIDTH - 25, y, player.score.toLocaleString(), {
                fontSize: '16px',
                fill: '#00FF00',
                fontFamily: 'Arial Black'
            }).setOrigin(1, 0.5);
        });
        
        // Показываем количество игроков - меньше текст
        this.add.text(CONSTS.WIDTH / 2, CONSTS.HEIGHT - 60, 
            `Всего игроков: ${this.leaderboardData.length}`, {
            fontSize: '13px',
            fill: '#AAAAAA',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }
}
