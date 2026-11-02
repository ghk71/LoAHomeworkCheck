// Isolated rendering and interaction regression. No production DB requests.
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
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',route=>{
      const url=new URL(route.request().url());
      if(url.href==='http://localhost/party_generation.html')return route.fulfill({contentType:'text/html',body:fs.readFileSync('party_generation.html','utf8')});
      if(url.pathname.endsWith('supabase.min.js'))return route.fulfill({contentType:'text/javascript',body:'window.supabase={createClient:()=>({})}'});
      if(url.origin==='http://localhost'&&url.pathname==='/images/homework/cube4.png')return route.fulfill({contentType:'image/png',body:fs.readFileSync('images/homework/cube4.png')});
      return route.fulfill({body:''});
    });
    await page.goto('http://localhost/party_generation.html');
    await page.evaluate(()=>{
      saveLocalWorkbenchState=()=>{};
      state.accounts=Array.from({length:8},(_,i)=>({id:'a'+i,name:'계정 '+(i+1),sort_order:i}));
      const powers=['6000.25',8000.75,null,0,4000,5000,9000,7000];
      state.chars=powers.map((power,i)=>({id:'c'+i,account_id:'a'+i,name:i===1?'아주긴캐릭터이름확인':'캐릭터 '+(i+1),class_name:i===1?'홀리나이트':'버서커',item_level:1800,combat_power:power,icon_url:'images/homework/cube4.png'}));
      state.selectedChars=new Set(state.chars.map(c=>c.id));
      state.raids=[{id:'r',name:'지평의 성당',difficulty:'3단계',entry_level:1750}];
      state.partyDrafts=[{id:'p4',preset_id:'r',name:'4인 파티',party_size:4,slots:['c0',null,null,null]},{id:'p8',preset_id:'r',name:'8인 파티',party_size:8,slots:Array(8).fill(null)}];
      buildDefaultCandidates();
      document.getElementById('setup').style.display='none';document.getElementById('app').classList.add('active');render();
    });
    const cards=page.locator('.party-card');
    assert.equal(await cards.nth(0).locator('.party-power strong').innerText(),'6,000.25');
    assert.equal(await cards.nth(1).locator('.party-power strong').innerText(),'-');
    assert.match(await page.locator('.pool-chip').filter({hasText:'아주긴캐릭터'}).innerText(),/8,000.75/);
    // Exercise the actual drag handlers, including candidate removal and average refresh.
    await page.locator('.pool-chip').filter({hasText:'아주긴캐릭터'}).dragTo(cards.nth(0).locator('.slot').nth(1));
    assert.equal(await cards.nth(0).locator('.party-power strong').innerText(),'7,000.5');
    assert.equal(await page.locator('.pool-chip').filter({hasText:'아주긴캐릭터'}).count(),0);
    assert.match(await cards.nth(0).locator('.slot').nth(1).innerText(),/투력 8,000.75/);
    await page.evaluate(()=>{assignToSlot('c2','r','p4',2);render();});
    assert.equal(await cards.nth(0).locator('.party-power strong').innerText(),'7,000.5');
    assert.equal(await cards.nth(0).locator('.party-power-missing').innerText(),'미등록 1명');
    await cards.nth(0).locator('.slot').nth(1).locator('button').click();
    assert.equal(await cards.nth(0).locator('.party-power strong').innerText(),'6,000.25');
    await page.evaluate(()=>{
      sb={from:()=>({update:()=>({eq:async()=>({error:null})})})};
      openCharacterEdit('c0');
      document.getElementById('pg-character-combat').value='10000';
    });
    await page.locator('#character-edit-save-btn').click();
    assert.equal(await cards.nth(0).locator('.party-power strong').innerText(),'10,000');
    await cards.nth(0).locator('.collapse-btn').click();
    assert.equal(await cards.nth(0).locator('.party-power').isVisible(),true);
    await page.evaluate(()=>{
      for(let i=0;i<8;i++)assignToSlot('c'+i,'r','p8',i);
      render();
    });
    assert.equal(await cards.nth(0).locator('.party-power strong').innerText(),'-');
    assert.equal(await cards.nth(1).locator('.party-power strong').innerText(),'7,166.79');
    assert.equal(await cards.nth(1).locator('.party-power-missing').innerText(),'미등록 2명');
    assert.deepEqual(await page.evaluate(()=>[null,undefined,'',0,-1,'bad',Infinity].map(combat_power=>characterCombatPower({combat_power}))),Array(7).fill(null));
    // Leave candidates visible alongside a populated 8-person party for layout checks.
    await page.evaluate(()=>{clearSlot('p8',6);clearSlot('p8',7);});
    for(const width of [1440,1024,390]){
      await page.setViewportSize({width,height:1000});
      await page.locator('#right-panel').scrollIntoViewIfNeeded();
      await page.screenshot({path:path.join(os.tmpdir(),'loa-party-combat-'+width+'.png')});
      assert.equal(await page.locator('.party-card,.slot,.pool-chip,.party-power').evaluateAll(els=>els.every(el=>el.scrollWidth<=el.clientWidth+1)),true,'power content overflow at '+width);
      assert.equal(await page.locator('#right-panel').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,'right panel overflow at '+width);
      assert.equal(await page.locator('#right-panel img').evaluateAll(els=>els.every(el=>el.complete&&el.naturalWidth>0)),true,'broken images');
    }
    assert.deepEqual(errors,[]);
    console.log('PASS: candidate/member power, drag/drop/remove, live edit, 4/8-person averages, missing values, collapse, 1440/1024/390px, four-page static checks');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
