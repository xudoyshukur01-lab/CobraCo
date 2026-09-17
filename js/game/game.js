// ===== Асосий ўйин =====
const Game = {
    snake: null, snakes: [], bots: [], food: null,
    renderer: null, camera: null, zone: null,
    score: 0, respawnsLeft: 3, speed: 0,
    loop: null, botLoop: null, timerInterval: null,
    timeLeft: 0, isRunning: false, isOver: false,
    canvas: null, worldCols: 500, worldRows: 500,
    baseSpeed: 150, top5Interval: null,
    playerTrophies: 0,
    resizeTimeout: null,
    resizeAttempts: 0,

    init() {
        this.canvas = document.getElementById('gameCanvas');
        const miniMap = document.getElementById('miniMap');
        this.camera = new Camera(400, 400, CONFIG.GRID);
        this.renderer = new Renderer(this.canvas, miniMap, this.camera);
        this.food = new FoodManager(500, 500);

        Input.init(d => {
            if (this.isRunning && this.snake && this.snake.alive) this.snake.setDirection(d);
        });

        document.getElementById('startBtn').addEventListener('click', () => {
            if (this.isOver) { this.prepare(); this.beginPlay(); }
            else { this.beginPlay(); }
        });
        document.getElementById('backBtn').addEventListener('click', () => this.backToZones());

        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => this.resizeCanvas(), 100);
        });
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.resizeCanvas(), 300);
        });
    },

    // ===== ТУЗАТИЛГАН: Canvas мослаш =====
    resizeCanvas() {
        const wrap = document.getElementById('canvasWrap');
        const screen = document.getElementById('gameScreen');
        if (!wrap || !screen) return;

        // Экран кўринишини текшириш
        if (!screen.classList.contains('active')) {
            return;  // Экран кўринмаса — мосламаймиз
        }

        const rect = wrap.getBoundingClientRect();

        // Агар wrap кичик бўлса — яна бир марта уриниб кўрамиз
        if (rect.width < 100 || rect.height < 100) {
            this.resizeAttempts++;
            if (this.resizeAttempts < 10) {
                setTimeout(() => this.resizeCanvas(), 100);
            }
            return;
        }

        this.resizeAttempts = 0;

        const size = Math.floor(Math.min(rect.width, rect.height)) - 4;
        if (size < 100) return;

        // ⚠️ Агар бир хил ўлчам бўлса — қайта ўрнатмаймиз (циклни тўхтатиш)
        if (this.canvas.width === size && this.canvas.height === size) {
            return;
        }

        this.canvas.width = size;
        this.canvas.height = size;
        this.canvas.style.width = size + 'px';
        this.canvas.style.height = size + 'px';

        if (this.camera) this.camera.updateSize(size, size);

        console.log('📐 Canvas:', size + 'x' + size, '(wrap:', Math.round(rect.width) + 'x' + Math.round(rect.height) + ')');
    },

    // ===== Экранни кўрсатиб, сўнг мослаш =====
    showGameAndResize() {
        const screen = document.getElementById('gameScreen');

        // 1. Экранни кўрсатиш
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        screen.classList.add('active');

        // 2. Экранни мажбурлаймиз — reflow
        void screen.offsetHeight;

        // 3. Кейин мослаш (requestAnimationFrame билан)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.resizeCanvas();
                // Қўшимча мослаш
                setTimeout(() => this.resizeCanvas(), 100);
                setTimeout(() => this.resizeCanvas(), 300);
            });
        });
    },

    start(zone) {
        this.zone = zone;
        const mapCfg = MAP_SIZES[String(GameState.settings.mapSize)] || MAP_SIZES['500'];
        this.worldCols = mapCfg.cols;
        this.worldRows = mapCfg.rows;
        this.food = new FoodManager(this.worldCols, this.worldRows);
        // Овқат сони режимга қараб кейинроқ

        // Экранни кўрсатиб, кейин мослаш
        this.showGameAndResize();

        // Ўйинни тайёрлаш
        this.prepare();
        this.loadTop5();
    },

    async loadTop5() {
        // Zone ID ни аниқлаш (zone ёки mode)
        const zoneId = this.zone?.id || this.mode?.id || 'classic';

        if (typeof FirebaseDB === 'undefined' || !FirebaseDB.isReady) {
            console.log('⚠️ Firebase йўқ — ТОП-5 ўтказиб юборилди');
            return;
        }
        try {
            const top = await FirebaseDB.getLeaderboard('global', 5);
            this.renderTop5(top);
        } catch (e) {
            console.error('❌ loadTop5:', e.message);
        }
    },

    renderTop5(top) {
        const list = document.getElementById('top5List');
        if (!list) return;
        list.innerHTML = '';
        const myId = TelegramAuth.user ? TelegramAuth.user.id : 0;
        top.forEach((d, i) => {
            const rank = i + 1;
            const isMe = d.telegramId === myId;
            const name = d.username ? '@' + d.username : (d.firstName || 'X');
            const icons = ['🥇','🥈','🥉','4️⃣','5️⃣'];
            const row = document.createElement('div');
            row.className = 'top5-item' + (isMe ? ' me' : '');
            row.innerHTML = '<span class="top5-rank">' + (icons[i] || rank) + '</span><span class="top5-name">' + name + '</span><span class="top5-score">' + d.score + '</span>';
            list.appendChild(row);
        });
        if (top.length === 0) {
            list.innerHTML = '<div style="font-size:10px;color:#64748b;text-align:center;">Ҳали натижа йўқ</div>';
        }
    },

    prepare() {
        this.snakes = []; this.bots = []; this.food.clear();
        this.score = 0;
        this.respawnsLeft = CONFIG.MAX_RESPAWNS;
        this.isOver = false;

        // Режимга қараб тезлик
        let speedMultiplier = 1.0;
        if (this.mode) {
            // Махсус режимлар
            if (this.mode.id === 'speed') {
                speedMultiplier = 2.0;
            }
        } else if (this.zone) {
            speedMultiplier = this.zone.speedMultiplier || 1.0;
        }

        this.baseSpeed = CONFIG.BASE_SPEED / speedMultiplier;
        this.speed = this.baseSpeed;
        this.timeLeft = GameState.settings.gameTime;

        document.getElementById('score').textContent = 0;
        document.getElementById('respawn').textContent = this.respawnsLeft;
        document.getElementById('trophyResult').innerHTML = '';
        this.updateTimerDisplay();

        this.playerTrophies = Storage.getTrophies();

        // Ўйинчи ранги
        let playerColor = '#4ade80';
        if (this.zone) playerColor = this.zone.color;
        else if (this.mode) playerColor = this.mode.color;

        this.snake = new Snake({
            id:'player', isPlayer:true, color:playerColor, name:'Сиз',
            worldCols:this.worldCols, worldRows:this.worldRows,
            startX: Math.floor(this.worldCols/2), startY: Math.floor(this.worldRows/2), length:5
        });
        this.snakes.push(this.snake);

        // Ботлар
        const colors = ['#ef4444','#fbbf24','#a78bfa','#22d3ee','#f472b6','#84cc16','#f97316','#06b6d4','#8b5cf6','#ec4899'];
        const botNames = ['Аждар','Кобра','Питон','Анаконда','Гюрза','Мамба','Випера','Удав','Тайпан','Боа'];

        const botCount = GameState.settings.bots || 3;
        for (let i = 0; i < botCount; i++) {
            const b = new Snake({
                id:'bot_'+i, isPlayer:false,
                color:colors[i%colors.length],
                name:botNames[i % botNames.length],
                worldCols:this.worldCols, worldRows:this.worldRows,
                startX: Math.floor(Math.random()*this.worldCols),
                startY: Math.floor(Math.random()*this.worldRows),
                length: 5 + Math.floor(Math.random()*5)
            });
            this.snakes.push(b);
            this.bots.push(new BotController(b, this, 'medium'));
        }

        // Овқат сони режимга қараб
        const foodCount = this.mode?.foodCount || CONFIG.FOOD_INITIAL;
        this.food.spawn(foodCount);
        console.log('🍎 Овқатлар:', foodCount, '| Карта:', this.worldCols + 'x' + this.worldRows);
        this.camera.x = this.snake.getHead().x - (this.canvas.width / CONFIG.GRID) / 2;
        this.camera.y = this.snake.getHead().y - (this.canvas.height / CONFIG.GRID) / 2;
        this.render();
        this.showOverlay('🐍 ' + (this.zone?.name || this.mode?.name || 'Ўйин'), 'Бошлаш учун тугмани босинг', 'Бошлаш');
    },

    beginPlay() {
        this.hideOverlay();
        this.isRunning = true;
        this.speed = this.baseSpeed;
        clearInterval(this.loop);
        this.loop = setInterval(() => this.update(), this.speed);
        this.botLoop = setInterval(() => {
            const n = Date.now();
            this.bots.forEach(b => b.update(n));
        }, 100);
        this.startTimer();
        clearInterval(this.top5Interval);
        this.top5Interval = setInterval(() => this.loadTop5(), CONFIG.TOP5_UPDATE_INTERVAL);
    },

    startTimer() {
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (!this.isRunning) return;
            this.timeLeft--;
            this.updateTimerDisplay();
            if (this.timeLeft <= 0) this.gameOver('Вақт тугади!');
        }, 1000);
    },

    updateTimerDisplay() {
        const m = Math.floor(this.timeLeft / 60);
        const s = this.timeLeft % 60;
        document.getElementById('timer').textContent = m + ':' + String(s).padStart(2, '0');
    },

    update() {
        if (!this.isRunning) return;
        this.snakes.forEach(s => {
            if (!s.alive) return;
            const h = s.move();
            if (!h) return;
            s.applyMove(h);
            const eaten = this.food.checkEat(h);
            if (eaten) this.handleFoodEaten(s, eaten);
        });
        if (this.food.items.length < CONFIG.FOOD_MIN) this.food.spawn(CONFIG.FOOD_SPAWN_BATCH);
        Collision.checkSnakes(this.snakes, this.food);
        if (!this.snake.alive) this.handlePlayerDeath();
        if (this.snake.alive)
            this.camera.follow(this.snake.getHead().x, this.snake.getHead().y);
        this.render();
    },

    handleFoodEaten(snake, foodItem) {
        const type = foodItem.type;
        const scoreDelta = type.score;
        if (snake.isPlayer) {
            this.score = Math.max(0, this.score + scoreDelta);
            document.getElementById('score').textContent = this.score;
        }
        if (type.grow !== 0) snake.grow(type.grow);
        if (type.effect === 'speed') {
            snake.applySpeedBoost(type.duration);
            if (snake.isPlayer) this.applySpeedBoostToLoop();
        } else if (type.effect === 'shield') {
            snake.applyShield(type.duration);
        }
    },

    applySpeedBoostToLoop() {
        const boostedSpeed = Math.max(CONFIG.MIN_SPEED, this.speed - 40);
        clearInterval(this.loop);
        this.loop = setInterval(() => this.update(), boostedSpeed);
        setTimeout(() => {
            if (!this.isRunning) return;
            this.speed = this.baseSpeed;
            clearInterval(this.loop);
            this.loop = setInterval(() => this.update(), this.speed);
        }, 5000);
    },

    handlePlayerDeath() {
        if (this.isOver) return;
        if (this.respawnsLeft > 1) {
            this.respawnsLeft--;
            document.getElementById('respawn').textContent = this.respawnsLeft;
            setTimeout(() => {
                if (this.isOver) return;
                this.snake.reset(Math.floor(Math.random()*this.worldCols), Math.floor(Math.random()*this.worldRows), 5);
                this.snake.alive = true;
                this.camera.x = this.snake.getHead().x - 10;
                this.camera.y = this.snake.getHead().y - 10;
            }, CONFIG.RESPAWN_DELAY);
        } else this.gameOver('Сиз ўлдингиз!');
    },

    render() {
        this.renderer.clear();
        this.renderer.drawGridLines(this.worldCols, this.worldRows);
        this.renderer.drawFood(this.food.items);
        this.snakes.forEach(s => { if (!s.isPlayer) this.renderer.drawSnake(s); });
        if (this.snake.alive) this.renderer.drawSnake(this.snake);
        this.renderer.drawMiniMap(this.snakes, this.worldCols, this.worldRows, this.camera);
    },

    async gameOver(reason) {
        if (this.isOver) return;
        this.isOver = true; this.isRunning = false;
        clearInterval(this.loop);
        clearInterval(this.botLoop);
        clearInterval(this.timerInterval);
        clearInterval(this.top5Interval);

        Storage.setBest(this.zone?.id || this.mode?.id || 'classic', this.score);

        if (typeof FirebaseDB !== 'undefined' && FirebaseDB.isReady) {
            await FirebaseDB.saveScore(this.zone?.id || this.mode?.id || 'classic', this.score);
        }

        const players = this.snakes.map(s => ({
            id: s.id, name: s.name,
            score: s.isPlayer ? this.score : Math.floor(Math.random() * this.score * 0.9),
            trophies: s.isPlayer ? this.playerTrophies : 0,
            isBot: !s.isPlayer
        }));

        const changes = Trophies.calculateChanges(players);
        const playerChange = changes['player'] || 0;
        const newTotal = Math.max(0, this.playerTrophies + playerChange);

        if (playerChange !== 0 && typeof FirebaseDB !== 'undefined' && FirebaseDB.isReady) {
            await FirebaseDB.updateTrophies(newTotal);
        }
        Storage.saveTrophies(newTotal);
        this.playerTrophies = newTotal;

        this.showTrophyResult(playerChange, newTotal);
        this.showOverlay('Ўйин тугади!', reason + '\nБаллингиз: ' + this.score, 'Қайта ўйнаш');
        TrophiesUI.updateHeader(newTotal);
        setTimeout(() => this.loadTop5(), 1500);
    },

    showTrophyResult(change, newTotal) {
        const el = document.getElementById('trophyResult');
        if (!el) return;
        const cls = Trophies.getChangeClass(change);
        const sign = Trophies.formatChange(change);
        const rank = Trophies.getRank(newTotal);
        const oldRank = Trophies.getRank(this.playerTrophies - change);
        const rankUp = rank.name !== oldRank.name;
        el.innerHTML = `
            <div class="trophy-change ${cls}">${sign} 🏆</div>
            <div class="trophy-new-total">${rank.icon} ${newTotal} кубок</div>
            ${rankUp ? `<div class="rank-up">🎉 Янги даража: ${rank.icon} ${rank.name}!</div>` : ''}
        `;
    },

    showOverlay(t, txt, b) {
        document.getElementById('overlayTitle').textContent = t;
        document.getElementById('overlayText').innerText = txt;
        document.getElementById('startBtn').textContent = b;
        document.getElementById('overlay').classList.remove('hidden');
    },
    hideOverlay() { document.getElementById('overlay').classList.add('hidden'); },

    backToZones() {
        clearInterval(this.loop);
        clearInterval(this.botLoop);
        clearInterval(this.timerInterval);
        clearInterval(this.top5Interval);
        this.isRunning = false; this.isOver = false;
        ZonesUI.render();
        document.getElementById('bestScore').textContent = Storage.getTotalBest();
        TrophiesUI.updateHeader(this.playerTrophies);
        showScreen('zonesScreen');
    }
};

console.log('✅ game.js юкланди');

// ===== ГУРУҲ ЎЙИНИ РЕЖИМИ =====
Game.startGroup = function(groupId) {
    this.groupId = groupId;
    this.isGroupMode = true;
    console.log('🎮 Гуруҳ ўйини:', groupId);

    // Оддий ўйинга ўхшаш, лекин гуруҳ режими
    const zone = ZONES[0];
    this.zone = zone;
    const mapCfg = MAP_SIZES[String(GameState.settings.mapSize)] || MAP_SIZES['500'];
    this.worldCols = mapCfg.cols;
    this.worldRows = mapCfg.rows;
    this.food = new FoodManager(this.worldCols, this.worldRows);
        // Овқат сони режимга қараб кейинроқ

    showScreen('gameScreen');
    setTimeout(() => this.resizeCanvas(), 50);
    this.prepare();
    this.loadTop5();
};

// gameOver'да гуруҳга балл юбориш
const _originalGameOver = Game.gameOver;
Game.gameOver = async function(reason) {
    if (this.isGroupMode && this.groupId && TelegramAuth.user) {
        try {
            await FirebaseDB.updateMemberScore(
                this.groupId,
                TelegramAuth.user.id,
                this.score
            );
            console.log('✅ Гуруҳга балл юборилди:', this.score);
        } catch (e) { console.error(e); }
    }
    return _originalGameOver.call(this, reason);
};

console.log('✅ game.js гуруҳ режими қўшилди');




// ===== РЕЖИМ БЎЙИЧА ЎЙИННИ БОШЛАШ =====
Game.startMode = function(mode) {
    console.log('🎮 Режим бошланди:', mode.id);

    this.mode = mode;

    // Карта ўлчами
    const mapCfg = MAP_SIZES[String(mode.mapSize)] || MAP_SIZES['500'];
    this.worldCols = mapCfg.cols;
    this.worldRows = mapCfg.rows;

    // Созламаларни ўрнатиш
    GameState.settings.bots = mode.bots;
    GameState.settings.gameTime = mode.gameTime;
    GameState.settings.mapSize = mode.mapSize;

    // Овқат
    this.food = new FoodManager(this.worldCols, this.worldRows);
        // Овқат сони режимга қараб кейинроқ

    // Экранни кўрсатиш
    showScreen('gameScreen');

    // Мослаш
    setTimeout(() => this.resizeCanvas(), 50);
    setTimeout(() => this.resizeCanvas(), 300);
    setTimeout(() => this.resizeCanvas(), 600);

    // Ўйинни тайёрлаш
    this.prepare();
    this.loadTop5();
};

console.log('✅ game.js startMode қўшилди');

// ===== ДУНЁ РЕЖИМИ ЎЙИНИ =====
Game.startWorld = function(session, remainingTime) {
    console.log('🌍 Дунё ўйини старт:', session.id, '| Вақт:', remainingTime);

    this.mode = GAME_MODES.find(m => m.id === 'world') || GAME_MODES[1];
    this.session = session;
    this.isWorldMode = true;

    // Карта
    const mapCfg = MAP_SIZES[String(this.mode.mapSize)] || MAP_SIZES['5000'];
    this.worldCols = mapCfg.cols;
    this.worldRows = mapCfg.rows;

    // Ўйин вақти
    this.timeLeft = remainingTime;
    GameState.settings.gameTime = remainingTime;

    // Ботлар сони — динамик
    const playerCount = session.players ? Object.keys(session.players).length : 1;
    const botCount = WorldMode.calculateBots(playerCount);
    GameState.settings.bots = botCount;

    console.log('🌍 Ўйинчилар:', playerCount, '| Ботлар:', botCount, '| Карта:', this.worldCols + 'x' + this.worldRows);

    // Овқат
    this.food = new FoodManager(this.worldCols, this.worldRows);
        // Овқат сони режимга қараб кейинроқ

    // Экранни кўрсатиш
    showScreen('gameScreen');
    setTimeout(() => this.resizeCanvas(), 50);
    setTimeout(() => this.resizeCanvas(), 300);

    // Ўйинни тайёрлаш
    this.prepare();
    this.loadTop5();

    // Реал-тайм sync
    if (RealtimeDB.isReady && session.id && !session.id.startsWith('local_')) {
        this.worldUpdateInterval = setInterval(() => {
            if (this.score > 0 && this.snake) {
                RealtimeDB.updateScore(session.id, TelegramAuth.user.id, this.score);
            }
        }, 5000);
    }
};

// ===== Дунё режимида ўйин тугаганда =====
const _originalGameOverWorld = Game.gameOver;
Game.gameOver = async function(reason) {
    if (this.worldUpdateInterval) {
        clearInterval(this.worldUpdateInterval);
        this.worldUpdateInterval = null;
    }

    // Реал-таймга якуний балл юбориш
    if (this.isWorldMode && this.session && RealtimeDB.isReady && TelegramAuth.user) {
        await RealtimeDB.updateScore(this.session.id, TelegramAuth.user.id, this.score);
    }

    return _originalGameOverWorld.call(this, reason);
};

console.log('✅ game.js startWorld қўшилди');




// ===== БОТЛАР КУБОК ЙИҒИШИ =====
// Ҳар ўйин тугагач, ҳар бот кубок олади/йўқотади
Game.updateBotTrophies = function() {
    // Ҳар ботнинг баллига қараб кубок
    const players = this.snakes.map(s => ({
        id: s.id,
        name: s.name,
        score: s.isPlayer ? this.score : (s.score || 0),
        isBot: !s.isPlayer
    }));

    // Σ = 0 формула
    const changes = Trophies.calculateChanges(players);

    // Ҳар ботга кубок
    players.forEach(p => {
        if (p.isBot) {
            const change = changes[p.id] || 0;
            // Бот кубокини сақлаш (localStorage ёки Firebase)
            const botRef = 'cobraco_bot_trophy_' + p.id;
            const current = parseInt(localStorage.getItem(botRef) || '0');
            const newTotal = Math.max(0, current + change);
            localStorage.setItem(botRef, String(newTotal));
        }
    });
};

// gameOver да бот кубокларини янгилаш
const _originalGameOverBots = Game.gameOver;
Game.gameOver = async function(reason) {
    if (this.updateBotTrophies) {
        this.updateBotTrophies();
    }
    return _originalGameOverBots.call(this, reason);
};

console.log('✅ game.js бот кубоклари қўшилди');
