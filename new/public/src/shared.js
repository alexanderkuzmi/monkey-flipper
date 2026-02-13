// ==================== SEEDED RANDOM NUMBER GENERATOR ====================
// Для детерминированной генерации платформ в 1v1 режиме
class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }
    
    // Простой LCG (Linear Congruential Generator)
    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
    
    // Случайное число в диапазоне [min, max]
    range(min, max) {
        return min + this.next() * (max - min);
    }
    
    // Случайное целое число в диапазоне [min, max]
    intRange(min, max) {
        return Math.floor(this.range(min, max + 1));
    }
}

// ==================== TON TESTNET CONFIGURATION ====================
// ВКЛЮЧИТЬ ДЛЯ ТЕСТИРОВАНИЯ TON ПЛАТЕЖЕЙ
const USE_TON_TESTNET = true;
const TON_CONFIG = {
    network: USE_TON_TESTNET ? 'testnet' : 'mainnet',
    // Тестовый кошелек для приема платежей
    testnetWallet: '0QAuolwKTSJL7oym-YjpjLDhsoEHbr-sVQcc6gRIKkhH_VZI'
};

// ==================== SERVER CONFIGURATION ====================
const isLocal = window.location.hostname === 'localhost';

// Socket.IO сервер (Render) - для 1v1 матчмейкинга
const SOCKET_SERVER_URL = isLocal
    ? 'http://localhost:3000'
    : 'https://monkey-flipper-1v1.onrender.com';

// API сервер (Render) - для сохранения счетов и лидерборда
const API_SERVER_URL = isLocal
    ? 'http://localhost:3001'
    : 'https://monkey-flipper-djm1.onrender.com';

// Старая переменная для обратной совместимости (используется в Socket.IO коде)
const SERVER_URL = SOCKET_SERVER_URL;  

// НОВОЕ: Функция получения Telegram User ID
function getTelegramUserId() {
    try {
        const tg = window.Telegram?.WebApp;
        
        // ДИАГНОСТИКА: показываем что есть
        if (window.location.search.includes('debug')) {
            alert('Telegram: ' + (tg ? 'Есть' : 'Нет') + 
                  '\nUser: ' + (tg?.initDataUnsafe?.user ? 'Есть' : 'Нет'));
        }
        
        if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
            console.log('✅ Telegram user detected:', tg.initDataUnsafe.user);
            return {
                id: tg.initDataUnsafe.user.id.toString(),
                username: tg.initDataUnsafe.user.username || tg.initDataUnsafe.user.first_name || 'Anonymous'
            };
        }
    } catch (e) {
        console.error('❌ Ошибка получения Telegram ID:', e);
    }
    
    // Fallback: создаем анонимный ID (сохраняется в localStorage)
    let anonymousId = localStorage.getItem('anonymousUserId');
    
    // 🔧 ВРЕМЕННЫЙ ФИХ: Для тестирования 1v1 - генерируем НОВЫЙ ID при ?test=1
    // В продакшне это отключено - каждый пользователь имеет свой ID
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('test')) {
        // Только для тестирования - каждая вкладка = новый игрок
        anonymousId = 'anonymous_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    } else if (!anonymousId) {
        // Обычный режим - сохраняем ID
        anonymousId = 'anonymous_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('anonymousUserId', anonymousId);
    }
    
    console.log('⚠️ Используется анонимный ID:', anonymousId);
    return { id: anonymousId, username: 'Anonymous' };
}

// НОВОЕ: Функция отправки счета на сервер
async function saveScoreToServer(userId, username, score) {
    try {
        // Округляем счет до целого числа для базы данных
        const roundedScore = Math.round(score);
        console.log(`📤 Отправка счета на сервер: userId=${userId}, score=${roundedScore}`);
        
        const response = await fetch(`${API_SERVER_URL}/api/save-score`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId,
                username: username,
                score: roundedScore,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Сервер ответил:', result);
        
        // Возвращаем результат (новый рекорд или нет) + информация о монетах
        return {
            success: true,
            isNewRecord: result.isNewRecord,
            bestScore: result.bestScore,
            gamesPlayed: result.gamesPlayed,
            coinsEarned: result.coinsEarned || 0,
            newBalance: result.newBalance || 0
        };
    } catch (error) {
        console.error('❌ Ошибка отправки счета на сервер:', error);
        
        // Сохраняем в очередь для повторной отправки
        savePendingScore(userId, username, score);
        
        return {
            success: false,
            error: error.message
        };
    }
}

// НОВОЕ: Сохранение неотправленных счетов для повторной попытки
function savePendingScore(userId, username, score) {
    try {
        // Округляем счет до целого числа
        const roundedScore = Math.round(score);
        const pending = JSON.parse(localStorage.getItem('pendingScores') || '[]');
        pending.push({
            userId: userId,
            username: username,
            score: roundedScore,
            timestamp: Date.now()
        });
        // Храним максимум 10 неотправленных счетов
        if (pending.length > 10) {
            pending.shift();
        }
        localStorage.setItem('pendingScores', JSON.stringify(pending));
        console.log('💾 Счет сохранен локально для повторной отправки');
    } catch (e) {
        console.error('Ошибка сохранения в pendingScores:', e);
    }
}

// НОВОЕ: Попытка отправить неотправленные счеты
async function retryPendingScores() {
    try {
        const pending = JSON.parse(localStorage.getItem('pendingScores') || '[]');
        if (pending.length === 0) return;

        console.log(`🔄 Попытка отправить ${pending.length} неотправленных счетов`);

        for (const item of pending) {
            const result = await saveScoreToServer(item.userId, item.username, item.score);
            if (result.success) {
                // Убираем успешно отправленный счет из очереди
                const index = pending.indexOf(item);
                pending.splice(index, 1);
            }
        }

        localStorage.setItem('pendingScores', JSON.stringify(pending));
    } catch (e) {
        console.error('Ошибка повторной отправки:', e);
    }
}

// Константы
const CONSTS = {
    // АДАПТИВНАЯ ШИРИНА: подстраивается под экран
    WIDTH: (() => {
        // Для мобильных - используем ширину окна
        const screenWidth = window.innerWidth || 640;
        // Ограничиваем минимум 320 (старые телефоны) и максимум 1920 (десктоп)
        return Math.min(Math.max(screenWidth, 320), 1920);
    })(),
    HEIGHT: (() => {
        // Для Telegram используем viewportHeight, для браузера - innerHeight
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.viewportHeight) {
            console.log('📱 Используем Telegram viewportHeight:', window.Telegram.WebApp.viewportHeight);
            return window.Telegram.WebApp.viewportHeight;
        }
        const screenHeight = window.innerHeight || 800;
        console.log('🌐 Используем window.innerHeight:', screenHeight);
        return screenHeight;
    })(),
    GRAVITY: 650, // ФИКС: Увеличено в 2 раза (было 300) - прыжки быстрее
    JUMP_VELOCITY: -660, // ФИКС: Ещё больше увеличено (было -550) - чтобы допрыгивать до платформ
    MOVE_VELOCITY: 300,
    WALL_SLIDE_SPEED: 200, // ФИКС: Увеличено в 2 раза (было 100) - чтобы соответствовать скорости игры
    RECYCLE_DISTANCE: 500, // ФИКС: Ещё меньше (с 1500), реже авто-recycle
    PLATFORM_GAP: 250,
    SCORE_HEIGHT_INCREMENT: 10,
    SCORE_KILL: 100,
    PLAYER_BOUNCE: 0,
    DEBUG_PHYSICS: true,
    FALL_IMPACT_THRESHOLD: 5, // НОВОЕ: Минимальная скорость падения для game over на земле (чтобы отличить старт от падения)
    // НОВОЕ: Параметры для типов платформ
    PLATFORM_TYPE_NORMAL_PERCENT: 60, // 60% обычных шариков
    PLATFORM_TYPE_MOVING_PERCENT: 30, // 30% движущихся шариков
    PLATFORM_TYPE_UNBREAKABLE_PERCENT: 10, // 10% нелопающихся шариков
    MOVING_PLATFORM_SPEED: 20, // Скорость движения шариков
    MOVING_PLATFORM_RANGE: 150, // Диапазон движения (px влево/вправо)
    BALLOON_SMASH_DURATION: 300, // НОВОЕ: Длительность анимации взрыва шарика (ms) - было 1000
};

// ФИКС: DPI для четкого текста на Retina дисплеях
const DPR = Math.min(window.devicePixelRatio || 1, 2);
