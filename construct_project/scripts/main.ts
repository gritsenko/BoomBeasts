// Import mesh utilities
import { captureInitialMesh, updateMeshPoints } from './SoftBody.js';
import { WarriorController } from './warrior.js';

const warriors: WarriorController[] = [];

let timer = 0;

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

  for (const instance of runtime.objects.Warrior.instances()) {
    const controller = new WarriorController(instance);
    warriors.push(controller);
  }

  // Capture baseline mesh points for all existing SoftBodies instances
  for (const instance of runtime.objects.SoftBodies.instances()) {
    captureInitialMesh(instance);
  }

  runtime.addEventListener('tick', () => Tick(runtime));
}

function Tick(runtime: IRuntime) {
  const dt = runtime.dt; // Time step

  timer += dt;
  if (timer >= 2) {
    enemyAction(runtime);
    timer = 0;
  }

  for (const instance of runtime.objects.SoftBodies.instances()) {
    const tpos = { x: instance.instVars.tx, y: instance.instVars.ty };

    // Debug: log tpos and instance position
    // console.log(
    //   `Instance pos: ${instance.x}, ${instance.y}, tpos: ${tpos.x}, ${tpos.y}, targetLocal: ${tpos.x}, ${tpos.y}`
    // );

    instance.x = lerp(instance.x, tpos.x, 0.3);
    instance.y = lerp(instance.y, tpos.y, 0.3);

    updateMeshPoints(tpos, instance, dt);
  }
}
function lerp(x: number, x1: number, t: number): number {
  return x + (x1 - x) * t;
}

function enemyAction(runtime: IRuntime) {
  runtime.callFunction('PushAction', 1, 7, Math.random()*2);

  const lastInstance = (() => {
    const arr = Array.from(runtime.objects.SoftBodies.instances());
    return arr.length ? arr[arr.length - 1] : null;
  })();

  lastInstance?.setAnimation("Pumping");
  setTimeout(()=> lastInstance?.setAnimation("Default"), 500);
}
