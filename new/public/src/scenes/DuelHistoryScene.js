// ==================== DUEL HISTORY SCENE ====================
// Сцена истории дуэлей и создания вызовов
class DuelHistoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DuelHistoryScene' });
    }
    
    create() {
        const userData = getTelegramUserId();
        
        // Адаптивные размеры
        const padding = 20;
        const buttonWidth = Math.min(CONSTS.WIDTH - padding * 2, 320);
        const buttonHeight = 55;
        
        // Фон с градиентом
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
        bg.fillRect(0, 0, CONSTS.WIDTH, CONSTS.HEIGHT);
        
        // Заголовок - компактный
        this.add.text(CONSTS.WIDTH / 2, 45, '⚔️ ДУЭЛИ', {
            fontSize: '36px',
            fill: '#FFD700',
            fontFamily: 'Arial Black',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Подзаголовок
        this.add.text(CONSTS.WIDTH / 2, 80, 'Вызови друга на поединок!', {
            fontSize: '14px',
            fill: '#aaaaaa',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // === КНОПКИ ДЕЙСТВИЙ ===
        let btnY = 120;
        
        // Кнопка "Создать вызов" - главная
        this.createButton(
            CONSTS.WIDTH / 2, btnY,
            buttonWidth, buttonHeight + 5,
            '🎯 Создать вызов',
            0xFF6B35, 0xFF8C5A,
            () => this.createDuelChallenge(userData),
            '22px'
        );
        
        btnY += buttonHeight + 15;
        
        // Кнопка "Принять вызов"
        this.createButton(
            CONSTS.WIDTH / 2, btnY,
            buttonWidth, buttonHeight - 5,
            '✅ Принять вызов по ID',
            0x27ae60, 0x2ecc71,
            () => this.showAcceptDialog(userData),
            '18px'
        );
        
        btnY += buttonHeight + 10;
        
        // Разделитель
        const dividerY = btnY + 5;
        this.add.rectangle(CONSTS.WIDTH / 2, dividerY, buttonWidth, 2, 0x444466);
        this.add.text(CONSTS.WIDTH / 2, dividerY, '  История  ', {
            fontSize: '12px',
            fill: '#666688',
            fontFamily: 'Arial',
            backgroundColor: '#1a1a2e'
        }).setOrigin(0.5);
        
        btnY += 25;
        
        // === ЗОНА ИСТОРИИ ДУЭЛЕЙ ===
        const historyStartY = btnY;
        const historyHeight = CONSTS.HEIGHT - historyStartY - 80;
        
        // Контейнер для истории дуэлей
        this.historyContainer = this.add.container(0, historyStartY);
        this.historyScrollY = 0;
        this.maxScrollY = 0;
        
        // Маска для обрезки содержимого
        const maskShape = this.make.graphics();
        maskShape.fillStyle(0xffffff);
        maskShape.fillRect(0, historyStartY, CONSTS.WIDTH, historyHeight);
        this.historyMask = maskShape.createGeometryMask();
        this.historyContainer.setMask(this.historyMask);
        
        // Загружаем историю
        this.loadDuelHistory(userData.id, historyHeight);
        
        // НОВОЕ: Автообновление истории каждые 5 секунд
        // Чтобы создатель видел когда соперник принял вызов
        this.historyRefreshTimer = this.time.addEvent({
            delay: 5000,
            loop: true,
            callback: () => {
                console.log('🔄 Auto-refresh duel history');
                this.loadDuelHistory(userData.id, historyHeight);
            }
        });
        
        // Обработка скролла - свайп и колесо
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            if (pointer.y > historyStartY) {
                this.historyScrollY += deltaY * 0.5;
                this.historyScrollY = Phaser.Math.Clamp(this.historyScrollY, -this.maxScrollY, 0);
                this.historyContainer.y = historyStartY + this.historyScrollY;
            }
        });
        
        // Свайп для мобильных
        let dragStartY = 0;
        let lastDragY = 0;
        this.input.on('pointerdown', (pointer) => {
            if (pointer.y > historyStartY) {
                dragStartY = pointer.y;
                lastDragY = this.historyScrollY;
            }
        });
        this.input.on('pointermove', (pointer) => {
            if (pointer.isDown && dragStartY > historyStartY) {
                const delta = pointer.y - dragStartY;
                this.historyScrollY = lastDragY + delta;
                this.historyScrollY = Phaser.Math.Clamp(this.historyScrollY, -this.maxScrollY, 0);
                this.historyContainer.y = historyStartY + this.historyScrollY;
            }
        });
        
        // === НИЖНЯЯ ПАНЕЛЬ ===
        const bottomY = CONSTS.HEIGHT - 45;
        
        // Фон нижней панели
        this.add.rectangle(CONSTS.WIDTH / 2, bottomY, CONSTS.WIDTH, 70, 0x0f0f1a, 0.95);
        
        // Кнопка "Назад" слева
        this.createButton(
            70, bottomY,
            120, 45,
            '← Назад',
            0x34495e, 0x4a6278,
            () => {
                // Останавливаем автообновление при выходе
                if (this.historyRefreshTimer) this.historyRefreshTimer.remove();
                this.scene.start('MenuScene');
            },
            '16px'
        );
        
        // Кнопка "Очистить" справа
        this.createButton(
            CONSTS.WIDTH - 70, bottomY,
            100, 40,
            '🗑️',
            0x7f8c8d, 0x95a5a6,
            () => this.confirmClearHistory(userData),
            '20px'
        );
    }
    
    // Хелпер для создания кнопок
    createButton(x, y, width, height, text, color, hoverColor, callback, fontSize = '18px') {
        const btn = this.add.rectangle(x, y, width, height, color, 1)
            .setInteractive({ useHandCursor: true });
        
        // Скругленные углы через графику
        const btnBg = this.add.graphics();
        btnBg.fillStyle(color, 1);
        btnBg.fillRoundedRect(x - width/2, y - height/2, width, height, 12);
        
        const btnText = this.add.text(x, y, text, {
            fontSize: fontSize,
            fill: '#FFFFFF',
            fontFamily: 'Arial Black'
        }).setOrigin(0.5);
        
        btn.on('pointerover', () => {
            btnBg.clear();
            btnBg.fillStyle(hoverColor, 1);
            btnBg.fillRoundedRect(x - width/2, y - height/2, width, height, 12);
        });
        btn.on('pointerout', () => {
            btnBg.clear();
            btnBg.fillStyle(color, 1);
            btnBg.fillRoundedRect(x - width/2, y - height/2, width, height, 12);
        });
        btn.on('pointerdown', callback);
        
        return { btn, btnBg, btnText };
    }
    
    async createDuelChallenge(userData) {
        try {
            // Показываем loading
            const loadingText = this.add.text(
                CONSTS.WIDTH / 2, 
                CONSTS.HEIGHT / 2, 
                '⏳ Создание вызова...', 
                {
                    fontSize: '24px',
                    fill: '#FFD700',
                    fontFamily: 'Arial'
                }
            ).setOrigin(0.5);
            
            // Создаем вызов через API
            const response = await fetch(`${API_SERVER_URL}/api/duel/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player1Id: userData.id,
                    player1Username: userData.username,
                    botUsername: 'monkey_test_crypto_bot' // Имя Telegram бота
                })
            });
            
            if (!response.ok) {
                throw new Error('Не удалось создать вызов');
            }
            
            const data = await response.json();
            
            loadingText.destroy();
            
            // НОВАЯ ЛОГИКА: Показываем диалог для отправки ссылки БЕЗ запуска игры
            // Игра начнется только когда соперник примет вызов
            this.showShareDialog(data);
            
        } catch (error) {
            console.error('❌ Ошибка создания вызова:', error);
            alert('Не удалось создать вызов. Попробуйте ещё.');
        }
    }
    
    showShareDialog(duelData) {
        // Сохраняем данные дуэли для дальнейшего использования
        this.lastCreatedDuel = duelData;
        
        // Затемнение фона
        const overlay = this.add.rectangle(
            0, 0, 
            CONSTS.WIDTH, 
            CONSTS.HEIGHT, 
            0x000000, 
            0.7
        ).setOrigin(0, 0).setInteractive();
        
        // Диалоговое окно
        const dialog = this.add.rectangle(
            CONSTS.WIDTH / 2,
            CONSTS.HEIGHT / 2,
            CONSTS.WIDTH - 60,
            450,
            0x2c3e50
        ).setStrokeStyle(4, 0xFFD700).setDepth(0);
        
        // Заголовок
        const titleText = this.add.text(
            CONSTS.WIDTH / 2,
            CONSTS.HEIGHT / 2 - 180,
            '⚔️ Вызов создан!',
            {
                fontSize: '28px',
                fill: '#FFD700',
                fontFamily: 'Arial Black'
            }
        ).setOrigin(0.5).setDepth(1);
        
        // НОВОЕ: Объяснение честной игры
        const explainText = this.add.text(
            CONSTS.WIDTH / 2,
            CONSTS.HEIGHT / 2 - 120,
            '📋 Отправь ссылку другу!\nКогда он примет вызов,\nвы оба сыграете по 1 разу.',
            {
                fontSize: '16px',
                fill: '#2ecc71',
                fontFamily: 'Arial',
                align: 'center',
                lineSpacing: 4
            }
        ).setOrigin(0.5).setDepth(1);
        
        // Информация о матче
        const infoText = this.add.text(
            CONSTS.WIDTH / 2,
            CONSTS.HEIGHT / 2 - 40,
            `ID: ${duelData.matchId.split('_').slice(1).join('_')}\n` +
            `Истекает: ${new Date(duelData.expiresAt).toLocaleString()}`,
            {
                fontSize: '13px',
                fill: '#aaaaaa',
                fontFamily: 'Arial',
                align: 'center',
                lineSpacing: 6
            }
        ).setOrigin(0.5).setDepth(1);
        
        // Кнопка "Copy Match ID"
        const copyIdBtn = this.add.rectangle(
            CONSTS.WIDTH / 2,
            CONSTS.HEIGHT / 2,
            200,
            45,
            0x9b59b6
        ).setInteractive({ useHandCursor: true }).setDepth(1);
        
        const copyIdText = this.add.text(
            CONSTS.WIDTH / 2,
            CONSTS.HEIGHT / 2,
            '📋 Копировать ID',
            {
                fontSize: '16px',
                fill: '#FFFFFF',
                fontFamily: 'Arial Black'
            }
        ).setOrigin(0.5).setDepth(2);
        
        copyIdBtn.on('pointerdown', () => {
            navigator.clipboard?.writeText(duelData.matchId);
            alert(`ID скопирован!\n${duelData.matchId}\n\nОтправьте его другу!`);
        });
        
        // Кнопка "Share in Telegram"
        const shareBtn = this.add.rectangle(
            CONSTS.WIDTH / 2,
            CONSTS.HEIGHT / 2 + 80,
            280,
            60,
            0x0088cc
        ).setInteractive({ useHandCursor: true }).setDepth(1);
        
        const shareText = this.add.text(
            CONSTS.WIDTH / 2,
            CONSTS.HEIGHT / 2 + 80,
            '📤 Поделиться в Telegram',
            {
                fontSize: '20px',
                fill: '#FFFFFF',
                fontFamily: 'Arial Black'
            }
        ).setOrigin(0.5).setDepth(2);
        
        shareBtn.on('pointerdown', () => {
            // УЛУЧШЕНО: Используем современный Telegram WebApp API
            if (window.Telegram?.WebApp) {
                const tg = window.Telegram.WebApp;
                const shareUrl = duelData.duelLink;
                const userData = getTelegramUserId();
                const shareText = `🐵 ${userData.username || 'Я'} вызываю тебя на дуэль в Crypto Monkey!\n\nПрими вызов и докажи что ты лучший! 🏆`;
                
                // Вариант 1: switchInlineQuery (рекомендуется для ботов)
                if (tg.switchInlineQuery) {
                    try {
                        // Отправляет inline query в выбранный чат
                        tg.switchInlineQuery(duelData.matchId, ['users', 'groups', 'channels']);
                        console.log('✅ Используем switchInlineQuery');
                    } catch (e) {
                        console.warn('switchInlineQuery недоступен, используем openTelegramLink');
                        // Fallback на старый метод
                        tg.openTelegramLink(
                            `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
                        );
                    }
                } 
                // Вариант 2: openTelegramLink (универсальный)
                else {
                    tg.openTelegramLink(
                        `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
                    );
                    console.log('✅ Используем openTelegramLink');
                }
                
                // Показываем подтверждение
                tg.showPopup({
                    title: '✅ Ссылка отправлена!',
                    message: 'Когда друг примет вызов, ты сможешь начать игру в разделе "Дуэли"',
                    buttons: [{ type: 'ok' }]
                });
            } else {
                // Fallback для веба: копируем ссылку
                navigator.clipboard?.writeText(duelData.duelLink);
                alert('🔗 Ссылка скопирована!\n\nОтправьте её другу!\nКогда он примет, можно будет играть.');
            }
            
            // Уничтожаем все элементы диалога
            overlay.destroy();
            dialog.destroy();
            titleText.destroy();
            explainText.destroy();
            infoText.destroy();
            copyIdBtn.destroy();
            copyIdText.destroy();
            shareBtn.destroy();
            shareText.destroy();
            closeBtn.destroy();
            closeText.destroy();
            
            // Обновляем историю дуэлей
            this.loadDuelHistory(getTelegramUserId().id);
        });
        
        // Кнопка "Close"
        const closeBtn = this.add.rectangle(
            CONSTS.WIDTH / 2,
            CONSTS.HEIGHT / 2 + 160,
            200,
            50,
            0x95a5a6
        ).setInteractive({ useHandCursor: true }).setDepth(1);
        
        const closeText = this.add.text(
            CONSTS.WIDTH / 2,
            CONSTS.HEIGHT / 2 + 160,
            'Закрыть',
            {
                fontSize: '18px',
                fill: '#FFFFFF',
                fontFamily: 'Arial'
            }
        ).setOrigin(0.5).setDepth(2);
        
        closeBtn.on('pointerdown', () => {
            overlay.destroy();
            dialog.destroy();
            titleText.destroy();
            explainText.destroy();
            infoText.destroy();
            copyIdBtn.destroy();
            copyIdText.destroy();
            shareBtn.destroy();
            shareText.destroy();
            closeBtn.destroy();
            closeText.destroy();
            this.loadDuelHistory(getTelegramUserId().id);
        });
    }
    
    // НОВОЕ: Диалог для ручного принятия вызова
    showAcceptDialog(userData) {
        // Затемнение фона
        const overlay = this.add.rectangle(
            0, 0, 
            CONSTS.WIDTH, 
            CONSTS.HEIGHT, 
            0x000000, 
            0.7
        ).setOrigin(0, 0).setInteractive();
        
        // Диалоговое окно
        const dialog = this.add.rectangle(
            CONSTS.WIDTH / 2,
            CONSTS.HEIGHT / 2,
            CONSTS.WIDTH - 80,
            350,
            0x2c3e50
        ).setStrokeStyle(4, 0x27ae60);
        
        // Заголовок
        this.add.text(
            CONSTS.WIDTH / 2,
            CONSTS.HEIGHT / 2 - 120,
            '✅ Принять вызов',
            {
                fontSize: '28px',
                fill: '#2ecc71',
                fontFamily: 'Arial Black'
            }
        ).setOrigin(0.5);
        
        // Инструкция
        this.add.text(
            CONSTS.WIDTH / 2,
            CONSTS.HEIGHT / 2 - 60,
            'Введите ID матча из ссылки:',
            {
                fontSize: '18px',
                fill: '#ecf0f1',
                fontFamily: 'Arial'
            }
        ).setOrigin(0.5);
        
        // Создаем поле ввода через HTML input
        const inputHtml = document.createElement('input');
        inputHtml.type = 'text';
        inputHtml.placeholder = 'duel_123456789_abc';
        inputHtml.style.cssText = `
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 280px;
            height: 45px;
            font-size: 16px;
            padding: 10px;
            border: 2px solid #27ae60;
            border-radius: 8px;
            text-align: center;
            z-index: 1000;
        `;
        document.body.appendChild(inputHtml);
        inputHtml.focus();
        
        // Кнопка "Accept"
        const acceptBtn = this.add.rectangle(
            CONSTS.WIDTH / 2,
            CONSTS.HEIGHT / 2 + 80,
            200,
            50,
            0x27ae60
        ).setInteractive({ useHandCursor: true });
        
        this.add.text(
            CONSTS.WIDTH / 2,
            CONSTS.HEIGHT / 2 + 80,
            '✅ Принять',
            {
                fontSize: '20px',
                fill: '#FFFFFF',
                fontFamily: 'Arial Black'
            }
        ).setOrigin(0.5);
        
        acceptBtn.on('pointerdown', async () => {
            const matchId = inputHtml.value.trim();
            
            if (!matchId || !matchId.startsWith('duel_')) {
                alert('Неверный ID матча! Должен начинаться с "duel_"');
                return;
            }
            
            // Убираем диалог
            inputHtml.remove();
            overlay.destroy();
            dialog.destroy();
            this.children.list.slice(-5).forEach(child => child.destroy());
            
            // Показываем loading
            const loadingText = this.add.text(
                CONSTS.WIDTH / 2,
                CONSTS.HEIGHT / 2,
                '⏳ Принятие вызова...',
                {
                    fontSize: '24px',
                    fill: '#FFD700',
                    fontFamily: 'Arial Black'
                }
            ).setOrigin(0.5);
            
            try {
                // Получаем информацию о дуэли
                const duelResponse = await fetch(`${API_SERVER_URL}/api/duel/${matchId}`);
                
                if (!duelResponse.ok) {
                    throw new Error('Дуэль не найдена или истекла');
                }
                
                const duelData = await duelResponse.json();
                const duel = duelData.duel;
                
                // Проверяем статус
                if (duel.status !== 'pending') {
                    throw new Error('Дуэль уже началась или истекла');
                }
                
                // Принимаем вызов
                const acceptResponse = await fetch(`${API_SERVER_URL}/api/duel/${matchId}/accept`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        player2Id: userData.id,
                        player2Username: userData.username
                    })
                });
                
                if (!acceptResponse.ok) {
                    const errorData = await acceptResponse.json();
                    throw new Error(errorData.error || 'Failed to accept');
                }
                
                const acceptData = await acceptResponse.json();
                
                // Успешно принято - запускаем игру
                loadingText.setText('✅ Вызов принят! Запуск игры...');
                
                setTimeout(() => {
                    loadingText.destroy();
                    // Останавливаем автообновление при выходе
                    if (this.historyRefreshTimer) this.historyRefreshTimer.remove();
                    this.scene.start('GameScene', {
                        mode: 'duel',
                        matchId: matchId,
                        seed: acceptData.seed,
                        opponentUsername: duel.player1_username
                    });
                }, 1500);
                
            } catch (error) {
                console.error('❌ Ошибка принятия:', error);
                loadingText.destroy();
                alert(`Не удалось принять вызов: ${error.message}`);
            }
        });
        
        // Кнопка "Cancel"
        const cancelBtn = this.add.rectangle(
            CONSTS.WIDTH / 2,
            CONSTS.HEIGHT / 2 + 140,
            200,
            50,
            0x95a5a6
        ).setInteractive({ useHandCursor: true });
        
        this.add.text(
            CONSTS.WIDTH / 2,
            CONSTS.HEIGHT / 2 + 140,
            'Отмена',
            {
                fontSize: '18px',
                fill: '#FFFFFF',
                fontFamily: 'Arial'
            }
        ).setOrigin(0.5);
        
        cancelBtn.on('pointerdown', () => {
            inputHtml.remove();
            overlay.destroy();
            dialog.destroy();
            this.children.list.slice(-5).forEach(child => child.destroy());
        });
    }
    
    async loadDuelHistory(userId, visibleHeight) {
        try {
            const response = await fetch(`${API_SERVER_URL}/api/duel/history/${userId}?limit=15`);
            
            if (!response.ok) {
                throw new Error('Failed to load history');
            }
            
            const data = await response.json();
            
            // Очищаем контейнер
            this.historyContainer.removeAll(true);
            
            if (data.duels.length === 0) {
                // Пустая история - красивое сообщение
                const emptyIcon = this.add.text(CONSTS.WIDTH / 2, 60, '🎮', {
                    fontSize: '48px'
                }).setOrigin(0.5);
                
                const emptyText = this.add.text(CONSTS.WIDTH / 2, 120, 
                    'Пока нет дуэлей\n\nСоздай вызов и отправь\nдругу ссылку!', {
                    fontSize: '16px',
                    fill: '#888899',
                    fontFamily: 'Arial',
                    align: 'center',
                    lineSpacing: 8
                }).setOrigin(0.5);
                
                this.historyContainer.add([emptyIcon, emptyText]);
                return;
            }
            
            const cardHeight = 90; // Увеличили высоту для кнопок
            const cardGap = 10;
            const cardWidth = CONSTS.WIDTH - 40;
            
            // Отображаем историю
            data.duels.forEach((duel, index) => {
                const y = index * (cardHeight + cardGap) + 10;
                // ФИКС: Конвертируем в строки для корректного сравнения
                const isPlayer1 = String(duel.player1_id) === String(userId);
                const opponentName = isPlayer1 ? (duel.player2_username || '???') : duel.player1_username;
                const myScore = isPlayer1 ? duel.score1 : duel.score2;
                const opponentScore = isPlayer1 ? duel.score2 : duel.score1;
                
                // Определяем статус и цвет
                let statusIcon = '⏳';
                let statusText = 'Ожидание';
                let cardColor = 0x3d4663;
                let accentColor = 0xf39c12;
                let canPlay = false;
                let canShare = false;
                
                if (duel.status === 'pending') {
                    statusIcon = '⏳';
                    statusText = 'Ждёт соперника';
                    cardColor = 0x3d4663;
                    accentColor = 0xf39c12;
                    canShare = isPlayer1; // Создатель может поделиться
                } else if (duel.status === 'active') {
                    // Проверяем, играл ли уже этот игрок
                    const alreadyPlayed = myScore !== null;
                    if (alreadyPlayed) {
                        statusIcon = '⏳';
                        statusText = 'Ждёт соперника';
                        cardColor = 0x2d4a7c;
                        accentColor = 0x3498db;
                    } else {
                        statusIcon = '🎮';
                        statusText = 'Можно играть!';
                        cardColor = 0x1e5631;
                        accentColor = 0x2ecc71;
                        canPlay = true;
                    }
                } else if (duel.status === 'completed') {
                    // ФИКС: Конвертируем в строки для корректного сравнения
                    const won = String(duel.winner) === String(userId);
                    const draw = duel.winner === 'draw';
                    statusIcon = won ? '🏆' : (draw ? '🤝' : '💔');
                    statusText = won ? 'Победа!' : (draw ? 'Ничья' : 'Поражение');
                    cardColor = won ? 0x1e5631 : (draw ? 0x4a4a2e : 0x5c2323);
                    accentColor = won ? 0x2ecc71 : (draw ? 0xf1c40f : 0xe74c3c);
                } else if (duel.status === 'expired') {
                    statusIcon = '⏰';
                    statusText = 'Истекла';
                    cardColor = 0x333344;
                    accentColor = 0x7f8c8d;
                }
                
                // Карточка дуэли
                const cardBg = this.add.graphics();
                cardBg.fillStyle(cardColor, 1);
                cardBg.fillRoundedRect(20, y, cardWidth, cardHeight, 10);
                
                // Акцентная линия слева
                cardBg.fillStyle(accentColor, 1);
                cardBg.fillRoundedRect(20, y, 5, cardHeight, { tl: 10, bl: 10, tr: 0, br: 0 });
                
                // Иконка статуса
                const icon = this.add.text(45, y + 25, statusIcon, {
                    fontSize: '28px'
                }).setOrigin(0, 0.5);
                
                // Имя соперника
                const nameText = this.add.text(85, y + 12, `vs ${opponentName}`, {
                    fontSize: '16px',
                    fill: '#FFFFFF',
                    fontFamily: 'Arial Black'
                });
                
                // Счёт
                const scoreStr = (myScore !== null && opponentScore !== null) 
                    ? `${myScore} : ${opponentScore}` 
                    : (myScore !== null ? `${myScore} : ?` : '— : —');
                const scoreText = this.add.text(85, y + 35, scoreStr, {
                    fontSize: '14px',
                    fill: '#aaaacc',
                    fontFamily: 'Arial'
                });
                
                // Статус справа
                const statusLabel = this.add.text(CONSTS.WIDTH - 35, y + 20, statusText, {
                    fontSize: '11px',
                    fill: Phaser.Display.Color.IntegerToColor(accentColor).rgba,
                    fontFamily: 'Arial Black'
                }).setOrigin(1, 0.5);
                
                this.historyContainer.add([cardBg, icon, nameText, scoreText, statusLabel]);
                
                // НОВОЕ: Кнопка действия
                if (canPlay) {
                    // Кнопка "ИГРАТЬ"
                    const playBtn = this.add.rectangle(CONSTS.WIDTH - 80, y + 60, 100, 28, 0x27ae60)
                        .setInteractive({ useHandCursor: true });
                    const playBtnText = this.add.text(CONSTS.WIDTH - 80, y + 60, '▶ ИГРАТЬ', {
                        fontSize: '12px',
                        fill: '#FFFFFF',
                        fontFamily: 'Arial Black'
                    }).setOrigin(0.5);
                    
                    playBtn.on('pointerdown', () => {
                        // Останавливаем автообновление при выходе
                        if (this.historyRefreshTimer) this.historyRefreshTimer.remove();
                        // Запускаем игру в режиме дуэли
                        this.scene.start('GameScene', {
                            mode: 'duel',
                            matchId: duel.match_id,
                            seed: duel.seed,
                            isCreator: isPlayer1,
                            opponentUsername: opponentName
                        });
                    });
                    
                    this.historyContainer.add([playBtn, playBtnText]);
                } else if (canShare) {
                    // Кнопка "ПОДЕЛИТЬСЯ" для pending дуэлей
                    const shareBtn = this.add.rectangle(CONSTS.WIDTH - 85, y + 60, 110, 28, 0x0088cc)
                        .setInteractive({ useHandCursor: true });
                    const shareBtnText = this.add.text(CONSTS.WIDTH - 85, y + 60, '📤 ОТПРАВИТЬ', {
                        fontSize: '11px',
                        fill: '#FFFFFF',
                        fontFamily: 'Arial Black'
                    }).setOrigin(0.5);
                    
                    shareBtn.on('pointerdown', () => {
                        const duelLink = `https://t.me/monkey_test_crypto_bot/monkeytest?startapp=${duel.match_id}`;
                        const shareText = `🐵 Вызываю тебя на дуэль в Crypto Monkey! Прими вызов! 🏆`;
                        
                        if (window.Telegram?.WebApp) {
                            window.Telegram.WebApp.openTelegramLink(
                                `https://t.me/share/url?url=${encodeURIComponent(duelLink)}&text=${encodeURIComponent(shareText)}`
                            );
                        } else {
                            navigator.clipboard?.writeText(duelLink);
                            alert('Ссылка скопирована!');
                        }
                    });
                    
                    this.historyContainer.add([shareBtn, shareBtnText]);
                }
                
                // Время (если завершена)
                if (duel.duration_seconds && !canPlay && !canShare) {
                    const mins = Math.floor(duel.duration_seconds / 60);
                    const secs = Math.floor(duel.duration_seconds % 60);
                    const timeStr = mins > 0 ? `${mins}м ${secs}с` : `${secs}с`;
                    const timeText = this.add.text(CONSTS.WIDTH - 35, y + 65, `⏱ ${timeStr}`, {
                        fontSize: '11px',
                        fill: '#666688',
                        fontFamily: 'Arial'
                    }).setOrigin(1, 0.5);
                    this.historyContainer.add(timeText);
                }
            });
            
            // Рассчитываем максимальный скролл
            const totalHeight = data.duels.length * (cardHeight + cardGap) + 20;
            this.maxScrollY = Math.max(0, totalHeight - (visibleHeight || (CONSTS.HEIGHT - 340)));
            
        } catch (error) {
            console.error('❌ Ошибка загрузки истории:', error);
            
            const errorText = this.add.text(CONSTS.WIDTH / 2, 80,
                '❌ Ошибка загрузки\n\nПроверьте подключение', {
                fontSize: '18px',
                fill: '#e74c3c',
                fontFamily: 'Arial',
                align: 'center'
            }).setOrigin(0.5);
            
            this.historyContainer.add(errorText);
        }
    }
    
    // НОВОЕ: Подтверждение очистки истории
    confirmClearHistory(userData) {
        // Затемнение
        const overlay = this.add.rectangle(
            0, 0, 
            CONSTS.WIDTH, 
            CONSTS.HEIGHT, 
            0x000000, 
            0.8
        ).setOrigin(0, 0).setInteractive().setDepth(100);
        
        // Диалог
        const dialog = this.add.graphics().setDepth(101);
        dialog.fillStyle(0x1a1a2e, 1);
        dialog.fillRoundedRect(40, CONSTS.HEIGHT/2 - 120, CONSTS.WIDTH - 80, 240, 16);
        dialog.lineStyle(3, 0xe74c3c);
        dialog.strokeRoundedRect(40, CONSTS.HEIGHT/2 - 120, CONSTS.WIDTH - 80, 240, 16);
        
        // Иконка предупреждения
        const warningIcon = this.add.text(
            CONSTS.WIDTH / 2,
            CONSTS.HEIGHT / 2 - 80,
            '⚠️',
            { fontSize: '48px' }
        ).setOrigin(0.5).setDepth(102);
        
        // Текст предупреждения
        const warningText = this.add.text(
            CONSTS.WIDTH / 2,
            CONSTS.HEIGHT / 2 - 20,
            'Очистить всю историю?\n\nЭто действие нельзя отменить!',
            {
                fontSize: '16px',
                fill: '#FFFFFF',
                fontFamily: 'Arial',
                align: 'center',
                lineSpacing: 8
            }
        ).setOrigin(0.5).setDepth(102);
        
        // Кнопка "Удалить"
        const deleteBtn = this.add.rectangle(
            CONSTS.WIDTH / 2 - 70,
            CONSTS.HEIGHT / 2 + 70,
            120,
            45,
            0xe74c3c
        ).setInteractive({ useHandCursor: true }).setDepth(101);
        
        const deleteText = this.add.text(
            CONSTS.WIDTH / 2 - 70,
            CONSTS.HEIGHT / 2 + 70,
            '🗑️ Удалить',
            {
                fontSize: '15px',
                fill: '#FFFFFF',
                fontFamily: 'Arial Black'
            }
        ).setOrigin(0.5).setDepth(102);
        
        deleteBtn.on('pointerdown', async () => {
            try {
                const response = await fetch(`${API_SERVER_URL}/api/duel/history/${userData.id}`, {
                    method: 'DELETE'
                });
                
                // Закрываем диалог
                overlay.destroy();
                dialog.destroy();
                warningIcon.destroy();
                warningText.destroy();
                deleteBtn.destroy();
                deleteText.destroy();
                cancelBtn.destroy();
                cancelText.destroy();
                
                if (response.ok) {
                    // Перезагружаем историю
                    this.loadDuelHistory(userData.id, CONSTS.HEIGHT - 280);
                } else {
                    alert('Не удалось удалить историю');
                }
            } catch (e) {
                console.error('Ошибка удаления:', e);
            }
        });
        
        // Кнопка "Отмена"
        const cancelBtn = this.add.rectangle(
            CONSTS.WIDTH / 2 + 70,
            CONSTS.HEIGHT / 2 + 70,
            120,
            45,
            0x34495e
        ).setInteractive({ useHandCursor: true }).setDepth(101);
        
        const cancelText = this.add.text(
            CONSTS.WIDTH / 2 + 70,
            CONSTS.HEIGHT / 2 + 70,
            'Отмена',
            {
                fontSize: '15px',
                fill: '#FFFFFF',
                fontFamily: 'Arial'
            }
        ).setOrigin(0.5).setDepth(102);
        
        cancelBtn.on('pointerdown', () => {
            overlay.destroy();
            dialog.destroy();
            warningIcon.destroy();
            warningText.destroy();
            deleteBtn.destroy();
            deleteText.destroy();
            cancelBtn.destroy();
            cancelText.destroy();
        });
    }
}
