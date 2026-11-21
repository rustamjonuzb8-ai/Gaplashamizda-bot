# Gaplashamizda

O‘zbekcha anonim matnli Telegram botining birinchi versiyasi. Profil yoshi foydalanuvchi javobiga asoslanadi. Kutish navbati, qiziqish bo‘yicha juftlashish, shahar doirasini kengaytirish, matn uzatish, suhbat mavzulari, ikki tomon roziligidan so‘ng qayta taklif qilish hamda bloklash mavjud. Shikoyatlar reports jadvaliga yoziladi. Admin panel /admin orqali ochiladi. Premium faqat Telegram Stars orqali xarid qilinadi. /admin → Sozlamalar orqali tarifga Stars narxini kiriting. 0 narxda sotuv yopiq. Xaridlar bir martalik. To‘lov bo‘yicha murojaat /paysupport orqali adminga boradi.

## GitHub orqali joylash

1. Fayllarni yangi private GitHub omborining asosiy papkasiga joylang. Yashirin .github/workflows/deploy.yml ham omborda bo‘lishi kerak.
2. BotFather’da /newbot orqali bot oching. Tokenni GitHub omboridagi Settings → Secrets and variables → Actions → New repository secret orqali BOT_TOKEN nomi bilan kiriting.
3. Shu joyda CLOUDFLARE_ACCOUNT_ID va CLOUDFLARE_API_TOKEN ni ham kiriting. Cloudflare tokeni Worker va Durable Object joylash uchun shu hisobga tegishli Edit Cloudflare Workers ruxsatiga ega bo‘lishi kerak. Cloudflare hisobida workers.dev subdomeni yoqilgan bo‘lsin.
4. GitHub’da Actions → Gaplashamizda → Run workflow tugmasini bosing. Jarayon sinovlarni bajaradi, gaplashamizda-bot nomli Workerni joylaydi, bot tokenini Worker secret sifatida saqlaydi va Telegram webhook manzilini tekshiradi. Shu nomli Worker boshqa loyiha uchun ishlatilayotgan hisobda avval yangi nom tanlang va deploy.yml ichidagi URL tekshiruvini moslang.
5. Ikki Telegram akkauntidan /start bosib matn yuboring. /stop, qayta taklif va /report ni ham sinang.

Mahalliy test uchun Node.js 24 bilan node test.mjs buyrug‘ini bajaring. Profil va munosabatlar bitta SQLite Durable Object ichida saqlanadi. Jo‘natish navbatida matn vaqtincha turadi va yetkazish so‘rovi yakunlanganda o‘chiriladi. Telegram javobi yo‘lda uzilsa, qayta urinish xabarni takror yetkazishi mumkin.

## Adminni bir marta ulash

Bot ishga tushgach unga /id yuboring. Raqamni GitHub Actions secrets ichida ADMIN_ID nomi bilan saqlang va deploy workflow’ni qayta ishga tushiring. Shundan keyin /admin faqat shu Telegram akkaunti uchun ochiladi. Oddiy sozlamalar Telegram ichida o‘zgaradi va deploy talab qilmaydi.

Statistikada «faol» belgilangan vaqt ichida botga murojaat qilgan noyob akkauntlarni anglatadi. Eski profilning kirgan sanasi noma’lum bo‘lsa, u yangi ro‘yxatdan o‘tganlar hisobiga qo‘shilmaydi. Panel suhbat matnlarini ko‘rsatmaydi.
