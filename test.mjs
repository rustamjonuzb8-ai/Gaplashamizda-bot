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
  for(const s of ['24','Ayol','Toshkent','Kino']) send(id,s)
  const result = send(id,'💬 Suhbat boshlash')
  if (id===101) {
    assert.equal(result.length,1)
    assert(result[0].reply_markup.keyboard.flat().some(b=>b.text==='🤖 AI bilan gaplashish'))
    const prompt=send(id,'🤖 AI bilan gaplashish')[0]
    assert.match(prompt.text,/oddiy xabar/)
    const old=run('SELECT session FROM search_topic WHERE user=?',id)[0].session
    send(id,'❌ Qidiruvni bekor qilish')
    send(id,'💬 Suhbat boshlash')
    const session=run('SELECT session FROM search_topic WHERE user=?',id)[0].session
    assert.match(send(id,'starter:'+old+':1',true).at(-1).text,/avvalgi/)
    assert.match(send(id,'starter:'+session+':1',true).at(-1).text,/tanlandi/)
    send(id,'🌍 Barcha shaharlardan izlash')
  }
  if (id===202) assert.deepEqual(result.filter(x=>x.text?.includes('kichik yaxshilik')).map(x=>x.chat_id).sort(),[101,202])
}
assert.equal(send(101,'salom')[0].chat_id,202)
assert(!send(101,'thanks:1:0',true).some(x=>x.chat_id===202))
send(101,'/stop')
assert(!send(303,'thanks:1:0',true).some(x=>x.chat_id===202))
assert.equal(send(101,'thanks:1',true).at(-1).reply_markup.inline_keyboard.length,3)
assert(!send(101,'thanks:1:99',true).some(x=>x.chat_id===202))
assert(send(101,'thanks:1:0',true).some(x=>x.chat_id===202 && x.text.includes('Kuldirdingiz')))
assert(!send(101,'thanks:1:1',true).some(x=>x.chat_id===202))
assert(!send(101,'xabar').some(x=>x.chat_id===202))
send(101,'yes:1',true)
assert.match(send(101,'🤝 Tanishlarim')[0].text,/yo‘q/)
send(202,'yes:1',true)
assert.match(send(101,'🤝 Tanishlarim')[0].text,/Tanish ·/)
send(101,'invite:1',true)
send(202,'accept:1',true)
assert.equal(send(202,'salom')[0].chat_id,101)
send(202,'/report')
send(202,'Haqorat qildi')
assert.equal(run('SELECT * FROM reports').length,1)
assert(!send(202,'thanks:1:2',true).some(x=>x.chat_id===101))
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

// Existing completed profiles may be stuck in the old settings wizard.
run("UPDATE people SET phase='age' WHERE id=404")
assert.match(send(404,'🤝 Tanishlarim')[0].text,/Tanish|tanish/)
send(404,'⚙️ Sozlamalar')
assert.equal(run('SELECT phase FROM people WHERE id=404')[0].phase,'ready')
send(404,'profile:city',true)
assert.match(send(404,'🏠 Bosh menyu')[0].text,/Bosh menyu/)
assert.equal(run('SELECT city FROM people WHERE id=404')[0].city,'Buxoro')
send(404,'profile:city',true)
send(404,'Farg‘ona')
assert.equal(run('SELECT city FROM people WHERE id=404')[0].city,'Farg‘ona')
const launch=(id,action)=>{
 processUpdate(run,{update_id:++seq,message:{chat:chat(id),from:{id},web_app_data:{data:JSON.stringify({action})}}},'900','https://example.test')
 return run('SELECT body FROM delivery WHERE update_id=?',seq).map(row=>JSON.parse(row.body))
}
assert.match(launch(404,'interest:Musiqa')[0].text,/saqlandi/)
assert.equal(run('SELECT interest FROM people WHERE id=404')[0].interest,'Musiqa')
assert(!launch(404,'profile')[0].reply_markup.keyboard.flat().some(b=>b.text==='🛠 Admin panel'))
run("UPDATE people SET phase='ready',age=24,interest='Kino' WHERE id=900")
assert(launch(900,'profile')[0].reply_markup.keyboard.flat().some(b=>b.text==='🛠 Admin panel'))
assert.match(admin(900,'🛠 Admin panel')[0].text,/Admin panel/)
send(404,'profile:age',true)
send(404,'💬 Suhbat boshlash')
assert(['queue','chat'].includes(run('SELECT phase FROM people WHERE id=404')[0].phase))
console.log('Eski profilni tiklash, navigatsiya, alohida tahrir, Mini App va admin tugmasi tekshirildi.')

import {membership} from './premium.mjs'
import {game} from './game.mjs'
send(404,'premium:trial:star',true)
admin(900,'adm:grant:404:crown',true)
assert.equal(membership(run,404),undefined)
assert(!send(404,'premium:buy:star',true).some(x=>x.currency))
admin(900,'adm:edit:price_star',true)
admin(900,'30')
const invoice=send(404,'premium:buy:star',true).find(x=>x.currency)
assert.equal(invoice.prices[0].amount,30)
const payment={invoice_payload:invoice.payload,currency:'XTR',total_amount:30}
function event(data){
 processUpdate(run,{update_id:++seq,...data},900)
 return run('SELECT body FROM delivery WHERE update_id=?',seq).map(row=>JSON.parse(row.body))
}
const pre=(id,amount)=>event({pre_checkout_query:{id:'check',from:{id},...payment,total_amount:amount}})[0].ok
assert(pre(404,30));assert(!pre(505,30));assert(!pre(404,1))
assert.equal(membership(run,404),undefined)
const receipt={...payment,telegram_payment_charge_id:'test-charge'}
const deliver=kind=>event({message:{chat:chat(404),from:{id:404},[kind]:receipt}})
deliver('successful_payment');const paid=membership(run,404)
assert.equal(paid.plan,'star');deliver('successful_payment');assert.deepEqual(paid,membership(run,404))
deliver('refunded_payment');assert.equal(membership(run,404),undefined)
assert.match(admin(404,'/paysupport').at(-1).text,/Muammoni/)
assert(admin(404,'Chekni tekshiring').some(x=>x.chat_id===900))
assert(admin(900,'/supportreply 404 Tekshirildi').some(x=>x.chat_id===404))
const room={id:12345,a:11,b:12}
let out=[];const say=(id,text)=>out.push([id,text])
game(run,room,11,say);assert.equal(out.length,2)
out=[];game(run,room,11,say,'0-0');assert.equal(out.length,1);assert.equal(out[0][0],11)
out=[];game(run,room,12,say,'0-1');assert.equal(out.length,2);assert.match(out[0][1],/Ikki xil/)
game(run,room,11,say,'next-0');game(run,room,12,say,'next-0')
assert.equal(run('SELECT n FROM game_round WHERE room=12345')[0].n,1)
console.log('Paid-only, admin pricing, checkout, duplicate payment, refunded access, payment support and two-player rounds passed.')
const day=Math.floor((Date.now()+5*3600000)/86400000)
send(404,'daily:'+day+':1',true);send(404,'daily:'+day+':0',true)
assert.equal(run('SELECT pick FROM daily_votes WHERE user=404')[0].pick,1)
send(505,'daily:'+(day-1)+':1',true)
assert.equal(run('SELECT count(*) n FROM daily_votes WHERE user=505')[0].n,0)
admin(404,'/paysupport')
run('UPDATE payment_support SET touched=? WHERE buyer=404',Date.now()-660000)
const expired=admin(404,'Bu xabar yordam uchun')
assert(expired.length===1 && expired[0].chat_id===404 && expired[0].text.includes('/paysupport'))

for (const id of [771,772]) {
  for (const step of ['/start','25','Ko‘rsatmaslik','Samarqand','Sport','💬 Suhbat boshlash']) admin(id,step)
}
for (const text of ['/help','💬 Yordam','❌ Qidiruvni bekor qilish']) {
  assert(admin(771,text).every(x=>x.chat_id===771))
}
admin(771,'/report')
const alerts=admin(771,'Reklama yubordi')
assert.equal(run('SELECT * FROM bans WHERE user=772').length,0)
const caseId=run('SELECT rowid AS id FROM reports WHERE reporter=771')[0].id
assert.match(admin(900,'adm:report:'+caseId,true).at(-1).text,/Reklama yubordi/)
assert(alerts.some(x=>x.chat_id===900 && x.reply_markup.inline_keyboard[0][0].callback_data.startsWith('adm:report:')))
const menu=admin(771,'/start')[0].reply_markup.keyboard.flat()
assert(menu.every(b=>typeof b.text==='string'))
assert.equal(menu[0].style,'primary')
assert.match(admin(404,'topic:999999:0',true).at(-1).text,/eskirgan/)
import {Lobby} from './worker.mjs'
for (const id of [781,782]) {
  for (const step of ['/start','25','Ko‘rsatmaslik','Xiva','Sport','💬 Suhbat boshlash']) admin(id,step)
}
run('DELETE FROM delivery')
const originalFetch=globalThis.fetch
const sent=[]
const lobby=Object.create(Lobby.prototype)
lobby.env={BOT_TOKEN:'test'}
lobby.ctx={storage:{transactionSync:fn=>fn()}}
lobby.sql={exec:(q,...args)=>({toArray:()=>run(q,...args)})}
try {
  globalThis.fetch=async(url,opts)=>{
    const body=JSON.parse(opts.body)
    sent.push(body)
    return new Response(null,{status:body.chat_id===782?403:200})
  }
  await lobby.handle({update_id:++seq,message:{from:{id:781},chat:chat(781),text:'Salom'}})
  assert(sent.some(x=>x.chat_id===781 && x.text.includes('yetkazib')))
  assert(run('SELECT phase FROM people WHERE id IN (781,782)').every(p=>p.phase==='ready'))
  assert.equal(run('SELECT * FROM delivery').length,0)
} finally {globalThis.fetch=originalFetch}
console.log('Yordam, eskirgan tugma, admin xabarnomasi va Telegram 403 holati tekshirildi.')

const aiUser=810
run("INSERT INTO people(id,phase,city,age,interest) VALUES(?,'queue','Navoiy',24,'Kino')",aiUser)
const aiPrompt=admin(aiUser,'🤖 AI bilan gaplashish')[0]
function answerAI(){
  return processUpdate(run,{update_id:++seq,message:{from:{id:aiUser},chat:chat(aiUser),text:'Yaxshi'}},900)
}
const first=answerAI()
assert.equal(first.id,aiUser)
lobby.tail=Promise.resolve()
lobby.env.AI={run:async()=>({response:'Bugun sizni nima xursand qildi?'})}
try {
  globalThis.fetch=async(url,opts)=>{sent.push(JSON.parse(opts.body));return new Response(null,{status:200})}
  await lobby.replyAI(run,first)
  assert(sent.at(-1).text.includes('Bugun sizni nima xursand qildi?'))
  const third=answerAI()
  assert(third.messages.some(m=>m.role==='assistant' && m.content.includes('xursand')))
  const stop=aiPrompt.reply_markup.inline_keyboard[0][0].callback_data
  assert.equal(stop,sent.at(-1).reply_markup.inline_keyboard[0][0].callback_data)
  assert.match(admin(aiUser,stop,true).at(-1).text,/AI suhbati tugadi/)
  assert.equal(run('SELECT phase FROM people WHERE id=?',aiUser)[0].phase,'queue')
  assert.equal(answerAI()?.request,undefined)
  admin(aiUser,'🤖 AI bilan gaplashish')
  admin(aiUser,stop,true)
  assert.equal(answerAI().id,aiUser)
  const before=sent.length
  await lobby.replyAI(run,third)
  assert.equal(sent.length,before)
} finally {globalThis.fetch=originalFetch}
