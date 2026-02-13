
// ==================== TOURNAMENT SCENE ====================
class TournamentScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TournamentScene' });
        this.tournaments = [];
        this.myTournaments = [];
    }

    async create() {
        const userData = getTelegramUserId();

        // Фон
        this.background = this.add.image(0, 0, 'background_img_menu').setOrigin(0, 0);
        this.background.setDisplaySize(CONSTS.WIDTH, CONSTS.HEIGHT);

        // Градиентный оверлей для затемнения фона
        const overlay = this.add.rectangle(CONSTS.WIDTH / 2, CONSTS.HEIGHT / 2, CONSTS.WIDTH, CONSTS.HEIGHT, 0x000000, 0.6);

        // Заголовок с тенью
        this.add.text(CONSTS.WIDTH / 2, 45, '🏆 ТУРНИРЫ', {
            fontSize: '40px',
            fill: '#FFD700',
            fontFamily: 'Arial Black',
            stroke: '#8B4513',
            strokeThickness: 6,
            shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 8, fill: true }
        }).setOrigin(0.5);

        // Подзаголовок
        this.add.text(CONSTS.WIDTH / 2, 85, 'Соревнуйтесь за реальные призы в TON!', {
            fontSize: '15px',
            fill: '#FFFFFF',
            fontFamily: 'Arial',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Кнопка "Назад"
        this.createBackButton();

        // Табы
        const tabY = 130;
        this.activeTab = 'active';
        this.activeTabButton = this.createTab('🔥 Активные', 90, tabY, true, () => this.switchTab('active'));
        this.myTabButton = this.createTab('📋 Мои', CONSTS.WIDTH - 90, tabY, false, () => this.switchTab('my'));

        // Контейнер для списка турниров
        this.tournamentsContainer = this.add.container(0, 180);

        // Загружаем активные турниры по умолчанию
        await this.loadActiveTournaments(userData.id);
        this.showActiveTournaments();
    }

    createTab(text, x, y, active, callback) {
        const width = 140;
        const height = 45;
        
        // Фон кнопки с закругленными углами (через графику)
        const graphics = this.add.graphics();
        graphics.fillStyle(active ? 0xFF6B35 : 0x34495E, 1);
        graphics.fillRoundedRect(x - width/2, y - height/2, width, height, 10);
        
        // Обводка
        graphics.lineStyle(3, active ? 0xFFFFFF : 0x7F8C8D, 1);
        graphics.strokeRoundedRect(x - width/2, y - height/2, width, height, 10);
        
        graphics.setInteractive(new Phaser.Geom.Rectangle(x - width/2, y - height/2, width, height), Phaser.Geom.Rectangle.Contains);
        graphics.input.cursor = 'pointer';

        const txt = this.add.text(x, y, text, {
            fontSize: '16px',
            fill: '#FFFFFF',
            fontFamily: 'Arial Black',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5);

        graphics.on('pointerdown', callback);
        
        return { graphics, txt, x, y, active, width, height };
    }

    switchTab(tab) {
        if (this.activeTab === tab) return;
        
        this.activeTab = tab;
        
        // Обновляем визуал табов
        this.updateTabStyles();
        
        // Показываем соответствующий контент
        if (tab === 'active') {
            this.showActiveTournaments();
        } else {
            this.showMyTournaments();
        }
    }

    updateTabStyles() {
        // Перерисовываем табы
        const isActiveTab = this.activeTab === 'active';
        
        // Активные
        this.activeTabButton.graphics.clear();
        this.activeTabButton.graphics.fillStyle(isActiveTab ? 0xFF6B35 : 0x34495E, 1);
        this.activeTabButton.graphics.fillRoundedRect(
            this.activeTabButton.x - this.activeTabButton.width/2, 
            this.activeTabButton.y - this.activeTabButton.height/2, 
            this.activeTabButton.width, 
            this.activeTabButton.height, 
            10
        );
        this.activeTabButton.graphics.lineStyle(3, isActiveTab ? 0xFFFFFF : 0x7F8C8D, 1);
        this.activeTabButton.graphics.strokeRoundedRect(
            this.activeTabButton.x - this.activeTabButton.width/2, 
            this.activeTabButton.y - this.activeTabButton.height/2, 
            this.activeTabButton.width, 
            this.activeTabButton.height, 
            10
        );
        
        // Мои
        this.myTabButton.graphics.clear();
        this.myTabButton.graphics.fillStyle(!isActiveTab ? 0xFF6B35 : 0x34495E, 1);
        this.myTabButton.graphics.fillRoundedRect(
            this.myTabButton.x - this.myTabButton.width/2, 
            this.myTabButton.y - this.myTabButton.height/2, 
            this.myTabButton.width, 
            this.myTabButton.height, 
            10
        );
        this.myTabButton.graphics.lineStyle(3, !isActiveTab ? 0xFFFFFF : 0x7F8C8D, 1);
        this.myTabButton.graphics.strokeRoundedRect(
            this.myTabButton.x - this.myTabButton.width/2, 
            this.myTabButton.y - this.myTabButton.height/2, 
            this.myTabButton.width, 
            this.myTabButton.height, 
            10
        );
    }

    async loadActiveTournaments(userId) {
        try {
            const response = await fetch(`${API_SERVER_URL}/api/tournaments/active`);
            const data = await response.json();

            if (data.success) {
                this.tournaments = data.tournaments || [];
                console.log('✅ Loaded tournaments:', this.tournaments.length);
            }
        } catch (error) {
            console.error('❌ Error loading tournaments:', error);
        }
    }

    async loadMyTournaments(userId) {
        try {
            const response = await fetch(`${API_SERVER_URL}/api/tournaments/my/${userId}`);
            const data = await response.json();

            if (data.success) {
                this.myTournaments = data.tournaments || [];
                console.log('✅ Loaded my tournaments:', this.myTournaments.length);
            }
        } catch (error) {
            console.error('❌ Error loading my tournaments:', error);
        }
    }

    showActiveTournaments() {
        this.tournamentsContainer.removeAll(true);

        if (this.tournaments.length === 0) {
            const emptyText = this.add.text(CONSTS.WIDTH / 2, CONSTS.HEIGHT / 2, 'Нет активных турниров\n\n🔜 Скоро появятся!', {
                fontSize: '20px',
                fill: '#ECF0F1',
                align: 'center',
                fontFamily: 'Arial',
                stroke: '#000',
                strokeThickness: 3
            }).setOrigin(0.5);
            this.tournamentsContainer.add(emptyText);
            return;
        }

        let yOffset = 0;

        this.tournaments.forEach((tournament) => {
            const card = this.createTournamentCard(tournament, yOffset);
            this.tournamentsContainer.add(card);
            yOffset += 170; // Увеличил отступ между карточками
        });
    }

    async showMyTournaments() {
        const userData = getTelegramUserId();
        await this.loadMyTournaments(userData.id);

        this.tournamentsContainer.removeAll(true);

        if (this.myTournaments.length === 0) {
            const txt = this.add.text(CONSTS.WIDTH / 2, CONSTS.HEIGHT / 2, 'Вы еще не участвуете\nни в одном турнире', {
                fontSize: '18px',
                fill: '#AAAAAA',
                align: 'center'
            }).setOrigin(0.5);
            this.tournamentsContainer.add(txt);
            return;
        }

        let yOffset = 0;

        this.myTournaments.forEach((tournament) => {
            const card = this.createMyTournamentCard(tournament, yOffset);
            this.tournamentsContainer.add(card);
            yOffset += 140;
        });
    }

    createTournamentCard(tournament, yOffset) {
        const container = this.add.container(CONSTS.WIDTH / 2, yOffset);
        const cardWidth = CONSTS.WIDTH - 40;
        const cardHeight = 150;

        // Графика для закругленной карточки
        const cardGraphics = this.add.graphics();
        
        // Тень
        cardGraphics.fillStyle(0x000000, 0.3);
        cardGraphics.fillRoundedRect(-cardWidth/2 + 5, -cardHeight/2 + 5, cardWidth, cardHeight, 15);
        
        // Основной фон
        cardGraphics.fillStyle(0x1E2732, 1);
        cardGraphics.fillRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 15);
        
        // Золотая обводка
        cardGraphics.lineStyle(3, 0xFFD700, 1);
        cardGraphics.strokeRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 15);
        
        container.add(cardGraphics);

        // Название турнира
        const name = this.add.text(-cardWidth/2 + 15, -cardHeight/2 + 15, tournament.name || 'Weekly Tournament', {
            fontSize: '22px',
            fill: '#FFD700',
            fontFamily: 'Arial Black',
            stroke: '#000',
            strokeThickness: 4,
            wordWrap: { width: cardWidth - 30 }
        });
        
        // Призовой фонд (большой и заметный)
        const prizeAmount = parseFloat(tournament.prize_pool_ton).toFixed(2);
        const prizeText = this.add.text(-cardWidth/2 + 15, -cardHeight/2 + 45, `💰 ${prizeAmount} TON`, {
            fontSize: '18px',
            fill: '#2ECC71',
            fontFamily: 'Arial Black',
            stroke: '#000',
            strokeThickness: 3
        });

        // Вступительный взнос
        const entryAmount = parseFloat(tournament.entry_fee_ton).toFixed(2);
        const entryText = this.add.text(-cardWidth/2 + 15, -cardHeight/2 + 68, `🎫 Взнос: ${entryAmount} TON`, {
            fontSize: '15px',
            fill: '#E74C3C',
            fontFamily: 'Arial',
            stroke: '#000',
            strokeThickness: 2
        });

        // Участники
        const participantsText = this.add.text(-cardWidth/2 + 15, -cardHeight/2 + 90, `👥 ${tournament.current_participants}/${tournament.max_participants || '∞'}`, {
            fontSize: '14px',
            fill: '#ECF0F1',
            fontFamily: 'Arial',
            stroke: '#000',
            strokeThickness: 2
        });

        // Время до конца (правый верхний угол)
        const timeRemaining = this.formatTimeRemaining(tournament.seconds_until_end || 0);
        const timeText = this.add.text(cardWidth/2 - 15, -cardHeight/2 + 15, `⏰ ${timeRemaining}`, {
            fontSize: '14px',
            fill: '#F39C12',
            fontFamily: 'Arial Black',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(1, 0);

        // Кнопка "Лидерборд" (стильная)
        const btnY = cardHeight/2 - 25;
        const leaderboardGraphics = this.add.graphics();
        leaderboardGraphics.fillStyle(0x3498DB, 1);
        leaderboardGraphics.fillRoundedRect(-cardWidth/2 + 15, btnY - 20, 100, 40, 8);
        leaderboardGraphics.lineStyle(2, 0xFFFFFF, 1);
        leaderboardGraphics.strokeRoundedRect(-cardWidth/2 + 15, btnY - 20, 100, 40, 8);
        leaderboardGraphics.setInteractive(new Phaser.Geom.Rectangle(-cardWidth/2 + 15, btnY - 20, 100, 40), Phaser.Geom.Rectangle.Contains);
        leaderboardGraphics.input.cursor = 'pointer';

        const leaderboardText = this.add.text(-cardWidth/2 + 65, btnY, '📊 ТОП', {
            fontSize: '16px',
            fill: '#FFFFFF',
            fontFamily: 'Arial Black',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5);

        leaderboardGraphics.on('pointerdown', () => this.showLeaderboard(tournament));
        leaderboardGraphics.on('pointerover', () => {
            leaderboardGraphics.clear();
            leaderboardGraphics.fillStyle(0x5DADE2, 1);
            leaderboardGraphics.fillRoundedRect(-cardWidth/2 + 15, btnY - 20, 100, 40, 8);
            leaderboardGraphics.lineStyle(2, 0xFFFFFF, 1);
            leaderboardGraphics.strokeRoundedRect(-cardWidth/2 + 15, btnY - 20, 100, 40, 8);
        });
        leaderboardGraphics.on('pointerout', () => {
            leaderboardGraphics.clear();
            leaderboardGraphics.fillStyle(0x3498DB, 1);
            leaderboardGraphics.fillRoundedRect(-cardWidth/2 + 15, btnY - 20, 100, 40, 8);
            leaderboardGraphics.lineStyle(2, 0xFFFFFF, 1);
            leaderboardGraphics.strokeRoundedRect(-cardWidth/2 + 15, btnY - 20, 100, 40, 8);
        });

        // Кнопка "Вступить" (большая и яркая)
        const joinBtnColor = tournament.isFull ? 0x7F8C8D : 0x27AE60;
        const joinGraphics = this.add.graphics();
        joinGraphics.fillStyle(joinBtnColor, 1);
        joinGraphics.fillRoundedRect(-cardWidth/2 + 125, btnY - 20, 110, 40, 8);
        joinGraphics.lineStyle(3, tournament.isFull ? 0x95A5A6 : 0xFFD700, 1);
        joinGraphics.strokeRoundedRect(-cardWidth/2 + 125, btnY - 20, 110, 40, 8);
        
        if (!tournament.isFull) {
            joinGraphics.setInteractive(new Phaser.Geom.Rectangle(-cardWidth/2 + 125, btnY - 20, 110, 40), Phaser.Geom.Rectangle.Contains);
            joinGraphics.input.cursor = 'pointer';
        }

        const joinText = this.add.text(-cardWidth/2 + 180, btnY, tournament.isFull ? '❌ FULL' : '✅ JOIN', {
            fontSize: '18px',
            fill: '#FFFFFF',
            fontFamily: 'Arial Black',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);

        if (!tournament.isFull) {
            joinGraphics.on('pointerdown', () => this.joinTournament(tournament));
            joinGraphics.on('pointerover', () => {
                joinGraphics.clear();
                joinGraphics.fillStyle(0x2ECC71, 1);
                joinGraphics.fillRoundedRect(-cardWidth/2 + 125, btnY - 20, 110, 40, 8);
                joinGraphics.lineStyle(3, 0xFFD700, 1);
                joinGraphics.strokeRoundedRect(-cardWidth/2 + 125, btnY - 20, 110, 40, 8);
            });
            joinGraphics.on('pointerout', () => {
                joinGraphics.clear();
                joinGraphics.fillStyle(0x27AE60, 1);
                joinGraphics.fillRoundedRect(-cardWidth/2 + 125, btnY - 20, 110, 40, 8);
                joinGraphics.lineStyle(3, 0xFFD700, 1);
                joinGraphics.strokeRoundedRect(-cardWidth/2 + 125, btnY - 20, 110, 40, 8);
            });
        }

        container.add([name, prizeText, entryText, participantsText, timeText, leaderboardGraphics, leaderboardText, joinGraphics, joinText]);

        return container;
    }

    createMyTournamentCard(tournament, yOffset) {
        const container = this.add.container(CONSTS.WIDTH / 2, yOffset);
        const cardWidth = CONSTS.WIDTH - 40;
        const cardHeight = 140;

        // Графика для карточки
        const cardGraphics = this.add.graphics();
        
        // Тень
        cardGraphics.fillStyle(0x000000, 0.3);
        cardGraphics.fillRoundedRect(-cardWidth/2 + 5, -cardHeight/2 + 5, cardWidth, cardHeight, 15);
        
        // Основной фон (другой цвет для "Моих" турниров)
        cardGraphics.fillStyle(0x283747, 1);
        cardGraphics.fillRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 15);
        
        // Синяя обводка для моих турниров
        cardGraphics.lineStyle(3, 0x3498DB, 1);
        cardGraphics.strokeRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 15);
        
        container.add(cardGraphics);

        // Название
        const name = this.add.text(-cardWidth/2 + 15, -cardHeight/2 + 15, tournament.name || 'Tournament', {
            fontSize: '20px',
            fill: '#FFD700',
            fontFamily: 'Arial Black',
            stroke: '#000',
            strokeThickness: 4,
            wordWrap: { width: cardWidth - 140 }
        });

        // Мое место (крупно и заметно)
        const placeColor = tournament.current_place === 1 ? '#FFD700' : 
                          tournament.current_place === 2 ? '#C0C0C0' : 
                          tournament.current_place === 3 ? '#CD7F32' : '#3498DB';
        const placeEmoji = tournament.current_place === 1 ? '🥇' : 
                          tournament.current_place === 2 ? '🥈' : 
                          tournament.current_place === 3 ? '🥉' : '📍';
        
        const place = this.add.text(-cardWidth/2 + 15, -cardHeight/2 + 45, `${placeEmoji} Место: ${tournament.current_place || '-'}`, {
            fontSize: '18px',
            fill: placeColor,
            fontFamily: 'Arial Black',
            stroke: '#000',
            strokeThickness: 3
        });

        // Лучший счет
        const score = this.add.text(-cardWidth/2 + 15, -cardHeight/2 + 70, `🎯 Лучший счет: ${tournament.best_score || 0}`, {
            fontSize: '16px',
            fill: '#2ECC71',
            fontFamily: 'Arial',
            stroke: '#000',
            strokeThickness: 2
        });

        // Попытки
        const attempts = this.add.text(-cardWidth/2 + 15, -cardHeight/2 + 93, `🎮 Попыток: ${tournament.attempts || 0}`, {
            fontSize: '14px',
            fill: '#ECF0F1',
            fontFamily: 'Arial',
            stroke: '#000',
            strokeThickness: 2
        });

        // Статус (правый верхний угол)
        const statusText = tournament.status === 'finished' ? '✅ Завершен' : '🔥 Активен';
        const statusColor = tournament.status === 'finished' ? '#95A5A6' : '#E67E22';
        const status = this.add.text(cardWidth/2 - 15, -cardHeight/2 + 15, statusText, {
            fontSize: '15px',
            fill: statusColor,
            fontFamily: 'Arial Black',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(1, 0);

        // Кнопка "Играть" (если турнир активен)
        if (tournament.status !== 'finished') {
            const btnY = cardHeight/2 - 25;
            const playGraphics = this.add.graphics();
            playGraphics.fillStyle(0xFF6B35, 1);
            playGraphics.fillRoundedRect(-cardWidth/2 + 15, btnY - 20, 120, 40, 8);
            playGraphics.lineStyle(3, 0xFFD700, 1);
            playGraphics.strokeRoundedRect(-cardWidth/2 + 15, btnY - 20, 120, 40, 8);
            playGraphics.setInteractive(new Phaser.Geom.Rectangle(-cardWidth/2 + 15, btnY - 20, 120, 40), Phaser.Geom.Rectangle.Contains);
            playGraphics.input.cursor = 'pointer';

            const playText = this.add.text(-cardWidth/2 + 75, btnY, '🎮 ИГРАТЬ', {
                fontSize: '18px',
                fill: '#FFFFFF',
                fontFamily: 'Arial Black',
                stroke: '#000',
                strokeThickness: 4
            }).setOrigin(0.5);

            playGraphics.on('pointerdown', () => this.playTournament(tournament));
            playGraphics.on('pointerover', () => {
                playGraphics.clear();
                playGraphics.fillStyle(0xFF8C5A, 1);
                playGraphics.fillRoundedRect(-cardWidth/2 + 15, btnY - 20, 120, 40, 8);
                playGraphics.lineStyle(3, 0xFFD700, 1);
                playGraphics.strokeRoundedRect(-cardWidth/2 + 15, btnY - 20, 120, 40, 8);
            });
            playGraphics.on('pointerout', () => {
                playGraphics.clear();
                playGraphics.fillStyle(0xFF6B35, 1);
                playGraphics.fillRoundedRect(-cardWidth/2 + 15, btnY - 20, 120, 40, 8);
                playGraphics.lineStyle(3, 0xFFD700, 1);
                playGraphics.strokeRoundedRect(-cardWidth/2 + 15, btnY - 20, 120, 40, 8);
            });

            container.add([playGraphics, playText]);
        }

        container.add([name, place, score, attempts, status]);

        return container;
    }

    async joinTournament(tournament) {
        const userData = getTelegramUserId();

        try {
            const response = await fetch(`${API_SERVER_URL}/api/tournaments/${tournament.id}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userData.id,
                    username: userData.username,
                    autoRenew: false
                })
            });

            const data = await response.json();

            if (data.success) {
                console.log('✅ Joined tournament:', tournament.id);
                alert(`Вы вступили в турнир!\nВзнос: ${tournament.entry_fee_ton} TON`);
                this.scene.restart();
            } else {
                console.error('❌ Join failed:', data.error);
                alert(`Ошибка: ${data.error}`);
            }
        } catch (error) {
            console.error('❌ Join tournament error:', error);
            alert('Ошибка подключения к серверу');
        }
    }

    playTournament(tournament) {
        // Сохраняем ID турнира для отправки результата
        localStorage.setItem('currentTournamentId', tournament.id);
        
        // Запускаем игру
        this.scene.start('GameScene');
    }

    formatTimeRemaining(seconds) {
        if (seconds <= 0) return 'Завершен';

        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (days > 0) return `${days}д ${hours}ч`;
        if (hours > 0) return `${hours}ч ${minutes}м`;
        return `${minutes}м`;
    }

    async showLeaderboard(tournament) {
        try {
            const response = await fetch(`${API_SERVER_URL}/api/tournaments/${tournament.id}`);
            const data = await response.json();

            if (!data.success) {
                alert('Ошибка загрузки лидерборда');
                return;
            }

            // Создаем модальное окно с лидербордом
            const overlay = this.add.rectangle(CONSTS.WIDTH / 2, CONSTS.HEIGHT / 2, CONSTS.WIDTH, CONSTS.HEIGHT, 0x000000, 0.8)
                .setInteractive()
                .setDepth(2000);

            const panel = this.add.rectangle(CONSTS.WIDTH / 2, CONSTS.HEIGHT / 2, CONSTS.WIDTH - 40, CONSTS.HEIGHT - 100, 0x2C3E50, 1)
                .setDepth(2001);

            // Заголовок
            const title = this.add.text(CONSTS.WIDTH / 2, 70, '🏆 ЛИДЕРБОРД', {
                fontSize: '28px',
                fill: '#FFD700',
                fontFamily: 'Arial Black'
            }).setOrigin(0.5).setDepth(2002);

            const subtitle = this.add.text(CONSTS.WIDTH / 2, 100, tournament.name, {
                fontSize: '16px',
                fill: '#CCCCCC'
            }).setOrigin(0.5).setDepth(2002);

            // Список игроков
            let yPos = 140;
            data.leaderboard.slice(0, 10).forEach((player, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                const color = index < 3 ? '#FFD700' : '#FFFFFF';

                const playerText = this.add.text(40, yPos, 
                    `${medal} ${player.username}: ${player.best_score}`, 
                    {
                        fontSize: '18px',
                        fill: color,
                        fontFamily: 'Arial'
                    }
                ).setDepth(2002);

                yPos += 35;
            });

            // Кнопка закрыть
            const closeBtn = this.add.rectangle(CONSTS.WIDTH / 2, CONSTS.HEIGHT - 60, 120, 45, 0xE74C3C, 1)
                .setInteractive({ useHandCursor: true })
                .setDepth(2002);

            const closeText = this.add.text(CONSTS.WIDTH / 2, CONSTS.HEIGHT - 60, 'Закрыть', {
                fontSize: '18px',
                fill: '#FFFFFF',
                fontFamily: 'Arial Black'
            }).setOrigin(0.5).setDepth(2002);

            closeBtn.on('pointerdown', () => {
                [overlay, panel, title, subtitle, closeBtn, closeText].forEach(obj => obj.destroy());
                this.children.list.filter(obj => obj.depth === 2002).forEach(obj => obj.destroy());
            });

        } catch (error) {
            console.error('❌ Error loading leaderboard:', error);
            alert('Ошибка подключения к серверу');
        }
    }

    createBackButton() {
        const backBtn = this.add.rectangle(50, CONSTS.HEIGHT - 40, 80, 40, 0x34495E, 1)
            .setInteractive({ useHandCursor: true });

        const backText = this.add.text(50, CONSTS.HEIGHT - 40, '← Назад', {
            fontSize: '16px',
            fill: '#FFFFFF',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
        backBtn.on('pointerdown', () => { window.location.href = '/'; });
        backBtn.on('pointerover', () => backBtn.setFillStyle(0x4A6278));
        backBtn.on('pointerout', () => backBtn.setFillStyle(0x34495E));
    }
}
