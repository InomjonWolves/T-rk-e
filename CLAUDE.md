# Türkçe Yoʻl — loyiha xulosasi (yangi sessiya uchun)

Oʻzbek tilida soʻzlashuvchilar uchun turk tilini oʻrgatadigan bepul, mobil uchun moʻljallangan PWA sayt.
- Sayt: https://inomjonwolves.github.io/T-rk-e/
- Repo: InomjonWolves/T-rk-e, `main` branch. GitHub Pages `main` ildizidan avtomatik joylanadi (build yoʻq, oddiy statik fayllar).
- Foydalanuvchi bilan **faqat oʻzbek tilida** gaplashing.

## Majburiy qoidalar
- PDF kitob sahifalarini saytda **toʻgʻridan-toʻgʻri koʻrsatmang**, ulardan faqat maʼlumot manbai sifatida foydalaning.
- **"TYS" / "TYS imtihoni"** soʻzlarini va **harbiy mavzudagi** (askar, komutan, kışla, nöbet, tatbikat va h.k.) lugʻat va misollarni ishlatmang. Ularning oʻrniga oddiy kasblar va kundalik hayotdan misol keltiring.
- Uchinchi tomonning rasm yoki videolarini koʻchirmang. Pamuk — oʻzimiz chizgan original SVG.
- Git muallifi: `git -c user.name="InomjonWolves" -c user.email="i.superclub@gmail.com" commit ...`. Sessiya bergan attribution qatorlarini qoʻshing. Repodagi fayllarga model nomlarini yozmang.
- JS, CSS yoki HTML oʻzgarsa, `sw.js` dagi `CACHE` versiyasini oshiring (hozir `turkce-yol-v15`). Yangi fayl qoʻshilsa, uni `ASSETS` roʻyxatiga ham kiriting.
- Joylanganini tekshirish: `gh api repos/InomjonWolves/T-rk-e/actions/runs --jq '.workflow_runs[0]|"\(.status) \(.conclusion) \(.head_sha[0:7])"'`.

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
| `firebase-config.js`, `firestore.rules` | Firebase (loyiha `t-rk-e`): Auth (email va Google), Firestore `users`, `league`, `avatars` |
| `sw.js`, `manifest.webmanifest`, `icon*` | PWA |
| `privacy.html` | Maxfiylik siyosati |

Asosiy marshrutlar: `#home #course #k-<id> #ktest-<lv> #lessons #grammar #guide #gx #alphabet #practice #rank #profile #achievements #help #translate`.

## Hozirgacha qilinganlar
- Darslar, mashqlar (SRS, xatolar daftari), alifbo, TTS talaffuz, grammatika va qoʻllanma, A1–B2 qoida mashqlari.
- Roʻyxatdan oʻtish: email/parol va Google; ism, jins, tugʻilgan sana; profil rasmi (rasm boʻlmasa Pamuk), kichik ♂/♀ stikeri.
- Firestore orqali progress sinxronlanadi; haftalik reyting (liga).
- Glassmorphism dizayn: suzuvchi menyu, hafta qatori, maqsad halqalari, statistika grafigi, tungi rejim (oq dogʻlar tuzatilgan).
- Pamuk: animatsiyalar, kunning vaqtiga qarab salomlashish, parol yozilganda koʻzini yumadi, yonboshdan qoʻl silkitadi.
- Bepul tarjimon (MyMemory API).
- A1–B2 kurs (`course.js`): 32 boʻlim va 4 test; kurs lugʻati umumiy bazaga qoʻshilgan (`ALL` = 1243 soʻz).
- 36 ta yutuq (toifali, +20 XP, konfetti va Pamuk bilan tabriklash, ulashish). Har daraja uchun qoida mashqlari yutugʻi: `gxa1`, `gxa2`, `gxb1`, `gxb2`.
- Pamuk reaksiyalari: toʻgʻri javobda xursand boʻladi, xatoda koʻzidan yosh tomadi.
- Kunlik maslahatlar (20 ta), 4 qadamli tanishtiruv, Yordam sahifasi (PWA oʻrnatish, FAQ), "100% bepul" xabarlari.
- Profildagi avatar ostidagi oval dogʻ (rangli soya) olib tashlangan.
- Talaffuz mashqi (`mode "say"`): Web Speech API (`tr-TR`), harfma-harf solishtirish (`sayDiff`), notoʻgʻri harflar qizil, 3 ta urinish, raqamlar soʻzga aylantiriladi (`trNum`). Mashq sahifasida alohida karta, har bir dars/toifa uchun "Talaffuz" rejimi, `S.pron`, yutuq `pron20`. Brauzer qoʻllamasa tugma oʻchiq.
- Qoʻllanma va qoida mashqlari A1–B2 gacha toʻldirildi. `#guide` va `#gx` sahifalarida daraja tugmalari bor. Tarjimon A2–B2 qoliplarini ham taniydi (`TR_HINTS`).

## Qolgan ishlar
1. **Raqobatchi tahlili: sinavmultilevel.uz.** Sandbox tarmogʻi bu saytga kirishni toʻsgan. Foydalanuvchi Network sozlamalarida ruxsat berishi yoki skrinshot yuborishi kerak.
2. **Kurs matnlarini tekshirish.** A2.7–8, B1 va B2 boʻlimlari hamda A2–B2 testlari bir marta koʻrib chiqildi va topilgan xatolar tuzatildi (toplatırım, Doktor sayesinde, Bilgilerinizi rica ederim, ikki toʻgʻri variantli test savollari va h.k.). Baribir turk tilini ona tili darajasida biladigan odam oxirgi marta koʻrib chiqishi foydali.
3. **Qoʻllanma va qoida mashqlarining A2–B2 qismini tekshirish.** Mavzular va mashqlar yozildi (79 mavzu, 470+ mashq). Ularni ham turk tilini yaxshi biladigan odam koʻrib chiqishi kerak.
4. Tarjimon (MyMemory) CORS bilan real brauzerda ishlashini tekshirish. Sandbox tarmogʻi `api.mymemory.translated.net` ga kirishni ham toʻsadi (403).
5. Talaffuz mashqini real telefonda (Android Chrome, iPhone Safari) sinab koʻrish. Playwright testida `SpeechRecognition` soxta klass bilan almashtiriladi.
6. Gʻoyalar: push eslatmalar, doʻstlar va guruh ligalari, kurs boʻlimlari uchun audio.

## Test qilish
Playwright oʻrnatilgan. Sinov 390×844 oʻlchamda, `file:///home/user/T-rk-e/index.html` orqali oʻtkaziladi. Bunda `**/firebase-config.js` soʻrovi `window.FIREBASE_CONFIG=null` bilan almashtiriladi (mehmon rejimi), `sessionStorage['ty-welcomed']='1'` va localStorage'da `{onb:1}` qoʻyiladi. Yutuq tabrigi oynasi bosishlarni toʻsishi mumkin. Testda uni yopish uchun: `ACH_QUEUE.length=0; document.getElementById('celebrate').hidden=true`.
