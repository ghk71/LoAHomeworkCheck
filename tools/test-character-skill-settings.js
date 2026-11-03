// All browser requests are mocked; SQL runs in an isolated in-memory database.
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const {PGlite}=require('@electric-sql/pglite');
const {chromium}=require('playwright');
for(const name of ['index','raid','overview','party_generation']){
  const html=fs.readFileSync(name+'.html','utf8');
  assert.equal(html.slice(html.toLowerCase().lastIndexOf('</html>')+7).trim(),'');
  const defined=new Set([...html.matchAll(/(--[\w-]+)\s*:/g)].map(m=>m[1]));
  assert.equal([...html.matchAll(/var\(\s*(--[\w-]+)/g)].filter(m=>!defined.has(m[1])).length,0,name);
  for(const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))if(script[1].trim())new vm.Script(script[1]);
}
(async()=>{
  const db=new PGlite();
  try{
    await db.exec("create table characters(id text primary key,name text);insert into characters values ('c1','Character');");
    const migration=fs.readFileSync('supabase/migrations/20261103_character_skill_settings.sql','utf8');
    await db.exec(migration);await db.exec(migration);
    assert.deepEqual((await db.query('select skill_settings from characters')).rows[0].skill_settings,[]);
    const rows=[{id:'s1',name:'Raid',code:'AbC+/=\nsecond line'}];
    const save=()=>db.query("update characters set skill_settings=$1::jsonb where id='c1' and skill_settings=$2::jsonb returning id",[JSON.stringify(rows),'[]']);
    assert.equal((await save()).rows.length,1);assert.equal((await save()).rows.length,0,'stale save overwrote newer data');
    await db.exec(migration);
    assert.deepEqual((await db.query('select skill_settings from characters')).rows[0].skill_settings,rows);
  }finally{await db.close();}
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
    let acceptDialogs=true;
    page.on('dialog',d=>acceptDialogs?d.accept():d.dismiss());page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',route=>{
      if(route.request().url()==='http://localhost/index.html')return route.fulfill({contentType:'text/html',body:fs.readFileSync('index.html','utf8')});
      if(route.request().url().includes('supabase.min.js'))return route.fulfill({contentType:'text/javascript',body:'window.supabase={createClient:()=>({})}'});
      return route.fulfill({body:''});
    });
    await page.goto('http://localhost/index.html');
    await page.evaluate(()=>{
      state.accounts=[{id:'a',name:'테스트 계정'}];state.selectedAccount='a';state.hiddenAccounts=new Set();
      state.chars=[{id:'c1',account_id:'a',name:'긴이름캐릭터테스트',class_name:'바드',show_raid_tasks:false},{id:'c2',account_id:'a',name:'두번째',class_name:'도화가',show_raid_tasks:false}];
      state.tasks={c1:[],c2:[]};state.expTasks={a:[]};
      document.getElementById('setup').style.display='none';document.getElementById('app').classList.add('active');render();
      window.skillDb={c1:[],c2:[]};window.skillWrites=0;window.skillFailure=null;
      sb={from:table=>{
        if(table!=='characters')throw new Error('unexpected table '+table);
        const query={patch:null,filters:{},select(){return this;},update(patch){this.patch=patch;return this;},eq(k,v){this.filters[k]=v;return this;},async maybeSingle(){
          if(window.skillFailure)return {data:null,error:window.skillFailure};
          const id=this.filters.id;
          if(this.patch){window.skillWrites++;if(JSON.stringify(window.skillDb[id])!==this.filters.skill_settings)return {data:null,error:null};window.skillDb[id]=structuredClone(this.patch.skill_settings);}
          return {data:{id,skill_settings:structuredClone(window.skillDb[id])},error:null};
        }};return query;
      }};
      Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copiedSkill=text;}}});
    });
    await page.getByRole('button',{name:'긴이름캐릭터테스트 스킬 세팅',exact:true}).click();
    await page.locator('#skill-add').click();
    assert.equal(await page.locator('#skill-edit').getAttribute('aria-pressed'),'true');
    await page.locator('#skill-save').click();
    assert.equal(await page.evaluate(()=>window.skillWrites),0,'empty row was saved');
    const code='ABC+/=long-code\n</textarea><img src=x onerror=alert(1)>';
    await page.getByRole('textbox',{name:'세팅명 1',exact:true}).fill('레이드 <세팅>');
    await page.getByRole('textbox',{name:'스킬코드 1',exact:true}).fill(code);
    await page.locator('#skill-edit').click();
    assert.equal(await page.locator('#skill-edit').getAttribute('aria-pressed'),'false');
    assert.equal(await page.locator('#skill-settings-list img').count(),0,'unescaped code');
    await page.locator('.skill-copy').click();assert.equal(await page.evaluate(()=>window.copiedSkill),code);
    await page.getByRole('button',{name:'스킬 세팅 닫기'}).click();
    await page.evaluate(()=>setMode('weekly'));
    await page.getByRole('button',{name:'긴이름캐릭터테스트 스킬 세팅',exact:true}).click();
    assert.equal(await page.locator('.skill-name').innerText(),'레이드 <세팅>');
    await page.locator('#skill-add').click();
    await page.getByRole('textbox',{name:'세팅명 2',exact:true}).fill('두 번째 세팅');
    await page.getByRole('textbox',{name:'스킬코드 2',exact:true}).fill('SecondCode');
    await page.evaluate(()=>window.skillFailure={code:'NETWORK',message:'offline'});
    await page.locator('#skill-save').click();
    assert.equal(await page.getByRole('textbox',{name:'스킬코드 2',exact:true}).inputValue(),'SecondCode');
    assert.equal(await page.locator('#skill-save').isDisabled(),false);
    await page.evaluate(()=>window.skillFailure=null);await page.locator('#skill-save').click();
    await page.locator('#skill-settings-list .skill-row').nth(1).locator('input[type=checkbox]').check();
    await page.locator('#skill-delete').click();
    assert.equal(await page.locator('.skill-name').innerText(),'두 번째 세팅');
    assert.equal(await page.evaluate(()=>window.skillDb.c1.length),1);
    // A concurrent save cannot silently overwrite the database; edits are retained.
    await page.locator('#skill-edit').click();
    await page.getByRole('textbox',{name:'세팅명 1',exact:true}).fill('내 변경');
    await page.evaluate(()=>window.skillDb.c1[0].name='다른 창 변경');
    await page.locator('#skill-save').click();
    assert.equal(await page.evaluate(()=>window.skillDb.c1[0].name),'다른 창 변경');
    assert.equal(await page.getByRole('textbox',{name:'세팅명 1',exact:true}).inputValue(),'내 변경');
    acceptDialogs=false;await page.keyboard.press('Escape');assert.equal(await page.locator('#modal-skill-settings').isVisible(),true);
    acceptDialogs=true;await page.keyboard.press('Escape');assert.equal(await page.locator('#modal-skill-settings').isVisible(),false);
    await page.getByRole('button',{name:'두번째 스킬 세팅',exact:true}).click();
    assert.equal(await page.locator('.skill-name').count(),0,'settings leaked to another character');
    await page.getByRole('button',{name:'스킬 세팅 닫기'}).click();
    // Missing SQL leaves editing disabled, rather than treating a failed read as empty data.
    await page.evaluate(()=>window.skillFailure={code:'42703',message:'column skill_settings does not exist'});
    await page.getByRole('button',{name:'두번째 스킬 세팅',exact:true}).click();
    assert.match(await page.locator('#skill-settings-status').innerText(),/20261103/);
    assert.equal(await page.locator('#skill-add').isDisabled(),true);
    await page.evaluate(()=>window.skillFailure=null);await page.locator('#skill-retry').click();
    assert.equal(await page.locator('#skill-add').isEnabled(),true);
    await page.getByRole('button',{name:'스킬 세팅 닫기'}).click();
    const writes=await page.evaluate(()=>window.skillWrites);
    await page.evaluate(()=>{localStorage.setItem('la_test_now',String(Date.now()));});
    await page.getByRole('button',{name:'긴이름캐릭터테스트 스킬 세팅',exact:true}).click();
    await page.locator('#skill-add').click();
    await page.getByRole('textbox',{name:'세팅명 2',exact:true}).fill('테스트 전용');
    await page.getByRole('textbox',{name:'스킬코드 2',exact:true}).fill('TestOnly');await page.locator('#skill-save').click();
    assert.equal(await page.evaluate(()=>window.skillWrites),writes,'test mode wrote to DB');
    await page.getByRole('button',{name:'스킬 세팅 닫기'}).click();
    await page.evaluate(()=>localStorage.removeItem('la_test_now'));
    await page.getByRole('button',{name:'긴이름캐릭터테스트 스킬 세팅',exact:true}).click();
    assert.equal(await page.locator('.skill-name').count(),1,'test settings persisted to real mode');
    // Long values and many rows must stay within the dialog on desktop and mobile.
    await page.evaluate(()=>{for(let i=0;i<18;i++){skillSettingsContext.rows.push({id:'visual'+i,name:'긴 세팅명 확인 '+i,code:'A'.repeat(500)});}renderSkillSettings();});
    for(const width of [1280,390]){
      await page.setViewportSize({width,height:844});
      for(const editing of [false,true]){
        await page.evaluate(editing=>{skillSettingsContext.editing=editing;renderSkillSettings();},editing);
        await page.screenshot({path:path.join(os.tmpdir(),`loa-skill-settings-${width}-${editing?'edit':'view'}.png`)});
        assert.equal(await page.locator('.skill-modal').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,'dialog overflow');
        assert.equal(await page.locator('.skill-body').evaluate(el=>el.scrollWidth<=el.clientWidth+1&&el.scrollHeight>el.clientHeight),true,'list must scroll vertically only');
      }
    }
    assert.deepEqual(errors,[]);
    console.log('PASS: SQL idempotency/CAS; avatar tabs, CRUD, exact copy, escaping, failure/retry, conflict, dirty close, missing SQL, character isolation, test mode, 1280/390px and four-page static checks');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
