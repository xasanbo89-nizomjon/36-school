# 36 School

Maktab boshqaruv platformasi (elektron jurnal, kundalik, dars jadvali): vanilla HTML/CSS/JS (ES modules) + Firebase Auth/Firestore + Express.

## Tuzilma

```
lib/api-app.js         Express API: /api/users, /api/health (Firebase Admin: hisob yaratish, parol, o'chirish)
api/index.js           Vercel funksiyasi: lib/api-app.js ni eksport qiladi
local-server.js        faqat lokal: API + public/ static (npm start)
vercel.json            Vercel sozlamasi: outputDirectory=public, /api/* -> api/index, xavfsizlik header'lari
public/
  index.html           login + ilova (SVG ikonka sprite shu yerda)
  style.css            dizayn tizimi: CSS o'zgaruvchilar, yorug'/qorong'i tema, responsive
  js/
    main.js            kirish nuqtasi; bo'limlar birinchi ochilganda yuklanadi (lazy)
    config.js          Firebase config, API_BASE, LOGIN_DOMAIN, rollar, ruxsatlar, menyu
    firebase.js        Firebase SDK yagona shlyuzi
    api.js             server API chaqiruvi (ID token bilan)
    data.js            umumiy kesh: users, classes, subjects + sana yordamchilari
    auth.js / login.js profil va rol, login (login yoki email), parolni tiklash
    layout.js / router.js / theme.js   menyu, bo'limlar, tema
    i18n.js + i18n-school.js           uz / ru / en lug'atlar
    ui.js              Modal (select, sana, multiselect), Confirm, Toast, Tabs, CSV eksport
    modules/           dashboard, journal, diary, schedule, homework, classes, users, subjects, gallery
firestore.rules        Firestore xavfsizlik qoidalari
firestore.indexes.json kerakli indekslar
storage.rules          Storage xavfsizlik qoidalari
scripts/set-role.js    foydalanuvchiga rol berish (birinchi superadmin uchun)
scripts/migrate-users.js   bir martalik migratsiya
```

## Lokal ishga tushirish

```bash
npm install
npm start        # http://localhost:3000
npm run dev      # fayl o'zgarganda qayta ishga tushadi (node --watch)
```

## .env

`cp .env.example .env` qiling va `FIREBASE_SERVICE_ACCOUNT` ni to'ldiring. Usiz sayt ochiladi, lekin
**foydalanuvchi qo'shish / parol berish ishlamaydi** (server `admin-not-configured` xatosini qaytaradi).

## Interfeys

- **Login:** parolni ko'rsatish/yashirish, "Meni eslab qol" (local/session persistence), "Parolni unutdingizmi?" (modal + `sendPasswordResetEmail`), xatolar forma ichida o'zbekcha (ru/en ham bor), til va tema tugmalari.
- **Tema:** tizim sozlamasiga mos boshlanadi; tugma bilan almashtirilsa `localStorage` (`theme`) da saqlanadi.
- **Navigatsiya:** desktopda chap sidebar (yig'iladi, holati saqlanadi), planshetda ikonkali sidebar, telefonda pastki menyu. Bandlar rolga qarab chiqadi (`config.js` dagi `SECTIONS`).
- **Komponentlar:** `prompt/alert/confirm` o'rniga `openFormModal`, `confirmDialog`, `toast` (`ui.js`); yuklanishda skeleton, bo'sh holatda empty state.

## Bo'limlar

| Bo'lim | Kim ko'radi | Nima qiladi |
|---|---|---|
| Boshqaruv | hamma | Ma'muriyat/o'qituvchi: bugungi davomat, o'rtacha baho, 2 haftalik davomat grafigi, sinflar reytingi, bugun kelmaganlar. O'quvchi/ota-ona: shaxsiy statistika, bugungi darslar, fanlar bo'yicha o'rtacha, so'nggi baholar |
| Jurnal | xodimlar | Dars bo'yicha baho (5–2) + davomat (keldi/kechikdi/sababli/kelmadi) + izoh; oylik jurnal jadvali, Excel (CSV) eksport |
| Kundalik | o'quvchi, ota-ona | Haftalik kundalik: darslar, baholar, davomat, uy vazifalari |
| Jadval | hamma | 6 kun × 8 soat dars jadvali; ma'muriyat katakchani bosib tahrirlaydi; o'qituvchida "Mening darslarim" |
| Vazifalar | hamma | Sinf + fan + muddat bilan uy vazifasi |
| Sinflar | xodimlar | Sinf rahbari, o'quvchilar soni va ro'yxati |
| Foydalanuvchilar | ma'muriyat | Hisob yaratish (login/parol avtomatik), ro'yxat bilan ommaviy qo'shish, yangi parol berish, ota-onani farzandga bog'lash |
| Fanlar | ma'muriyat | Fanlar ro'yxati (bir bosishda standart ro'yxat) |

## Ma'lumotlar tuzilmasi (Firestore)

| Kolleksiya | Hujjat ID | Asosiy maydonlar |
|---|---|---|
| `users` | Auth uid | `name`, `email`, `role`, `classId` (o'quvchi), `childIds` (ota-ona), `phone`, `plan` |
| `classes` | avto | `name`, `homeroomTeacherId`, `homeroomTeacherName` |
| `subjects` | avto | `name` |
| `lessons` | `sinf_kun_soat` | `classId`, `weekday` (1–6), `period` (1–8), `subjectId`, `teacherId`, `room` |
| `journal` | `sana_sinf_fan_o'quvchi` | `studentId`, `classId`, `subjectId`, `date` (YYYY-MM-DD), `status`, `grade` (1–5, ixtiyoriy), `gradeType`, `comment` |
| `homework` | avto | `title`, `description`, `classId`, `subjectId`, `dueDate` |
| `gallery` | avto | `title`, `image` |

Eski `attendance` (sinf foizi) yozuvlari bazada qoladi, lekin endi ishlatilmaydi — davomat jurnaldan hisoblanadi.

## Rollar

Rol yo'q yoki noma'lum bo'lsa — **guest**: hech narsa o'qiy/yoza olmaydi.

| Amal | superadmin | director | deputy | teacher | student | parent |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Foydalanuvchi qo'shish (o'qituvchi, o'quvchi, ota-ona) | ✅ | ✅ | ✅ | | | |
| Ma'muriyat (direktor, o'rinbosar) qo'shish | ✅ | o'rinbosar | | | | |
| Sinflar, fanlar, jadvalni tahrirlash | ✅ | ✅ | ✅ | | | |
| Jurnalga baho/davomat yozish | ✅ | ✅ | ✅ | ✅ | | |
| Jurnalni o'qish | hammasi | hammasi | hammasi | hammasi | faqat o'zini | faqat farzandini |
| Vazifa qo'shish | ✅ | ✅ | ✅ | ✅ | | |
| Galereya | ✅ | ✅ | | | | |

Hisoblarni faqat server (`lib/api-app.js`, Firebase Admin) yaratadi: u ID tokenni tekshiradi va rolni Firestore'dan o'qiydi.
Hech kim o'z rolini o'zgartira olmaydi.

### O'quvchilar login bilan kiradi

Emaili yo'q o'quvchi `ali.valiyev` login bilan kiradi — ichkarida bu `ali.valiyev@36-school.uz` (`LOGIN_DOMAIN`).
Bunday hisoblarga parolni tiklash xati bormaydi: ma'muriyat **"Yangi parol berish"** (🔑) tugmasi bilan yangi parol beradi.

### Birinchi superadmin

1. Firebase Console → Authentication → **Add user** (o'z emailingiz va parol).
2. `.env` da `FIREBASE_SERVICE_ACCOUNT` bo'lsin, keyin:
   ```bash
   npm run set-role -- axiy3735@gmail.com superadmin "Ism Familiya"
   ```
3. Saytga kiring → **Fanlar** → "Standart fanlar ro'yxatini qo'shish" → **Sinflar** → **Foydalanuvchilar** → **Jadval**.

## Firestore rules, indekslar va Storage

1. [Firebase Console](https://console.firebase.google.com) → loyiha `school-system-54307`.
2. **Firestore Database → Rules**: hamma matnni o'chirib, `firestore.rules` ni joylang → **Publish**.
3. **Storage → Rules**: `storage.rules` ni joylang → **Publish**.
4. **Indekslar** (jurnal va kundalik uchun shart): Firestore Database → **Indexes → Composite → Create index**,
   kolleksiya `journal`, uchtasini yarating:
   - `classId` ↑, `subjectId` ↑, `date` ↑ (oylik jurnal)
   - `studentId` ↑, `date` ↑ (kundalik, o'quvchi sahifasi)
   - `classId` ↑, `date` ↑ (sinflar reytingi)

   Indeks bir necha daqiqada tayyor bo'ladi. Yaratilmagan bo'lsa, brauzer konsolida Firebase indeksni yaratish
   havolasini ko'rsatadi — uni bosish ham kifoya.

Muqobil (hammasi bir buyruqda): `npm i -g firebase-tools && firebase login && firebase use school-system-54307 && firebase deploy --only firestore,storage`.

## Eski users hujjatlarini uid'ga ko'chirish (bir martalik)

```bash
node scripts/migrate-users.js                       # quruq yurgizish — nima bo'lishi ko'rsatiladi
node scripts/migrate-users.js --apply               # users/{uid} hujjatlarini yaratadi (eskilari qoladi)
node scripts/migrate-users.js --apply --delete-old  # tekshirib bo'lgach, eskilarini o'chiradi
```

## Xavfsizlik

- Static faqat `public/` dan beriladi — `.env`, `lib/api-app.js` ochiq emas.
- Firestore/Storage rules rol bo'yicha server tomonda tekshiradi; jurnal yozuvining ID'si va maydonlari ham tekshiriladi.
- `/api/users`: ID token + rol tekshiruvi, rate limit, CORS faqat `ALLOWED_ORIGINS` uchun.
- Firestore'dan kelgan matn `innerHTML` orqali qo'yilmaydi; galereya rasmlari faqat `https://`.
- Firebase Console → Authentication → Settings → **User actions → "Enable create (sign-up)"** o'chirilgan bo'lsin
  (hisoblarni faqat server yaratadi, server Admin SDK ishlatgani uchun bu unga ta'sir qilmaydi).

## Vercel'ga deploy

1. Vercel → **Add New → Project** → shu repozitoriyani ulang.
2. **Framework Preset = Other** (`vercel.json` build'siz `public/` ni beradi, `/api/*` ni `api/index.js` funksiyasiga yo'naltiradi).
3. **Environment Variables**:
   - `FIREBASE_SERVICE_ACCOUNT` — service account JSON (bitta qatorda)
   - `LOGIN_DOMAIN=36-school.uz`
   - `ALLOWED_ORIGINS=https://36-school.uz,https://www.36-school.uz,https://school-system-54307.web.app,https://school-system-54307.firebaseapp.com,https://36-school.vercel.app`
4. O'zgaruvchilarni o'zgartirgach **Redeploy** qiling (eski deploy yangi qiymatlarni ko'rmaydi).
5. Tekshirish: `/api/health` → `{"ok":true,"admin":true}` (`admin:false` bo'lsa, service account noto'g'ri).
6. Firebase Console → Authentication → Settings → **Authorized domains** ga `36-school.vercel.app` va `36-school.uz` qo'shing.

## Firebase Hosting'ga deploy

Sayt (`public/`) **Firebase Hosting**'da (36-school.uz), API (`/api/*`) esa **Vercel**'da (36-school.vercel.app) turadi.
Brauzer saytni Firebase'dan oladi, `public/js/config.js` dagi `API_BASE` esa API so'rovlarini Vercel'ga yuboradi
(localhost'da `API_BASE` bo'sh — lokal server ishlaydi). Shuning uchun Vercel'dagi `ALLOWED_ORIGINS` ga sayt manzillari kiritilgan bo'lishi shart (CORS).

```bash
npm i -g firebase-tools
firebase login
firebase deploy --only hosting     # faqat sayt (public/)
```

`firebase.json` dagi `hosting` bo'limi `public/` ni beradi, `.firebaserc` loyihani (`school-system-54307`) belgilaydi.
Domen `36-school.uz` Firebase Console → Hosting → **Add custom domain** orqali ulanadi.

## Firebase SDK versiyasi

Faqat `public/js/config.js` dagi `FIREBASE_VERSION` da. Yangilash uchun shu qiymatni o'zgartiring.
