#!/usr/bin/env node
import {readUtf8, words, compilePattern, round, parseCli, runCli} from './runtime.mjs';
export {words} from './runtime.mjs';

export const FORMULAS = JSON.parse(readUtf8(new URL('./hooks.json', import.meta.url))).hooks;
const formulas = FORMULAS.map(f => ({...f, patterns: f.match.map(p => compilePattern(p))}));
const FILLER = new Set('basically actually literally really very guys hey welcome subscribe привет ребята короче собственно буквально вообще подписывайтесь'.split(' '));
const VAGUE = new Set('amazing incredible insane ultimate revolutionary невероятный невероятная невероятное потрясающий потрясающая лучший лучшая лучшие революционный секретный'.split(' '));
const CONCRETE = /\d+(?:[.,]\d+)?(?:\s?[%₽$])?/giu;
const YOU = compilePattern(String.raw`\b(you|your|ты|вы|тебе|тебя|вам|вас|твой|твоя|твои|ваш|ваша|ваши)\b`, 'giu');
const STAKE = compilePattern(String.raw`\b(lose|lost|waste|risk|stop|теря\w*|потер\w*|ошиб\w*|риск\w*|трат\w*|провал\w*|перестан\w*)\b`, 'giu');
const CURIOSITY = compilePattern(String.raw`\b(why|how|what|but|почему|как|что|какой|какая|какие|но|никто|почти|кроме|причина)\b`, 'giu');
const CLOSED = compilePattern(String.raw`\b(because|потому что|поэтому)\b`);
const count = (pattern, text) => [...text.matchAll(new RegExp(pattern.source, pattern.flags))].length;
const clamp = value => Math.max(0, Math.min(100, value));

export function specificity(text) {
  const tokens = words(text);
  if (!tokens.length) return 0;
  return clamp(34 + 22 * count(CONCRETE,text) - 16 * tokens.filter(w=>VAGUE.has(w)).length - 5 * tokens.filter(w=>FILLER.has(w)).length);
}
export function address(text) {
  return clamp(26 + 20 * count(YOU,text) + (count(YOU,text.trim().split(/\s+/u).slice(0,6).join(' ')) ? 30 : 0));
}
export function stakes(text) {
  return clamp(22 + 26 * count(STAKE,text) + (count(CONCRETE,text) ? 14 : 0));
}
export function curiosity(text) {
  return clamp(24 + 17 * count(CURIOSITY,text) + (text.trimEnd().endsWith('?') ? 18 : 0) - (CLOSED.test(text) ? 18 : 0));
}
export function brevity(text) {
  const n = words(text).length;
  if (!n) return 0;
  if (n >= 9 && n <= 24) return 100;
  return n < 9 ? Math.max(30, 100 - (9-n)*11) : Math.max(10,100-(n-24)*7);
}
const PROPS = {SPECIFICITY:specificity, ADDRESS:address, STAKES:stakes, CURIOSITY:curiosity, BREVITY:brevity};
const LABELS = {SPECIFICITY:'Конкретика', ADDRESS:'Обращение', STAKES:'Ставки', CURIOSITY:'Интрига', BREVITY:'Краткость'};
export function classify(text) {
  let name = 'Не определена', hits = 0;
  for (const formula of formulas) {
    const n = formula.patterns.filter(p=>p.test(text)).length;
    if (n > hits) {name = formula.name; hits = n;}
  }
  return [name, hits];
}
export function score(text) {
  const parts = Object.fromEntries(Object.entries(PROPS).map(([name, fn])=>[name,fn(text)]));
  const values = Object.values(parts);
  const verdict = words(text).length ? round(.6 * values.reduce((a,b)=>a+b,0)/values.length + .4*Math.min(...values)) : 0;
  return [parts,verdict,...classify(text)];
}
export const band = value => value >= 72 ? 'STRONG' : value >= 55 ? 'WORKABLE' : 'WEAK';

export function main() {
  const args = parseCli({hook:{type:'string'}}, 'Эвристическая проверка начала видео, не прогноз просмотров.\nnode hookscore.mjs [hooks.txt | --hook "текст"] [--json]');
  if (!args) return;
  const {values,positionals} = args;
  if (positionals.length > 1 || (positionals.length === 1) === (values.hook !== undefined)) throw new Error('Укажите либо файл, либо --hook.');
  const lines = (values.hook !== undefined ? [values.hook] : readUtf8(positionals[0]).split(/\r?\n/u)).map(l=>l.trim()).filter(Boolean);
  if (!lines.length || lines.some(l=>!words(l).length)) throw new Error('Нужен непустой текст с буквами или цифрами.');
  const rows = lines.map(hook=> {
    const [properties,verdict,formula] = score(hook);
    return {hook,properties,verdict,band:band(verdict),formula};
  }).sort((a,b)=>b.verdict-a.verdict);
  if (values.json) console.log(JSON.stringify(rows,null,2));
  else {
    console.log('Эвристика, не прогноз просмотров. Русская версия не калибрована на результатах каналов.');
    for (const row of rows) {
      console.log(`\n${row.hook}\nОценка: ${row.verdict}/100; формула: ${row.formula}`);
      for (const [key,value] of Object.entries(row.properties)) console.log(`  ${LABELS[key]}: ${value}`);
    }
  }
}
runCli(import.meta.url, main);
