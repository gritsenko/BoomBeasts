# GitHub Copilot Usage Instructions

## Purpose
This document provides guidelines for using GitHub Copilot in the BoomBeasts project to ensure code quality and consistency.

## Instructions
- Always accept Copilot suggestions that follow the formatting rules defined in `.prettierrc`.
- If Copilot suggests code that does not match the project's style, reformat it before committing.
- Use the `npm run format` command to auto-format Copilot-generated code before each commit.
- Review Copilot suggestions for logic errors, security issues, and project-specific conventions.
- Do not commit code that fails Prettier or lint checks.
- Do not invoke the command `npm run dev` since the dev server is always running anyway.

## Construct 3 Project Guidelines
The `construct_project` folder contains a Construct 3 game project with TypeScript scripting. Follow these guidelines when working with Construct 3 SDK:

- **Main Script Location**: Primary scripting is in `construct_project/scripts/main.ts`. This file handles runtime initialization and the main tick loop.
- **Runtime API Usage**:
  - Access object types using `runtime.objects.ObjectTypeName` (e.g., `runtime.objects.Player`).
  - Access families using `runtime.objects.FamilyName` (e.g., `runtime.objects.SoftBodies`).
  - Iterate over instances with `.instances()` method (e.g., `for (const inst of runtime.objects.SoftBodies.instances())`).
- **Tick Function**: The `Tick(runtime)` function runs every frame. Use `runtime.dt` for time-based calculations to ensure frame-rate independence (e.g., rotation: `inst.angle += 1 * runtime.dt`).
- **Instance Properties**: Common properties include `x`, `y`, `angle`, `width`, `height`, `opacity`, etc. Modify these directly on instances.
- **Behaviors**: Access behaviors via `inst.behaviors.BehaviorName` (e.g., `inst.behaviors.Platform`).
- **Events and Scripting**: While event sheets handle most logic, use scripting for complex behaviors, custom physics, or performance-critical code.
- **Type Definitions**: Refer to `construct_project/scripts/ts-defs/` for TypeScript definitions of runtime interfaces (e.g., `IRuntime`, `IInstance`).
- **Best Practices**:
  - Use async/await for asynchronous operations in `runOnStartup` and `OnBeforeProjectStart`.
  - Avoid blocking operations in the Tick function to maintain performance.
  - Test changes in Construct 3 editor to ensure compatibility with the visual editor.
  - Document custom functions and variables for maintainability.
- **Common Patterns**:
  - For object manipulation: `inst.x += speed * runtime.dt;`
  - For collision detection: Use `inst.testOverlap(otherInst)` or runtime's collision system.
  - For animations: Access via `inst.animation` and set frames or play animations.

## Recommended Editor Settings
- Install the Prettier extension for your editor and enable format-on-save.
- Enable Copilot only in files where it is helpful and review all suggestions carefully.

## Additional Resources
- [Prettier Documentation](https://prettier.io/docs/en/index.html)
- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [Construct 3 Scripting Reference](https://www.construct.net/en/make-games/manuals/construct-3/scripting)
