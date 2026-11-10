# 36 School — Zamonaviy Maktab Boshqaruv Tizimi

36-sonli ixtisoslashtirilgan umumta'lim maktabi uchun to'liq ishlaydigan elektron boshqaruv va ta'lim monitoringi platformasi (Vanilla JS + ES Modules + Express + Resilient Unified Store & Firebase).

## Asosiy Imkoniyatlar

1. **🚀 1-Klikda Tezkor Demo Kirish (Bir marta bosishda):**
   - 👑 **Direktor** (Sherzod Aliyev — to'liq maktab monitoringi va boshqaruv)
   - 👨‍🏫 **O'qituvchi** (Zilola Karimova — dars jadvali, baholash, yo'qlama, vazifalar)
   - 🧑‍🎓 **O'quvchi** (Javohir Rustamov — shaxsiy kundalik, baholar, jadval, vazifalar)
   - 👨‍👩‍👧 **Ota-ona** (Dilshod Rustamov — farzandining davomati, baholari va kundaligi)
   - ⚡ **Superadmin** (Administrator — tizim sozlamalari va foydalanuvchilar)
   - Parol terish talab etilmaydi, lekin xohlagan foydalanuvchi standart email/parol orqali ham kira oladi.

2. **📊 Boshqaruv Paneli (Dashboard):**
   - Raqamlar animatsiyasi (`countUp`: O'quvchilar: 1,248, O'qituvchilar: 84, Sinflar: 42, Davomat: 96.8%).
   - **Jonli dars va qo'ng'iroqlar statusi** (Yashil/Sariq pulsatsiya qiluvchi nuqta, dars raqami va keyingi tanaffusgacha daqiqalar).
   - Oylik davomat va sinflar o'zlashtirish dinamikasi (Chart.js interaktiv grafik).
   - Eng namunali sinflar reytingi (Top sinflar oltin, kumush, bronza medallari bilan).
   - Tezkor amallar tugmalari (Yo'qlama qilish, Vazifa berish, Dars jadvali, E'lon).
   - So'nggi maktab yangiliklari vidjeti.

3. **🏫 Maktab Sinflari va O'quvchilar Tarkibi (Classes & Students):**
   - Sinflar kartochkalari (1-A dan 11-A gacha, xona, smena, sinf rahbari, o'quvchilar soni).
   - Bosqichlar bo'yicha filtrlar: Barcha sinflar, Boshlang'ich (1-4), O'rta (5-9), Yuqori (10-11).
   - Qidiruv qutisi (Sinf nomi yoki o'qituvchi bo'yicha).
   - **👁️ O'quvchilar ro'yxati modali**: har bir sinfdagi o'quvchilar ro'yxati (F.I.SH, ota-onasi, telefon, o'zlashtirish yulduzlari) va yangi o'quvchi qo'shish imkoni.
   - Yangi sinf qo'shish va o'chirish.

4. **📋 Haqiqiy Kundalik Yo'qlama (Daily Student Attendance):**
   - Sinfni tanlash (9-A, 10-A, 1-A...) va sana tanlash (kalendardan).
   - Har bir o'quvchiga 4 ta statusdan birini belgilash:
     - 🟢 **✓ Bor (Kelgan)**
     - 🟠 **⏱ Kechikdi**
     - 🟡 **📋 Sababli**
     - 🔴 **✗ Yo'q (Sababsiz)**
   - "Barchasini kelgan deb belgilash" (1-klikda to'liq to'ldirish).
   - Jonli davomat statistikasi (Bor, Kechikkan, Sababli, Yo'q soni va umumiy foiz).
   - "Davomatni saqlash" tugmasi: ma'lumotlar saqlanadi, dashboard va sinflar reytingi avtomatik yangilanadi!

5. **📅 Dars Jadvali (Timetable):**
   - Sinflar bo'yicha dars jadvali.
   - Hafta kunlari tablari: Dushanba, Seshanba, Chorshanba, Payshanba, Juma, Shanba.
   - Har bir dars: Dars raqami (1-6), Vaqti (08:30-09:15...), Fan nomi, Ustoz, Xona raqami.
   - Yangi dars qo'shish modali va "Jadvalni chop etish" (Print) tugmasi.

6. **⭐ Elektron Baholar Jurnali (Gradebook & GPA):**
   - Sinf va fanni tanlash (9-A, Algebra, Fizika, Ingliz tili...).
   - O'quvchilar ro'yxati va ularga qo'yilgan baholar katakchalari (5, 4, 3, 2).
   - O'qituvchi bitta bosishda tezkor baho qo'ya oladi (5, 4, 3, 2 tugmalari).
   - Har bir o'quvchining o'rtacha bali (GPA: 4.8 / 5.0) avtomatik hisoblanadi.

7. **📝 Uyga Vazifalar (Homework & Tasks):**
   - Fan nomi, sinf, vazifa sarlavhasi, topshirish muddati (due date) va qolgan vaqt indikatori.
   - O'quvchilar uchun "Bajarildi deb belgilash" (Mark as done) tugmasi.
   - O'qituvchilar uchun yangi vazifa berish va o'chirish.

8. **👨‍🏫 Pedagoglar Jamoasi (Teachers Directory):**
   - Maktab o'qituvchilari kartochkalari (avatar harflar, to'liq ism, fani, toifasi, telefoni, xonasi, haftalik dars yuklamasi).
   - Qidiruv va saralash.
   - Yangi o'qituvchi kiritish modali.

9. **📢 Maktab E'lonlari va Yangiliklar (Announcements):**
   - Muhim yangiliklar, olimpiada g'oliblari, ota-onalar majlisi xabarlari.
   - Kategoriya teglari ("MUHIM", "Yutuqlarimiz", "Tadbir", "Majlis").
   - Ko'rishlar soni va sanasi.

10. **🖼️ Maktab Fotogalereyasi (Gallery & Lightbox):**
    - Zamonaviy fotosuratlar gridi.
    - Rasm ustiga bosilganda **Lightbox modal** — rasm butun ekranda kattalashib, silliq animatsiya bilan ko'rinadi.
    - Yangi rasm qo'shish va o'chirish.

11. **⚙️ Sozlamalar va Profil (Settings):**
    - Shaxsiy profilni tahrirlash (Ism, telefon).
    - Maktab parametrlari (36-sonli maktab, manzil, aloqa telefonlari).

12. **🔔 Bildirishnomalar Paneli (Notification Center):**
    - Topbardagi qo'ng'iroqcha ikonkasi (yangi xabarlar soni tebranish animatsiyasi bilan).
    - Ochilganda barcha so'nggi bildirishnomalar ro'yxati va "Barchasini o'qilgan qilish".

13. **✨ Animatsiyalar va Chotki Dizayn:**
    - Sahifalar o'tishida silliq `@keyframes fadeSlideUp`.
    - Kartochkalar ustiga kelganda yengil ko'tarilish (`translateY(-4px)`), neon soya va nur.
    - Qo'ng'iroqcha tebranishi (`bellRing`).
    - Jonli dars holati radar pulsatsiyasi (`pulseDot`).
    - Raqamlar hisoblash effekti (`countUp`).
    - Yorug' va qorong'i rejimlar (Light / Dark mode).
    - Uchta to'liq til: O'zbekcha (`uz`), Ruscha (`ru`), Inglizcha (`en`).

## Ishga Tushirish

```bash
# Loyiha papkasida
cd 36-school-system
npm install
node server.js
```

Yoki brauzerda oching:
👉 **http://localhost:3000**
