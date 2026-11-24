import {webhookSecret} from './worker.mjs'
const {BOT_TOKEN,WORKER_URL}=process.env
if (!BOT_TOKEN || !WORKER_URL) throw Error('BOT_TOKEN va WORKER_URL kerak')
const url=new URL('/telegram',WORKER_URL)
if (url.protocol!=='https:') throw Error('HTTPS manzil kerak')
async function api(method, body) {
  const response=await fetch('https://api.telegram.org/bot'+BOT_TOKEN+'/'+method,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)})
  const result=await response.json()
  if (!result.ok) throw Error(method+' bajarilmadi ('+response.status+')')
  return result.result
}
const bot = await api('getMe', {})
if (bot.username?.toLowerCase() !== 'gaplashamizdauzbot') {
  throw Error('BOT_TOKEN @Gaplashamizdauzbot uchun bo‘lishi kerak')
}
await api('setWebhook',{url:url.href,secret_token:await webhookSecret(BOT_TOKEN),allowed_updates:['message','callback_query','pre_checkout_query'],max_connections:1})
if ((await api('getWebhookInfo',{})).url!==url.href) throw Error('Webhook manzili mos kelmadi')
console.log('Telegram ulanishi tasdiqlandi.')

const probe=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','X-Bot-Probe':'conversation','X-Telegram-Bot-Api-Secret-Token':await webhookSecret(BOT_TOKEN)},body:'{}'})
if(!probe.ok || await probe.text()!=='conversation-ok') throw Error('Live Gemini conversation check failed: '+probe.status)
console.log('Three queued Gemini replies verified, including retained context.')
