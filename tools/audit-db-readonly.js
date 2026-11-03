// Read-only production audit: GET requests only. Credentials come from environment variables.
// Reports stay outside the repository by default and contain no API keys/share-link payloads.
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const vm=require('node:vm');
const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_ANON_KEY;
if(!base||!key)throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required');
const tables={
  accounts:'id,name,parent_account_id,hide_from_filters,sort_order',
  characters:'id,account_id,name,sort_order,show_raid_tasks,show_currencies,show_custom_notes',
  tasks:'*',expedition_tasks:'*',raid_tasks:'*',one_time_tasks:'*',
  currencies:'id,character_id,name',custom_popups:'id,character_id,title',character_cores:'id,character_id,updated_at',
  raid_presets:'id,name,difficulty',raid_parties:'id,name,preset_id,is_temporary,temp_week_start_date',
  raid_party_members:'id,party_id,character_id',raid_schedules:'id,party_id,is_fixed,week_start_date',
  raid_schedule_overrides:'id,schedule_id,week_start_date,temp_changes',
  party_generation_drafts:'id,name,updated_at',discord_sent_messages:'id,kind,week_start_date,deleted_at,delete_after',
  task_batch_requests:'id,created_at'
};
async function query(table,select,offset=0,limit=400,order='id'){
  const url=new URL('/rest/v1/'+table,base);
  url.search=new URLSearchParams({select,offset:String(offset),limit:String(limit),...(order?{order:order+'.asc'}:{})}).toString();
  const response=await fetch(url,{method:'GET',headers:{apikey:key,Prefer:'count=exact'},signal:AbortSignal.timeout(30000)});
  if(!response.ok){const body=await response.json().catch(()=>({}));throw new Error(table+': HTTP '+response.status+' '+(body.message||body.code||''));}
  const total=Number(response.headers.get('content-range')?.split('/')[1]);
  if(!Number.isFinite(total))throw new Error(table+': missing exact row count');
  return {rows:await response.json(),total};
}
async function readTable(table,select){
  const rows=[];let total=null;
  do{
    const page=await query(table,select,rows.length);
    if(total!==null&&total!==page.total)throw new Error(table+': row count changed during audit; rerun');
    total=page.total;
    if(!page.rows.length&&rows.length<total)throw new Error(table+': incomplete pagination');
    rows.push(...page.rows);
  }while(rows.length<total);
  if(new Set(rows.map(r=>r.id)).size!==rows.length)throw new Error(table+': duplicate page IDs');
  return rows;
}
async function main(){
  const snapshot={},counts={},errors=[];
  for(const [table,select] of Object.entries(tables)){
    try{snapshot[table]=await readTable(table,select);counts[table]=snapshot[table].length;console.log(table+': '+counts[table]);}
    catch(error){errors.push(error.message);console.log(error.message);}
  }
  for(const [table,select] of Object.entries({raid_group_settings:'name',raid_notices:'id',raid_notice_comments:'id',share_links:'created_at',task_lineage_backup_20261008:'task_id'})){
    try{counts[table]=(await query(table,select,0,1,null)).total;}catch(error){errors.push(error.message);}
  }
  if(!snapshot.accounts||!snapshot.characters||!snapshot.tasks||!snapshot.expedition_tasks)throw new Error('Core queries incomplete; cannot classify tasks');
  const now=new Date(),accounts=new Map(snapshot.accounts.map(r=>[r.id,r])),chars=new Map(snapshot.characters.map(r=>[r.id,r]));
  const issues=[];
  function item(table,row,reason,category,extra={}){
    const ch=chars.get(row.character_id||(row.owner_type==='character'?row.owner_id:null));
    const acc=accounts.get(row.account_id||ch?.account_id||(row.owner_type==='account'?row.owner_id:null));
    issues.push({category,table,id:row.id,account:acc?.name||null,character:ch?.name||null,name:row.name||row.title||null,reason,...extra});
  }
  // Run actual render functions without init/event registration or any browser/DB side effects.
  const html=fs.readFileSync('index.html','utf8');
  const script=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes('function renderTaskGroups'));
  const marker="document.querySelectorAll('.overlay').forEach";
  if(!script?.includes(marker))throw new Error('Could not isolate renderer; review audit script');
  const context=vm.createContext({console,window:{addEventListener:()=>{}},supabase:{createClient:()=>{throw new Error('Audit cannot create DB clients');}},localStorage:{getItem:()=>null},snapshot,Date,Map,Set,Intl,URL,structuredClone,crypto:require('node:crypto').webcrypto});
  vm.runInContext(script.slice(0,script.indexOf(marker)),context,{timeout:10000});
  vm.runInContext(`
    state.accounts=snapshot.accounts;state.chars=snapshot.characters;state.hideCompleted=false;state.showInactive=true;
    state.tasks={};state.expTasks={};
    snapshot.tasks.forEach(t=>(state.tasks[t.character_id]??=[]).push(t));
    snapshot.expedition_tasks.forEach(t=>(state.expTasks[t.account_id]??=[]).push(t));
  `,context);
  const visibility={};
  for(const [table,ownerField,isExp] of [['tasks','character_id',false],['expedition_tasks','account_id',true]]){
    const rows=snapshot[table],byId=new Map(rows.map(t=>[t.id,t])),owners=isExp?accounts:chars;
    const rendered=new Set();
    for(const owner of owners.values()){
      context.auditOwner=owner.id;context.auditExp=isExp;
      const output=vm.runInContext("renderTaskGroups(getTaskList(auditExp,auditOwner),auditExp,auditOwner,()=>true)",context,{timeout:10000});
      for(const match of output.matchAll(/id="task-([^"]+)"/g))rendered.add(match[1]);
    }
    let pausedCount=0,brokenCount=0,unexplainedCount=0;
    for(const row of rows){
      const owner=owners.get(row[ownerField]);let reason='';
      if(!owner)reason='소유 캐릭터/계정 없음';
      else if(!isExp&&!accounts.has(owner.account_id))reason='캐릭터의 계정 연결 없음';
      let cur=row;const chain=[],seen=new Set();
      while(cur&&!reason){
        if(seen.has(cur.id)){reason='부모 연결 순환';break;}
        seen.add(cur.id);chain.push(cur);
        if(!cur.parent_id)break;
        const parent=byId.get(cur.parent_id);
        if(!parent){reason='부모 숙제 없음';break;}
        if(parent[ownerField]!==row[ownerField]){reason='다른 캐릭터/계정의 숙제가 부모';break;}
        cur=parent;
      }
      if(reason){item(table,row,reason,'structural_missing',{parent_id:row.parent_id,owner_id:row[ownerField]});brokenCount++;continue;}
      if(chain.some(t=>t.is_paused===true)){item(table,row,'본인 또는 상위 숙제 일시중지','paused',{parent_id:row.parent_id});pausedCount++;continue;}
      if(!rendered.has(row.id)){item(table,row,'표시 옵션을 풀어도 렌더링에서 누락','unexplained_missing');unexplainedCount++;}
      context.auditRow=row;
      const active=vm.runInContext('isActive(auditRow)',context),done=vm.runInContext('isDone(auditRow)',context);
      if(!active)item(table,row,'비활성 조건 (휴식 게이지/활성 요일); 보기 옵션에 따라 숨김','conditional_hidden');
      if(done)item(table,row,'현재 주기의 완료 숙제; 완료 숨기기 옵션에 따라 숨김','conditional_hidden');
    }
    visibility[table]={total:rows.length,renderedWithFiltersOff:rendered.size,paused:pausedCount,structuralMissing:brokenCount,unexplainedMissing:unexplainedCount};
  }
  const dayBoundary=vm.runInContext("getLastResetUTC('daily',3).toISOString()",context);
  const week=vm.runInContext('getRaidWeekKey()',context);
  for(const row of snapshot.one_time_tasks||[]){
    const valid=row.owner_type==='character'?chars.has(row.owner_id):row.owner_type==='account'&&accounts.has(row.owner_id);
    if(!valid)item('one_time_tasks',row,'소유자 없음 또는 소유 유형 오류','structural_missing');
    else if(row.is_completed&&row.completed_at&&row.completed_at<=dayBoundary)item('one_time_tasks',row,'완료 후 일일 초기화 경과: 기존 자동 정리 대상','expired_onetime');
    else if(row.is_completed)item('one_time_tasks',row,'완료로 숨김 (다음 초기화까지 보관)','conditional_hidden');
  }
  for(const table of ['raid_tasks','currencies','custom_popups'])for(const row of snapshot[table]||[]){
    const ch=chars.get(row.character_id);
    if(!ch||!accounts.has(ch.account_id)){item(table,row,'소유 캐릭터/계정 없음','structural_missing');continue;}
    const toggle={raid_tasks:'show_raid_tasks',currencies:'show_currencies',custom_popups:'show_custom_notes'}[table];
    if(ch[toggle]===false)item(table,row,'캐릭터 섹션 숨김 설정: '+toggle,'section_hidden');
    if(table==='raid_tasks'&&row.temp_week_start_date&&row.temp_week_start_date!==week)item(table,row,'다른 주차의 임시 레이드 숙제','other_week',{week:row.temp_week_start_date});
  }
  for(const row of snapshot.character_cores||[])item('character_cores',row,'삭제된 core.html 전용 데이터; 현재 HTML/Edge Function 사용 없음','retired_feature');
  for(const ch of snapshot.characters)if(!accounts.has(ch.account_id))item('characters',{...ch,character_id:ch.id},'연결된 계정 없음','structural_missing');
  const summaries={};
  for(const issue of issues){const key=issue.category+'/'+issue.table;summaries[key]=(summaries[key]||0)+1;}
  const report={at:now.toISOString(),project:new URL(base).host,method:'GET only; exact-count paginated queries',counts,visibility,week,dayBoundary,summaries,issues,errors,
    caveats:['브라우저의 localStorage 숨김/필터/접힘 상태는 조회하지 않음','일시중지/완료/비활성/섹션 숨김/다른 주차는 불필요 데이터로 단정하지 않음','여러 GET 요청이므로 동일 시점의 트랜잭션 스냅샷은 아님','백업/요청 기록/공유링크/전송 기록은 화면에 없더라도 내부에서 사용될 수 있음','DB 전체 스키마가 아닌 현재 schema.sql의 관련 테이블을 공개 키 접근 범위에서 점검']};
  const output=fs.mkdtempSync(path.join(os.tmpdir(),'loa-db-audit-'));
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2),'utf8');
  fs.writeFileSync(path.join(output,'snapshot.json'),JSON.stringify(snapshot,null,2),'utf8');
  const lines=['# DB 읽기 전용 점검', '', '- 기준: '+report.at,'- DB 변경/삭제: 없음','- 보고서: report.json','- 조회 결과 사본(완전한 DB 백업 아님): snapshot.json','', '## 테이블 건수','',...Object.entries(counts).map(([t,n])=>'- '+t+': '+n),'','## 표시 점검','',...Object.entries(visibility).map(([t,v])=>'- '+t+': '+JSON.stringify(v)),'','## 분류','',...Object.entries(summaries).map(([k,v])=>'- '+k+': '+v),'','## 주의','',...report.caveats.map(c=>'- '+c),'',...errors.map(e=>'- 조회 오류: '+e),'','## 구조상 누락 / 폐기 기능 / 만료 일회용','',...issues.filter(i=>['structural_missing','unexplained_missing','retired_feature','expired_onetime'].includes(i.category)).map(i=>`- ${i.table} | ${i.account||'-'} / ${i.character||'-'} | ${i.name||'-'} | ${i.reason} | ${i.id}`)];
  fs.writeFileSync(path.join(output,'report.md'),lines.join('\n')+'\n','utf8');
  console.log(JSON.stringify({output,counts,visibility,summaries,errors},null,2));
}
main().catch(error=>{console.error(error.stack);process.exitCode=1;});
