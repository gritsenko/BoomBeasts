import { Application, Graphics, MeshPlane, Texture } from "pixi.js";
import Matter from "matter-js";

export type SoftBodyOptions = {
  x: number;
  y: number;
  texture: Texture;
  gridSizeX: number;
  gridSizeY: number;
  particleRadius?: number;
  stiffness?: number;
  damping?: number;
  frictionAir?: number;
  restitution?: number;
  initialDensity?: number;
  debugGrid?: boolean;
  mirror?: boolean;
  scale?: number; // uniform
};

export class SoftBodyCharacter {
  public mesh: MeshPlane;
  public bodies: Matter.Body[] = [];
  public constraints: Matter.Constraint[] = [];
  public gridSizeX: number;
  public gridSizeY: number;
  public particleRadius: number;
  public initialDensity: number;
  public app: Application;
  public engine: Matter.Engine;
  private debug: boolean;
  private gridGraphics: Graphics | null = null;
  private shockwaves: { g: Graphics; life: number; maxLife: number }[] = [];
  private blockTimer: number | null = null;

  constructor(
    app: Application,
    engine: Matter.Engine,
    options: SoftBodyOptions,
  ) {
    this.app = app;
    this.engine = engine;
    this.gridSizeX = options.gridSizeX;
    this.gridSizeY = options.gridSizeY;
    this.particleRadius = options.particleRadius ?? 5;
    this.initialDensity = options.initialDensity ?? 0.001;
    this.debug = !!options.debugGrid;

    // Create mesh plane
    this.mesh = new MeshPlane({
      texture: options.texture,
      verticesX: this.gridSizeX,
      verticesY: this.gridSizeY,
    });
    if (options.scale && options.scale !== 1) {
      this.mesh.scale.set(options.scale);
    }

    // Mirror horizontally if requested
    if (options.mirror) {
      this.mesh.scale.x *= -1;
      // Ensure pivot is at (0,0); flipping around origin is OK for now
    }

    this.mesh.x = options.x;
    this.mesh.y = options.y;
    this.app.stage.addChild(this.mesh);

    if (this.debug) {
      this.gridGraphics = new Graphics();
      this.gridGraphics.setStrokeStyle({ width: 1, color: 0xff00ff, alpha: 1 });
      this.gridGraphics.x = this.mesh.x;
      this.gridGraphics.y = this.mesh.y;
      this.app.stage.addChild(this.gridGraphics);
    }

    // Build physics grid
    const columnGap = this.mesh.width / (this.gridSizeX - 1);
    const rowGap = this.mesh.height / (this.gridSizeY - 1);
    const particleOptions: Matter.IBodyDefinition = {
      friction: 0.05,
      frictionStatic: 0.0,
      frictionAir: options.frictionAir ?? 0.03,
      restitution: options.restitution ?? 0.1,
      density: this.initialDensity,
    } as Matter.IBodyDefinition;
    const stiffness = options.stiffness ?? 0.1;
    const damping = options.damping ?? 0.3;
    const renderOpts: Matter.IConstraintRenderDefinition = { visible: false };

    // Particles
    for (let y = 0; y < this.gridSizeY; y++) {
      for (let x = 0; x < this.gridSizeX; x++) {
        const body = Matter.Bodies.circle(
          this.mesh.x + x * columnGap,
          this.mesh.y + y * rowGap,
          this.particleRadius,
          particleOptions,
        );
        this.bodies.push(body);
      }
    }
    // Constraints
    for (let y = 0; y < this.gridSizeY; y++) {
      for (let x = 0; x < this.gridSizeX; x++) {
        const idx = y * this.gridSizeX + x;
        const bodyA = this.bodies[idx];
        if (x < this.gridSizeX - 1) {
          const bodyB = this.bodies[idx + 1];
          this.constraints.push(
            Matter.Constraint.create({
              bodyA,
              bodyB,
              stiffness,
              damping,
              render: renderOpts,
            }),
          );
        }
        if (y < this.gridSizeY - 1) {
          const bodyB = this.bodies[idx + this.gridSizeX];
          this.constraints.push(
            Matter.Constraint.create({
              bodyA,
              bodyB,
              stiffness,
              damping,
              render: renderOpts,
            }),
          );
        }
        // Cross braces
        if (x < this.gridSizeX - 1 && y < this.gridSizeY - 1) {
          const bodyB = this.bodies[idx + this.gridSizeX + 1];
          this.constraints.push(
            Matter.Constraint.create({
              bodyA,
              bodyB,
              stiffness: stiffness * 0.3,
              damping,
              render: renderOpts,
            }),
          );
        }
        // Bending constraints (skip one)
        if (x < this.gridSizeX - 2) {
          const bodyB = this.bodies[idx + 2];
          this.constraints.push(
            Matter.Constraint.create({
              bodyA,
              bodyB,
              stiffness: stiffness * 0.2,
              damping: damping * 0.5,
              render: renderOpts,
            }),
          );
        }
        if (y < this.gridSizeY - 2) {
          const bodyB = this.bodies[idx + 2 * this.gridSizeX];
          this.constraints.push(
            Matter.Constraint.create({
              bodyA,
              bodyB,
              stiffness: stiffness * 0.2,
              damping: damping * 0.5,
              render: renderOpts,
            }),
          );
        }
      }
    }

    Matter.World.add(engine.world, this.bodies);
    Matter.World.add(engine.world, this.constraints);

    // Hook ticker for visuals like shockwaves
    app.ticker.add(this.tickEffects);
  }

  private getVertexBuffer(): { data: Float32Array; flush: () => void } | null {
    type BufferLike = { data: Float32Array; update: () => void };
    type GeometryLike = {
      getBuffer?: (name: string) => BufferLike | undefined;
      positions?: Float32Array;
    };
    const geom = this.mesh.geometry as unknown as GeometryLike;
    const posBuffer =
      (geom.getBuffer &&
        (geom.getBuffer("aPosition") || geom.getBuffer("aVertexPosition"))) ||
      undefined;
    if (posBuffer && posBuffer.data) {
      return { data: posBuffer.data, flush: () => posBuffer.update() };
    }
    if (geom.positions) {
      return { data: geom.positions, flush: () => {} };
    }
    return null;
  }

  public update(): void {
    // Sync bodies to mesh vertices
    const vb = this.getVertexBuffer();
    if (!vb) return;
    const { data, flush } = vb;
    const count = Math.min(this.bodies.length, data.length / 2);
    for (let i = 0; i < count; i++) {
      const b = this.bodies[i];
      data[2 * i] = b.position.x - this.mesh.x;
      data[2 * i + 1] = b.position.y - this.mesh.y;
    }
    flush();

    // Debug grid
    if (this.debug && this.gridGraphics) {
      const g = this.gridGraphics;
      g.clear();
      g.setStrokeStyle({ width: 1, color: 0xff00ff, alpha: 1 });
      const cols = this.gridSizeX;
      const rows = this.gridSizeY;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const i0 = (r * cols + c) * 2;
          const i1 = (r * cols + (c + 1)) * 2;
          g.moveTo(data[i0], data[i0 + 1]);
          g.lineTo(data[i1], data[i1 + 1]);
        }
      }
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows - 1; r++) {
          const i0 = (r * cols + c) * 2;
          const i1 = ((r + 1) * cols + c) * 2;
          g.moveTo(data[i0], data[i0 + 1]);
          g.lineTo(data[i1], data[i1 + 1]);
        }
      }
      g.stroke();
      g.x = this.mesh.x;
      g.y = this.mesh.y;
    }
  }

  public getCenter(): { x: number; y: number } {
    const midX = Math.floor(this.gridSizeX / 2);
    const midY = Math.floor(this.gridSizeY / 2);
    const b = this.bodies[midY * this.gridSizeX + midX];
    return { x: b.position.x, y: b.position.y };
  }

  public applyStomp(targetX: number, power: number): void {
    const centerIdx =
      Math.floor(this.gridSizeY / 2) * this.gridSizeX +
      Math.floor(this.gridSizeX / 2);
    const b = this.bodies[centerIdx];
    const dir = Math.sign(targetX - b.position.x) || 1;
    const verticalForce = -0.04 * power;
    const horizontalForce = dir * 0.05 * power;
    Matter.Body.applyForce(b, b.position, {
      x: horizontalForce,
      y: verticalForce,
    });

    // Shockwave effect
    const g = new Graphics();
    g.setStrokeStyle({
      width: Math.max(1, power * 3),
      color: 0x000000,
      alpha: 0.5,
    });
    // Using a rectangle ring for compatibility
    const size = power * 40;
    g.rect(-size / 2, -size / 2, size, size);
    g.x = this.getCenter().x;
    g.y = this.getCenter().y;
    this.app.stage.addChild(g);
    // Draw stroke once per frame via stroke() call in tick
    this.shockwaves.push({ g, life: 0, maxLife: 18 }); // ~0.3s at 60fps
  }

  public applyBlock(durationMs = 1000, factor = 10): void {
    // Increase density temporarily
    this.bodies.forEach((b) =>
      Matter.Body.setDensity(b, (b.density || this.initialDensity) * factor),
    );
    if (this.blockTimer) window.clearTimeout(this.blockTimer);
    // Shield effect
    const g = new Graphics();
    g.setStrokeStyle({ width: 4, color: 0xffffff, alpha: 0.6 });
    g.rect(-50, -50, 100, 100);
    g.x = this.getCenter().x;
    g.y = this.getCenter().y;
    this.app.stage.addChild(g);
    this.shockwaves.push({ g, life: 0, maxLife: 60 });

    this.blockTimer = window.setTimeout(() => {
      this.bodies.forEach((b) =>
        Matter.Body.setDensity(b, this.initialDensity),
      );
      this.blockTimer = null;
    }, durationMs);
  }

  public reset(x: number, y: number): void {
    // Reset positions to a grid anchored at (x,y)
    const columnGap = this.mesh.width / (this.gridSizeX - 1);
    const rowGap = this.mesh.height / (this.gridSizeY - 1);
    for (let j = 0; j < this.gridSizeY; j++) {
      for (let i = 0; i < this.gridSizeX; i++) {
        const idx = j * this.gridSizeX + i;
        const bx = x + i * columnGap;
        const by = y + j * rowGap;
        const b = this.bodies[idx];
        Matter.Body.setPosition(b, { x: bx, y: by });
        Matter.Body.setVelocity(b, { x: 0, y: 0 });
        Matter.Body.setAngle(b, 0);
        Matter.Body.setAngularVelocity(b, 0);
        Matter.Body.setDensity(b, this.initialDensity);
      }
    }
    this.mesh.x = x;
    this.mesh.y = y;
    this.setVisible(true);
  }

  public setVisible(v: boolean): void {
    this.mesh.visible = v;
    if (this.gridGraphics) this.gridGraphics.visible = v && this.debug;
  }

  private tickEffects = () => {
    if (this.shockwaves.length === 0) return;
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.life++;
      const t = s.life / s.maxLife;
      s.g.alpha = 1 - t;
      s.g.scale.set(1 + t);
      // Apply stroke so the rect is visible this frame
      s.g.stroke();
      if (s.life >= s.maxLife) {
        s.g.destroy();
        this.shockwaves.splice(i, 1);
      }
    }
  };
}
