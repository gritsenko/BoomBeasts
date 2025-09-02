// --- Configuration ---
const MAX_ENERGY = 100;
const ENERGY_REGEN = 25; // Energy per second
const STOMP_COST = 20;
const BLOCK_COST = MAX_ENERGY / 2; // Costs half of the max energy
const ACTION_DELAY = 2000; // 2 seconds
const COMBO_WINDOW = 1000; // 1 second to continue a combo

// --- Game State ---
let playerEnergy = MAX_ENERGY;
let playerTimeline = [];
let isRoundOver = false;
let lastStompPressTime = 0;
let isActionTicking = false;
let activeActionTimeout = null;
let comboTimeout = null; // Timeout for showing the placeholder

// --- Enemy AI State ---
let enemyEnergy = MAX_ENERGY;
let enemyTimeline = [];
let isEnemyActionTicking = false;
let activeEnemyActionTimeout = null;

// --- UI Elements ---
const stompButton = document.getElementById('stomp-button');
const blockButton = document.getElementById('block-button');
const energyBar = document.getElementById('energy-bar');
const timelineDiv = document.getElementById('timeline');
const gameMessage = document.getElementById('game-message');
const placeholderSlot = document.createElement('div');
placeholderSlot.className = 'placeholder-slot';

// --- Game Scene ---
class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'GameScene' }); }
    
    preload() {
        this.load.image('duck', 'sprites/duck.png');
        this.load.image('kapibara', 'sprites/kapibara.png');
    }
    
    create() {
        const platformWidth = 500;
        const platformHeight = 40;
        const platformX = 400;
        const platformY = 300;
        this.matter.add.rectangle(platformX, platformY, platformWidth, platformHeight, { isStatic: true, label: 'platform' });
        const platformGraphics = this.add.graphics();
        platformGraphics.fillStyle(0x8B4513);
        platformGraphics.fillRect(platformX - platformWidth / 2, platformY - platformHeight / 2, platformWidth, platformHeight);
        this.platform = { y: platformY };
        this.player = this.createBeast(300, 230, 0x4a90e2, 'duck', true);
        this.enemy = this.createBeast(500, 230, 0xd0021b, 'kapibara', false);
        this.enemyTimer = this.time.addEvent({ delay: 1500 + Math.random() * 1000, callback: this.enemyMakeDecision, callbackScope: this, loop: true });
    }
    enemyMakeDecision() {
        if (isRoundOver) return;
        const choice = Math.random();
        if (choice > 0.95 && enemyEnergy >= BLOCK_COST) { 
            enemyEnergy -= BLOCK_COST;
            enemyTimeline.push({ type: 'block' });
        } else if (choice < 0.7 && enemyEnergy >= STOMP_COST) {
            enemyEnergy -= STOMP_COST;
            const power = 1 + Math.floor(Math.random() * 2);
            enemyTimeline.push({ type: 'stomp', power: power });
        }
        processEnemyActionQueue();
    }
    createBeast(x, y, color, skin = null, mirror = false) {
        const group = this.matter.world.nextGroup(true);
        const initialDensity = 0.000825;
        const mainBody = this.matter.bodies.circle(x, y, 46, { collisionFilter: { group: group }, friction: 0.1, restitution: 0.5, density: initialDensity });
        const wobbleParts = [];
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const part = this.matter.bodies.circle(x + Math.cos(angle) * 60, y + Math.sin(angle) * 60, 20, { collisionFilter: { group: group }, density: 0.00001675 });
            wobbleParts.push(part);
            this.matter.add.constraint(mainBody, part, 60, 0.02, { damping: 0.05 });
        }
        const compoundBody = this.matter.body.create({ parts: [mainBody, ...wobbleParts] });
        compoundBody.initialDensity = initialDensity;
        this.matter.world.add(compoundBody);
        
        let displayObject;
        if (skin) {
            // Use sprite for skinned characters
            displayObject = this.add.sprite(0, 0, skin);
            const scaleX = mirror ? -0.7 : 0.7;
            displayObject.setScale(scaleX, 0.7); // Mirror horizontally if specified
        } else {
            // Use graphics for default characters
            displayObject = this.add.graphics();
        }
        
        const container = this.add.container(x, y, [displayObject]);
        container.setData({ 'body': compoundBody, 'displayObject': displayObject, 'color': color, 'skin': skin });
        compoundBody.gameObject = container;
        return compoundBody;
    }
    update(time, delta) {
        if (!isRoundOver) {
            playerEnergy = Math.min(MAX_ENERGY, playerEnergy + (ENERGY_REGEN * (delta / 1000)));
            enemyEnergy = Math.min(MAX_ENERGY, enemyEnergy + (ENERGY_REGEN * (delta / 1000)));
            updateEnergyBar();
            updateButtonStates();
        }
        this.drawBeast(this.player);
        this.drawBeast(this.enemy);
        if (!isRoundOver) {
            this.checkBounds(this.player);
            this.checkBounds(this.enemy);
        }
    }
    drawBeast(beastBody) {
        const container = beastBody.gameObject;
        const displayObject = container.getData('displayObject');
        const color = container.getData('color');
        const skin = container.getData('skin');
        
        container.setPosition(beastBody.position.x, beastBody.position.y);
        
        if (skin) {
            // For sprites, just update position (sprite handles its own rendering)
            displayObject.setPosition(0, 0);
        } else {
            // For graphics-based characters, redraw the circles
            const graphics = displayObject;
            graphics.clear();
            graphics.fillStyle(color, 0.8);
            graphics.lineStyle(2, 0x000000, 0.5);
            beastBody.parts.forEach((part, i) => {
                if (i === 0) return;
                graphics.fillCircle(part.position.x - beastBody.position.x, part.position.y - beastBody.position.y, part.circleRadius);
                graphics.strokeCircle(part.position.x - beastBody.position.x, part.position.y - beastBody.position.y, part.circleRadius);
            });
        }
    }
    checkBounds(beastBody) {
        if (isRoundOver || !beastBody.gameObject.visible) return;
        if (beastBody.position.y > this.platform.y + 150) {
            isRoundOver = true;
            beastBody.gameObject.setVisible(false);
            showMessage(beastBody === this.player ? "ПОРАЖЕНИЕ" : "ПОБЕДА!");
            setTimeout(resetRound, 2000);
        }
    }
}
const config = { type: Phaser.AUTO, width: 800, height: 330, parent: 'phaser-game', physics: { default: 'matter', matter: { gravity: { y: 1 }, debug: false } }, scene: GameScene, backgroundColor: '#fafafa' };
const game = new Phaser.Game(config);

function updateEnergyBar() {
    energyBar.style.width = `${(playerEnergy / MAX_ENERGY) * 100}%`;
}
function updateButtonStates() {
    let currentStompCost = STOMP_COST;
    const lastAction = playerTimeline[playerTimeline.length - 1];
    const currentTime = Date.now();
    const isTimelineFull = playerTimeline.length >= 4;
    const isComboPossible = lastAction && lastAction.type === 'stomp' && (currentTime - lastStompPressTime) < COMBO_WINDOW;

    // Check if a combo is possible and calculate the cost for the next hit
    if (isComboPossible) {
        currentStompCost = STOMP_COST * Math.pow(1.5, lastAction.power);
        stompButton.disabled = playerEnergy < currentStompCost;
    } else {
        // Otherwise, disable if full or not enough energy for a NEW stomp
        stompButton.disabled = isTimelineFull || playerEnergy < STOMP_COST;
    }

    blockButton.disabled = isTimelineFull || playerEnergy < BLOCK_COST;
    
    stompButton.style.opacity = stompButton.disabled ? 0.5 : 1;
    blockButton.style.opacity = blockButton.disabled ? 0.5 : 1;
}

function updateTimeline() {
    timelineDiv.innerHTML = '';
    playerTimeline.forEach(action => timelineDiv.appendChild(action.icon));
    
    const currentTime = Date.now();
    const lastAction = playerTimeline[playerTimeline.length - 1];
    const isComboPossible = lastAction && lastAction.type === 'stomp' && (currentTime - lastStompPressTime) < COMBO_WINDOW;

    if (!isComboPossible) {
        timelineDiv.appendChild(placeholderSlot);
    }
}

// --- Sequential Queue Logic ---
function processActionQueue() {
    if (isActionTicking || playerTimeline.length === 0) return;
    
    isActionTicking = true;
    const action = playerTimeline[0];
    
    // Start visual countdown for the current action
    action.countdownFill.classList.add('active');
    action.countdownFill.style.animationDuration = `${ACTION_DELAY / 1000}s`;

    activeActionTimeout = setTimeout(() => {
        if (isRoundOver) return;
        const scene = game.scene.getScene('GameScene');
        if (action.type === 'stomp') {
            applyStomp(scene.player, action.power);
        } else if (action.type === 'block') {
            applyBlock(scene.player);
        }

        playerTimeline.shift(); // Remove executed action from the front
        updateTimeline();
        
        isActionTicking = false;
        activeActionTimeout = null;
        
        processActionQueue(); // Process the next action in the queue
    }, ACTION_DELAY);
}

stompButton.addEventListener('click', () => {
    const currentTime = Date.now();
    const lastAction = playerTimeline[playerTimeline.length - 1];
    const isCombo = lastAction && lastAction.type === 'stomp' && (currentTime - lastStompPressTime) < COMBO_WINDOW;

    // Prevent adding a NEW action if the timeline is full. Combos are fine.
    if (!isCombo && playerTimeline.length >= 4) return;

    let cost = isCombo ? STOMP_COST * Math.pow(1.5, lastAction.power) : STOMP_COST;

    if (playerEnergy < cost) return;

    clearTimeout(comboTimeout);
    playerEnergy -= cost;

    if (isCombo) {
        lastAction.power += 1;
        lastAction.comboText.innerText = `x${lastAction.power}`;
    } else {
        const newAction = { type: 'stomp', power: 1 };
        const icon = document.createElement('div');
        icon.classList.add('timeline-icon', 'stomp-icon');
        const comboText = document.createElement('span');
        comboText.classList.add('combo-text');
        icon.appendChild(comboText);
        const countdownFill = document.createElement('div');
        countdownFill.classList.add('countdown-fill');
        icon.appendChild(countdownFill);
        newAction.icon = icon;
        newAction.comboText = comboText;
        newAction.countdownFill = countdownFill;
        playerTimeline.push(newAction);
    }
    
    lastStompPressTime = currentTime;
    updateTimeline();
    processActionQueue();

    comboTimeout = setTimeout(() => {
        updateTimeline();
    }, COMBO_WINDOW);
});

blockButton.addEventListener('click', () => {
    // Prevent adding action if timeline is full
    if (playerTimeline.length >= 4) return;
    
    if (playerEnergy < BLOCK_COST) return;

    clearTimeout(comboTimeout);

    playerEnergy -= BLOCK_COST;
    const newAction = { type: 'block' };
    const icon = document.createElement('div');
    icon.classList.add('timeline-icon', 'block-icon');
    const countdownFill = document.createElement('div');
    countdownFill.classList.add('countdown-fill');
    icon.appendChild(countdownFill);
    newAction.icon = icon;
    newAction.countdownFill = countdownFill;
    playerTimeline.push(newAction);
    updateTimeline();
    processActionQueue();
});

function processEnemyActionQueue() {
    if (isEnemyActionTicking || enemyTimeline.length === 0) return;

    isEnemyActionTicking = true;
    const action = enemyTimeline[0];

    activeEnemyActionTimeout = setTimeout(() => {
        if (isRoundOver) return;
        const scene = game.scene.getScene('GameScene');
        if (action.type === 'stomp') {
            applyStomp(scene.enemy, action.power);
        } else if (action.type === 'block') {
            applyBlock(scene.enemy);
        }
        enemyTimeline.shift();
        isEnemyActionTicking = false;
        activeEnemyActionTimeout = null;
        processEnemyActionQueue();
    }, ACTION_DELAY + (Math.random() * 500 - 250)); // AI has slight timing variance
}

function applyStomp(beast, power) {
     const scene = game.scene.getScene('GameScene');
     if (!scene || !beast.gameObject.visible) return;
     const otherBeast = (beast === scene.player) ? scene.enemy : scene.player;
     if (!otherBeast.gameObject.visible) return;
     const direction = Math.sign(otherBeast.position.x - beast.position.x);
     const verticalForce = -0.04 * power; 
     const horizontalForce = direction * 0.05 * power;
     scene.matter.body.applyForce(beast, beast.position, { x: horizontalForce, y: verticalForce });
     
     // Create shockwave attached to the character's container
     const container = beast.gameObject;
     const shockwave = scene.add.graphics();
     shockwave.lineStyle(power * 3, 0x000000, 0.5);
     shockwave.strokeCircle(0, 0, power * 20); // Position relative to container (0, 0)
     container.add(shockwave); // Add to container so it moves with character
     
     scene.tweens.add({ 
         targets: shockwave, 
         alpha: 0, 
         scaleX: 2, 
         scaleY: 2, 
         duration: 300, 
         onComplete: () => shockwave.destroy() 
     });
}

function applyBlock(beast) {
    if (!beast.gameObject.visible) return;
    const scene = game.scene.getScene('GameScene');
    const blockDensity = beast.initialDensity * 10;
    scene.matter.body.setDensity(beast, blockDensity);
    
    // Create shield attached to the character's container
    const container = beast.gameObject;
    const shield = scene.add.graphics();
    shield.fillStyle(0xffffff, 0.5);
    shield.fillCircle(0, 0, 50); // Position relative to container (0, 0)
    container.add(shield); // Add to container so it moves with character
    
    scene.tweens.add({ 
        targets: shield, 
        alpha: 0, 
        scaleX: 1.2, 
        scaleY: 1.2, 
        duration: 1000, 
        onComplete: () => shield.destroy() 
    });
    setTimeout(() => { if (beast.gameObject) { scene.matter.body.setDensity(beast, beast.initialDensity); } }, 1000);
}

function resetRound() {
    isRoundOver = false;
    
    if (activeActionTimeout) clearTimeout(activeActionTimeout);
    activeActionTimeout = null;
    isActionTicking = false;
    playerTimeline = [];
    lastStompPressTime = 0;
    clearTimeout(comboTimeout);

    if (activeEnemyActionTimeout) clearTimeout(activeEnemyActionTimeout);
    activeEnemyActionTimeout = null;
    isEnemyActionTicking = false;
    enemyTimeline = [];

    const scene = game.scene.getScene('GameScene');
    scene.matter.body.setDensity(scene.player, scene.player.initialDensity);
    scene.matter.body.setDensity(scene.enemy, scene.enemy.initialDensity);

    scene.matter.body.setPosition(scene.player, {x: 300, y: 230});
    scene.matter.body.setVelocity(scene.player, {x: 0, y: 0});
    scene.matter.body.setAngle(scene.player, 0);
    scene.matter.body.setAngularVelocity(scene.player, 0);
    scene.player.gameObject.setVisible(true);
    scene.matter.body.setPosition(scene.enemy, {x: 500, y: 230});
    scene.matter.body.setVelocity(scene.enemy, {x: 0, y: 0});
    scene.matter.body.setAngle(scene.enemy, 0);
    scene.matter.body.setAngularVelocity(scene.enemy, 0);
    scene.enemy.gameObject.setVisible(true);
    playerEnergy = MAX_ENERGY;
    enemyEnergy = MAX_ENERGY;
    updateEnergyBar();
    updateTimeline();
    hideMessage();
}

// Initialize the timeline on page load
updateTimeline();

function showMessage(text) {
    gameMessage.innerText = text;
    gameMessage.style.display = 'block';
}
function hideMessage() {
    gameMessage.style.display = 'none';
}
