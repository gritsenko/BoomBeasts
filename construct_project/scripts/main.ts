// Import any other script files here, e.g.:
// import * as myModule from "./mymodule.js";

// Store initial mesh data per instance so we can apply deformations relative to baseline
const initialMeshPoints = new WeakMap<IWorldInstance, {
  cols: number;
  rows: number;
  points: GetMeshPointOpts[][]; // [col][row]
}>();

runOnStartup(async (runtime) => {
  // Code to run on the loading screen.
  // Note layouts, objects etc. are not yet available.

  runtime.addEventListener('beforeprojectstart', () =>
    OnBeforeProjectStart(runtime)
  );
});

async function OnBeforeProjectStart(runtime: IRuntime) {
  // Code to run just before 'On start of layout' on
  // the first layout. Loading has finished and initial
  // instances are created and available to use here.

  // Capture baseline mesh points for all existing SoftBodies instances
  for (const instance of runtime.objects.SoftBodies.instances()) {
    captureInitialMesh(instance);
  }
  
  runtime.addEventListener('tick', () => Tick(runtime));
}

function Tick(runtime: IRuntime) {
  // Animation parameters
  const amplitude = 8; // pixels
  const frequency = 10; // oscillations per second

  // Simple time-based oscillation that guarantees zero average
  const timePhase = (runtime.gameTime * 0.001) * frequency * Math.PI * 2;
  const globalWave = Math.sin(timePhase);

  for (const instance of runtime.objects.SoftBodies.instances()) {
    // Lazily capture baseline for instances created after startup
    if (!initialMeshPoints.has(instance)) {
      captureInitialMesh(instance);
    }

    const data = initialMeshPoints.get(instance);
    if (!data) continue; // no mesh present

    const { cols, rows, points } = data;

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const base = points[i][j];

        // Vertical factor: stronger wave effect in the middle of the character
        const verticalFactor = Math.sin((j / Math.max(1, rows - 1)) * Math.PI);
        
        // Simple oscillation with no spatial component to prevent drift
        const waveOffset = globalWave * amplitude ;

        // Apply horizontal displacement
        const newX = base.x + waveOffset;

		console.log(waveOffset);
        instance.setMeshPoint(i, j, { mode: "absolute", x: newX, y: base.y });
      }
    }
  }
}

function captureInitialMesh(instance: IWorldInstance) {
  const [cols, rows] = instance.getMeshSize();
  if (!cols || !rows) return; // no mesh to capture

  const points: GetMeshPointOpts[][] = new Array(cols);
  for (let i = 0; i < cols; i++) {
    points[i] = new Array(rows);
    for (let j = 0; j < rows; j++) {
      points[i][j] = instance.getMeshPoint(i, j);
    }
  }

  initialMeshPoints.set(instance, { cols, rows, points });
}
