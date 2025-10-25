// Variables globales del juego
let gameState = {
    player: null,
    playerPosition: 0,
    board: [],
    currentEnemy: null,
    inCombat: false,
    gold: 0,
    isDefending: false
};

// Definición de clases de personajes
const characterClasses = {
    warrior: {
        name: 'Guerrero',
        icon: '⚔️',
        maxHp: 120,
        hp: 120,
        maxMana: 30,
        mana: 30,
        attack: 18,
        defense: 15,
        magic: 5
    },
    mage: {
        name: 'Mago',
        icon: '🧙',
        maxHp: 80,
        hp: 80,
        maxMana: 100,
        mana: 100,
        attack: 8,
        defense: 8,
        magic: 20
    },
    rogue: {
        name: 'Ladrón',
        icon: '🗡️',
        maxHp: 100,
        hp: 100,
        maxMana: 50,
        mana: 50,
        attack: 14,
        defense: 12,
        magic: 10
    },
    cleric: {
        name: 'Clérigo',
        icon: '✨',
        maxHp: 100,
        hp: 100,
        maxMana: 80,
        mana: 80,
        attack: 12,
        defense: 13,
        magic: 16
    }
};

// Tipos de enemigos
const enemies = [
    { name: 'Goblin', icon: '👺', hp: 30, attack: 8, defense: 5, gold: 10 },
    { name: 'Orco', icon: '👹', hp: 50, attack: 12, defense: 8, gold: 20 },
    { name: 'Esqueleto', icon: '💀', hp: 40, attack: 10, defense: 6, gold: 15 },
    { name: 'Lobo', icon: '🐺', hp: 35, attack: 11, defense: 7, gold: 12 },
    { name: 'Araña Gigante', icon: '🕷️', hp: 45, attack: 13, defense: 5, gold: 18 },
    { name: 'Dragon', icon: '🐉', hp: 100, attack: 20, defense: 15, gold: 100 }
];

// Seleccionar personaje
function selectCharacter(classType) {
    gameState.player = { ...characterClasses[classType] };
    gameState.gold = 0;
    
    document.getElementById('character-selection').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
    
    updatePlayerUI();
    initializeBoard();
    addLog(`¡Has seleccionado a ${gameState.player.name}!`, 'success');
}

// Actualizar interfaz del jugador
function updatePlayerUI() {
    const player = gameState.player;
    
    document.getElementById('player-icon').textContent = player.icon;
    document.getElementById('player-class').textContent = player.name;
    document.getElementById('player-hp').textContent = Math.max(0, Math.floor(player.hp));
    document.getElementById('player-max-hp').textContent = player.maxHp;
    document.getElementById('player-mana').textContent = Math.max(0, Math.floor(player.mana));
    document.getElementById('player-max-mana').textContent = player.maxMana;
    document.getElementById('player-attack').textContent = player.attack;
    document.getElementById('player-defense').textContent = player.defense;
    document.getElementById('player-gold').textContent = gameState.gold;
    
    // Actualizar barras
    const hpPercent = (player.hp / player.maxHp) * 100;
    const manaPercent = (player.mana / player.maxMana) * 100;
    
    document.getElementById('hp-bar').style.width = hpPercent + '%';
    document.getElementById('mana-bar').style.width = manaPercent + '%';
}

// Inicializar tablero
function initializeBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';
    gameState.board = [];
    gameState.playerPosition = 0;
    
    // Crear 64 casillas
    for (let i = 0; i < 64; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell empty';
        cell.dataset.index = i;
        
        // Asignar tipo de casilla aleatoriamente
        let cellType = 'empty';
        const rand = Math.random();
        
        if (i === 0) {
            cellType = 'player';
        } else if (i === 63) {
            cellType = 'boss';
            cell.textContent = '🐉';
        } else if (rand < 0.15) {
            cellType = 'enemy';
            cell.textContent = '👹';
        } else if (rand < 0.25) {
            cellType = 'treasure';
            cell.textContent = '💰';
        } else if (rand < 0.30) {
            cellType = 'trap';
            cell.textContent = '⚠️';
        }
        
        gameState.board.push({ type: cellType, visited: i === 0 });
        cell.classList.add(cellType);
        
        if (i === 0) {
            cell.textContent = gameState.player.icon;
        }
        
        boardElement.appendChild(cell);
    }
}

// Mover jugador
function movePlayer() {
    const diceRoll = rollDice(6, false);
    const newPosition = Math.min(gameState.playerPosition + diceRoll, 63);
    
    // Limpiar posición anterior
    const cells = document.querySelectorAll('.cell');
    cells[gameState.playerPosition].textContent = '';
    cells[gameState.playerPosition].classList.remove('player');
    cells[gameState.playerPosition].classList.add('visited');
    
    gameState.playerPosition = newPosition;
    gameState.board[newPosition].visited = true;
    
    // Actualizar nueva posición
    cells[newPosition].classList.add('player');
    cells[newPosition].textContent = gameState.player.icon;
    
    addLog(`Te moviste ${diceRoll} casillas a la posición ${newPosition + 1}`, 'info');
    
    // Resolver evento de la casilla
    setTimeout(() => {
        resolveCellEvent(newPosition);
    }, 500);
}

// Resolver evento de casilla
function resolveCellEvent(position) {
    const cell = gameState.board[position];
    
    switch(cell.type) {
        case 'enemy':
            startCombat(false);
            break;
        case 'boss':
            startCombat(true);
            break;
        case 'treasure':
            const goldFound = Math.floor(Math.random() * 30) + 10;
            gameState.gold += goldFound;
            addLog(`¡Encontraste un tesoro! +${goldFound} oro 💰`, 'treasure');
            updatePlayerUI();
            cell.type = 'empty';
            break;
        case 'trap':
            const damage = Math.floor(Math.random() * 15) + 5;
            gameState.player.hp -= damage;
            addLog(`¡Caíste en una trampa! -${damage} HP ⚠️`, 'combat');
            updatePlayerUI();
            checkPlayerDeath();
            cell.type = 'empty';
            break;
    }
}

// Iniciar combate
function startCombat(isBoss) {
    gameState.inCombat = true;
    
    if (isBoss) {
        gameState.currentEnemy = { ...enemies[5] }; // Dragon
    } else {
        const randomEnemy = enemies[Math.floor(Math.random() * (enemies.length - 1))];
        gameState.currentEnemy = { ...randomEnemy };
    }
    
    gameState.currentEnemy.maxHp = gameState.currentEnemy.hp;
    
    document.getElementById('combat-screen').classList.add('active');
    updateCombatUI();
    
    addLog(`¡Apareció un ${gameState.currentEnemy.name}!`, 'combat');
    addCombatLog(`¡Un ${gameState.currentEnemy.name} salvaje apareció!`);
}

// Actualizar UI de combate
function updateCombatUI() {
    const player = gameState.player;
    const enemy = gameState.currentEnemy;
    
    document.getElementById('combat-player-icon').textContent = player.icon;
    document.getElementById('combat-player-name').textContent = player.name;
    document.getElementById('combat-player-hp').textContent = Math.max(0, Math.floor(player.hp));
    document.getElementById('combat-player-max-hp').textContent = player.maxHp;
    
    document.getElementById('enemy-icon').textContent = enemy.icon;
    document.getElementById('enemy-name').textContent = enemy.name;
    document.getElementById('enemy-hp').textContent = Math.max(0, Math.floor(enemy.hp));
    document.getElementById('enemy-max-hp').textContent = enemy.maxHp;
    
    const playerHpPercent = (player.hp / player.maxHp) * 100;
    const enemyHpPercent = (enemy.hp / enemy.maxHp) * 100;
    
    document.getElementById('combat-hp-bar').style.width = playerHpPercent + '%';
    document.getElementById('enemy-hp-bar').style.width = enemyHpPercent + '%';
}

// Atacar
function attack() {
    const player = gameState.player;
    const enemy = gameState.currentEnemy;
    
    // Turno del jugador
    const playerDamage = Math.max(1, player.attack - enemy.defense + Math.floor(Math.random() * 6));
    enemy.hp -= playerDamage;
    
    addCombatLog(`⚔️ ${player.name} ataca causando ${playerDamage} de daño`);
    
    if (enemy.hp <= 0) {
        winCombat();
        return;
    }
    
    updateCombatUI();
    
    // Turno del enemigo
    setTimeout(() => {
        enemyTurn();
    }, 1000);
}

// Ataque especial
function specialAttack() {
    const player = gameState.player;
    const enemy = gameState.currentEnemy;
    
    if (player.mana < 15) {
        addCombatLog('❌ No tienes suficiente maná');
        return;
    }
    
    player.mana -= 15;
    const specialDamage = Math.max(1, player.magic * 2 + Math.floor(Math.random() * 10));
    enemy.hp -= specialDamage;
    
    addCombatLog(`✨ ${player.name} usa ataque especial causando ${specialDamage} de daño`);
    
    updatePlayerUI();
    
    if (enemy.hp <= 0) {
        winCombat();
        return;
    }
    
    updateCombatUI();
    
    setTimeout(() => {
        enemyTurn();
    }, 1000);
}

// Defender
function defend() {
    gameState.isDefending = true;
    addCombatLog(`🛡️ ${gameState.player.name} se prepara para defender`);
    
    setTimeout(() => {
        enemyTurn();
    }, 1000);
}

// Huir
function flee() {
    const fleeChance = Math.random();
    
    if (fleeChance > 0.5) {
        addCombatLog('🏃 ¡Lograste huir!');
        endCombat();
    } else {
        addCombatLog('❌ No pudiste huir');
        setTimeout(() => {
            enemyTurn();
        }, 1000);
    }
}

// Turno del enemigo
function enemyTurn() {
    const player = gameState.player;
    const enemy = gameState.currentEnemy;
    
    let enemyDamage = Math.max(1, enemy.attack - player.defense + Math.floor(Math.random() * 6));
    
    if (gameState.isDefending) {
        enemyDamage = Math.floor(enemyDamage / 2);
        gameState.isDefending = false;
        addCombatLog(`🛡️ Reduciste el daño a la mitad`);
    }
    
    player.hp -= enemyDamage;
    
    addCombatLog(`👹 ${enemy.name} ataca causando ${enemyDamage} de daño`);
    
    updatePlayerUI();
    updateCombatUI();
    
    checkPlayerDeath();
}

// Ganar combate
function winCombat() {
    const enemy = gameState.currentEnemy;
    gameState.gold += enemy.gold;
    
    addCombatLog(`🎉 ¡Derrotaste al ${enemy.name}!`);
    addCombatLog(`💰 Obtienes ${enemy.gold} de oro`);
    addLog(`¡Derrotaste a ${enemy.name}! +${enemy.gold} oro`, 'success');
    
    updatePlayerUI();
    
    setTimeout(() => {
        if (enemy.name === 'Dragon') {
            victory();
        } else {
            endCombat();
        }
    }, 2000);
}

// Fin de combate
function endCombat() {
    gameState.inCombat = false;
    gameState.currentEnemy = null;
    document.getElementById('combat-screen').classList.remove('active');
    document.getElementById('combat-log').innerHTML = '';
    
    // Marcar casilla como vacía
    gameState.board[gameState.playerPosition].type = 'empty';
}

// Verificar muerte del jugador
function checkPlayerDeath() {
    if (gameState.player.hp <= 0) {
        addCombatLog('💀 Has sido derrotado...');
        addLog('💀 Game Over - Has sido derrotado', 'combat');
        
        setTimeout(() => {
            alert('¡Has sido derrotado! El juego se reiniciará.');
            resetGame();
        }, 2000);
    }
}

// Victoria
function victory() {
    alert(`🎉 ¡VICTORIA! 🎉\n\n¡Derrotaste al Dragón y completaste la mazmorra!\n\nOro total: ${gameState.gold}\nVida restante: ${Math.floor(gameState.player.hp)}/${gameState.player.maxHp}`);
    resetGame();
}

// Curar
function heal() {
    const player = gameState.player;
    
    if (player.mana < 10) {
        addLog('❌ No tienes suficiente maná para curarte', 'info');
        return;
    }
    
    player.mana -= 10;
    const healAmount = Math.floor(player.maxHp * 0.3);
    player.hp = Math.min(player.maxHp, player.hp + healAmount);
    
    addLog(`💚 Te curaste ${healAmount} HP`, 'success');
    updatePlayerUI();
}

// Tirar dados
function rollDice(sides, showResult = true) {
    const result = Math.floor(Math.random() * sides) + 1;
    
    if (showResult) {
        const resultElement = document.getElementById('dice-result');
        resultElement.textContent = `🎲 Resultado: ${result}`;
        resultElement.style.animation = 'none';
        setTimeout(() => {
            resultElement.style.animation = 'fadeIn 0.5s';
        }, 10);
        
        addLog(`🎲 Tiraste un d${sides}: ${result}`, 'info');
    }
    
    return result;
}

// Agregar entrada al log
function addLog(message, type = 'info') {
    const logElement = document.getElementById('log');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
    
    logElement.insertBefore(entry, logElement.firstChild);
    
    // Mantener solo últimas 50 entradas
    if (logElement.children.length > 50) {
        logElement.removeChild(logElement.lastChild);
    }
}

// Agregar entrada al log de combate
function addCombatLog(message) {
    const combatLog = document.getElementById('combat-log');
    const entry = document.createElement('div');
    entry.className = 'log-entry combat';
    entry.textContent = message;
    
    combatLog.appendChild(entry);
    combatLog.scrollTop = combatLog.scrollHeight;
}

// Reiniciar juego
function resetGame() {
    gameState = {
        player: null,
        playerPosition: 0,
        board: [],
        currentEnemy: null,
        inCombat: false,
        gold: 0,
        isDefending: false
    };
    
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('combat-screen').classList.remove('active');
    document.getElementById('character-selection').classList.add('active');
    document.getElementById('log').innerHTML = '';
    document.getElementById('combat-log').innerHTML = '';
    document.getElementById('dice-result').textContent = '';
}

// Inicializar
console.log('🎲 Juego D&D cargado correctamente');
