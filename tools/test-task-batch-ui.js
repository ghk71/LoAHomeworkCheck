// Isolated browser regression: all network traffic is mocked; production data is never used.
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const html=fs.readFileSync('index.html','utf8');
for(const name of ['index','raid','overview','party_generation']){
  const text=fs.readFileSync(name+'.html','utf8');
  assert.equal(text.slice(text.toLowerCase().lastIndexOf('</html>')+7).trim(),'');
  const defined=new Set([...text.matchAll(/(--[\w-]+)\s*:/g)].map(m=>m[1]));
  assert.equal([...text.matchAll(/var\(\s*(--[\w-]+)/g)].filter(m=>!defined.has(m[1])).length,0,name);
  for(const match of text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))if(match[1].trim())new vm.Script(match[1]);
}
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
    await page.route('**/*',route=>{
      if(route.request().url()==='http://localhost/index.html')return route.fulfill({contentType:'text/html',body:html});
      if(route.request().url().includes('supabase.min.js'))return route.fulfill({contentType:'text/javascript',body:'window.supabase={createClient:()=>({})}'});
      return route.fulfill({body:''});
    });
    await page.goto('http://localhost/index.html');
    await page.evaluate(()=>{
      localStorage.setItem('la_test_now',String(Date.parse('2026-10-08T12:00:00+09:00')));
      state.accounts=[{id:'a',name:'본계정'},{id:'b',name:'부계정',parent_account_id:'a'}];state.hiddenAccounts=new Set();
      state.chars=[{id:'c1',account_id:'a',name:'첫 번째 캐릭터',class_name:'바드'},{id:'c2',account_id:'b',name:'두 번째 캐릭터',class_name:'도화가'},{id:'c3',account_id:'a',name:'세 번째 캐릭터',class_name:'버서커'}];
      state.tasks={c1:[],c2:[],c3:[]};state.expTasks={a:[],b:[]};state.selectedAccount='a';state.mode='daily';state.hideCompleted=false;state.showInactive=true;
      document.getElementById('setup').style.display='none';document.getElementById('app').classList.add('active');render();openCreateTask('char','c1','daily');
    });
    await page.locator('#task-name').fill('A 숙제');await page.locator('#task-submit-btn').click();
    assert.equal(await page.locator('#modal-task-draft').evaluate(el=>el.classList.contains('open')),true);
    await page.locator('#task-draft-targets [data-task-target="c2"]').check();
    await page.locator('#task-draft-targets [type=search]').fill('두 번째');
    assert.equal(await page.locator('#task-draft-targets .task-target-option:visible').count(),1);
    assert.deepEqual(await page.evaluate(()=>selectedTaskTargets('task-draft-targets')),['c1','c2']);
    await page.locator('#task-draft-targets [type=search]').fill('');
    await page.locator('#task-draft-nodes').getByRole('button',{name:'하위 추가',exact:true}).click();
    await page.locator('#task-name').fill('A1');await page.locator('#task-submit-btn').click();
    await page.locator('#task-draft-nodes .task-draft-node').nth(1).getByRole('button',{name:'하위 추가',exact:true}).click();
    await page.locator('#task-name').fill('A1-1');await page.locator('#task-submit-btn').click();
    await page.locator('#task-draft-nodes .task-draft-node').first().getByRole('button',{name:'하위 추가',exact:true}).click();
    await page.locator('#task-name').fill('A2');await page.locator('#task-submit-btn').click();
    assert.equal(await page.locator('.task-draft-node').count(),4);
    const out=process.env.TEST_SCREENSHOT_DIR||require('node:os').tmpdir();
    await page.screenshot({path:path.join(out,'loa-batch-desktop.png')});
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:path.join(out,'loa-batch-mobile.png')});
    assert.equal(await page.locator('#modal-task-draft .modal').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,'mobile overflow');
    await page.locator('#task-draft-save').click();
    const data=await page.evaluate(()=>state.tasks);
    assert.equal(data.c1.length,4);assert.equal(data.c2.length,4);assert.equal(data.c3.length,0);
    const a1=data.c1.find(t=>t.name==='A1');
    assert.ok(await page.locator('#task-'+data.c1.find(t=>t.name==='A1-1').id).isVisible(),'nested child not rendered');
    await page.evaluate(id=>openCopyTask(id,false,'c1'),a1.id);
    await page.locator('#copy-task-list [data-task-target="c3"]').check();
    await page.locator('#modal-copy-task .primary').click();
    const third=await page.evaluate(()=>state.tasks.c3);
    assert.equal(third.length,3);assert.equal(third.find(t=>t.name==='A1').parent_id,third.find(t=>t.name==='A 숙제').id);
    await page.evaluate(id=>openCopyTask(id,false,'c1'),a1.id);
    await page.locator('#copy-task-list [data-task-target="c3"]').check();await page.locator('#modal-copy-task .primary').click();
    assert.equal(await page.evaluate(()=>state.tasks.c3.length),3);
    await page.evaluate(id=>openEditTask(id,false,'c1'),a1.id);
    await page.locator('#task-name').fill('선택한 캐릭터만 수정');await page.locator('#task-group-edit-btn').click();
    await page.locator('#task-group-all').uncheck();
    await page.locator('#task-group-search').fill('두 번째');
    const secondId=data.c2.find(t=>t.name==='A1').id;
    await page.locator('[data-group-target="'+secondId+'"]').check();
    await page.locator('#task-group-save-btn').click();
    assert.equal(await page.evaluate(id=>state.tasks.c1.find(t=>t.id===id).name,a1.id),'A1');
    assert.equal(await page.evaluate(id=>state.tasks.c2.find(t=>t.id===id).name,secondId),'선택한 캐릭터만 수정');
    await page.evaluate(id=>openBulkDelete(id,false,'c1'),a1.id);
    await page.locator('#bulk-delete-list [data-task-target="'+a1.id+'"]').uncheck();
    await page.locator('#bulk-delete-list [data-task-target="'+secondId+'"]').check();
    await page.locator('#bulk-delete-submit').click();
    assert.equal(await page.evaluate(()=>state.tasks.c2.length),2);assert.equal(await page.evaluate(()=>state.tasks.c1.length),4);
    // Add under an existing parent on another character, including missing parent creation.
    const root=data.c1.find(t=>t.name==='A 숙제');
    await page.evaluate(id=>openCreateSubTask(id,false,'c1'),root.id);
    await page.locator('#task-name').fill('A3');await page.locator('#task-submit-btn').click();
    await page.locator('#task-draft-targets [data-task-target="c1"]').uncheck();
    await page.locator('#task-draft-targets [data-task-target="c3"]').check();
    await page.locator('#task-draft-save').click();
    assert.equal(await page.evaluate(()=>state.tasks.c3.find(t=>t.name==='A3').parent_id),third.find(t=>t.name==='A 숙제').id);
    // Simulated RPC failures keep the draft and reuse the same request id on retry.
    await page.evaluate(()=>openCreateTask('account','a','weekly'));
    await page.locator('#task-name').fill('계정 숙제');await page.locator('#task-submit-btn').click();
    await page.locator('#task-draft-targets [data-task-target="b"]').check();
    await page.evaluate(()=>{localStorage.removeItem('la_test_now');window.calls=[];sb={rpc:async(name,args)=>{window.calls.push({name,args});return {error:{code:'42883',message:'function uuid_generate_v4() does not exist',details:null,hint:'No function matches the given name and argument types.'}};}};});
    await page.locator('#task-draft-save').click();await page.locator('#task-draft-save').click();
    const calls=await page.evaluate(()=>window.calls);assert.equal(calls.length,2);assert.equal(calls[0].args.p_request_id,calls[1].args.p_request_id);
    assert.equal(await page.locator('#modal-task-draft').evaluate(el=>el.classList.contains('open')),true);
    assert.equal(await page.locator('#task-draft-save').isDisabled(),false);
    assert.match(await page.locator('#toast').innerText(),/20261021_task_uuid_search_path.sql/);
    await page.evaluate(()=>taskOperationError({code:'PGRST202',message:'Could not find function in schema cache'}));
    assert.match(await page.locator('#toast').innerText(),/20261008_task_batch_workflow.sql/);
    await page.evaluate(()=>taskOperationError({code:'42883',message:'function another_helper() does not exist'}));
    assert.match(await page.locator('#toast').innerText(),/\[42883\].*another_helper/);
    assert.doesNotMatch(await page.locator('#toast').innerText(),/20261008/);
    assert.ok(fs.existsSync(await page.locator('link[rel="icon"]').getAttribute('href')),'favicon asset missing');
    assert.deepEqual(errors,[]);
    console.log('UI: draft hierarchy, account search/selection, nested rendering, parent-aware copy, selected edit/delete, add-child targeting, retry, 390/1280px and four-page static checks passed');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
