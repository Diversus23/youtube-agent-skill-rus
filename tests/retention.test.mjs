import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { number, loadCsv, analyze } from '../skills/yt-retention/retention.mjs';

function fixture(run) {
  const dir = mkdtempSync(join(tmpdir(), 'yt-retention-'));
  try { run(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
}
const script = fileURLToPath(new URL('../skills/yt-retention/retention.mjs', import.meta.url));
const cli = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });

test('localized CSV supports BOM, delimiters, quotes and escaped quotes', () => fixture(dir => {
  const path = join(dir, 'удержание.csv');
  for (const content of [
    '\uFEFFСекунды;Удержание\r\n0;100,0%\r\n10;85,5%\r\n',
    '"Время, секунды","Удержание ""зрителей"""\n"0","100,0%"\n"10","85,5%"',
    'Время\tУдержание\n0\t100\n10\t85.5',
    '"Время\nв секундах";"Удержание (%)"\n0;100\n10;85.5',
  ]) {
    writeFileSync(path, content);
    assert.deepEqual(loadCsv(path), [[0, 100], [10, 85.5]]);
  }
  assert.equal(number('1\u202f234,5%'), 1234.5);
  for (const value of ['nan', 'Infinity', '1,234.5', '', '0x10', '10%%']) assert.throws(() => number(value));
}));

test('percentage headers may start with punctuation', () => fixture(dir => {
  const path = join(dir, 'percent.csv');
  for (const header of ['"% video","% retained"', '% видео;% зрителей']) {
    const separator = header.includes(';') ? ';' : ',';
    writeFileSync(path, `${header}\n0${separator}100\n50${separator}90\n100${separator}80\n`);
    assert.deepEqual(loadCsv(path), [[0, 100], [50, 90], [100, 80]]);
    const result = cli(path, '--axis', 'percent', '--json');
    assert.equal(result.status, 0, result.stderr);
  }
}));

test('invalid CSV is rejected without silently skipping data', () => fixture(dir => {
  const path = join(dir, 'r.csv');
  for (const content of ['0,100\n10,nan\n20,80', '0,100\n0,90', '0,100\n-1,90',
    'time,retention\n0,100\n10,oops\n20,80', 'a,b,c\n0,100,1\n10,80,2',
    '0,100\n10,"80', '0,100\n10,"80"junk', '0,100\n1"0,80', 'NaN,NaN\n0,100\n10,90']) {
    writeFileSync(path, content);
    assert.throws(() => loadCsv(path, ','), content);
  }
}));

test('retention uses percentage points, interpolation and interval weighted slope', () => {
  const rows = [[0, 100], [20, 90], [40, 70], [100, 60]];
  const seconds = analyze(rows, 'seconds');
  assert.equal(seconds.hook_leak, 20);
  assert.equal(seconds.slide_per_unit, 0.285714);
  assert.equal(seconds.units, 'percentage_points_per_second');
  assert.equal(analyze(rows, 'percent', 100).hook_leak, 20);
  const unknown = analyze(rows, 'percent');
  assert.equal(unknown.hook_leak, null);
  assert.equal(unknown.slide_per_unit, null);
  assert.ok(unknown.cliffs.every(c => c.at_seconds === null && c.to_seconds === null));
  assert.equal(analyze([[0, 110], [20, 90]], 'seconds').hook_leak, null);
  assert.equal(analyze([[10, 110], [40, 90]], 'seconds').hook_leak, null);
  assert.equal(analyze([[0, 0], [30, 10]], 'seconds').start, 0);
  for (const duration of [0, -1, Infinity, NaN]) assert.throws(() => analyze(rows, 'seconds', duration));
  assert.throws(() => analyze(rows, 'seconds', 90));
  assert.throws(() => analyze([[0, 100], [101, 90]], 'percent'));
});

test('retention CLI requires explicit axis and produces readable errors', () => fixture(dir => {
  const path = join(dir, 'r.csv');
  writeFileSync(path, 'time,value\n0,100\n40,60\n80,20');
  for (const args of [[], ['--axis', 'unknown'], ['--axis', 'seconds', '--duration', 'NaN']]) {
    const result = cli(path, ...args, '--json');
    assert.equal(result.status, 2);
    assert.doesNotMatch(result.stderr, /\n\s+at /);
  }
  const good = cli(path, '--axis', 'seconds', '--json');
  assert.equal(good.status, 0, good.stderr);
  assert.equal(JSON.parse(good.stdout).hook_leak, 30);
}));

test('retention transcript matches entire drop interval', () => fixture(dir => {
  const csv = join(dir, 'r.csv'), transcript = join(dir, 'tr.json');
  writeFileSync(csv, '0;100\n20;90\n40;60\n60;55');
  writeFileSync(transcript, JSON.stringify([{ start: 25, end: 35, text: 'Объяснение задачи' }]));
  const result = cli(csv, '--axis', 'seconds', '--transcript', transcript, '--json');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).cliffs[0].said, 'Объяснение задачи');
  const unknown = cli(csv, '--axis', 'percent', '--transcript', transcript, '--json');
  assert.equal(unknown.status, 0, unknown.stderr);
  assert.ok(JSON.parse(unknown.stdout).cliffs.every(c => c.said === ''));
}));
