# Primeform Labs — VMC Operator HMI

A responsive full-stack mock HMI for the Primeform Software Engineer technical assignment: **VMC Operator HMI - Startup Guidance**.

## Stack

- Next.js 15 + React 19
- TypeScript
- CSS (responsive, no UI framework dependency)
- Next.js Route Handler API at `/api/hmi`
- Browser localStorage for simple durable demo persistence

## Workflow

`POWER ON → MACHINE CHECKS → TOOLS → WORKPIECE → READY → RUNNING`

The UI deliberately shows one stage at a time. The Next action is locked until all items in the current stage are confirmed. Operation can only start after the complete startup sequence is ready.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

For production:

```bash
npm run build
npm start
```

## Deployment

This project is ready for Vercel or another Next.js-compatible host. Import the repository, use the default build settings, and deploy. No environment variables are required.

## Demo behavior

- State is mirrored to `/api/hmi` and persisted in `localStorage`.
- Reset demo returns the HMI to POWER ON / Machine Checks.
- The operation screen is explicitly marked simulation-only.
- No login is required for the demo.

## Assignment mapping

1. Machine checks: power/control, E-stop, guard/door, alarm, lubrication/coolant, reference return.
2. Required tools: four mock tools with number/type and CNC program revision.
3. Workpiece setup: fixture, orientation, clamping, material/drawing revision, work offset.
4. Ready review: completed startup checklist and READY state.
5. Operation: READY / RUNNING / STOPPED with Start and Stop controls.
