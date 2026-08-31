export type StageId = 'checks' | 'tools' | 'workpiece' | 'ready' | 'operation';
export type OperationStatus = 'READY' | 'RUNNING' | 'STOPPED';

export type CheckItem = { id: string; title: string; detail: string };
export type Tool = { id: string; number: string; type: string; detail: string };
export type WorkpieceItem = { id: string; label: string; value: string; instruction: string };

export const scenario = {
  machine: 'VMC-01', part: 'BRKT-042', operation: 'OP20 - Pocket & Drill', material: '6061-T6 Aluminum',
  drawing: 'BRKT-042 Rev C', program: 'BRKT042_OP20', programRevision: 'Rev 1.4',
  fixture: '4-Jaw Precision Fixture', orientation: 'Datum A up; locating pins seated',
  clamping: 'Clamp all four jaws evenly; verify no lift', workOffset: 'G54',
};

export const checks: CheckItem[] = [
  { id: 'power', title: 'Power & control available', detail: 'Main control is powered and the CNC control is responsive.' },
  { id: 'estop', title: 'E-stop released', detail: 'Emergency stop circuit is released and ready.' },
  { id: 'guard', title: 'Guard / door closed', detail: 'Machine enclosure is fully closed.' },
  { id: 'alarm', title: 'No active alarm', detail: 'Alarm screen is clear; no active machine fault is present.' },
  { id: 'coolant', title: 'Lubrication / coolant ready', detail: 'Lubrication and coolant systems are available for the operation.' },
  { id: 'reference', title: 'Reference return complete', detail: 'Machine axes have completed reference return.' },
];

export const tools: Tool[] = [
  { id: 't01', number: 'T01', type: '10 mm 4-flute carbide end mill', detail: 'Pocket roughing / finishing' },
  { id: 't02', number: 'T02', type: '6 mm 3-flute carbide end mill', detail: 'Profile finishing' },
  { id: 't03', number: 'T03', type: '5 mm carbide drill', detail: 'Pilot / through holes' },
  { id: 't04', number: 'T04', type: '10 mm spot drill', detail: 'Hole spotting' },
];

export const workpieceItems: WorkpieceItem[] = [
  { id: 'fixture', label: 'Fixture', value: scenario.fixture, instruction: 'Verify the fixture is secure and the workpiece is seated against locating surfaces.' },
  { id: 'orientation', label: 'Orientation', value: scenario.orientation, instruction: 'Confirm Datum A faces upward and locating pins are fully seated.' },
  { id: 'clamping', label: 'Clamping', value: scenario.clamping, instruction: 'Clamp all four jaws evenly and verify the workpiece cannot shift by hand.' },
  { id: 'material', label: 'Material', value: scenario.material, instruction: 'Verify the loaded stock matches the scheduled material.' },
  { id: 'drawing', label: 'Drawing revision', value: scenario.drawing, instruction: 'Verify the drawing revision matches the setup documentation.' },
  { id: 'offset', label: 'Work offset', value: scenario.workOffset, instruction: 'Confirm the active work offset is set for this fixture.' },
];

export const stages: { id: StageId; label: string }[] = [
  { id: 'checks', label: 'Machine checks' }, { id: 'tools', label: 'Tools' }, { id: 'workpiece', label: 'Workpiece' },
  { id: 'ready', label: 'Ready review' }, { id: 'operation', label: 'Operation' },
];

export const initialState = {
  stage: 'checks' as StageId, confirmedChecks: [] as string[], confirmedTools: [] as string[],
  confirmedWorkpiece: [] as string[], operationStatus: 'READY' as OperationStatus,
};
