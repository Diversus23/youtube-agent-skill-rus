import {readFileSync, realpathSync} from 'node:fs';
import {parseArgs} from 'node:util';
import {fileURLToPath} from 'node:url';

export function readUtf8(path) {
  return new TextDecoder('utf-8', {fatal: true}).decode(readFileSync(path)).replace(/\r\n?/gu, '\n');
}

export function words(text) {
  return text.toLowerCase().replaceAll('ё', 'е').match(/[a-zа-я0-9]+(?:['’][a-zа-я]+)?/gu) ?? [];
}

// JavaScript \b and \w are ASCII-based even with /u. The bundled formula
// expressions use Python's Unicode semantics; compile that subset explicitly.
export function compilePattern(pattern, flags = 'iu') {
  const word = String.raw`[\p{L}\p{N}_]`;
  const boundary = `(?:(?<!${word})(?=${word})|(?<=${word})(?!${word}))`;
  return new RegExp(pattern.replaceAll('\\w', word).replaceAll('\\b', boundary), flags);
}

export function finiteNumber(value, label = 'Значение') {
  if (typeof value !== 'number' && (typeof value !== 'string' ||
      !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/iu.test(value.trim()))) {
    throw new Error(`${label}: нужно конечное десятичное число.`);
  }
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${label}: нужно конечное число.`);
  return number;
}

// Round the exact binary value to decimal places, using ties-to-even as the
// original tools do. Multiplying by 10**digits first can change a tie.
export function round(value, digits = 0) {
  if (!Number.isFinite(value) || !Number.isInteger(digits) || digits < 0 || digits > 12) {
    throw new Error('Некорректные параметры округления.');
  }
  if (value === 0) return value;
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, Math.abs(value));
  const bits = view.getBigUint64(0);
  const exponentBits = Number((bits >> 52n) & 0x7ffn);
  const mantissa = (bits & ((1n << 52n) - 1n)) + (exponentBits ? 1n << 52n : 0n);
  const exponent = (exponentBits || 1) - 1023 - 52;
  let numerator = mantissa * 10n ** BigInt(digits);
  let denominator = 1n;
  if (exponent >= 0) numerator <<= BigInt(exponent);
  else denominator <<= BigInt(-exponent);
  let quotient = numerator / denominator;
  const twiceRemainder = (numerator % denominator) * 2n;
  if (twiceRemainder > denominator || (twiceRemainder === denominator && quotient % 2n)) quotient++;
  return Math.sign(value) * Number(quotient) / 10 ** digits;
}

export function parseCli(options, usage) {
  const argv = process.argv.slice(2);
  // Accept separated negative numeric values, as well as --option=-1.
  const normalized = [];
  for (let i = 0; i < argv.length; i++) {
    const name = argv[i].startsWith('--') ? argv[i].slice(2) : '';
    if (options[name]?.type === 'string' && /^-\d|^-\.\d/u.test(argv[i + 1] ?? '')) {
      normalized.push(`${argv[i]}=${argv[++i]}`);
    } else normalized.push(argv[i]);
  }
  const result = parseArgs({args: normalized, options: {
    ...options, json: {type: 'boolean', default: false}, help: {type: 'boolean', short: 'h'},
  }, allowPositionals: true, strict: true});
  if (result.values.help) {
    console.log(usage);
    return null;
  }
  return result;
}

export async function runCli(url, main) {
  if (!process.argv[1]) return;
  let entry;
  try { entry = realpathSync(process.argv[1]); } catch { return; }
  if (realpathSync(fileURLToPath(url)) !== entry) return;
  try {
    const [major, minor] = process.versions.node.split('.').map(Number);
    if (major < 22 || (major === 22 && minor < 20)) throw new Error('Требуется Node.js 22.20 или новее.');
    const status = await main();
    if (typeof status === 'number') process.exitCode = status;
  } catch (error) {
    console.error(`Ошибка: ${error.message}`);
    process.exitCode = 2;
  }
}
