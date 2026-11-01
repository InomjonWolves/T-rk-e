// Türkçe Yoʻl — A1 grammatika mashqlari, qoʻllanmadagi mavzular boʻyicha (A1.01–A1.33).
// Turlar: c — variant tanlash (o: variantlar, a: toʻgʻri javob raqami),
//         t — yozish (ans: qabul qilinadigan javoblar), o — gap tuzish (s: toʻgʻri gap).
// q: savol ("___" — boʻsh joy), uz: tarjima, e: qisqa izoh (javobdan keyin koʻrinadi).
const BX = {
  "A1.01": [
    { t: "c", q: "ev + ___", o: ["evler", "evlar"], a: 0, uz: "uylar", e: "Oxirgi unli e → -ler." },
    { t: "c", q: "okul + ___", o: ["okuller", "okullar"], a: 1, uz: "maktablar", e: "Oxirgi unli u → -lar." },
    { t: "c", q: "göz + ___", o: ["gözlar", "gözler"], a: 1, uz: "koʻzlar", e: "Oxirgi unli ö → -ler." },
    { t: "c", q: "“Uchta olma” turkchada:", o: ["üç elmalar", "üç elma"], a: 1, e: "Sondan keyin koʻplik qoʻshimchasi qoʻyilmaydi." },
    { t: "t", q: "Bu ___ çok akıllı. (çocuk)", ans: ["çocuklar"], uz: "Bu bolalar juda aqlli." },
    { t: "t", q: "Masada ___ var. (kitap)", ans: ["kitaplar"], uz: "Stolda kitoblar bor." }
  ],
  "A1.02": [
    { t: "c", q: "Mening uyim:", o: ["evim", "evin", "evi"], a: 0 },
    { t: "c", q: "Sening mashinang:", o: ["araban", "arabası", "arabam"], a: 0, e: "Unlidan keyin (I) tushadi: araba + n." },
    { t: "c", q: "Uning mashinasi:", o: ["arabayı", "arabası", "arabam"], a: 1, e: "3-shaxsda unlidan keyin s qoʻshiladi." },
    { t: "c", q: "Mening kitobim (kitap):", o: ["kitapım", "kitabım", "kitapim"], a: 1, e: "Undosh yumshaydi: p → b." },
    { t: "c", q: "Ularning uylari:", o: ["evleri", "evlerı", "evlarim"], a: 0 },
    { t: "t", q: "Bizning uyimiz: ___ (ev)", ans: ["evimiz"] },
    { t: "t", q: "Sizning mashinangiz: ___ (araba)", ans: ["arabanız"] }
  ],
  "A1.03": [
    { t: "c", q: "okul → maktabda", o: ["okulda", "okulta", "okulde"], a: 0 },
    { t: "c", q: "ev → uydan", o: ["evdan", "evden", "evten"], a: 1 },
    { t: "c", q: "araba → mashinaga", o: ["arabaa", "arabaya", "arabaga"], a: 1, e: "Unlidan keyin bufer y: araba + y + a." },
    { t: "c", q: "“Uylarimizda” — qaysi tartib toʻgʻri?", o: ["evlerimizde", "evdelerimiz", "evimizlerde"], a: 0, e: "Koʻplik → egalik → kelishik." },
    { t: "t", q: "araba → mashinaning: ___", ans: ["arabanın"] },
    { t: "t", q: "ev → uyni: ___", ans: ["evi"] }
  ],
  "A1.04": [
    { t: "c", q: "“Kitobni oʻqiyapman”", o: ["Kitap okuyorum.", "Kitabı okuyorum."], a: 1, e: "Aniq narsa -(y)I oladi. Noaniq boʻlsa qoʻshimchasiz: Kitap okuyorum — kitob oʻqiyapman." },
    { t: "c", q: "Ali ___ içiyor. (choyni)", o: ["çayı", "çayyı", "çayi"], a: 0, uz: "Ali choyni ichyapti." },
    { t: "c", q: "su → suvni", o: ["suu", "suyu", "sunu"], a: 1, e: "Unlidan keyin -yı/-yi/-yu/-yü." },
    { t: "c", q: "araba → mashinani", o: ["arabayı", "arabanı", "arabası"], a: 0 },
    { t: "t", q: "___ görüyorum. (okul)", ans: ["okulu"], uz: "Maktabni koʻryapman." },
    { t: "t", q: "___ kim yedi? (ekmek)", ans: ["ekmeği"], uz: "Nonni kim yedi?", e: "k → ğ yumshaydi." }
  ],
  "A1.05": [
    { t: "c", q: "okul → maktabga", o: ["okula", "okule", "okulya"], a: 0 },
    { t: "c", q: "ev → uyga", o: ["eva", "eve", "evye"], a: 1 },
    { t: "c", q: "Ankara → Anqaraga", o: ["Ankaraya", "Ankara'ya", "Ankara'a"], a: 1, e: "Atoqli otda apostrof qoʻyiladi, unlidan keyin bufer y." },
    { t: "c", q: "Türkiye → Turkiyaga", o: ["Türkiye'ye", "Türkiye'e", "Türkiyeye"], a: 0 },
    { t: "t", q: "___ gidiyorum. (okul)", ans: ["okula"], uz: "Maktabga ketyapman." },
    { t: "t", q: "Ben ___ gidiyorum. (pazar)", ans: ["pazara"], uz: "Men bozorga ketyapman." }
  ],
  "A1.06": [
    { t: "c", q: "ev → uyda", o: ["evde", "evda", "evte"], a: 0 },
    { t: "c", q: "kitap → kitobda", o: ["kitapda", "kitapta", "kitabda"], a: 1, e: "f, s, t, k, ç, ş, h, p dan keyin d → t." },
    { t: "c", q: "sınıf → sinfda", o: ["sınıfda", "sınıfta"], a: 1 },
    { t: "c", q: "İstanbul → Istanbulda", o: ["İstanbul'da", "İstanbul'ta", "İstanbul'de"], a: 0 },
    { t: "t", q: "___ çok öğrenci var. (okul)", ans: ["okulda"], uz: "Maktabda koʻp oʻquvchi bor." },
    { t: "t", q: "Ben ___ yaşıyorum. (Taşkent)", ans: ["Taşkent'te"], uz: "Men Toshkentda yashayman.", e: "t dan keyin d → t." }
  ],
  "A1.07": [
    { t: "c", q: "ev → uydan", o: ["evden", "evdan", "evten"], a: 0 },
    { t: "c", q: "Taşkent → Toshkentdan", o: ["Taşkent'den", "Taşkent'ten", "Taşkentden"], a: 1 },
    { t: "c", q: "okul → maktabdan", o: ["okuldan", "okulden", "okultan"], a: 0 },
    { t: "c", q: "“Sendan katta”", o: ["senden büyük", "sana büyük", "seni büyük"], a: 0, e: "Qiyoslashda ham -DAn ishlatiladi." },
    { t: "t", q: "Ben ___ geldim. (Özbekistan)", ans: ["Özbekistan'dan"], uz: "Men Oʻzbekistondan keldim." },
    { t: "t", q: "___ geliyorum. (iş)", ans: ["işten"], uz: "Ishdan kelyapman.", e: "ş dan keyin d → t." }
  ],
  "A1.08": [
    { t: "c", q: "Ali → Alining", o: ["Ali'nin", "Ali'in", "Ali'nın"], a: 0 },
    { t: "c", q: "ben → mening", o: ["benin", "benim"], a: 1, e: "Istisno: ben → benim, biz → bizim." },
    { t: "c", q: "okul → maktabning", o: ["okulun", "okulin", "okulnun"], a: 0 },
    { t: "c", q: "araba → mashinaning", o: ["arabanın", "arabaın", "arabanin"], a: 0 },
    { t: "t", q: "biz → bizning: ___", ans: ["bizim"] },
    { t: "t", q: "___ kitabı masada. (öğretmen)", ans: ["öğretmenin"], uz: "Oʻqituvchining kitobi stolda." }
  ],
  "A1.09": [
    { t: "c", q: "otobüs → avtobus bilan", o: ["otobüsle", "otobüsla", "otobüsyle"], a: 0 },
    { t: "c", q: "araba → mashina bilan", o: ["arabala", "arabayla", "arabayle"], a: 1 },
    { t: "c", q: "ben → men bilan", o: ["benle", "benimle", "bana ile"], a: 1, e: "Olmoshlar qaratqichda: benimle, seninle, onunla." },
    { t: "c", q: "“Doʻstim bilan”", o: ["arkadaşımla", "arkadaşımda", "arkadaşımı"], a: 0 },
    { t: "t", q: "Ben ___ geliyorum. (tren)", ans: ["trenle", "tren ile"], uz: "Poyezd bilan kelyapman." },
    { t: "t", q: "O ___ konuşuyor. (sen)", ans: ["seninle", "senin ile"], uz: "U sen bilan gaplashyapti." }
  ],
  "A1.10": [
    { t: "c", q: "maktabning bogʻi", o: ["okulun bahçesi", "okul bahçe", "okulun bahçe"], a: 0 },
    { t: "c", q: "maktab sumkasi (umumiy)", o: ["okul çantası", "okulun çanta", "okul çanta"], a: 0, e: "Umumiy tushunchada birinchi soʻz qoʻshimchasiz qoladi." },
    { t: "c", q: "Oʻqituvchining kitobi", o: ["öğretmenin kitabı", "öğretmen kitap", "öğretmenin kitap"], a: 0 },
    { t: "c", q: "Alining mashinasi", o: ["Ali'nin arabası", "Ali'nin araba", "Ali araba"], a: 0 },
    { t: "t", q: "evin ___ (kapı)", ans: ["kapısı"], uz: "uyning eshigi" },
    { t: "t", q: "Ahmet'in ___ büyük. (ev)", ans: ["evi"], uz: "Ahmetning uyi katta." }
  ],
  "A1.11": [
    { t: "c", q: "kitap + -CI", o: ["kitapçı", "kitapcı", "kitapçi"], a: 0, uz: "kitobfurush", e: "Jarangsizdan keyin c → ç." },
    { t: "c", q: "balık + -CI", o: ["balıkçı", "balıkcı", "balıkçu"], a: 0, uz: "baliqchi" },
    { t: "c", q: "gazete + -CI", o: ["gazeteci", "gazeteçi", "gazetecı"], a: 0, uz: "jurnalist" },
    { t: "c", q: "süt + -CI", o: ["sütçü", "sütcü", "sütçi"], a: 0, uz: "sutchi" },
    { t: "t", q: "iş + -CI = ___", ans: ["işçi"], uz: "ishchi" },
    { t: "t", q: "yol + -CI = ___", ans: ["yolcu"], uz: "yoʻlovchi" }
  ],
  "A1.12": [
    { t: "c", q: "katta uy", o: ["büyük ev", "ev büyük", "büyükev"], a: 0, e: "Sifat har doim otdan oldin keladi." },
    { t: "c", q: "goʻzal bir kun", o: ["güzel bir gün", "bir güzel gün", "gün güzel bir"], a: 0, e: "bir sifatdan keyin, otdan oldin turadi." },
    { t: "c", q: "yangi mashinalar", o: ["yeni arabalar", "yeniler arabalar", "arabalar yeni"], a: 0, e: "Sifat oʻzgarmaydi, koʻplik olmaydi." },
    { t: "o", s: "Bu çok güzel bir şehir", uz: "Bu juda goʻzal shahar." },
    { t: "o", s: "Ali yeni bir araba aldı", uz: "Ali yangi mashina oldi." },
    { t: "t", q: "kichik uy: ___ ev", ans: ["küçük"] }
  ],
  "A1.13": [
    { t: "c", q: "şeker + -lI", o: ["şekerli", "şekerlı", "şekerlu"], a: 0, uz: "shakarli" },
    { t: "c", q: "tuz + -sIz", o: ["tuzsuz", "tuzsız", "tuzsüz"], a: 0, uz: "tuzsiz" },
    { t: "c", q: "İstanbul + -lI", o: ["İstanbullu", "İstanbullı", "İstanbulli"], a: 0, uz: "istanbullik" },
    { t: "c", q: "süt + -lI", o: ["sütlü", "sütli", "sütlu"], a: 0, uz: "sutli" },
    { t: "t", q: "___ çay içiyorum. (şeker + -sIz)", ans: ["şekersiz"], uz: "Shakarsiz choy ichaman." },
    { t: "t", q: "Toshkentlik: ___", ans: ["Taşkentli"] }
  ],
  "A1.14": [
    { t: "c", q: "kattaroq", o: ["daha büyük", "en büyük", "büyükrak"], a: 0 },
    { t: "c", q: "eng katta", o: ["en büyük", "daha büyük", "çok büyük"], a: 0 },
    { t: "c", q: "Ankara, İstanbul___ daha küçük.", o: ["'dan", "'da", "'a"], a: 0, uz: "Anqara Istanbuldan kichikroq.", e: "Qiyoslanadigan narsa -DAn oladi." },
    { t: "c", q: "eng yaxshi talaba", o: ["en iyi öğrenci", "daha iyi öğrenci", "iyi en öğrenci"], a: 0 },
    { t: "t", q: "Ben ___ daha büyüğüm. (sen)", ans: ["senden"], uz: "Men sendan kattaroqman." },
    { t: "o", s: "Ankara İstanbul'dan daha küçük", uz: "Anqara Istanbuldan kichikroq." }
  ],
  "A1.15": [
    { t: "c", q: "65", o: ["altmış beş", "yetmiş beş", "beş altmış"], a: 0 },
    { t: "c", q: "100", o: ["yüz", "bir yüz"], a: 0, e: "100 va 1000 oldidan bir aytilmaydi." },
    { t: "c", q: "“Yigirmata oʻquvchi”", o: ["yirmi öğrenci", "yirmi öğrenciler"], a: 0, e: "Sondan keyin ot birlikda qoladi." },
    { t: "c", q: "40", o: ["kırk", "dört on", "otuz"], a: 0 },
    { t: "t", q: "90 = ___", ans: ["doksan"] },
    { t: "t", q: "2026 = iki bin ___ altı", ans: ["yirmi"] }
  ],
  "A1.16": [
    { t: "c", q: "birinchi", o: ["birinci", "birinçi", "birinchi"], a: 0 },
    { t: "c", q: "toʻrtinchi", o: ["dördüncü", "dörtüncü", "dörtinci"], a: 0, e: "dört → dördüncü (t → d)." },
    { t: "c", q: "ikkinchi", o: ["ikinci", "ikiinci", "ikinçi"], a: 0, e: "Unli bilan tugagan sonda (I) tushadi." },
    { t: "c", q: "oʻninchi", o: ["onuncu", "oninci", "onuncü"], a: 0 },
    { t: "t", q: "uchinchi = ___", ans: ["üçüncü"] },
    { t: "t", q: "___ kattayım. (üç)", ans: ["üçüncü"], uz: "Uchinchi qavatdaman." }
  ],
  "A1.17": [
    { t: "c", q: "3:30", o: ["Saat üç buçuk.", "Saat dördü buçuk.", "Saat üç yarım."], a: 0 },
    { t: "c", q: "3:15", o: ["Saat üçü çeyrek geçiyor.", "Saat üçe çeyrek var.", "Saat üç çeyrek."], a: 0, e: "Oʻtgan daqiqalar: soat -(y)I oladi + geçiyor." },
    { t: "c", q: "3:45", o: ["Saat dörde çeyrek var.", "Saat üçü çeyrek geçiyor.", "Saat dördü çeyrek geçiyor."], a: 0, e: "Qolgan daqiqalar: keyingi soat -(y)A oladi + var." },
    { t: "c", q: "soat 3 da", o: ["saat üçte", "saat üçde", "saat üçü"], a: 0 },
    { t: "c", q: "“Soat nechada?”", o: ["Saat kaçta?", "Saat kaç?", "Kaç saat?"], a: 0, e: "Saat kaç? — soat necha?" },
    { t: "t", q: "Ders saat ___ başlıyor. (dokuz)", ans: ["dokuzda"], uz: "Dars soat toʻqqizda boshlanadi." }
  ],
  "A1.18": [
    { t: "c", q: "menga", o: ["bana", "bene", "benye"], a: 0, e: "Istisno: ben → bana, sen → sana." },
    { t: "c", q: "senga", o: ["sana", "sene", "seye"], a: 0 },
    { t: "c", q: "unga", o: ["ona", "oya", "onu"], a: 0 },
    { t: "c", q: "buni", o: ["bunu", "buyu", "bui"], a: 0, e: "o, bu, şu kelishik olganda n qoʻshiladi." },
    { t: "t", q: "undan = ___", ans: ["ondan"] },
    { t: "t", q: "bizni = ___", ans: ["bizi"] }
  ],
  "A1.19": [
    { t: "c", q: "“Qayerga ketyapsan?”", o: ["Nereye gidiyorsun?", "Nereye gidiyor musun?", "Nerede gidiyorsun?"], a: 0, e: "Soʻroq soʻzi bor gapda mI ishlatilmaydi." },
    { t: "c", q: "qachon", o: ["ne zaman", "nasıl", "hangi"], a: 0 },
    { t: "c", q: "nechta", o: ["kaç", "kim", "nereden"], a: 0 },
    { t: "c", q: "nega", o: ["neden", "nereden", "nerede"], a: 0 },
    { t: "t", q: "___ kitabı bu? (kim)", ans: ["kimin"], uz: "Bu kimning kitobi?" },
    { t: "t", q: "qanday = ___", ans: ["nasıl"] }
  ],
  "A1.20": [
    { t: "c", q: "Men askarman.", o: ["Ben askerim.", "Ben askersin.", "Ben asker."], a: 0 },
    { t: "c", q: "Sen talabasan.", o: ["Sen öğrencisin.", "Sen öğrenciyim.", "Sen öğrencisiniz."], a: 0 },
    { t: "c", q: "Biz talabamiz.", o: ["Biz öğrenciyiz.", "Biz öğrenciiz.", "Biz öğrencimiz."], a: 0, e: "Unlidan keyin bufer y: öğrenci + y + iz." },
    { t: "c", q: "Men askar emasman.", o: ["Ben asker değilim.", "Ben askerim değil.", "Ben asker yokum."], a: 0 },
    { t: "t", q: "Siz öğretmen ___? (-misiz)", ans: ["misiniz"], uz: "Siz oʻqituvchimisiz?" },
    { t: "t", q: "Ben ___. (asker, oʻtgan zamon)", ans: ["askerdim"], uz: "Men askar edim." }
  ],
  "A1.21": [
    { t: "c", q: "Mashinam bor.", o: ["Arabam var.", "Arabam yok.", "Araba benim var."], a: 0 },
    { t: "c", q: "Vaqtim yoʻq.", o: ["Vaktim yok.", "Vaktim var.", "Vakit yokum."], a: 0 },
    { t: "c", q: "Uyda non yoʻq.", o: ["Evde ekmek yok.", "Ev ekmek yok.", "Evde ekmek değil."], a: 0 },
    { t: "c", q: "Mashinangiz bormi?", o: ["Arabanız var mı?", "Arabanız var mısınız?", "Araba var mı sizin?"], a: 0 },
    { t: "o", s: "Benim iki kardeşim var", uz: "Mening ikkita ukam bor." },
    { t: "t", q: "Param ___. (bor)", ans: ["var"], uz: "Pulim bor." }
  ],
  "A1.22": [
    { t: "c", q: "kelmoq", o: ["gelmek", "gelmak", "gelme"], a: 0 },
    { t: "c", q: "oʻqimoq", o: ["okumak", "okumek", "okumaq"], a: 0 },
    { t: "c", q: "gelmek feʼlining oʻzagi:", o: ["gel", "gelm", "gelme"], a: 0, e: "-mAk ni olib tashlasangiz, oʻzak qoladi." },
    { t: "c", q: "kelmaslik", o: ["gelmemek", "gelmekme", "gelmamak"], a: 0 },
    { t: "t", q: "yozmoq = ___", ans: ["yazmak"] },
    { t: "t", q: "Türkçe ___ istiyorum. (öğren-)", ans: ["öğrenmek"], uz: "Turk tilini oʻrganmoqchiman." }
  ],
  "A1.23": [
    { t: "c", q: "Kel! (sen)", o: ["Gel!", "Gelin!", "Gelsin!"], a: 0, e: "Sen uchun buyruq — feʼlning oʻzagi." },
    { t: "c", q: "Oʻtiring (hurmat bilan)", o: ["Oturun.", "Otur.", "Otursun."], a: 0 },
    { t: "c", q: "U kelsin.", o: ["Gelsin.", "Gelin.", "Gelsinler."], a: 0 },
    { t: "c", q: "Kelmang! (siz)", o: ["Gelmeyin!", "Gelmeyim!", "Gelmesin!"], a: 0 },
    { t: "t", q: "___! (okumak, siz)", ans: ["okuyun", "okuyunuz"], uz: "Oʻqing!" },
    { t: "t", q: "___! (içmek, sen, boʻlishsiz)", ans: ["içme"], uz: "Ichma!" }
  ],
  "A1.24": [
    { t: "c", q: "Men kelyapman.", o: ["Geliyorum.", "Gelyorum.", "Geliyoruz."], a: 0 },
    { t: "c", q: "oku + yor + um", o: ["okuyorum", "okuiyorum", "okuyurum"], a: 0, e: "Unlidan keyin (I) tushadi." },
    { t: "c", q: "bekle- → kutyapman", o: ["bekliyorum", "bekleyorum", "bekleiyorum"], a: 0, e: "Oʻzak a/e bilan tugasa, u ı/i ga aylanadi." },
    { t: "c", q: "Kelmayapman.", o: ["Gelmiyorum.", "Gelmeyorum.", "Gelmiyorım."], a: 0 },
    { t: "t", q: "Biz şimdi çay ___. (içmek)", ans: ["içiyoruz"], uz: "Biz hozir choy ichyapmiz." },
    { t: "t", q: "Nereye ___? (gitmek, sen)", ans: ["gidiyorsun"], uz: "Qayerga ketyapsan?", e: "Oʻzak t → d: git → gidiyor." },
    { t: "o", s: "Ben şimdi Türkçe öğreniyorum", uz: "Men hozir turk tilini oʻrganyapman." }
  ],
  "A1.25": [
    { t: "c", q: "Men keldim.", o: ["Geldim.", "Geltim.", "Geldik."], a: 0 },
    { t: "c", q: "Men bordim. (gitmek)", o: ["Gittim.", "Gitdim.", "Gidtim."], a: 0, e: "Jarangsizdan keyin -tı/-ti/-tu/-tü." },
    { t: "c", q: "Biz bordik.", o: ["Gittik.", "Gittiz.", "Gitdik."], a: 0 },
    { t: "c", q: "Keldingmi?", o: ["Geldin mi?", "Geldi misin?", "Gel mi din?"], a: 0, e: "Oʻtgan zamonda mI shaxs qoʻshimchasidan keyin keladi." },
    { t: "t", q: "Dün o ___. (gelmek, boʻlishsiz)", ans: ["gelmedi"], uz: "Kecha u kelmadi." },
    { t: "t", q: "Dün sinemaya ___. (gitmek, biz)", ans: ["gittik"], uz: "Kecha kinoga bordik." }
  ],
  "A1.26": [
    { t: "c", q: "Men kelaman (kelajakda).", o: ["Geleceğim.", "Gelecekim.", "Gelecağım."], a: 0, e: "Unlidan oldin k → ğ." },
    { t: "c", q: "Ertaga Anqaraga boraman.", o: ["Yarın Ankara'ya gideceğim.", "Yarın Ankara'ya gitceğim.", "Yarın Ankara'da gideceğim."], a: 0 },
    { t: "c", q: "Sen oʻqiysan (kelajakda).", o: ["Okuyacaksın.", "Okuyeceksin.", "Okuacaksın."], a: 0 },
    { t: "c", q: "Men kelmayman.", o: ["Gelmeyeceğim.", "Gelmeceğim.", "Gelmiyeceğim."], a: 0 },
    { t: "t", q: "Onlar ___. (gelmek)", ans: ["gelecekler"], uz: "Ular keladi." },
    { t: "t", q: "Biz ___. (okumak)", ans: ["okuyacağız"], uz: "Biz oʻqiymiz." }
  ],
  "A1.27": [
    { t: "c", q: "Choy ichaylik!", o: ["Çay içelim!", "Çay içalım!", "Çay içiyoruz!"], a: 0 },
    { t: "c", q: "Boraylikmi?", o: ["Gidelim mi?", "Gitelim mi?", "Gidelimmi?"], a: 0, e: "git → gid (t → d), mI alohida yoziladi." },
    { t: "c", q: "oku- → oʻqiylik", o: ["okuyalım", "okualım", "okuyelim"], a: 0 },
    { t: "c", q: "Ichmaylik.", o: ["İçmeyelim.", "İçmelim.", "İçmeyalım."], a: 0 },
    { t: "t", q: "Haydi, ___! (başlamak)", ans: ["başlayalım"], uz: "Qani, boshlaylik!" },
    { t: "t", q: "___! (gelmek, biz)", ans: ["gelelim"], uz: "Kelaylik!" }
  ],
  "A1.28": [
    { t: "c", q: "Sen juda chiroyli gapiryapsan.", o: ["Sen çok güzel konuşuyorsun.", "Sen güzel çok konuşuyorsun.", "Sen konuşuyorsun çok güzel."], a: 0, e: "Ravish feʼldan oldin keladi." },
    { t: "c", q: "har kuni", o: ["her gün", "her günü", "herkes gün"], a: 0 },
    { t: "c", q: "sekin", o: ["yavaş", "hızlı", "biraz"], a: 0 },
    { t: "c", q: "sal, ozgina", o: ["biraz", "çok", "hızlı"], a: 0 },
    { t: "o", s: "Ben her gün Türkçe çalışıyorum", uz: "Men har kuni turk tilini oʻrganaman." },
    { t: "t", q: "ertaga = ___", ans: ["yarın"] }
  ],
  "A1.29": [
    { t: "c", q: "Bu sovgʻa sen uchun.", o: ["Bu hediye senin için.", "Bu hediye sen için.", "Bu hediye sana için."], a: 0, e: "Kishilik olmoshlari koʻmakchidan oldin qaratqichda keladi." },
    { t: "c", q: "men kabi", o: ["benim gibi", "ben gibi", "bana gibi"], a: 0 },
    { t: "c", q: "u bilan", o: ["onunla", "onla", "ona ile"], a: 0 },
    { t: "c", q: "doʻst uchun", o: ["arkadaş için", "arkadaşın için", "arkadaşa için"], a: 0, e: "Otlar bosh kelishikda qoladi." },
    { t: "t", q: "biz uchun: ___ için", ans: ["bizim"] },
    { t: "t", q: "qush kabi: kuş ___", ans: ["gibi"] }
  ],
  "A1.30": [
    { t: "c", q: "stolning ustida", o: ["masanın üstünde", "masa üstte", "masanın üstüde"], a: 0 },
    { t: "c", q: "Mushuk stolning tagida.", o: ["Kedi masanın altında.", "Kedi masada altı.", "Kedi masanın altta."], a: 0 },
    { t: "c", q: "uyning oldida", o: ["evin önünde", "evin önde", "evde önü"], a: 0 },
    { t: "c", q: "maktabning yonida", o: ["okulun yanında", "okulun yanda", "okulda yanı"], a: 0 },
    { t: "t", q: "kutunun ___ (ichida)", ans: ["içinde"], uz: "qutining ichida" },
    { t: "t", q: "arabanın ___ (orqasida)", ans: ["arkasında"], uz: "mashinaning orqasida" }
  ],
  "A1.31": [
    { t: "c", q: "Men ham kelyapman.", o: ["Ben de geliyorum.", "Bende geliyorum.", "Ben te geliyorum."], a: 0, e: "de (ham) alohida yoziladi va hech qachon te boʻlmaydi." },
    { t: "c", q: "lekin", o: ["ama", "ve", "çünkü"], a: 0 },
    { t: "c", q: "chunki", o: ["çünkü", "veya", "ama"], a: 0 },
    { t: "c", q: "choy yoki qahva", o: ["çay ya da kahve", "çay ve kahve", "çay ama kahve"], a: 0 },
    { t: "t", q: "ekmek ___ su (non va suv)", ans: ["ve"] },
    { t: "o", s: "Ben de geliyorum ama biraz geç", uz: "Men ham kelyapman, lekin biroz kech." }
  ],
  "A1.32": [
    { t: "c", q: "Turkcha gapda kesim qayerda turadi?", o: ["Oxirida", "Boshida", "Oʻrtasida"], a: 0 },
    { t: "o", s: "Ben her sabah evde kahvaltı yapıyorum", uz: "Men har tong uyda nonushta qilaman." },
    { t: "o", s: "Ali dün okula gitti", uz: "Ali kecha maktabga bordi." },
    { t: "o", s: "Biz yarın Ankara'ya gideceğiz", uz: "Biz ertaga Anqaraga boramiz." },
    { t: "o", s: "Annem mutfakta çay içiyor", uz: "Onam oshxonada choy ichyapti." },
    { t: "o", s: "Ahmet her gün kitap okuyor", uz: "Ahmet har kuni kitob oʻqiydi." }
  ],
  "A1.33": [
    { t: "c", q: "Sen talabamisan?", o: ["Sen öğrenci misin?", "Sen öğrencimisin?", "Sen öğrenci misun?"], a: 0, e: "mI alohida yoziladi, shaxs qoʻshimchasi undan keyin." },
    { t: "c", q: "Bu choymi?", o: ["Bu çay mı?", "Bu çay mi?", "Bu çaymı?"], a: 0 },
    { t: "c", q: "Uy chiroylimi?", o: ["Ev güzel mi?", "Ev güzel mı?", "Ev güzelmi?"], a: 0 },
    { t: "c", q: "Aynan sen keldingmi?", o: ["Sen mi geldin?", "Sen geldin mi?"], a: 0, e: "mI qaysi soʻzdan keyin kelsa, savol oʻsha soʻzga qaratiladi." },
    { t: "t", q: "O Türk ___? (-mi)", ans: ["mü"], uz: "U turkmi?" },
    { t: "t", q: "Geliyor ___? (sen)", ans: ["musun"], uz: "Kelyapsanmi?" }
  ]
};
