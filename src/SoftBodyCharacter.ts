import { Application, Graphics, MeshPlane, Texture, Container } from 'pixi.js';
import Matter from 'matter-js';

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
  stompVerticalForce?: number;
  stompHorizontalForce?: number;
  container?: Container; // Add container option
};

export class SoftBodyCharacter {
  public mesh: MeshPlane;
  public bodies: Matter.Body[] = [];
  public bodySet: Set<number> = new Set();
  public constraints: Matter.Constraint[] = [];
  // Solid gameplay collider and a static driver that tethers the soft grid
  public solid: Matter.Body;
  private driver: Matter.Body;
  private solidRadius: number;
  public gridSizeX: number;
  public gridSizeY: number;
  public particleRadius: number;
  public initialDensity: number;
  public stompVerticalForce: number;
  public stompHorizontalForce: number;
  public app: Application;
  public engine: Matter.Engine;
  private debug: boolean;
  private gridGraphics: Graphics | null = null;
  private shockwaves: { g: Graphics; life: number; maxLife: number }[] = [];
  private blockTimer: number | null = null;
  private container: Container | null = null;
  // Soft-layer collision category (visual-only collisions with floor/other soft)
  private static readonly SOFT_CATEGORY = 0x0008;
  private static readonly ENV_CATEGORY = 0x0004;

  constructor(
    app: Application,
    engine: Matter.Engine,
    options: SoftBodyOptions,
    collision: { category: number; mask: number; group?: number } = {
      category: 0x0001,
      mask: 0xffff,
      group: -1,
    }
  ) {
    this.app = app;
    this.engine = engine;
    this.gridSizeX = options.gridSizeX;
    this.gridSizeY = options.gridSizeY;
    this.particleRadius = options.particleRadius ?? 5;
    this.initialDensity = options.initialDensity ?? 0.001;
    this.stompVerticalForce = options.stompVerticalForce ?? -0.24;
    this.stompHorizontalForce = options.stompHorizontalForce ?? 0.24;
    this.debug = !!options.debugGrid;
    this.container = options.container || null;

    // Create mesh plane
    this.mesh = new MeshPlane({
      texture: options.texture,
      verticesX: this.gridSizeX,
      verticesY: this.gridSizeY,
    });
    if (options.scale && options.scale !== 1) {
      this.mesh.scale.set(options.scale);
    }
    // Flip texture visually if mirror is true (not mesh vertices)
    if (options.mirror) {
      this.mesh.scale.x = -Math.abs(this.mesh.scale.x);
      this.mesh.x += this.mesh.width;
    }

    this.mesh.x = options.x;
    this.mesh.y = options.y;

    // Add mesh to container or stage
    const targetContainer = this.container || this.app.stage;
    targetContainer.addChild(this.mesh);

    if (this.debug) {
      this.gridGraphics = new Graphics();
      this.gridGraphics.setStrokeStyle({ width: 1, color: 0xff00ff, alpha: 1 });
      this.gridGraphics.x = this.mesh.x;
      this.gridGraphics.y = this.mesh.y;
      targetContainer.addChild(this.gridGraphics);
    }

    // Create solid gameplay collider (circle) — only this participates in gameplay
    const centerX = this.mesh.x + this.mesh.width / 2;
    // Bottom-align the solid with the soft mesh to avoid squashing from center alignment
    this.solidRadius = Math.max(this.mesh.width, this.mesh.height) * 0.4;
    const centerY = this.mesh.y + this.mesh.height - this.solidRadius;
    this.solid = Matter.Bodies.circle(centerX, centerY, this.solidRadius, {
      friction: 0.2,
      frictionStatic: 0.5,
      frictionAir: options.frictionAir ?? 0.02,
      restitution: options.restitution ?? 0.05,
      density: (options.initialDensity ?? 0.001) * 40, // heavier core
      collisionFilter: {
        group: 0,
        category: collision.category,
        mask: collision.mask,
      },
      label: 'solid',
    });
    // Lock rotation to prevent constant spinning from soft tethers
    Matter.Body.setInertia(this.solid, Infinity);
    Matter.World.add(engine.world, this.solid);

    // Driver body (static, no collisions) to which soft mesh is tethered
    this.driver = Matter.Bodies.circle(centerX, centerY, 2, {
      isStatic: true,
      isSensor: true,
      collisionFilter: { category: 0, mask: 0, group: 0 },
      label: 'softDriver',
    });
    Matter.World.add(engine.world, this.driver);

    // Build physics grid (soft layer)
    const columnGap = this.mesh.width / (this.gridSizeX - 1);
    const rowGap = this.mesh.height / (this.gridSizeY - 1);
    const particleOptions: Matter.IBodyDefinition = {
      friction: 0.05,
      frictionStatic: 0.0,
      frictionAir: options.frictionAir ?? 0.03,
      restitution: options.restitution ?? 0.1,
      density: this.initialDensity,
      collisionFilter: {
        // Soft layer collides only with other soft and environment, not solids
        group: 0,
        category: SoftBodyCharacter.SOFT_CATEGORY,
        mask: SoftBodyCharacter.SOFT_CATEGORY | SoftBodyCharacter.ENV_CATEGORY,
      },
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
          particleOptions
        );
        // Reduce allowed overlap between particles during collision resolution
        (body as Matter.Body).slop = 0.01;
        this.bodies.push(body);
        this.bodySet.add(body.id);
      }
    }
    // Constraints among soft nodes
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
            })
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
            })
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
            })
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
            })
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
            })
          );
        }
      }
    }

    // Tether only the center soft node to the driver to avoid torque
    const centerIdx =
      Math.floor(this.gridSizeY / 2) * this.gridSizeX +
      Math.floor(this.gridSizeX / 2);
    const tetherStiff = Math.min(1, (options.stiffness ?? 0.1) * 1.0);
    const tetherDamp = options.damping ?? 0.3;
    this.constraints.push(
      Matter.Constraint.create({
        bodyA: this.driver,
        bodyB: this.bodies[centerIdx],
        stiffness: tetherStiff,
        damping: tetherDamp,
        length: 0,
        render: renderOpts,
      })
    );

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
        (geom.getBuffer('aPosition') || geom.getBuffer('aVertexPosition'))) ||
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
    // Keep driver in sync with the solid collider position
    if (this.driver && this.solid) {
      Matter.Body.setPosition(this.driver, this.solid.position);
    }
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
    return { x: this.solid.position.x, y: this.solid.position.y };
  }

  public applyStomp(targetX: number, power: number): void {
    const b = this.solid;
    const dir = Math.sign(targetX - b.position.x) || 1;
    const verticalForce = this.stompVerticalForce * power;
    const horizontalForce = dir * this.stompHorizontalForce * power;
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
    const targetContainer = this.container || this.app.stage;
    targetContainer.addChild(g);
    // Draw stroke once per frame via stroke() call in tick
    this.shockwaves.push({ g, life: 0, maxLife: 18 }); // ~0.3s at 60fps
  }

  public applyBlock(durationMs = 1000, factor = 3): void {
    // Increase density of the solid collider temporarily (gameplay effect)
    Matter.Body.setDensity(
      this.solid,
      (this.solid.density || this.initialDensity * 40) * factor
    );
    if (this.blockTimer) window.clearTimeout(this.blockTimer);
    // Shield effect
    const g = new Graphics();
    g.setStrokeStyle({ width: 4, color: 0xffffff, alpha: 0.6 });
    g.rect(-50, -50, 100, 100);
    g.x = this.getCenter().x;
    g.y = this.getCenter().y;
    const targetContainer = this.container || this.app.stage;
    targetContainer.addChild(g);
    this.shockwaves.push({ g, life: 0, maxLife: 60 });

    this.blockTimer = window.setTimeout(() => {
      // Restore solid density
      Matter.Body.setDensity(this.solid, (this.initialDensity ?? 0.001) * 40);
      this.blockTimer = null;
    }, durationMs);
  }

  public reset(x: number, y: number): void {
    // Reset positions to a grid anchored at (x,y) (top-left). Recenter solid/driver.
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
    const cx = x + this.mesh.width / 2;
    // Keep solid bottom edge aligned with soft mesh bottom edge
    const cy = y + this.mesh.height - this.solidRadius;
    Matter.Body.setPosition(this.driver, { x: cx, y: cy });
    Matter.Body.setVelocity(this.driver, { x: 0, y: 0 });
    Matter.Body.setPosition(this.solid, { x: cx, y: cy });
    Matter.Body.setVelocity(this.solid, { x: 0, y: 0 });
    Matter.Body.setAngle(this.solid, 0);
    Matter.Body.setAngularVelocity(this.solid, 0);
    this.mesh.x = x;
    this.mesh.y = y;
    this.setVisible(true);
  }

  public setVisible(v: boolean): void {
    this.mesh.visible = v;
    if (this.gridGraphics) this.gridGraphics.visible = v && this.debug;
  }

  /**
   * Show/hide debug grid overlay (purple grid) based on global debug mode.
   */
  public setDebugGridVisible(v: boolean): void {
    if (this.gridGraphics) this.gridGraphics.visible = v;
  }

  public ownsBody(b: Matter.Body): boolean {
    // For legacy checks that traverse soft nodes
    return this.bodySet.has(b.id) || b === this.solid;
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
