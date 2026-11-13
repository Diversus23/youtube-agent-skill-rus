#!/usr/bin/env node
// Черновые главы по паузам и смене словаря; названия нужно отредактировать.
import {load} from '../yt-edit/deadair.mjs';
import {parseCli, runCli, finiteNumber, round} from '../yt-script/runtime.mjs';

const STOP = new Set('the this that with from your have just about into then there what which when where why это этот этой этого эти здесь там так как что чтобы который которая которые потому поэтому сейчас очень просто можно нужно будет были было есть меня тебя себя вами нами они она оно для или если уже еще только также вот'.split(' '));
const terms = text => text.toLowerCase().replaceAll('ё', 'е').match(/[a-zа-я]{4,}/g) ?? [];
export function keywords(text) { return new Set(terms(text).filter(word => !STOP.has(word))); }
export function mmss(value) {
  const total = Math.trunc(value), hours = Math.floor(total / 3600), minutes = Math.floor((total % 3600) / 60), seconds = total % 60;
  return `${hours ? `${hours}:` : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
function bisectRight(values, value, hi) {
  let lo = 0;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (value < values[mid]) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
export function build(cues, target = 7, duration = null) {
  duration ??= Math.max(...cues.map(c => c[1]));
  const weights = new Map();
  for (let i = 1; i < cues.length; i++) {
    const before = keywords(cues.slice(Math.max(0, i - 12), i).map(c => c[2]).join(' '));
    const after = keywords(cues.slice(i, i + 12).map(c => c[2]).join(' '));
    const union = new Set([...before, ...after]);
    const intersection = [...before].filter(word => after.has(word));
    const shift = union.size ? 1 - intersection.length / union.size : 0;
    const gap = Math.max(0, cues[i][0] - cues[i - 1][1]);
    const weight = gap * 1.6 + shift * 3.2, start = Math.trunc(cues[i][0]);
    if (start >= 10 && duration - start >= 10) weights.set(start, Math.max(weight, weights.get(start) ?? -Infinity));
  }
  // Reach the requested count when feasible, then maximize boundary quality.
  const starts = [...weights.keys()].sort((a, b) => a - b);
  let previous = starts.map(() => [0, []]), picked = [0];
  for (let count = 1; count <= Math.min(target - 1, starts.length); count++) {
    const current = [];
    for (const [i, start] of starts.entries()) {
      const j = bisectRight(starts, start - 10, i) - 1;
      const prefix = count === 1 ? [0, []] : j >= 0 ? previous[j] : null;
      const take = prefix ? [prefix[0] + weights.get(start), [...prefix[1], start]] : null;
      const skip = current.at(-1) ?? null;
      current.push(take && (!skip || take[0] > skip[0]) ? take : skip);
    }
    if (!current.at(-1)) break;
    picked = [0, ...current.at(-1)[1]];
    previous = current;
  }
  const chapters = picked.map((start, i) => {
    const end = picked[i + 1] ?? duration;
    const text = cues.filter(c => start <= c[0] && c[0] < end).map(c => c[2]).join(' ');
    const counts = new Map();
    for (const word of terms(text)) counts.set(word, (counts.get(word) ?? 0) + 1);
    const sorted = [...keywords(text)].sort((a, b) => counts.get(b) - counts.get(a) || (a < b ? -1 : a > b ? 1 : 0));
    const title = sorted.slice(0, 3).join(' ');
    return {start, label: mmss(start), draft_title: title ? title[0].toUpperCase() + title.slice(1) : 'Раздел', seconds: round(end - start, 3)};
  });
  return {valid: chapters.length >= 3 && chapters.every(c => c.seconds >= 10), duration, chapters};
}
function main() {
  const args = parseCli({target: {type: 'string', default: '7'}, duration: {type: 'string'}, json: {type: 'boolean'}}, 'Использование: node chapters.mjs файл [--target 7] [--duration секунды] [--json]\nЧерновые главы по паузам и смене словаря; названия нужно отредактировать.');
  if (!args) return;
  if (args.positionals.length !== 1) throw new Error('Укажите один файл SRT, VTT или Whisper JSON.');
  const cues = load(args.positionals[0]);
  if (!cues.length) throw new Error('Нет сегментов расшифровки.');
  if (!/^[+-]?\d+$/.test(args.values.target.trim())) throw new Error('--target должен быть целым числом.');
  const target = finiteNumber(args.values.target, '--target');
  if (!Number.isSafeInteger(target) || target < 3) throw new Error('--target должен быть целым числом не меньше 3.');
  const duration = args.values.duration === undefined ? null : finiteNumber(args.values.duration, '--duration');
  if (duration !== null && duration < Math.max(...cues.map(c => c[1]))) throw new Error('--duration должен быть конечным числом не меньше конца расшифровки.');
  const result = build(cues, target, duration);
  if (args.values.json) console.log(JSON.stringify(result, null, 2));
  else {
    for (const chapter of result.chapters) console.log(`${chapter.label} ${chapter.draft_title}`);
    console.log('\nПерепишите черновые названия и проверьте границы по видео.');
    if (!result.valid) console.log('Недостаточно глав: нужно минимум 3, начало 00:00 и длина каждой от 10 секунд.');
  }
  return result.valid ? 0 : 1;
}
runCli(import.meta.url, main);
