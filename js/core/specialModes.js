// ===== Махсус режимлар логикаси =====
const SpecialModes = {
    // ===== Режимга қараб ўйинни созлаш =====
    setup(mode, game) {
        console.log('🎮 Махсус режим:', mode.special);

        switch (mode.special) {
            case 'zombie':
                this.setupZombie(game);
                break;
            case 'hunger':
                this.setupHunger(game);
                break;
            case 'hunt':
                this.setupHunt(game);
                break;
            case 'speed':
                this.setupSpeed(game);
                break;
            case 'night':
                this.setupNight(game);
                break;
        }
    },

    // ===== ЗОМБИ =====
    setupZombie(game) {
        // Ботлар — секин, кўп
        game.bots.forEach(bot => {
            bot.thinkInterval = 250;
            bot.aggression = 1.0;  // Ҳаммаси ҳужум
            bot.intelligence = 0.3;
        });

        // Ўйинчи кучлироқ
        game.snake.grow(10);

        // Қизил тун
        game.zombieMode = true;
        console.log('🧟 Зомби режими: 50 та бот, ҳаммаси ҳужум');
    },

    // ===== ОЧЛИК ЎЙИНИ =====
    setupHunger(game) {
        // Кичик карта вақт ўтиши билан
        game.originalMapSize = { cols: game.worldCols, rows: game.worldRows };
        game.shrinkInterval = setInterval(() => {
            if (!game.isRunning) return;
            if (game.worldCols > 300) {
                game.worldCols -= 50;
                game.worldRows -= 50;
                console.log('🗺️ Карта кичрайди:', game.worldCols);
            }
        }, 30000);  // Ҳар 30 сонияда

        // Очлик режимида овқат секинроқ камаяди
        game.foodReductionInterval = setInterval(() => {
            if (!game.isRunning) return;
            // Фақат 5% камаяди (аввал 10% эди)
            const newLength = Math.floor(game.food.items.length * 0.95);
            game.food.items = game.food.items.slice(0, newLength);
        }, 15000);

        console.log('🍽️ Очлик ўйини: карта кичраяди');
    },

    // ===== ОВ =====
    setupHunt(game) {
        // Ўйинчи катта
        game.snake.grow(45);  // 50 бўғин

        // Ботлар кичик ва қочади
        game.bots.forEach(bot => {
            bot.isPrey = true;
            bot.thinkInterval = 150;
            bot.aggression = -0.5;  // Қочади
            bot.intelligence = 0.7;
            // Кичик қилиш
            while (bot.body.length > 3) bot.body.pop();
        });

        console.log('🎯 Ов режими: Сиз катта, ботлар кичик');
    },

    // ===== ТЕЗЛИК =====
    setupSpeed(game) {
        // 2х тезлик
        game.speed = Math.floor(game.baseSpeed / 2);
        clearInterval(game.loop);
        game.loop = setInterval(() => game.update(), game.speed);

        // Кўп овқат
        game.food.spawn(300);

        console.log('⚡ Тезлик режими: 2х тезлик');
    },

    // ===== ТУН =====
    setupNight(game) {
        game.nightMode = true;
        console.log('🌙 Тун режими: фақат яқин атроф кўринади');
    },

    // ===== Тозалаш =====
    cleanup(game) {
        if (game.shrinkInterval) clearInterval(game.shrinkInterval);
        if (game.foodReductionInterval) clearInterval(game.foodReductionInterval);
        game.zombieMode = false;
        game.nightMode = false;
    }
};

console.log('✅ specialModes.js юкланди');

