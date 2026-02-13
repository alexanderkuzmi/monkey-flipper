// Конфиг Phaser
const config = {
    type: Phaser.CANVAS,
    width: CONSTS.WIDTH,
    height: CONSTS.HEIGHT,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    render: {
        antialias: true,
        pixelArt: false,
        roundPixels: false
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: CONSTS.GRAVITY },
            debug: CONSTS.DEBUG_PHYSICS
        },
    },
    scene: [MenuScene, LeaderboardScene, InventoryScene, StatsScene, WalletScene, AchievementsScene, DailyRewardScene, ReferralScene, TournamentScene, MatchmakingScene, DuelHistoryScene, PvPMenuScene, ProfileScene, GameScene]
};

const game = new Phaser.Game(config);

// Auto-start scene from URL param (when redirected from Rive lobby)
(function() {
    const autoMode = new URLSearchParams(window.location.search).get('mode');
    if (!autoMode) return;
    game.events.once('ready', function() {
        // Wait for MenuScene to finish create(), then switch
        var menu = game.scene.getScene('MenuScene');
        menu.events.once('create', function() {
            switch (autoMode) {
                case 'solo':
                    menu.scene.start('GameScene');
                    break;
                case '1v1':
                    menu.scene.start('MatchmakingScene');
                    break;
                case 'tournament':
                    menu.scene.start('TournamentScene');
                    break;
            }
        });
    });
})();