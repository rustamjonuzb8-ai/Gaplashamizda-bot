import {plans} from './premium.mjs'
export const menuPage = `<!doctype html>
<html lang="uz"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="color-scheme" content="dark"><title>Gaplashamizda</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#10131b;color:#f4f4f6;font:16px "Helvetica Neue",Arial,sans-serif}main{max-width:520px;margin:auto;padding:28px 18px calc(24px + env(safe-area-inset-bottom))}
header{display:flex;align-items:center;gap:10px;letter-spacing:-.5px;font-size:21px;font-weight:700}header i{display:grid;place-items:center;background:#c2efc7;border-radius:13px;width:38px;height:38px;color:#12281c;font-style:normal}header small{margin-left:auto;border:1px solid #4b515f;border-radius:18px;padding:5px 9px;color:#c9ced7;font-size:12px}
.hero{position:relative;overflow:hidden;margin:28px 0 16px;padding:25px;border-radius:26px;background:linear-gradient(135deg,#c8f3d9,#a6d6e8);color:#102a29}.hero:after{content:'“';position:absolute;right:10px;top:-24px;font:190px Georgia;color:#ffffff55;pointer-events:none}
h1{position:relative;z-index:1;margin:0 0 12px;font-size:clamp(32px,9vw,48px);line-height:1;letter-spacing:-1.8px}.hero p{max-width:270px;line-height:1.45;margin:0 0 24px;color:#253f40}button{cursor:pointer;font:inherit;border:0;border-radius:16px;min-height:48px;font-weight:650}button:focus-visible{outline:3px solid #faad70;outline-offset:3px}.hero button{background:#122d2d;color:white;width:100%}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.tile{padding:17px 12px;text-align:left;background:#222836;color:white}.tile b{display:block;margin-bottom:12px;font-size:23px;color:#afd7e9}
h2{font-size:19px;margin:28px 0 12px}.topics{display:flex;gap:8px;flex-wrap:wrap}.topics button{background:#292c3a;color:#efeaf9;padding:9px 16px;min-height:44px;border-radius:24px}
.premium{margin:24px 0 12px;padding:18px;border:1px solid #544663;border-radius:24px;background:linear-gradient(135deg,#2d243e,#1d202e)}.premium-head,.news{display:flex;align-items:center;justify-content:space-between}.premium h2{margin:0}.premium-head span{font-size:12px;color:#e6cdff}.premium p{color:#cfcbdc;line-height:1.4;font-size:14px}.plans{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.plans button{padding:13px 3px;color:#1a1d2a}.plans b,.plans small{display:block}.plans b{font-size:30px;margin-bottom:7px}.plans small{font-size:12px;font-weight:500;margin-top:3px}.crystal{background:linear-gradient(145deg,#c7f8ff,#89c4e2)}.star{background:linear-gradient(145deg,#f1dfff,#bfa6fa)}.crown{background:linear-gradient(145deg,#fff0bc,#ebbd72)}#preview{margin-top:15px;border-top:1px solid #544663;padding-top:14px}#details{padding:0 15px;background:#ead9fa}.news{margin-top:20px;width:100%;padding:12px 16px;color:white;background:#222836}
#status{color:#b9c8d8;line-height:1.45}button:disabled{opacity:.65}
</style><script src="https://telegram.org/js/telegram-web-app.js"></script>
<main><header><i aria-hidden="true">g.</i> Gaplashamizda <small>18+</small></header>
<section class="hero"><h1>Gaplashamizmi?</h1><p>Suhbatdosh toping. Bir mavzu tanlang yoki suhbatni bir salomdan boshlang.</p><button data-action="search">Suhbatdosh izlash →</button></section>
<div class="grid"><button class="tile" data-action="profile"><b aria-hidden="true">👤</b>Mening profilim</button><button class="tile" data-action="friends"><b aria-hidden="true">🤝</b>Tanishlarim</button></div>
<section class="premium"><div class="premium-head"><h2>Premium</h2><span>🎁 24 soat sinov</span></div><p>Belgini bosing. Suhbatdoshingizga qanday ko‘rinishini ko‘ring.</p><div class="plans">${Object.entries(plans).map(([key,p])=>'<button class="'+p.style+'" data-preview="'+key+'"><b>'+p.badge+'</b>'+p.title.split(' ')[1]+'<small>'+p.days+' kun</small></button>').join('')}</div><div id="preview" hidden><strong id="badge"></strong><p id="question"></p><button id="details">Tarifni ochish →</button></div></section>
<h2>Profilimdagi qiziqish</h2><div class="topics"><button data-action="interest:Kino">🎬 Kino</button><button data-action="interest:Musiqa">🎵 Musiqa</button><button data-action="interest:Sport">⚽ Sport</button><button data-action="interest:Sayohat">🧭 Sayohat</button></div>
<button class="news" data-action="news">🆕 Yangiliklar <span>→</span></button><p id="status" role="status"></p></main><script>
const plans=${JSON.stringify(plans)};
const app=window.Telegram?.WebApp;
document.querySelectorAll('[data-preview]').forEach(card=>card.onclick=()=>{
 const key=card.dataset.preview,p=plans[key];document.querySelector('#preview').hidden=false;
 document.querySelector('#badge').textContent=p.title+' · '+p.days+' kun';
 document.querySelector('#question').textContent='Maxsus savol: '+p.question;
 document.querySelector('#details').dataset.action='premium:view:'+key;
});
app?.ready();app?.expand();
document.addEventListener('click',event=>{
 const button=event.target.closest('button[data-action]');if(!button)return;
 if(!app || app.platform==='unknown'){document.querySelector('#status').textContent='Menyuni Telegramda @Gaplashamizdauzbot orqali oching.';return}
 app.sendData(JSON.stringify({action:button.dataset.action}));
});
</script></html>`
