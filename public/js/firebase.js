import { FIREBASE_VERSION, FIREBASE_CONFIG } from "./config.js";

/*
 Firebase SDK faqat shu fayl orqali yuklanadi. Versiya config.js dagi
 FIREBASE_VERSION dan olinadi, boshqa modullar SDK URL'ini bilmaydi.
*/
const base = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;

const [appSdk, authSdk, firestoreSdk, storageSdk] = await Promise.all([
  import(`${base}/firebase-app.js`),
  import(`${base}/firebase-auth.js`),
  import(`${base}/firebase-firestore.js`),
  import(`${base}/firebase-storage.js`),
]);

const app = appSdk.initializeApp(FIREBASE_CONFIG);

export const auth = authSdk.getAuth(app);
export const db = firestoreSdk.getFirestore(app);
export const storage = storageSdk.getStorage(app);

export const {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  signOut,
} = authSdk;

export const {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  getCountFromServer,
  getAggregateFromServer,
  average,
  count,
} = firestoreSdk;

export const { ref: storageRef, uploadBytes, getDownloadURL, deleteObject } = storageSdk;

/* Kolleksiyadagi barcha hujjatlar: [{ id, ...data }] */
export async function listDocs(name) {
  const snapshot = await firestoreSdk.getDocs(firestoreSdk.collection(db, name));
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

/* Shartli so'rov: queryDocs("journal", where(...), where(...)) -> [{ id, ...data }] */
export async function queryDocs(name, ...constraints) {
  const snapshot = await firestoreSdk.getDocs(
    firestoreSdk.query(firestoreSdk.collection(db, name), ...constraints)
  );
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}
