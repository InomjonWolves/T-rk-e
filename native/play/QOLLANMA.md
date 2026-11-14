# Google Play'ga chiqarish — qadamma-qadam qoʻllanma

Ilova: **Türkçe Yoʻl** · paket `uz.turkceyol.app` · 7-bosqich: yopiq sinov (12 sinovchi, 14 kun) → keyin ommaga chiqarish.

## 0. Nima tayyor

| Nima | Qayerda |
|---|---|
| AAB (Play'ga yuklanadigan fayl) | https://github.com/InomjonWolves/T-rk-e/releases/download/ilova-latest/turkce-yol-ilova.aab |
| APK (telefonda sinash uchun) | https://github.com/InomjonWolves/T-rk-e/releases/download/ilova-latest/turkce-yol-ilova.apk |
| 8 ta skrinshot (1080×1920) | repo: `native/play/screenshots/` |
| Banner 1024×500 | `native/play/feature-1024x500.jpg` |
| Belgi 512×512 | `native/play/icon-512.png` |
| Doʻkon matnlari | `native/play/listing.json` (pastda ham bor) |
| Maxfiylik siyosati | https://turkceyol.web.app/privacy.html |
| Hisobni oʻchirish sahifasi | https://turkceyol.web.app/hisob-ochirish.html |

Rasmlarni yuklab olish: GitHub'da faylni oching → «Download raw file». Har yangi AAB GitHub Actions'da avtomatik yigʻiladi, versiya raqami oʻzi oshadi.

## 1. Play Console hisobi

1. https://play.google.com/console → Google hisobingiz bilan kiring → **Shaxsiy (Personal)** hisob → bir martalik **25 $** toʻlov.
2. Shaxsingizni tasdiqlang (pasport yoki ID karta) va telefon raqamingizni tasdiqlang. Bu bir necha kun olishi mumkin.
3. Shaxsiy hisoblar uchun qoida: ilovani ommaga chiqarishdan oldin **kamida 12 sinovchi 14 kun uzluksiz** yopiq sinovda boʻlishi shart.

## 2. Ilova yaratish

**Create app** →
- App name: `Türkçe Yoʻl — turk tili`
- Default language: **Uzbek – oʻzbek (uz)**
- App or game: **App** · Free or paid: **Free**
- Ikkala bayonotga belgi qoʻying → **Create app**.

## 3. Muhim: Google bilan kirish Play nusxasida ham ishlashi uchun

Play ilovani oʻzining **ilova imzolash kaliti** bilan qayta imzolaydi. Shuning uchun birinchi AAB yuklangandan keyin:

1. Play Console → **Test and release → Setup → App integrity → App signing** → «App signing key certificate» dagi **SHA-1** va **SHA-256** ni nusxalang.
2. Firebase Console → loyiha `t-rk-e` → ⚙ Project settings → Your apps → Android `uz.turkceyol.app` → **Add fingerprint** → ikkalasini qoʻshing.
3. Shu sahifadan yangi **google-services.json** ni yuklab oling → GitHub → Settings → Secrets → Actions → **`GOOGLE_SERVICES_JSON`** ni yangi fayl matni bilan almashtiring.
4. GitHub → Actions → «Ilova (Capacitor)» → **Run workflow** → yangi AAB ni Play'ga yuklang.

Busiz Play'dan oʻrnatilgan ilovada «Google bilan kirish» xato beradi (APK dan oʻrnatilganda esa ishlaydi).

## 4. App content (Policy → App content)

**Privacy policy:** `https://turkceyol.web.app/privacy.html`

**App access:** «All or some functionality is restricted» → **Add instructions**: reyting, doʻstlar va guruhlar uchun hisob kerak. Sinov hisobini yarating (masalan, alohida Gmail + parol bilan ilovada roʻyxatdan oʻting) va shu yerga yozing. Izoh: «Asosiy darslar "Hoziroq boshlash" tugmasi bilan hisobsiz ishlaydi».

**Ads:** **No, my app does not contain ads**.

**Content rating** (anketa) → Category: **Reference, News, or Educational**:
- Zoʻravonlik, qoʻrqinchli mazmun, jinsiy mazmun, soʻkinish, giyohvand moddalar, qimor — **No**.
- Users can interact or exchange content: **Yes** (reytingda ism va profil rasmi koʻrinadi; chat yoʻq).
- Shares user location: **No** · Digital purchases: **No**.

**Target audience:** **13–15, 16–17, 18 va undan katta** (13 yoshdan kichiklarni belgilamang — aks holda «Families» qoʻshimcha talablari qoʻshiladi).

**News app:** No · **Government app:** No · **Financial features:** None · **Health:** None.

**Advertising ID:** «Does your app use advertising ID?» → **No**.

### Data safety

- Does your app collect or share any of the required user data types? → **Yes**
- Is all of the user data collected by your app encrypted in transit? → **Yes**
- Do you provide a way for users to request that their data is deleted? → **Yes** · URL: `https://turkceyol.web.app/hisob-ochirish.html`

| Maʼlumot turi | Collected | Shared | Ixtiyoriymi | Maqsad |
|---|---|---|---|---|
| Personal info → **Name** | Ha | Yoʻq | Ha (hisobsiz ham ishlaydi) | App functionality, Account management |
| Personal info → **Email address** | Ha | Yoʻq | Ha | App functionality, Account management |
| Personal info → **User IDs** | Ha | Yoʻq | Ha | App functionality, Account management |
| Photos and videos → **Photos** (profil rasmi) | Ha | Yoʻq | Ha | App functionality |
| App activity → **App interactions** (natijalar, XP, mashqlar) | Ha | Yoʻq | Ha | App functionality, Analytics |
| App activity → **Other user-generated content** (tarjimonga yozilgan matn) | Yoʻq | **Ha** — tarjima xizmati MyMemory, vaqtincha | Ha | App functionality |

Audio va mikrofon: **belgilamang** — nutqni telefonning oʻz xizmati matnga aylantiradi, ilova ovozni yigʻmaydi va yubormaydi. Joylashuv, kontaktlar, qurilma identifikatori, xatolik jurnallari — yigʻilmaydi.

## 5. Doʻkon sahifasi (Grow → Store presence → Main store listing)

- **App name:** `Türkçe Yoʻl — turk tili`
- **Short description:** `Turk tilini oʻzbek tilida bepul oʻrganing: A1 dan C1 gacha, Pamuk bilan`
- **Full description:** `native/play/listing.json` dagi `full` matni (pastda ham).
- **App icon:** `icon-512.png` · **Feature graphic:** `feature-1024x500.jpg` · **Phone screenshots:** 8 ta rasm, tartib bilan (01 … 08).
- **Category:** Education · **Tags:** Language learning, Education.
- **Contact details:** email (Play Console hisobingizniki yoki alohida), Website: `https://turkceyol.web.app`.

<details><summary>Full description (nusxalash uchun)</summary>

```
Türkçe Yoʻl — oʻzbek tilida soʻzlashuvchilar uchun turk tilini noldan C1 darajasigacha oʻrgatadigan bepul ilova. Har bir qoida oʻzbekcha tushuntirilgan, har bir soʻz va gap ovozli. Reklama yoʻq, pullik qism yoʻq.

KUNIGA 10 DAQIQA YETARLI
Pamuk mushugi har kuni qisqa reja tuzib beradi: yangi soʻzlar, takrorlash va bitta mashq. Toʻgʻri javoblar seriyasi, XP, darajalar va yutuqlar oʻrganishni oʻyindek qiziqarli qiladi.

TOʻLIQ KURS: A1 → C1
• 40 boʻlim va 5 ta daraja testi — oʻrganish yoʻli boʻylab qadamma-qadam
• har boʻlimda lugʻat, grammatika, dialog, oʻqish matni va mashqlar
• darajani aniqlash testi: turkchani biroz bilsangiz, mos joydan boshlaysiz

GRAMMATIKA VA LUGʻAT
• 134 grammatika mavzusi oʻzbekcha tushuntirish va misollar bilan
• 795 ta qoida mashqi
• 3000 dan ortiq soʻz, 75 ta mavzuli toʻplam (uy, ish, sayohat, sogʻliq…)
• aqlli takrorlash: soʻzlar unutilay deganda yana qaytadi

TOʻRT KOʻNIKMA
• Oʻqish — 15 ta oʻqish matni va savollar
• Tinglash — barcha matnlar tabiiy turkcha ovozda, internetsiz ham ishlaydi
• Yozish — yozganingizni ilova oʻzi tekshiradi va maslahat beradi
• Gapirish — talaffuz mashqi: gapiring, telefon tanib, xatoli harflarni koʻrsatadi

MOTIVATSIYA
• kunlik maqsad, seriya kalendari va seriya muzlatgichi
• kunlik vazifalar va haftalik challenge
• 7 ta liga va haftalik reyting, doʻstlar bilan bellashish
• 81 ta yutuq va Pamukning rivojlanishi: mushukchadan afsonagacha
• kunlik eslatma va bosh ekran vidjeti

OʻQITUVCHILAR UCHUN
Guruh yarating, oʻquvchilarni havola bilan taklif qiling, topshiriq bering va natijalarni Excel faylida yuklab oling.

HISOBSIZ HAM BOSHLASH MUMKIN
«Hoziroq boshlash» tugmasi bilan roʻyxatdan oʻtmasdan oʻrganing. Keyin Google yoki pochta orqali kirsangiz, natijangiz hisobingizga oʻtadi va istalgan qurilmada davom etadi.

Türkçe Yoʻl — 100% bepul. Saytimiz: turkceyol.web.app, Telegram kanalimiz: @turkceyoluz.
```

</details>

## 6. Yopiq sinov (Test and release → Testing → Closed testing)

1. **Create track** (yoki tayyor «Closed testing – Alpha») → **Countries/regions**: Uzbekistan (+ Turkiya, Qozogʻiston va h.k. — xohishingizga koʻra).
2. **Testers** → **Create email list** → nomi `Sinovchilar` → kamida **12–15 ta Gmail** manzil (ishonchli odamlar: oʻzingiz, oila, doʻstlar, oʻquvchilar). Zaxira uchun 15–20 ta yaxshi.
3. **Create new release** → AAB ni yuklang → Release name avtomatik → Release notes:
   ```
   <uz>
   Birinchi sinov versiyasi: toʻliq A1–C1 kurs, oʻrganish yoʻli, talaffuz mashqi, internetsiz audio, kunlik eslatma, seriya muzlatgichi va bosh ekran vidjeti. Xato yoki taklif boʻlsa, sinovchilar guruhiga yozing.
   </uz>
   ```
4. **Review release** → **Start rollout to Closed testing**. Google tekshiruvi odatda 1–3 kun.
5. Testers sahifasidagi **opt-in havolani** (Join on the web) sinovchilarga yuboring. Har biri: havolani ochadi → «Become a tester» → Play Market'dan ilovani oʻrnatadi.
6. **14 kun** davomida sinovchilar ilovani oʻchirmasin (har kuni ochib, ozgina mashq qilishsa, yanada yaxshi).

### Sinovchilarga xabar (Telegram uchun)

```
Assalomu alaykum! Türkçe Yoʻl ilovasi Google Play'ga chiqyapti 🎉
Sinovchi boʻlib yordam bera olasizmi? 14 kun davomida ilovani telefoningizda saqlab tursangiz kifoya.

1) Shu havolani oching va «Become a tester» ni bosing: <OPT-IN HAVOLA>
2) Keyin Play Market'dan «Türkçe Yoʻl» ni oʻrnating
3) Kuniga 5 daqiqa mashq qilsangiz — ajoyib! Xato koʻrsangiz, menga yozing.

Rahmat! 🐱
```

## 7. 14 kundan keyin — ommaga chiqarish

Dashboard → **Apply for production** → anketa. Javob namunalari:
- *How did you recruit testers?* — Oila, doʻstlar, oʻquvchilar va Telegram kanalimiz (@turkceyoluz) obunachilari.
- *How easy was it to recruit?* — Oson.
- *Describe the engagement* — Sinovchilar har kuni darslar, talaffuz va tinglash mashqlarini bajarishdi.
- *Feedback and changes* — Sinov davomida tuzatilgan narsalarni yozing (masalan, audio, eslatma, ekranlar). Claude'ga sinovchilar fikrini yuborsangiz, tuzatib, roʻyxatini tayyorlab beradi.
- *Is your app ready for production?* — Yes.

Tasdiqlangach: **Production → Create new release** → oxirgi AAB → bosqichma-bosqich chiqarish (masalan, 20% → 100%).

## 8. Keyingi yangilanishlar

`main` ga har oʻzgarishda yangi AAB avtomatik yigʻiladi (versiya raqami oʻzi oshadi): Releases → `ilova-latest` → `turkce-yol-ilova.aab` → Play Console'da yangi release.
