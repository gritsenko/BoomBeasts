// Mesh simulation utilities for Construct 3 mesh-deformed sprites
// - Stores initial mesh baseline per instance
// - Runs a lightweight spring-mass update and writes back to mesh points
 
// Store initial mesh data per instance so we can apply deformations relative to baseline
const initialMeshPoints = new WeakMap<
  IWorldInstance,
  {
    cols: number;
    rows: number;
    points: GetMeshPointOpts[][]; // [col][row]
    avgRestLength: number;
  }
>();

// Store current positions and velocities for physics simulation
const meshPhysics = new WeakMap<
  IWorldInstance,
  {
    positions: { x: number; y: number }[][];
    velocities: { x: number; y: number }[][];
  }
>();

export function updateMeshPoints(
  tpos: { x: number; y: number },
  instance: IWorldInstance,
  dt: number
): boolean {
  // Physics parameters (reduced for smaller amplitude)
  const springConstant = 0.2; // Spring stiffness between neighbors
  const damping = 0.1; // Damping factor
  const targetSpringConstant = 0.002; // Stiffness for center attraction
  const maxForce = 1; // Maximum force

  // Convert tpos to local coordinates relative to the instance
  const targetLocalX = tpos.x - instance.x;
  const targetLocalY = tpos.y - instance.y;

  // Lazily capture baseline for instances created after startup
  if (!initialMeshPoints.has(instance)) {
    captureInitialMesh(instance);
  }

  const data = initialMeshPoints.get(instance);
  if (!data) return false;

  const { cols, rows, points, avgRestLength } = data;

  // Initialize physics if not done
  if (!meshPhysics.has(instance)) {
    initializePhysics(instance, cols, rows, points);
  }

  const physics = meshPhysics.get(instance);
  if (!physics) return false;

  const { positions, velocities } = physics;

  // Find center point
  const centerCol = Math.floor(cols / 2);
  const centerRow = Math.floor(rows / 2);

  // Apply forces
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const pos = positions[i][j];
      const vel = velocities[i][j];

      let forceX = 0;
      let forceY = 0;

      // Spring forces from neighbors
      const neighbors = [
        { di: -1, dj: 0 }, // left
        { di: 1, dj: 0 }, // right
        { di: 0, dj: -1 }, // up
        { di: 0, dj: 1 }, // down
      ];

      for (const { di, dj } of neighbors) {
        const ni = i + di;
        const nj = j + dj;
        if (ni >= 0 && ni < cols && nj >= 0 && nj < rows) {
          const npos = positions[ni][nj];
          const dx = npos.x - pos.x;
          const dy = npos.y - pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            const force = springConstant * (dist - avgRestLength);
            forceX += (dx / dist) * force;
            forceY += (dy / dist) * force;
          }
        }
      }

      // Attraction to local target for center point
      if (i === centerCol && j === centerRow) {
        const dx = targetLocalX - pos.x;
        const dy = targetLocalY - pos.y;
        forceX += targetSpringConstant * dx;
        forceY += targetSpringConstant * dy;
      }

      // Damping
      forceX -= damping * vel.x;
      forceY -= damping * vel.y;

      // Clamp forces
      forceX = Math.max(-maxForce, Math.min(maxForce, forceX));
      forceY = Math.max(-maxForce, Math.min(maxForce, forceY));

      // Update velocity
      vel.x += forceX * dt;
      vel.y += forceY * dt;

      // Update position
      pos.x += vel.x * dt;
      pos.y += vel.y * dt;
    }
  }

  // Update mesh points back into instance
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const pos = positions[i][j];
      instance.setMeshPoint(i, j, { x: pos.x, y: pos.y });
    }
  }

  return true;
}

export function captureInitialMesh(instance: IWorldInstance) {
  const [cols, rows] = instance.getMeshSize();
  if (!cols || !rows) return; // no mesh to capture

  const points: GetMeshPointOpts[][] = new Array(cols);
  for (let i = 0; i < cols; i++) {
    points[i] = new Array(rows);
    for (let j = 0; j < rows; j++) {
      const meshPoint = instance.getMeshPoint(i, j);
      if (!meshPoint) {
        console.warn(`Mesh point (${i}, ${j}) is undefined`);
        points[i][j] = { x: 0, y: 0, zElevation: 0, u: 0, v: 0 }; // default
      } else {
        points[i][j] = meshPoint;
      }
    }
  }

  // Now calculate average distance to neighbors
  let totalDist = 0;
  let count = 0;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const meshPoint = points[i][j];
      const neighbors = [
        { di: -1, dj: 0 },
        { di: 1, dj: 0 },
        { di: 0, dj: -1 },
        { di: 0, dj: 1 },
      ];
      for (const { di, dj } of neighbors) {
        const ni = i + di;
        const nj = j + dj;
        if (ni >= 0 && ni < cols && nj >= 0 && nj < rows) {
          const nMeshPoint = points[ni][nj];
          const dx = meshPoint.x - nMeshPoint.x;
          const dy = meshPoint.y - nMeshPoint.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          totalDist += dist;
          count++;
        }
      }
    }
  }

  const avgRestLength = count > 0 ? totalDist / count : 1;
  console.log(`Average rest length: ${avgRestLength}`);

  initialMeshPoints.set(instance, { cols, rows, points, avgRestLength });
}

function initializePhysics(
  instance: IWorldInstance,
  cols: number,
  rows: number,
  points: GetMeshPointOpts[][]
) {
  const positions: { x: number; y: number }[][] = new Array(cols);
  const velocities: { x: number; y: number }[][] = new Array(cols);

  for (let i = 0; i < cols; i++) {
    positions[i] = new Array(rows);
    velocities[i] = new Array(rows);
    for (let j = 0; j < rows; j++) {
      positions[i][j] = { x: points[i][j].x, y: points[i][j].y };
      velocities[i][j] = { x: 0, y: 0 };
    }
  }

  meshPhysics.set(instance, { positions, velocities });
}
