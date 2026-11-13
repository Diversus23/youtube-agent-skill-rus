import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {load, parseTs, norm, mergedDuration, analyze} from '../skills/yt-edit/deadair.mjs';
import {keywords, mmss, build} from '../skills/yt-chapters/chapters.mjs';

function fixture(t, name, content) {
  const dir = mkdtempSync(join(tmpdir(), 'yt-transcripts-'));
  t.after(() => rmSync(dir, {recursive: true, force: true}));
  const path = join(dir, name);
  writeFileSync(path, content, 'utf8');
  return path;
}
function cli(skill, script, ...args) {
  return spawnSync(process.execPath, [fileURLToPath(new URL(`../skills/${skill}/${script}.mjs`, import.meta.url)), ...args.map(String)], {encoding: 'utf8'});
}
test('Russian words and chapter keywords normalize ё', () => {
  assert.deepEqual(norm('Ёлка и YouTube 2026'), ['елка', 'и', 'youtube', '2026']);
  assert.deepEqual(keywords('Съёмка монтаж монтаж это'), new Set(['съемка', 'монтаж']));
  assert.equal(mmss(3661.9), '1:01:01');
});
test('transcript arrays and segment objects support BOM and Russian paths', t => {
  for (const data of [[{start: 0, end: 2, text: 'Привет'}], {segments: [{start: 0, end: 2, text: 'Привет'}]}]) {
    assert.deepEqual(load(fixture(t, 'речь.json', '\ufeff' + JSON.stringify(data))), [[0, 2, 'Привет']]);
  }
});
test('SRT and VTT preserve numeric speech and decode entities', t => {
  for (const [suffix, text] of [
    ['srt', '1\n00:00:00,000 --> 00:00:02,500\n2026\n\n2\n00:00:03,000 --> 00:00:05,000\nСвет\n'],
    ['vtt', 'WEBVTT\n\nNOTE ignore\nmetadata\n\n00:00.000 --> 00:02.500 align:start\n<b>2026</b>\n\n00:03.000 --> 00:05.000\nСвет\n'],
  ]) assert.deepEqual(load(fixture(t, `input.${suffix}`, '\ufeff' + text)), [[0, 2.5, '2026'], [3, 5, 'Свет']]);
  assert.deepEqual(load(fixture(t, 'entities.vtt', 'WEBVTT\n\n00:00.000 --> 00:02.000\n&lt;Свет&gt; &amp; &#34;звук&#x22; &nbsp; &mdash;')), [[0, 2, '<Свет> & "звук" \u00a0 —']]);
});
test('CR-only subtitle files preserve every cue and the true duration',t=>{
  const path=fixture(t,'old.vtt','WEBVTT\r\r00:00.000 --> 00:02.000\rПервая речь\r\r00:08.000 --> 00:10.000\rПоследняя речь\r');
  const cues=load(path);
  assert.deepEqual(cues,[[0,2,'Первая речь'],[8,10,'Последняя речь']]);
  const result=cli('yt-edit','deadair',path,'--json');
  assert.equal(result.status,0,result.stderr);
  const report=JSON.parse(result.stdout);
  assert.equal(report.duration,10);
  assert.equal(report.cuts[0].kind,'DEAD');
  assert.equal(report.removed,5.55);
});
test('Russian retakes skip filler and merge removal intervals', t => {
  const path = fixture(t, 'речь.json', JSON.stringify({segments: [
    {start: 0, end: 2, text: 'Сейчас покажу как настроить свет'},
    {start: 2, end: 3, text: 'Э-э-э...'},
    {start: 3, end: 6, text: 'Сейчас покажу как настроить свет правильно'},
  ]}));
  const result = cli('yt-edit', 'deadair', path, '--json');
  assert.equal(result.status, 0, result.stderr);
  const out = JSON.parse(result.stdout);
  assert.deepEqual(new Set(out.cuts.map(c => c.kind)), new Set(['FILLER', 'REPEAT']));
  assert.equal(out.removed, 3);
  assert.equal(mergedDuration([{start: 0, end: 3}, {start: 2, end: 4}]), 4);
});
test('semantic words remain and overlapping speech does not create dead air', () => {
  assert.deepEqual(analyze([[0, 1, 'Да'], [1, 2, 'Ну, значит так']]).cuts, []);
  assert.equal(analyze([[0, 5, 'Первая речь'], [1, 2, 'Другая речь'], [4, 6, 'Третья речь']]).cuts.some(c => c.kind === 'DEAD'), false);
  const out = analyze([[0, 1, 'Начало'], [3, 4, 'Конец']]);
  assert.equal(out.removed, 1.55);
  assert.equal(out.out, 2.45);
});
test('bad JSON transcripts fail readably without reports', t => {
  for (const content of ['{}', '[null]', '[{"start":2,"end":1}]', '[{"start":0,"end":NaN}]']) {
    const result = cli('yt-edit', 'deadair', fixture(t, 'bad.json', content), '--json');
    assert.equal(result.status, 2);
    assert.doesNotMatch(result.stderr, /Traceback|at .*\.mjs:/);
    assert.equal(result.stdout.trim(), '');
  }
});
test('malformed timed or untimed blocks never become silence', t => {
  for (const block of ['2\n00:0X:02,000 --> 00:00:08,000\nВажная речь', '2\nВажная речь']) {
    const path = fixture(t, 'broken.srt', `1\n00:00:00,000 --> 00:00:02,000\nНачало\n\n${block}\n\n3\n00:00:08,000 --> 00:00:10,000\nКонец\n`);
    assert.throws(() => load(path));
    const result = cli('yt-edit', 'deadair', path, '--json');
    assert.equal(result.status, 2);
    assert.equal(result.stdout.trim(), '');
  }
  for (const timestamp of ['00:60.0', '00:60:00', 'nan', '1:02']) assert.throws(() => parseTs(timestamp));
});
test('chapter CLI reports valid and insufficient chapter sets', t => {
  const path = fixture(t, 'transcript.json', JSON.stringify([[0, 'Монтаж видео'], [10.9, 'Свет лампы'], [20.8, 'Запись звука']].map(([start, text]) => ({start, end: start + 5, text}))));
  const result = cli('yt-chapters', 'chapters', path, '--duration', 35, '--target', 3, '--json');
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(result.stdout);
  assert.equal(data.valid, true);
  assert.equal(data.chapters[0].label, '00:00');
  assert.ok(data.chapters.every(c => c.seconds >= 10));
  const bad = cli('yt-chapters', 'chapters', path, '--json');
  assert.equal(bad.status, 1);
  assert.equal(JSON.parse(bad.stdout).valid, false);
});
test('chapters find a feasible sequence before maximizing boundary quality', () => {
  const result = build([[0, 9, 'Вступление'], [10, 11, 'Освещение'], [15, 19, 'Освещение'], [20, 30, 'Аудиозапись']], 3, 30);
  assert.equal(result.valid, true);
  assert.deepEqual(result.chapters.map(row => row.start), [0, 10, 20]);
});
test('CLI numeric options reject nonfinite values and invalid chapter targets', t => {
  const path = fixture(t, 'speech.json', '[{"start":0,"end":20,"text":"Речь"}]');
  for (const floor of ['0', '-1', 'NaN', 'Infinity', '1oops']) assert.equal(cli('yt-edit', 'deadair', path, '--floor', floor).status, 2);
  for (const target of ['2', '3.5', 'NaN']) assert.equal(cli('yt-chapters', 'chapters', path, '--target', target).status, 2);
  for (const duration of ['19', 'NaN', 'Infinity']) assert.equal(cli('yt-chapters', 'chapters', path, '--duration', duration).status, 2);
});
