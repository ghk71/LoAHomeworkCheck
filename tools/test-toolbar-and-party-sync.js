// All browser requests are intercepted. These tests never contact Supabase.
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');

(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('dialog',dialog=>dialog.accept());
    await page.route('**/*',route=>{
      const url=route.request().url();
      if(url==='http://localhost/index.html'||url==='http://localhost/party_generation.html')return route.fulfill({contentType:'text/html',body:fs.readFileSync(url.split('/').pop(),'utf8')});
      if(url.includes('supabase.min.js'))return route.fulfill({contentType:'text/javascript',body:'window.supabase={createClient:()=>({})}'});
      return route.fulfill({body:''});
    });
    await page.goto('http://localhost/index.html');
    await page.evaluate(()=>{
      localStorage.setItem('la_test_now',String(Date.parse('2026-10-21T12:00:00+09:00')));
      state.accounts=[{id:'a',name:'본계정'},{id:'b',name:'부계정',parent_account_id:'a'},{id:'hidden',name:'숨김 계정'},{id:'excluded',name:'필터 제외 계정',hide_from_filters:true}];
      state.chars=[{id:'c1',account_id:'a',name:'첫 캐릭터'},{id:'c2',account_id:'b',name:'두 번째 캐릭터'},{id:'ch',account_id:'hidden',name:'숨김 캐릭터'},{id:'ce',account_id:'excluded',name:'필터 제외 캐릭터'}];
      state.hiddenAccounts=new Set(['hidden']);state.tasks={c1:[],c2:[],ch:[],ce:[]};state.expTasks={a:[],b:[],hidden:[],excluded:[]};state.selectedAccount='a';
      state.mode='daily';state.hideCompleted=true;state.showInactive=false;
      document.getElementById('setup').style.display='none';document.getElementById('app').classList.add('active');render();
    });
    assert.equal(await page.locator('.tool-actions button').filter({hasText:/^(디스코드 전송|무결성 검사|새로고침)$/}).count(),0);
    await page.getByRole('button',{name:'보기 옵션',exact:true}).click();
    assert.equal(await page.locator('#hide-done-switch').getAttribute('aria-checked'),'false');
    await page.locator('#hide-done-switch').click();await page.locator('#show-inactive-switch').click();
    assert.deepEqual(await page.evaluate(()=>[state.hideCompleted,state.showInactive,localStorage.getItem('la_redesign_hide_done')]),[false,true,'0']);
    await page.locator('[name="task-action-mode"][value="edit"]').check();
    assert.equal(await page.evaluate(()=>state.actionMode),'edit');
    await page.locator('[name="task-action-mode"][value="normal"]').check();
    await page.evaluate(()=>openGlobalTaskCreate());
    assert.equal(await page.locator('#modal-task-start').evaluate(el=>el.classList.contains('open')),false);
    assert.equal(await page.locator('#task-reset').inputValue(),'daily');
    await page.locator('#task-name').fill('선택 일일 숙제');await page.locator('#task-submit-btn').click();
    assert.deepEqual(await page.evaluate(()=>selectedTaskTargets('task-draft-targets')),[]);
    await page.locator('#task-draft-save').click();
    assert.deepEqual(await page.evaluate(()=>[state.tasks.c1.length,state.tasks.c2.length]),[0,0]);
    assert.deepEqual(await page.locator('#task-draft-targets [data-task-target]').evaluateAll(els=>els.map(el=>el.dataset.taskTarget)),['c1','c2']);
    await page.locator('#task-draft-targets [data-task-target="c1"]').check();
    await page.locator('#task-draft-targets input[type="search"]').fill('두 번째');
    await page.locator('#task-draft-targets [data-task-target="c2"]').check();
    await page.locator('#task-draft-targets input[type="search"]').fill('');
    await page.evaluate(()=>{
      window.previewChars=state.chars;
      state.taskDraft.selected=selectedTaskTargets('task-draft-targets');
      state.chars=[...state.chars,...Array.from({length:28},(_,i)=>({id:'preview-'+i,account_id:i%2?'a':'b',name:i===0?'아주 긴 캐릭터 이름의 줄바꿈 확인':`캐릭터 ${i+3}`,class_name:i%2?'가디언나이트':'바드'}))];
      renderTaskDraft();
    });
    for(const width of [1280,390]){
      await page.setViewportSize({width,height:900});
      assert.equal(await page.locator('#modal-task-draft .modal').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
      await page.screenshot({path:path.join(os.tmpdir(),'loa-toolbar-targets-'+width+'.png')});
    }
    await page.evaluate(()=>{state.chars=window.previewChars;renderTaskDraft();});
    assert.deepEqual(await page.evaluate(()=>selectedTaskTargets('task-draft-targets')),['c1','c2']);
    await page.locator('#task-draft-save').click();
    assert.deepEqual(await page.evaluate(()=>[state.tasks.c1.length,state.tasks.c2.length]),[1,1]);
    await page.evaluate(()=>setActionMode('edit'));
    assert.equal(await page.locator('.task-row .action-child:visible').count(),0);
    await page.evaluate(()=>setActionMode('child'));
    assert.equal(await page.locator('.task-row .action-edit:visible').count(),0);
    await page.locator('.task-row .action-child:visible').first().click();
    assert.equal(await page.evaluate(()=>state.createParentId),await page.evaluate(()=>state.tasks.c1[0].id));
    await page.evaluate(()=>{closeModal('modal-create');finishActionMode();});
    await page.evaluate(()=>{
      const source=state.tasks.c1[0];
      state.tasks.ch=[{...source,id:'hidden-task',character_id:'ch'}];
      state.tasks.ce=[{...source,id:'excluded-task',character_id:'ce'}];
      state.showHiddenAccounts=true;
    });
    for(const operation of ['copy','delete','edit']){
      await page.evaluate(async op=>{
        const t=state.tasks.c1[0];
        if(op==='copy')await openCopyTask(t.id,false,'c1');
        if(op==='delete')await openBulkDelete(t.id,false,'c1');
        if(op==='edit'){openEditTask(t.id,false,'c1');await openTaskGroupEdit({...t,name:'visible only'});}
      },operation);
      const selector=operation==='copy'?'#copy-task-list':operation==='delete'?'#bulk-delete-list':'#task-group-targets';
      assert.equal(await page.locator(selector).getByText(/숨김 계정|숨김 캐릭터|필터 제외/).count(),0);
      await page.evaluate(()=>document.querySelectorAll('.overlay.open').forEach(el=>el.classList.remove('open')));
    }
    await page.evaluate(async()=>{
      const t=state.tasks.c1[0];openEditTask(t.id,false,'c1',true);await openTaskGroupEdit({...t,name:'전체 수정 결과'},true);
    });
    assert.deepEqual(await page.evaluate(()=>[state.tasks.c1[0].name,state.tasks.c2[0].name,state.tasks.ch[0].name,state.tasks.ce[0].name]),['전체 수정 결과','전체 수정 결과','선택 일일 숙제','선택 일일 숙제']);
    assert.deepEqual(await page.evaluate(()=>taskCatalogGroups().flatMap(g=>g.entries.map(e=>e.ownerId))),['c1','c2']);
    for(const [mode,id,scope] of [['weekly','c2','char'],['account','b','account']]){
      await page.evaluate(mode=>{setMode(mode);openGlobalTaskCreate();},mode);
      assert.deepEqual(await page.evaluate(()=>[state.createTarget.scope,document.getElementById('task-reset').value]),[scope,'weekly']);
      await page.locator('#task-name').fill('주기별 생성');await page.locator('#task-submit-btn').click();
      assert.equal(await page.locator('#task-draft-targets').getByText(/숨김 계정|숨김 캐릭터|필터 제외/).count(),0);
      await page.locator('#task-draft-targets [data-task-target="'+id+'"]').check();
      await page.evaluate(()=>closeModal('modal-task-draft'));
    }
    await page.evaluate(()=>{setMode('onetime');openGlobalTaskCreate();});
    await page.locator('#task-start-name').fill('한 번만 하기');
    await page.locator('[name="task-start-owner"][value="account"]').check();
    assert.deepEqual(await page.locator('#task-start-targets [data-task-target]').evaluateAll(els=>els.map(el=>el.dataset.taskTarget)),['a','b']);
    await page.locator('#task-start-targets [data-task-target="a"]').check();await page.locator('#task-start-next').click();
    assert.equal(await page.evaluate(()=>state.oneTimeTasks.account.a[0].name),'한 번만 하기');
    await page.evaluate(()=>openGlobalTaskCreate());
    await page.locator('#task-start-name').fill('캐릭터 일회용');
    await page.locator('#task-start-targets [data-task-target="c2"]').check();await page.locator('#task-start-next').click();
    assert.equal(await page.evaluate(()=>state.oneTimeTasks.character.c2.length),1);
    await page.evaluate(()=>openCreateTask('char','c1','daily'));
    await page.locator('#task-name').fill('카드에서 추가');await page.locator('#task-submit-btn').click();
    assert.deepEqual(await page.evaluate(()=>selectedTaskTargets('task-draft-targets')),['c1']);
    const rest=await page.evaluate(()=>restBox({rest_enabled:true,rest_current:20,rest_max:100,rest_charge:10,rest_consume:20,rest_threshold:0},false,'c1'));
    assert(!rest.includes('충전 '));assert(!rest.includes('항상 활성'));assert(rest.includes('20/100'));
    await page.evaluate(()=>{document.querySelectorAll('.overlay.open').forEach(el=>el.classList.remove('open'));setMode('daily');});
    for(const width of [1280,390]){
      await page.setViewportSize({width,height:900});
      await page.getByRole('button',{name:'보기 옵션',exact:true}).click();
      assert.equal(await page.locator('#options-panel').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;}),true);
      await page.getByRole('button',{name:'보기 옵션',exact:true}).click();
      await page.screenshot({path:path.join(os.tmpdir(),'loa-toolbar-'+width+'.png')});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    }
    await page.goto('http://localhost/party_generation.html');
    const results=await page.evaluate(async()=>{
      state.accounts=[{id:'a',name:'계정'}];state.chars=[{id:'c',account_id:'a',name:'캐릭터',item_level:1700}];
      state.raids=[{id:'wh',name:'W',difficulty:'하드',entry_level:1750},{id:'wn',name:'W',difficulty:'노말',entry_level:1700},{id:'x',name:'X',difficulty:'노말'}];
      state.parties=[{id:'p',preset_id:'wh',name:'원래 파티',party_size:4,sort_order:0}];
      state.members=[{id:'m',party_id:'p',character_id:'c',slot_index:0}];
      state.raidTasks=[];buildInitialDraft();
      state.candidateMap={c:{W:{checked:false,presetId:'wn'},X:{checked:false,presetId:'x'}}};
      state.candidateChanges={};state.hiddenPresets=new Set(['wh']);
      const originalTasks=[{id:'tw',character_id:'c',preset_id:'wh',name:'W 하드',is_completed:true},{id:'tx',character_id:'c',preset_id:'x',name:'X 노말'},{id:'custom',character_id:'c',name:'별도 숙제'}];
      window.fresh=originalTasks;
      fetchAllPages=async()=>({data:window.fresh,error:null});
      filteredChars=()=>state.chars;
      const unchanged=await buildRaidTaskSyncMutations();
      state.partyDrafts=[];
      const excludedAutomatically=await buildRaidTaskSyncMutations();
      state.candidateChanges={c:{W:{checked:false,presetId:'wn'}}};
      const excludedExplicitly=await buildRaidTaskSyncMutations();
      state.candidateChanges={c:{W:{checked:true,presetId:'wn'}}};state.candidateMap.c.W={checked:true,presetId:'wn'};
      const changedDifficulty=await buildRaidTaskSyncMutations();
      window.fresh=[...originalTasks,{id:'tn',character_id:'c',preset_id:'wn',name:'W 노말'}];
      const duplicates=await buildRaidTaskSyncMutations();
      window.fresh=originalTasks;state.candidateChanges={};state.candidateMap.c.W.checked=false;
      state.partyDrafts=[{id:'new_p',preset_id:'wn',name:'새 파티',party_size:4,sort_order:1,slots:['c',null,null,null]}];
      const assigned=await buildRaidTaskSyncMutations();
      state.partyDrafts=[];state.removedPartyIds=new Set(['p']);
      const partyRemoved=await buildRaidTaskSyncMutations();
      state.partyDrafts=[];
      applyWorkbenchPayload({parties:[]});
      const missingLegacyPreserved=state.partyDrafts.map(p=>p.id);
      state.partyDrafts=[basePartyDraft(state.parties[0])];
      const same=partyDraftChanged(state.partyDrafts[0]);state.partyDrafts[0].slots[0]=null;
      const moved=partyDraftChanged(state.partyDrafts[0]);
      return {unchanged,excludedAutomatically,excludedExplicitly,changedDifficulty,duplicates,assigned,partyRemoved,missingLegacyPreserved,same,moved};
    });
    assert.deepEqual(results.unchanged,[]);
    assert.deepEqual(results.excludedAutomatically,[]);
    assert.deepEqual(results.excludedExplicitly,[{op:'delete',id:'tw'}]);
    assert.equal(results.changedDifficulty.length,1);assert.equal(results.changedDifficulty[0].id,'tw');assert.equal(results.changedDifficulty[0].patch.preset_id,'wn');
    assert.deepEqual(results.duplicates.filter(m=>m.op==='delete'),[{op:'delete',id:'tw'}]);
    assert.equal(results.assigned[0].patch.preset_id,'wn');assert.deepEqual(results.partyRemoved,[]);
    assert.deepEqual(results.missingLegacyPreserved,['p']);assert.equal(results.same,false);assert.equal(results.moved,true);
    const edits=await page.evaluate(()=>{
      render=()=>{};saveLocalWorkbenchState=()=>{};
      state.partyDrafts=[basePartyDraft(state.parties[0])];state.removedPartyIds=new Set();
      state.candidateMap={c:{W:{checked:true,presetId:'wh',allowLowLevel:true,manual:true},X:{checked:false,presetId:'x',allowLowLevel:false,manual:true}}};state.candidateChanges={};
      openCandidateEdit('c');
      document.querySelector('[data-group="W"]').checked=false;saveCandidateEdit();
      const unchecked={change:state.candidateChanges.c.W,slots:state.partyDrafts[0].slots,payload:draftPayload()};
      state.partyDrafts=[basePartyDraft(state.parties[0])];hidePreset('wh');
      const hidden=applicablePartyDrafts().length;unhidePreset('wh');
      const restored=applicablePartyDrafts().length;
      return {unchecked,hidden,restored};
    });
    assert.equal(edits.unchecked.change.checked,false);assert(edits.unchecked.slots.every(id=>id===null));
    assert.equal(edits.unchecked.payload.candidateChanges.c.W.checked,false);assert.equal(edits.hidden,0);assert.equal(edits.restored,1);
    const applies=await page.evaluate(async()=>{
      const calls=[];sb={rpc:async(name,args)=>{calls.push(args);return {error:null};}};
      validateDraft=()=>({errors:[]});renderStatus=()=>{};
      state.candidateMap={};state.candidateChanges={};state.removedPartyIds=new Set();state.workbenchSaving=false;
      state.partyDrafts=[basePartyDraft(state.parties[0])];
      loadData=async()=>{state.partyDrafts=[basePartyDraft(state.parties[0])];};
      saveWorkbenchStateToDb=async()=>{window.savedPayload=draftPayload();};
      await applyDraft();
      state.removedPartyIds=new Set(['p']);state.partyDrafts=[];
      await applyDraft();
      return {calls,saved:window.savedPayload,locked:document.getElementById('app').inert};
    });
    assert.deepEqual(applies.calls[0].p_parties,[]);assert.deepEqual(applies.calls[0].p_task_mutations,[]);assert.deepEqual(applies.calls[0].p_delete_party_ids,[]);
    assert.deepEqual(applies.calls[1].p_delete_party_ids,['p']);assert.deepEqual(applies.calls[1].p_task_mutations,[]);
    assert.deepEqual(applies.saved.removedPartyIds,[]);assert.equal(applies.locked,false);
    assert.deepEqual(errors,[]);
    console.log('PASS: toolbar, unified switches, four creation modes, targets, rest labels, 390/1280px; unchanged raids, explicit exclusions, difficulty swaps, hidden presets, party deletion and no-op apply.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
