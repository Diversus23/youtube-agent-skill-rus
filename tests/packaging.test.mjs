import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync, readFileSync, existsSync, cpSync, mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {join, dirname, resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=path=>new TextDecoder('utf-8',{fatal:true}).decode(readFileSync(path));
function walk(path) {
  return readdirSync(path,{withFileTypes:true}).flatMap(entry=>entry.isDirectory() ?
    (entry.name==='__pycache__' ? [] : walk(join(path,entry.name))) : [join(path,entry.name)]);
}

test('12 skill entrypoints and metadata have valid local structure',()=>{
  const folders=readdirSync(join(root,'skills'),{withFileTypes:true}).filter(e=>e.isDirectory());
  assert.equal(folders.length,12);
  for(const folder of folders) {
    const path=join(root,'skills',folder.name,'SKILL.md');
    const text=read(path), front=text.match(/^---\r?\n([\s\S]*?)\r?\n---/u)?.[1];
    assert.ok(front,`${path}: missing frontmatter`);
    const fields=Object.fromEntries(front.split(/\r?\n/u).map(line=>{
      const match=line.match(/^([a-z_]+): (.*)$/u);
      assert.ok(match,`${path}: unsupported frontmatter line`);
      return [match[1],match[2].startsWith('"') ? JSON.parse(match[2]) : match[2]];
    }));
    assert.equal(fields.name,folder.name);
    assert.match(fields.name,/^[a-z0-9]+(?:-[a-z0-9]+)*$/u);
    assert.ok(fields.name.length<=64);
    assert.ok(fields.description.length>0&&fields.description.length<=1024);
    if(fields.compatibility) assert.ok(fields.compatibility.length<=500);
    const metadata=read(join(dirname(path),'agents','openai.yaml'));
    for(const key of ['display_name','short_description','default_prompt']) {
      const match=metadata.match(new RegExp(`^  ${key}: (.+)$`,'m'));
      assert.ok(match,`${path}: missing ${key}`);
      const value=JSON.parse(match[1]);
      if(key==='short_description') assert.ok(value.length>=25&&value.length<=64);
      if(key==='default_prompt') assert.ok(value.includes('$'+fields.name));
    }
  }
});

test('distributed files have intact UTF-8, resolvable links and Node commands',()=>{
  const files=[...walk(join(root,'skills')),join(root,'README.md'),join(root,'templates','voice.md')];
  for(const path of files) {
    assert.ok(!path.endsWith('.py'),`Python runtime still distributed: ${path}`);
    if(!/\.(?:mjs|md|json|yaml)$/u.test(path)) continue;
    const text=read(path);
    if(!path.endsWith('.mjs')) {assert.ok(!text.includes('\ufffd'),path); assert.ok(!text.includes('????'),path);}
    if(path.endsWith('.md')) {
      assert.doesNotMatch(text, /python(?:3)? -|\b(?:hookscore|title|deadair|chapters|retention|swipe)\.py\b/u);
      for(const match of text.matchAll(/\]\(([^)]+)\)/gu)) {
        if(!match[1].includes('://')) assert.ok(existsSync(resolve(dirname(path),match[1].split('#')[0])),`${path}: ${match[1]}`);
      }
    }
  }
  const formulas=JSON.parse(read(join(root,'skills','yt-script','hooks.json')));
  for(const f of formulas.hooks) assert.match(f.example,/[а-яё]/iu);
});

test('release metadata agrees and there are no package dependencies',()=>{
  const pkg=JSON.parse(read(join(root,'package.json')));
  const plugin=JSON.parse(read(join(root,'.claude-plugin','plugin.json')));
  const marketplace=JSON.parse(read(join(root,'.claude-plugin','marketplace.json')));
  assert.equal(pkg.version,plugin.version);
  assert.equal(marketplace.plugins[0].name,plugin.name);
  for(const key of ['dependencies','devDependencies','optionalDependencies','peerDependencies']) assert.equal(Object.keys(pkg[key]??{}).length,0);
  assert.equal(pkg.engines.node,'>=22.20.0');
});

test('all six CLIs work from copied skill folders without package.json or npm install',t=>{
  const temp=mkdtempSync(join(tmpdir(),'yt-install-'));
  t.after(()=>rmSync(temp,{recursive:true,force:true}));
  cpSync(join(root,'skills'),join(temp,'skills'),{recursive:true,filter:source=>!source.includes('__pycache__')});
  const transcript=join(temp,'speech.json'),csv=join(temp,'retention.csv'),videos=join(temp,'videos.json');
  writeFileSync(transcript,JSON.stringify([0,10,20].map(start=>({start,end:start+5,text:'Настройка света и запись звука'}))));
  writeFileSync(csv,'0;100\n30;80\n60;70');
  writeFileSync(videos,JSON.stringify([100,100,100,500].map((views,i)=>({channel:'Канал',title:`Видео ${i}`,views}))));
  const cases=[
    ['yt-script','hookscore',['--hook','Почему вы теряете время?']],
    ['yt-package','title',['--title','Как записать чистый звук','--thumb','БЕЗ ЭХА']],
    ['yt-edit','deadair',[transcript]],
    ['yt-chapters','chapters',[transcript,'--duration','35','--target','3']],
    ['yt-retention','retention',[csv,'--axis','seconds','--transcript',transcript]],
    ['yt-viral','swipe',[videos,'--min','2']],
  ];
  for(const [skill,name,args] of cases) {
    const script=join(temp,'skills',skill,name+'.mjs');
    const result=spawnSync(process.execPath,[script,...args,'--json'],{cwd:tmpdir(),encoding:'utf8'});
    assert.equal(result.status,0,`${name}: ${result.stderr}`);
    assert.ok(JSON.parse(result.stdout));
    const help=spawnSync(process.execPath,[script,'--help'],{cwd:tmpdir(),encoding:'utf8'});
    assert.equal(help.status,0,help.stderr);
    assert.match(help.stdout,/--json/u);
  }
  assert.ok(!existsSync(join(temp,'package.json')));
  assert.ok(!existsSync(join(temp,'node_modules')));
});
