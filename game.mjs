const rounds=[
 ['Dam olish kuni','⛰ Tog‘ga chiqish','🍿 Uyda kino','Tanlagan joyingizga meni olib borsangiz, kunni nimadan boshlardik?'],
 ['Bir kunga imkon','⏳ O‘tmishga qaytish','🚀 Kelajakni ko‘rish','Qaysi yilga borardingiz va kim bilan uchrashardingiz?'],
 ['Bugungi kayfiyat','🎧 Musiqa tinglash','🚶 Sayr qilish','Yo‘lga chiqsak, birinchi qaysi qo‘shiqni qo‘yardingiz?'],
 ['Yo‘lga chiqamiz','🗺 Reja bilan','🎲 Tavakkaliga','Rejasiz qilgan eng yaxshi ishingiz qaysi?'],
 ['Birga tayyorlasak','🍚 Osh','🥟 Manti','Oilangizda bu taomni kim hammadan yaxshi qiladi?'],
 ['Yangi hunar','📷 Suratga olish','🎸 Gitara chalish','Birinchi kimni suratga olardingiz yoki kimga kuy chalardingiz?'],
 ['Bir kechaga','🌌 Yulduzlarni sanash','🏙 Shahar aylanish','Siz bilgan eng chiroyli manzara qayerda?'],
 ['Do‘stlikda','😁 Birga kulish','👂 Tinglay bilish','Do‘stingiz qilgan qaysi kichkina yaxshilik yodingizda qolgan?']
]
export const gameSchema='CREATE TABLE IF NOT EXISTS game_round(room INTEGER PRIMARY KEY, n INTEGER, a INTEGER, b INTEGER);'
export function game(run,room,id,say,action='open'){
  const row=run('SELECT * FROM game_round WHERE room=?',room.id)[0]
  const n=row?.n??0
  if(action==='next-'+n && row && row.a!==null && row.b!==null) action='open'
  if(action==='open'){
    if(!row)run('INSERT INTO game_round VALUES(?,0,NULL,NULL)',room.id)
    const fresh=!row || (row.a!==null && row.b!==null)
    const index=fresh && row?n+1:n
    if(index!==n)run('UPDATE game_round SET n=?,a=NULL,b=NULL WHERE room=?',index,room.id)
    const [title,left,right]=rounds[index%rounds.length]
    for(const who of fresh?[room.a,room.b]:[id]) say(who,'🎭 Ikkidan biri · '+title+'\nIkkalangiz ham tanlang. Javoblar keyin birga ochiladi.',{inline_keyboard:[[{text:left,callback_data:'game:'+room.id+':'+index+'-0'},{text:right,callback_data:'game:'+room.id+':'+index+'-1'}]]})
    return
  }
  if(!row || ![n+'-0',n+'-1'].includes(action))return
  const field=id===room.a?'a':'b'
  if(row[field]!==null)return
  const choice=Number(action.split('-')[1])
  run('UPDATE game_round SET '+field+'=? WHERE room=?',choice,room.id);row[field]=choice
  if(row.a===null||row.b===null)return say(id,'Tanlovingiz saqlandi. Suhbatdoshingiz tanlagach, javoblar ochiladi.')
  const card=rounds[n%rounds.length]
  for(const who of [room.a,room.b]){
    const mine=who===room.a?row.a:row.b,other=who===room.a?row.b:row.a
    say(who,(mine===other?'🤝 Fikringiz bir joydan chiqdi!':'💬 Ikki xil tanlov!')+'\nSiz: '+card[mine+1]+'\nSuhbatdosh: '+card[other+1]+'\n\n'+card[3],{inline_keyboard:[[{text:'🎭 Keyingi savol',callback_data:'game:'+room.id+':next-'+n}]]})
  }
}

export function dailyPoll(run,id,say,day,choice){
  const today=Math.floor((Date.now()+5*3600000)/86400000)
  const card=rounds[today%rounds.length]
  if(day===today && [0,1].includes(choice))
    run('INSERT OR IGNORE INTO daily_votes VALUES(?,?,?)',today,id,choice)
  const mine=run('SELECT pick FROM daily_votes WHERE day=? AND user=?',today,id)[0]
  if(!mine) return say(id,'☀️ Kun savoli · '+card[0]+'\nBugun qaysini tanlardingiz? Ovoz bersangiz, boshqalarning tanlovini ham ko‘rasiz.',{inline_keyboard:[[0,1].map(i=>({text:card[i+1],callback_data:'daily:'+today+':'+i}))]})
  const votes=run('SELECT count(*) AS total,sum(pick) AS second FROM daily_votes WHERE day=?',today)[0]
  say(id,'☀️ Sizning tanlovingiz: '+card[mine.pick+1]+'\n\n'+card[1]+' · '+(votes.total-votes.second)+' ovoz\n'+card[2]+' · '+votes.second+' ovoz\n\n'+card[3])
}
