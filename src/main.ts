import { Application, Assets, Graphics, Container } from "pixi.js";
import Matter from "matter-js";
import { SoftBodyCharacter } from "./SoftBodyCharacter";

// Prevent right-click context menu
document.addEventListener('contextmenu', (e) => e.preventDefault());

let debugMode = false; // Debug view disabled by default

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
  frictionAir: 0.05,
  restitution: 0.2,
  gridSizeX: 7,
  gridSizeY: 8,
  // Stomp force configuration (applied to solid body)
  stompVerticalForce: -15, // Base vertical force (will be multiplied by power)
  stompHorizontalForce: 20, // Base horizontal force (will be multiplied by power and direction)
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

    // Setup debug hotkey after player/enemy are created
  window.addEventListener("keydown", (e) => {
    // Toggle debug view with D
    if (e.key === "d") {
      debugMode = !debugMode;
      player.setDebugGridVisible(debugMode);
      enemy.setDebugGridVisible(debugMode);
    }
  });

  // Matter world
  const { Engine, World, Bodies, Events, Body } = Matter;
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
  floorGraphics.beginFill(0x8b4513, 0.8); // brown
  floorGraphics.drawRect(
    platformX - platformWidth / 2,
    platformY - platformHeight / 2,
    platformWidth,
    platformHeight,
  );
  floorGraphics.endFill();

  // Debug overlay (wireframes)
  const debugContainer = new Container();
  const debugBodies = new Graphics();
  debugContainer.addChild(debugBodies);
  app.stage.addChild(debugContainer);

  // Load textures
  const [duckTexture, kapibaraTexture] = await Promise.all([
    Assets.load("./assets/sprites/duck.png"),
    Assets.load("./assets/sprites/kapibara.png"),
  ]);

  // Create characters
  const player = new SoftBodyCharacter(
    app,
    engine,
    {
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
      stompVerticalForce: SOFT_CFG.stompVerticalForce,
      stompHorizontalForce: SOFT_CFG.stompHorizontalForce,
      debugGrid: true,
      scale: 1,
    },
    { category: 0x0001, mask: 0x0002 | 0x0004, group: -1 },
  ); // collide with enemy+env, no self-collisions
  const enemy = new SoftBodyCharacter(
    app,
    engine,
    {
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
      stompVerticalForce: SOFT_CFG.stompVerticalForce,
      stompHorizontalForce: SOFT_CFG.stompHorizontalForce,
      debugGrid: true,
      mirror: false,
      scale: 1,
    },
    { category: 0x0002, mask: 0x0001 | 0x0004, group: -2 },
  ); // collide with player+env, no self-collisions

  // Collision-based push between SOLID colliders only
  Events.on(
    engine,
    "collisionActive",
    (evt: Matter.IEventCollision<Matter.Engine>) => {
      const pairs = evt.pairs as Matter.Pair[];
      for (const pair of pairs) {
        const a = pair.bodyA as Matter.Body;
        const b = pair.bodyB as Matter.Body;
        const isSolidPair =
          (a === player.solid && b === enemy.solid) ||
          (a === enemy.solid && b === player.solid);
        if (!isSolidPair) continue;

        // Direction from A to B
        const dir = {
          x: b.position.x - a.position.x,
          y: b.position.y - a.position.y,
        };
        const len = Math.hypot(dir.x, dir.y) || 1;
        dir.x /= len;
        dir.y /= len;

        // Relative velocity along the normal (closing speed)
        const relVel = {
          x: b.velocity.x - a.velocity.x,
          y: b.velocity.y - a.velocity.y,
        };
        const closingSpeed = relVel.x * dir.x + relVel.y * dir.y; // >0 means separating
        const overlap = Math.max(0, -(pair.separation ?? 0));

        const base = 0.002;
        const pushMag = Math.min(
          0.02,
          base +
            (closingSpeed < 0 ? -closingSpeed * 0.002 : 0) +
            overlap * 0.002,
        );
        Body.applyForce(a, a.position, {
          x: -dir.x * pushMag,
          y: -dir.y * pushMag,
        });
        Body.applyForce(b, b.position, {
          x: dir.x * pushMag,
          y: dir.y * pushMag,
        });
      }
    },
  );

  // One-shot burst when SOLIDs start contact
  Events.on(
    engine,
    "collisionStart",
    (evt: Matter.IEventCollision<Matter.Engine>) => {
      const pairs = evt.pairs as Matter.Pair[];
      for (const pair of pairs) {
        const a = pair.bodyA as Matter.Body;
        const b = pair.bodyB as Matter.Body;
        const isSolidPair =
          (a === player.solid && b === enemy.solid) ||
          (a === enemy.solid && b === player.solid);
        if (!isSolidPair) continue;
        const dir = {
          x: b.position.x - a.position.x,
          y: b.position.y - a.position.y,
        };
        const len = Math.hypot(dir.x, dir.y) || 1;
        dir.x /= len;
        dir.y /= len;
        const overlap = Math.max(0, -(pair.separation ?? 0));
        const kick = Math.min(1.2, 0.4 + overlap * 1.0);
        Body.setVelocity(a, {
          x: a.velocity.x - dir.x * kick,
          y: a.velocity.y - dir.y * kick,
        });
        Body.setVelocity(b, {
          x: b.velocity.x + dir.x * kick,
          y: b.velocity.y + dir.y * kick,
        });
      }
    },
  );

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

    // Draw debug wireframes
    if (debugMode) {
      debugBodies.visible = true;
      debugBodies.clear();
      const thin = { width: 1, color: 0x333333 as const, alpha: 0.9 };
      debugBodies.setStrokeStyle(thin);
      const bodies = engine.world.bodies as Matter.Body[];
      for (const body of bodies) {
        // Choose color per type
        let color = 0x0080ff; // soft nodes by default (changed from yellow to blue)
        if (body.isStatic) color = 0x8b4513; // environment
        if (body === player.solid) color = 0x4a90e2; // player solid
        if (body === enemy.solid) color = 0xd0021b; // enemy solid
        const label = (body as unknown as { label?: string }).label;
        if (label === "softDriver") color = 0x00ffff; // driver

        debugBodies.setStrokeStyle({ width: 1, color, alpha: 0.9 });
        const circleRadius = (body as unknown as { circleRadius?: number })
          .circleRadius;
        if (circleRadius && circleRadius > 0) {
          debugBodies.circle(body.position.x, body.position.y, circleRadius);
        } else if (body.vertices && body.vertices.length > 0) {
          const vs = body.vertices;
          debugBodies.moveTo(vs[0].x, vs[0].y);
          for (let i = 1; i < vs.length; i++) {
            debugBodies.lineTo(vs[i].x, vs[i].y);
          }
          debugBodies.closePath();
        }
      }
      debugBodies.stroke();
      player.mesh.alpha = 0.3; // Make textures semi-transparent to see debug shapes
      enemy.mesh.alpha = 0.3;
      if (player && typeof player.setDebugGridVisible === "function") {
        player.setDebugGridVisible(true);
      }
      if (enemy && typeof enemy.setDebugGridVisible === "function") {
        enemy.setDebugGridVisible(true);
      }
    } else {
      debugBodies.visible = false;
      player.mesh.alpha = 1.0; // Full opacity when not in debug mode
      enemy.mesh.alpha = 1.0;
      if (player && typeof player.setDebugGridVisible === "function") {
        player.setDebugGridVisible(false);
      }
      if (enemy && typeof enemy.setDebugGridVisible === "function") {
        enemy.setDebugGridVisible(false);
      }
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
