export const plans = {
  crystal:{title:'💎 Kristal',days:7,badge:'💎',style:'crystal',question:'Hayotingizdagi qaysi kichik odat kuningizni yaxshilaydi?'},
  star:{title:'🌟 Yulduz',days:14,badge:'🌟',style:'star',question:'Bolalikdagi bir orzuingizni hozir bajara olsangiz, qaysini tanlardingiz?'},
  crown:{title:'👑 Toj',days:30,badge:'👑',style:'crown',question:'Biror inson siz haqingizda qaysi jihatingizni darrov sezishini istardingiz?'}
}
export const premiumSchema=`
CREATE TABLE IF NOT EXISTS orders(payload TEXT PRIMARY KEY, buyer INTEGER, plan TEXT, stars INTEGER, created INTEGER);
CREATE TABLE IF NOT EXISTS purchases(charge TEXT PRIMARY KEY, buyer INTEGER, plan TEXT, starts INTEGER, until_ms INTEGER, refunded INTEGER DEFAULT 0);
CREATE INDEX IF NOT EXISTS buyer_until ON purchases(buyer,until_ms);
CREATE TABLE IF NOT EXISTS payment_support(buyer INTEGER PRIMARY KEY, touched INTEGER);
`
export function membership(run,user){
  const now=Date.now()
  return run('SELECT plan,until_ms FROM purchases WHERE buyer=? AND refunded=0 AND starts<=? AND until_ms>? ORDER BY starts LIMIT 1',user,now,now)[0]
}
const price=(run,key)=>Number(run('SELECT value FROM settings WHERE key=?','price_'+key)[0]?.value||0)
export function paymentEvent(run,update,owner,enqueue,say){
  const query=update.pre_checkout_query
  const message=update.message
  const receipt=message?.successful_payment || message?.refunded_payment
  if(query || receipt){
    const event=query||receipt
    const id=query?.from.id || message.chat.id
    const order=run('SELECT * FROM orders WHERE payload=?',event.invoice_payload)[0]
    const valid=order && id===order.buyer && event.currency==='XTR' && order.stars===event.total_amount
    if(query){
      const ok=Boolean(valid && Date.now()-order.created<3600000 && price(run,order.plan)===order.stars &&
        !run('SELECT 1 FROM bans WHERE user=?',id).length)
      enqueue('answerPreCheckoutQuery',ok?{pre_checkout_query_id:query.id,ok:true}:{pre_checkout_query_id:query.id,ok:false,error_message:'Hisob eskirgan. Premium bo‘limidan yangisini oching.'})
      return true
    }
    if(!valid){if(owner)say(Number(owner),'Premium tushumi tekshiruv talab qiladi. Telegram tranzaksiyalari tarixini tekshiring.');return true}
    const charge=receipt.telegram_payment_charge_id
    if(message.refunded_payment){
      run('INSERT INTO purchases VALUES(?,?,?,?,?,1) ON CONFLICT(charge) DO UPDATE SET refunded=1',charge,id,order.plan,0,0)
      return true
    }
    const end=run('SELECT max(until_ms) AS end FROM purchases WHERE buyer=? AND refunded=0',id)[0].end
    const start=Math.max(Date.now(),end||0)
    const until=start+plans[order.plan].days*86400000
    if(run('INSERT OR IGNORE INTO purchases VALUES(?,?,?,?,?,0) RETURNING charge',charge,id,order.plan,start,until).length)
      say(id,'✅ To‘lov qabul qilindi. '+plans[order.plan].title+' · '+plans[order.plan].days+' kun. '+(end>Date.now()?'Yangi muddat amaldagi tarif tugagach boshlanadi.':'Belgingiz keyingi suhbat kartasida ko‘rinadi.')+'\nTo‘lov bo‘yicha yordam: /paysupport')
    return true
  }
  if(!message || message.chat.type!=='private') return false
  const id=message.chat.id, t=message.text||''
  if(t==='/paysupport'){
    if(!owner){say(id,'Yordam uchun Telegram to‘lov kvitansiyasidagi yordam bo‘limini oching.');return true}
    run('INSERT OR REPLACE INTO payment_support VALUES(?,?)',id,Date.now())
    say(id,'Muammoni bitta xabarda yozing. Keyingi matningiz bot egasiga boradi. Bekor qilish: /cancel.')
    return true
  }
  if(String(id)===String(owner) && t.startsWith('/supportreply ')){
    const match=t.match(/^\/supportreply (\d+) ([\s\S]{1,3500})$/)
    if(match && run('SELECT 1 FROM payment_support WHERE buyer=? AND touched=0',Number(match[1])).length){
      say(Number(match[1]),'To‘lov bo‘yicha javob: '+match[2])
      run('DELETE FROM payment_support WHERE buyer=?',Number(match[1]))
      say(id,'Javob yuborildi.')
    }else say(id,'Ochiq murojaat ID’si va javobni kiriting.')
    return true
  }
  const pending=run('SELECT touched FROM payment_support WHERE buyer=?',id)[0]
  if(pending?.touched){
    if(!t.startsWith('/') && t && Date.now()-pending.touched<600000 && owner){
      run('UPDATE payment_support SET touched=0 WHERE buyer=?',id)
      say(Number(owner),'To‘lov bo‘yicha murojaat · '+id+'\n'+t.slice(0,3200)+'\nJavob: /supportreply '+id+' matn')
      say(id,'Murojaat yuborildi.')
      return true
    }
    run('DELETE FROM payment_support WHERE buyer=?',id)
    if(t==='/cancel'){say(id,'Murojaat bekor qilindi.');return true}
  }
  return false
}
export function premiumCard(run,user,action,say,enqueue){
  const btn=(text,data)=>({text,callback_data:'premium:'+data})
  const [op,key]=action.split(':')
  const p=Object.hasOwn(plans,key||'')?plans[key]:null
  const stars=p && price(run,key)
  if(op==='buy' && p && stars>0){
    const payload=crypto.randomUUID()
    run('INSERT INTO orders VALUES(?,?,?,?,?)',payload,user,key,stars,Date.now())
    enqueue('sendInvoice',{chat_id:user,title:p.title+' · '+p.days+' kun',description:'Profil belgisi va maxsus savol. Bir martalik to‘lov. Faol muddat bo‘lsa, xarid navbatga qo‘shiladi. Yordam: /paysupport',payload,start_parameter:'premium',currency:'XTR',provider_token:'',prices:[{label:p.title,amount:stars}]})
    return
  }
  if(p && (op==='view'||op==='buy')){
    const rows=stars>0?[[btn('⭐ '+stars+' Stars · Xarid qilish','buy:'+key)]]:[]
    rows.push([btn('‹ Tariflarga qaytish','list')])
    return say(user,p.title+' · '+p.days+' kun\n\n'+p.badge+' Suhbatdosh topildi!\nShu belgi profilingizda ko‘rinadi.\n\n🎲 Maxsus savol\n«'+p.question+'»\n\n'+(stars?'Bir martalik narx: '+stars+' Stars.':'Sotuv hali ochilmagan.'),{inline_keyboard:rows})
  }
  const current=membership(run,user)
  say(user,'💎 Premium\n\n'+(current?'Sizda faol: '+plans[current.plan].title+'\n':'')+'Belgi va maxsus savolni ko‘rish uchun tarifni tanlang. Premium faqat to‘lov tasdiqlanganda ochiladi.\nYordam: /paysupport',{inline_keyboard:Object.entries(plans).map(([k,v])=>[btn(v.title+' · '+v.days+' kun'+(price(run,k)?' · ⭐ '+price(run,k):''),'view:'+k)])})
}
