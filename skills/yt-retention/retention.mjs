#!/usr/bin/env node
/** Отчёт по двум столбцам удержания; изменение кривой не доказывает причину ухода. */
import { readUtf8, parseCli, runCli, finiteNumber, round } from '../yt-script/runtime.mjs';

export function number(value) {
  const text = String(value).trim().replace(/%$/, '').trim().replace(/[ \u00a0\u202f]/g, '');
  if (text.includes(',') && text.includes('.')) throw new Error('Неоднозначный формат числа; используйте 1234.5 или 1234,5.');
  return finiteNumber(text.replace(',', '.'), 'Число');
}

// Strict RFC-style quoting: a quote may only open a field or escape another quote.
function parseCsv(raw, delimiter) {
  const records = [];
  let cells = [], cell = '', state = 'start', line = 1, recordLine = 1;
  const finishCell = () => { cells.push(cell); cell = ''; state = 'start'; };
  const finishRecord = () => { finishCell(); records.push({ cells, line: recordLine }); cells = []; };
  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    if (state === 'quoted') {
      if (char === '"') {
        if (raw[i + 1] === '"') { cell += '"'; i++; } else state = 'closed';
      } else {
        cell += char;
        if (char === '\n' || (char === '\r' && raw[i + 1] !== '\n')) line++;
      }
    } else if (char === delimiter) finishCell();
    else if (char === '\r' || char === '\n') {
      finishRecord();
      if (char === '\r' && raw[i + 1] === '\n') i++;
      recordLine = ++line;
    } else if (char === '"' && state === 'start') state = 'quoted';
    else {
      if (char === '"' || state === 'closed') throw new Error(`Строка ${line}: неверные кавычки CSV.`);
      cell += char;
      state = 'plain';
    }
  }
  if (state === 'quoted') throw new Error(`Строка ${recordLine}: незакрытые кавычки CSV.`);
  if (cell !== '' || cells.length || state !== 'start') finishRecord();
  return records.filter(row => row.cells.some(value => value.trim()));
}

export function loadCsv(path, delimiter = null) {
  const raw = readUtf8(path);
  let records;
  if (delimiter === null) {
    const candidates = [];
    for (const candidate of [',', ';', '\t']) {
      try {
        const parsed = parseCsv(raw, candidate);
        if (parsed.length && parsed.every(row => row.cells.length === 2)) candidates.push(parsed);
      } catch { /* Try the other supported delimiters before reporting ambiguity. */ }
    }
    if (candidates.length !== 1) throw new Error('Не удалось определить разделитель CSV; укажите --delimiter.');
    [records] = candidates;
  } else {
    if (![',', ';', '\t'].includes(delimiter)) throw new Error('Разделитель CSV должен быть запятой, точкой с запятой или табуляцией.');
    records = parseCsv(raw, delimiter);
  }
  const rows = [];
  for (const [index, { cells, line }] of records.entries()) {
    if (cells.length !== 2) throw new Error(`Строка ${line}: нужны ровно два столбца (позиция, удержание).`);
    let point;
    try { point = cells.map(number); }
    catch (error) {
      // Only a first row with two textual labels is a header, never NaN/Infinity or broken numbers.
      const textual = cells.every(value => /^[\p{P}\p{S}\s]*\p{L}/u.test(value.trim()) && !/^[+-]?(?:nan|inf(?:inity)?)%?$/i.test(value.trim()));
      if (index === 0 && textual) continue;
      throw new Error(`Строка ${line}: неверные числовые данные (${error.message}).`);
    }
    if (point.some(value => value < 0)) throw new Error(`Строка ${line}: отрицательное значение.`);
    if (rows.length && point[0] <= rows.at(-1)[0]) throw new Error(`Строка ${line}: позиции должны строго возрастать.`);
    rows.push(point);
  }
  if (rows.length < 2) throw new Error('Нужно не меньше двух точек удержания.');
  return rows;
}

export function analyze(rows, axis, duration = null) {
  if (!['seconds', 'percent'].includes(axis)) throw new Error('--axis обязателен: seconds или percent.');
  if (!Array.isArray(rows) || rows.length < 2 || rows.some((row, i) => !Array.isArray(row) || row.length !== 2 || row.some(x => typeof x !== 'number' || !Number.isFinite(x) || x < 0) || (i > 0 && row[0] <= rows[i - 1][0]))) {
    throw new Error('Нужны минимум две конечные неотрицательные точки со строго возрастающими позициями.');
  }
  if (axis === 'percent' && rows.at(-1)[0] > 100) throw new Error('Для оси percent позиции должны быть в диапазоне 0–100.');
  if (duration !== null && (typeof duration !== 'number' || !Number.isFinite(duration) || duration <= 0)) throw new Error('--duration должен быть положительным конечным числом.');
  if (axis === 'seconds' && duration !== null && rows.at(-1)[0] > duration) throw new Error('Позиция в CSV выходит за длительность видео.');
  const seconds = x => axis === 'seconds' ? x : duration !== null ? x * duration / 100 : null;
  const cutoff = axis === 'seconds' ? 30 : duration !== null ? 3000 / duration : null;
  let openingEnd = null;
  const drops = rows.slice(1).map(([x2, y2], i) => {
    const [x1, y1] = rows[i];
    if (cutoff !== null && rows[0][0] === 0 && x1 <= cutoff && cutoff <= x2) openingEnd = y1 + (y2 - y1) * (cutoff - x1) / (x2 - x1);
    return { start: x1, end: x2, lost: y1 - y2, rate: (y1 - y2) / (x2 - x1) };
  });
  const cliffs = [...drops].sort((a, b) => b.rate - a.rate).filter(d => d.lost > 0).slice(0, 5).map(d => ({
    from_position: d.start, to_position: d.end, lost: round(d.lost, 3), at_seconds: seconds(d.start), to_seconds: seconds(d.end),
  }));
  const middle = drops.filter(d => cutoff !== null && d.end > cutoff);
  const span = middle.reduce((total, d) => total + d.end - Math.max(d.start, cutoff), 0);
  const slide = span ? middle.reduce((total, d) => total + d.rate * (d.end - Math.max(d.start, cutoff)), 0) / span : null;
  return {
    points: rows.length, axis, duration, start: rows[0][1], end: rows.at(-1)[1],
    hook_leak: openingEnd !== null ? round(rows[0][1] - openingEnd, 3) : null,
    opening_seconds: openingEnd !== null ? 30 : null, cliffs,
    slide_per_unit: slide !== null ? round(slide, 6) : null,
    units: axis === 'seconds' ? 'percentage_points_per_second' : 'percentage_points_per_percent_position',
    warnings: openingEnd === null ? ['Потеря за первые 30 секунд не рассчитана: нужны начало 0, покрытие 30 секунд и известная шкала времени.'] : [],
  };
}

async function main() {
  const args = parseCli({ axis: { type: 'string' }, duration: { type: 'string' }, delimiter: { type: 'string' }, transcript: { type: 'string' }, json: { type: 'boolean' } },
    'Использование: node retention.mjs CSV --axis seconds|percent [--duration СЕКУНДЫ] [--delimiter ","|";"|tab] [--transcript ФАЙЛ] [--json]\nУдержание в процентах: 85.5, не 0.855.');
  if (!args) return;
  const { values, positionals } = args;
  if (positionals.length !== 1) throw new Error('Укажите один CSV-файл.');
  if (!['seconds', 'percent'].includes(values.axis)) throw new Error('--axis обязателен: seconds или percent.');
  if (values.delimiter !== undefined && ![',', ';', 'tab'].includes(values.delimiter)) throw new Error('--delimiter: допустимы запятая, точка с запятой или tab.');
  const rows = loadCsv(positionals[0], values.delimiter === 'tab' ? '\t' : values.delimiter ?? null);
  const result = analyze(rows, values.axis, values.duration === undefined ? null : finiteNumber(values.duration, '--duration'));
  if (values.transcript) {
    const { load } = await import('../yt-edit/deadair.mjs');
    const cues = load(values.transcript);
    for (const cliff of result.cliffs) {
      cliff.said = Array.from(cues.filter(c => cliff.at_seconds !== null && c[0] <= cliff.to_seconds && c[1] >= cliff.at_seconds).map(c => c[2]).join(' ')).slice(0, 500).join('');
    }
  }
  if (values.json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`Точек: ${result.points}; шкала: ${result.axis}; удержание ${result.start}% → ${result.end}%.`);
    console.log(result.hook_leak !== null ? `Изменение за первые 30 с: ${result.hook_leak} п.п.` : 'Недостаточно данных для первых 30 с.');
    for (const cliff of result.cliffs) console.log(`Интервал ${cliff.from_position}–${cliff.to_position} (${values.axis}): падение ${cliff.lost} п.п. ${cliff.said ?? ''}`);
    console.log(`Средний наклон после 30 с: ${result.slide_per_unit ?? 'не рассчитан'} п.п. на единицу позиции.`);
    for (const warning of result.warnings) console.log(warning);
    console.log('Падение указывает интервал для проверки, а не точный момент или причину ухода зрителя.');
  }
}

runCli(import.meta.url, main);
