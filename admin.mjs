import {plans,grant,membership} from './premium.mjs'
export const adminSchema = `
CREATE TABLE IF NOT EXISTS activity(user INTEGER PRIMARY KEY, joined INTEGER, seen INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS activity_seen ON activity(seen);
CREATE TABLE IF NOT EXISTS bans(user INTEGER PRIMARY KEY);
CREATE TABLE IF NOT EXISTS reviewed(report INTEGER PRIMARY KEY);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS admin_input(owner INTEGER PRIMARY KEY, field TEXT NOT NULL);
`
export const topics = ['Kino','Musiqa','Sport','Sayohat']
const defaults = {
  registration:'1', matching:'1', minutes:'5', age:'18',
  welcome:'Salom! 👋 Bu yerda suhbatdosh topib, ismingizni ko‘rsatmasdan yozishishingiz mumkin.'
}
export function setting(run,key) {
  return run('SELECT value FROM settings WHERE key=?',key)[0]?.value ?? defaults[key]
}
const button=(text,action)=>({text,callback_data:'adm:'+action})
const menu=[[button('📊 Statistika','stats'),button('⚙️ Sozlamalar','settings')],
  [button('👥 Odamlar','users:0'),button('🚩 Shikoyatlar','reports:0')],
  [button('🔎 ID bilan izlash','find'),button('Yopish','close')]]
const back=[button('‹ Panel','home')]
const fields={welcome:'Salomlashuv matni',minutes:'Taklif muddati (daqiqa)',age:'Yangi profil uchun minimal yosh'}
for (const topic of topics) fields[topic]=topic+' uchun savol'

export function adminPanel({run,id,owner,cb,t,say,enqueue}) {
  const command=(t.split(/\s/)[0]||'').split('@')[0]
  const data=cb?.data||''
  if (command==='/id') {say(id,'Telegram ID raqamingiz: '+id);return true}
  const authorized=String(id)===String(owner||'')
  const pending=authorized && run('SELECT field FROM admin_input WHERE owner=?',id)[0]?.field
  if (command!=='/admin' && !data.startsWith('adm:') && !(pending && !cb)) return false
  if(cb) enqueue('answerCallbackQuery',{callback_query_id:cb.id})
  if(!authorized) {
    say(id,owner?'Bu bo‘lim bot egasi uchun.':'Admin hali bog‘lanmagan. Bot egasi GitHub’da ADMIN_ID qiymatini saqlashi kerak. Sizning Telegram ID raqamingiz: '+id)
    return true
  }
  const show=(text,rows)=>say(id,text,{inline_keyboard:rows})
  const clear=()=>run('DELETE FROM admin_input WHERE owner=?',id)
  const count=(sql,...args)=>run(sql,...args)[0].n
  const blocked=user=>count('SELECT count(*) n FROM bans WHERE user=?',user)>0
  function profile(user) {
    const p=run('SELECT * FROM people WHERE id=?',user)[0]
    if(!p) return show('Bunday ID topilmadi.',[back])
    const labels={age:'Profil to‘ldirmoqda',gender:'Profil to‘ldirmoqda',city:'Profil to‘ldirmoqda',interest:'Profil to‘ldirmoqda',queue:'Qidiruvda',chat:'Suhbatda',ready:'Menyuda'}
    const ban=blocked(user)
    const rows=user===id?[]:[[button(ban?'Blokdan chiqarish':'Bloklash', (ban?'unban:':'confirm:')+user)]]
    rows.push(Object.entries(plans).map(([key,p])=>button(p.badge+' '+p.days+' kun','gift:'+user+':'+key)))
    const tier=membership(run,user)
    show(['ID '+user,tier && plans[tier.plan].title,ban?'Bloklangan':labels[p.phase],p.age && p.age+' yosh',p.city,p.interest].filter(Boolean).join(' · '),[...rows,back])
  }
  function settings() {
    const on=key=>setting(run,key)==='1'?'ochiq':'yopiq'
    const rows=[[button('Yangi profil · '+on('registration'),'toggle:registration')],
      [button('Yangi suhbat · '+on('matching'),'toggle:matching')],
      ...Object.entries(fields).map(([key,label])=>[button(label,'edit:'+key)]),back]
    show('⚙️ Sozlamalar\nYangi profil yoshi: '+setting(run,'age')+'+\nTaklif muddati: '+setting(run,'minutes')+' daqiqa.\nKerakli bandni bosing.',rows)
  }
  if(pending && !cb && !['/admin','/cancel'].includes(command)) {
    if (pending==='find') {
      if(!/^\d{1,16}$/.test(t) || !Number.isSafeInteger(Number(t))) {say(id,'ID raqamini kiriting yoki /cancel yozing.');return true}
      clear();profile(Number(t));return true
    }
    const limits={age:[18,99],minutes:[1,60]}
    const range=limits[pending]
    if (range && (!/^\d+$/.test(t)||+t<range[0]||+t>range[1])) {say(id,range.join('–')+' oralig‘ida son yozing.');return true}
    if (!t || t.startsWith('/') || t.length>500) {say(id,'1–500 belgili matn kiriting yoki /cancel yozing.');return true}
    run('INSERT OR REPLACE INTO settings VALUES(?,?)',pending,t);clear();settings();return true
  }
  clear()
  const [,action='home',arg='',key='']=data.split(':')
  const num=Number(arg)
  if(action==='stats') {
    const now=Date.now()
    const total=count('SELECT count(*) n FROM people')
    const recent=ms=>count('SELECT count(*) n FROM activity WHERE seen>=?',now-ms)
    show(['📊 Bot statistikasi','Botga kirganlar: '+total,'Profili tayyor: '+count("SELECT count(*) n FROM people WHERE phase IN ('ready','chat','queue')"),
      '24 soatda qo‘shilgan: '+count('SELECT count(*) n FROM activity WHERE joined>=?',now-86400000),
      '24 soatda faol: '+recent(86400000),'7 kunda faol: '+recent(7*86400000),
      'Hozir navbatda: '+count("SELECT count(*) n FROM people WHERE phase='queue'"),
      'Ochiq suhbatlar: '+count('SELECT count(*) n FROM rooms WHERE ended=0'),
      'Jami suhbatlar: '+count('SELECT count(*) n FROM rooms'),
      'Ochiq shikoyatlar: '+count('SELECT count(*) n FROM reports WHERE rowid NOT IN (SELECT report FROM reviewed)'),
      'Bloklanganlar: '+count('SELECT count(*) n FROM bans')].join('\n'),[[button('Yangilash','stats')],back])
  } else if((action==='gift'||action==='grant') && Object.hasOwn(plans,key) && run('SELECT id FROM people WHERE id=?',num).length){
    if(action==='gift') show('ID '+num+' uchun '+plans[key].title+' '+plans[key].days+' kunga hozirdan faollashsinmi? Bu avvalgi tarif o‘rniga o‘tadi.',[[button('🎁 Tasdiqlash','grant:'+num+':'+key)],back])
    else {
      grant(run,num,key,plans[key].days)
      say(num,'🎁 Sizga '+plans[key].title+' '+plans[key].days+' kunga sovg‘a qilindi!')
      profile(num)
    }
  } else if(action==='settings') settings()
  else if(action==='toggle' && ['registration','matching'].includes(arg)) {
    run('INSERT OR REPLACE INTO settings VALUES(?,?)',arg,setting(run,arg)==='1'?'0':'1');settings()
  } else if(action==='find'||(action==='edit' && Object.hasOwn(fields,arg))) {
    run('INSERT OR REPLACE INTO admin_input VALUES(?,?)',id,action==='find'?'find':arg)
    show(action==='find'?'Foydalanuvchi ID raqamini yozing.':fields[arg]+'\nYangi qiymatni yozing.',[back])
  } else if(['users','reports'].includes(action) && Number.isSafeInteger(num)&&num>=0) {
    const users=action==='users'
    const list=users?run('SELECT id FROM people ORDER BY id LIMIT 9 OFFSET ?',num):
      run('SELECT rowid AS id,reported FROM reports WHERE rowid NOT IN (SELECT report FROM reviewed) ORDER BY rowid DESC LIMIT 9 OFFSET ?',num)
    const rows=list.slice(0,8).map(x=>[users?button('ID '+x.id,'user:'+x.id):button('Shikoyat №'+x.id,'report:'+x.id)])
    const nav=[]
    if(num>0) nav.push(button('‹ Oldingi',action+':'+Math.max(0,num-8)))
    if(list.length>8) nav.push(button('Keyingi ›',action+':'+(num+8)))
    if(nav.length) rows.push(nav)
    show(list.length?(users?'👥 Odamlar':'🚩 Ochiq shikoyatlar'):'Ro‘yxat bo‘sh.',[...rows,back])
  } else if(action==='user') profile(num)
  else if(action==='report') {
    const r=run('SELECT * FROM reports WHERE rowid=?',num)[0]
    if(r) show('Shikoyat №'+num+'\nYuborgan ID: '+r.reporter+'\nShikoyat qilingan ID: '+r.reported,
      [[button('Profilni ochish','user:'+r.reported)],[button('Ko‘rib chiqildi','resolve:'+num)],back])
  } else if(action==='resolve') {
    run('INSERT OR IGNORE INTO reviewed SELECT rowid FROM reports WHERE rowid=?',num)
    show('Shikoyat ko‘rib chiqildi.',[[button('Shikoyatlar','reports:0')],back])
  } else if(['confirm','ban','unban'].includes(action) && id!==num) {
    const target=run('SELECT * FROM people WHERE id=?',num)[0]
    if(!target) return true
    if(action==='confirm') show('ID '+num+' bloklansinmi? Ochiq suhbati ham tugaydi.',[[button('Ha, bloklash','ban:'+num)],back])
    else {
      if(action==='unban') run('DELETE FROM bans WHERE user=?',num)
      else {
        run('INSERT OR IGNORE INTO bans VALUES(?)',num)
        if(target.room) {
          const peer=run('SELECT id FROM people WHERE room=? AND id<>?',target.room,num)[0]
          run('UPDATE rooms SET ended=1 WHERE id=?',target.room)
          run("UPDATE people SET phase='ready',room=0 WHERE room=?",target.room)
          if(peer) say(peer.id,'Suhbat tugadi. Yangi suhbat uchun /start bosing.')
        }
        run("UPDATE people SET phase='ready',waiting=0 WHERE id=? AND phase='queue'",num)
        run('DELETE FROM invites WHERE room IN (SELECT id FROM rooms WHERE a=? OR b=?)',num,num)
      }
      profile(num)
    }
  } else if(action==='close') say(id,'Panel yopildi. Qayta ochish uchun /admin.')
  else show('🛠 Admin panel\nQaysi bo‘limni ochamiz?',menu)
  return true
}
