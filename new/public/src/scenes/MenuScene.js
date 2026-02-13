class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
        this.scoreBoardElements = []; // Массив для элементов экрана рекордов
        this.shopElements = []; // НОВОЕ: Массив для элементов экрана магазина
        this.monkeyCoins = 0; // НОВОЕ: Баланс Monkey Coins
        this.coinsText = null; // НОВОЕ: Текст для отображения баланса
    }

    preload() {
        this.load.image('background_img', 'assets/background.png');
        this.load.image('background_img_menu', 'assets/background_menu.jpg');
        
    }

    create() {
        // НОВОЕ: Проверка deep link для автоматического принятия дуэли
        this.checkDeepLink();
        
        // Фон с растяжкой (stretch) без повторения, как в GameScene
        this.background = this.add.image(0, 0, 'background_img_menu').setOrigin(0, 0);
        this.background.setDisplaySize(CONSTS.WIDTH, CONSTS.HEIGHT);

        // НОВОЕ: Отладочная информация о Telegram пользователе
        const userData = getTelegramUserId();
        const isTelegram = window.Telegram?.WebApp?.initDataUnsafe?.user ? '✅' : '❌';
        
        // ОТЛАДКА: Показываем start_param на экране
        const tg = window.Telegram?.WebApp;
        const startParam = tg?.initDataUnsafe?.start_param;
        const debugInfo = `start_param: ${startParam || 'NONE'}`;
        
        // Фон для отладочной панели - КОМПАКТНЫЙ ДЛЯ ТЕЛЕФОНА
        const debugBg = this.add.graphics();
        debugBg.fillStyle(0x000000, 0.7);
        debugBg.fillRoundedRect(10, 10, CONSTS.WIDTH - 20, 100, 8);
        debugBg.setDepth(20);
        
        // Информация о пользователе - УМЕНЬШЕННЫЕ ШРИФТЫ
        const debugText = this.add.text(15, 15, 
            `${isTelegram} TG | 👤 ${userData.username} | 🆔 ${userData.id}`,
            { 
                fontSize: '12px', 
                fill: '#FFFFFF', 
                fontFamily: 'Arial'
            }
        ).setDepth(21);
        
        // НОВОЕ: Отображение баланса Monkey Coins - КРУПНЕЕ
        this.coinsText = this.add.text(CONSTS.WIDTH / 2, 50, 
            `💰 Loading...`, 
            { 
                fontSize: '20px', 
                fill: '#FFD700', 
                fontFamily: 'Arial Black',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5).setDepth(21);
        
        // Подсказка - запас монет внизу панели
        this.add.text(CONSTS.WIDTH / 2, 80, 
            `Зарабатывай монеты играя! 🎮`, 
            { 
                fontSize: '11px', 
                fill: '#AAAAAA', 
                fontFamily: 'Arial',
                fontStyle: 'italic'
            }
        ).setOrigin(0.5).setDepth(21);
        
        // НОВОЕ: Загружаем баланс асинхронно
        this.loadMonkeyCoins(userData.id);

        // Кнопки - КОМПАКТНЫЕ ДЛЯ ТЕЛЕФОНА (реорганизованное меню)
        const buttons = [
            { text: '🎮 Играть', y: CONSTS.HEIGHT / 2 - 200, callback: () => {
                if (window.stopIntroVideo) window.stopIntroVideo(); // Останавливаем видео если оно играет
                this.scene.start('GameScene');
            }},
            { text: '⚔️ PvP', y: CONSTS.HEIGHT / 2 - 145, callback: () => this.scene.start('PvPMenuScene') },
            { text: '🏆 Турниры', y: CONSTS.HEIGHT / 2 - 90, callback: () => this.scene.start('TournamentScene') },
            { text: '📊 Рейтинг', y: CONSTS.HEIGHT / 2 - 35, callback: () => this.openLeaderboard() },
            { text: '👤 Личный кабинет', y: CONSTS.HEIGHT / 2 + 20, callback: () => this.scene.start('ProfileScene') },
            { text: '📈 Статистика', y: CONSTS.HEIGHT / 2 + 75, callback: () => this.scene.start('StatsScene') },
            { text: '🎁 Рефералы', y: CONSTS.HEIGHT / 2 + 130, callback: () => this.scene.start('ReferralScene') },
            { text: '⭐ Магазин', y: CONSTS.HEIGHT / 2 + 185, callback: () => this.openWebShop() },
        ];

        buttons.forEach(btnData => {
            const btnGraphics = this.add.graphics().setDepth(1);
            btnGraphics.fillStyle(0xFFFFFF, 1);
            btnGraphics.fillRoundedRect(CONSTS.WIDTH / 2 - 90, btnData.y - 24, 180, 48, 8);

            // Прозрачная интерактивная зона поверх всей кнопки
            const btnZone = this.add.rectangle(CONSTS.WIDTH / 2, btnData.y, 180, 48, 0x000000, 0)
                .setInteractive({ useHandCursor: true })
                .setDepth(3);

            const btnText = this.add.text(CONSTS.WIDTH / 2, btnData.y, btnData.text, { fontSize: '24px', fill: '#000', fontFamily: 'Arial Black' }).setOrigin(0.5).setDepth(4);

            const setButtonColor = (hover) => {
                btnGraphics.clear();
                btnGraphics.fillStyle(hover ? 0xCCCCCC : 0xFFFFFF, 1);
                btnGraphics.fillRoundedRect(CONSTS.WIDTH / 2 - 90, btnData.y - 24, 180, 48, 8);
            };

            btnZone.on('pointerover', () => setButtonColor(true));
            btnZone.on('pointerout', () => setButtonColor(false));
            btnZone.on('pointerdown', btnData.callback);

            // Анимация появления
            [btnGraphics, btnZone, btnText].forEach(obj => {
                obj.setAlpha(0);
                this.tweens.add({
                    targets: obj,
                    alpha: 1,
                    duration: 600,
                    ease: 'Power2'
                });
            });
        });
    }

    // Метод для показа экрана рекордов
    // ФИКС Phase 3: Открываем встроенную LeaderboardScene (без выхода из приложения)
    openLeaderboard() {
        console.log('📊 Открываем таблицу лидеров...');
        this.scene.start('LeaderboardScene');
    }

    // УБРАНО: Старый метод showScoreBoard() больше не используется
    // Метод для скрытия экрана рекордов - больше не нужен
    hideScoreBoard() {
        // Пустой метод для обратной совместимости
    }
    
    // Открыть веб-магазин (shop.html - единственный магазин)
    openWebShop() {
        console.log('⭐ Opening web shop...');
        const userData = getTelegramUserId();
        const userId = userData?.id || 'unknown';
        
        // Для Telegram Mini App используем относительный путь (откроется внутри WebApp)
        const shopUrl = `/shop.html?userId=${userId}`;
        
        console.log('🛒 Opening shop with userId:', userId);
        
        // Открываем внутри того же окна (сохраняет контекст Telegram WebApp)
        window.location.href = shopUrl;
    }
    
    // НОВОЕ: Загрузка баланса Monkey Coins
    async loadMonkeyCoins(userId) {
        try {
            const response = await fetch(`${API_SERVER_URL}/api/wallet/balance/${userId}`);
            const data = await response.json();
            
            if (data.success) {
                this.monkeyCoins = data.wallet.monkeyCoin || 0;
                if (this.coinsText) {
                    this.coinsText.setText(`💰 ${this.monkeyCoins} Monkey Coins`);
                }
                console.log(`✅ Loaded ${this.monkeyCoins} Monkey Coins`);
            } else {
                throw new Error('Failed to load wallet');
            }
        } catch (error) {
            console.error('❌ Error loading Monkey Coins:', error);
            if (this.coinsText) {
                this.coinsText.setText(`💰 0 Monkey Coins`);
            }
        }
    }

    // Показать уведомление о реферальном бонусе
    showReferralBonus(amount) {
        // Фон для уведомления
        const bonusBg = this.add.graphics().setDepth(200);
        bonusBg.fillStyle(0x000000, 0.9);
        bonusBg.fillRoundedRect(20, CONSTS.HEIGHT / 2 - 80, CONSTS.WIDTH - 40, 160, 16);
        bonusBg.lineStyle(3, 0xFFD700, 1);
        bonusBg.strokeRoundedRect(20, CONSTS.HEIGHT / 2 - 80, CONSTS.WIDTH - 40, 160, 16);

        // Заголовок
        const titleText = this.add.text(CONSTS.WIDTH / 2, CONSTS.HEIGHT / 2 - 50, '🎁 Добро пожаловать!', {
            fontSize: '24px',
            fill: '#FFD700',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(201);

        // Текст бонуса
        const bonusText = this.add.text(CONSTS.WIDTH / 2, CONSTS.HEIGHT / 2, `Вы получили бонус за регистрацию\nпо реферальной ссылке:`, {
            fontSize: '14px',
            fill: '#FFFFFF',
            fontFamily: 'Arial',
            align: 'center'
        }).setOrigin(0.5).setDepth(201);

        // Сумма бонуса
        const amountText = this.add.text(CONSTS.WIDTH / 2, CONSTS.HEIGHT / 2 + 45, `+${amount} 🪙`, {
            fontSize: '32px',
            fill: '#00FF00',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(201);

        // Автоскрытие через 4 секунды
        this.time.delayedCall(4000, () => {
            bonusBg.destroy();
            titleText.destroy();
            bonusText.destroy();
            amountText.destroy();
            
            // Обновляем баланс
            const userData = getTelegramUserId();
            this.loadMonkeyCoins(userData.id);
        });
    }

    // НОВОЕ: Проверка deep link для автоматического принятия дуэли
    async checkDeepLink() {
        try {
            // ФИКС: Проверяем не обработали ли мы уже этот deep link
            const processedKey = 'processed_duel_link';
            const lastProcessed = sessionStorage.getItem(processedKey);
            
            // Проверяем Telegram WebApp startapp parameter
            const tg = window.Telegram?.WebApp;
            const startParam = tg?.initDataUnsafe?.start_param;
            
            console.log('🔍 Checking deep link...');
            
            // ВАЖНО: Проверяем несколько способов получения параметра
            const urlParams = new URLSearchParams(window.location.search);
            const urlMatchId = urlParams.get('matchId');
            const urlStartParam = urlParams.get('tgWebAppStartParam');
            const hashMatchId = window.location.hash.includes('duel_') 
                ? window.location.hash.substring(1) 
                : null;
            
            // Используем любой найденный параметр
            const finalParam = startParam || urlStartParam || urlMatchId || hashMatchId;
            
            // ФИКС: Пропускаем если уже обрабатывали этот параметр
            if (finalParam && finalParam === lastProcessed) {
                console.log('ℹ️ Deep link already processed, skipping');
                return;
            }
            
            if (finalParam && finalParam.startsWith('duel_')) {
                const matchId = finalParam;
                console.log('🔗 Deep link detected:', matchId);
                
                // Сохраняем что обработали этот deep link
                sessionStorage.setItem(processedKey, matchId);
                
                // Показываем loading
                const loadingBg = this.add.rectangle(
                    0, 0, 
                    CONSTS.WIDTH, 
                    CONSTS.HEIGHT, 
                    0x000000, 
                    0.8
                ).setOrigin(0, 0).setDepth(100);
                
                const loadingText = this.add.text(
                    CONSTS.WIDTH / 2,
                    CONSTS.HEIGHT / 2,
                    '⏳ Загрузка дуэли...',
                    {
                        fontSize: '24px',
                        fill: '#FFD700',
                        fontFamily: 'Arial Black'
                    }
                ).setOrigin(0.5).setDepth(101);
                
                // Получаем информацию о дуэли
                const duelResponse = await fetch(`${API_SERVER_URL}/api/duel/${matchId}`);
                
                if (!duelResponse.ok) {
                    throw new Error('Дуэль не найдена');
                }
                
                const duelData = await duelResponse.json();
                const duel = duelData.duel;
                const userData = getTelegramUserId();
                
                // ФИКС: Проверяем кто мы в этой дуэли
                const isCreator = String(duel.player1_id) === String(userData.id);
                const isPlayer2 = String(duel.player2_id) === String(userData.id);
                
                console.log('🔍 Duel check:', { 
                    status: duel.status, 
                    isCreator, 
                    isPlayer2,
                    myId: userData.id,
                    player1: duel.player1_id,
                    player2: duel.player2_id
                });
                
                // ФИКС: Если это создатель - проверяем можно ли играть
                if (isCreator) {
                    if (duel.status === 'pending') {
                        loadingText.setText('⏳ Ожидание соперника...\nОтправьте ссылку другу!');
                        setTimeout(() => {
                            loadingBg.destroy();
                            loadingText.destroy();
                            // Переходим в историю дуэлей
                            this.scene.start('DuelHistoryScene');
                        }, 2000);
                        return;
                    } else if (duel.status === 'active' && duel.score1 === null) {
                        // Можно играть!
                        loadingText.setText('✅ Соперник принял! Запуск игры...');
                        setTimeout(() => {
                            loadingBg.destroy();
                            loadingText.destroy();
                            this.scene.start('GameScene', {
                                mode: 'duel',
                                matchId: matchId,
                                seed: duel.seed,
                                isCreator: true,
                                opponentUsername: duel.player2_username
                            });
                        }, 1500);
                        return;
                    } else {
                        loadingText.setText('ℹ️ Вы уже сыграли в этой дуэли');
                        setTimeout(() => {
                            loadingBg.destroy();
                            loadingText.destroy();
                            this.scene.start('DuelHistoryScene');
                        }, 2000);
                        return;
                    }
                }
                
                // ФИКС: Если мы уже player2 - проверяем можно ли играть
                if (isPlayer2) {
                    if (duel.status === 'active' && duel.score2 === null) {
                        // Можно играть!
                        loadingText.setText('✅ Запуск игры...');
                        setTimeout(() => {
                            loadingBg.destroy();
                            loadingText.destroy();
                            this.scene.start('GameScene', {
                                mode: 'duel',
                                matchId: matchId,
                                seed: duel.seed,
                                isCreator: false,
                                opponentUsername: duel.player1_username
                            });
                        }, 1500);
                        return;
                    } else {
                        loadingText.setText('ℹ️ Вы уже сыграли в этой дуэли');
                        setTimeout(() => {
                            loadingBg.destroy();
                            loadingText.destroy();
                            this.scene.start('DuelHistoryScene');
                        }, 2000);
                        return;
                    }
                }
                
                // Мы не участник - пробуем принять дуэль
                if (duel.status !== 'pending') {
                    loadingText.setText('❌ Дуэль уже началась или истекла');
                    setTimeout(() => {
                        loadingBg.destroy();
                        loadingText.destroy();
                    }, 2000);
                    return;
                }
                
                // Принимаем вызов
                loadingText.setText('⏳ Принятие вызова...');
                
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
                
                // Успешно принято - запускаем игру с seed
                loadingText.setText('✅ Вызов принят! Запуск игры...');
                
                setTimeout(() => {
                    loadingBg.destroy();
                    loadingText.destroy();
                    
                    // Запускаем игру в режиме дуэли
                    this.scene.start('GameScene', {
                        mode: 'duel',
                        matchId: matchId,
                        seed: acceptData.seed,
                        isCreator: false,
                        opponentUsername: duel.player1_username
                    });
                }, 1500);
                
            } else if (finalParam && finalParam.startsWith('ref_')) {
                // Реферальная ссылка
                const referrerId = finalParam.replace('ref_', '');
                console.log('🎁 Referral link detected, referrer:', referrerId);
                
                // Сохраняем что обработали
                sessionStorage.setItem('processed_duel_link', finalParam);
                
                const userData = getTelegramUserId();
                
                // Применяем реферальный код
                try {
                    const refResponse = await fetch(`${API_SERVER_URL}/api/referral/apply`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            referrerId: referrerId,
                            referredId: userData.id,
                            referredUsername: userData.username
                        })
                    });
                    
                    const refData = await refResponse.json();
                    
                    if (refData.success) {
                        console.log('✅ Referral applied! Bonus:', refData.bonusReceived);
                        
                        // Показываем уведомление о бонусе
                        this.showReferralBonus(refData.bonusReceived);
                    } else if (refData.alreadyReferred) {
                        console.log('ℹ️ User already has a referrer');
                    } else {
                        console.log('⚠️ Referral apply failed:', refData.error);
                    }
                } catch (refError) {
                    console.error('❌ Referral error:', refError);
                }
            }
        } catch (error) {
            console.error('❌ Deep link error:', error);
            // Не показываем alert - просто логируем
        }
    }
}
