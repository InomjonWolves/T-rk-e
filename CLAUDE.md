# Türkçe Yoʻl — loyiha xulosasi (yangi sessiya uchun)

Oʻzbek tilida soʻzlashuvchilar uchun turk tilini oʻrgatadigan bepul, mobil uchun moʻljallangan PWA sayt.
- Sayt: https://inomjonwolves.github.io/T-rk-e/ (GitHub Pages). Qisqa manzil: Firebase Hosting, sayt nomi `firebase.json` → `hosting.site` (hozir `turkceyol` → https://turkceyol.web.app; `pamuk` nomi band edi). Joylash `.github/workflows/firebase-hosting.yml` orqali `main` ga har push'da (avval testlar); GitHub secret `FIREBASE_SERVICE_ACCOUNT` boʻlmasa oʻtkazib yuboriladi. Sayt nomi band boʻlsa, konsolda boshqa nom bilan sayt yaratib, `firebase.json` dagi `site` ni oʻzgartiring. Yangi domen Firebase Authentication → Authorized domains da boʻlishi kerak.
- Repo: InomjonWolves/T-rk-e, `main` branch. GitHub Pages `main` ildizidan avtomatik joylanadi (build yoʻq, oddiy statik fayllar).
- Foydalanuvchi bilan **faqat oʻzbek tilida** gaplashing.

## Joriy holat — qisqa xulosa (2026-11-02)
**Tayyor va saytda:** A1–B2 kurs, qoʻllanma va 675 ta qoida mashqi; 4 koʻnikma (Okuma, Dinleme, Yazma, Konuşma) boʻyicha mashqlar, hisob va `#skills` paneli; tinglash (TTS) va gapirish (mikrofon) mashqlari; erkin yozishni avtomatik tekshirish; 4 qismli daraja testlari; darajani aniqlash testi; tinglash va gapirish xatolar daftari; anonim analitika (`#admin`). Firestore qoidalari konsolda joylangan (test hisobi bilan tekshirildi), foydalanuvchi `admins/{uid}` hujjatini yaratdi. 29 ta avtomatik test, GitHub Actions'da ham ishlaydi.

**Kutilayotgan ish — turkceyol.web.app:** sayt `turkceyol` yaratilgan, `firebase.json` → `site: "turkceyol"`, GitHub secret `FIREBASE_SERVICE_ACCOUNT` qoʻshilgan (2026-11-02). Birinchi joylash 403 bilan yiqildi: `serviceusage.services.get` ruxsati yoʻq → foydalanuvchi Google Cloud IAM da service account'ga **Service Usage Consumer** (`roles/serviceusage.serviceUsageConsumer`) rolini qoʻshadi. Kerakli rollar jami: Firebase Hosting Admin, API Keys Viewer, Cloud Run Viewer, Service Usage Consumer. Yana: Authentication → Authorized domains ga `turkceyol.web.app`. Shundan keyin workflow'ni ishga tushirib (`workflow_dispatch` yoki `main` ga push), saytni va Google orqali kirishni tekshirish.

**Keyingi mumkin boʻlgan ishlar (foydalanuvchi tanlaydi):** oʻqituvchi va guruh rejimi (yangi Firestore qoidalari kerak); tezlik davomi (`course.js` 273 KB va `app.js` ~250 KB — kursni darajalar boʻyicha keyinroq yuklash; Firebase SDK endi bloklamaydi); .uz domeni (tavsiya `turkceyol.uz`, olinmagan); push eslatmalar (pullik Blaze tarifi kerak, keyinga qoldirilgan).

**Ish tartibi:** `ccr-…` branch'da ishlash → `npm test` → commit → push → `main` ga fast-forward merge → uchta workflow (`Testlar`, `Firebase Hosting`, `pages build and deployment`) yashil ekanini tekshirish.

**Muhit cheklovlari:** sandbox tarmogʻi koʻp saytlarni toʻsadi (sinavmultilevel.uz, MyMemory, `*.web.app`, domen RDAP/cctld.uz). `firestore.googleapis.com` va `identitytoolkit.googleapis.com` ochiq. Firebase konsoliga kirish yoʻq — konsol ishlarini foydalanuvchi qiladi.

## Majburiy qoidalar
- PDF kitob sahifalarini saytda **toʻgʻridan-toʻgʻri koʻrsatmang**, ulardan faqat maʼlumot manbai sifatida foydalaning.
- **"TYS" / "TYS imtihoni"** soʻzlarini va **harbiy mavzudagi** (askar, komutan, kışla, nöbet, tatbikat va h.k.) lugʻat va misollarni ishlatmang. Ularning oʻrniga oddiy kasblar va kundalik hayotdan misol keltiring.
- Uchinchi tomonning rasm yoki videolarini koʻchirmang. Pamuk — oʻzimiz chizgan original SVG.
- Git muallifi: `git -c user.name="InomjonWolves" -c user.email="i.superclub@gmail.com" commit ...`. Sessiya bergan attribution qatorlarini qoʻshing. Repodagi fayllarga model nomlarini yozmang.
- JS, CSS yoki HTML oʻzgarsa, `sw.js` dagi `CACHE` versiyasini oshiring (hozir `turkce-yol-v27`). Yangi fayl qoʻshilsa, uni `ASSETS` roʻyxatiga ham kiriting.
- Joylanganini tekshirish: `gh api repos/InomjonWolves/T-rk-e/actions/runs --jq '[.workflow_runs[]|select(.name=="pages build and deployment")][0]|"\(.status) \(.conclusion) \(.head_sha[0:7])"'`. Testlar: `[.workflow_runs[]|select(.name=="Testlar")][0]`.
- Commit qilishdan oldin `npm test` ni ishga tushiring (hammasi oʻtishi kerak). Yangi funksiya qoʻshsangiz, `tests/` ga test ham qoʻshing.

## Fayllar
| Fayl | Vazifasi |
|---|---|
| `index.html` | Sahifa qobigʻi: auth, welcome, sheet, `#pamuk-say`, `#celebrate`, `#onboard`, pastki menyu |
| `styles.css` | Premium glassmorphism dizayn, kunduzgi va tungi rejim |
| `app.js` | Butun dastur: holat `S` (localStorage `turkce-yol-v1`), router (hash), sahifalar, SRS, XP, streak, liga, yutuqlar, kurs UI, tarjimon, Firebase |
| `content.js` | Asosiy darslar (`UNITS`) va soʻzlar (A1, 500+) |
| `course.js` | `COURSE`: A1–B2 boʻyicha 32 boʻlim (lugʻat, grammatika, dialog, matn, mashqlar) va 4 daraja testi. Kitobdan olingan; harbiy mavzudagi boʻlimlar qayta yozilgan |
| `grammar.js` | Alifbo va grammatika darslari |
| `guide.js` | Grammatika qoʻllanmasi `GUIDE`: Kirish, A1 (33), A2 (29), B1 (27), B2 (23 mavzu). A2–B2 `GUIDE.push(...)` bilan qoʻshilgan |
| `grammar-ex.js` | Qoʻllanma mavzulari boʻyicha qoida mashqlari `BX` (A1–B2, 112 mavzu, 675 mashq). A2–B2 `Object.assign(BX, ...)` bilan qoʻshilgan |
| `cat.js` | Pamuk mushugi: `catSVG({pose,acc,cls})` va `CatLife` (koʻz qisish, qarash, `mood(svg,"happy"/"sad")`) |
| `firebase-config.js`, `firestore.rules` | Firebase (loyiha `t-rk-e`): Auth (email va Google), Firestore `users`, `league`, `avatars`, `stats`, `admins`. **Qoidalar repo’dan avtomatik joylanmaydi** — Firebase konsolida (Firestore → Rules) qoʻlda yangilanadi |
| `sw.js`, `manifest.webmanifest`, `icon*` | PWA |
| `firebase.json`, `.firebaserc` | Firebase Hosting (faqat sayt fayllari; `tests/`, `*.md`, `package.json`, `firestore.rules` joylanmaydi) |
| `privacy.html` | Maxfiylik siyosati |

Asosiy marshrutlar: `#home #course #k-<id> #ktest-<lv> #placement #lessons #grammar #guide #gx #alphabet #practice #rank #profile #achievements #help #translate #skills #write #admin`.

## Hozirgacha qilinganlar
- Darslar, mashqlar (SRS, xatolar daftari), alifbo, TTS talaffuz, grammatika va qoʻllanma, A1–B2 qoida mashqlari.
- Roʻyxatdan oʻtish: email/parol va Google; ism, jins, tugʻilgan sana; profil rasmi (rasm boʻlmasa Pamuk), kichik ♂/♀ stikeri.
- Firestore orqali progress sinxronlanadi; haftalik reyting (liga).
- Glassmorphism dizayn: suzuvchi menyu, hafta qatori, maqsad halqalari, statistika grafigi, tungi rejim (oq dogʻlar tuzatilgan).
- Pamuk: animatsiyalar, kunning vaqtiga qarab salomlashish, parol yozilganda koʻzini yumadi, yonboshdan qoʻl silkitadi.
- Bepul tarjimon (MyMemory API).
- A1–B2 kurs (`course.js`): 32 boʻlim va 4 test; kurs lugʻati umumiy bazaga qoʻshilgan (`ALL` = 1243 soʻz).
- 41 ta yutuq (toifali, +20 XP, konfetti va Pamuk bilan tabriklash, ulashish). Har daraja uchun qoida mashqlari yutugʻi: `gxa1`, `gxa2`, `gxb1`, `gxb2`.
- Pamuk reaksiyalari: toʻgʻri javobda xursand boʻladi, xatoda koʻzidan yosh tomadi.
- Kunlik maslahatlar (20 ta), 4 qadamli tanishtiruv, Yordam sahifasi (PWA oʻrnatish, FAQ), "100% bepul" xabarlari.
- Profildagi avatar ostidagi oval dogʻ (rangli soya) olib tashlangan.
- **4 koʻnikma hisobi** (Okuma `r`, Dinleme `l`, Yazma `w`, Konuşma `s`): `S.sk[id] = [toʻgʻri, urinish, xp, soniya]`, kunlik `S.days[k].sk[id] = [toʻgʻri, urinish, soniya]`. Har mashq `SES.sk` orqali belgilanadi, `skillLog()` va `skillTime()` yozadi. Moslik: test/kartochka/qoida-variant/kurs matni/daraja testi → r; soʻz yozish/qoida-yozish/kurs tarjimasi/erkin yozish (≥10 soʻz) → w; talaffuz → s; tinglash → l; diktant va tushib qolgan soʻz → l+w. Muvozanat = 14 kundagi eng kam toʻgʻri javob / eng koʻp. Sahifa `#skills`, bosh sahifa va profilda karta, yutuqlar `four`, `listen50`.
- **Tinglash mashqlari** (TTS): `listen` (tinglab maʼnosini toping), `dict` (diktant), `lsent` (kurs dialog gaplari: eshitilgan gapni tanlash yoki tushib qolgan soʻzni yozish; `u = "auto"` yoki boʻlim id). Kurs Dialog yorligʻida "Matnsiz tinglash mashqi" tugmasi.
- **Tinglash va gapirish xatolar daftari** (`S.lsm`, `lsmKey/lsmMiss/lsmHit/lsmItem`): xato tinglash (soʻz `lw`, diktant `ld`, gap tanlash `lp`, tushib qolgan soʻz `lc`) va gapirish (soʻz `sw`, gap/rolli dialog qatori `sl`, ogʻzaki javob `so`) kalit boʻyicha saqlanadi; istalgan joyda 2 marta toʻgʻri javob — daftardan chiqadi; 60 tagacha. Sessiyalar `lmis`, `smis`; har mashq elementining rejimi `SES.m` da, element `_m` bilan rejimni belgilashi mumkin. Mashq sahifasida karta, tinglash va gapirish oynalarida "Xatolarni takrorlash".
- **Darajani aniqlash testi** (`#placement`, `plGen`, `plFinish`, `plApply`): 8 Okuma (har darajadan 2 ta test savoli) + 4 Dinleme + 4 Yazma + 2 Konuşma (ixtiyoriy), A1→B2. Daraja natijasi = 60%+ olingan, A1 dan uzilishsiz eng yuqori daraja; tavsiya — keyingi daraja. `plApply` → `S.kStart` (kurs boʻlimi indeksi), `kNext()` shundan boshlab qidiradi; oldingi boʻlimlar "tugatilgan" deb belgilanmaydi. `S.place`. Bosh sahifada yangi foydalanuvchiga karta (`plHomeCard`, "Kerak emas" → `S.place.skipped`), kurs sahifasida havola. Mikrofon: umumiy `micCapture(q, btn, done)` (daraja testi ham ishlatadi).
- **Anonim umumiy analitika** (`statsDoc`, `statsPush`, `adminAgg`, sahifa `#admin`): hisobga kirgan foydalanuvchi ilovasi har 3 soatda `stats/{uid}` ga ismsiz, pochtasiz qisqa hujjat yozadi (koʻnikmalar boʻyicha jami va 14 kunlik toʻgʻri/urinish/daqiqa, muvozanat, koʻnikma darajalari, test qismlari, kurs darajasi, faol kunlar). Sozlamalarda "Anonim statistika" (`S.anon`, standart yoqiq; oʻchirilsa hujjat oʻchiriladi). Oʻqish faqat `admins/{uid}` hujjati bor hisob uchun (`isAdmin()` qoidasi); admin uchun profil sozlamalarida "Umumiy analitika" havolasi. Hisob oʻchirilsa `stats` ham oʻchadi.
- **Daraja testlari 4 qismda** (`ktGen(lv)`, `ktFinish`): Okuma = kitobdagi 20 savol; Dinleme = 3 soʻz + 3 dialog gapi (TTS, matnsiz); Yazma = 6 ta toʻldirish (darajaning turli mashqlaridan, `ansMatch`); Konuşma = 2 gap takrorlash + 2 ogʻzaki javob (mikrofon; oʻtkazib yuborilsa yoki brauzer qoʻllamasa `null`). Har urinishda yangi savollar. Umumiy foiz = mavjud qismlar oʻrtachasi (`S.ktest[lv]`), qismlar boʻyicha eng yaxshi natija `S.ktsk[lv][r|l|w|s]`. Koʻnikma darajasi `skLevel(id)` = qismidan 60%+ olingan eng yuqori daraja; `#skills` da "Koʻnikma boʻyicha daraja" kartasi, yutuq `allA1`.
- **Erkin yozishni avtomatik tekshirish** (`wrCheck`, sahifa `#write`, kursdagi "Yozish" topshiriqlarida "Yozganimni tekshirish" tugmasi): hajm (topshiriq nomidan `wrTarget`), boʻlimning grammatik maqsadlari (`WT[unitId]`, 26 topshiriq), bogʻlovchilar, imlo (`wrCorpus` — saytdagi barcha turkcha soʻz shakllari; harfsiz yozilgan soʻzlarga taklif, q/x/w), tinish belgilari, takrorlar. Ball = 25% hajm + 35% grammatika + 15% bogʻlovchi + 15% imlo + 10% tinish; 70+ — Yazma uchun toʻgʻri, birinchi marta +15 XP. Natija `S.k[id].wb`, yutuq `writer5`. Diqqat: regexlarda `\b` turkcha harflarni tanimaydi — `WT` avtomatik qayta yoziladi; lookbehind (`(?<=`) ishlatmang, eski Safari buziladi.
- **Gapirish mashqlari** (Web Speech API): `sayline` (dialog gapini takrorlash, 80% chegara), `oral` (kurs matni savollariga ogʻzaki javob: namuna javobdagi kalit soʻzlar, `oralScore`, 60% chegara; Okuma + Konuşma), `role` (rolli dialog: `u = "unitId|sectionIndex|speaker"`, sherik gaplarini `speakSeq` aytadi, `S.roles`, yutuq `roles3`). Kirish: Mashq → Gapirish mashqi (`speakSheet`), kurs Dialog yorligʻi, kurs Matn yorligʻi.
- Talaffuz mashqi (`mode "say"`): Web Speech API (`tr-TR`), harfma-harf solishtirish (`sayDiff`), notoʻgʻri harflar qizil, 3 ta urinish, raqamlar soʻzga aylantiriladi (`trNum`; `sayNorm` namuna matndagi raqamlarni ham soʻzga aylantiradi, `heardNorm = sayNorm(s).out`). Mashq sahifasida alohida karta, har bir dars/toifa uchun "Talaffuz" rejimi, `S.pron`, yutuq `pron20`. Brauzer qoʻllamasa tugma oʻchiq.
- **Tez ochilish** (`loadFirebase`, `fbStart`, `EARLY`, `ty-last-user`): Firebase SDK `<head>` da bloklovchi `<script>` emas — `preload` + `app.js` dinamik yuklaydi (`async = false`, tartib saqlanadi). Oldin kirgan foydalanuvchi (`ty-last-user` va `turkce-yol-v1:<uid>` bor) darhol oʻz lokal nusxasini koʻradi; Firebase javob bergach `loadCloud` fonda sinxronlaydi (kutish paytidagi progress yoʻqolmaydi — server javobidan keyin lokal nusxa qayta oʻqiladi). Firebase `null` qaytarsa — kirish ekrani. SDK umuman yuklanmasa (oflayn, keshda yoʻq) — `FB = false`, mehmon rejimi. Hisobdan chiqishda `ty-last-user` oʻchiriladi. Testlar: `boot.test.js` (soxta Firebase SDK).
- Qoʻllanma va qoida mashqlari A1–B2 gacha toʻldirildi. `#guide` va `#gx` sahifalarida daraja tugmalari bor. Tarjimon A2–B2 qoliplarini ham taniydi (`TR_HINTS`).

## Qolgan ishlar
1. **turkceyol.web.app** — yuqoridagi "Kutilayotgan ish" (foydalanuvchi qadamlari, keyin tekshirish).
2. **Real telefonda sinash (foydalanuvchi):** gapirish mashqlari va daraja testining gapirish qismi (Android Chrome, iPhone Safari), turkcha TTS ovozi, tarjimon (MyMemory CORS). Testlarda mikrofon soxta.
3. **Turk tilini ona tili darajasida biladigan odam koʻrigi:** A2–B2 qoʻllanma (79 mavzu) va 470+ qoida mashqi, kurs matnlari (A2.7–8, B1, B2 bir marta tekshirilib, xatolar tuzatilgan).
4. **Raqobatchi tahlili: sinavmultilevel.uz** — sandbox toʻsadi; foydalanuvchi ruxsat berishi yoki skrinshot yuborishi kerak.
5. **Gʻoyalar:** oʻqituvchi va guruh rejimi, tezlikni oshirish, doʻstlar ligalari, kurs boʻlimlari uchun audio, push eslatmalar.
6. Analitika ishlayapti: `admins` toʻplami nomi aynan `admins` boʻlishi kerak (foydalanuvchi avval `admin` deb yaratgan edi, tuzatildi). `#admin` sahifasi muammo boʻlsa sababini va UID'ni koʻrsatadi.

## Test qilish
- `npm test` — `tests/*.test.js` (Node `node:test` + Playwright, ~20 soniya). Bu muhitda Playwright oldindan oʻrnatilgan: `npm install` yoki `playwright install` QILMANG, shunchaki `npm test`.
- GitHub Actions (`.github/workflows/test.yml`, nomi "Testlar") har push'da shu testlarni ishga tushiradi.
- `tests/helpers.js`: `openApp(browser, hash, { sr, noSR, state })` — saytni diskdan, mehmon rejimida (Firebase oʻchiq), tashqi tarmoqsiz, 390×844 da ochadi. `sr: true` — soxta `SpeechRecognition` (`window.__say()` yoki joriy mashq matnini "eshitadi"). `answerAllRight(page)` — joriy mashqni toʻgʻri javoblar bilan oxirigacha oʻtkazadi.
- Fayllar: `data.test.js` (brauzersiz: qoʻllanma, mashqlar, kurs, taqiqlangan soʻzlar, lookbehind yoʻqligi, sw.js, firestore.rules), `pages.test.js` (barcha sahifalar), `practice.test.js` (4 koʻnikma mashqlari, gapirish), `checks.test.js` (yozish tekshiruvi, 4 qismli test, anonim statistika), `placement.test.js` (darajani aniqlash), `boot.test.js` (tez ochilish, soxta Firebase).
- Skrinshotlarni repo ildiziga saqlamang (`.gitignore` `/*.png` ni chetlaydi).
- Testlarda qatʼiy `waitForTimeout` bilan mikrofon natijasini kutmang — `waitForFunction(() => !REC ...)` / `!KT_REC` ishlating (GitHub serveri sekinroq). Yutuq tabrigi mashq davomida chiqmaydi (`celebrateLater`), natija ekranida yoki mashq yopilganda chiqadi.
