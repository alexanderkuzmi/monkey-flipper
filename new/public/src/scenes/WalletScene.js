// ==================== WALLET SCENE (TON CONNECT) ====================
class WalletScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WalletScene' });
        this.tonConnectUI = null;
        this.walletInfo = null;
        this.isConnecting = false;
    }

    async create() {
        // Фон
        this.background = this.add.image(0, 0, 'background_img_menu').setOrigin(0, 0);
        this.background.setDisplaySize(CONSTS.WIDTH, CONSTS.HEIGHT);

        // Заголовок
        this.add.text(CONSTS.WIDTH / 2, 45, '💎 TON Кошелёк', {
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

        // Инициализируем TON Connect
        await this.initTonConnect();

        // Загружаем данные кошелька
        const userData = getTelegramUserId();
        await this.loadWalletInfo(userData.id);

        // Кнопка назад
        this.createBackButton();
    }

    async initTonConnect() {
        try {
            // Проверяем наличие TON Connect UI
            if (typeof TON_CONNECT_UI === 'undefined' && typeof window.TonConnectUI === 'undefined') {
                console.warn('⚠️ TON Connect UI не загружен');
                return;
            }

            const TonConnectUIClass = window.TonConnectUI || TON_CONNECT_UI?.TonConnectUI;
            
            if (!TonConnectUIClass) {
                console.warn('⚠️ TonConnectUI class не найден');
                return;
            }

            // Создаём экземпляр TON Connect UI
            // Манифест хостится на API сервере
            this.tonConnectUI = new TonConnectUIClass({
                manifestUrl: 'https://monkey-flipper-djm1.onrender.com/tonconnect-manifest.json',
                buttonRootId: null // Мы не используем встроенную кнопку
            });

            // Подписываемся на изменения статуса подключения
            this.tonConnectUI.onStatusChange((wallet) => {
                console.log('🔄 TON Wallet status changed:', wallet);
                if (wallet) {
                    this.onWalletConnected(wallet);
                } else {
                    this.onWalletDisconnected();
                }
            });

            // Проверяем, может кошелёк уже подключён (из localStorage)
            const currentWallet = this.tonConnectUI.wallet;
            if (currentWallet) {
                console.log('📱 Найден уже подключённый кошелёк:', currentWallet);
                await this.onWalletConnected(currentWallet);
            }

            console.log('✅ TON Connect UI инициализирован');
        } catch (error) {
            console.error('❌ Ошибка инициализации TON Connect:', error);
        }
    }

    async loadWalletInfo(userId) {
        try {
            const response = await fetch(`${API_SERVER_URL}/api/wallet/ton-info/${userId}`);
            const data = await response.json();

            this.statusText.destroy();

            if (data.success) {
                this.walletInfo = data;
                this.displayWalletUI();
            } else {
                this.showError('Ошибка загрузки');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки кошелька:', error);
            this.statusText.setText('❌ Ошибка соединения');
        }
    }

    displayWalletUI() {
        const startY = 100;

        if (this.walletInfo.connected) {
            // Кошелёк подключён
            this.showConnectedWallet(startY);
        } else {
            // Кошелёк не подключён
            this.showConnectPrompt(startY);
        }
    }

    showConnectedWallet(startY) {
        const wallet = this.walletInfo.wallet;
        let y = startY;

        // Карточка с информацией о кошельке
        this.createCard(20, y, CONSTS.WIDTH - 40, 120, 0x0088cc);
        
        // Статус
        this.add.text(CONSTS.WIDTH / 2, y + 20, '✅ Кошелёк подключён', {
            fontSize: '18px',
            fill: '#00FF00',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Адрес
        this.add.text(CONSTS.WIDTH / 2, y + 50, wallet.shortAddress, {
            fontSize: '22px',
            fill: '#FFFFFF',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Баланс TON
        this.add.text(CONSTS.WIDTH / 2, y + 85, `💎 ${wallet.tonBalance.toFixed(4)} TON`, {
            fontSize: '16px',
            fill: '#FFD700',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        y += 140;

        // Информация о возможностях
        this.createCard(20, y, CONSTS.WIDTH - 40, 100, 0x1a237e);
        
        this.add.text(CONSTS.WIDTH / 2, y + 20, '🎮 Возможности:', {
            fontSize: '16px',
            fill: '#FFFFFF',
            fontFamily: 'Arial Black'
        }).setOrigin(0.5);

        this.add.text(CONSTS.WIDTH / 2, y + 45, '• Покупка NFT и предметов за TON', {
            fontSize: '13px',
            fill: '#CCCCCC',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.add.text(CONSTS.WIDTH / 2, y + 65, '• Вывод заработанных наград', {
            fontSize: '13px',
            fill: '#CCCCCC',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.add.text(CONSTS.WIDTH / 2, y + 85, '• Торговля на маркетплейсе', {
            fontSize: '13px',
            fill: '#CCCCCC',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        y += 120;

        // Кнопка отключения
        this.createButton(
            CONSTS.WIDTH / 2, y + 30,
            '🔌 Отключить кошелёк',
            0xFF5722,
            () => this.disconnectWallet()
        );
    }

    showConnectPrompt(startY) {
        let y = startY;

        // Описание
        this.createCard(20, y, CONSTS.WIDTH - 40, 150, 0x1a237e);
        
        this.add.text(CONSTS.WIDTH / 2, y + 25, '💎 Подключите TON кошелёк', {
            fontSize: '18px',
            fill: '#FFFFFF',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.add.text(CONSTS.WIDTH / 2, y + 55, 'Для доступа к:', {
            fontSize: '14px',
            fill: '#CCCCCC',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        const features = [
            '• NFT коллекциям и предметам',
            '• Выводу наград за игру',
            '• Торговле на маркетплейсе'
        ];

        features.forEach((text, i) => {
            this.add.text(CONSTS.WIDTH / 2, y + 80 + (i * 20), text, {
                fontSize: '13px',
                fill: '#AAAAAA',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        });

        y += 170;

        // Кнопка подключения (основная)
        this.createButton(
            CONSTS.WIDTH / 2, y + 30,
            '🔗 Подключить кошелёк',
            0x0088cc,
            () => this.connectWallet()
        );

        y += 80;

        // Поддерживаемые кошельки
        this.add.text(CONSTS.WIDTH / 2, y, 'Поддерживаются: Tonkeeper, TON Space, MyTonWallet', {
            fontSize: '11px',
            fill: '#888888',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }

    async connectWallet() {
        if (this.isConnecting) return;
        this.isConnecting = true;

        try {
            if (!this.tonConnectUI) {
                // Fallback: открываем Tonkeeper напрямую
                this.openTonkeeperConnect();
                return;
            }

            console.log('🔗 Открываем TON Connect модальное окно...');
            
            // Открываем модальное окно TON Connect и ждём результат
            const connectedWallet = await this.tonConnectUI.connectWallet();
            
            console.log('📱 connectWallet результат:', connectedWallet);
            
            // Если подключение успешно - сохраняем
            if (connectedWallet) {
                await this.onWalletConnected(connectedWallet);
            }
            
        } catch (error) {
            console.error('❌ Ошибка подключения:', error);
            // Не показываем ошибку если пользователь просто закрыл окно
            if (error?.message !== 'User closed the modal window') {
                this.showError('Ошибка подключения к кошельку');
            }
        } finally {
            this.isConnecting = false;
        }
    }

    openTonkeeperConnect() {
        // Fallback для Telegram - открываем Tonkeeper
        const userData = getTelegramUserId();
        const returnUrl = encodeURIComponent('https://t.me/MonkeyFlipperBot/app');
        
        // Deep link для Tonkeeper
        const tonkeeperUrl = `https://app.tonkeeper.com/ton-connect?` +
            `v=2&id=${userData.id}&r=${returnUrl}`;
        
        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.openLink(tonkeeperUrl);
        } else {
            window.open(tonkeeperUrl, '_blank');
        }
        
        this.isConnecting = false;
    }

    async onWalletConnected(wallet) {
        console.log('✅ Кошелёк подключён:', JSON.stringify(wallet, null, 2));
        
        const userData = getTelegramUserId();
        
        // TON Connect возвращает адрес в wallet.account.address (raw format)
        // или может быть в wallet.account.publicKey
        const address = wallet.account?.address || wallet.address;
        
        console.log('📍 Извлечённый адрес:', address);

        if (!address) {
            console.error('❌ Нет адреса в wallet. Структура:', Object.keys(wallet));
            this.showError('Не удалось получить адрес кошелька');
            return;
        }

        // Сохраняем на сервер
        try {
            console.log('📤 Отправка на сервер:', { userId: userData.id, walletAddress: address });
            
            const response = await fetch(`${API_SERVER_URL}/api/wallet/connect-ton`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userData.id,
                    walletAddress: address
                })
            });

            const data = await response.json();
            console.log('📥 Ответ сервера:', data);

            if (data.success) {
                console.log('✅ Кошелёк сохранён на сервере');
                // Перезагружаем сцену
                this.scene.restart();
            } else {
                this.showError(data.error || 'Ошибка сохранения');
            }
        } catch (error) {
            console.error('❌ Ошибка сохранения кошелька:', error);
            this.showError('Ошибка соединения');
        }
    }

    async onWalletDisconnected() {
        console.log('🔌 Кошелёк отключён');
    }

    async disconnectWallet() {
        const userData = getTelegramUserId();

        try {
            // Отключаем через TON Connect UI если есть
            if (this.tonConnectUI) {
                try {
                    await this.tonConnectUI.disconnect();
                    console.log('✅ TON Connect отключён');
                } catch (tonError) {
                    // Игнорируем ошибки TON Connect - продолжаем удаление с сервера
                    console.log('⚠️ TON Connect disconnect error (игнорируем):', tonError.message);
                }
            }

            // Удаляем с сервера
            const response = await fetch(`${API_SERVER_URL}/api/wallet/disconnect-ton`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userData.id })
            });

            const data = await response.json();

            if (data.success) {
                console.log('✅ Кошелёк отключён на сервере');
                this.scene.restart();
            } else {
                // Даже если сервер вернул ошибку, перезагружаем сцену
                console.warn('⚠️ Сервер вернул:', data.error);
                this.scene.restart();
            }
        } catch (error) {
            console.error('❌ Ошибка отключения:', error);
            // Всё равно перезагружаем сцену - возможно кошелёк уже отключён
            this.scene.restart();
        }
    }

    createCard(x, y, width, height, color) {
        const card = this.add.graphics();
        card.fillStyle(color, 0.85);
        card.fillRoundedRect(x, y, width, height, 12);
        card.lineStyle(2, 0xffffff, 0.3);
        card.strokeRoundedRect(x, y, width, height, 12);
    }

    createButton(x, y, text, color, callback) {
        const btn = this.add.graphics();
        btn.fillStyle(color, 1);
        btn.fillRoundedRect(x - 130, y - 22, 260, 44, 10);

        const btnText = this.add.text(x, y, text, {
            fontSize: '16px',
            fill: '#FFFFFF',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        const btnZone = this.add.rectangle(x, y, 260, 44, 0x000000, 0)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', callback)
            .on('pointerover', () => btn.setAlpha(0.8))
            .on('pointerout', () => btn.setAlpha(1));
    }

    createBackButton() {
        const backBtn = this.add.graphics();
        backBtn.fillStyle(0xFF4444, 1);
        backBtn.fillRoundedRect(20, CONSTS.HEIGHT - 70, 120, 50, 8);
        
        this.add.text(80, CONSTS.HEIGHT - 45, 'Назад', {
            fontSize: '18px',
            fill: '#FFFFFF',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.add.rectangle(80, CONSTS.HEIGHT - 45, 120, 50, 0x000000, 0)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('MenuScene'));
    }

    showError(message) {
        const errorText = this.add.text(CONSTS.WIDTH / 2, CONSTS.HEIGHT - 120, `❌ ${message}`, {
            fontSize: '14px',
            fill: '#FF6666',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.time.delayedCall(3000, () => errorText.destroy());
    }
}
