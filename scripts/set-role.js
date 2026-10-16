/*
 Foydalanuvchiga rol berish (birinchi superadminni yaratish uchun qulay).

 Ishlatish (loyiha ildizidan):
   npm run set-role -- axiy3735@gmail.com superadmin
   npm run set-role -- axiy3735@gmail.com superadmin "Xasanboy"

 Service account: .env dagi FIREBASE_SERVICE_ACCOUNT (JSON matn, bitta qatorda).
*/

import dotenv from "dotenv";
import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

dotenv.config({ quiet: true });

const ROLES = ["superadmin", "director", "deputy", "teacher", "student", "parent"];
const [email, role, name] = process.argv.slice(2);

if (!email || !ROLES.includes(role)) {
  console.error(`Ishlatish: npm run set-role -- <email> <${ROLES.join("|")}> ["Ism Familiya"]`);
  process.exit(1);
}

const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
const app = initializeApp({ credential: raw ? cert(JSON.parse(raw)) : applicationDefault() });
const auth = getAuth(app);
const db = getFirestore(app);

try {
  const user = await auth.getUserByEmail(email);
  const data = { role, email, updatedAt: FieldValue.serverTimestamp() };
  if (name) data.name = name;
  await db.collection("users").doc(user.uid).set(data, { merge: true });
  console.log(`✔ ${email} -> ${role} (uid: ${user.uid})`);
} catch (error) {
  if (error.code === "auth/user-not-found") {
    console.error(`✖ ${email} Firebase Authentication'da topilmadi. Avval Console'da foydalanuvchini yarating.`);
  } else {
    console.error("✖", error.message);
  }
  process.exit(1);
}
