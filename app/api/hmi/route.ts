import { NextResponse } from 'next/server';
import { checks, initialState, scenario, stages, tools, workpieceItems, type StageId } from '@/lib/hmi';

let serverState = structuredClone(initialState);

const stageRank: Record<StageId, number> = { checks: 0, tools: 1, workpiece: 2, ready: 3, operation: 4 };
const hasOnlyKnownIds = (values: unknown, allowed: string[]) => Array.isArray(values) && values.every(value => typeof value === 'string' && allowed.includes(value));

function isValidWorkflowState(value: unknown): value is typeof initialState {
  if (!value || typeof value !== 'object') return false;
  const state = value as typeof initialState;
  if (!stages.some(stage => stage.id === state.stage) || !['READY', 'RUNNING', 'STOPPED'].includes(state.operationStatus)) return false;
  if (!hasOnlyKnownIds(state.confirmedChecks, checks.map(item => item.id)) || !hasOnlyKnownIds(state.confirmedTools, tools.map(item => item.id)) || !hasOnlyKnownIds(state.confirmedWorkpiece, workpieceItems.map(item => item.id))) return false;
  const checksDone = new Set(state.confirmedChecks).size === checks.length;
  const toolsDone = new Set(state.confirmedTools).size === tools.length;
  const workpieceDone = new Set(state.confirmedWorkpiece).size === workpieceItems.length;
  if (stageRank[state.stage] >= stageRank.tools && !checksDone) return false;
  if (stageRank[state.stage] >= stageRank.workpiece && !toolsDone) return false;
  if (stageRank[state.stage] >= stageRank.ready && !workpieceDone) return false;
  return state.operationStatus === 'READY' || state.stage === 'operation';
}

export async function GET() {
  return NextResponse.json({ scenario, checks, tools, workpieceItems, state: serverState });
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!isValidWorkflowState(body)) return NextResponse.json({ error: 'Invalid startup workflow state.' }, { status: 400 });
    serverState = body;
    return NextResponse.json({ ok: true, state: serverState });
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }
}
