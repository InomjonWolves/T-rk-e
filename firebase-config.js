// Firebase sozlamalari. Firebase konsolida: Project settings → General → Your apps → Web app → "Config".
// Bu qiymatlar maxfiy emas: ular har bir saytda ochiq turadi, xavfsizlikni Firestore qoidalari taʼminlaydi.
// Sozlama boʻsh boʻlsa, sayt roʻyxatdan oʻtishsiz (mehmon rejimida) ishlaydi.
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyD418EsdA1wnm0eTrM-PUAj8G_Frz-ICn0",
  authDomain: "t-rk-e.firebaseapp.com",
  projectId: "t-rk-e",
  storageBucket: "t-rk-e.firebasestorage.app",
  messagingSenderId: "614558378510",
  appId: "1:614558378510:web:59588bcf1bb2d9a7846a5f"
};
// Qoʻshimcha kirish usullari (sozlanmaguncha tugmalar koʻrinmaydi).
// apple: Firebase konsolida Apple provayderi yoqilgach true qiling.
// telegram: botId — bot tokenidagi ":" dan oldingi raqam (maxfiy emas); url — Cloudflare Worker manzili.
window.AUTH_PROVIDERS = {
  apple: false,
  telegram: { botId: "", url: "" }
};
// Google/Apple oynasi sayt bilan bir domenda ochiladigan saytlar (Firebase Hosting'dagi saytlar).
// Shart: Google Cloud → Credentials → Web client → "Authorized redirect URIs" da https://<domen>/__/auth/handler bor boʻlishi.
// Boʻsh boʻlsa, oyna t-rk-e.firebaseapp.com da ochiladi.
window.AUTH_SAME_DOMAIN = [];
/* Namuna:
window.FIREBASE_CONFIG = {
  apiKey: "AIza...",
  authDomain: "turkce-yol.firebaseapp.com",
  projectId: "turkce-yol",
  storageBucket: "turkce-yol.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};
*/
