// ==================== INVENTORY SCENE ====================
class InventoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'InventoryScene' });
        this.purchases = [];
        this.equipped = {};
    }

    async create() {
        // Фон
        this.background = this.add.image(0, 0, 'background_img_menu').setOrigin(0, 0);
        this.background.setDisplaySize(CONSTS.WIDTH, CONSTS.HEIGHT);

        // Заголовок - улучшенный стиль как в меню
        this.add.text(CONSTS.WIDTH / 2, 50, '🎒 Инвентарь', {
            fontSize: '28px',
            fill: '#FFFFFF',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Загружаем данные
        const userData = getTelegramUserId();
        await this.loadInventory(userData.id);

        // Кнопка назад - улучшенный стиль
        const backBtn = this.add.graphics();
        backBtn.fillStyle(0xFF4444, 1);
        backBtn.fillRoundedRect(20, CONSTS.HEIGHT - 70, 120, 50, 8);
        
        const backText = this.add.text(80, CONSTS.HEIGHT - 45, 'Назад', {
            fontSize: '18px',
            fill: '#FFFFFF',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        const backZone = this.add.rectangle(80, CONSTS.HEIGHT - 45, 120, 50, 0x000000, 0)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('MenuScene'));
    }

    async loadInventory(userId) {
        try {
            // Загружаем покупки и экипировку
            const [purchasesRes, equippedRes] = await Promise.all([
                fetch(`${API_SERVER_URL}/api/shop/purchases/${userId}`),
                fetch(`${API_SERVER_URL}/api/user/equipped/${userId}`)
            ]);

            const purchasesData = await purchasesRes.json();
            const equippedData = await equippedRes.json();

            if (purchasesData.success) {
                this.purchases = purchasesData.purchases;
            }

            if (equippedData.success) {
                this.equipped = equippedData.equipped;
            }

            this.displayItems();
        } catch (error) {
            console.error('❌ Ошибка загрузки инвентаря:', error);
            this.add.text(CONSTS.WIDTH / 2, CONSTS.HEIGHT / 2, 'Ошибка загрузки', {
                fontSize: '20px',
                fill: '#F00'
            }).setOrigin(0.5);
        }
    }

    displayItems() {
        if (this.purchases.length === 0) {
            this.add.text(CONSTS.WIDTH / 2, CONSTS.HEIGHT / 2, 'Инвентарь пуст\n\nПокупайте предметы в магазине!', {
                fontSize: '18px',
                fill: '#FFFFFF',
                fontFamily: 'Arial',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
            return;
        }

        const startY = 120;
        const itemHeight = 85;

        this.purchases.forEach((item, index) => {
            const y = startY + (index * itemHeight);
            const isEquipped = Object.values(this.equipped).includes(item.item_id);
            
            // Подсчитываем общее количество (active + equipped)
            const activeCount = parseInt(item.count) || 0;
            const equippedCount = parseInt(item.equipped_count) || 0;
            const totalCount = activeCount + equippedCount;

            // Фон предмета с обводкой
            const bg = this.add.graphics();
            bg.fillStyle(isEquipped ? 0x4CAF50 : 0x2a2a2a, 0.9);
            bg.fillRoundedRect(20, y, CONSTS.WIDTH - 40, 75, 12);
            bg.lineStyle(2, isEquipped ? 0x81C784 : 0x444444, 1);
            bg.strokeRoundedRect(20, y, CONSTS.WIDTH - 40, 75, 12);

            // Название с количеством - улучшенный стиль
            const countText = totalCount > 1 ? ` x${totalCount}` : '';
            this.add.text(35, y + 12, item.item_name + countText, {
                fontSize: '16px',
                fill: '#FFFFFF',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 1
            });

            // Статус - улучшенный стиль
            const statusText = isEquipped ? '✅ ЭКИПИРОВАНО' : '📦 В инвентаре';
            this.add.text(35, y + 38, statusText, {
                fontSize: '13px',
                fill: isEquipped ? '#90EE90' : '#BBBBBB',
                fontFamily: 'Arial'
            });

            // Кнопки справа - улучшенный стиль
            if (isEquipped) {
                // Кнопка "Снять" для экипированных предметов
                const unequipBtn = this.add.graphics();
                unequipBtn.fillStyle(0xFF5722, 1);
                unequipBtn.fillRoundedRect(CONSTS.WIDTH - 130, y + 18, 100, 38, 8);

                this.add.text(CONSTS.WIDTH - 80, y + 37, 'Снять', {
                    fontSize: '14px',
                    fill: '#FFFFFF',
                    fontFamily: 'Arial',
                    fontStyle: 'bold',
                    stroke: '#000000',
                    strokeThickness: 1
                }).setOrigin(0.5);

                const unequipZone = this.add.rectangle(CONSTS.WIDTH - 80, y + 37, 100, 38, 0x000000, 0)
                    .setInteractive({ useHandCursor: true })
                    .on('pointerdown', () => this.unequipItem(item));
            } else {
                // Кнопка "Надеть" (короче чем "Экипировать")
                const equipBtn = this.add.graphics();
                equipBtn.fillStyle(0x2196F3, 1);
                equipBtn.fillRoundedRect(CONSTS.WIDTH - 130, y + 18, 100, 38, 8);

                this.add.text(CONSTS.WIDTH - 80, y + 37, 'Надеть', {
                    fontSize: '14px',
                    fill: '#FFFFFF',
                    fontFamily: 'Arial',
                    fontStyle: 'bold',
                    stroke: '#000000',
                    strokeThickness: 1
                }).setOrigin(0.5);

                const equipZone = this.add.rectangle(CONSTS.WIDTH - 80, y + 37, 100, 38, 0x000000, 0)
                    .setInteractive({ useHandCursor: true })
                    .on('pointerdown', () => this.equipItem(item));
            }
        });
    }

    async equipItem(item) {
        const userData = getTelegramUserId();
        
        // Определяем тип предмета по ID
        let itemType = 'skin';
        if (item.item_id.includes('nft_')) itemType = 'nft';
        else if (item.item_id.includes('boost_')) itemType = 'boost';

        try {
            const response = await fetch(`${API_SERVER_URL}/api/user/equip`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userData.id,
                    itemId: item.item_id,
                    itemType: itemType
                })
            });

            const data = await response.json();

            if (data.success) {
                console.log('✅ Экипировано:', item.item_name);
                // Перезагружаем сцену
                this.scene.restart();
            } else {
                console.error('❌ Ошибка экипировки:', data.error);
            }
        } catch (error) {
            console.error('❌ Ошибка запроса:', error);
        }
    }

    async unequipItem(item) {
        const userData = getTelegramUserId();
        
        // Определяем тип предмета
        let itemType = 'skin';
        if (item.item_id.includes('nft_')) itemType = 'nft';
        else if (item.item_id.includes('boost_')) itemType = 'boost';

        try {
            const response = await fetch(`${API_SERVER_URL}/api/user/unequip`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userData.id,
                    itemType: itemType,
                    itemId: item.item_id // Передаем itemId для возврата в active
                })
            });

            const data = await response.json();

            if (data.success) {
                console.log('✅ Снято:', item.item_name);
                // Перезагружаем сцену
                this.scene.restart();
            } else {
                console.error('❌ Ошибка снятия:', data.error);
            }
        } catch (error) {
            console.error('❌ Ошибка запроса:', error);
        }
    }
}
