#!/usr/bin/env node
import {classify as classifyHook} from '../yt-script/hookscore.mjs';
import {readUtf8, finiteNumber, round, parseCli, runCli} from '../yt-script/runtime.mjs';
export const classify = title=>classifyHook(title)[0];
const compare = (a,b)=>a<b ? -1 : a>b ? 1 : 0;

export function rank(rows, minimum=1.5) {
  if (!Array.isArray(rows)||!rows.length) throw new Error('Нужен непустой массив видео или объект с массивом videos.');
  const groups=new Map(), seen=new Set();
  for (const [i,row] of rows.entries()) {
    if (!row || typeof row!=='object' || !['channel','title'].every(k=>typeof row[k]==='string'&&row[k].trim())) throw new Error(`Видео ${i+1}: нужны непустые строки channel и title.`);
    if (!Number.isSafeInteger(row.views)||row.views<0) throw new Error(`Видео ${i+1}: views — целое неотрицательное число в безопасном диапазоне, не строка «1,2 млн».`);
    const url=row.url===undefined ? '' : row.url;
    if (typeof url!=='string') throw new Error(`Видео ${i+1}: url должен быть строкой.`);
    if (url && seen.has(url)) throw new Error(`Видео ${i+1}: повтор URL искажает медиану.`);
    if (url) seen.add(url);
    const channel=row.channel.trim();
    if (!groups.has(channel)) groups.set(channel,[]);
    groups.get(channel).push(row);
  }
  const out=[],thin=[],zero=[];
  for (const [channel,videos] of groups) {
    if (videos.length<4) {thin.push([channel,videos.length]); continue;}
    const views=videos.map(v=>v.views).sort((a,b)=>a-b), middle=Math.floor(views.length/2);
    const median=views.length%2 ? views[middle] : views[middle-1]/2+views[middle]/2;
    if (!median) {zero.push(channel); continue;}
    for (const video of videos) {
      const multiple=video.views/median;
      if (multiple>=minimum) out.push({channel,title:video.title,views:video.views,median,multiple:round(multiple,3),formula:classify(video.title),url:video.url ?? ''});
    }
  }
  out.sort((a,b)=>b.multiple-a.multiple||compare(a.channel,b.channel)||compare(a.title,b.title));
  return {outliers:out,skipped_thin_channels:thin,skipped_zero_median:zero};
}
export function main() {
  const args=parseCli({min:{type:'string',default:'1.5'}}, 'Сравнение просмотров с медианой выборки своего канала.\nnode swipe.mjs collected.json [--min 2.0] [--json]');
  if (!args) return;
  const {values,positionals}=args;
  if (positionals.length!==1) throw new Error('Укажите один JSON-файл с подборкой видео.');
  const minimum=finiteNumber(values.min,'--min');
  if (minimum<=0) throw new Error('--min должен быть положительным конечным числом.');
  const data=JSON.parse(readUtf8(positionals[0]));
  const result=rank(Array.isArray(data)?data:data?.videos,minimum);
  if (values.json) console.log(JSON.stringify(result,null,2));
  else {
    for (const row of result.outliers) console.log(`${row.multiple.toFixed(2)}× медианы ${row.median} — ${row.channel}: ${row.title}\n  ${row.formula}  ${row.url}`);
    if (!result.outliers.length) console.log('В выборке нет видео выше заданного порога.');
    if (result.skipped_thin_channels.length) console.log(`Пропущены каналы с менее чем 4 видео: ${JSON.stringify(result.skipped_thin_channels)}`);
    if (result.skipped_zero_median.length) console.log(`Не определено отношение при нулевой медиане: ${result.skipped_zero_median.join(', ')}`);
    console.log('Сравнивайте похожие форматы и возраст публикации. Медиана относится только к переданной выборке.');
  }
}
runCli(import.meta.url,main);
