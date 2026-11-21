export const menuPage = `<!doctype html>
<html lang="uz"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="color-scheme" content="dark"><title>Gaplashamizda</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#10131b;color:#f4f4f6;font:16px "Helvetica Neue",Arial,sans-serif}main{max-width:520px;margin:auto;padding:28px 18px calc(24px + env(safe-area-inset-bottom))}
header{display:flex;align-items:center;gap:10px;letter-spacing:-.5px;font-size:21px;font-weight:700}header i{display:grid;place-items:center;background:#c2efc7;border-radius:13px;width:38px;height:38px;color:#12281c;font-style:normal}header small{margin-left:auto;border:1px solid #4b515f;border-radius:18px;padding:5px 9px;color:#c9ced7;font-size:12px}
.hero{position:relative;overflow:hidden;margin:28px 0 16px;padding:25px;border-radius:26px;background:linear-gradient(135deg,#c8f3d9,#a6d6e8);color:#102a29}.hero:after{content:'“';position:absolute;right:10px;top:-24px;font:190px Georgia;color:#ffffff55;pointer-events:none}
h1{position:relative;z-index:1;margin:0 0 12px;font-size:clamp(32px,9vw,48px);line-height:1;letter-spacing:-1.8px}.hero p{max-width:270px;line-height:1.45;margin:0 0 24px;color:#253f40}button{cursor:pointer;font:inherit;border:0;border-radius:16px;min-height:48px;font-weight:650}button:focus-visible{outline:3px solid #faad70;outline-offset:3px}.hero button{background:#122d2d;color:white;width:100%}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.tile{padding:17px 12px;text-align:left;background:#222836;color:white}.tile b{display:block;margin-bottom:12px;font-size:23px;color:#afd7e9}
h2{font-size:19px;margin:28px 0 12px}.topics{display:flex;gap:8px;flex-wrap:wrap}.topics button{background:#292c3a;color:#efeaf9;padding:9px 16px;min-height:44px;border-radius:24px}
#status{color:#b9c8d8;line-height:1.45}button:disabled{opacity:.65}
</style><script src="https://telegram.org/js/telegram-web-app.js"></script>
<main><header><i aria-hidden="true">g.</i> Gaplashamizda <small>18+</small></header>
<section class="hero"><h1>Gaplashamizmi?</h1><p>Suhbatdosh toping. Ismingizni ochmasdan yozishishingiz mumkin.</p><button data-action="search">Suhbatdosh izlash →</button></section>
<div class="grid"><button class="tile" data-action="profile"><b aria-hidden="true">◉</b>Mening profilim</button><button class="tile" data-action="friends"><b aria-hidden="true">✦</b>Tanishlarim</button></div>
<h2>Profilimdagi qiziqish</h2><div class="topics"><button data-action="interest:Kino">🎬 Kino</button><button data-action="interest:Musiqa">🎵 Musiqa</button><button data-action="interest:Sport">⚽ Sport</button><button data-action="interest:Sayohat">🧭 Sayohat</button></div>
<p id="status" role="status"></p></main><script>
const app=window.Telegram?.WebApp;
app?.ready();app?.expand();
document.addEventListener('click',event=>{
 const button=event.target.closest('button[data-action]');if(!button)return;
 if(!app || app.platform==='unknown'){document.querySelector('#status').textContent='Menyuni Telegramda @Gaplashamizdauzbot orqali oching.';return}
 app.sendData(JSON.stringify({action:button.dataset.action}));
});
</script></html>`
