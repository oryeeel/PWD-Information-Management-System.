import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createLiveStore} from '../src/utils/liveStore.js'

test('all subscribers share the same records and only one polling timer', async () => {
  let count=503,timers=0,cleared=0,poll
  const events=new Map()
  const target={document:{hidden:false,addEventListener(){},removeEventListener(){}},
    setInterval(callback,ms){assert.equal(ms,5000);timers++;poll=callback;return 1},clearInterval(){cleared++},
    addEventListener(name,callback){events.set(name,callback)},removeEventListener(name){events.delete(name)}}
  const store=createLiveStore(async()=>Array.from({length:count},(_,id)=>({id})),{target})
  const seenA=[],seenB=[]
  const unsubscribeA=store.subscribe(()=>seenA.push(store.getSnapshot().records.length))
  const unsubscribeB=store.subscribe(()=>seenB.push(store.getSnapshot().records.length))
  await store.refresh()
  assert.equal(store.getSnapshot().records.length,503)
  assert.equal(timers,1)
  count=504;poll();await store.refresh()
  assert.equal(seenA.at(-1),504);assert.equal(seenB.at(-1),504)
  count=502;events.get('storage')({key:'pwd-records-revision'});await store.refresh()
  assert.equal(store.getSnapshot().records.length,502)
  unsubscribeA();assert.equal(cleared,0)
  unsubscribeB();assert.equal(cleared,1);assert.equal(events.size,0)
})

test('a mutation during an existing fetch triggers a fresh read instead of losing the change', async () => {
  const resolvers=[]
  const store=createLiveStore(()=>new Promise(resolve=>resolvers.push(resolve)),{target:null})
  const first=store.refresh()
  const afterMutation=store.refresh()
  resolvers.shift()([{id:'old'}])
  await Promise.resolve();await Promise.resolve()
  assert.equal(resolvers.length,1)
  resolvers.shift()([{id:'new'},{id:'added'}])
  await Promise.all([first,afterMutation])
  assert.deepEqual(store.getSnapshot().records,[{id:'new'},{id:'added'}])
})

test('failed refresh reports an error, preserves data and recovers on the next refresh',async()=>{
  let fail=false
  const store=createLiveStore(async()=>{if(fail)throw new Error('Offline');return [{id:1}]},{target:null})
  await store.refresh();fail=true;await store.refresh()
  assert.equal(store.getSnapshot().error,'Offline');assert.equal(store.getSnapshot().records.length,1)
  fail=false;await store.refresh();assert.equal(store.getSnapshot().error,'')
})
