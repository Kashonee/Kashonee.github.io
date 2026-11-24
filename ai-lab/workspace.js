import {traceProgram} from './engine.js?v=learning-flow-2';

const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const text = (value, max = 1500) => typeof value === 'string' ? value.slice(0, max) : '';

// Keep the original storage schema readable; new fields are additive.
export function normalizeWorkspace(value) {
  const source = record(value);
  const diagnostics = record(source.diagnostics);
  const history = Array.isArray(source.diagnosticHistory)
    ? source.diagnosticHistory.filter(item => item && ['initial', 'final'].includes(item.type))
    : Object.entries(diagnostics).filter(([type, item]) => ['initial', 'final'].includes(type) && item)
      .map(([type, item]) => ({...item, type, variant: item.variant || 'A-v1'}));
  return {
    completed: record(source.completed), diagnostics,
    attempts: record(source.attempts), programs: record(source.programs),
    drafts: record(source.drafts), assessments: record(source.assessments),
    diagnosticHistory: history,
    activeMission: text(source.activeMission, 40),
    workLabel: text(source.workLabel, 60)
  };
}

// Rebuild execution from the interpreter rather than trusting stored positions.
export function restoreMission(mission, storedProgram, savedDraft) {
  let program = structuredClone(storedProgram ?? mission.initial ?? []);
  try { traceProgram(mission, program); }
  catch { program = structuredClone(mission.initial || []); }
  const draft = record(savedDraft);
  const matching = draft.programKey === JSON.stringify(program);
  const result = matching && draft.hasRun === true ? traceProgram(mission, program) : null;
  const cursor = result ? Math.max(0, Math.min(result.trace.length, Number.isInteger(draft.cursor) ? draft.cursor : 0)) : 0;
  let beforeClear = null;
  if (draft.beforeClear && Array.isArray(draft.beforeClear.program)) {
    try {
      traceProgram(mission, draft.beforeClear.program);
      beforeClear = structuredClone(draft.beforeClear);
    } catch { /* Ignore an invalid undo snapshot without dropping current work. */ }
  }
  return {
    program, result, cursor,
    position: cursor ? [...result.trace[cursor - 1].position] : [...mission.start],
    prediction: text(draft.prediction, 8),
    predictionSkipped: draft.predictionSkipped === true,
    reflection: text(draft.reflection), aiReflection: text(draft.aiReflection, 1000),
    forecast: result && draft.forecast ? {
      value: Number.isInteger(draft.forecast.value) && draft.forecast.value > 0 && draft.forecast.value <= 192 ? draft.forecast.value : null,
      unsure: draft.forecast.unsure === true
    } : null,
    message: result && cursor < result.trace.length ? 'Орындау кідіртілді. «Орындау» батырмасымен жалғастыр.' : text(draft.message, 500),
    messageKind: result && cursor < result.trace.length ? 'info' : ['info', 'error', 'success'].includes(draft.messageKind) ? draft.messageKind : 'info',
    beforeClear
  };
}

export const rubricCriteria = [
  {title: 'Мәселені талдау', evidence: 'Мақсатты, кедергіні және жол бөліктерін атайды.'},
  {title: 'Алгоритмді құру', evidence: 'Командаларды реттейді; тапсырмаға сай циклді не шартты түсіндіреді.'},
  {title: 'Болжам және тексеру', evidence: 'Болжамын нақты қадаммен салыстырады, қате болса түзетеді.'},
  {title: 'Шешімін дәлелдеу', evidence: 'Неліктен осы жолды таңдағанын және не өзгерткенін түсіндіреді.'}
];

export function rubricTotal(scores) {
  return Array.isArray(scores) && scores.length === rubricCriteria.length && scores.every(score => [0, 1, 2].includes(score))
    ? scores.reduce((sum, score) => sum + score, 0) : null;
}
