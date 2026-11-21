export const plans = {
  crystal:{title:'💎 Kristal',days:7,badge:'💎',style:'crystal',question:'Hayotingizdagi qaysi kichik odat kuningizni yaxshilaydi?'},
  star:{title:'🌟 Yulduz',days:14,badge:'🌟',style:'star',question:'Bolalikdagi bir orzuingizni hozir bajara olsangiz, qaysini tanlardingiz?'},
  crown:{title:'👑 Toj',days:30,badge:'👑',style:'crown',question:'Biror inson siz haqingizda qaysi jihatingizni darrov sezishini istardingiz?'}
}
export const premiumSchema=`
CREATE TABLE IF NOT EXISTS memberships(user INTEGER PRIMARY KEY, plan TEXT NOT NULL, until_ms INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS trials(user INTEGER PRIMARY KEY);
`
export function membership(run,user){
  return run('SELECT plan,until_ms FROM memberships WHERE user=? AND until_ms>?',user,Date.now())[0]
}
export function grant(run,user,key,days){
  if(!Object.hasOwn(plans,key)) return
  run('INSERT OR REPLACE INTO memberships VALUES(?,?,?)',user,key,Date.now()+days*86400000)
}
export function premiumCard(run,user,action,say) {
  const btn=(text,data)=>({text,callback_data:'premium:'+data})
  const [op,key]=action.split(':')
  const plan=Object.hasOwn(plans,key||'')?plans[key]:null
  let current=membership(run,user)
  if(op==='trial' && plan && !current && run('INSERT OR IGNORE INTO trials VALUES(?) RETURNING user',user).length){
    grant(run,user,key,1)
    current=membership(run,user)
  }
  const used=run('SELECT user FROM trials WHERE user=?',user).length>0
  if(op==='view' && plan){
    const preview=plan.badge+' Suhbatdosh topildi!'
    const rows=used||current?[]:[[btn('🎁 24 soat bepul sinash','trial:'+key)]]
    rows.push([btn('‹ Barcha tariflar','list')])
    return say(user,plan.title+' · '+plan.days+' kun\n\nSuhbatdoshingiz sizni shunday ko‘radi:\n'+preview+'\n\n🎲 Maxsus savolingiz\n«'+plan.question+'»\n\nTo‘liq muddatni admin sovg‘a qilishi mumkin.',{inline_keyboard:rows})
  }
  const status=current?'Faol: '+plans[current.plan].title+' · '+Math.ceil((current.until_ms-Date.now())/3600000)+' soat qoldi.':used?'Bepul sinov ishlatilgan.':'Bir tarifni 24 soat bepul sinab ko‘ring.'
  say(user,'💎 Premium\n\n'+status+'\nTarifni bosib, belgi va maxsus savolni ko‘ring.',{inline_keyboard:Object.entries(plans).map(([key,p])=>[btn(p.title+' · '+p.days+' kun','view:'+key)])})
}
