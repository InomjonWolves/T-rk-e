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
    { t: "c", q: "Men oʻqituvchiman.", o: ["Ben öğretmenim.", "Ben öğretmensin.", "Ben öğretmen."], a: 0 },
    { t: "c", q: "Sen talabasan.", o: ["Sen öğrencisin.", "Sen öğrenciyim.", "Sen öğrencisiniz."], a: 0 },
    { t: "c", q: "Biz talabamiz.", o: ["Biz öğrenciyiz.", "Biz öğrenciiz.", "Biz öğrencimiz."], a: 0, e: "Unlidan keyin bufer y: öğrenci + y + iz." },
    { t: "c", q: "Men oʻqituvchi emasman.", o: ["Ben öğretmen değilim.", "Ben öğretmenim değil.", "Ben öğretmen yokum."], a: 0 },
    { t: "t", q: "Siz öğretmen ___? (-misiz)", ans: ["misiniz"], uz: "Siz oʻqituvchimisiz?" },
    { t: "t", q: "Ben ___. (öğretmen, oʻtgan zamon)", ans: ["öğretmendim"], uz: "Men oʻqituvchi edim." }
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

// A2 mashqlari (A2.01–A2.29).
Object.assign(BX, {
  "A2.01": [
    { t: "c", q: "Ben her sabah çay ___. (içmek)", o: ["içerim", "içirim", "içarım"], a: 0, uz: "Men har tong choy ichaman." },
    { t: "c", q: "O her gün işe otobüsle ___. (gitmek)", o: ["gider", "gidir", "gitir"], a: 0, e: "Bir boʻgʻinli oʻzak → -er; unlidan oldin t → d." },
    { t: "c", q: "gelmek → u keladi", o: ["gelir", "geler", "gelür"], a: 0, e: "gel — -Ir oladigan 13 ta feʼldan biri." },
    { t: "c", q: "Sen kitob oʻqiysanmi?", o: ["Sen kitap okur musun?", "Sen kitap okur mısın?", "Sen kitap okurmusun?"], a: 0, e: "mI alohida va unli uygʻunligiga boʻysunadi: okur mu." },
    { t: "t", q: "Biz akşamları televizyon ___. (izlemek)", ans: ["izleriz"], uz: "Biz kechqurunlari televizor koʻramiz.", e: "Unli bilan tugagan oʻzak -r oladi." },
    { t: "t", q: "Annem çok güzel yemek ___. (yapmak)", ans: ["yapar"], uz: "Onam juda mazali ovqat qiladi." },
    { t: "o", s: "Ben her gün kahvaltı yaparım", uz: "Men har kuni nonushta qilaman." }
  ],
  "A2.02": [
    { t: "c", q: "Ben et ___. (yemek, boʻlishsiz)", o: ["yemem", "yemezim", "yemiyem"], a: 0, e: "ben shaxsida z tushadi." },
    { t: "c", q: "U chekmaydi.", o: ["O sigara içmez.", "O sigara içmem.", "O sigara içmaz."], a: 0 },
    { t: "c", q: "Biz qahva ichmaymiz.", o: ["Biz kahve içmeyiz.", "Biz kahve içmeziz.", "Biz kahve içmezik."], a: 0, e: "biz shaxsida ham z tushadi." },
    { t: "c", q: "Ular turkcha bilmaydi.", o: ["Onlar Türkçe bilmezler.", "Onlar Türkçe bilmemler.", "Onlar Türkçe bilmeyizler."], a: 0 },
    { t: "t", q: "Sen hiç spor ___. (yapmak, boʻlishsiz)", ans: ["yapmazsın"], uz: "Sen umuman sport bilan shugʻullanmaysan." },
    { t: "t", q: "Ben sabahları erken ___. (kalkmak, boʻlishsiz)", ans: ["kalkmam"], uz: "Men ertalablari erta turmayman." }
  ],
  "A2.03": [
    { t: "c", q: "Choy ichasizmi? (taklif)", o: ["Çay içer misiniz?", "Çay içiyor musunuz?", "Çay içtiniz mi?"], a: 0, e: "Taklif va iltimosda geniş zaman soʻroq shakli ishlatiladi." },
    { t: "c", q: "Yordam berasizmi?", o: ["Yardım eder misiniz?", "Yardım ediyor musunuz?", "Yardım edermisiniz?"], a: 0 },
    { t: "c", q: "Eshikni ochib yuborasanmi?", o: ["Kapıyı açar mısın?", "Kapıyı açar misin?", "Kapıyı açtın mı?"], a: 0 },
    { t: "c", q: "Taklifni muloyim rad etish:", o: ["Teşekkürler, almayayım.", "Hayır, istemem!", "Yok!"], a: 0 },
    { t: "t", q: "Tuzu ___ misiniz? (vermek)", ans: ["verir"], uz: "Tuzni uzatib yuborasizmi?" },
    { t: "t", q: "Biraz yavaş ___ musunuz? (konuşmak)", ans: ["konuşur"], uz: "Biroz sekinroq gapirasizmi?" }
  ],
  "A2.04": [
    { t: "c", q: "Sen qoʻngʻiroq qilganingda men ovqat qilayotgan edim.", o: ["Sen aradığında ben yemek yapıyordum.", "Sen aradığında ben yemek yapıyorum.", "Sen aradığında ben yemek yapacaktım."], a: 0 },
    { t: "c", q: "gelmek, biz → kelayotgan edik", o: ["geliyorduk", "geliyordık", "gelirdik"], a: 0, e: "-yor dan keyin -du har doim u bilan." },
    { t: "c", q: "U kitob oʻqiyotgan edi.", o: ["O kitap okuyordu.", "O kitap okuyordı.", "O kitap okuyurdu."], a: 0 },
    { t: "c", q: "Telefon jiringlaganda sen nima qilayotgan eding?", o: ["Telefon çaldığında sen ne yapıyordun?", "Telefon çaldığında sen ne yapıyorsun?", "Telefon çaldığında sen ne yaparsın?"], a: 0 },
    { t: "t", q: "Biz televizyon ___, elektrik kesildi. (izlemek)", ans: ["izliyorduk"], uz: "Biz televizor koʻrayotgan edik, elektr oʻchdi.", e: "izle + iyor → izliyor: e tushadi." },
    { t: "t", q: "Onlar parkta ___. (oynamak)", ans: ["oynuyorlardı", "oynuyordu"], uz: "Ular parkda oʻynayotgan edi." }
  ],
  "A2.05": [
    { t: "c", q: "Ali kecha ketibdi (eshitdim).", o: ["Ali dün gitmiş.", "Ali dün gitti.", "Ali dün gidiyor."], a: 0 },
    { t: "c", q: "okumak, o → oʻqibdi", o: ["okumuş", "okumış", "okumiş"], a: 0, e: "Oxirgi unli u → -muş." },
    { t: "c", q: "gelmek, sen → kelibsan", o: ["gelmişsin", "gelmişsun", "gelmişin"], a: 0 },
    { t: "c", q: "görmek, o → koʻribdi", o: ["görmüş", "görmiş", "görmuş"], a: 0, e: "Oxirgi unli ö → -müş." },
    { t: "t", q: "Ayşe ___. (evlenmek, -ibdi)", ans: ["evlenmiş"], uz: "Ayşe turmushga chiqibdi." },
    { t: "t", q: "Onlar tatile ___. (gitmek, -ibdi)", ans: ["gitmişler"], uz: "Ular taʼtilga ketibdi." }
  ],
  "A2.06": [
    { t: "c", q: "Oʻzim koʻrdim: «Avtobus kechikdi.»", o: ["Otobüs gecikti.", "Otobüs gecikmiş."], a: 0, e: "Guvoh boʻlgan ish — -DI." },
    { t: "c", q: "Doʻstimdan eshitdim: «Imtihon qiyin boʻlibdi.»", o: ["Sınav zor olmuş.", "Sınav zor oldu."], a: 0, e: "Eshitilgan xabar — -mIş." },
    { t: "c", q: "Ertakning boshlanishi:", o: ["Bir varmış, bir yokmuş.", "Bir vardı, bir yoktu."], a: 0 },
    { t: "c", q: "Ertalab koʻcha hoʻl: kechasi yomgʻir ___.", o: ["yağmış", "yağdı", "yağıyor"], a: 0, e: "Natijasini koʻrib bildingiz — -mIş." },
    { t: "c", q: "Oʻzim koʻrdim: Ali senga qoʻngʻiroq qildi.", o: ["Ali seni aradı.", "Ali seni aramış."], a: 0 },
    { t: "t", q: "Gazetede okudum: fiyatlar ___. (artmak, -ibdi)", ans: ["artmış"], uz: "Gazetada oʻqidim: narxlar oshibdi." }
  ],
  "A2.07": [
    { t: "c", q: "Kecha uyda edim.", o: ["Dün evdeydim.", "Dün evdeyim.", "Dün evdedim."], a: 0 },
    { t: "c", q: "öğrenci + edi", o: ["öğrenciydi", "öğrencidi", "öğrenciyti"], a: 0, e: "Unlidan keyin y qoʻshiladi." },
    { t: "c", q: "soğuk + edi", o: ["soğuktu", "soğukdu", "soğuktı"], a: 0, e: "k jarangsiz → -tu." },
    { t: "c", q: "Bolaligimda itimiz bor edi.", o: ["Çocukken bir köpeğimiz vardı.", "Çocukken bir köpeğimiz var.", "Çocukken bir köpeğimiz varmış."], a: 0 },
    { t: "t", q: "Dün çok ___. (yorgun, edim)", ans: ["yorgundum"], uz: "Kecha juda charchagan edim." },
    { t: "t", q: "Geçen yıl öğrenci ___. (değil, edim)", ans: ["değildim"], uz: "Oʻtgan yili talaba emas edim." }
  ],
  "A2.08": [
    { t: "c", q: "Bu restoran juda yaxshi ekan!", o: ["Bu lokanta çok güzelmiş!", "Bu lokanta çok güzeldi!", "Bu lokanta çok güzel!"], a: 0 },
    { t: "c", q: "Ali kasal ekan.", o: ["Ali hastaymış.", "Ali hastamış.", "Ali hastaydı."], a: 0, e: "Unlidan keyin y qoʻshiladi." },
    { t: "c", q: "Uyda hech kim yoʻq ekan.", o: ["Evde kimse yokmuş.", "Evde kimse yoktu.", "Evde kimse yokmiş."], a: 0 },
    { t: "c", q: "Siz oʻqituvchi ekansiz.", o: ["Siz öğretmenmişsiniz.", "Siz öğretmendiniz.", "Siz öğretmenmişsin."], a: 0 },
    { t: "t", q: "Film çok ___. (güzel, ekan)", ans: ["güzelmiş"], uz: "Film juda yaxshi ekan." },
    { t: "t", q: "Onun iki çocuğu ___. (var, ekan)", ans: ["varmış"], uz: "Uning ikki farzandi bor ekan." }
  ],
  "A2.09": [
    { t: "c", q: "Men suza olaman.", o: ["Ben yüzebilirim.", "Ben yüzerim.", "Ben yüzebilim."], a: 0 },
    { t: "c", q: "okumak → oʻqiy olaman", o: ["okuyabilirim", "okuabilirim", "okuyebilirim"], a: 0, e: "Unlidan keyin y; oxirgi unli u → -yabil." },
    { t: "c", q: "Kirsam boʻladimi?", o: ["Girebilir miyim?", "Girer miyim?", "Girebilirim mi?"], a: 0 },
    { t: "c", q: "Kecha erta kela oldim.", o: ["Dün erken gelebildim.", "Dün erken gelebilirdim.", "Dün erken gelebilirim."], a: 0 },
    { t: "t", q: "Sen bu kitabı ___. (okumak, -a olasan)", ans: ["okuyabilirsin"], uz: "Sen bu kitobni oʻqiy olasan." },
    { t: "t", q: "Size yardım ___ miyim? (etmek)", ans: ["edebilir"], uz: "Sizga yordam bera olamanmi?", e: "t → d: et → edebilir." }
  ],
  "A2.10": [
    { t: "c", q: "Men suza olmayman.", o: ["Ben yüzemem.", "Ben yüzebilmem.", "Ben yüzmem."], a: 0, e: "Boʻlishsizda -abil emas, -(y)AmA ishlatiladi." },
    { t: "c", q: "Bugün gelemem — maʼnosi:", o: ["Bugun kela olmayman.", "Bugun kelmayman.", "Bugun kelaman."], a: 0 },
    { t: "c", q: "okumak → oʻqiy olmadim", o: ["okuyamadım", "okuamadım", "okumadım"], a: 0 },
    { t: "c", q: "Ular kela olmaydi.", o: ["Onlar gelemezler.", "Onlar gelmezler.", "Onlar gelebilirler."], a: 0 },
    { t: "t", q: "Çok gürültü var, ___. (uyumak, ben, -a olmayapman)", ans: ["uyuyamıyorum"], uz: "Juda shovqin, uxlay olmayapman." },
    { t: "t", q: "Dün seni ___. (aramak, ben, -a olmadim)", ans: ["arayamadım"], uz: "Kecha senga qoʻngʻiroq qila olmadim." }
  ],
  "A2.11": [
    { t: "c", q: "Shifokorga borishing kerak.", o: ["Doktora gitmelisin.", "Doktora gidersin.", "Doktora gitmeliyim."], a: 0 },
    { t: "c", q: "çalışmak, ben → ishlashim kerak", o: ["çalışmalıyım", "çalışmalım", "çalışmeliyim"], a: 0 },
    { t: "c", q: "Bormasliging kerak.", o: ["Gitmemelisin.", "Gitmelisin.", "Gidemezsin."], a: 0 },
    { t: "c", q: "gelmek, biz → kelishimiz kerak", o: ["gelmeliyiz", "gelmeliz", "gelmalıyız"], a: 0 },
    { t: "t", q: "Daha çok su ___. (içmek, sen)", ans: ["içmelisin"], uz: "Koʻproq suv ichishing kerak." },
    { t: "t", q: "Sınava ___. (hazırlanmak, biz)", ans: ["hazırlanmalıyız"], uz: "Imtihonga tayyorlanishimiz kerak." }
  ],
  "A2.12": [
    { t: "c", q: "Menga suv kerak.", o: ["Bana su lazım.", "Ben su lazım.", "Bende su lazım."], a: 0 },
    { t: "c", q: "Erta turishim kerak.", o: ["Erken kalkmam lazım.", "Erken kalkmak lazımım.", "Erken kalkarım lazım."], a: 0 },
    { t: "c", q: "Ishlashga majburman.", o: ["Çalışmak zorundayım.", "Çalışmam zorunda.", "Çalışma zorundayım."], a: 0 },
    { t: "c", q: "Uning kelishi kerak.", o: ["Onun gelmesi gerek.", "Onun gelmek gerek.", "O gelmeli gerek."], a: 0 },
    { t: "t", q: "Yarın erken ___ gerek. (gitmek, ben)", ans: ["gitmem"], uz: "Ertaga erta borishim kerak." },
    { t: "t", q: "Bu ilacı ___ lazım. (içmek, sen)", ans: ["içmen"], uz: "Bu dorini ichishing kerak." }
  ],
  "A2.13": [
    { t: "c", q: "Turkiyaga bormoqchiman.", o: ["Türkiye'ye gitmek istiyorum.", "Türkiye'ye gitmek istiyorsun.", "Türkiye'ye gitmem istiyorum."], a: 0 },
    { t: "c", q: "Nima qilmoqchisan?", o: ["Ne yapmak istiyorsun?", "Ne yapmak istiyorum?", "Ne yapmayı istiyor?"], a: 0 },
    { t: "c", q: "Kelishingni xohlayman.", o: ["Gelmeni istiyorum.", "Gelmek istiyorum.", "Geldin istiyorum."], a: 0, e: "Boshqa odam qilishini xohlasak: -mA + egalik + tushum." },
    { t: "c", q: "Choy ichishni xohlaysizmi?", o: ["Çay içmek ister misiniz?", "Çay içmek istersin mi?", "Çay içer istiyor musunuz?"], a: 0 },
    { t: "t", q: "Ben doktor olmak ___. (istemek, hozirgi zamon)", ans: ["istiyorum"], uz: "Men shifokor boʻlmoqchiman." },
    { t: "t", q: "Akşam sinemaya ___ istiyoruz. (gitmek)", ans: ["gitmek"], uz: "Kechqurun kinoga bormoqchimiz." }
  ],
  "A2.14": [
    { t: "c", q: "Sizga choy olib kelaymi?", o: ["Size çay getireyim mi?", "Size çay getirdim mi?", "Size çay getirelim mi?"], a: 0 },
    { t: "c", q: "Yordam beraymi?", o: ["Yardım edeyim mi?", "Yardım eteyim mi?", "Yardım ederim mi?"], a: 0, e: "Unlidan oldin t → d." },
    { t: "c", q: "Eshikni ochaymi?", o: ["Kapıyı açayım mı?", "Kapıyı açayım mi?", "Kapıyı açarım mı?"], a: 0 },
    { t: "c", q: "okumak, ben → oʻqiy", o: ["okuyayım", "okuyeyim", "okuayım"], a: 0 },
    { t: "t", q: "Pencereyi ___ mı? (kapatmak, ben)", ans: ["kapatayım"], uz: "Derazani yopaymi?" },
    { t: "t", q: "Sana bir şey ___ mı? (sormak, ben)", ans: ["sorayım"], uz: "Sendan bir narsa soʻraymi?" }
  ],
  "A2.15": [
    { t: "c", q: "Uyga kelayotganingda non ol.", o: ["Eve gelirken ekmek al.", "Eve gelirkan ekmek al.", "Eve gelken ekmek al."], a: 0, e: "-ken uygʻunlikka boʻysunmaydi va geniş zamandan keyin keladi." },
    { t: "c", q: "bolaligimda", o: ["çocukken", "çocukkan", "çocuğuken"], a: 0 },
    { t: "c", q: "talabaligimda", o: ["öğrenciyken", "öğrenciken", "öğrencikan"], a: 0, e: "Unlidan keyin y qoʻshiladi." },
    { t: "c", q: "okumak → oʻqiyotganda", o: ["okurken", "okuken", "okurkan"], a: 0 },
    { t: "t", q: "Yolda ___ müzik dinlerim. (yürümek, -ayotganda)", ans: ["yürürken"], uz: "Yoʻlda yurayotganda musiqa tinglayman." },
    { t: "t", q: "Ben ___ annem aradı. (evde, -ligimda)", ans: ["evdeyken"], uz: "Men uydaligimda onam qoʻngʻiroq qildi." }
  ],
  "A2.16": [
    { t: "c", q: "ovqat yegandan keyin", o: ["yemek yedikten sonra", "yemek yemeden önce", "yemek yerken"], a: 0 },
    { t: "c", q: "gitmek → ketgandan keyin", o: ["gittikten sonra", "gitdikten sonra", "gidikten sonra"], a: 0, e: "t jarangsiz → -tikten." },
    { t: "c", q: "okumak → oʻqigandan keyin", o: ["okuduktan sonra", "okudıktan sonra", "okudukten sonra"], a: 0 },
    { t: "c", q: "ishdan keyin", o: ["işten sonra", "işe sonra", "işte sonra"], a: 0, e: "sonra oldidagi ot -DAn oladi." },
    { t: "t", q: "Dersi ___ sonra eve gittik. (bitirmek)", ans: ["bitirdikten"], uz: "Darsni tugatgandan keyin uyga ketdik." },
    { t: "t", q: "Filmi ___ sonra yemek yedik. (izlemek)", ans: ["izledikten"], uz: "Filmni koʻrgandan keyin ovqat yedik." }
  ],
  "A2.17": [
    { t: "c", q: "yotishdan oldin", o: ["yatmadan önce", "yattıktan önce", "yatmaktan önce"], a: 0 },
    { t: "c", q: "gelmek → kelishdan oldin", o: ["gelmeden önce", "gelmedan önce", "gelmeden sonra"], a: 0, e: "Faqat ikki xil: -madan / -meden." },
    { t: "c", q: "ovqatdan oldin", o: ["yemekten önce", "yemeğe önce", "yemekte önce"], a: 0 },
    { t: "c", q: "Chiqishdan oldin chiroqni oʻchir.", o: ["Çıkmadan önce ışığı kapat.", "Çıktıktan sonra ışığı kapat.", "Çıkarken önce ışığı kapat."], a: 0 },
    { t: "t", q: "Yemek ___ önce ellerini yıka. (yemek)", ans: ["yemeden"], uz: "Ovqat yeyishdan oldin qoʻlingni yuv." },
    { t: "t", q: "Uyumadan ___ kitap okurum.", ans: ["önce"], uz: "Uxlashdan oldin kitob oʻqiyman." }
  ],
  "A2.18": [
    { t: "c", q: "Maktabga piyoda boraman.", o: ["Okula yürüyerek gidiyorum.", "Okula yürürken gidiyorum.", "Okula yürümek gidiyorum."], a: 0 },
    { t: "c", q: "koşmak → yugurib", o: ["koşarak", "koşerek", "koşyarak"], a: 0 },
    { t: "c", q: "gülmek → kulib", o: ["gülerek", "gülarak", "gülyerek"], a: 0 },
    { t: "c", q: "beklemek → kutib", o: ["bekleyerek", "beklerek", "bekleyarak"], a: 0, e: "Unlidan keyin y qoʻshiladi." },
    { t: "t", q: "Çocuk ___ eve geldi. (ağlamak, -ib)", ans: ["ağlayarak"], uz: "Bola yigʻlab uyga keldi." },
    { t: "t", q: "Müzik ___ ders çalışıyorum. (dinlemek, -ib)", ans: ["dinleyerek"], uz: "Musiqa tinglab dars qilyapman." }
  ],
  "A2.19": [
    { t: "c", q: "Ertalab turib dush qabul qildim.", o: ["Sabah kalkıp duş aldım.", "Sabah kalktım duş aldım.", "Sabah kalkup duş aldım."], a: 0 },
    { t: "c", q: "gelmek → kelib", o: ["gelip", "gelup", "gelüp"], a: 0 },
    { t: "c", q: "okumak → oʻqib", o: ["okuyup", "okuup", "okuyip"], a: 0 },
    { t: "c", q: "görmek → koʻrib", o: ["görüp", "görip", "görup"], a: 0 },
    { t: "t", q: "Markete ___ ekmek aldım. (gitmek, -ib)", ans: ["gidip"], uz: "Doʻkonga borib non oldim.", e: "Unlidan oldin t → d." },
    { t: "o", s: "Eve gelip yemek yedik", uz: "Uyga kelib ovqat yedik." }
  ],
  "A2.20": [
    { t: "c", q: "Nonushta qilmasdan ishga ketdi.", o: ["Kahvaltı yapmadan işe gitti.", "Kahvaltı yapıp işe gitti.", "Kahvaltı yaparak işe gitti."], a: 0 },
    { t: "c", q: "bakmak → qaramasdan", o: ["bakmadan", "bakmeden", "bakmadın"], a: 0 },
    { t: "c", q: "düşünmek → oʻylamasdan", o: ["düşünmeden", "düşünmadan", "düşünmeyen"], a: 0 },
    { t: "c", q: "Ruxsat soʻramasdan kirdi.", o: ["İzin istemeden girdi.", "İzin isteyerek girdi.", "İzin istemek girdi."], a: 0 },
    { t: "t", q: "Ali hiç ___ konuştu. (durmak, -masdan)", ans: ["durmadan"], uz: "Ali toʻxtamasdan gapirdi." },
    { t: "t", q: "Kapıyı ___ girme! (çalmak, -masdan)", ans: ["çalmadan"], uz: "Eshikni taqillatmasdan kirma!" }
  ],
  "A2.21": [
    { t: "c", q: "turkcha oʻrganish uchun", o: ["Türkçe öğrenmek için", "Türkçe öğrenmeye için", "Türkçe öğrenerek için"], a: 0 },
    { t: "c", q: "Nima uchun keldingiz?", o: ["Niçin geldiniz?", "Nerede geldiniz?", "Nasıl geldiniz?"], a: 0 },
    { t: "c", q: "Dam olish uchun dengizga bordik.", o: ["Dinlenmek için denize gittik.", "Dinlenmek için denizde gittik.", "Dinlenmeye için denize gittik."], a: 0 },
    { t: "t", q: "Para ___ için çalışıyorum. (kazanmak)", ans: ["kazanmak"], uz: "Pul topish uchun ishlayapman." },
    { t: "t", q: "Ekmek ___ markete gitti. (almak, uchun)", ans: ["almak için"], uz: "Non olish uchun doʻkonga ketdi." },
    { t: "o", s: "Kitap okumak için kütüphaneye gittim", uz: "Kitob oʻqish uchun kutubxonaga bordim." }
  ],
  "A2.22": [
    { t: "c", q: "Bu ovqatni oʻzim qildim.", o: ["Bu yemeği kendim yaptım.", "Bu yemeği kendin yaptım.", "Bu yemeği kendi yaptım."], a: 0 },
    { t: "c", q: "oʻzimga", o: ["kendime", "kendimi", "kendimde"], a: 0 },
    { t: "c", q: "U oʻzini yaxshi his qilmayapti.", o: ["Kendini iyi hissetmiyor.", "Kendimi iyi hissetmiyor.", "Kendine iyi hissetmiyor."], a: 0 },
    { t: "c", q: "oʻz xonasi", o: ["kendi odası", "kendi odam", "kendisi oda"], a: 0 },
    { t: "t", q: "Ödevini ___ yap! (oʻzing)", ans: ["kendin"], uz: "Vazifangni oʻzing qil!" },
    { t: "t", q: "Biz bu evi ___ yaptık. (oʻzimiz)", ans: ["kendimiz"], uz: "Biz bu uyni oʻzimiz qurdik." }
  ],
  "A2.23": [
    { t: "c", q: "Xonada hech kim yoʻq.", o: ["Odada kimse yok.", "Odada herkes yok.", "Odada biri yok."], a: 0 },
    { t: "c", q: "Hech kim kelmadi.", o: ["Kimse gelmedi.", "Kimse geldi.", "Hiçbir şey gelmedi."], a: 0, e: "kimse bilan feʼl boʻlishsiz boʻladi." },
    { t: "c", q: "Hamma keldi.", o: ["Herkes geldi.", "Her şey geldi.", "Hiç kimse geldi."], a: 0 },
    { t: "c", q: "Eshik oldida kimdir bor.", o: ["Kapıda biri var.", "Kapıda kimse var.", "Kapıda herkes var."], a: 0 },
    { t: "t", q: "Hiçbir ___ anlamadım. (narsa)", ans: ["şey"], uz: "Hech narsani tushunmadim." },
    { t: "t", q: "___ şey yolunda. (hamma)", ans: ["her"], uz: "Hamma narsa joyida." }
  ],
  "A2.24": [
    { t: "c", q: "stoldagi kitob", o: ["masadaki kitap", "masada kitap", "masadakı kitap"], a: 0, e: "-ki odatda oʻzgarmaydi." },
    { t: "c", q: "bugungi gazeta", o: ["bugünkü gazete", "bugünki gazete", "bugündeki gazete"], a: 0, e: "bugünkü va dünkü — istisno." },
    { t: "c", q: "Bu kitob meniki.", o: ["Bu kitap benimki.", "Bu kitap bendeki.", "Bu kitap benki."], a: 0 },
    { t: "c", q: "ertangi uchrashuv", o: ["yarınki toplantı", "yarındaki toplantı", "yarınkı toplantı"], a: 0 },
    { t: "t", q: "___ kedi çok tatlı. (ev, -dagi)", ans: ["evdeki"], uz: "Uydagi mushuk juda yoqimtoy." },
    { t: "t", q: "Bu araba ___. (Ali, -niki)", ans: ["Ali'ninki"], uz: "Bu mashina Aliniki.", e: "Atoqli otda apostrof qoʻyiladi." }
  ],
  "A2.25": [
    { t: "c", q: "menimcha", o: ["bence", "benimce", "bende"], a: 0 },
    { t: "c", q: "turkcha", o: ["Türkçe", "Türkce", "Türkca"], a: 0, e: "k jarangsiz → -çe." },
    { t: "c", q: "sekingina", o: ["yavaşça", "yavaşca", "yavaşce"], a: 0, e: "ş jarangsiz → -ça." },
    { t: "c", q: "soatlab", o: ["saatlerce", "saatlarca", "saatçe"], a: 0 },
    { t: "t", q: "___ bu fikir iyi mi? (sen, -cha)", ans: ["sence"], uz: "Sening fikringcha, bu gʻoya yaxshimi?" },
    { t: "t", q: "O, ___ konuşuyor. (İngiliz, -cha)", ans: ["İngilizce"], uz: "U inglizcha gapiryapti." }
  ],
  "A2.26": [
    { t: "c", q: "Ukam menchalik baland.", o: ["Kardeşim benim kadar uzun.", "Kardeşim ben kadar uzun.", "Kardeşim bana kadar uzun."], a: 0, e: "Kishilik olmoshlari kadar dan oldin qaratqichda keladi." },
    { t: "c", q: "senchalik", o: ["senin kadar", "sen kadar", "sende kadar"], a: 0 },
    { t: "c", q: "Anqara Istanbulchalik katta emas.", o: ["Ankara, İstanbul kadar büyük değil.", "Ankara, İstanbul'un kadar büyük değil.", "Ankara, İstanbul'a kadar büyük değil."], a: 0, e: "Otlar kadar dan oldin bosh kelishikda qoladi." },
    { t: "c", q: "uchalik tez", o: ["onun kadar hızlı", "ona kadar hızlı", "onda kadar hızlı"], a: 0 },
    { t: "t", q: "Hiçbir yer ev ___ rahat değil. (-chalik)", ans: ["kadar"], uz: "Hech qayer uychalik qulay emas." },
    { t: "t", q: "Ali, ___ kadar çalışkan. (biz)", ans: ["bizim"], uz: "Ali bizchalik tirishqoq." }
  ],
  "A2.27": [
    { t: "c", q: "oppoq", o: ["bembeyaz", "bebeyaz", "besbeyaz"], a: 0 },
    { t: "c", q: "qop-qora", o: ["kapkara", "kaskara", "kamkara"], a: 0 },
    { t: "c", q: "yam-yashil", o: ["yemyeşil", "yepyeşil", "yesyeşil"], a: 0 },
    { t: "c", q: "top-toza", o: ["tertemiz", "tetemiz", "tentemiz"], a: 0 },
    { t: "t", q: "Deniz bugün ___. (mavi, kuchaytirilgan)", ans: ["masmavi"], uz: "Dengiz bugun koʻm-koʻk." },
    { t: "t", q: "Elma ___. (kırmızı, kuchaytirilgan)", ans: ["kıpkırmızı"], uz: "Olma qip-qizil." }
  ],
  "A2.28": [
    { t: "c", q: "soat beshgacha", o: ["saat beşe kadar", "saat beşten kadar", "saat beşte kadar"], a: 0, e: "kadar oldidagi ot -(y)A oladi." },
    { t: "c", q: "darsdan keyin", o: ["dersten sonra", "derse sonra", "derste sonra"], a: 0 },
    { t: "c", q: "menga koʻra", o: ["bana göre", "benden göre", "benim göre"], a: 0 },
    { t: "c", q: "ertalabdan beri", o: ["sabahtan beri", "sabaha beri", "sabahta beri"], a: 0 },
    { t: "t", q: "___ doğru yürüdük. (ev)", ans: ["eve"], uz: "Uy tomon yurdik." },
    { t: "t", q: "Senden ___ kimse bilmiyor. (boshqa)", ans: ["başka"], uz: "Sendan boshqa hech kim bilmaydi." }
  ],
  "A2.29": [
    { t: "c", q: "Uch yildan beri Anqarada yashayman.", o: ["Üç yıldır Ankara'da yaşıyorum.", "Üç yıl önce Ankara'da yaşıyorum.", "Üç yıl sonra Ankara'da yaşıyorum."], a: 0 },
    { t: "c", q: "ikki kun oldin", o: ["iki gün önce", "iki güne önce", "iki gün sonra"], a: 0 },
    { t: "c", q: "bir soatdan keyin", o: ["bir saat sonra", "bir saate sonra", "bir saat önce"], a: 0 },
    { t: "c", q: "Ertalabdan beri kutyapman.", o: ["Sabahtan beri bekliyorum.", "Sabahtan beri bekledim.", "Sabaha beri bekliyorum."], a: 0, e: "Davom etayotgan ish — hozirgi zamon." },
    { t: "t", q: "İki ___ Türkçe öğreniyorum. (yil, -dan beri)", ans: ["yıldır"], uz: "Ikki yildan beri turkcha oʻrganyapman." },
    { t: "t", q: "Beş dakika ___ geldim. (oldin)", ans: ["önce"], uz: "Besh daqiqa oldin keldim." }
  ]
});

// B1 mashqlari (B1.01–B1.27).
Object.assign(BX, {
  "B1.01": [
    { t: "c", q: "kitob oʻqiyotgan bola", o: ["kitap okuyan çocuk", "kitap okuduğu çocuk", "kitap okuyen çocuk"], a: 0 },
    { t: "c", q: "kelgan mehmon", o: ["gelen misafir", "gelan misafir", "geldiği misafir"], a: 0 },
    { t: "c", q: "turkcha biladigan kishi", o: ["Türkçe bilen biri", "Türkçe bildiği biri", "Türkçe bilan biri"], a: 0 },
    { t: "c", q: "kelmagan oʻquvchilar", o: ["gelmeyen öğrenciler", "gelmeen öğrenciler", "gelmedik öğrenciler"], a: 0 },
    { t: "t", q: "Bankada ___ adam benim babam. (çalışmak)", ans: ["çalışan"], uz: "Bankda ishlaydigan odam mening otam." },
    { t: "t", q: "Şarkı ___ kız kim? (söylemek)", ans: ["söyleyen"], uz: "Qoʻshiq aytayotgan qiz kim?", e: "Unlidan keyin y: söyle + y + en." }
  ],
  "B1.02": [
    { t: "c", q: "men oʻqigan kitob", o: ["okuduğum kitap", "okuyan kitap", "okuduğun kitap"], a: 0 },
    { t: "c", q: "u yashaydigan uy", o: ["onun yaşadığı ev", "onun yaşayan ev", "onun yaşadığım ev"], a: 0, e: "Uy ishni bajarmaydi, shuning uchun -DIK + egalik." },
    { t: "c", q: "biz borgan joy", o: ["gittiğimiz yer", "gidtiğimiz yer", "gidiğimiz yer"], a: 0, e: "t jarangsiz → -tiğ." },
    { t: "c", q: "Kecha koʻrgan filmim juda yaxshi edi.", o: ["Dün izlediğim film çok güzeldi.", "Dün izleyen film çok güzeldi.", "Dün izlediğin film çok güzeldi."], a: 0 },
    { t: "t", q: "Senin ___ yemek çok lezzetli. (yapmak)", ans: ["yaptığın"], uz: "Sen qilgan ovqat juda mazali." },
    { t: "t", q: "Annemin ___ hediye çok güzel. (almak)", ans: ["aldığı"], uz: "Onam olgan sovgʻa juda chiroyli." }
  ],
  "B1.03": [
    { t: "c", q: "boradigan joyimiz", o: ["gideceğimiz yer", "gideceğimizi yer", "gittiğimiz yer"], a: 0 },
    { t: "c", q: "ertaga keladigan mehmon", o: ["yarın gelecek misafir", "yarın geleceği misafir", "yarın gelecekler misafir"], a: 0, e: "Mehmonning oʻzi keladi — egaliksiz." },
    { t: "c", q: "oʻqiydigan kitobing", o: ["okuyacağın kitap", "okuyacağım kitap", "okuyacaksın kitap"], a: 0 },
    { t: "c", q: "Taʼtilda qoladigan mehmonxonamiz dengizga yaqin.", o: ["Tatilde kalacağımız otel denize yakın.", "Tatilde kalacağız otel denize yakın.", "Tatilde kaldığımız otel denize yakın."], a: 0, e: "kaldığımız — qolgan (oʻtmish)." },
    { t: "t", q: "Yarın ___ film korku filmi. (izlemek, biz)", ans: ["izleyeceğimiz"], uz: "Ertaga koʻradigan filmimiz qoʻrqinchli film." },
    { t: "t", q: "Sana ___ şey çok önemli. (söylemek, ben)", ans: ["söyleyeceğim"], uz: "Senga aytadigan gapim juda muhim." }
  ],
  "B1.04": [
    { t: "c", q: "Kelganlarga choy berdik.", o: ["Gelenlere çay verdik.", "Gelenler çay verdik.", "Gelenleri çay verdik."], a: 0 },
    { t: "c", q: "aytganlaring", o: ["söylediklerin", "söyleyenlerin", "söyledikleri"], a: 0 },
    { t: "c", q: "Turkcha biladiganlar qoʻl koʻtarsin.", o: ["Türkçe bilenler el kaldırsın.", "Türkçe bildikler el kaldırsın.", "Türkçe bilenleri el kaldırsın."], a: 0 },
    { t: "c", q: "Koʻrganlarimni sizga aytib beraman.", o: ["Gördüklerimi size anlatacağım.", "Görenlerimi size anlatacağım.", "Gördüğüm size anlatacağım."], a: 0 },
    { t: "t", q: "Sınavı ___ çok mutlu. (kazanmak, -ganlar)", ans: ["kazananlar"], uz: "Imtihondan oʻtganlar juda xursand." },
    { t: "t", q: "___ anlamadım. (söylemek, sen, -ganlaringni)", ans: ["söylediklerini"], uz: "Aytganlaringni tushunmadim." }
  ],
  "B1.05": [
    { t: "c", q: "Uyga kelganingda menga qoʻngʻiroq qil.", o: ["Eve gelince beni ara.", "Eve gelinca beni ara.", "Eve geldin beni ara."], a: 0 },
    { t: "c", q: "okumak → oʻqiganda", o: ["okuyunca", "okuynca", "okunca"], a: 0, e: "Unlidan keyin y qoʻshiladi." },
    { t: "c", q: "görmek → koʻrganda", o: ["görünce", "görunce", "görınce"], a: 0 },
    { t: "c", q: "kelganingda", o: ["geldiğinde", "geldiğimde", "gelindiğinde"], a: 0 },
    { t: "t", q: "Yağmur ___ eve döndük. (başlamak, -ganda)", ans: ["başlayınca"], uz: "Yomgʻir boshlanganda uyga qaytdik." },
    { t: "t", q: "Ben ___ zaman sen uyuyordun. (gelmek)", ans: ["geldiğim"], uz: "Men kelganimda sen uxlayotgan eding." }
  ],
  "B1.06": [
    { t: "c", q: "oʻqigan sari", o: ["okudukça", "okuyunca", "okuyarak"], a: 0 },
    { t: "c", q: "çalışmak → ishlagan sari", o: ["çalıştıkça", "çalışdıkça", "çalıştikça"], a: 0, e: "ş jarangsiz → -tıkça." },
    { t: "c", q: "Turkcha gapirgan sari osonroq boʻlyapti.", o: ["Türkçe konuştukça daha kolay oluyor.", "Türkçe konuşunca daha kolay oluyor.", "Türkçe konuşurken daha kolay oluyor."], a: 0 },
    { t: "c", q: "görmek → koʻrgan sari", o: ["gördükçe", "gördükça", "görtükçe"], a: 0 },
    { t: "t", q: "Para ___ daha çok harcıyor. (kazanmak)", ans: ["kazandıkça"], uz: "Pul topgan sari koʻproq sarflayapti." },
    { t: "t", q: "Bu şarkıyı ___ seni hatırlıyorum. (dinlemek)", ans: ["dinledikçe"], uz: "Bu qoʻshiqni tinglagan sari seni eslayman." }
  ],
  "B1.07": [
    { t: "c", q: "Istanbulga kelganimga ikki yil boʻldi.", o: ["İstanbul'a geleli iki yıl oldu.", "İstanbul'a gelince iki yıl oldu.", "İstanbul'a gelerek iki yıl oldu."], a: 0 },
    { t: "c", q: "tanışmak → tanishganimizdan beri", o: ["tanışalı", "tanışeli", "tanışyalı"], a: 0 },
    { t: "c", q: "başlamak → boshlaganidan beri", o: ["başlayalı", "başlaalı", "başlayeli"], a: 0, e: "Unlidan keyin y qoʻshiladi." },
    { t: "c", q: "kelganimdan beri", o: ["geldiğimden beri", "geldiğime beri", "geldiğimde beri"], a: 0, e: "beri oldidagi soʻz -DAn oladi." },
    { t: "t", q: "Türkçe ___ beri çok mutluyum. (öğrenmek, -ganimdan)", ans: ["öğreneli"], uz: "Turkcha oʻrganganimdan beri juda xursandman." },
    { t: "t", q: "O ___ beri onu hiç görmedim. (taşınmak)", ans: ["taşınalı"], uz: "U koʻchib ketganidan beri uni hech koʻrmadim." }
  ],
  "B1.08": [
    { t: "c", q: "yugura-yugura", o: ["koşa koşa", "koşarak koşarak", "koşup koşup"], a: 0 },
    { t: "c", q: "kula-kula", o: ["güle güle", "gülü gülü", "güla güla"], a: 0 },
    { t: "c", q: "bila turib", o: ["bile bile", "bilip bilip", "bilen bilen"], a: 0 },
    { t: "c", q: "Xayr! (ketayotgan kishiga)", o: ["Güle güle!", "Gele gele!", "Koşa koşa!"], a: 0 },
    { t: "t", q: "Bebek ___ uyudu. (ağlamak, -a-a)", ans: ["ağlaya ağlaya"], uz: "Chaqaloq yigʻlay-yigʻlay uxladi." },
    { t: "t", q: "Çocuklar ___ geldi. (koşmak, -a-a)", ans: ["koşa koşa"], uz: "Bolalar yugura-yugura keldi." }
  ],
  "B1.09": [
    { t: "c", q: "Kasal boʻlganim uchun ishga bormadim.", o: ["Hasta olduğum için işe gitmedim.", "Hasta olduğun için işe gitmedim.", "Hasta olmak için işe gitmedim."], a: 0 },
    { t: "c", q: "yomgʻir yoqqani uchun", o: ["yağmur yağdığı için", "yağmur yağdığım için", "yağmur yağmak için"], a: 0 },
    { t: "c", q: "koʻp ishlaganing uchun", o: ["çok çalıştığın için", "çok çalışdığın için", "çok çalıştığım için"], a: 0 },
    { t: "c", q: "Charchaganimiz uchun erta yotdik.", o: ["Yorgun olduğumuz için erken yattık.", "Yorgun olduğu için erken yattık.", "Yorgun olmamız için erken yattık."], a: 0, e: "-mAsI için — maqsad, -DIğI için — sabab." },
    { t: "t", q: "Geç ___ için özür dilerim. (kalmak, ben)", ans: ["kaldığım"], uz: "Kechikkanim uchun uzr soʻrayman." },
    { t: "t", q: "Hava soğuk ___ için dışarı çıkmadık. (olmak)", ans: ["olduğu"], uz: "Havo sovuq boʻlgani uchun tashqariga chiqmadik." }
  ],
  "B1.10": [
    { t: "c", q: "Tirbandlik dastidan kechikdim.", o: ["Trafik yüzünden geç kaldım.", "Trafik sayesinde geç kaldım.", "Trafik için geç kaldım."], a: 0, e: "Salbiy sabab — yüzünden." },
    { t: "c", q: "Sening tufayling yutdim.", o: ["Senin sayende kazandım.", "Senin yüzünden kazandım.", "Sen sayende kazandım."], a: 0, e: "Ijobiy sabab — sayesinde." },
    { t: "c", q: "Qor sababli maktablar yopiq. (rasmiy)", o: ["Kar nedeniyle okullar kapalı.", "Kar sayesinde okullar kapalı.", "Kara nedeniyle okullar kapalı."], a: 0 },
    { t: "c", q: "Doʻstim tufayli ishga kirdim.", o: ["Arkadaşım sayesinde işe girdim.", "Arkadaşım yüzünden işe girdim.", "Arkadaşıma sayesinde işe girdim."], a: 0 },
    { t: "t", q: "Senin ___ her şey bozuldu! (dastingdan)", ans: ["yüzünden"], uz: "Sening dastingdan hammasi buzildi!" },
    { t: "t", q: "Öğretmenim ___ Türkçeyi iyi öğrendim. (tufayli)", ans: ["sayesinde"], uz: "Ustozim tufayli turkchani yaxshi oʻrgandim." }
  ],
  "B1.11": [
    { t: "c", q: "Bolalar uxlasin deb televizorni oʻchirdik.", o: ["Çocuklar uyusun diye televizyonu kapattık.", "Çocuklar uyumak için televizyonu kapattık.", "Çocuklar uyusunlar için televizyonu kapattık."], a: 0 },
    { t: "c", q: "kelishingiz uchun", o: ["gelmeniz için", "gelmek için", "geldiğiniz için"], a: 0, e: "Maqsad boshqa kishiga tegishli: -mA + egalik + için." },
    { t: "c", q: "Hamma eshitsin deb baland gapirdi.", o: ["Herkes duysun diye yüksek sesle konuştu.", "Herkes duymak için yüksek sesle konuştu.", "Herkes duyduğu için yüksek sesle konuştu."], a: 0 },
    { t: "c", q: "U tushunishi uchun sekin gapirdim.", o: ["Onun anlaması için yavaş konuştum.", "Onun anlamak için yavaş konuştum.", "Onun anladığı için yavaş konuştum."], a: 0 },
    { t: "t", q: "Kardeşim ___ diye ona kitap aldım. (okumak, -sin)", ans: ["okusun"], uz: "Ukam oʻqisin deb unga kitob oldim." },
    { t: "t", q: "Senin mutlu ___ için her şeyi yaptım. (olmak)", ans: ["olman"], uz: "Sen baxtli boʻlishing uchun hamma narsani qildim." }
  ],
  "B1.12": [
    { t: "c", q: "Signal chalinsa binodan chiqing.", o: ["Alarm çalarsa binadan çıkın.", "Alarm çaldı binadan çıkın.", "Alarm çalarken binadan çıktık."], a: 0 },
    { t: "c", q: "gelmek, ben → kelsam", o: ["gelirsem", "gelirsam", "gelersem"], a: 0 },
    { t: "c", q: "Yomgʻir yogʻsa uyda qolamiz.", o: ["Yağmur yağarsa evde kalırız.", "Yağmur yağdı evde kalırız.", "Yağmur yağarken evde kalırız."], a: 0 },
    { t: "c", q: "kelmasang", o: ["gelmezsen", "gelmirsen", "gelmazsen"], a: 0, e: "Boʻlishsiz: -mAz + sA." },
    { t: "t", q: "Erken ___ seni ararım. (gelmek, ben)", ans: ["gelirsem"], uz: "Erta kelsam senga qoʻngʻiroq qilaman." },
    { t: "t", q: "Çok ___ başarılı olursun. (çalışmak, sen)", ans: ["çalışırsan"], uz: "Koʻp ishlasang muvaffaqiyatga erishasan." }
  ],
  "B1.13": [
    { t: "c", q: "Biroz dam olsakmi?", o: ["Biraz dinlensek mi?", "Biraz dinlensak mi?", "Biraz dinlendik mi?"], a: 0 },
    { t: "c", q: "gitmek, ben → borsam", o: ["gitsem", "gidsem", "gitsam"], a: 0, e: "s dan oldin t oʻzgarmaydi." },
    { t: "c", q: "Nima qilsak?", o: ["Ne yapsak?", "Ne yapsek?", "Ne yaptık?"], a: 0 },
    { t: "c", q: "Erta kelsang gaplashamiz.", o: ["Erken gelsen konuşuruz.", "Erken gelsan konuşuruz.", "Erken geldin konuşuruz."], a: 0 },
    { t: "t", q: "Bu akşam sinemaya ___ mi? (gitmek, biz)", ans: ["gitsek"], uz: "Bugun kechqurun kinoga borsakmi?" },
    { t: "t", q: "Sen de ___ çok iyi olur. (gelmek)", ans: ["gelsen"], uz: "Sen ham kelsang juda yaxshi boʻladi." }
  ],
  "B1.14": [
    { t: "c", q: "Vaqting boʻlsa bizga kel.", o: ["Zamanın varsa bize gel.", "Zamanın varse bize gel.", "Zamanın vardı bize gel."], a: 0 },
    { t: "c", q: "Kasal boʻlsang uyda qol.", o: ["Hastaysan evde kal.", "Hastasan evde kal.", "Hastaysen evde kal."], a: 0, e: "Unlidan keyin y qoʻshiladi." },
    { t: "c", q: "uyda boʻlsam", o: ["evdeysem", "evdesem", "evdeysam"], a: 0 },
    { t: "c", q: "pulim boʻlmasa", o: ["param yoksa", "param yokse", "param yoksam"], a: 0 },
    { t: "t", q: "___ dinlen. (yorgun, boʻlsang)", ans: ["yorgunsan"], uz: "Charchagan boʻlsang dam ol." },
    { t: "t", q: "Sorunuz ___ sorun. (var, boʻlsa)", ans: ["varsa"], uz: "Savolingiz boʻlsa soʻrang." }
  ],
  "B1.15": [
    { t: "c", q: "Qani endi kelsang!", o: ["Keşke gelsen!", "Keşke gelirsen!", "Keşke geldin!"], a: 0 },
    { t: "c", q: "Qani endi dengiz boʻyida boʻlsak.", o: ["Keşke deniz kenarında olsak.", "Keşke deniz kenarında olursak.", "Keşke deniz kenarındayız."], a: 0 },
    { t: "c", q: "keşke soʻzining maʼnosi:", o: ["qani endi", "balki", "albatta"], a: 0 },
    { t: "c", q: "Qani endi boy boʻlsam.", o: ["Keşke zengin olsam.", "Keşke zengin olsan.", "Keşke zengin olurum."], a: 0 },
    { t: "t", q: "Keşke yarın tatil ___. (olmak)", ans: ["olsa"], uz: "Qani endi ertaga dam olish kuni boʻlsa." },
    { t: "t", q: "Keşke Türkçeyi iyi ___. (bilmek, ben)", ans: ["bilsem"], uz: "Qani endi turkchani yaxshi bilsam." }
  ],
  "B1.16": [
    { t: "c", q: "Bu koʻprik 1973-yilda qurilgan.", o: ["Bu köprü 1973'te yapıldı.", "Bu köprü 1973'te yaptı.", "Bu köprü 1973'te yapındı."], a: 0 },
    { t: "c", q: "okumak → oʻqiladi", o: ["okunur", "okulur", "okuyulur"], a: 0, e: "Unli bilan tugagan oʻzak -n oladi." },
    { t: "c", q: "bilmek → maʼlum (bilinadi)", o: ["bilinir", "bilir", "bililir"], a: 0, e: "l bilan tugagan oʻzak -In oladi." },
    { t: "c", q: "Kitobni Orhan Pamuk yozgan (majhul).", o: ["Kitap Orhan Pamuk tarafından yazıldı.", "Kitap Orhan Pamuk'tan yazıldı.", "Kitap Orhan Pamuk ile yazıldı."], a: 0 },
    { t: "t", q: "Kapı ___. (açmak, majhul, oʻtgan)", ans: ["açıldı"], uz: "Eshik ochildi." },
    { t: "t", q: "Mektup dün ___. (göndermek, majhul, oʻtgan)", ans: ["gönderildi"], uz: "Xat kecha yuborildi." }
  ],
  "B1.17": [
    { t: "c", q: "Bu yerda chekilmaydi.", o: ["Burada sigara içilmez.", "Burada sigara içmez.", "Burada sigara içilir."], a: 0 },
    { t: "c", q: "Muzeyda suratga olinmaydi.", o: ["Müzede fotoğraf çekilmez.", "Müzede fotoğraf çekmez.", "Müzede fotoğraf çekilir."], a: 0 },
    { t: "c", q: "Bu yoʻldan boriladi.", o: ["Bu yoldan gidilir.", "Bu yoldan gider.", "Bu yoldan gidilmez."], a: 0 },
    { t: "c", q: "Kutubxonada baland ovozda gapirilmaydi.", o: ["Kütüphanede yüksek sesle konuşulmaz.", "Kütüphanede yüksek sesle konuşmaz.", "Kütüphanede yüksek sesle konuşulur."], a: 0 },
    { t: "t", q: "Burada ___. (oturmak, majhul, boʻlishsiz)", ans: ["oturulmaz"], uz: "Bu yerda oʻtirilmaydi." },
    { t: "t", q: "Havuza ___. (girmek, majhul, boʻlishsiz)", ans: ["girilmez"], uz: "Basseynga kirilmaydi." }
  ],
  "B1.18": [
    { t: "c", q: "Sochimni sartaroshga oldirdim.", o: ["Saçımı berbere kestirdim.", "Saçımı berbere kestim.", "Saçımı berber kestirdim."], a: 0, e: "X-A Y-I yaptırmak: berbere — kimga, saçımı — nimani." },
    { t: "c", q: "okumak → oʻqitmoq", o: ["okutmak", "okudurmak", "okuturmak"], a: 0, e: "Unli bilan tugagan koʻp boʻgʻinli oʻzak -t oladi." },
    { t: "c", q: "yapmak → qildirmoq", o: ["yaptırmak", "yapıtmak", "yapdırmak"], a: 0 },
    { t: "c", q: "temizlemek → tozalatmoq", o: ["temizletmek", "temizlemdirmek", "temizletirmek"], a: 0 },
    { t: "t", q: "Arabamı ___. (yıkamak, orttirma, oʻtgan, ben)", ans: ["yıkattım"], uz: "Mashinamni yuvdirdim." },
    { t: "t", q: "Evi boyacıya ___. (boyamak, orttirma, oʻtgan, biz)", ans: ["boyattık"], uz: "Uyni boʻyoqchiga boʻyatdik." }
  ],
  "B1.19": [
    { t: "c", q: "Ertaga koʻrishamiz.", o: ["Yarın görüşürüz.", "Yarın görürüz.", "Yarın görünürüz."], a: 0 },
    { t: "c", q: "kiyinmoq", o: ["giyinmek", "giymek", "giydirmek"], a: 0 },
    { t: "c", q: "yuvinmoq", o: ["yıkanmak", "yıkamak", "yıkatmak"], a: 0 },
    { t: "c", q: "tanishmoq", o: ["tanışmak", "tanımak", "tanıtmak"], a: 0 },
    { t: "t", q: "Sabah kalkıp ___. (giyinmek, oʻtgan, ben)", ans: ["giyindim"], uz: "Ertalab turib kiyindim." },
    { t: "t", q: "Dün eski bir arkadaşımla ___. (görüşmek, oʻtgan, ben)", ans: ["görüştüm"], uz: "Kecha eski bir doʻstim bilan koʻrishdim." }
  ],
  "B1.20": [
    { t: "c", q: "«Charchadim» → Charchaganini aytdi.", o: ["Yorgun olduğunu söyledi.", "Yorgun olduğumu söyledi.", "Yorgun olacağını söyledi."], a: 0 },
    { t: "c", q: "«Ertaga kelaman» → Ertaga kelishini aytdi.", o: ["Yarın geleceğini söyledi.", "Yarın geldiğini söyledi.", "Yarın gelmesini söyledi."], a: 0 },
    { t: "c", q: "Direktor majlis ertaga boʻlishini aytdi.", o: ["Müdür toplantının yarın olacağını söyledi.", "Müdür toplantı yarın olacak söyledi.", "Müdür toplantının yarın olmasını söyledi."], a: 0 },
    { t: "c", q: "Ali Ayşe kelganini aytdi.", o: ["Ali, Ayşe'nin geldiğini söyledi.", "Ali, Ayşe geldiğini söyledi.", "Ali, Ayşe'nin geldi söyledi."], a: 0, e: "Gapning egasi qaratqichda keladi: Ayşe'nin." },
    { t: "t", q: "Annem yemeğin hazır ___ söyledi. (olmak, -ganini)", ans: ["olduğunu"], uz: "Onam ovqat tayyor ekanini aytdi." },
    { t: "t", q: "Ahmet yarın İzmir'e ___ söyledi. (gitmek, -ishini)", ans: ["gideceğini"], uz: "Ahmet ertaga Izmirga borishini aytdi." }
  ],
  "B1.21": [
    { t: "c", q: "«Kelasanmi?» → Kelish-kelmasligimni soʻradi.", o: ["Gelip gelmeyeceğimi sordu.", "Gelecek misin sordu.", "Gelmemi sordu."], a: 0 },
    { t: "c", q: "«Qayerda yashaysan?» → Qayerda yashashimni soʻradi.", o: ["Nerede oturduğumu sordu.", "Nerede oturuyorsun sordu.", "Nerede oturmamı sordu."], a: 0 },
    { t: "c", q: "«Soat necha?» → Soat necha boʻlganini soʻradi.", o: ["Saatin kaç olduğunu sordu.", "Saatin kaç oldu sordu.", "Saatin kaç olacağı sordu."], a: 0 },
    { t: "c", q: "sormak feʼlining maʼnosi:", o: ["soʻramoq", "aytmoq", "javob bermoq"], a: 0 },
    { t: "t", q: "Öğretmen ödevi bitirip ___ sordu. (bitirmemek, -ganimni)", ans: ["bitirmediğimi"], uz: "Oʻqituvchi vazifani tugatgan-tugatmaganimni soʻradi." },
    { t: "t", q: "Bana nereye ___ sordu. (gitmek, -ishimni)", ans: ["gideceğimi", "gittiğimi"], uz: "Mendan qayerga borishimni soʻradi." }
  ],
  "B1.22": [
    { t: "c", q: "«Eshikni yop!» → Eshikni yopishimni aytdi.", o: ["Kapıyı kapatmamı söyledi.", "Kapıyı kapattığımı söyledi.", "Kapıyı kapat söyledi."], a: 0 },
    { t: "c", q: "Shifokor koʻp suv ichishimni aytdi.", o: ["Doktor çok su içmemi söyledi.", "Doktor çok su içtiğimi söyledi.", "Doktor çok su içeceğimi söyledi."], a: 0 },
    { t: "c", q: "«Kechikmang!» → Kechikmasligimizni aytdi.", o: ["Geç kalmamamızı söyledi.", "Geç kalmamızı söyledi.", "Geç kalmadığımızı söyledi."], a: 0, e: "kal + ma (inkor) + ma (harakat nomi) + mız + ı." },
    { t: "c", q: "Undan erta kelishini iltimos qildim.", o: ["Ondan erken gelmesini rica ettim.", "Ondan erken geldiğini rica ettim.", "Ona erken gelmesini rica ettim."], a: 0, e: "rica etmek -DAn talab qiladi." },
    { t: "t", q: "Müdür bana raporu ___ söyledi. (bitirmek, -ishimni)", ans: ["bitirmemi"], uz: "Direktor menga hisobotni tugatishimni aytdi." },
    { t: "t", q: "Annem bize sessiz ___ söyledi. (olmak, -ishimizni)", ans: ["olmamızı"], uz: "Onam bizga jim boʻlishimizni aytdi." }
  ],
  "B1.23": [
    { t: "c", q: "menimcha", o: ["bence", "benimce", "bana"], a: 0 },
    { t: "c", q: "Qoʻshilaman.", o: ["Katılıyorum.", "Katılmıyorum.", "Katıldınız."], a: 0 },
    { t: "c", q: "Bu qaror toʻgʻri deb oʻylayman.", o: ["Bu kararın doğru olduğunu düşünüyorum.", "Bu karar doğru olduğunu düşünüyorum.", "Bu kararın doğru olacak düşünüyorum."], a: 0 },
    { t: "c", q: "Haqsan, lekin…", o: ["Haklısın, ama…", "Haksın, ama…", "Hakkın, ama…"], a: 0 },
    { t: "t", q: "Bana ___ bu film çok sıkıcı. (koʻra)", ans: ["göre"], uz: "Menimcha, bu film juda zerikarli." },
    { t: "t", q: "Sana ___. (qoʻshilmayman)", ans: ["katılmıyorum"], uz: "Senga qoʻshilmayman." }
  ],
  "B1.24": [
    { t: "c", q: "Ham ishlayman, ham oʻqiyman.", o: ["Hem çalışıyorum hem de okuyorum.", "Ne çalışıyorum ne de okuyorum.", "Ya çalışıyorum ya da okuyorum."], a: 0 },
    { t: "c", q: "Na choy, na qahva ichaman.", o: ["Ne çay ne kahve içiyorum.", "Ne çay ne kahve içmiyorum.", "Hem çay hem kahve içmiyorum."], a: 0, e: "ne … ne bilan feʼl boʻlishli turadi." },
    { t: "c", q: "Yo bugun, yo ertaga kelaman.", o: ["Ya bugün ya da yarın geleceğim.", "Ne bugün ne de yarın geleceğim.", "Hem bugün hem de yarın geleceğim."], a: 0 },
    { t: "c", q: "xoh … xoh", o: ["ister … ister", "hem … hem", "ne … ne"], a: 0 },
    { t: "t", q: "___ Türkçe hem İngilizce biliyor. (ham)", ans: ["hem"], uz: "Ham turkcha, ham inglizcha biladi." },
    { t: "o", s: "Ne çay ne kahve içiyorum", uz: "Na choy, na qahva ichaman." }
  ],
  "B1.25": [
    { t: "c", q: "masalan", o: ["örneğin", "ayrıca", "ancak"], a: 0 },
    { t: "c", q: "shuning uchun", o: ["bu yüzden", "yani", "oysa"], a: 0 },
    { t: "c", q: "bundan tashqari", o: ["ayrıca", "fakat", "örneğin"], a: 0 },
    { t: "c", q: "Hava soğuktu, ___ evde kaldık.", o: ["bu yüzden", "ayrıca", "örneğin"], a: 0, uz: "Havo sovuq edi, shuning uchun uyda qoldik." },
    { t: "t", q: "Çok yorgunum, ___ yarın işe gideceğim. (biroq)", ans: ["ancak", "fakat", "ama"], uz: "Juda charchadim, biroq ertaga ishga boraman." },
    { t: "t", q: "___ olarak, bu proje çok başarılı. (xulosa)", ans: ["sonuç"], uz: "Xulosa qilib aytganda, bu loyiha juda muvaffaqiyatli." }
  ],
  "B1.26": [
    { t: "c", q: "Film boshlanay deb turibdi.", o: ["Film başlamak üzere.", "Film başladı.", "Film başlamak için."], a: 0 },
    { t: "c", q: "Chiqay deb turibman.", o: ["Çıkmak üzereyim.", "Çıkmak üzerim.", "Çıkmaya üzereyim."], a: 0 },
    { t: "c", q: "Poyezd joʻnay deb turgan edi.", o: ["Tren kalkmak üzereydi.", "Tren kalkmak üzere.", "Tren kalkmıştı."], a: 0 },
    { t: "c", q: "Yomgʻir yogʻay deb turibdi.", o: ["Yağmur yağmak üzere.", "Yağmur yağmaya üzere.", "Yağmur yağmak üzereyim."], a: 0 },
    { t: "t", q: "Acele et, otobüs kalkmak ___! (arafasida)", ans: ["üzere"], uz: "Shoshil, avtobus joʻnay deb turibdi!" },
    { t: "t", q: "Ben de tam seni ___ üzereydim. (aramak)", ans: ["aramak"], uz: "Men ham aynan senga qoʻngʻiroq qilay deb turgan edim." }
  ],
  "B1.27": [
    { t: "c", q: "Menga berib yubor!", o: ["Bana veriver!", "Bana verever!", "Bana veriber!"], a: 0 },
    { t: "c", q: "açmak → ochib yubor", o: ["açıver", "açiver", "açuver"], a: 0 },
    { t: "c", q: "bakmak → bir qarab qoʻy", o: ["bakıver", "bakever", "bakuver"], a: 0 },
    { t: "c", q: "Kutilmaganda kelib qoldi.", o: ["Geliverdi.", "Gelivermek.", "Gelverdi."], a: 0 },
    { t: "t", q: "Şu kapıyı ___ misin? (açmak, -ib yuborasanmi)", ans: ["açıverir"], uz: "Anavi eshikni ochib yuborasanmi?" },
    { t: "t", q: "Bir dakika ___! (bakmak, -ib qoʻy)", ans: ["bakıver"], uz: "Bir daqiqa qarab qoʻy!" }
  ]
});

// B2 mashqlari (B2.01–B2.23).
Object.assign(BX, {
  "B2.01": [
    { t: "c", q: "Chekish sogʻliqqa zarar.", o: ["Sigara içmek sağlığa zararlı.", "Sigara içme sağlığa zararlı.", "Sigara içiş sağlığa zararlı."], a: 0, e: "Umumiy harakat — -mAk." },
    { t: "c", q: "Kelishingiz muhim.", o: ["Gelmeniz önemli.", "Gelmek önemli.", "Gelmekiniz önemli."], a: 0, e: "Kimning ishi ekani muhim — -mA + egalik." },
    { t: "c", q: "kirish (eshik ustidagi yozuv)", o: ["giriş", "girme", "girmek"], a: 0 },
    { t: "c", q: "Sayr qildik.", o: ["Yürüyüş yaptık.", "Yürümek yaptık.", "Yürüme yaptık."], a: 0 },
    { t: "t", q: "Türkçe ___ zor değil. (öğrenmek, umumiy)", ans: ["öğrenmek"], uz: "Turkcha oʻrganish qiyin emas." },
    { t: "t", q: "Senin ___ çok sevindim. (gelmek, -ishingga)", ans: ["gelmene"], uz: "Kelganingga juda xursand boʻldim.", e: "sevinmek -(y)A talab qiladi." }
  ],
  "B2.02": [
    { t: "c", q: "Gitara chalishni boshladim.", o: ["Gitar çalmaya başladım.", "Gitar çalmayı başladım.", "Gitar çalmaktan başladım."], a: 0, e: "başlamak -(y)A talab qiladi." },
    { t: "c", q: "Uchishdan qoʻrqaman.", o: ["Uçmaktan korkarım.", "Uçmaya korkarım.", "Uçmayı korkarım."], a: 0, e: "korkmak -DAn talab qiladi." },
    { t: "c", q: "Kitob oʻqishni yaxshi koʻraman.", o: ["Kitap okumayı severim.", "Kitap okumaya severim.", "Kitap okumaktan severim."], a: 0, e: "sevmek -(y)I talab qiladi." },
    { t: "c", q: "Chekishdan voz kechdi.", o: ["Sigara içmekten vazgeçti.", "Sigara içmeyi vazgeçti.", "Sigara içmeye vazgeçti."], a: 0 },
    { t: "t", q: "Kapıyı ___ unuttum. (kilitlemek)", ans: ["kilitlemeyi"], uz: "Eshikni qulflashni unutdim." },
    { t: "t", q: "Erken ___ alıştım. (kalkmak)", ans: ["kalkmaya"], uz: "Erta turishga oʻrgandim." }
  ],
  "B2.03": [
    { t: "c", q: "Men kelganimda u ketgan edi.", o: ["Ben geldiğimde o gitmişti.", "Ben geldiğimde o gitti.", "Ben geldiğimde o gidiyordu."], a: 0 },
    { t: "c", q: "gelmek, ben → kelgan edim", o: ["gelmiştim", "gelmişdim", "gelmiştım"], a: 0, e: "ş jarangsiz → -tı/-ti." },
    { t: "c", q: "okumak, biz → oʻqigan edik", o: ["okumuştuk", "okumuşduk", "okumıştık"], a: 0 },
    { t: "c", q: "koʻrmagan edim", o: ["görmemiştim", "görmedim", "görmemişim"], a: 0 },
    { t: "t", q: "Biz vardığımızda film ___. (başlamak, -gan edi)", ans: ["başlamıştı"], uz: "Biz yetib borganimizda film boshlangan edi." },
    { t: "t", q: "Bu kitabı daha önce ___. (okumak, ben, -gan edim)", ans: ["okumuştum"], uz: "Bu kitobni oldin oʻqigan edim." }
  ],
  "B2.04": [
    { t: "c", q: "Senga yozmoqchi edim, lekin unutdim.", o: ["Sana yazacaktım ama unuttum.", "Sana yazdım ama unuttum.", "Sana yazıyordum ama unuttum."], a: 0 },
    { t: "c", q: "gitmek, biz → bormoqchi edik", o: ["gidecektik", "gidecekdik", "gitecektik"], a: 0, e: "Unlidan oldin t → d; k jarangsiz → -tik." },
    { t: "c", q: "aramak, ben → qoʻngʻiroq qilmoqchi edim", o: ["arayacaktım", "arıyacaktım", "arayacakdım"], a: 0 },
    { t: "c", q: "U kelmoqchi edi.", o: ["O gelecekti.", "O gelecek.", "O gelirdi."], a: 0 },
    { t: "t", q: "Dün sinemaya ___ ama yağmur yağdı. (gitmek, biz)", ans: ["gidecektik"], uz: "Kecha kinoga bormoqchi edik, lekin yomgʻir yogʻdi." },
    { t: "t", q: "Sana ___ ama unuttum. (söylemek, -moqchi edim)", ans: ["söyleyecektim"], uz: "Senga aytmoqchi edim, lekin unutdim." }
  ],
  "B2.05": [
    { t: "c", q: "Bolaligimda har yozi qishloqqa borar edik.", o: ["Çocukken her yaz köye giderdik.", "Çocukken her yaz köye gidecektik.", "Çocukken her yaz köye gitmiştik."], a: 0 },
    { t: "c", q: "okumak, ben → oʻqir edim", o: ["okurdum", "okuyurdum", "okurdım"], a: 0 },
    { t: "c", q: "ichmas edi", o: ["içmezdi", "içmedi", "içmemişti"], a: 0 },
    { t: "c", q: "Bobom har kechqurun ertak aytib berar edi.", o: ["Dedem her akşam masal anlatırdı.", "Dedem her akşam masal anlattı.", "Dedem her akşam masal anlatacaktı."], a: 0 },
    { t: "t", q: "Eskiden çok kitap ___. (okumak, ben)", ans: ["okurdum"], uz: "Ilgari koʻp kitob oʻqir edim." },
    { t: "t", q: "Babam sigara ___. (içmek, boʻlishsiz, odat)", ans: ["içmezdi"], uz: "Otam chekmas edi." }
  ],
  "B2.06": [
    { t: "c", q: "Ertaroq turishim kerak edi.", o: ["Daha erken kalkmalıydım.", "Daha erken kalkmalıyım.", "Daha erken kalkacaktım."], a: 0 },
    { t: "c", q: "Shifokorga oldinroq borishing kerak edi.", o: ["Doktora daha önce gitmeliydin.", "Doktora daha önce gitmelisin.", "Doktora daha önce gidecektin."], a: 0 },
    { t: "c", q: "gelmek, siz → kelishingiz kerak edi", o: ["gelmeliydiniz", "gelmelidiniz", "gelmeliydinız"], a: 0 },
    { t: "c", q: "Aytmasligim kerak edi.", o: ["Söylememeliydim.", "Söylemeliydim.", "Söyleyemedim."], a: 0 },
    { t: "t", q: "Bu kadar çok ___. (yemek, boʻlishsiz, ben, kerak edi)", ans: ["yememeliydim"], uz: "Bunchalik koʻp yemasligim kerak edi." },
    { t: "t", q: "Bana daha önce ___. (söylemek, sen, kerak edi)", ans: ["söylemeliydin"], uz: "Menga oldinroq aytishing kerak edi." }
  ],
  "B2.07": [
    { t: "c", q: "Bilganimda aytgan boʻlardim.", o: ["Bilseydim söylerdim.", "Bilirsem söylerim.", "Bilsem söyledim."], a: 0 },
    { t: "c", q: "Erta turganimda avtobusdan qolmagan boʻlardim.", o: ["Erken kalksaydım otobüsü kaçırmazdım.", "Erken kalkarsam otobüsü kaçırmam.", "Erken kalktım otobüsü kaçırmadım."], a: 0 },
    { t: "c", q: "gelmek, sen → kelganingda edi", o: ["gelseydin", "gelirseydin", "gelseydın"], a: 0 },
    { t: "c", q: "Pulim boʻlganida mashina olgan boʻlardim.", o: ["Param olsaydı araba alırdım.", "Param olsa araba aldım.", "Param olursa araba alırdım."], a: 0 },
    { t: "t", q: "Zamanım ___ sana yardım ederdim. (olmak, -ganida edi)", ans: ["olsaydı"], uz: "Vaqtim boʻlganida senga yordam bergan boʻlardim." },
    { t: "t", q: "Sen gelseydin çok ___. (sevinmek, ben, -ar edim)", ans: ["sevinirdim"], uz: "Sen kelganingda juda xursand boʻlardim." }
  ],
  "B2.08": [
    { t: "c", q: "Qani endi kelganingda edi!", o: ["Keşke gelseydin!", "Keşke gelirsin!", "Keşke geldin!"], a: 0 },
    { t: "c", q: "Qani endi koʻproq oʻqiganimda edi.", o: ["Keşke daha çok çalışsaydım.", "Keşke daha çok çalışırım.", "Keşke daha çok çalıştım."], a: 0 },
    { t: "c", q: "Hozirgi istak qaysi?", o: ["Keşke gelsen.", "Keşke gelseydin."], a: 0, e: "keşke + -sA — hozir; keşke + -sAydI — oʻtmishdagi afsus." },
    { t: "c", q: "Oʻtmishdagi afsus qaysi?", o: ["Keşke gelseydin.", "Keşke gelsen."], a: 0 },
    { t: "t", q: "Keşke o gün sen de orada ___. (olmak, sen)", ans: ["olsaydın"], uz: "Qani endi oʻsha kuni sen ham u yerda boʻlganingda edi." },
    { t: "t", q: "Keşke ona ___. (söylememek, ben)", ans: ["söylemeseydim"], uz: "Qani endi unga aytmaganimda edi." }
  ],
  "B2.09": [
    { t: "c", q: "Charchagan boʻlsa kerak.", o: ["Yorgundur.", "Yorgun.", "Yorgundu."], a: 0, e: "Ot va sifatdan keyin -DIr kuchli taxminni bildiradi." },
    { t: "c", q: "Unutgan boʻlishi mumkin.", o: ["Unutmuş olabilir.", "Unutmuş olmalı.", "Unutabilir."], a: 0, e: "olabilir — ehtimol; olmalı — katta ehtimol." },
    { t: "c", q: "Uxlayotgan boʻlsa kerak.", o: ["Uyuyor olmalı.", "Uyumalı.", "Uyuyor olsun."], a: 0, e: "Yolgʻiz -mAlI — majburiyat; -(I)yor olmalı — taxmin." },
    { t: "c", q: "Uyda boʻlsa kerak.", o: ["Evde olsa gerek.", "Evde olmak gerek.", "Evde olsun gerek."], a: 0 },
    { t: "t", q: "Herhalde yolu ___ olmalı. (kaybetmek, -gan)", ans: ["kaybetmiş"], uz: "Ehtimol, yoʻlni adashtirgan boʻlsa kerak." },
    { t: "t", q: "___ yarın yağmur yağacak. (ehtimol)", ans: ["herhalde", "galiba"], uz: "Ehtimol, ertaga yomgʻir yogʻadi." }
  ],
  "B2.10": [
    { t: "c", q: "Toʻlov qilinmagan taqdirda obuna bekor qilinadi.", o: ["Ödeme yapılmadığı takdirde abonelik iptal edilir.", "Ödeme yapılmazsa takdirde abonelik iptal edilir.", "Ödeme yapılmadığı için abonelik iptal edilir."], a: 0 },
    { t: "c", q: "-DIğI takdirde qaysi uslubga xos?", o: ["Rasmiy", "Soʻzlashuv", "Sheʼriy"], a: 0 },
    { t: "c", q: "yongʻin chiqqan holda", o: ["yangın çıkması hâlinde", "yangın çıkması hâlde", "yangın çıktığı hâlde"], a: 0, e: "-DIğI hâlde — zidlik maʼnosida (B2.12)." },
    { t: "c", q: "kelmagan taqdiringizda", o: ["gelmediğiniz takdirde", "gelmediğin takdirde", "gelmemeniz takdirde"], a: 0 },
    { t: "t", q: "Kurallara ___ takdirde ceza alırsınız. (uymamak, siz)", ans: ["uymadığınız"], uz: "Qoidalarga rioya qilmagan taqdiringizda jarima olasiz." },
    { t: "t", q: "Bir sorun ___ takdirde bize yazın. (olmak)", ans: ["olduğu"], uz: "Muammo boʻlgan taqdirda bizga yozing." }
  ],
  "B2.11": [
    { t: "c", q: "Kasal boʻlishiga qaramay ishga keldi.", o: ["Hasta olmasına rağmen işe geldi.", "Hasta olduğu için işe geldi.", "Hasta olmasına için işe geldi."], a: 0 },
    { t: "c", q: "charchaganimga qaramay", o: ["yorgun olmama rağmen", "yorgun olmamı rağmen", "yorgun olduğum rağmen"], a: 0 },
    { t: "c", q: "sovuqqa qaramay", o: ["soğuğa rağmen", "soğuktan rağmen", "soğuğu rağmen"], a: 0, e: "rağmen oldidagi ot -(y)A oladi." },
    { t: "c", q: "hamma narsaga qaramay", o: ["her şeye rağmen", "her şeyden rağmen", "her şey rağmen"], a: 0 },
    { t: "t", q: "Yağmur ___ rağmen maç oynandı. (yağmak)", ans: ["yağmasına"], uz: "Yomgʻir yogʻishiga qaramay oʻyin oʻtkazildi." },
    { t: "t", q: "Çok ___ rağmen sınavı geçemedi. (çalışmak, o)", ans: ["çalışmasına"], uz: "Koʻp oʻqishiga qaramay imtihondan oʻta olmadi." }
  ],
  "B2.12": [
    { t: "c", q: "Vaqtni bilgan boʻlsa-da kechikdi.", o: ["Saati bildiği hâlde geç kaldı.", "Saati bildiği için geç kaldı.", "Saati bilirken geç kaldı."], a: 0 },
    { t: "c", q: "Vaʼda bergan boʻlsang-da kelmading.", o: ["Söz verdiğin hâlde gelmedin.", "Söz verdiğim hâlde gelmedin.", "Söz vermen hâlde gelmedin."], a: 0 },
    { t: "c", q: "-DIğI hâlde qanday maʼno beradi?", o: ["Zidlik", "Sabab", "Maqsad"], a: 0 },
    { t: "c", q: "Och boʻlsak-da ovqat yemadik.", o: ["Aç olduğumuz hâlde yemek yemedik.", "Aç olduğumuz için yemek yemedik.", "Aç olmamız hâlde yemek yemedik."], a: 0 },
    { t: "t", q: "Cevabı ___ hâlde söylemedi. (bilmek, o)", ans: ["bildiği"], uz: "Javobni bilgan boʻlsa-da aytmadi." },
    { t: "t", q: "Param ___ hâlde bir şey almadım. (olmak)", ans: ["olduğu"], uz: "Pulim boʻlsa-da hech narsa olmadim." }
  ],
  "B2.13": [
    { t: "c", q: "Yomgʻir yogʻsa ham sayrga chiqamiz.", o: ["Yağmur yağsa bile yürüyüşe çıkarız.", "Yağmur yağarsa yürüyüşe çıkarız.", "Yağmur yağdığı için yürüyüşe çıkarız."], a: 0 },
    { t: "c", q: "Qimmat boʻlsa ham olaman.", o: ["Pahalı olsa da alacağım.", "Pahalı olsa ta alacağım.", "Pahalı olursa alacağım."], a: 0, e: "da hech qachon ta boʻlmaydi." },
    { t: "c", q: "nima qilsam ham", o: ["ne yapsam da", "ne yapsam de", "ne yaparsam"], a: 0 },
    { t: "c", q: "kelsa ham", o: ["gelse de", "gelse da", "gelse te"], a: 0 },
    { t: "t", q: "Çok yorgun ___ bile çalışmaya devam etti. (olmak)", ans: ["olsa"], uz: "Juda charchagan boʻlsa ham ishlashda davom etdi." },
    { t: "t", q: "Sen gelmesen ___ biz gideceğiz. (ham)", ans: ["de", "bile"], uz: "Sen kelmasang ham biz boramiz." }
  ],
  "B2.14": [
    { t: "c", q: "Hamma keldi, holbuki sen kelmading.", o: ["Herkes geldi, oysa sen gelmedin.", "Herkes geldi, çünkü sen gelmedin.", "Herkes geldi, yani sen gelmedin."], a: 0 },
    { t: "c", q: "Ali choyni yaxshi koʻrsa, Ayşe qahvani yaxshi koʻradi.", o: ["Ali çay severken Ayşe kahve sever.", "Ali çay severse Ayşe kahve sever.", "Ali çay sevince Ayşe kahve sever."], a: 0 },
    { t: "c", q: "oysa soʻzining sinonimi:", o: ["hâlbuki", "çünkü", "örneğin"], a: 0 },
    { t: "c", q: "Sen dam olyapsan, men esa ishlayapman.", o: ["Sen dinleniyorsun, oysa ben çalışıyorum.", "Sen dinleniyorsun, çünkü ben çalışıyorum.", "Sen dinleniyorsun, ayrıca ben çalışıyorum."], a: 0 },
    { t: "t", q: "Herkes onu zengin sanıyor, ___ hiç parası yok. (holbuki)", ans: ["oysa", "hâlbuki", "halbuki"], uz: "Hamma uni boy deb oʻylaydi, holbuki uning umuman puli yoʻq." },
    { t: "t", q: "Kardeşim ___ ben uzunum. (kısa, -ken)", ans: ["kısayken"], uz: "Ukam past boʻyli boʻlsa, men baland boʻyliman." }
  ],
  "B2.15": [
    { t: "c", q: "Uyda oʻtirgandan koʻra parkka boraylik.", o: ["Evde oturmaktansa parka gidelim.", "Evde oturmaktan parka gidelim.", "Evde oturarak parka gidelim."], a: 0 },
    { t: "c", q: "Dars qilish oʻrniga oʻyin oʻynadi.", o: ["Ders çalışacağına oyun oynadı.", "Ders çalışacak oyun oynadı.", "Ders çalışarak oyun oynadı."], a: 0 },
    { t: "c", q: "-mAktAnsA nimani bildiradi?", o: ["Afzal koʻrish", "Sabab", "Vaqt"], a: 0 },
    { t: "c", q: "Yolgʻon gapirgandan koʻra jim tur.", o: ["Yalan söylemektense sus.", "Yalan söylemektensa sus.", "Yalan söylemekten sus."], a: 0, e: "Ikki xil: -maktansa / -mektense." },
    { t: "t", q: "Taksiye ___ yürüyelim. (binmek, -gandan koʻra)", ans: ["binmektense"], uz: "Taksiga mingandan koʻra piyoda yuraylik." },
    { t: "t", q: "Yardım ___ bizi izledi. (etmek, -ish oʻrniga)", ans: ["edeceğine"], uz: "Yordam berish oʻrniga bizni kuzatib turdi." }
  ],
  "B2.16": [
    { t: "c", q: "Hamma narsani biladigandek gapiryapti.", o: ["Her şeyi bilircesine konuşuyor.", "Her şeyi bildiği için konuşuyor.", "Her şeyi bilerek konuşuyor."], a: 0 },
    { t: "c", q: "uçmak → uchayotgandek", o: ["uçarcasına", "uçarcesine", "uçercasına"], a: 0 },
    { t: "c", q: "görmek (-mIş) → koʻrgandek", o: ["görmüşçesine", "görmüşcesine", "görmüşçasına"], a: 0, e: "ş jarangsiz → -çesine." },
    { t: "c", q: "-cAsInA qaysi uslubga xos?", o: ["Adabiy", "Soʻzlashuv", "Rasmiy hujjat"], a: 0 },
    { t: "t", q: "Araba ___ hızla geçti. (uçmak, -ayotgandek)", ans: ["uçarcasına"], uz: "Mashina uchayotgandek tez oʻtdi." },
    { t: "t", q: "Beni hiç ___ yanımdan geçti. (tanımamak, -mIş + -cAsInA)", ans: ["tanımamışçasına", "tanımıyormuşçasına"], uz: "Meni umuman tanimagandek yonimdan oʻtdi." }
  ],
  "B2.17": [
    { t: "c", q: "Men kelgunimcha shu yerda kut.", o: ["Ben gelene kadar burada bekle.", "Ben gelince burada bekle.", "Ben gelirken burada bekle."], a: 0 },
    { t: "c", q: "tugaguncha", o: ["bitene kadar", "bitince kadar", "biterken kadar"], a: 0 },
    { t: "c", q: "tong otguncha", o: ["sabah olana kadar", "sabah olunca kadar", "sabah olurken kadar"], a: 0 },
    { t: "c", q: "gelmek → kelguncha (kitobiy shakl)", o: ["gelinceye kadar", "gelinçeye kadar", "gelinceya kadar"], a: 0 },
    { t: "t", q: "Yağmur ___ kadar evde kaldık. (durmak)", ans: ["durana", "duruncaya"], uz: "Yomgʻir toʻxtaguncha uyda qoldik." },
    { t: "t", q: "Film ___ kadar konuşmayın. (bitmek)", ans: ["bitene", "bitinceye"], uz: "Film tugaguncha gaplashmang." }
  ],
  "B2.18": [
    { t: "c", q: "Toʻxtovsiz ishladi.", o: ["Hiç durmaksızın çalıştı.", "Hiç durmaksızın çalışmadı.", "Hiç durarak çalıştı."], a: 0 },
    { t: "c", q: "ruxsat olmasdan (rasmiy)", o: ["izin almaksızın", "izin almaksız", "izin alarak"], a: 0 },
    { t: "c", q: "-mAksIzIn qaysi shaklning rasmiy muqobili?", o: ["-mAdAn", "-(y)ArAk", "-(y)Ip"], a: 0 },
    { t: "c", q: "düşünmek → oʻylamasdan", o: ["düşünmeksizin", "düşünmaksızın", "düşünmeksizın"], a: 0 },
    { t: "t", q: "Kimseye ___ evden çıktı. (söylemek, -masdan, rasmiy)", ans: ["söylemeksizin"], uz: "Hech kimga aytmasdan uydan chiqdi." },
    { t: "t", q: "Öğrenciler izin ___ sınıftan çıkmamalı. (almak)", ans: ["almaksızın", "almadan"], uz: "Oʻquvchilar ruxsat olmasdan sinfdan chiqmasligi kerak." }
  ],
  "B2.19": [
    { t: "c", q: "Shahar aholisi har yili oʻsmoqda.", o: ["Şehrin nüfusu her yıl artmaktadır.", "Şehrin nüfusu her yıl artmaktır.", "Şehrin nüfusu her yıl artmaktedir."], a: 0 },
    { t: "c", q: "-mAktAdIr qaysi uslubga xos?", o: ["Rasmiy, ilmiy", "Soʻzlashuv", "Bolalar nutqi"], a: 0 },
    { t: "c", q: "çalışmak → ishlamoqda", o: ["çalışmaktadır", "çalışmaktedir", "çalışmakdadır"], a: 0 },
    { t: "c", q: "devam etmek → davom etmoqda", o: ["devam etmektedir", "devam etmaktadır", "devam etmekdedir"], a: 0 },
    { t: "t", q: "Fiyatlar her gün ___. (artmak, rasmiy)", ans: ["artmaktadır", "artmakta"], uz: "Narxlar har kuni oshmoqda." },
    { t: "t", q: "Çalışmalar hâlâ devam ___. (etmek, rasmiy)", ans: ["etmektedir", "etmekte"], uz: "Ishlar hamon davom etmoqda." }
  ],
  "B2.20": [
    { t: "c", q: "Kutubxona 1990-yilda tashkil etilgan.", o: ["Kütüphane 1990 yılında kurulmuştur.", "Kütüphane 1990 yılında kurmuştur.", "Kütüphane 1990 yılında kurulmaktır."], a: 0 },
    { t: "c", q: "Majlis oʻtkazildi (rasmiy).", o: ["Toplantı yapılmıştır.", "Toplantı yapmıştır.", "Toplantı yapılmaktır."], a: 0 },
    { t: "c", q: "Suv hayotdir.", o: ["Su hayattır.", "Su hayatdır.", "Su hayattir."], a: 0, e: "t jarangsiz → -tır." },
    { t: "c", q: "Bu juda muhimdir.", o: ["Bu çok önemlidir.", "Bu çok önemlitir.", "Bu çok önemlidır."], a: 0 },
    { t: "t", q: "Proje başarıyla ___. (tamamlanmak, rasmiy oʻtgan)", ans: ["tamamlanmıştır"], uz: "Loyiha muvaffaqiyatli yakunlandi." },
    { t: "t", q: "Sağlık her şeyden ___. (önemli, -dir)", ans: ["önemlidir"], uz: "Sogʻliq hamma narsadan muhimdir." }
  ],
  "B2.21": [
    { t: "c", q: "… doirasida", o: ["kapsamında", "nedeniyle", "itibarıyla"], a: 0 },
    { t: "c", q: "Maʼlumotingiz uchun.", o: ["Bilgilerinize sunarım.", "Gereğini arz ederim.", "Saygılarımla."], a: 0 },
    { t: "c", q: "Tegishli choralar koʻrilishini soʻrayman.", o: ["Gereğini arz ederim.", "Bilgilerinize sunarım.", "Kolay gelsin."], a: 0 },
    { t: "c", q: "1-yanvardan boshlab", o: ["1 Ocak itibarıyla", "1 Ocak kapsamında", "1 Ocak nedeniyle"], a: 0 },
    { t: "t", q: "Proje ___ yeni bir okul açıldı. (doirasida)", ans: ["kapsamında"], uz: "Loyiha doirasida yangi maktab ochildi." },
    { t: "t", q: "Kötü hava ___ uçuşlar iptal edildi. (sababli)", ans: ["nedeniyle"], uz: "Yomon havo sababli parvozlar bekor qilindi." }
  ],
  "B2.22": [
    { t: "c", q: "maʼlum qildi, eʼlon qildi", o: ["açıkladı", "vurguladı", "öne sürdü"], a: 0 },
    { t: "c", q: "taʼkidladi", o: ["vurguladı", "kaydetti", "açıkladı"], a: 0 },
    { t: "c", q: "ilgari surdi", o: ["öne sürdü", "belirtti", "ifade etti"], a: 0 },
    { t: "c", q: "Direktor bino yil oxirida bitishini maʼlum qildi.", o: ["Müdür, binanın yıl sonunda biteceğini açıkladı.", "Müdür, bina yıl sonunda bitecek açıkladı.", "Müdür, binanın yıl sonunda bitmesini açıkladı."], a: 0 },
    { t: "t", q: "Bakan, projenin önemli olduğunu ___. (vurgulamak, oʻtgan)", ans: ["vurguladı"], uz: "Vazir loyiha muhim ekanini taʼkidladi." },
    { t: "t", q: "Uzmanlar fiyatların ___ belirtti. (artmak, -ishini)", ans: ["artacağını"], uz: "Mutaxassislar narxlar oshishini koʻrsatib oʻtdi." }
  ],
  "B2.23": [
    { t: "c", q: "koʻz yugurtirmoq", o: ["göz atmak", "göz koymak", "göz açmak"], a: 0 },
    { t: "c", q: "quloq solmoq", o: ["kulak vermek", "kulak almak", "kulak atmak"], a: 0 },
    { t: "c", q: "qoʻli ochiq (saxiy)", o: ["eli açık", "eli sıkı", "ağzı açık"], a: 0 },
    { t: "c", q: "Tomchi-tomchi koʻl boʻlur.", o: ["Damlaya damlaya göl olur.", "Damla damla göl olur.", "Damlaya damlaya deniz olur."], a: 0 },
    { t: "t", q: "Rapora bir göz ___ mısınız? (atmak)", ans: ["atar"], uz: "Hisobotga bir koʻz yugurtirasizmi?" },
    { t: "t", q: "Ali ağzı ___ biridir, ona güvenebilirsin. (sir saqlaydigan)", ans: ["sıkı"], uz: "Ali sir saqlaydigan odam, unga ishonsang boʻladi." }
  ]
});

// Qoʻshimcha mavzular mashqlari (2026-11)
Object.assign(BX, {
  "A1.34": [
    { t: "c", q: "Men ham talabaman.", o: ["Ben de öğrenciyim.", "Bende öğrenciyim.", "Ben te öğrenciyim."], a: 0 },
    { t: "c", q: "Kitob stolda. (joy)", o: ["Kitap masada.", "Kitap masa da.", "Kitap masa ta."], a: 0 },
    { t: "t", q: "Annem ___ gelecek. (ham)", ans: ["de"], uz: "Onam ham keladi." },
    { t: "t", q: "Arkadaşım ___ çok yorgun. (ham)", ans: ["da"], uz: "Doʻstim ham juda charchagan.", e: "Oxirgi unli a — da." },
    { t: "c", q: "Ham choy, ham kofe ichdik.", o: ["Çay da kahve de içtik.", "Çayda kahvede içtik.", "Çay ta kahve te içtik."], a: 0 },
    { t: "o", s: "Biz de sinemaya gidiyoruz", uz: "Biz ham kinoga ketyapmiz." }
  ],
  "A2.30": [
    { t: "c", q: "Men baʼzan kinoga boraman.", o: ["Bazen sinemaya giderim.", "Hiç sinemaya giderim.", "Her zaman sinemaya gitmem."], a: 0 },
    { t: "c", q: "U hech qachon kechikmaydi.", o: ["O hiç geç kalmaz.", "O hiç geç kalır.", "O sık sık geç kalmaz."], a: 0 },
    { t: "t", q: "Ben ___ spor yaparım, haftada dört gün. (tez-tez)", ans: ["sık sık"], uz: "Men tez-tez sport bilan shugʻullanaman, haftasiga toʻrt kun." },
    { t: "t", q: "Kardeşim ___ kitap okur, belki ayda bir. (kamdan-kam)", ans: ["nadiren"], uz: "Ukam kamdan-kam kitob oʻqiydi, balki oyda bir marta." },
    { t: "c", q: "kuniga uch marta", o: ["günde üç kez", "günü üç kez", "gün üç kezde"], a: 0 },
    { t: "o", s: "Her sabah erken kalkarım", uz: "Har tong erta turaman." }
  ],
  "A2.31": [
    { t: "c", q: "Yomgʻir yogʻa boshladi.", o: ["Yağmur yağmaya başladı.", "Yağmur yağmayı başladı.", "Yağmur yağmakta başladı."], a: 0 },
    { t: "c", q: "Men suzishni yaxshi koʻraman.", o: ["Yüzmeyi severim.", "Yüzmeye severim.", "Yüzmekte severim."], a: 0 },
    { t: "t", q: "Kapıyı ___ unuttum. (kilitlemek)", ans: ["kilitlemeyi"], uz: "Eshikni qulflashni unutdim." },
    { t: "t", q: "Yeni bir eve ___ karar verdik. (taşınmak)", ans: ["taşınmaya"], uz: "Yangi uyga koʻchishga qaror qildik." },
    { t: "t", q: "Babam sigara ___ bıraktı. (içmek)", ans: ["içmeyi"], uz: "Otam chekishni tashladi." },
    { t: "o", s: "Ders çalışmaya devam ediyorum", uz: "Dars qilishni davom ettiryapman." }
  ],
  "B1.28": [
    { t: "c", q: "Sening kelishingni xohlayman.", o: ["Gelmeni istiyorum.", "Gelmek istiyorum.", "Gelmenin istiyorum."], a: 0 },
    { t: "c", q: "Ertaga kelishimiz kerak.", o: ["Yarın gelmemiz gerek.", "Yarın gelmemizi gerek.", "Yarın gelmeğimiz gerek."], a: 0 },
    { t: "t", q: "Öğretmen ödevi ___ istiyor. (bitirmek, biz)", ans: ["bitirmemizi"], uz: "Oʻqituvchi uy vazifasini tugatishimizni xohlaydi." },
    { t: "t", q: "Doktor çok su ___ söyledi. (içmek, ben)", ans: ["içmemi"], uz: "Shifokor koʻp suv ichishimni aytdi." },
    { t: "t", q: "Biraz ___ rica ediyorum. (beklemek, siz)", ans: ["beklemenizi"], uz: "Biroz kutishingizni soʻrayman." },
    { t: "o", s: "Kardeşimin erken gelmesini istiyorum", uz: "Ukamning erta kelishini xohlayman." }
  ],
  "B1.29": [
    { t: "c", q: "Xohlaganingcha ye.", o: ["İstediğin kadar ye.", "İstediğinden kadar ye.", "İsteyen kadar ye."], a: 0 },
    { t: "c", q: "Aytganimdek, avtobus kechikdi.", o: ["Söylediğim gibi, otobüs gecikti.", "Söylediğim kadar, otobüs gecikti.", "Söylemek gibi, otobüs gecikti."], a: 0 },
    { t: "t", q: "Elimden ___ kadar yardım ederim. (gelmek)", ans: ["geldiği"], uz: "Qoʻlimdan kelgancha yordam beraman." },
    { t: "t", q: "Tahmin ___ gibi, sınav çok zordu. (etmek, ben)", ans: ["ettiğim"], uz: "Taxmin qilganimdek, imtihon juda qiyin edi." },
    { t: "t", q: "___ kadar, müze pazartesi kapalı. (bilmek, ben)", ans: ["Bildiğim", "bildiğim"], uz: "Bilishimcha, muzey dushanba kuni yopiq." },
    { t: "o", s: "Her şey planladığımız gibi gitti", uz: "Hammasi rejalashtirganimizdek ketdi." }
  ],
  "B2.24": [
    { t: "c", q: "Menga ishonar ekansan, hammasi yaxshi boʻladi.", o: ["Bana güvendiğin sürece her şey iyi olacak.", "Bana güvenmedikçe her şey iyi olacak.", "Bana güvenmek sürece her şey iyi olacak."], a: 0 },
    { t: "c", q: "Bilet olmaguningizcha kira olmaysiz.", o: ["Bilet almadıkça giremezsiniz.", "Bilet aldıkça giremezsiniz.", "Bilet almadıkçanız giremezsiniz."], a: 0 },
    { t: "t", q: "Sağlıklı ___ sürece hasta olmazsın. (beslenmek)", ans: ["beslendiğin"], uz: "Sogʻlom ovqatlanar ekansan, kasal boʻlmaysan." },
    { t: "t", q: "Doktor izin ___ spor yapma. (vermek, inkor)", ans: ["vermedikçe"], uz: "Shifokor ruxsat bermaguncha sport bilan shugʻullanma." },
    { t: "t", q: "Hep birlikte ___ sürece bu proje bitmez. (çalışmak, inkor, biz)", ans: ["çalışmadığımız"], uz: "Hammamiz birga ishlamas ekanmiz, bu loyiha tugamaydi." },
    { t: "o", s: "Sen istemedikçe kimseye söylemem", uz: "Sen xohlamaguningcha hech kimga aytmayman." }
  ],
  "B2.25": [
    { t: "c", q: "Yiqilishimga oz qoldi.", o: ["Düşeyazdım.", "Düşedurdum.", "Düşegeldim."], a: 0 },
    { t: "c", q: "U hayron boʻlib qarab qoldi.", o: ["Şaşırıp bakakaldı.", "Şaşırıp bakayazdı.", "Şaşırıp bakagelir."], a: 0 },
    { t: "c", q: "Siz oʻtirib turing, men hozir kelaman.", o: ["Siz oturadurun, ben hemen geliyorum.", "Siz oturayazın, ben hemen geliyorum.", "Siz oturakalın, ben hemen geliyorum."], a: 0 },
    { t: "c", q: "asrlardan beri davom etib kelayotgan anʼana", o: ["yüzyıllardır süregelen gelenek", "yüzyıllardır süreyazan gelenek", "yüzyıllardır sürekalan gelenek"], a: 0 },
    { t: "t", q: "Az kalsın treni ___. (kaçırmak, oz qoldi, ben)", ans: ["kaçırayazdım"], uz: "Poyezdni oʻtkazib yuborishimga oz qoldi." },
    { t: "o", s: "Kapıda öylece bakakaldı", uz: "Eshik oldida qotib qarab qoldi." }
  ],
  "B2.26": [
    { t: "c", q: "Soat oltida ishni tugatgan boʻlaman.", o: ["Saat altıda işi bitirmiş olacağım.", "Saat altıda işi bitirecek olmuşum.", "Saat altıda işi bitirmiş oldum."], a: 0 },
    { t: "c", q: "U xatni olgan boʻlishi kerak.", o: ["Mektubu almış olmalı.", "Mektubu alacak olmalı.", "Mektubu almış olmuş."], a: 0 },
    { t: "t", q: "Siz geldiğinizde biz yemeği ___ olacağız. (bitirmek)", ans: ["bitirmiş"], uz: "Siz kelganingizda biz ovqatni tugatgan boʻlamiz." },
    { t: "t", q: "Ankara'ya ___ olursan bana haber ver. (gitmek, -acak)", ans: ["gidecek"], uz: "Anqaraga boradigan boʻlsang, menga xabar ber." },
    { t: "c", q: "Agar u buni bilgan boʻlsa…", o: ["Eğer o bunu bilmiş olsa…", "Eğer o bunu bilecek olmuş…", "Eğer o bunu bilmiş olursa olsa…"], a: 0 },
    { t: "o", s: "Mektubu çoktan göndermiş olmalı", uz: "U xatni allaqachon yuborgan boʻlishi kerak." }
  ],
  "B2.27": [
    { t: "c", q: "Onamni koʻrgim keldi.", o: ["Annemi göresim geldi.", "Annemi görmesim geldi.", "Annemi göreceğim geldi."], a: 0 },
    { t: "c", q: "Bugun hech ishlagim yoʻq.", o: ["Bugün hiç çalışasım yok.", "Bugün hiç çalışmasım yok.", "Bugün hiç çalışasın yok."], a: 0 },
    { t: "t", q: "Bu filmi izleyince ___ geldi. (ağlamak, ben)", ans: ["ağlayasım"], uz: "Bu filmni koʻrib yigʻlagim keldi." },
    { t: "t", q: "Tatilde hiç eve ___ yoktu. (dönmek, ben)", ans: ["dönesim"], uz: "Taʼtilda hech uyga qaytgim kelmadi." },
    { t: "t", q: "Seni çok ___ geldi. (görmek, ben)", ans: ["göresim"], uz: "Seni juda koʻrgim keldi." },
    { t: "o", s: "Bu akşam dışarı çıkasım var", uz: "Bu oqshom tashqariga chiqqim kelyapti." }
  ],
  "B2.28": [
    { t: "c", q: "Hech narsa boʻlmagandek kulib qoʻydi.", o: ["Hiçbir şey olmamış gibi güldü.", "Hiçbir şey olmamak gibi güldü.", "Hiçbir şey olmamışça gibi güldü."], a: 0 },
    { t: "c", q: "Goʻyo yomgʻir yogʻadigandek.", o: ["Sanki yağmur yağacak gibi.", "Sanki yağmur yağmak gibi.", "Sanki yağmur yağacağı gibi."], a: 0 },
    { t: "t", q: "Yüz yıl ___ gibi yorgunum. (çalışmak, -mış)", ans: ["çalışmış"], uz: "Yuz yil ishlagandek charchaganman." },
    { t: "t", q: "Beni ___ gibi yanımdan geçti. (görmemek, -mış)", ans: ["görmemiş"], uz: "Meni koʻrmagandek yonimdan oʻtib ketdi." },
    { t: "t", q: "___ her şeyi o biliyor. (goʻyo)", ans: ["Sanki", "sanki"], uz: "Goʻyo hamma narsani u biladi." },
    { t: "o", s: "Sanki rüyadaymış gibi hissediyorum", uz: "Xuddi tushdagidek his qilyapman." }
  ]
});

// C1 (2026-11)
Object.assign(BX, {
  "C1.01": [
    { t: "c", q: "Ruxsat olmasdan xonaga kirdi.", o: ["İzin alarak odaya girdi.", "İzin almaksızın odaya girdi.", "İzin aldığı için odaya girdi."], a: 1 },
    { t: "c", q: "Qaysi gap rasmiy uslubda?", o: ["Durmadan çalıştı.", "Hiç durmaksızın çalışmıştır.", "Durmadan çalıştı ya."], a: 1 },
    { t: "t", q: "Sözlüğe ___ metni çevirdi. (bakmak)", ans: ["bakmaksızın"], uz: "Lugʻatga qaramasdan matnni tarjima qildi." },
    { t: "t", q: "Ara ___ üç saat konuştu. (vermek)", ans: ["vermeksizin"], uz: "Tanaffus qilmasdan uch soat gapirdi." },
    { t: "o", s: "Hata yapmaktan korkmaksızın konuşmalısın", uz: "Xato qilishdan qoʻrqmasdan gapirishing kerak." }
  ],
  "C1.02": [
    { t: "c", q: "Sen yonimda boʻlar ekansan, hech narsadan qoʻrqmayman.", o: ["Sen yanımda olduğun sürece hiçbir şeyden korkmam.", "Sen yanımda olduğun gibi hiçbir şeyden korkmam.", "Sen yanımda olacağın yerde hiçbir şeyden korkmam."], a: 0 },
    { t: "c", q: "Rasmiy eʼlon: «Toʻlov qilinmagan taqdirda…»", o: ["Ödeme yapılmazken…", "Ödeme yapılmadığı sürece de…", "Ödeme yapılmadığı takdirde…"], a: 2 },
    { t: "t", q: "Her gün tekrar ___ sürece unutmazsın. (etmek, sen)", ans: ["ettiğin"], uz: "Har kuni takrorlar ekansan, unutmaysan." },
    { t: "t", q: "Belgeler eksik ___ takdirde başvuru reddedilir. (olmak)", ans: ["olduğu"], uz: "Hujjatlar toʻliq boʻlmagan taqdirda ariza rad etiladi." },
    { t: "o", s: "Çalıştığın sürece mutlaka ilerlersin", uz: "Mashq qilar ekansan, albatta olgʻa siljiysan." }
  ],
  "C1.03": [
    { t: "c", q: "«Film başlamak üzere.» — maʼnosi?", o: ["Film boshlanay deb turibdi.", "Film boshlanishi uchun.", "Film boshlanib boʻldi."], a: 0 },
    { t: "c", q: "Masalani muhokama qilish uchun yigʻildik.", o: ["Konuyu görüşmek yerine toplandık.", "Konuyu görüşmek üzere toplandık.", "Konuyu görüşmeksizin toplandık."], a: 1 },
    { t: "t", q: "Pilim ___ üzere, şarj aletin var mı? (bitmek)", ans: ["bitmek"], uz: "Quvvatim tugay deb qoldi, zaryadlagiching bormi?" },
    { t: "t", q: "Yarın görüşmek ___ ! (xayrlashuv)", ans: ["üzere"], uz: "Ertaga koʻrishguncha!" },
    { t: "o", s: "Staj yapmak üzere İzmir'e gitti", uz: "Amaliyot oʻtash uchun Izmirga ketdi." }
  ],
  "C1.04": [
    { t: "c", q: "Qimmat boʻlsa-da, sifatli emas.", o: ["Pahalı olacağı yerde kaliteli değil.", "Pahalı olmak üzere kaliteli değil.", "Pahalı olmakla birlikte kaliteli değil."], a: 2 },
    { t: "c", q: "Qaysi gapda taʼna bor?", o: ["Ezberlemek yerine cümle kurdu.", "Çalışacağı yerde bütün gün uyudu.", "Yürümek yerine otobüse bindi."], a: 1 },
    { t: "t", q: "Şikâyet etmek ___ çözüm öner. (oʻrniga)", ans: ["yerine"], uz: "Shikoyat qilish oʻrniga yechim taklif qil." },
    { t: "t", q: "Özür ___ yerde bir de bana kızdı. (dilemek, o)", ans: ["dileyeceği"], uz: "Uzr soʻrash oʻrniga yana mendan jahli chiqdi." },
    { t: "o", s: "Yorgun olmakla birlikte toplantıya katıldı", uz: "Charchagan boʻlsa-da, yigʻilishda qatnashdi." }
  ],
  "C1.05": [
    { t: "c", q: "Bilsam, xabar yolgʻon ekan.", o: ["Güya haber yalandı.", "Meğer haber yalanmış.", "Sözde haber yalan olacak."], a: 1 },
    { t: "c", q: "«Güya çok çalışıyormuş.» — gapiruvchi…", o: ["bunga ishonmaydi", "buni oʻzi koʻrgan", "buni endi bilib qolgan"], a: 0 },
    { t: "t", q: "___ sen haklıymışsın. (bilsam)", ans: ["Meğer", "meğer"], uz: "Bilsam, sen haq ekansan." },
    { t: "t", q: "Meğer fotoğraf eski___ . (-ymiş)", ans: ["ymiş", "eskiymiş"], uz: "Bilsam, surat eski ekan." },
    { t: "o", s: "Meğer kapıyı açık bırakmışım", uz: "Bilsam, eshikni ochiq qoldiribman." }
  ],
  "C1.06": [
    { t: "c", q: "Chiroqlar yonib turibdi, demak ular uyda.", o: ["Işıklar yandığına göre evdeler.", "Işıklar yandığı kadarıyla evdeler.", "Işıklar yanacak kadar evdeler."], a: 0 },
    { t: "c", q: "Bilishimcha, yigʻilish kechiktirildi.", o: ["Bildiğime rağmen toplantı ertelendi.", "Bildiğim sürece toplantı ertelendi.", "Bildiğim kadarıyla toplantı ertelendi."], a: 2 },
    { t: "t", q: "Telefonu ___ göre meşgul. (açmamak, o)", ans: ["açmadığına"], uz: "Telefonni koʻtarmayapti, demak band." },
    { t: "t", q: "___ kadarıyla taşınmayı düşünüyorsun. (anlamak, ben)", ans: ["Anladığım", "anladığım"], uz: "Tushunishimcha, koʻchishni oʻylayapsan." },
    { t: "o", s: "Uzmanların söylediğine göre kış sert geçecek", uz: "Mutaxassislarning aytishicha, qish qattiq keladi." }
  ],
  "C1.07": [
    { t: "c", q: "Yura olmaydigan darajada charchaganman.", o: ["Yürüyemeyecek kadar yorgunum.", "Yürümediğim kadar yorgunum.", "Yürüyemediğime göre yorgunum."], a: 0 },
    { t: "c", q: "Hamma eshitadigan darajada baland gapirdi.", o: ["Herkesin duyduğu gibi yüksek sesle konuştu.", "Herkesin duyacağı kadar yüksek sesle konuştu.", "Herkes duymaksızın yüksek sesle konuştu."], a: 1 },
    { t: "t", q: "___ kadar heyecanlıydım. (konuşamamak)", ans: ["Konuşamayacak", "konuşamayacak"], uz: "Gapira olmaydigan darajada hayajonda edim." },
    { t: "t", q: "Salon yüz kişinin ___ kadar büyük. (sığmak)", ans: ["sığacağı"], uz: "Zal yuz kishi sigʻadigan darajada katta." },
    { t: "o", s: "Fiyatlar inanılmayacak kadar düşük", uz: "Narxlar ishonib boʻlmaydigan darajada past." }
  ],
  "C1.08": [
    { t: "c", q: "Hisobot bir mutaxassisga tayyorlattirildi.", o: ["Rapor bir uzmana hazırlandı.", "Rapor bir uzmana hazırlatıldı.", "Raporu bir uzman hazırlattı."], a: 1 },
    { t: "c", q: "Qoʻshimchalar tartibi qaysi birida toʻgʻri?", o: ["yap-ıl-tır-dı", "yap-tı-tır-ıl", "yap-tır-ıl-dı"], a: 2 },
    { t: "t", q: "Belgeler noterde ___ . (onaylamak, orttirma + majhul, -AcAk)", ans: ["onaylatılacak"], uz: "Hujjatlar notariusda tasdiqlatiladi." },
    { t: "t", q: "Duvarlar bir ustaya ___ . (boyamak, orttirma + majhul, -DI)", ans: ["boyatıldı"], uz: "Devorlar bir ustaga boʻyattirildi." },
    { t: "o", s: "Sözleşme iki avukata inceletildi", uz: "Shartnoma ikki advokatga koʻrib chiqtirildi." }
  ],
  "C1.09": [
    { t: "c", q: "Bu xatoning oldini olish mumkin edi.", o: ["Bu hata önlenebilirdi.", "Bu hatayı önleyebilirdi.", "Bu hata önlenmişti."], a: 0 },
    { t: "c", q: "Taklifni bu shartlarda qabul qilib boʻlmaydi.", o: ["Teklif bu koşullarda kabul edemez.", "Teklif bu koşullarda kabul edilmedi.", "Teklif bu koşullarda kabul edilemez."], a: 2 },
    { t: "t", q: "Sözleşme otuz gün içinde iptal ___ . (etmek, majhul + -Abil, geniş zaman)", ans: ["edilebilir"], uz: "Shartnoma oʻttiz kun ichida bekor qilinishi mumkin." },
    { t: "t", q: "Biletler internetten ___ . (almak, majhul + -Abil, geniş zaman)", ans: ["alınabilir"], uz: "Chiptalarni internetdan olish mumkin." },
    { t: "o", s: "Bu sorun kolayca çözülebilir", uz: "Bu muammoni osongina hal qilish mumkin." }
  ],
  "C1.10": [
    { t: "c", q: "Veri yetersizdir; ___ kesin bir sonuca varılamaz.", o: ["nitekim", "dolayısıyla", "zira"], a: 1 },
    { t: "c", q: "Dikkatli olunmalıdır, ___ hata payı yüksektir.", o: ["zira", "dolayısıyla", "buna karşın"], a: 0 },
    { t: "t", q: "Risk büyüktür; ___ geçen yıl üç hata yaşandı. (darhaqiqat)", ans: ["nitekim"], uz: "Xavf katta; darhaqiqat, oʻtgan yili uchta xato boʻldi." },
    { t: "t", q: "Sistem hızlıdır; bununla ___ pahalıdır. (shu bilan birga)", ans: ["birlikte"], uz: "Tizim tez ishlaydi; shu bilan birga qimmat." },
    { t: "o", s: "Bütçe yetersizdir dolayısıyla proje ertelenmiştir", uz: "Byudjet yetarli emas, binobarin loyiha kechiktirilgan." }
  ],
  "C1.11": [
    { t: "c", q: "Zinadan yiqilib tushishimga oz qoldi.", o: ["Merdivenden düşüverdim.", "Merdivenden düşeyazdım.", "Merdivenden düşekaldım."], a: 1 },
    { t: "c", q: "Xabarni eshitib qotib qoldi.", o: ["Haberi duyunca donakaldı.", "Haberi duyunca donuverdi.", "Haberi duyunca donayazdı."], a: 0 },
    { t: "t", q: "Şu pencereyi ___ misin? (açmak, -(y)Iver, geniş zaman)", ans: ["açıverir"], uz: "Shu derazani ochib yuborasanmi?" },
    { t: "t", q: "Yağmur birden ___ . (başlamak, -(y)Iver, -DI)", ans: ["başlayıverdi"], uz: "Yomgʻir birdan boshlanib ketdi." },
    { t: "o", s: "Çocuk bir anda uyuyuverdi", uz: "Bola bir zumda uxlab qoldi." }
  ],
  "C1.12": [
    { t: "c", q: "Qaysi gap devrik?", o: ["O akşam vapur gelmedi.", "Vapur o akşam gelmedi.", "Gelmedi o akşam vapur."], a: 2 },
    { t: "c", q: "«kara» ning kuchaytirma shakli", o: ["kapkara", "karkara", "kaskara"], a: 0 },
    { t: "t", q: "Bugün deniz ___ . (koʻm-koʻk)", ans: ["masmavi"], uz: "Bugun dengiz koʻm-koʻk." },
    { t: "t", q: "Kar yağmış, her yer ___ . (oppoq)", ans: ["bembeyaz"], uz: "Qor yogʻibdi, hamma yoq oppoq." },
    { t: "o", s: "Annemin sesini hiç unutamadım", uz: "Onamning ovozini hech unuta olmadim." }
  ]
});
