// Isolated browser regression. Network traffic is mocked; no production DB writes.
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
for(const name of ['index','raid','overview','party_generation']){
  const html=fs.readFileSync(name+'.html','utf8');
  assert.equal(html.slice(html.toLowerCase().lastIndexOf('</html>')+7).trim(),'');
  const defined=new Set([...html.matchAll(/(--[\w-]+)\s*:/g)].map(m=>m[1]));
  assert.equal([...html.matchAll(/var\(\s*(--[\w-]+)/g)].filter(m=>!defined.has(m[1])).length,0,name);
  for(const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))if(script[1].trim())new vm.Script(script[1]);
}
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[],dialogs=[];
    let accept=true;
    page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>{dialogs.push(d.message());return accept?d.accept():d.dismiss();});
    await page.route('**/*',route=>{
      if(route.request().url()==='http://localhost/index.html')return route.fulfill({contentType:'text/html',body:fs.readFileSync('index.html','utf8')});
      if(route.request().url().includes('supabase.min.js'))return route.fulfill({contentType:'text/javascript',body:'window.supabase={createClient:()=>({})}'});
      return route.fulfill({body:''});
    });
    await page.goto('http://localhost/index.html');
    await page.evaluate(()=>{
      state.accounts=[{id:'b',name:'두번째 계정'},{id:'a',name:'첫번째 계정'},{id:'sub',name:'부계정',parent_account_id:'a'},{id:'h',name:'숨김 계정'}];
      state.hiddenAccounts=new Set(['h']);state.selectedAccount='b';
      state.chars=[['a2','a'],['b2','b'],['s1','sub'],['a1','a'],['b1','b'],['h1','h']].map(([id,account_id])=>({id,account_id,name:id,class_name:'바드',show_raid_tasks:false}));
      const task=(id,owner,isExp=false,group='g',paused=true,parent=null)=>({id,[isExp?'account_id':'character_id']:owner,name:'동일 숙제',reset_type:'daily',clone_group_id:group,is_paused:paused,parent_id:parent,is_completed:false});
      state.tasks={a1:[task('ta1','a1',false,'g',false)],a2:[task('ta2','a2')],b1:[task('tb1','b1'),task('other','b1',false,'different')],b2:[task('tb2','b2'),task('child','b2',false,'child-g',false,'tb2'),task('grand','b2',false,'grand-g',false,'child')],s1:[task('ts1','s1')],h1:[task('th1','h1')]};
      state.expTasks={a:[task('ea','a',true)],b:[task('eb','b',true)],sub:[task('es','sub',true)]};
      window.deleteCalls=[];window.failDelete=false;
      fetchTaskGroupRows=async ctx=>Object.values(ctx.isExp?state.expTasks:state.tasks).flat().filter(t=>ctx.groupId?t.clone_group_id===ctx.groupId:t.id===ctx.id).sort((a,b)=>a.id.localeCompare(b.id));
      sb={rpc:async(name,args)=>{window.deleteCalls.push({name,args});return window.failDelete?{error:{message:'offline'}}:{data:simulateTaskStructure(name,args),error:null};}};
      document.getElementById('setup').style.display='none';document.getElementById('app').classList.add('active');render();
    });
    assert.deepEqual(await page.evaluate(()=>visibleAccounts().map(a=>a.id)),['b','a','sub']);
    assert.deepEqual(await page.evaluate(()=>visibleChars().map(c=>c.id)),['b2','b1']);
    await page.evaluate(()=>openCopyTask('tb2',false,'b2'));
    assert.deepEqual(await page.locator('#copy-task-list [data-task-target]').evaluateAll(els=>els.map(e=>e.dataset.taskTarget)),['b1','a2','a1','s1']);
    await page.evaluate(()=>closeModal('modal-copy-task'));
    await page.evaluate(()=>openBulkDelete('tb2',false,'b2'));
    assert.deepEqual(await page.locator('#bulk-delete-list [data-task-target]').evaluateAll(els=>els.map(e=>e.dataset.taskTarget)),['tb2','tb1','ta2','ta1','ts1']);
    await page.evaluate(()=>closeModal('modal-bulk-delete'));
    await page.evaluate(()=>{
      state.taskGroupEdit={id:'tb2',isExp:false,settings:state.tasks.b2[0],rows:Object.values(state.tasks).flat().filter(t=>t.clone_group_id==='g').reverse()};renderTaskGroupEdit();
    });
    assert.deepEqual(await page.locator('#task-group-targets [data-group-target]').evaluateAll(els=>els.map(e=>e.dataset.groupTarget)),['tb2','tb1','ta2','ta1','ts1']);
    assert.deepEqual(await page.evaluate(()=>taskCatalogGroups().find(g=>g.key==='char:g').entries.map(e=>e.ownerId)),['b2','b1','a2','a1','s1']);
    // Reflect user drag order immediately, not alphabetic names or fetched task UUIDs.
    await page.evaluate(()=>{state.accounts=[state.accounts[1],state.accounts[0],...state.accounts.slice(2)];state.chars.reverse();openCopyTask('tb2',false,'b2');});
    assert.deepEqual(await page.locator('#copy-task-list [data-task-target]').evaluateAll(els=>els.map(e=>e.dataset.taskTarget)),['a1','a2','b1','s1']);
    await page.evaluate(()=>{closeModal('modal-copy-task');state.accounts=[state.accounts[1],state.accounts[0],...state.accounts.slice(2)];state.chars.reverse();openPausedTaskManager();});
    for(const width of [1280,390]){
      await page.setViewportSize({width,height:900});
      await page.screenshot({path:path.join(os.tmpdir(),'loa-paused-delete-'+width+'.png')});
      assert.equal(await page.locator('#modal-paused-tasks .modal').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
    }
    await page.locator('#paused-char-tb2').getByRole('button',{name:'영구 삭제',exact:true}).click();
    assert.deepEqual(await page.locator('#bulk-delete-list [data-task-target]').evaluateAll(els=>els.map(e=>e.dataset.taskTarget)),['tb2','tb1','ta2','ts1']);
    assert.deepEqual(await page.evaluate(()=>selectedTaskTargets('bulk-delete-list')),['tb2']);
    await page.locator('#bulk-delete-list [data-task-target="ta2"]').check();
    accept=false;await page.locator('#bulk-delete-submit').click();assert.equal(await page.evaluate(()=>window.deleteCalls.length),0);
    accept=true;await page.evaluate(()=>window.failDelete=true);await page.locator('#bulk-delete-submit').click();
    assert.equal(await page.evaluate(()=>state.tasks.b2.length),3);assert.equal(await page.locator('#bulk-delete-submit').isEnabled(),true);
    await page.evaluate(()=>window.failDelete=false);await page.locator('#bulk-delete-submit').click();
    assert.match(dialogs.at(-1),/영구 삭제.*\n삭제 후에는 복구할 수 없습니다/s);
    assert.deepEqual(await page.evaluate(()=>window.deleteCalls.at(-1).args.p_target_ids),['tb2','ta2']);
    assert.equal(await page.evaluate(()=>state.tasks.b2.length),0,'descendants survived');
    assert.equal(await page.evaluate(()=>state.tasks.b1.length),2,'unselected/other group was deleted');
    assert.equal(await page.evaluate(()=>state.tasks.a1.length),1,'active copy was deleted');
    assert.equal(await page.locator('#paused-char-tb2').count(),0,'manager not refreshed');
    // Inherited pause and account tasks use the same permanent deletion flow.
    await page.evaluate(()=>{state.tasks.b1.push({id:'inherited',character_id:'b1',name:'하위',parent_id:'tb1',reset_type:'daily',is_paused:false});renderPausedTaskManager();});
    await page.locator('#paused-char-inherited').getByRole('button',{name:'영구 삭제'}).click();
    await page.locator('#bulk-delete-submit').click();
    assert.equal(await page.evaluate(()=>state.tasks.b1.some(t=>t.id==='tb1')),true);
    await page.locator('#paused-exp-eb').getByRole('button',{name:'영구 삭제'}).click();
    assert.deepEqual(await page.locator('#bulk-delete-list [data-task-target]').evaluateAll(els=>els.map(e=>e.dataset.taskTarget)),['eb','ea','es']);
    await page.locator('#bulk-delete-submit').click();assert.equal(await page.evaluate(()=>state.expTasks.b.length),0);
    // An explicitly opened hidden source is manageable; other hidden owners stay excluded.
    await page.locator('#paused-char-th1').getByRole('button',{name:'영구 삭제'}).click();
    assert.equal(await page.locator('#bulk-delete-list [data-task-target="th1"]').isChecked(),true);
    await page.locator('#bulk-delete-submit').click();assert.equal(await page.evaluate(()=>state.tasks.h1.length),0);
    await page.evaluate(()=>openBulkDelete('tb1',false,'b1'));assert.equal(await page.locator('#bulk-delete-list').getAttribute('data-allowed-hidden-owner'),'');
    await page.evaluate(()=>{closeModal('modal-bulk-delete');localStorage.setItem('la_test_now',String(Date.now()));});
    const calls=await page.evaluate(()=>window.deleteCalls.length);
    await page.locator('#paused-char-other').getByRole('button',{name:'영구 삭제'}).click();await page.locator('#bulk-delete-submit').click();
    assert.equal(await page.evaluate(()=>window.deleteCalls.length),calls,'test mode wrote to DB');
    assert.match(dialogs.at(-1),/테스트 화면에서만/);
    assert.deepEqual(errors,[]);
    console.log('PASS: account/card order across copy/delete/edit/catalog and reorder; paused grouped/inherited/account deletion, descendants, cancellation/failure, hidden source, test mode, desktop/mobile, four-page static checks');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
