// Isolated browser + PostgreSQL checks; never connects to production.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {PGlite}=require('@electric-sql/pglite');
const html=fs.readFileSync('index.html','utf8'),schema=fs.readFileSync('schema.sql','utf8');
const migration=fs.readFileSync('supabase/migrations/20261104_task_active_days.sql','utf8');
for(const name of ['index','raid','overview','party_generation']){
  const text=fs.readFileSync(name+'.html','utf8');
  assert.equal(text.slice(text.toLowerCase().lastIndexOf('</html>')+7).trim(),'');
  const defined=new Set([...text.matchAll(/(--[\w-]+)\s*:/g)].map(m=>m[1]));
  for(const m of text.matchAll(/var\(\s*(--[\w-]+)/g))assert.ok(defined.has(m[1]),m[1]);
  for(const m of text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))new vm.Script(m[1]);
}
assert.ok(schema.replace(/\r/g,'').includes(migration.trim().replace(/\r/g,'')));
(async()=>{
  const db=new PGlite();
  try{
    await db.exec("create role anon; create role authenticated; create function uuid_generate_v4() returns uuid language sql as 'select pg_catalog.gen_random_uuid()';");
    for(const table of ['accounts','characters','tasks','expedition_tasks'])await db.exec(schema.match(new RegExp('create table if not exists '+table+'\\([\\s\\S]*?\\n\\);'))[0]);
    for(const table of ['tasks','expedition_tasks'])await db.exec(`alter table ${table} add column clone_group_id uuid; alter table ${table} add column icon_url text;`);
    await db.exec(schema.slice(schema.indexOf('create or replace function apply_task_pause_atomic('),schema.indexOf('-- Run after 20261001_task_group_settings.sql.')));
    await db.exec(fs.readFileSync('supabase/migrations/20261008_task_batch_workflow.sql','utf8'));
    await db.exec(migration);await db.exec(migration);
    const a=(await db.query("insert into accounts(name) values ('A') returning id")).rows[0].id;
    const b=(await db.query("insert into accounts(name) values ('B') returning id")).rows[0].id;
    const c=(await db.query("insert into characters(name,account_id) values ('C',$1) returning id",[a])).rows[0].id;
    for(const exp of [true,false]){
      const owner=exp?a:c,table=exp?'expedition_tasks':'tasks';
      const settings={name:'카오스게이트',reset_type:'daily',active_days:[4,6,0,1],activate_day:null};
      const row=(await db.query('select task_insert_node($1,$2,null,pg_catalog.gen_random_uuid(),$3) r',[exp,owner,JSON.stringify(settings)])).rows[0].r;
      assert.deepEqual(row.active_days,settings.active_days);
      await db.query(`update ${table} set is_completed=true,last_completed_at=now() where id=$1`,[row.id]);
      await db.query('select save_task_settings_atomic($1,$2,$3,$4)',[exp,row.id,row.clone_group_id,JSON.stringify({...settings,active_days:[5,0,2]})]);
      const changed=(await db.query(`select * from ${table} where id=$1`,[row.id])).rows[0];
      assert.deepEqual(changed.active_days,[5,0,2]);assert.equal(changed.is_completed,true);
      for(const days of [[],[7],[null]])await assert.rejects(()=>db.query(`update ${table} set active_days=$1 where id=$2`,[days,row.id]));
      if(exp){
        await db.query('select clone_task_tree_atomic(true,$1,$2)',[row.id,[b]]);
        assert.deepEqual((await db.query('select active_days from expedition_tasks where account_id=$1',[b])).rows[0].active_days,[5,0,2]);
      }
    }
    const old=[],legacyOwner=(await db.query("insert into accounts(name) values ('Legacy') returning id")).rows[0].id;
    for(const day of ['목','토','일','월'])old.push((await db.query("insert into expedition_tasks(account_id,name,reset_type,activate_day) values ($1,$2,'weekly',4) returning id",[legacyOwner,'카오스게이트 ('+day+')'])).rows[0].id);
    await db.query('update expedition_tasks set is_completed=true,last_completed_at=now() where id=$1',[old[2]]);
    const optional=fs.readFileSync('supabase/migrations/20261104_merge_account_event_tasks_optional.sql','utf8');
    await db.exec(optional);
    const merged=(await db.query('select * from expedition_tasks where id=any($1)',[old])).rows;
    assert.equal(merged.filter(t=>t.is_paused).length,3);
    const active=merged.find(t=>!t.is_paused);assert.deepEqual(active.active_days,[1,4,6,0]);assert.equal(active.is_completed,true);
    assert.equal((await db.query('select count(*)::int n from account_event_task_backup_20261104')).rows[0].n,4);
    await db.exec(optional);assert.deepEqual((await db.query('select * from expedition_tasks where id=any($1)',[old])).rows,merged);
  }finally{await db.close();}
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',r=>r.fulfill({contentType:r.request().url()==='http://localhost/index.html'?'text/html':'text/javascript',body:r.request().url()==='http://localhost/index.html'?html:r.request().url().includes('supabase.min.js')?'window.supabase={createClient:()=>({})}':''}));
    await page.goto('http://localhost/index.html');
    await page.evaluate(()=>{
      state.accounts=[{id:'a',name:'계정'}];state.chars=[];state.tasks={};state.expTasks={a:[]};state.selectedAccount='a';state.mode='account';
      document.getElementById('setup').style.display='none';document.getElementById('app').classList.add('active');
      localStorage.setItem('la_test_now',String(Date.parse('2026-11-05T06:00:00+09:00')));render();openCreateTask('account','a','daily');
    });
    await page.locator('#task-name').fill('카오스게이트');await page.locator('#task-days-enabled').check();
    await page.locator('#task-days-wrap').getByRole('button',{name:'카오스게이트',exact:true}).click();
    assert.deepEqual(await page.locator('#task-days-wrap input:checked').evaluateAll(els=>els.map(e=>Number(e.value))),[1,4,6,0]);
    await page.locator('#task-submit-btn').click();await page.locator('#task-draft-save').click();
    const row=await page.evaluate(()=>state.expTasks.a[0]);assert.deepEqual(row.active_days,[1,4,6,0]);
    const checks=await page.evaluate(()=>{
      const t=state.expTasks.a[0],results=[];
      for(const [at,expected] of [['2026-11-05T05:59:59+09:00',false],['2026-11-05T06:00:00+09:00',true],['2026-11-06T05:59:59+09:00',true],['2026-11-06T06:00:00+09:00',false]]){
        localStorage.setItem('la_test_now',String(Date.parse(at)));results.push([isActive(t),expected]);
      }
      localStorage.setItem('la_test_now',String(Date.parse('2026-11-05T10:00:00+09:00')));
      t.is_completed=true;t.last_completed_at=appNowIso();results.push([isDone(t),true]);
      localStorage.setItem('la_test_now',String(Date.parse('2026-11-06T06:00:00+09:00')));results.push([isDone(t),false]);
      state.showInactive=false;results.push([applyTaskFilters([t]).length,0]);state.showInactive=true;results.push([applyTaskFilters([t]).length,1]);
      return results;
    });
    checks.forEach(([actual,expected])=>assert.equal(actual,expected));
    const edgeActive=fs.readFileSync('supabase/functions/send-homework-discord/index.ts','utf8').match(/function isActive\(task: any\) \{[\s\S]*?\n\}/)[0].replace('task: any','task');
    const parity=await page.evaluate(source=>{
      const edge=new Function('getLastResetUTC','effectiveRestCurrent',source+';return isActive;')(getLastResetUTC,t=>t.rest_current||0),results=[];
      for(const days of [[1,4,6,0],[2,5,0]])for(let n=0;n<7;n++){
        const at=new Date(Date.UTC(2026,10,1+n,1));localStorage.setItem('la_test_now',String(+at));
        const t={reset_type:'daily',active_days:days};results.push(isActive(t)===days.includes(at.getUTCDay())&&edge(t)===isActive(t));
      }
      localStorage.setItem('la_test_now',String(Date.parse('2026-11-07T10:00:00+09:00')));
      const t={reset_type:'daily',active_days:[4],created_at:'2026-11-04T06:00:00+09:00',rest_last_processed_at:'2026-11-04T06:00:00+09:00'};
      results.push(getResetBoundariesSince(t,getLastResetUTC('daily',3)).length===1);
      results.push(isActive({reset_type:'daily',activate_day:6})===true);
      return results;
    },edgeActive);
    assert.ok(parity.every(Boolean),'weekday/Discord/rest/legacy parity');
    await page.evaluate(id=>openEditTask(id,true,'a'),row.id);
    assert.equal(await page.locator('#task-days-enabled').isChecked(),true);
    await page.locator('#task-days-wrap').getByRole('button',{name:'필드보스',exact:true}).click();
    await page.locator('#task-submit-btn').click();
    assert.deepEqual(await page.evaluate(()=>state.expTasks.a[0].active_days),[2,5,0]);
    await page.evaluate(id=>openEditTask(id,true,'a'),row.id);
    for(const box of await page.locator('#task-days-wrap input').all())await box.uncheck();
    await page.locator('#task-submit-btn').click();assert.equal(await page.locator('#modal-create').evaluate(e=>e.classList.contains('open')),true);
    for(const width of [1280,390]){
      await page.setViewportSize({width,height:844});
      await page.locator('#task-days-wrap').getByRole('button',{name:'필드보스',exact:true}).click();
      assert.ok(await page.locator('#modal-create .modal').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
      await page.screenshot({path:require('node:path').join(require('node:os').tmpdir(),'loa-active-days-'+width+'.png')});
    }
    assert.deepEqual(errors,[]);console.log('PASS: SQL create/edit/clone/progress/validation; weekday presets, KST06 boundaries, completion reset, inactive filter, edit reload, desktop/mobile; four-page static checks');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
