#!/usr/bin/env node
import {readUtf8, words, parseCli, runCli} from '../yt-script/runtime.mjs';
export {words} from '../yt-script/runtime.mjs';
const DESKTOP=60, MOBILE=40, HARD=100;
const VAGUE = new Set('amazing incredible insane ultimate revolutionary невероятный невероятная невероятное потрясающий потрясающая лучший лучшая лучшие революционный секретный'.split(' '));
const STOP = new Set('the a an of for to in on and or is are with your you my i this that it how what why и а но или в во на для по из с со к у о об это этот эта эти как что почему я мы ты вы мой моя твой ваш'.split(' '));

export function check(title, thumb = null) {
  const text=title.trim(), size=[...text].length, issues=[], good=[], tokens=words(text);
  if (!tokens.length) issues.push(['empty','Нужен содержательный заголовок.']);
  if (size>HARD) issues.push(['length',`${size} символов: превышен лимит ${HARD}.`]);
  else if (size>DESKTOP) issues.push(['length',`${size} символов: проверьте сокращённое отображение.`]);
  else good.push(`${size} символов; укладывается в редакторский ориентир ${DESKTOP}.`);
  if (size>MOBILE) issues.push(['mobile',`Проверьте, понятен ли смысл начала: «${[...text].slice(0,MOBILE).join('')}…». Это ориентир, не фиксированный размер интерфейса.`]);
  const caps=text.split(/\s+/u).filter(w=>[...w].length>2 && w.toUpperCase()===w && w.toLowerCase()!==w);
  if (caps.length>2) issues.push(['shouting','Много слов прописными буквами; проверьте, нужны ли они для акцента.']);
  const vague=[...new Set(tokens.filter(w=>VAGUE.has(w)))].sort();
  if (vague.length) issues.push(['vague',`Проверьте конкретику: ${vague.join(', ')}.`]);
  if (/\d/u.test(text)) good.push('Есть число: проверьте его источник и уместность.');
  if (tokens.length && !tokens.slice(0,3).some(w=>!STOP.has(w))) issues.push(['front-load','Перенесите предмет видео ближе к началу.']);
  if (thumb!==null) {
    const titleWords=new Set(tokens.filter(w=>!STOP.has(w)));
    const shared=[...new Set(words(thumb).filter(w=>!STOP.has(w)&&titleWords.has(w)))].sort();
    if (shared.length) issues.push(['duplicate',`Повтор на обложке: ${shared.join(', ')}. Проверьте, добавляет ли он смысл.`]);
    else if (words(thumb).length) good.push('Буквальных повторов значимых слов не найдено; смысловое дублирование проверяется вручную.');
    if (words(thumb).length>3) issues.push(['thumb-length','Больше трёх слов: проверьте читаемость в уменьшенной обложке. Это рекомендация.']);
  }
  return {title:text,chars:size,score:tokens.length ? Math.max(0,Math.min(100,100-14*issues.length+4*good.length)) : 0,issues,good};
}
export function main() {
  const args=parseCli({title:{type:'string'},thumb:{type:'string'}}, 'Проверка заголовка и текста обложки; не прогноз CTR.\nnode title.mjs [titles.txt | --title "текст"] [--thumb "текст"] [--json]');
  if (!args) return;
  const {values,positionals}=args;
  if (positionals.length>1 || (positionals.length===1)===(values.title!==undefined)) throw new Error('Укажите либо файл, либо --title.');
  const lines=(values.title!==undefined ? [values.title] : readUtf8(positionals[0]).split(/\r?\n/u)).map(l=>l.trim()).filter(Boolean);
  if (!lines.length) throw new Error('Нет заголовков для проверки.');
  const rows=lines.map(l=>check(l,values.thumb ?? null)).sort((a,b)=>b.score-a.score);
  if (values.json) console.log(JSON.stringify(rows,null,2));
  else for (const row of rows) {
    console.log(`\n${row.title}\n${row.chars} символов; эвристическая оценка ${row.score}/100`);
    for (const [,message] of row.issues) console.log(`  Проверить: ${message}`);
    for (const message of row.good) console.log(`  ${message}`);
  }
}
runCli(import.meta.url,main);
