// Synthetic cases, not measurements from a real channel.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, writeFileSync, rmSync, symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {words, compilePattern, finiteNumber, round, readUtf8} from '../skills/yt-script/runtime.mjs';
import * as hooks from '../skills/yt-script/hookscore.mjs';
import {check} from '../skills/yt-package/title.mjs';
import {rank} from '../skills/yt-viral/swipe.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
function cli(skill, script, ...args) {
  return spawnSync(process.execPath, [join(root, 'skills', skill, script), ...args.map(String)], {encoding: 'utf8'});
}
function fixture(t, name, text) {
  const dir = mkdtempSync(join(tmpdir(), 'yt-node-'));
  t.after(() => rmSync(dir, {recursive: true, force: true}));
  const path = join(dir, name);
  writeFileSync(path, text, 'utf8');
  return path;
}

test('Cyrillic, yo/e and mixed names are tokenized', () => {
  assert.deepEqual(words('Ёлка и YouTube 2026'), ['елка', 'и', 'youtube', '2026']);
  assert.ok(hooks.address('Почему вы теряете время?') > hooks.address('Рассказ про монтаж'));
  assert.ok(hooks.curiosity('Почему никто не смотрит?') > hooks.curiosity('Обзор монтажа'));
});
test('Unicode boundaries match whole Russian words, not ASCII fragments', () => {
  const pattern = compilePattern(String.raw`\bвы\b`);
  assert.ok(pattern.test('Это вы?'));
  assert.ok(!pattern.test('выход'));
  assert.ok(!pattern.test('вы_тут'));
  assert.ok(compilePattern(String.raw`\bошиб\w*\b`).test('ошибками'));
});
test('all 21 formula patterns compile and classify Russian examples', () => {
  assert.equal(hooks.FORMULAS.length, 21);
  assert.equal(new Set(hooks.FORMULAS.map(f => f.id)).size, 21);
  for (const f of hooks.FORMULAS) for (const pattern of f.match) compilePattern(pattern);
  assert.equal(hooks.classify('Если вы снимаете дома вечером, начните со света.')[0], 'The Direct Address');
  assert.ok(hooks.classify('Я попробовал новый способ монтажа')[1] > 0);
});
test('rounding uses ties to even and numeric options reject coercion', () => {
  assert.equal(round(2.5), 2);
  assert.equal(round(3.5), 4);
  assert.equal(round(-2.5), -2);
  assert.equal(finiteNumber('1.25', 'option'), 1.25);
  for (const value of ['', ' ', 'NaN', 'Infinity', '0x10', null, true]) {
    assert.throws(() => finiteNumber(value, 'option'));
  }
});
test('UTF-8 BOM hook file and JSON output preserve Cyrillic', t => {
  const path = fixture(t, 'хуки.txt', '\ufeffПочему вы теряете время на монтаж?\n');
  assert.equal(readUtf8(path), 'Почему вы теряете время на монтаж?\n');
  const result = cli('yt-script', 'hookscore.mjs', path, '--json');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout)[0].hook, 'Почему вы теряете время на монтаж?');
});
test('CR-only hook and title files retain separate entries', t => {
  const path=fixture(t,'lines.txt','Почему важен свет?\rКак записать звук?\r');
  for(const [skill,script] of [['yt-script','hookscore.mjs'],['yt-package','title.mjs']]) {
    const result=cli(skill,script,path,'--json');
    assert.equal(result.status,0,result.stderr);
    assert.equal(JSON.parse(result.stdout).length,2);
  }
});
test('Russian title duplicate and four thumbnail words are flagged', () => {
  const codes = new Set(check('Ёлка своими руками', 'Елка за один вечер').issues.map(x => x[0]));
  assert.ok(codes.has('duplicate'));
  assert.ok(codes.has('thumb-length'));
  assert.ok(!codes.has('front-load'));
});
test('title length counts Unicode codepoints instead of UTF-16 units', () => {
  assert.equal(check('Видео 🎬').chars, 7);
});
test('title CLI and empty arguments', () => {
  const result = cli('yt-package', 'title.mjs', '--title', 'Монтаж в DaVinci Resolve', '--thumb', 'БЕЗ СЛОЖНОСТЕЙ', '--json');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout)[0].title, 'Монтаж в DaVinci Resolve');
  for (const [skill, script, flag] of [['yt-package','title.mjs','--title'], ['yt-script','hookscore.mjs','--hook']]) {
    for (const args of [[flag, ''], [flag], ['--unknown'], []]) {
      const bad = cli(skill, script, ...args);
      assert.equal(bad.status, 2, `${script} ${args}: ${bad.stderr}`);
      assert.doesNotMatch(bad.stderr, /at file:|node:internal/);
    }
  }
});
test('swipe CLI ranks by per-channel median and reads BOM', t => {
  const rows = [100,100,100,500].map((views,i) => ({channel:'Канал', title:`Видео ${i}`, views, url:`https://example.com/${i}`}));
  const path = fixture(t, 'подборка.json', '\ufeff'+JSON.stringify(rows));
  const result = cli('yt-viral','swipe.mjs',path,'--min','2','--json');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).outliers[0].multiple, 5);
  assert.deepEqual(rank(rows.slice(0,2)).skipped_thin_channels, [['Канал',2]]);
  assert.deepEqual(rank(rows.map(r=>({...r,views:0}))).skipped_zero_median, ['Канал']);
  assert.throws(()=>rank([...rows,rows[0]]));
});
test('swipe rejects missing, boolean, fractional and nonfinite counts', () => {
  for (const views of [undefined,null,true,-1,NaN,Infinity,'1,2 млн',1.2,Number.MAX_SAFE_INTEGER+1]) {
    assert.throws(()=>rank([{channel:'Канал',title:'Видео',views}]));
  }
});
test('help works without input; invalid input has a concise error', t => {
  const path = fixture(t,'bad.json','{not json}');
  const bad = cli('yt-viral','swipe.mjs',path,'--json');
  assert.equal(bad.status,2);
  assert.doesNotMatch(bad.stderr,/at file:|node:internal/);
  for (const [skill,script] of [['yt-script','hookscore.mjs'],['yt-package','title.mjs'],['yt-viral','swipe.mjs']]) {
    const help=cli(skill,script,'--help');
    assert.equal(help.status,0,help.stderr);
    assert.match(help.stdout,/--json/);
  }
});

test('CLI runs through a linked skill directory used by installers', t => {
  const dir=mkdtempSync(join(tmpdir(),'yt-linked-'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const linked=join(dir,'yt-script');
  symlinkSync(join(root,'skills','yt-script'),linked,process.platform==='win32'?'junction':'dir');
  const result=spawnSync(process.execPath,[join(linked,'hookscore.mjs'),'--hook','Почему вы теряете время?','--json'],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  assert.ok(result.stdout.trim(), 'Linked executable must not silently skip main');
  assert.equal(JSON.parse(result.stdout)[0].hook,'Почему вы теряете время?');
});
