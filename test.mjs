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

// An old Telegram reply must never reach the current partner.
processUpdate(run,{update_id:++seq,message:{from:{id:202},chat:chat(202),text:'oldingi javob',reply_to_message:{message_id:1}}})
assert(!run('SELECT body FROM delivery WHERE update_id=?',seq).some(row=>JSON.parse(row.body).chat_id===303))

// A new conversation invalidates an outstanding invitation.
send(202,'/stop')
for (const id of [404,505,606]) {
  for (const step of ['/start','24','Erkak','Buxoro','Kino']) send(id,step)
}
send(404,'💬 Suhbat boshlash')
send(505,'💬 Suhbat boshlash')
const firstRoom=run('SELECT room FROM people WHERE id=404')[0].room
send(404,'/stop')
send(404,'yes:'+firstRoom,true)
send(505,'yes:'+firstRoom,true)
send(404,'invite:'+firstRoom,true)
send(606,'💬 Suhbat boshlash')
send(505,'💬 Suhbat boshlash')
send(505,'/stop')
send(505,'accept:'+firstRoom,true)
assert.equal(run('SELECT room FROM people WHERE id=505')[0].room,0)

function admin(id,text,callback=false) {
  const msg={chat:chat(id),from:{id},text}
  const input=callback?{callback_query:{id:String(seq+1),data:text,from:{id},message:msg}}:{message:msg}
  processUpdate(run,{update_id:++seq,...input},'900')
  return run('SELECT body FROM delivery WHERE update_id=?',seq).map(row=>JSON.parse(row.body))
}
assert.match(admin(101,'adm:ban:202',true).at(-1).text,/egasi/)
assert.equal(run('SELECT * FROM bans').length,0)
assert.match(admin(900,'/admin').at(-1).text,/Admin panel/)
assert.match(admin(900,'adm:stats',true).at(-1).text,/24 soatda faol/)
admin(900,'adm:toggle:registration',true)
assert.match(admin(888,'/start').at(-1).text,/yopiq/)
assert.equal(run('SELECT * FROM people WHERE id=888').length,0)
admin(900,'adm:toggle:registration',true)
admin(900,'adm:edit:age',true)
admin(900,'17')
admin(900,'21')
admin(888,'/start')
assert.match(admin(888,'20').at(-1).text,/21\+/)
admin(900,'adm:edit:welcome',true)
admin(900,'Xush kelibsiz!')
assert.match(admin(889,'/start').at(-1).text,/Xush kelibsiz!/)
admin(900,'adm:toggle:matching',true)
assert.match(admin(101,'💬 Suhbat boshlash').at(-1).text,/yopiq/)
admin(900,'adm:toggle:matching',true)
admin(900,'adm:users:0',true)
admin(900,'adm:reports:0',true)
admin(900,'adm:resolve:1',true)
assert.equal(run('SELECT * FROM reviewed').length,1)
admin(900,'adm:ban:101',true)
assert.match(admin(101,'💬 Suhbat boshlash').at(-1).text,/cheklangan/)
admin(900,'adm:unban:101',true)
assert.equal(run('SELECT * FROM bans').length,0)
assert.match(admin(101,'/id').at(-1).text,/101/)
console.log('Admin huquqi, statistika, sozlash, shikoyat, bloklash va blokdan chiqarish tekshirildi.')
