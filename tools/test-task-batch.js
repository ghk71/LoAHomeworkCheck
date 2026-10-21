// Run with @electric-sql/pglite available on NODE_PATH. Never connects to Supabase.
const {PGlite}=require('@electric-sql/pglite');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const schema=fs.readFileSync('schema.sql','utf8').replace(/\r\n/g,'\n');
const migration=fs.readFileSync('supabase/migrations/20261008_task_batch_workflow.sql','utf8').replace(/\r\n/g,'\n');
assert.ok(schema.includes(migration.trim()));
const uuid=n=>'00000000-0000-0000-0000-'+String(n).padStart(12,'0');
(async()=>{
  const db=new PGlite();
  try{
    await db.exec("create role anon; create role authenticated; create function uuid_generate_v4() returns uuid language sql as 'select gen_random_uuid()';");
    for(const table of ['accounts','characters','tasks','expedition_tasks'])await db.exec(schema.match(new RegExp('create table if not exists '+table+'\\([\\s\\S]*?\\n\\);'))[0]);
    for(const table of ['tasks','expedition_tasks'])await db.exec(`alter table ${table} add column clone_group_id uuid; alter table ${table} add column icon_url text;`);
    await db.exec(schema.slice(schema.indexOf('create or replace function apply_task_pause_atomic('),schema.indexOf('-- Run after 20261001_task_group_settings.sql.')));
    for(let i=1;i<=4;i++){
      await db.query('insert into accounts(id,name) values ($1,$2)',[uuid(i),'Account '+i]);
      await db.query('insert into characters(id,account_id,name) values ($1,$2,$3)',[uuid(i+10),uuid(i),'Char '+i]);
    }
    await db.exec(migration);
    for(const exp of [false,true]){
      const table=exp?'expedition_tasks':'tasks',owner=exp?'account_id':'character_id';
      const owners=[1,2,3,4].map(n=>uuid(n+(exp?0:10)));
      const settings=name=>({name,reset_type:'daily',reset_day:3,rest_enabled:false});
      const nodes=[{key:uuid(101),parentKey:null,settings:settings('A')},{key:uuid(102),parentKey:uuid(101),settings:settings('A1')},{key:uuid(103),parentKey:uuid(101),settings:settings('A2')},{key:uuid(104),parentKey:uuid(102),settings:settings('A1-1')}];
      const read=async()=> (await db.query(`select * from ${table} order by id`)).rows;
      const create=()=>db.query('select create_task_bundle_atomic($1,$2,$3,$4) as result',[exp,JSON.stringify(nodes),owners.slice(0,2),uuid(exp?202:201)]);
      await create();const initial=await read();assert.equal(initial.length,8);
      await create();assert.deepEqual(await read(),initial,'request retry duplicated or changed rows');
      await assert.rejects(()=>db.query('select create_task_bundle_atomic($1,$2,$3,$4)',[exp,JSON.stringify(nodes),owners.slice(0,2),uuid(exp?212:211)]));
      assert.deepEqual(await read(),initial,'changed request id duplicated identities');
      const get=(all,o,g)=>all.find(t=>t[owner]===o&&t.clone_group_id===g);
      const source=get(initial,owners[0],uuid(102));
      const copy=async(id,targets)=>(await db.query('select clone_task_tree_atomic($1,$2,$3) as result',[exp,id,targets])).rows[0].result;
      const copied=await copy(source.id,[owners[2]]);assert.equal(copied.created,3);
      let all=await read();let root=get(all,owners[2],uuid(101)),child=get(all,owners[2],uuid(102)),grand=get(all,owners[2],uuid(104));
      assert.equal(child.parent_id,root.id);assert.equal(grand.parent_id,child.id);assert.equal(get(all,owners[2],uuid(103)),undefined,'copied unrelated sibling');
      const before=await read();assert.equal((await copy(source.id,[owners[2]])).created,0);assert.deepEqual(await read(),before);
      // Existing flattened child retains its id, progress, and pause state when reattached.
      await db.query(`insert into ${table}(id,${owner},name,clone_group_id,count_current,rest_current,is_paused,is_completed,last_completed_at) values ($1,$2,'A1',$3,2,60,true,true,now())`,[uuid(301),owners[3],uuid(102)]);
      const flat=(await read()).find(t=>t.id===uuid(301));
      const report=(await db.query('select repair_task_parent_links_atomic($1,false) as result',[exp])).rows[0].result;
      assert.equal(report.candidates.length,1);
      await db.query('select repair_task_parent_links_atomic($1,true)',[exp]);
      all=await read();const fixed=all.find(t=>t.id===flat.id);
      assert.equal(fixed.parent_id,get(all,owners[3],uuid(101)).id);
      for(const key of ['id','count_current','rest_current','is_paused','is_completed','last_completed_at'])assert.deepEqual(fixed[key],flat[key],key);
      // Selected copy only; source and other owners are not written.
      await db.query('select update_task_group_settings_atomic($1,$2,$3,$4,$5)',[exp,source.id,uuid(102),[fixed.id],JSON.stringify({name:'Selected A1'})]);
      all=await read();assert.equal(all.find(t=>t.id===source.id).name,'A1');assert.equal(all.find(t=>t.id===fixed.id).name,'Selected A1');
      // Single settings edits preserve progress by default.
      await db.query('select save_task_settings_atomic($1,$2,$3,$4,$5)',[exp,fixed.id,uuid(102),JSON.stringify({name:'Saved A1'}),JSON.stringify({rest_current:50})]);
      all=await read();assert.equal(all.find(t=>t.id===fixed.id).count_current,2);assert.equal(all.find(t=>t.id===fixed.id).rest_current,50);
      const snapshot=await read();
      await assert.rejects(()=>copy(source.id,[owners[1],uuid(999)]));assert.deepEqual(await read(),snapshot,'partial copy survived failure');
      await assert.rejects(()=>db.query('select delete_task_selection_atomic($1,$2,$3,$4)',[exp,source.id,uuid(102),[get(snapshot,owners[1],uuid(101)).id]]));
      assert.deepEqual(await read(),snapshot,'wrong group deletion succeeded');
      const removed=(await db.query('select delete_task_selection_atomic($1,$2,$3,$4) as result',[exp,source.id,uuid(102),[get(snapshot,owners[1],uuid(102)).id]])).rows[0].result;
      assert.equal(removed.deletedIds.length,2,'all descendant levels not deleted');
      assert.ok((await read()).some(t=>t.id===source.id),'source deleted despite not selected');
      // Legacy child identity backfill is conservative and idempotent.
      await db.query(`update ${table} set clone_group_id=null where clone_group_id=$1`,[uuid(103)]);
      const legacy=await read();await db.exec(migration);const migrated=await read();
      const migratedChildren=migrated.filter(t=>t.name==='A2');assert.equal(new Set(migratedChildren.map(t=>t.clone_group_id)).size,1);
      for(const row of legacy){const next=migrated.find(t=>t.id===row.id);for(const key of ['parent_id','count_current','rest_current','is_completed'])assert.deepEqual(row[key],next[key]);}
      await db.exec(migration);assert.deepEqual(await read(),migrated,'second migration changed IDs');
      // Removing the final child must clear the now-childless parent's derived completion.
      const lastOwner=owners[3],lastChild=get(await read(),lastOwner,uuid(102)),lastParent=get(await read(),lastOwner,uuid(101));
      await db.query(`update ${table} set is_completed=true,last_completed_at=now() where id=$1`,[lastParent.id]);
      await db.query('select delete_task_selection_atomic($1,$2,$3,$4)',[exp,source.id,uuid(102),[lastChild.id]]);
      assert.equal((await read()).find(t=>t.id===lastParent.id).is_completed,false,'empty parent remained done');
      // Multiple completed levels stay consistent when structure is recomputed.
      const completedOwner=owners[2];
      await db.query(`update ${table} set is_completed=true,last_completed_at=now() where ${owner}=$1`,[completedOwner]);
      const completed=(await read()).filter(t=>t[owner]===completedOwner);
      await db.query('select task_refresh_parents($1,$2)',[exp,completed.filter(t=>completed.some(c=>c.parent_id===t.id)).map(t=>t.id)]);
      assert.ok((await read()).filter(t=>t[owner]===completedOwner).every(t=>t.is_completed),'nested completion order');
      // Failed creation rolls back every owner and its idempotency record.
      const failedId=uuid(exp?402:401),beforeFailure=await read();
      const freshNodes=nodes.map(n=>({...n,key:n.key.replace('0000000001','0000000005'),parentKey:n.parentKey?.replace('0000000001','0000000005')||null}));
      await assert.rejects(()=>db.query('select create_task_bundle_atomic($1,$2,$3,$4)',[exp,JSON.stringify(freshNodes),[owners[0],uuid(999)],failedId]));
      assert.deepEqual(await read(),beforeFailure);
      assert.equal((await db.query('select count(*)::int as n from task_batch_requests where id=$1',[failedId])).rows[0].n,0);
      console.log(table+': nested create/retry, child copy/missing ancestors, idempotent merge, legacy repair/progress, selected edit/delete, rollback, backfill passed');
    }
  }finally{await db.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
