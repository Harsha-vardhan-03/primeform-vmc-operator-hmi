'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Check, ChevronRight, CircleDot, Gauge, LockKeyhole, Play, Power, RotateCcw, ShieldCheck, Square, Wrench } from 'lucide-react';
import { checks, initialState, scenario, stages, tools, workpieceItems, type OperationStatus, type StageId } from '@/lib/hmi';

const STORAGE_KEY = 'primeform-vmc-hmi-state';
type State = typeof initialState;
const powerStage = { label: 'Power on' };

function isValidState(value: unknown): value is State {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<State>;
  return stages.some(({ id }) => id === candidate.stage)
    && Array.isArray(candidate.confirmedChecks)
    && Array.isArray(candidate.confirmedTools)
    && Array.isArray(candidate.confirmedWorkpiece)
    && ['READY', 'RUNNING', 'STOPPED'].includes(candidate.operationStatus ?? '');
}

type DisplayStatus = OperationStatus | 'SETUP IN PROGRESS';

function StatusPill({ status }: { status: DisplayStatus }) {
  return <span className={`pill ${status.toLowerCase().replaceAll(' ', '-')}`}><span className="pill-dot" />{status}</span>;
}

export default function HMI() {
  const [state, setState] = useState<State>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [apiState, setApiState] = useState<'online' | 'syncing' | 'offline'>('online');

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
      if (isValidState(saved)) setState(saved);
    } catch { localStorage.removeItem(STORAGE_KEY); }
    setHydrated(true);
    fetch('/api/hmi').then(response => { if (!response.ok) throw new Error('API unavailable'); }).catch(() => setApiState('offline'));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setApiState('syncing');
    fetch('/api/hmi', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(state) })
      .then(response => { if (!response.ok) throw new Error('Unable to save state'); setApiState('online'); })
      .catch(() => setApiState('offline'));
  }, [state, hydrated]);

  const stageIndex = stages.findIndex(({ id }) => id === state.stage);
  const checksComplete = state.confirmedChecks.length === checks.length;
  const toolsComplete = state.confirmedTools.length === tools.length;
  const workpieceComplete = state.confirmedWorkpiece.length === workpieceItems.length;
  const readyComplete = checksComplete && toolsComplete && workpieceComplete;
  const workflowReady = readyComplete && (state.stage === 'ready' || state.stage === 'operation');
  const jobStatus: DisplayStatus = workflowReady ? state.operationStatus : 'SETUP IN PROGRESS';
  const currentInstruction = useMemo(() => {
    if (state.stage === 'checks') return checks.find(item => !state.confirmedChecks.includes(item.id));
    if (state.stage === 'tools') return tools.find(item => !state.confirmedTools.includes(item.id));
    if (state.stage === 'workpiece') return workpieceItems.find(item => !state.confirmedWorkpiece.includes(item.id));
  }, [state]);

  const confirmCurrent = () => {
    if (!currentInstruction) return;
    if (state.stage === 'checks') setState(current => ({ ...current, confirmedChecks: [...current.confirmedChecks, currentInstruction.id] }));
    if (state.stage === 'tools') setState(current => ({ ...current, confirmedTools: [...current.confirmedTools, currentInstruction.id] }));
    if (state.stage === 'workpiece') setState(current => ({ ...current, confirmedWorkpiece: [...current.confirmedWorkpiece, currentInstruction.id] }));
  };

  const canAdvance = (state.stage === 'checks' && checksComplete) || (state.stage === 'tools' && toolsComplete) || (state.stage === 'workpiece' && workpieceComplete) || (state.stage === 'ready' && readyComplete);
  const next = () => {
    if (!canAdvance) return;
    const nextStage: Record<StageId, StageId> = { checks: 'tools', tools: 'workpiece', workpiece: 'ready', ready: 'operation', operation: 'operation' };
    setState(current => ({ ...current, stage: nextStage[current.stage] }));
  };
  const start = () => { if (state.stage === 'operation' && readyComplete && state.operationStatus === 'READY') setState(current => ({ ...current, operationStatus: 'RUNNING' })); };
  const stop = () => { if (state.operationStatus === 'RUNNING') setState(current => ({ ...current, operationStatus: 'STOPPED' })); };
  const progress = ((stageIndex + 2) / (stages.length + 1)) * 100;
  const allDone = state.stage === 'operation' && state.operationStatus === 'RUNNING';
  const nextLabels: Partial<Record<StageId, string>> = { checks: 'TOOLS', tools: 'WORKPIECE', workpiece: 'READY REVIEW', ready: 'OPERATION' };

  if (!hydrated) {
    return <main className="shell hydration-shell"><div className="hydration-message" role="status" aria-live="polite"><CircleDot size={28} /><span>RESTORING OPERATOR STATE...</span></div></main>;
  }

  return <main className="shell">
    <header className="topbar"><div className="brand"><div className="brand-mark"><CircleDot size={22} /></div><div><strong>PRIMEFORM</strong><span>VMC OPERATOR HMI</span></div></div><div className="machine-meta"><span className="machine-name">{scenario.machine}</span><span className="live"><span className="live-dot" />CONTROL ONLINE</span></div></header>
    <section className="statusbar" aria-label="Machine status"><div className="power-state"><Power size={18} /><span>POWER ON</span></div><div className="job"><span>PART</span><strong>{scenario.part}</strong><span className="sep">/</span><span>OPERATION</span><strong>{scenario.operation}</strong></div><div className="api-state"><span className={`api-dot ${apiState}`} />{apiState === 'syncing' ? 'SAVING' : apiState === 'offline' ? 'LOCAL MODE' : 'STATE SAVED'}</div></section>
    <div className="progress-wrap"><div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div><div className="progress-label"><span>STARTUP SEQUENCE</span><strong>STAGE {stageIndex + 2} OF 6</strong></div></div>
    <section className="content">
      <aside className="stage-rail" aria-label="Startup stages">
        <div className="rail-item complete"><div className="rail-index"><Check size={15} /></div><span>{powerStage.label}</span></div>
        {stages.map((item, index) => { const complete = index < stageIndex || (item.id === 'operation' && allDone); const active = item.id === state.stage; return <div className={`rail-item ${active ? 'active' : ''} ${complete ? 'complete' : ''}`} key={item.id}><div className="rail-index">{complete ? <Check size={15} /> : index + 2}</div><span>{item.label}</span></div>; })}
        <div className="rail-spacer" /><button className="reset-btn" type="button" onClick={() => setState(initialState)}><RotateCcw size={15} /> Reset demo</button>
      </aside>
      <div className="workspace">
        <div className="eyebrow">CURRENT INSTRUCTION</div>
        {state.stage === 'checks' && <ChecksStage confirmed={state.confirmedChecks} current={currentInstruction?.id} />}
        {state.stage === 'tools' && <ToolsStage confirmed={state.confirmedTools} current={currentInstruction?.id} />}
        {state.stage === 'workpiece' && <WorkpieceStage confirmed={state.confirmedWorkpiece} current={currentInstruction?.id} />}
        {state.stage === 'ready' && <ReadyStage />}
        {state.stage === 'operation' && <OperationStage status={state.operationStatus} />}
        {state.stage !== 'operation' && <div className="action-row"><button className="confirm-btn" type="button" disabled={!currentInstruction} onClick={confirmCurrent}><ShieldCheck size={21} /> {state.stage === 'workpiece' ? 'CONFIRM SETUP ITEM' : state.stage === 'tools' ? 'CONFIRM TOOL' : 'CONFIRM CHECK'}</button><button className="next-btn" type="button" disabled={!canAdvance} onClick={next}>NEXT: {nextLabels[state.stage]} <ChevronRight size={22} /></button></div>}
        {state.stage === 'operation' && <div className="action-row operation-actions"><button className="start-btn" type="button" disabled={!readyComplete || state.operationStatus !== 'READY'} onClick={start}><Play size={21} fill="currentColor" /> START OPERATION</button><button className="stop-btn" type="button" disabled={state.operationStatus !== 'RUNNING'} onClick={stop}><Square size={19} fill="currentColor" /> STOP OPERATION</button></div>}
      </div>
      <aside className="job-card"><div className="card-head"><span>JOB DATA</span><Gauge size={18} /></div><div className="job-row"><span>Material</span><strong>{scenario.material}</strong></div><div className="job-row"><span>Drawing</span><strong>{scenario.drawing}</strong></div><div className="job-row"><span>CNC program</span><strong>{scenario.program}</strong></div><div className="job-row"><span>Program revision</span><strong>{scenario.programRevision}</strong></div><div className="job-row"><span>Fixture / offset</span><strong>{scenario.fixture} / {scenario.workOffset}</strong></div><div className="card-divider" /><div className="mini-status"><span>{workflowReady ? 'OPERATION STATUS' : 'MACHINE STATUS'}</span><StatusPill status={jobStatus} /></div></aside>
    </section>
    <footer><span>VMC STARTUP GUIDANCE</span><span>SIMULATION ONLY • NO MACHINE CONTROL</span><span>PRIMEFORM LABS</span></footer>
  </main>;
}

function ChecksStage({ confirmed, current }: { confirmed: string[]; current?: string }) { const item = checks.find(check => check.id === current); return <div><Title title="Machine checks" description="Verify each machine condition before loading tools." count={`${confirmed.length} / ${checks.length} CONFIRMED`} /><Instruction icon={<Power size={31} />} label={item ? `CHECK ${confirmed.length + 1} OF ${checks.length}` : 'MACHINE CHECKS COMPLETE'} title={item?.title ?? 'All machine checks confirmed'} description={item?.detail ?? 'The machine startup checklist is complete. Continue to required tooling.'} /><Checklist items={checks} confirmed={confirmed} current={current} /></div>; }
function ToolsStage({ confirmed, current }: { confirmed: string[]; current?: string }) { const tool = tools.find(item => item.id === current); return <div><Title title="Required tools" description="Insert the ordered tools for this CNC program." count={`${confirmed.length} / ${tools.length} LOADED`} /><Instruction icon={<Wrench size={31} />} label={`LOAD TOOL ${confirmed.length + 1}`} title={tool ? `${tool.number} · ${tool.type}` : 'All required tools loaded'} description={tool ? `${tool.detail}. Confirm the tool is inserted and seated correctly.` : 'Required tooling is complete. Continue to workpiece setup.'} /><Checklist items={tools} confirmed={confirmed} current={current} tool /><div className="program-note"><span>CNC PROGRAM / REVISION</span><strong>{scenario.program} · {scenario.programRevision}</strong></div></div>; }
function WorkpieceStage({ confirmed, current }: { confirmed: string[]; current?: string }) { const item = workpieceItems.find(setup => setup.id === current); return <div><Title title="Workpiece setup" description="Confirm each required setup condition before operation." count={`${confirmed.length} / ${workpieceItems.length} CONFIRMED`} /><Instruction icon={<LockKeyhole size={31} />} label={`SETUP ITEM ${confirmed.length + 1}`} title={item?.label ?? 'Workpiece setup complete'} description={item?.instruction ?? 'All fixture, part, and offset requirements are confirmed.'} /><Checklist items={workpieceItems} confirmed={confirmed} current={current} /></div>; }
function Title({ title, description, count }: { title: string; description: string; count: string }) { return <div className="title-row"><div><h1>{title}</h1><p>{description}</p></div><div className="counter">{count}</div></div>; }
function Instruction({ icon, label, title, description }: { icon: ReactNode; label: string; title: string; description: string }) { return <div className="instruction-card" aria-live="polite"><div className="instruction-icon">{icon}</div><div><span className="instruction-label">{label}</span><h2>{title}</h2><p>{description}</p></div><div className="check-glyph"><CircleDot size={28} /></div></div>; }
function Checklist({ items, confirmed, current, tool = false }: { items: Array<{ id: string; title?: string; label?: string; type?: string; number?: string; detail?: string; value?: string }>; confirmed: string[]; current?: string; tool?: boolean }) { return <div className={tool ? 'tool-list' : 'check-list'}>{items.map((item, index) => { const done = confirmed.includes(item.id); const title = item.title ?? item.label ?? item.type ?? ''; const detail = item.detail ?? item.value ?? ''; return <div className={`${tool ? 'tool-row' : 'list-item'} ${done ? 'done' : item.id === current ? 'current' : ''}`} key={item.id}>{tool && <div className="tool-tag">{item.number}</div>}{!tool && <div className="list-icon">{done ? <Check size={18} /> : index + 1}</div>}<div><strong>{title}</strong><span>{detail}</span></div>{tool && <span className="tool-state">{done ? <><Check size={17} /> LOADED</> : item.id === current ? 'LOAD NOW' : 'PENDING'}</span>}</div>; })}</div>; }
function ReadyStage() { return <div><div className="title-row"><div><h1>Ready review</h1><p>All startup arrangements have been confirmed.</p></div><StatusPill status="READY" /></div><div className="ready-panel"><div className="ready-check"><Check size={42} /></div><div><span>SYSTEM STATE</span><h2>READY TO OPERATE</h2><p>Machine checks, required tools and workpiece setup are complete.</p></div></div><div className="review-grid"><div><span>MACHINE</span><strong>6 / 6 checks confirmed</strong></div><div><span>TOOLS</span><strong>4 / 4 tools loaded</strong></div><div><span>WORKPIECE</span><strong>6 / 6 items confirmed</strong></div><div><span>PROGRAM</span><strong>{scenario.program} · {scenario.programRevision}</strong></div></div></div>; }
function OperationStage({ status }: { status: OperationStatus }) { return <div><div className="title-row"><div><h1>{scenario.operation}</h1><p>Simulation control. No physical machine is connected.</p></div><StatusPill status={status} /></div><div className={`operation-panel ${status.toLowerCase()}`}><div className="op-icon">{status === 'RUNNING' ? <Play size={37} fill="currentColor" /> : status === 'STOPPED' ? <Square size={32} fill="currentColor" /> : <Power size={36} />}</div><div><span>OPERATION STATUS</span><h2>{status}</h2><p>{status === 'RUNNING' ? 'Simulation is running. Stop to halt the simulated operation.' : status === 'STOPPED' ? 'Simulation stopped. Startup state is preserved.' : 'All prerequisites are complete. Start the simulated operation when ready.'}</p></div></div><div className="simulation-details"><div><span>PROGRAM</span><strong>{scenario.program} · {scenario.programRevision}</strong></div><div><span>PART</span><strong>{scenario.part}</strong></div><div><span>MATERIAL</span><strong>{scenario.material}</strong></div></div></div>; }
