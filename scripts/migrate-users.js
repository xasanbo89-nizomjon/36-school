/*
 Bir martalik migratsiya: users hujjatlarini "ID = email-bo'yicha/tasodifiy" dan
 "ID = Firebase Auth uid" ga ko'chiradi.

 Ishlatish (loyiha ildizidan):

   1) Quruq yurgizish (hech narsa yozilmaydi, faqat nima bo'lishi ko'rsatiladi):
        node scripts/migrate-users.js

   2) Haqiqiy ko'chirish (yangi users/{uid} hujjatlari yaratiladi, eskilari qoladi):
        node scripts/migrate-users.js --apply

   3) Hammasi to'g'ri ekaniga ishonch hosil qilgach, eski hujjatlarni o'chirish:
        node scripts/migrate-users.js --apply --delete-old

 Service account:
   - FIREBASE_SERVICE_ACCOUNT (JSON matn) .env faylida, yoki
   - GOOGLE_APPLICATION_CREDENTIALS = service account JSON fayl yo'li, yoki
   - --key=./serviceAccount.json (bu faylni git'ga qo'shmang!)
*/

import fs from "node:fs";
import dotenv from "dotenv";
import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

dotenv.config({ quiet: true });

const ROLES = ["superadmin", "director", "deputy", "teacher", "student", "parent"];

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const DELETE_OLD = args.includes("--delete-old");
const keyArg = args.find((arg) => arg.startsWith("--key="));

function loadCredential() {
  if (keyArg) {
    return cert(JSON.parse(fs.readFileSync(keyArg.slice("--key=".length), "utf8")));
  }
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return applicationDefault();
  }
  console.error("Service account topilmadi. FIREBASE_SERVICE_ACCOUNT ni .env ga qo'ying yoki --key=fayl.json bering.");
  process.exit(1);
}

initializeApp({ credential: loadCredential() });

const auth = getAuth();
const db = getFirestore();

async function authUserExists(uid) {
  try {
    await auth.getUser(uid);
    return true;
  } catch (error) {
    if (error.code === "auth/user-not-found") return false;
    throw error;
  }
}

async function authUserByEmail(email) {
  try {
    return await auth.getUserByEmail(email);
  } catch (error) {
    if (error.code === "auth/user-not-found") return null;
    throw error;
  }
}

async function main() {
  console.log(APPLY ? "REJIM: haqiqiy yozish (--apply)" : "REJIM: quruq yurgizish (hech narsa o'zgarmaydi)");

  const snapshot = await db.collection("users").get();
  console.log(`users kolleksiyasida ${snapshot.size} ta hujjat bor.\n`);

  const stats = { alreadyUid: 0, migrated: 0, skipped: 0, deleted: 0 };
  const plannedByUid = new Map(); // bir xil email'li ikkita eski hujjatni aniqlash uchun

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const label = `[${docSnap.id}] ${data.email ?? "(email yo'q)"}`;

    // Hujjat ID allaqachon Auth uid bo'lsa — tegilmaydi
    if (await authUserExists(docSnap.id)) {
      stats.alreadyUid++;
      console.log(`OK        ${label} — allaqachon uid bo'yicha`);
      if (!ROLES.includes(data.role)) console.log(`  ! ogohlantirish: rol "${data.role}" noma'lum, foydalanuvchi "guest" bo'ladi`);
      continue;
    }

    const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
    if (!email) {
      stats.skipped++;
      console.log(`O'TKAZILDI ${label} — email maydoni yo'q`);
      continue;
    }

    const authUser = await authUserByEmail(email);
    if (!authUser) {
      stats.skipped++;
      console.log(`O'TKAZILDI ${label} — Firebase Auth'da bu email bilan foydalanuvchi topilmadi`);
      continue;
    }

    if (plannedByUid.has(authUser.uid)) {
      stats.skipped++;
      console.log(`O'TKAZILDI ${label} — ${email} uchun boshqa eski hujjat (${plannedByUid.get(authUser.uid)}) allaqachon bor, qo'lda hal qiling`);
      continue;
    }

    const target = db.collection("users").doc(authUser.uid);
    if ((await target.get()).exists) {
      stats.skipped++;
      console.log(`O'TKAZILDI ${label} — users/${authUser.uid} allaqachon mavjud (ustiga yozilmaydi)`);
      continue;
    }

    plannedByUid.set(authUser.uid, docSnap.id);
    if (!ROLES.includes(data.role)) {
      console.log(`  ! ogohlantirish: rol "${data.role}" noma'lum — ko'chiriladi, lekin foydalanuvchi "guest" bo'ladi`);
    }

    console.log(`KO'CHIRISH ${label} -> users/${authUser.uid} (rol: ${data.role ?? "yo'q"})`);

    if (APPLY) {
      await target.set({ ...data, email });
      stats.migrated++;
      if (DELETE_OLD) {
        await docSnap.ref.delete();
        stats.deleted++;
        console.log(`  eski hujjat o'chirildi: users/${docSnap.id}`);
      }
    } else {
      stats.migrated++;
    }
  }

  console.log(`\nNatija: uid bo'yicha tayyor ${stats.alreadyUid}, ko'chirilgan${APPLY ? "" : " (reja)"} ${stats.migrated}, o'tkazilgan ${stats.skipped}, o'chirilgan ${stats.deleted}`);
  if (!APPLY) console.log("Haqiqiy ko'chirish uchun: node scripts/migrate-users.js --apply");
  if (APPLY && !DELETE_OLD && stats.migrated > 0) {
    console.log("Eski hujjatlarni o'chirish uchun tekshirib bo'lgach: node scripts/migrate-users.js --apply --delete-old");
  }
}

main().catch((error) => {
  console.error("Migratsiya xatosi:", error);
  process.exit(1);
});
