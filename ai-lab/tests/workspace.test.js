import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeWorkspace, restoreMission, rubricTotal} from '../workspace.js';
import {missions} from '../engine.js';

test('Existing completions and diagnostics survive additive workspace migration', () => {
  const old = {completed: {first: {steps: 4}}, programs: {first: []}, diagnostics: {final: {score: 3, at: '2026-11-24'}}};
  const next = normalizeWorkspace(old);
  assert.deepEqual(next.completed, old.completed);
  assert.deepEqual(next.programs, old.programs);
  assert.equal(next.diagnosticHistory[0].variant, 'A-v1');
  assert.equal(next.diagnosticHistory[0].type, 'final');
  assert.deepEqual(normalizeWorkspace(next).diagnosticHistory, next.diagnosticHistory);
  assert.deepEqual(normalizeWorkspace(null).drafts, {});
});

test('Returning to a mission restores prediction, explanation and paused execution', () => {
  const program = [{type: 'repeat', dir: 'E', count: 4}];
  const draft = {programKey: JSON.stringify(program), hasRun: true, cursor: 2,
    prediction: '5', reflection: 'Алдымен оңға жүрдім.', aiReflection: 'Сұрақтан кейін жолды санадым.', forecast: {value: 5, unsure: false}, message: 'Алгоритм орындалып жатыр…'};
  const restored = restoreMission(missions[0], program, draft);
  assert.equal(restored.prediction, '5');
  assert.equal(restored.reflection, draft.reflection);
  assert.equal(restored.aiReflection, draft.aiReflection);
  assert.deepEqual(restored.position, [2, 4]);
  assert.equal(restored.cursor, 2);
  assert.equal(restored.forecast.value, 5);
  assert.match(restored.message, /кідіртілді/);
});

test('Execution state from a different program cannot be restored as a completed run', () => {
  const restored = restoreMission(missions[0], [], {programKey: '[old program]', hasRun: true, cursor: 200, prediction: '4'});
  assert.equal(restored.result, null);
  assert.equal(restored.cursor, 0);
  assert.equal(restored.prediction, '4');
  assert.deepEqual(restored.position, missions[0].start);
});

test('A cleared program retains a valid undo snapshot through refresh', () => {
  const program = [{type: 'move', dir: 'E'}];
  const draft = {programKey: '[]', beforeClear: {program, draft: {prediction: '4', reflection: 'Менің шешімім сақталды.'}}};
  const cleared = restoreMission(missions[0], [], draft);
  const undo = restoreMission(missions[0], cleared.beforeClear.program, cleared.beforeClear.draft);
  assert.deepEqual(undo.program, program);
  assert.equal(undo.prediction, '4');
  assert.equal(undo.reflection, 'Менің шешімім сақталды.');
});

test('Invalid stored commands do not break a mission and incomplete rubric is not zero', () => {
  const restored = restoreMission(missions[0], [{type: 'bad'}], {beforeClear: {program: [{type: 'bad'}]}});
  assert.deepEqual(restored.program, []);
  assert.equal(restored.beforeClear, null);
  assert.equal(rubricTotal([null, null, null, null]), null);
  assert.equal(rubricTotal([0, 1, 2, 2]), 5);
});
