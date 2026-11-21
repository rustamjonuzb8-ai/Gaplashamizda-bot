import {menuPage} from './menu.mjs'
import { adminSchema, adminPanel, setting, topics } from './admin.mjs'
const legacyHome = ['💬 Suhbat boshlash','🤝 Tanishlarim','⚙️ Sozlamalar','👤 Profilim','🏠 Bosh menyu','/start','/menu','/cancel']
const back = '🏠 Bosh menyu'
const editFields = {age:'Yosh', gender:'Jins', city:'Shahar', interest:'Qiziqish'}
const button = (text,callback_data) => ({text,callback_data})
const chat = [['🎲 Savol tanlash', '⏭ Keyingi'], ['👋 Tugatish', '🚩 Shikoyat va bloklash']]
const interests = topics
const questions = {
  Kino: 'Qaysi filmni yana bir marta ko‘rardingiz?',
  Musiqa: 'Bugungi kayfiyatingizga qaysi qo‘shiq mos?',
  Sport: 'Jonli tomosha qilishni istagan sportingiz qaysi?',
  Sayohat: 'Ertaga yo‘lga chiqsangiz, qayerga borardingiz?'
}
const otherQuestions = ['Oxirgi marta sizni nima kuldirdi?', 'Bolalikdagi eng yaxshi xotirangiz qaysi?', 'Bir kun bo‘sh vaqtingiz bo‘lsa, nima qilardingiz?']
const keyboard = rows => ({keyboard: rows, resize_keyboard: true})
const inline = (label, data) => ({inline_keyboard: [[{text: label, callback_data: data}]]})
export const schema = adminSchema + `
CREATE TABLE IF NOT EXISTS people(id INTEGER PRIMARY KEY, phase TEXT DEFAULT 'age', age INTEGER, city TEXT DEFAULT '', interest TEXT DEFAULT '', gender TEXT DEFAULT '', room INTEGER DEFAULT 0, waiting INTEGER DEFAULT 0, wide INTEGER DEFAULT 0, previous INTEGER DEFAULT 0);
CREATE INDEX IF NOT EXISTS queue ON people(phase,waiting);
CREATE TABLE IF NOT EXISTS rooms(id INTEGER PRIMARY KEY, a INTEGER, b INTEGER, yesA INTEGER DEFAULT 0, yesB INTEGER DEFAULT 0, ended INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS blocks(a INTEGER,b INTEGER,PRIMARY KEY(a,b));
CREATE TABLE IF NOT EXISTS reports(room INTEGER, reporter INTEGER, reported INTEGER, created INTEGER);
CREATE TABLE IF NOT EXISTS invites(room INTEGER PRIMARY KEY, sender INTEGER, expires INTEGER);
CREATE TABLE IF NOT EXISTS updates(id INTEGER PRIMARY KEY, at INTEGER);
CREATE TABLE IF NOT EXISTS delivery(id INTEGER PRIMARY KEY, update_id INTEGER, method TEXT, body TEXT);
`
export function processUpdate(run, update, owner, origin) {
  const cb = update.callback_query
  const message = update.message
  const sender = cb?.from || message?.from
  const source = cb?.message || message
  if (!sender || sender.is_bot || source?.chat.type !== 'private' || source.chat.id !== sender.id) return
  const id = sender.id
  const enqueue = (method, body) => run('INSERT INTO delivery(update_id,method,body) VALUES(?,?,?)',update.update_id,method,JSON.stringify(body))
  const say = (to, text, markup) => enqueue('sendMessage',{chat_id:to,text,reply_markup:markup,protect_content:true,link_preview_options:{is_disabled:true}})
  const me = (text, rows) => say(id,text,rows && keyboard(rows))
  const one = (q,...args) => run(q,...args)[0]
  const person = who => one('SELECT * FROM people WHERE id=?',who)
  const homeFor = who => [
    ...(origin ? [[{text:'✨ Menyuni ochish',web_app:{url:origin+'/menu'}}]] : []),
    ['💬 Suhbat boshlash'], ['👤 Profilim','🤝 Tanishlarim'],
    ...(String(who)===String(owner) ? [['🛠 Admin panel']] : [])
  ]
  const home=homeFor(id)
  let t = message?.text?.trim() || ''
  let mini=''
  if (message?.web_app_data) {
    try {mini=JSON.parse(message.web_app_data.data).action} catch {return}
    if(typeof mini!=='string') return
    t=({search:'💬 Suhbat boshlash',profile:'👤 Profilim',friends:'🤝 Tanishlarim'})[mini]||''
  }
  if(t==='🛠 Admin panel') t='/admin'
  const existing = person(id)
  const now = Date.now()
  if (existing || String(id)===String(owner) || setting(run,'registration')==='1') {
    run('INSERT OR IGNORE INTO people(id) VALUES(?)',id)
    run('INSERT INTO activity VALUES(?,?,?) ON CONFLICT(user) DO UPDATE SET seen=excluded.seen',id,existing?null:now,now)
  }
  if (adminPanel({run,id,owner,cb,t,say,enqueue})) return
  if (one('SELECT user FROM bans WHERE user=?',id)) return me('Sizning botdan foydalanishingiz cheklangan.')
  const user = existing || person(id)
  if (!user) return me('Yangi profillar uchun ro‘yxatdan o‘tish hozir yopiq.')
  const paused = () => setting(run,'matching')!=='1'
  const question = topic => setting(run,topic) || questions[topic]
  const blocked = (a,b) => one('SELECT 1 FROM blocks WHERE (a=? AND b=?) OR (a=? AND b=?)',a,b,b,a)
  const complete=Boolean(user.age && user.interest)
  const choices={gender:[['Ayol','Erkak'],['Ko‘rsatmaslik']],city:[['O‘tkazib yuborish']],interest:[interests.slice(0,2),interests.slice(2)]}
  const prompts={age:'Yangi yoshingizni raqam bilan yozing.',gender:'Profilingizda qaysi jins ko‘rinsin?',city:'Shahar nomini yozing yoki yashiring.',interest:'Sizga qaysi mavzu yoqadi?'}
  function profileCard(){
    const p=person(id)
    const rows=[[button('Yosh','profile:age'),button('Jins','profile:gender')],[button('Shahar','profile:city'),button('Qiziqish','profile:interest')],[button('‹ Bosh menyu','profile:home')]]
    say(id,'👤 Mening profilim\n\n'+p.age+' yosh · '+(p.gender||'Jins yashirilgan')+'\n📍 '+(p.city||'Shahar yashirilgan')+'\n✦ '+p.interest+'\n\nQaysi ma’lumotni o‘zgartirasiz?',{inline_keyboard:rows})
  }
  const busy=['chat','queue'].includes(user.phase)
  if(cb?.data?.startsWith('profile:')){
    enqueue('answerCallbackQuery',{callback_query_id:cb.id})
    if(busy || !complete) return me('Profilni bosh menyuda oching.')
    const field=cb.data.slice(8)
    if(field==='home') {
      run("UPDATE people SET phase='ready' WHERE id=?",id)
      return me('🏠 Bosh menyu',home)
    }
    if(!Object.hasOwn(editFields,field)) return
    run('UPDATE people SET phase=? WHERE id=?','edit_'+field,id)
    return me(prompts[field],[...(choices[field]||[]),[back]])
  }
  if(!cb && complete && !busy && (legacyHome.includes(t)||mini)){
    run("UPDATE people SET phase='ready' WHERE id=?",id)
    user.phase='ready'
    if(mini.startsWith('interest:') && interests.includes(mini.slice(9))){
      run('UPDATE people SET interest=? WHERE id=?',mini.slice(9),id)
      me('Qiziqishingiz saqlandi.',home);return profileCard()
    }
    if(['👤 Profilim','⚙️ Sozlamalar'].includes(t)) {
      me('Profilingiz tayyor.',home);return profileCard()
    }
    if([back,'/menu','/cancel','/start'].includes(t)) return me('🏠 Bosh menyu'+(String(id)===String(owner)?' · Siz adminsiz.':''),home)
  }
  if(!cb && busy && (mini || ['👤 Profilim','⚙️ Sozlamalar',back,'🤝 Tanishlarim','💬 Suhbat boshlash','/menu'].includes(t))) return me(user.phase==='queue'?'Qidiruv davom etyapti.':'Suhbat davom etyapti.',user.phase==='chat'?chat:[['❌ Qidiruvni bekor qilish']])
  if(!cb && user.phase.startsWith('edit_')){
    const field=user.phase.slice(5)
    if(!Object.hasOwn(editFields,field)) return
    let value=t
    if(field==='age' && (!/^\d{2,3}$/.test(t)||+t<Number(setting(run,'age'))||+t>110)) return me(prompts.age,[[back]])
    if(field==='city' && !/^[\p{L} ’ʻ‘ʼ'-]{2,40}$/u.test(t)) return me(prompts.city,[...choices.city,[back]])
    if(field==='gender' && !choices.gender.flat().includes(t)) return me(prompts.gender,[...choices.gender,[back]])
    if(field==='interest' && !interests.includes(t)) return me(prompts.interest,[...choices.interest,[back]])
    if(t==='Ko‘rsatmaslik'||t==='O‘tkazib yuborish') value=''
    if(field==='city' && value) value=value.toLocaleLowerCase('uz').replace(/^./u,c=>c.toUpperCase())
    run("UPDATE people SET "+field+"=?,phase='ready' WHERE id=?",value,id)
    me(editFields[field]+' saqlandi.',home);return profileCard()
  }
  function pair(a,b) {
    run('DELETE FROM invites WHERE room IN (SELECT id FROM rooms WHERE a IN (?,?) OR b IN (?,?))',a.id,b.id,a.id,b.id)
    const r = one('INSERT INTO rooms(a,b) VALUES(?,?) RETURNING id',a.id,b.id).id
    run("UPDATE people SET room=?, phase='chat', waiting=0 WHERE id IN (?,?)",r,a.id,b.id)
    for (const [self,peer] of [[a,b],[b,a]]) {
      say(self.id,'💬 Suhbatdosh topildi!\n'+[peer.gender,peer.age+' yosh',peer.city].filter(Boolean).join(' · ')+'\n'+(self.interest===peer.interest?'Umumiy qiziqish':'Suhbatdosh qiziqishi')+' · '+peer.interest,keyboard(chat))
      say(self.id,question(peer.interest),inline('💬 Savolni yuborish','topic:'+r+':'+interests.indexOf(peer.interest)))
    }
  }
  function search(wide) {
    if (paused()) return me('Yangi suhbat qidirish vaqtincha yopiq.')
    const peer = one(`SELECT * FROM people p WHERE phase='queue' AND id NOT IN (?,?) AND previous<>?
      AND (?=1 OR ?='' OR city=?) AND (wide=1 OR city='' OR city=?)
      AND NOT EXISTS(SELECT 1 FROM blocks WHERE (a=? AND b=p.id) OR (a=p.id AND b=?))
      ORDER BY (interest=?) DESC, waiting LIMIT 1`,id,user.previous,id,wide,user.city,user.city,user.city,id,id,user.interest)
    if (peer) return pair(user,peer)
    run("UPDATE people SET phase='queue',waiting=?,wide=? WHERE id=?",Date.now(),wide,id)
    me('🔎 Suhbatdosh qidiryapman. Telegramdan chiqishingiz mumkin, juft topilganda xabar keladi.',[['🌍 Barcha shaharlardan izlash'],['❌ Qidiruvni bekor qilish']])
  }
  if (cb) {
    enqueue('answerCallbackQuery',{callback_query_id:cb.id})
    const [action,num,arg] = (cb.data || '').split(':')
    const room = one('SELECT * FROM rooms WHERE id=? AND (a=? OR b=?)',Number(num)||0,id,id)
    if (!room) return
    const peer = person(room.a===id?room.b:room.a)
    if (blocked(id,peer.id)) return me('Bu amal endi mavjud emas.')
    if (action==='topic' && user.room===room.id && !room.ended) {
      const prompt = [...interests.map(question),...otherQuestions][Number(arg)]
      if (prompt) { say(peer.id,'💬 '+prompt); me('Savol yuborildi.') }
      return
    }
    if (!room.ended) return
    if (action==='yes' || action==='no') {
      const field = room.a===id?'yesA':'yesB'
      if (room[field]) return
      run('UPDATE rooms SET '+field+'=? WHERE id=?',action==='yes'?1:-1,room.id)
      me('Javobingiz saqlandi.')
      if (action==='yes' && (room.a===id?room.yesB:room.yesA)===1)
        for (const who of [id,peer.id]) say(who,'🤝 Ikkalangiz ham rozisiz. Suhbatdoshingiz Tanishlarim bo‘limiga qo‘shildi.')
      return
    }
    if (room.yesA!==1 || room.yesB!==1) return
    if (paused() || one('SELECT user FROM bans WHERE user=?',peer.id)) return me('Hozir suhbatni boshlash imkoni yo‘q.')
    if (!['ready','queue'].includes(peer.phase) || !['ready','queue'].includes(user.phase)) return me('Hozir suhbatni boshlash imkoni yo‘q.')
    if (action==='invite') {
      run('INSERT OR REPLACE INTO invites VALUES(?,?,?)',room.id,id,Date.now()+Number(setting(run,'minutes'))*60000)
      say(peer.id,'🤝 Tanishingiz sizni suhbatga taklif qildi.',inline('Taklifni qabul qilish','accept:'+room.id))
      return me('Taklif yuborildi. U '+setting(run,'minutes')+' daqiqa amal qiladi.')
    }
    if (action==='accept' && one('DELETE FROM invites WHERE room=? AND sender=? AND expires>? RETURNING room',room.id,peer.id,Date.now())) return pair(user,peer)
    return
  }
  if (t==='/start') {
    if(String(id)===String(owner) && !complete) say(id,'🛠 Siz bot adminisiz.',inline('Admin panelni ochish','adm:home'))
    if (user.phase==='chat') return me('Suhbat davom etyapti. Xabar yozing yoki savol tanlang.',chat)
    if (user.phase==='queue') return me('Qidiruv davom etmoqda.',[['❌ Qidiruvni bekor qilish']])
    if (user.phase==='ready') return me('Salom! Gaplashamizmi? 👋',home)
    run("UPDATE people SET phase='age' WHERE id=?",id)
    return me(setting(run,'welcome')+'\n\nYosh chegarasi: '+setting(run,'age')+'+. Yoshingiz nechada? Raqam bilan yozing.')
  }
  if (user.phase==='age') {
    if (!/^\d{2,3}$/.test(t) || +t<Number(setting(run,'age')) || +t>110) return me('Yosh chegarasi: '+setting(run,'age')+'+. Haqiqiy yoshingizni yozing.')
    run("UPDATE people SET phase='gender',age=? WHERE id=?",+t,id)
    return me('Profilingizda nima ko‘rsatilsin?',[['Ayol','Erkak'],['Ko‘rsatmaslik']])
  }
  if (user.phase==='gender') {
    if (!['Ayol','Erkak','Ko‘rsatmaslik'].includes(t)) return me('Tugmalardan birini tanlang.')
    run("UPDATE people SET phase='city',gender=? WHERE id=?",t==='Ko‘rsatmaslik'?'':t,id)
    return me('Shahringiz nomini yozing yoki o‘tkazib yuboring.',[['O‘tkazib yuborish']])
  }
  if (user.phase==='city') {
    if (!/^[\p{L} ’ʻ‘ʼ'-]{2,40}$/u.test(t)) return me('Shahar nomini harflar bilan yozing.')
    run("UPDATE people SET phase='interest',city=? WHERE id=?",t==='O‘tkazib yuborish'?'':t.toLocaleLowerCase('uz').replace(/^./u,c=>c.toUpperCase()),id)
    return me('Qaysi mavzu sizga yoqadi?',[interests.slice(0,2),interests.slice(2)])
  }
  if (user.phase==='interest') {
    if (!interests.includes(t)) return me('Bitta mavzuni tanlang.')
    run("UPDATE people SET phase='ready',interest=? WHERE id=?",t,id)
    me('Profil tayyor! Suhbat boshlashingiz mumkin.',home);return profileCard()
  }
  if (user.phase==='queue') {
    if (t==='🌍 Barcha shaharlardan izlash') return search(1)
    if (t==='/stop' || t==='❌ Qidiruvni bekor qilish') {
      run("UPDATE people SET phase='ready',waiting=0 WHERE id=?",id)
      return me('Qidiruv to‘xtatildi.',home)
    }
    return me('Hali suhbatdosh qidiryapman.')
  }
  if (user.phase==='ready') {
    if (t==='💬 Suhbat boshlash' || t==='/next') return search(0)
    if (t==='🤝 Tanishlarim') {
      const friends = run(`SELECT max(id) AS room, CASE WHEN a=? THEN b ELSE a END AS peer FROM rooms
        WHERE (a=? OR b=?) AND yesA=1 AND yesB=1 GROUP BY peer ORDER BY room DESC`,id,id,id).filter(f=>!blocked(id,f.peer))
      if (!friends.length) return me('Hozircha tanishlaringiz yo‘q. Suhbatdan keyin ikkalangiz ham rozilik bersangiz, shu yerda ko‘rinasiz.')
      for (const f of friends.slice(0,20)) say(id,'🤝 Tanish · '+person(f.peer).interest+' · suhbat №'+f.room,inline('Suhbatga taklif qilish','invite:'+f.room))
      return
    }
    return me('Suhbat boshlash uchun tugmani bosing.',home)
  }
  const room = one('SELECT * FROM rooms WHERE id=?',user.room)
  const peer = room.a===id?room.b:room.a
  const report = ['/report','🚩 Shikoyat va bloklash'].includes(t)
  const next = ['/next','⏭ Keyingi'].includes(t)
  if (report || next || ['/stop','👋 Tugatish'].includes(t)) {
    run("UPDATE rooms SET ended=1 WHERE id=?",room.id)
    run("UPDATE people SET phase='ready',room=0,previous=CASE WHEN id=? THEN ? ELSE ? END WHERE room=?",id,peer,id,room.id)
    user.previous=peer
    if (report) {
      run('INSERT OR IGNORE INTO blocks VALUES(?,?)',id,peer)
      run('INSERT INTO reports VALUES(?,?,?,?)',room.id,id,peer,Date.now())
    }
    for (const who of [id,peer]) {
      say(who,report && who===id?'Shikoyat saqlandi. Suhbatdosh bloklandi.':'Suhbat tugadi.',keyboard(homeFor(who)))
      if (!report) say(who,'Bu odam bilan yana gaplashasizmi? Ikkalangiz ham istasangiz, uni «Tanishlarim»dan topasiz.',{inline_keyboard:[[{text:'🤝 Ha, yana gaplashaman',callback_data:'yes:'+room.id},{text:'Hozircha yo‘q',callback_data:'no:'+room.id}]]})
    }
    if (next) search(0)
    return
  }
  if (t==='🎲 Savol tanlash' || t==='🎲 Mavzu') {
    const i = Math.floor(Math.random()*otherQuestions.length)
    return say(id,otherQuestions[i],inline('Savolni yuborish','topic:'+room.id+':'+(interests.length+i)))
  }
  if (message.reply_to_message || message.external_reply) return me('Xabarni yangi matn sifatida yuboring. Hozirgi suhbatdoshingizga boradi.')
  if (!t || t.startsWith('/')) return me('Hozir matnli xabar yuborishingiz mumkin.')
  say(peer,t)
}

export async function webhookSecret(token) {
  const bytes = await crypto.subtle.digest('SHA-256',new TextEncoder().encode('gaplashamizda-bot/webhook/v1/'+token))
  return Array.from(new Uint8Array(bytes), b=>b.toString(16).padStart(2,'0')).join('')
}
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname
    if (request.method==='GET' && path==='/menu') return new Response(menuPage,{headers:{'content-type':'text/html; charset=utf-8'}})
    if (request.method==='GET' && path==='/') return new Response('Gaplashamizda')
    if (request.method!=='POST' || path!=='/telegram') return new Response('Not found',{status:404})
    if (!env.BOT_TOKEN || request.headers.get('X-Telegram-Bot-Api-Secret-Token')!==await webhookSecret(env.BOT_TOKEN)) return new Response('Forbidden',{status:403})
    return env.LOBBY.get(env.LOBBY.idFromName('gaplashamizda-bot')).fetch(request)
  }
}
export class Lobby {
  constructor(ctx,env) {
    this.ctx=ctx
    this.env=env
    this.sql=ctx.storage.sql
    this.sql.exec(schema)
    this.tail=Promise.resolve()
  }
  async fetch(request) {
    const update=await request.json()
    const work=this.tail.then(()=>this.handle(update,new URL(request.url).origin))
    this.tail=work.catch(()=>{})
    return work
  }
  async handle(update,origin) {
    const run=(query,...args)=>this.sql.exec(query,...args).toArray()
    this.ctx.storage.transactionSync(()=>{
      run('DELETE FROM updates WHERE at<?',Date.now()-48*3600000)
      if (run('INSERT OR IGNORE INTO updates VALUES(?,?) RETURNING id',update.update_id,Date.now()).length)
        processUpdate(run,update,this.env.ADMIN_ID,origin)
    })
    for (const job of run('SELECT * FROM delivery ORDER BY id')) {
      const response=await fetch('https://api.telegram.org/bot'+this.env.BOT_TOKEN+'/'+job.method,{
        method:'POST',headers:{'content-type':'application/json'},body:job.body
      })
      if (!response.ok && ![400,403].includes(response.status)) return new Response('Retry',{status:503})
      run('DELETE FROM delivery WHERE id=?',job.id)
    }
    return new Response('OK')
  }
}
