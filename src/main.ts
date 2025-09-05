import { Application, Assets, MeshPlane, Graphics } from "pixi.js";

// Set this to true to show the debug grid overlay
const SHOW_GRID = false;
import Matter from "matter-js";

// Soft body settings for easy tuning
const SOFT_BODY_SETTINGS = {
  stiffness: 0.1,
  damping: 0.3,
  particleRadius: 5,
  gravity: 0.9,
  frictionAir: 0.03,
  restitution: 0.1,
  gridSizeX: 4, // Number of columns
  gridSizeY: 5  // Number of rows
};

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: "#1099bb", resizeTo: window });

  // Append the application canvas to the document body
  document.getElementById("pixi-container")!.appendChild(app.canvas);

  // Initialize Matter.js
  const { Engine, World, Bodies, Constraint } = Matter;
  const engine = Engine.create();
  engine.world.gravity.y = SOFT_BODY_SETTINGS.gravity; // Add gravity

  // Add scene boundaries
  const ground = Bodies.rectangle(app.screen.width / 2, app.screen.height + 50, app.screen.width, 100, { isStatic: true });
  const leftWall = Bodies.rectangle(-50, app.screen.height / 2, 100, app.screen.height, { isStatic: true });
  const rightWall = Bodies.rectangle(app.screen.width + 50, app.screen.height / 2, 100, app.screen.height, { isStatic: true });
  const ceiling = Bodies.rectangle(app.screen.width / 2, -50, app.screen.width, 100, { isStatic: true });
  World.add(engine.world, [ground, leftWall, rightWall, ceiling]);

  // Load the kapibara texture
  const kapibaraTexture = await Assets.load("/assets/sprites/kapibara.png");

  // Create a mesh plane with kapibara texture
  const gridSizeX = SOFT_BODY_SETTINGS.gridSizeX;
  const gridSizeY = SOFT_BODY_SETTINGS.gridSizeY;
  const meshPlane = new MeshPlane({
    texture: kapibaraTexture,
    verticesX: gridSizeX,
    verticesY: gridSizeY,
  });

  // Center mesh on screen
  meshPlane.x = (app.screen.width - meshPlane.width) / 2;
  meshPlane.y = (app.screen.height - meshPlane.height) / 2;
  // Move mesh up to match the particle vertical offset so the skin and physics align
  meshPlane.y -= 150;
  app.stage.addChild(meshPlane);

  // Create soft body physics grid manually (replacing deprecated Composites.softBody)
  // Calculate grid gaps for physics grid
  const columnGap = meshPlane.width / (gridSizeX - 1);
  const rowGap = meshPlane.height / (gridSizeY - 1);
  const particleRadius = SOFT_BODY_SETTINGS.particleRadius;
  const particleOptions = {
    friction: 0.05,
    frictionStatic: 0.0,
    frictionAir: SOFT_BODY_SETTINGS.frictionAir,
    restitution: SOFT_BODY_SETTINGS.restitution,
    render: { fillStyle: '#222222' }
  };
  const constraintOptions = {
    stiffness: SOFT_BODY_SETTINGS.stiffness,
    damping: SOFT_BODY_SETTINGS.damping,
    render: { visible: false }
  };

  const softBody = { bodies: [] as Matter.Body[], constraints: [] as Matter.Constraint[] };

  // Create particles
  for (let y = 0; y < gridSizeY; y++) {
    for (let x = 0; x < gridSizeX; x++) {
      const body = Bodies.circle(
        meshPlane.x + x * columnGap,
        meshPlane.y + y * rowGap,
        particleRadius,
        particleOptions
      );
      softBody.bodies.push(body);
    }
  }

  // Create constraints
  for (let y = 0; y < gridSizeY; y++) {
    for (let x = 0; x < gridSizeX; x++) {
      const bodyA = softBody.bodies[y * gridSizeX + x];

      // Connect to right neighbor
      if (x < gridSizeX - 1) {
        const bodyB = softBody.bodies[y * gridSizeX + x + 1];
        softBody.constraints.push(Constraint.create({
          bodyA: bodyA,
          bodyB: bodyB,
          ...constraintOptions
        }));
      }

      // Connect to bottom neighbor
      if (y < gridSizeY - 1) {
        const bodyB = softBody.bodies[(y + 1) * gridSizeX + x];
        softBody.constraints.push(Constraint.create({
          bodyA: bodyA,
          bodyB: bodyB,
          ...constraintOptions
        }));
      }

      // Add cross braces for stability
      if (x < gridSizeX - 1 && y < gridSizeY - 1) {
        const bodyB = softBody.bodies[(y + 1) * gridSizeX + x + 1];
        softBody.constraints.push(Constraint.create({
          bodyA: bodyA,
          bodyB: bodyB,
          stiffness: SOFT_BODY_SETTINGS.stiffness * 0.3,
          damping: SOFT_BODY_SETTINGS.damping,
          render: { visible: false }
        }));
      }

      // Additional bending constraints (skip one) to improve stability and motion
      if (x < gridSizeX - 2) {
        const bodyB = softBody.bodies[y * gridSizeX + x + 2];
        softBody.constraints.push(Constraint.create({
          bodyA: bodyA,
          bodyB: bodyB,
          stiffness: SOFT_BODY_SETTINGS.stiffness * 0.2,
          damping: SOFT_BODY_SETTINGS.damping * 0.5,
          render: { visible: false }
        }));
      }
      if (y < gridSizeY - 2) {
        const bodyB = softBody.bodies[(y + 2) * gridSizeX + x];
        softBody.constraints.push(Constraint.create({
          bodyA: bodyA,
          bodyB: bodyB,
          stiffness: SOFT_BODY_SETTINGS.stiffness * 0.2,
          damping: SOFT_BODY_SETTINGS.damping * 0.5,
          render: { visible: false }
        }));
      }
    }
  }

  World.add(engine.world, softBody.bodies);
  World.add(engine.world, softBody.constraints);

  // Draw debug grid overlay (based on actual mesh vertices)
  const grid = new Graphics();
  grid.setStrokeStyle({ width: 1, color: 0xff00ff, alpha: 1 });
  grid.x = meshPlane.x;
  grid.y = meshPlane.y;
  app.stage.addChild(grid);
  grid.visible = SHOW_GRID;
    // Move grid above mesh for visibility
    //app.stage.setChildIndex(grid, app.stage.children.length - 1);

  // Update loop for physics
  app.ticker.add(() => {
    Engine.update(engine, 1000 / 60);

    // Map soft body positions to mesh vertices (Pixi v8: use 'aPosition' buffer)
    const geomAny = meshPlane.geometry as any;
    const posBuffer = geomAny.getBuffer?.('aPosition') || geomAny.getBuffer?.('aVertexPosition');
    let vertices: Float32Array | null = null;
    let flush = () => {};
    if (posBuffer && posBuffer.data) {
      vertices = posBuffer.data as Float32Array;
      flush = () => posBuffer.update();
    } else if (geomAny.positions) {
      // Fallback for older types/versions
      vertices = geomAny.positions as Float32Array;
      flush = () => {};
    }

    if (vertices) {
      const count = Math.min(softBody.bodies.length, vertices.length / 2);
      for (let i = 0; i < count; i++) {
        const body = softBody.bodies[i];
        vertices[2 * i] = body.position.x - meshPlane.x;
        vertices[2 * i + 1] = body.position.y - meshPlane.y;
      }
      flush();
    }

    // Redraw debug grid from current mesh vertices
    if (vertices) {
      grid.clear();
      grid.setStrokeStyle({ width: 1, color: 0xff00ff, alpha: 1 });
      const cols = gridSizeX;
      const rows = gridSizeY;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const i0 = (r * cols + c) * 2;
          const i1 = (r * cols + (c + 1)) * 2;
          grid.moveTo(vertices[i0], vertices[i0 + 1]);
          grid.lineTo(vertices[i1], vertices[i1 + 1]);
        }
      }
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows - 1; r++) {
          const i0 = (r * cols + c) * 2;
          const i1 = ((r + 1) * cols + c) * 2;
          grid.moveTo(vertices[i0], vertices[i0 + 1]);
          grid.lineTo(vertices[i1], vertices[i1 + 1]);
        }
      }
      grid.stroke();
    }
  });
})();
