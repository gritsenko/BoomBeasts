import { Application, Assets, Graphics } from "pixi.js";
import Matter from "matter-js";
import { SoftBodyCharacter } from "./SoftBodyCharacter";

const debugMode = true;
// Gameplay constants (ported from prototype)
const MAX_ENERGY = 100;
const ENERGY_REGEN = 25; // per second
const STOMP_COST = 20;
const BLOCK_COST = MAX_ENERGY / 2;
const ACTION_DELAY = 2000; // ms
const COMBO_WINDOW = 1000; // ms

// Soft body config
const SOFT_CFG = {
  stiffness: 0.5,
  damping: 0.1,
  particleRadius: 7,
  gravity: 1.0,
  frictionAir: 0.1,
  restitution: 0.2,
  gridSizeX: 6,
  gridSizeY: 7,
};

// UI refs
const timelineDiv = document.getElementById("timeline") as HTMLDivElement;
const energyBar = document.getElementById("energy-bar") as HTMLDivElement;
const stompButton = document.getElementById(
  "stomp-button",
) as HTMLButtonElement;
const blockButton = document.getElementById(
  "block-button",
) as HTMLButtonElement;
const gameMessage = document.getElementById("game-message") as HTMLDivElement;
const placeholderSlot = document.createElement("div");
placeholderSlot.className = "placeholder-slot";

// Game state
type PlayerAction =
  | {
    type: "stomp";
    power: number;
    icon: HTMLDivElement;
    comboText: HTMLSpanElement;
    countdownFill: HTMLDivElement;
  }
  | { type: "block"; icon: HTMLDivElement; countdownFill: HTMLDivElement };
type EnemyAction = { type: "stomp"; power: number } | { type: "block" };
let playerEnergy = MAX_ENERGY;
let enemyEnergy = MAX_ENERGY;
let isRoundOver = false;
let playerTimeline: PlayerAction[] = [];
let enemyTimeline: EnemyAction[] = [];
let isActionTicking = false;
let isEnemyActionTicking = false;
let lastStompPressTime = 0;
let activeActionTimeout: number | null = null;
let activeEnemyActionTimeout: number | null = null;
let comboTimeout: number | null = null;

(async () => {
  const app = new Application();
  await app.init({ background: "whitesmoke", resizeTo: window });
  document.getElementById("pixi-container")!.appendChild(app.canvas);

  // Matter world
  const { Engine, World, Bodies } = Matter;
  const engine = Engine.create();
  engine.world.gravity.y = SOFT_CFG.gravity;
  // Improve solver stability: more iterations to reduce overlap under load
  engine.positionIterations = 8; // default 6
  engine.velocityIterations = 8; // default 4
  engine.constraintIterations = 4; // default 2

  // Platform & bounds
  const platformWidth = 900;
  const platformHeight = 40;
  const platformX = 500;
  const platformY = 500;
  const ground = Bodies.rectangle(
    platformX,
    platformY,
    platformWidth,
    platformHeight,
    {
      isStatic: true,
      label: "platform",
      collisionFilter: {
        category: 0x0004, // environment
        mask: 0xffff,
      },
    },
  );
  const leftWall = Bodies.rectangle(
    -50,
    app.screen.height / 2,
    100,
    app.screen.height,
    { isStatic: true, collisionFilter: { category: 0x0004, mask: 0xffff } },
  );
  const rightWall = Bodies.rectangle(
    app.screen.width + 50,
    app.screen.height / 2,
    100,
    app.screen.height,
    { isStatic: true, collisionFilter: { category: 0x0004, mask: 0xffff } },
  );
  const ceiling = Bodies.rectangle(
    app.screen.width / 2,
    -50,
    app.screen.width,
    100,
    { isStatic: true, collisionFilter: { category: 0x0004, mask: 0xffff } },
  );

  World.add(engine.world, [ground, leftWall, rightWall, ceiling]);

  // Visualize the floor/platform
  const floorGraphics = app.stage.addChild(new Graphics());
  floorGraphics.beginFill(0x8B4513, 0.8); // brown
  floorGraphics.drawRect(
    platformX - platformWidth / 2,
    platformY - platformHeight / 2,
    platformWidth,
    platformHeight
  );
  floorGraphics.endFill();

  // Load textures
  const [duckTexture, kapibaraTexture] = await Promise.all([
    Assets.load("/assets/sprites/duck.png"),
    Assets.load("/assets/sprites/kapibara.png"),
  ]);

  // Create characters
  const player = new SoftBodyCharacter(app, engine, {
    x: 250,
    y: 230,
    texture: duckTexture,
    gridSizeX: SOFT_CFG.gridSizeX,
    gridSizeY: SOFT_CFG.gridSizeY,
    particleRadius: SOFT_CFG.particleRadius,
    stiffness: SOFT_CFG.stiffness,
    damping: SOFT_CFG.damping,
    frictionAir: SOFT_CFG.frictionAir,
    restitution: SOFT_CFG.restitution,
    debugGrid: debugMode,
    scale: 1,
  }, { category: 0x0001, mask: 0x0002 | 0x0004, group: -1 }); // collide with enemy+env, no self-collisions
  const enemy = new SoftBodyCharacter(app, engine, {
    x: 550,
    y: 230,
    texture: kapibaraTexture,
    gridSizeX: SOFT_CFG.gridSizeX,
    gridSizeY: SOFT_CFG.gridSizeY,
    particleRadius: SOFT_CFG.particleRadius,
    stiffness: SOFT_CFG.stiffness,
    damping: SOFT_CFG.damping,
    frictionAir: SOFT_CFG.frictionAir,
    restitution: SOFT_CFG.restitution,
    debugGrid: debugMode,
    mirror: false ,
    scale: 1,
  }, { category: 0x0002, mask: 0x0001 | 0x0004, group: -2 }); // collide with player+env, no self-collisions

  // Ticker
  app.ticker.add(() => {
    Engine.update(engine, 1000 / 60);
    if (!isRoundOver) {
      const dt = 1 / 60; // seconds
      playerEnergy = Math.min(MAX_ENERGY, playerEnergy + ENERGY_REGEN * dt);
      enemyEnergy = Math.min(MAX_ENERGY, enemyEnergy + ENERGY_REGEN * dt);
      updateEnergyBar();
      updateButtonStates();
    }
    player.update();
    enemy.update();
    if (!isRoundOver) {
      checkBounds(player);
      checkBounds(enemy);
    }
  });

  // AI timer
  setInterval(
    () => {
      if (isRoundOver) return;
      const choice = Math.random();
      if (choice > 0.95 && enemyEnergy >= BLOCK_COST) {
        enemyEnergy -= BLOCK_COST;
        enemyTimeline.push({ type: "block" });
      } else if (choice < 0.7 && enemyEnergy >= STOMP_COST) {
        enemyEnergy -= STOMP_COST;
        const power = 1 + Math.floor(Math.random() * 2);
        enemyTimeline.push({ type: "stomp", power });
      }
      processEnemyActionQueue(enemy, player);
    },
    1500 + Math.random() * 1000,
  );

  // UI handlers
  stompButton.addEventListener("click", () => {
    const now = Date.now();
    const lastAction = playerTimeline[playerTimeline.length - 1];
    const isCombo =
      lastAction &&
      lastAction.type === "stomp" &&
      now - lastStompPressTime < COMBO_WINDOW;
    if (!isCombo && playerTimeline.length >= 4) return;
    const cost = isCombo
      ? STOMP_COST * Math.pow(1.5, lastAction.power)
      : STOMP_COST;
    if (playerEnergy < cost) return;
    if (comboTimeout) window.clearTimeout(comboTimeout);
    playerEnergy -= cost;
    if (isCombo) {
      lastAction.power += 1;
      lastAction.comboText.innerText = `x${lastAction.power}`;
    } else {
      const icon = document.createElement("div");
      icon.classList.add("timeline-icon", "stomp-icon");
      const comboText = document.createElement("span");
      comboText.classList.add("combo-text");
      icon.appendChild(comboText);
      const countdownFill = document.createElement("div");
      countdownFill.classList.add("countdown-fill");
      icon.appendChild(countdownFill);
      const newAction: PlayerAction = {
        type: "stomp",
        power: 1,
        icon,
        comboText,
        countdownFill,
      };
      playerTimeline.push(newAction);
    }
    lastStompPressTime = now;
    updateTimeline();
    processActionQueue(player, enemy);
    comboTimeout = window.setTimeout(() => updateTimeline(), COMBO_WINDOW);
  });

  blockButton.addEventListener("click", () => {
    if (playerTimeline.length >= 4) return;
    if (playerEnergy < BLOCK_COST) return;
    if (comboTimeout) window.clearTimeout(comboTimeout);
    playerEnergy -= BLOCK_COST;
    const icon = document.createElement("div");
    icon.classList.add("timeline-icon", "block-icon");
    const countdownFill = document.createElement("div");
    countdownFill.classList.add("countdown-fill");
    icon.appendChild(countdownFill);
    const newAction: PlayerAction = { type: "block", icon, countdownFill };
    playerTimeline.push(newAction);
    updateTimeline();
    processActionQueue(player, enemy);
  });

  // Helpers using our new class
  function updateEnergyBar() {
    energyBar.style.width = `${(playerEnergy / MAX_ENERGY) * 100}%`;
  }
  function updateButtonStates() {
    let currentStompCost = STOMP_COST;
    const lastAction = playerTimeline[playerTimeline.length - 1];
    const now = Date.now();
    const isTimelineFull = playerTimeline.length >= 4;
    const isComboPossible =
      lastAction &&
      lastAction.type === "stomp" &&
      now - lastStompPressTime < COMBO_WINDOW;
    if (isComboPossible) {
      currentStompCost = STOMP_COST * Math.pow(1.5, lastAction.power);
      stompButton.disabled = playerEnergy < currentStompCost;
    } else {
      stompButton.disabled = isTimelineFull || playerEnergy < STOMP_COST;
    }
    blockButton.disabled = isTimelineFull || playerEnergy < BLOCK_COST;
    stompButton.style.opacity = stompButton.disabled ? "0.5" : "1";
    blockButton.style.opacity = blockButton.disabled ? "0.5" : "1";
  }
  function updateTimeline() {
    timelineDiv.innerHTML = "";
    playerTimeline.forEach((a) => timelineDiv.appendChild(a.icon));
    const now = Date.now();
    const lastAction = playerTimeline[playerTimeline.length - 1];
    const isComboPossible =
      lastAction &&
      lastAction.type === "stomp" &&
      now - lastStompPressTime < COMBO_WINDOW;
    if (!isComboPossible) timelineDiv.appendChild(placeholderSlot);
  }
  function processActionQueue(self: SoftBodyCharacter, foe: SoftBodyCharacter) {
    if (isActionTicking || playerTimeline.length === 0) return;
    isActionTicking = true;
    const action = playerTimeline[0];
    action.countdownFill.classList.add("active");
    action.countdownFill.style.animationDuration = `${ACTION_DELAY / 1000}s`;
    activeActionTimeout = window.setTimeout(() => {
      if (isRoundOver) return;
      if (action.type === "stomp") {
        self.applyStomp(foe.getCenter().x, action.power);
      } else if (action.type === "block") {
        self.applyBlock();
      }
      playerTimeline.shift();
      updateTimeline();
      isActionTicking = false;
      activeActionTimeout = null;
      processActionQueue(self, foe);
    }, ACTION_DELAY);
  }
  function processEnemyActionQueue(
    self: SoftBodyCharacter,
    foe: SoftBodyCharacter,
  ) {
    if (isEnemyActionTicking || enemyTimeline.length === 0) return;
    isEnemyActionTicking = true;
    const action = enemyTimeline[0];
    activeEnemyActionTimeout = window.setTimeout(
      () => {
        if (isRoundOver) return;
        if (action.type === "stomp") {
          self.applyStomp(foe.getCenter().x, action.power);
        } else if (action.type === "block") {
          self.applyBlock();
        }
        enemyTimeline.shift();
        isEnemyActionTicking = false;
        activeEnemyActionTimeout = null;
        processEnemyActionQueue(self, foe);
      },
      ACTION_DELAY + (Math.random() * 500 - 250),
    );
  }
  function checkBounds(char: SoftBodyCharacter) {
    const c = char.getCenter();
    if (isRoundOver) return;
    if (c.y > platformY + 150) {
      isRoundOver = true;
      char.setVisible(false);
      showMessage(char === player ? "DEFEAT" : "VICTORY!");
      setTimeout(resetRound, 2000);
    }
  }
  function resetRound() {
    isRoundOver = false;
    if (activeActionTimeout) window.clearTimeout(activeActionTimeout);
    activeActionTimeout = null;
    isActionTicking = false;
    playerTimeline = [];
    lastStompPressTime = 0;
    if (comboTimeout) window.clearTimeout(comboTimeout);
    if (activeEnemyActionTimeout) window.clearTimeout(activeEnemyActionTimeout);
    activeEnemyActionTimeout = null;
    isEnemyActionTicking = false;
    enemyTimeline = [];
    player.reset(300, 230);
    enemy.reset(500, 230);
    playerEnergy = MAX_ENERGY;
    enemyEnergy = MAX_ENERGY;
    updateEnergyBar();
    updateTimeline();
    hideMessage();
  }
  function showMessage(text: string) {
    gameMessage.innerText = text;
    gameMessage.style.display = "block";
  }
  function hideMessage() {
    gameMessage.style.display = "none";
  }
})();
