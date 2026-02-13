// ==================== MATCHMAKING SCENE ====================
// Сцена поиска оппонента для 1v1 режима
class MatchmakingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MatchmakingScene' });
        this.socket = null;
        this.userData = null;
        this.searchingText = null;
        this.dots = '';
        this.dotTimer = null;
    }
    
    create() {
        // Фон
        this.background = this.add.image(0, 0, 'background_img').setOrigin(0, 0);
        this.background.setDisplaySize(CONSTS.WIDTH, CONSTS.HEIGHT);
        
        // Заголовок
        this.add.text(CONSTS.WIDTH / 2, CONSTS.HEIGHT / 4, '1v1 Онлайн', {
            fontSize: '42px',
            fill: '#FFFFFF',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        
        // Статус поиска
        this.searchingText = this.add.text(CONSTS.WIDTH / 2, CONSTS.HEIGHT / 2, 'Поиск соперника', {
            fontSize: '32px',
            fill: '#FFFFFF',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Анимация точек
        this.dotTimer = this.time.addEvent({
            delay: 500,
            callback: () => {
                this.dots = this.dots.length >= 3 ? '' : this.dots + '.';
                this.searchingText.setText('Поиск соперника' + this.dots);
            },
            loop: true
        });
        
        // Кнопка отмены
        const cancelGraphics = this.add.graphics();
        cancelGraphics.fillStyle(0xFF0000, 1);
        cancelGraphics.fillRoundedRect(CONSTS.WIDTH / 2 - 80, CONSTS.HEIGHT - 120, 160, 50, 8);
        
        const cancelZone = this.add.rectangle(CONSTS.WIDTH / 2, CONSTS.HEIGHT - 95, 160, 50, 0x000000, 0)
            .setInteractive({ useHandCursor: true });
        
        const cancelButton = this.add.text(CONSTS.WIDTH / 2, CONSTS.HEIGHT - 95, 'Отмена', {
            fontSize: '28px',
            fill: '#FFFFFF',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        cancelZone.on('pointerdown', () => {
            this.cancelMatchmaking();
            // this.scene.start('MenuScene'); // was via cancelMatchmaking
            window.location.href = '/';
        });
        
        // Подключаемся к серверу
        this.connectToServer();
    }
    
    connectToServer() {
        // Получаем данные пользователя
        this.userData = getTelegramUserId();
        
        // Подключаемся к Socket.IO серверу
        const socketUrl = SERVER_URL || window.location.origin;
        console.log('🔌 Подключение к серверу:', socketUrl);
        console.log('👤 Мои данные:', this.userData);
        
        this.socket = io(socketUrl);
        
        this.socket.on('connect', () => {
            console.log('✅ Подключено к серверу Socket.IO:', this.socket.id);
            console.log('📤 Отправляю данные для матчмейкинга:', {
                userId: this.userData.id,
                username: this.userData.username
            });
            
            // Начинаем поиск матча
            this.socket.emit('findMatch', {
                userId: this.userData.id,
                username: this.userData.username
            });
        });
        
        this.socket.on('searching', (data) => {
            console.log('🔍 Поиск... Игроков в очереди:', data.queueSize);
        });
        
        this.socket.on('gameStart', (data) => {
            console.log('🎮 Игра началась!', data);
            console.log('🆚 Мой ID:', this.userData.id);
            console.log('🆚 ID оппонента:', data.opponent?.id);
            console.log('⚠️ ПРОВЕРКА: Это один и тот же игрок?', this.userData.id === data.opponent?.id);
            
            // Останавливаем таймер точек
            if (this.dotTimer) {
                this.dotTimer.remove();
            }
            
            // Переходим в GameScene с параметрами 1v1
            this.scene.start('GameScene', {
                mode: '1v1',
                seed: data.seed,
                roomId: data.roomId,
                opponent: data.opponent,
                socket: this.socket
            });
        });
        
        this.socket.on('countdown', (seconds) => {
            this.searchingText.setText(`Игра начнётся через ${seconds}...`);
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('❌ Ошибка подключения:', error);
            this.searchingText.setText('Ошибка подключения!\nВозврат в меню...');
            
            this.time.delayedCall(2000, () => {
                this.scene.start('MenuScene');
            });
        });
    }
    
    cancelMatchmaking() {
        console.log('❌ Отмена поиска матча');
        
        if (this.socket) {
            this.socket.emit('cancelMatch');
            this.socket.disconnect();
        }
        
        if (this.dotTimer) {
            this.dotTimer.remove();
        }
        
        this.scene.start('MenuScene');
    }
    
    shutdown() {
        // Очистка при выходе из сцены
        if (this.dotTimer) {
            this.dotTimer.remove();
        }
    }
}
