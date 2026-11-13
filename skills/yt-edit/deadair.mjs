#!/usr/bin/env node
// Кандидаты на сокращение по SRT/VTT/Whisper JSON. Не изменяет видео.
import {extname} from 'node:path';
import {readUtf8, parseCli, runCli, finiteNumber, round, words} from '../yt-script/runtime.mjs';

export const FILLER_ONLY = /^[\s,.!?…—-]*(?:(?:[эе]-?)+|[аa]-?[аa]+|[мm]-?[мm]+|um+|uh+)[\s,.!?…—-]*$/iu;

export function parseTs(value) {
  const text = value.trim();
  if (!/^(?:\d+:)?\d{2}:\d{2}(?:[.,]\d+)?$/.test(text)) throw new Error(`Неверный таймкод: ${value}`);
  const numbers = text.replace(',', '.').split(':').map(Number);
  if (numbers.some(n => !Number.isFinite(n) || n < 0) || numbers.at(-1) >= 60 || (numbers.length === 3 && numbers.at(-2) >= 60)) throw new Error(`Неверный таймкод: ${value}`);
  return numbers.reduce((total, n) => total * 60 + n, 0);
}

const ENTITIES = {amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0', lrm: '\u200e', rlm: '\u200f', ndash: '–', mdash: '—', hellip: '…', laquo: '«', raquo: '»', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', bull: '•', copy: '©', reg: '®', trade: '™', euro: '€', pound: '£', yen: '¥', cent: '¢'};
const WINDOWS_1252 = {128: 8364, 130: 8218, 131: 402, 132: 8222, 133: 8230, 134: 8224, 135: 8225, 136: 710, 137: 8240, 138: 352, 139: 8249, 140: 338, 142: 381, 145: 8216, 146: 8217, 147: 8220, 148: 8221, 149: 8226, 150: 8211, 151: 8212, 152: 732, 153: 8482, 154: 353, 155: 8250, 156: 339, 158: 382, 159: 376};
function unescapeHtml(text) {
  return text.replace(/&(#(?:x[0-9a-f]+|\d+);?|[a-z][a-z0-9]+;)/gi, (entity, name) => {
    if (!name.startsWith('#')) return ENTITIES[name.slice(0, -1)] ?? entity;
    let cp = name[1].toLowerCase() === 'x' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
    cp = WINDOWS_1252[cp] ?? cp;
    if (cp === 0 || cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff)) return '\ufffd';
    if ((cp >= 1 && cp <= 8) || cp === 11 || (cp >= 14 && cp <= 31) || cp === 127 || (cp >= 0xfdd0 && cp <= 0xfdef) || (cp & 0xffff) >= 0xfffe) return '';
    return String.fromCodePoint(cp);
  });
}

export function load(path) {
  const raw = readUtf8(path);
  let cues;
  if (extname(String(path)).toLowerCase() === '.json') {
    let data;
    try { data = JSON.parse(raw); } catch { throw new Error('Некорректный JSON расшифровки.'); }
    const segments = Array.isArray(data) ? data : data?.segments;
    if (!Array.isArray(segments)) throw new Error('JSON должен содержать массив сегментов или объект с массивом segments.');
    cues = segments.map(segment => {
      if (!segment || typeof segment !== 'object' || !('start' in segment) || !('end' in segment)) throw new Error('Сегмент JSON должен содержать start, end и текст text.');
      return [finiteNumber(segment.start, 'start'), finiteNumber(segment.end, 'end'), String(segment.text || '').trim()];
    });
  } else {
    cues = [];
    for (const [index, block] of raw.trim().split(/\r?\n\s*\r?\n/).entries()) {
      const lines = block.split(/\r\n|[\n\r]/);
      if (/^(?:NOTE|STYLE|REGION)/.test(lines[0])) continue;
      let parsed = false;
      for (let i = 0; i < lines.length; i++) {
        if (!lines[i].includes('-->')) continue;
        const match = /^\s*(\S+)\s+-->\s+(\S+)(?:\s+.*)?$/.exec(lines[i]);
        if (!match) throw new Error(`Блок ${index + 1}: неверная строка таймкодов.`);
        const text = unescapeHtml(lines.slice(i + 1).join(' ').replace(/<[^>]+>/g, '')).trim();
        cues.push([parseTs(match[1]), parseTs(match[2]), text]);
        parsed = true;
        break;
      }
      if (!parsed && block.trim() && !lines[0].startsWith('WEBVTT')) throw new Error(`Блок ${index + 1}: нет корректных таймкодов; нельзя считать этот фрагмент тишиной.`);
    }
  }
  let previous = -1;
  for (const [start, end] of cues) {
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start || start < previous) throw new Error('Сегменты должны идти по времени и иметь конечные значения 0 <= start < end.');
    previous = start;
  }
  return cues;
}

export const norm = words;

export function mergedDuration(cuts) {
  let total = 0, last = 0;
  for (const cut of [...cuts].sort((a, b) => a.start - b.start)) {
    total += Math.max(0, cut.end - Math.max(last, cut.start));
    last = Math.max(last, cut.end);
  }
  return total;
}

export function analyze(cues, floor = 0.45) {
  const cuts = [];
  let previousEnd = 0;
  for (const [i, [start, end, text]] of cues.entries()) {
    if (FILLER_ONLY.test(text)) cuts.push({kind: 'FILLER', start, end, why: text});
    if (i) {
      const gap = start - previousEnd;
      if (gap > floor) cuts.push({kind: 'DEAD', start: round(previousEnd + floor / 2, 3), end: round(start - floor / 2, 3), why: `Пауза ${round(gap, 2).toFixed(2)} с; проверить по видео.`});
    }
    previousEnd = Math.max(previousEnd, end);
    if (norm(text).length && !FILLER_ONLY.test(text)) {
      let j = i - 1;
      while (j >= 0 && (!norm(cues[j][2]).length || FILLER_ONLY.test(cues[j][2]))) j--;
      if (j >= 0) {
        const first = norm(cues[j][2]).slice(0, 5), second = norm(text).slice(0, 5);
        if (first.length >= 3 && first.length === second.length && first.every((word, n) => word === second[n])) cuts.push({kind: 'REPEAT', start: cues[j][0], end: cues[j][1], why: 'Совпало начало реплик; проверьте, что это дубль, а не смысловой повтор.'});
      }
    }
  }
  const sorted = cuts.filter(c => c.end > c.start).sort((a, b) => a.start - b.start);
  const duration = Math.max(...cues.map(c => c[1]));
  const removed = mergedDuration(sorted);
  return {duration, cuts: sorted, removed: round(removed, 3), out: round(duration - removed, 3)};
}

function main() {
  const args = parseCli({floor: {type: 'string', default: '0.45'}, json: {type: 'boolean'}}, 'Использование: node deadair.mjs файл [--floor 0.45] [--json]\nКандидаты на сокращение по SRT/VTT/Whisper JSON. Не изменяет видео.');
  if (!args) return;
  if (args.positionals.length !== 1) throw new Error('Укажите один файл расшифровки SRT, VTT или JSON.');
  const floor = finiteNumber(args.values.floor, '--floor');
  if (floor <= 0) throw new Error('--floor должен быть положительным конечным числом.');
  const cues = load(args.positionals[0]);
  if (!cues.length) throw new Error('В файле нет сегментов расшифровки.');
  const result = {source: args.positionals[0], ...analyze(cues, floor)};
  if (args.values.json) console.log(JSON.stringify(result, null, 2));
  else {
    for (const cut of result.cuts) console.log(`${cut.kind}: ${round(cut.start, 2).toFixed(2)}–${round(cut.end, 2).toFixed(2)} с — ${cut.why}`);
    console.log(`Кандидаты на удаление: ${result.removed} с; остаток до конца расшифровки: ${result.out} с.`);
    console.log('Перед монтажом проверьте каждый кандидат по видео. Тишина может быть частью демонстрации.');
  }
}
runCli(import.meta.url, main);
