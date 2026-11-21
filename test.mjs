import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import {schema,processUpdate} from './worker.mjs'
const db=new DatabaseSync(':memory:')
db.exec(schema)
const run=(q,...args)=>db.prepare(q).all(...args)
let seq=0
const chat=id=>({id,type:'private'})
function send(id,text,callback=false) {
  processUpdate(run,{update_id:++seq,...(callback?{callback_query:{id:String(seq),data:text,from:{id},message:{chat:chat(id)}}}:{message:{from:{id},chat:chat(id),text}})})
  return run('SELECT body FROM delivery WHERE update_id=?',seq).map(row=>JSON.parse(row.body))
}
for(const id of [101,202,303]) {
  send(id,'/start')
  send(id,'17')
  assert.equal(run('SELECT phase FROM people WHERE id=?',id)[0].phase,'age')
  for(const s of ['24','Ayol','Toshkent','Kino','💬 Suhbat boshlash']) send(id,s)
}
assert.equal(send(101,'salom')[0].chat_id,202)
send(101,'/stop')
assert(!send(101,'xabar').some(x=>x.chat_id===202))
send(101,'yes:1',true)
assert.match(send(101,'🤝 Tanishlarim')[0].text,/yo‘q/)
send(202,'yes:1',true)
assert.match(send(101,'🤝 Tanishlarim')[0].text,/Tanish ·/)
send(101,'invite:1',true)
send(202,'accept:1',true)
assert.equal(send(202,'salom')[0].chat_id,101)
send(202,'/report')
assert.equal(run('SELECT * FROM reports').length,1)
send(202,'💬 Suhbat boshlash')
assert.equal(send(202,'yangi')[0].chat_id,303)
assert(!send(101,'invite:1',true).some(x=>x.chat_id===202))
assert(!send(101,'topic:1:0',true).some(x=>x.chat_id===202))
console.log('Profil, 18+, navbat, anonim chat, tugatish, rozilik, taklif, blok va eski tugmalar sinovdan o‘tdi.')
