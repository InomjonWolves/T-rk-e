// Türkçe Yoʻl — alifbo va grammatika mazmuni.
// LETTERS: [harf, misol, tarjima, izoh, oʻzbekchadan farqlimi]
const LETTERS = [
  ["A a", "araba", "mashina", "a"],
  ["B b", "balık", "baliq", "b"],
  ["C c", "cep", "choʻntak", "“j” deb oʻqiladi!", 1],
  ["Ç ç", "çay", "choy", "“ch”", 1],
  ["D d", "deniz", "dengiz", "d"],
  ["E e", "ev", "uy", "e"],
  ["F f", "fil", "fil", "f"],
  ["G g", "göz", "koʻz", "g"],
  ["Ğ ğ", "dağ", "togʻ", "Oʻqilmaydi, oldingi unlini choʻzadi", 1],
  ["H h", "hava", "havo", "h"],
  ["I ı", "ılık", "iliq", "Nuqtasiz: “qiz”dagi qisqa i", 1],
  ["İ i", "iki", "ikki", "Nuqtali: katta harfda ham nuqta bor", 1],
  ["J j", "japon", "yapon", "“jurnal”dagi j, kam uchraydi"],
  ["K k", "kedi", "mushuk", "k"],
  ["L l", "limon", "limon", "l"],
  ["M m", "masa", "stol", "m"],
  ["N n", "nar", "anor", "n"],
  ["O o", "okul", "maktab", "o"],
  ["Ö ö", "ördek", "oʻrdak", "Lablar yumaloq, “oʻ”ga yaqin", 1],
  ["P p", "para", "pul", "p"],
  ["R r", "renk", "rang", "r"],
  ["S s", "su", "suv", "s"],
  ["Ş ş", "şeker", "shakar", "“sh”", 1],
  ["T t", "tuz", "tuz", "t"],
  ["U u", "uçak", "samolyot", "u"],
  ["Ü ü", "üzüm", "uzum", "Lablar yumaloq, ingichka u", 1],
  ["V v", "vatan", "vatan", "v"],
  ["Y y", "yol", "yoʻl", "y"],
  ["Z z", "zaman", "zamon", "z"]
];

const GRAMMAR = [
  { id: "uyum", tr: "Ünlü uyumu", uz: "Unli uygʻunligi",
    lead: "Turkchada qoʻshimchalar soʻzning oxirgi unlisiga moslashadi. Bu qoida butun grammatikaning kaliti: koʻplik, kelishik, zamon, hammasi shunga tayanadi.",
    points: ["Ikki xil shakl (a/e): oxirgi unli a, ı, o, u boʻlsa → a; e, i, ö, ü boʻlsa → e. Masalan: -lar/-ler, -da/-de.", "Toʻrt xil shakl (ı/i/u/ü): jadvalga qarang. Masalan: -ım/-im/-um/-üm."],
    table: { head: ["Oxirgi unli", "2 xil", "4 xil"], rows: [["a, ı", "a", "ı"], ["o, u", "a", "u"], ["e, i", "e", "i"], ["ö, ü", "e", "ü"]] },
    compare: "Oʻzbek tilida bu qoida deyarli yoʻqolgan: “uylar” ham, “kitoblar” ham deymiz. Turkchada esa “evler” va “kitaplar”.",
    examples: [["kitaplar", "kitoblar"], ["evler", "uylar"], ["okulda", "maktabda"], ["evde", "uyda"]],
    quiz: [
      { q: "göz + lar/ler = ?", o: ["gözlar", "gözler"], a: 1 },
      { q: "masa + da/de = ?", o: ["masada", "masade"], a: 0 },
      { q: "4 xil qoʻshimchada o, u dan keyin qaysi unli keladi?", o: ["ı", "i", "u", "ü"], a: 2 }
    ] },
  { id: "cogul", tr: "Çoğul", uz: "Koʻplik: -lar / -ler",
    lead: "Koʻplik qoʻshimchasi oʻzbekcha -lar bilan bir xil. Faqat unli uygʻunligiga qarab -lar yoki -ler boʻladi.",
    points: ["Oxirgi unli a, ı, o, u → -lar: kitaplar, okullar.", "Oxirgi unli e, i, ö, ü → -ler: evler, gözler."],
    table: { head: ["Soʻz", "Koʻplik", "Oʻzbekcha"], rows: [["kitap", "kitaplar", "kitoblar"], ["ev", "evler", "uylar"], ["çocuk", "çocuklar", "bolalar"], ["göz", "gözler", "koʻzlar"]] },
    compare: "Sondan keyin koʻplik qoʻshilmaydi, xuddi oʻzbekchadagidek: “iki kitap” (ikki kitob).",
    examples: [["iki kitap", "ikki kitob"], ["Çocuklar okulda", "Bolalar maktabda"]],
    quiz: [
      { q: "anne + lar/ler = ?", o: ["anneler", "annelar"], a: 0 },
      { q: "“uch olma” turkchada:", o: ["üç elmalar", "üç elma"], a: 1 },
      { q: "okul + lar/ler = ?", o: ["okuller", "okullar"], a: 1 }
    ] },
  { id: "sahis", tr: "Şahıs ekleri", uz: "Men talabaman: shaxs qoʻshimchalari",
    lead: "“Men oʻqituvchiman” kabi gaplarda turkcha ham otga qoʻshimcha qoʻshadi. Olmoshlar oʻzbekchaga juda oʻxshaydi: ben, sen, o, biz, siz, onlar.",
    points: ["Qoʻshimchadagi unli 4 xil boʻladi: ı, i, u, ü.", "Soʻz unli bilan tugasa, orasiga “y” qoʻshiladi: öğrenci-y-im."],
    table: { head: ["Olmosh", "Turkcha", "Oʻzbekcha"], rows: [["ben", "öğrenciyim", "talabaman"], ["sen", "öğrencisin", "talabasan"], ["o", "öğrenci", "talaba"], ["biz", "öğrenciyiz", "talabamiz"], ["siz", "öğrencisiniz", "talabasiz"], ["onlar", "öğrenciler", "talabalar"]] },
    compare: "Oʻzbekcha -man, -san, -miz, -siz bilan solishtiring: shakli boshqa, mantiqi bir xil.",
    examples: [["Ben öğretmenim", "Men oʻqituvchiman"], ["Sen doktorsun", "Sen shifokorsan"], ["Biz yorgunuz", "Biz charchaganmiz"]],
    quiz: [
      { q: "Men oʻqituvchiman = Ben öğretmen___", o: ["-im", "-sin", "-iz"], a: 0 },
      { q: "Siz shifokorsiz = Siz doktor___", o: ["-sunuz", "-sınız", "-siniz"], a: 0 },
      { q: "“U talaba” turkchada:", o: ["O öğrenci", "O öğrenciyim", "O öğrencisin"], a: 0 }
    ] },
  { id: "hal", tr: "Hal ekleri", uz: "Kelishiklar: -ga, -da, -dan, -ni",
    lead: "Turkchada asosiy toʻrt kelishik oʻzbekchaga mos keladi. Oʻzbekcha -ga turkchada shunchaki -a/-e.",
    points: ["Jarangsiz undoshdan (ç, f, h, k, p, s, ş, t) keyin d → t: kitapta, sokaktan (koʻchadan).", "Unli bilan tugagan soʻzga “y” qoʻshiladi: arabaya (mashinaga), arabayı (mashinani).", "Atoqli otlarga qoʻshimcha apostrof bilan yoziladi: İstanbul'a, Taşkent'te."],
    table: { head: ["Kelishik", "Turkcha", "Oʻzbekcha"], rows: [["-ga", "eve, okula", "uyga, maktabga"], ["-da", "evde, okulda", "uyda, maktabda"], ["-dan", "evden, okuldan", "uydan, maktabdan"], ["-ni", "evi, okulu", "uyni, maktabni"]] },
    compare: "Diqqat: turkcha “evi” ham “uyni”, ham “uning uyi” boʻlishi mumkin. Maʼnoni gap ichidan bilasiz.",
    examples: [["Okula gidiyorum", "Maktabga ketyapman"], ["Evdeyim", "Uydaman"], ["İstanbul'dan geldim", "Istanbuldan keldim"]],
    quiz: [
      { q: "Uyga = ev + ?", o: ["eve", "evde", "evden"], a: 0 },
      { q: "Kitobda = kitap + ?", o: ["kitapda", "kitapta"], a: 1 },
      { q: "Mashinaga = araba + ?", o: ["arabaa", "arabaya", "arabaga"], a: 1 }
    ] },
  { id: "iyelik", tr: "İyelik ekleri", uz: "Egalik: uyim, uying, uyi",
    lead: "Egalik qoʻshimchalari oʻzbekcha bilan deyarli bir xil. Olmosh qoʻshilsa, maʼno kuchayadi: benim evim (mening uyim).",
    points: ["Unli bilan tugagan soʻzda unli tushib qoladi: araba-m, araba-n.", "3-shaxsda unlidan keyin “s” qoʻshiladi: arabası (uning mashinasi)."],
    table: { head: ["Kim", "ev (uy)", "araba"], rows: [["benim", "evim", "arabam"], ["senin", "evin", "araban"], ["onun", "evi", "arabası"], ["bizim", "evimiz", "arabamız"], ["sizin", "eviniz", "arabanız"], ["onların", "evleri", "arabaları"]] },
    compare: "Diqqat: oʻzbekcha “uying” -ng bilan, turkcha “evin” -n bilan tugaydi.",
    examples: [["Benim adım Aziz", "Mening ismim Aziz"], ["Annem doktor", "Onam shifokor"], ["Arabası yeni", "Uning mashinasi yangi"]],
    quiz: [
      { q: "Mening maktabim = okul + ?", o: ["okulum", "okulim", "okulun"], a: 0 },
      { q: "Sening isming = ad + ?", o: ["adın", "adım", "adı"], a: 0 },
      { q: "Uning mashinasi = araba + ?", o: ["arabası", "arabayı", "arabam"], a: 0 }
    ] },
  { id: "varyok", tr: "Var / Yok", uz: "Bor / Yoʻq",
    lead: "“Bor” turkchada var, “yoʻq” esa yok. Egalik qoʻshimchasi bilan birga “menda bor” maʼnosi chiqadi.",
    points: ["Param var = Pulim bor. Tuzilishi oʻzbekcha bilan bir xil.", "Savol: var mı? / yok mu?"],
    table: { head: ["Turkcha", "Oʻzbekcha"], rows: [["Param var", "Pulim bor"], ["Vaktim yok", "Vaqtim yoʻq"], ["Sorunuz var mı?", "Savolingiz bormi?"], ["Burada çay var", "Bu yerda choy bor"]] },
    compare: "Oʻzbekchadagi “pulim bor” tuzilishining aynan oʻzi. Faqat soʻzlarni almashtirasiz.",
    examples: [["Bir sorum var", "Bitta savolim bor"], ["Sorun yok", "Muammo yoʻq"], ["Kardeşin var mı?", "Aka-ukang bormi?"]],
    quiz: [
      { q: "Vaqtim yoʻq = Vaktim ___", o: ["var", "yok", "değil"], a: 1 },
      { q: "Pulim bor = Param ___", o: ["var", "yok", "mı"], a: 0 },
      { q: "Savolingiz bormi?", o: ["Sorunuz var mı?", "Sorunuz yok mu?", "Sorunuz değil mi?"], a: 0 }
    ] },
  { id: "soru", tr: "Soru eki: mı / mi", uz: "Savol yuklamasi",
    lead: "Oʻzbekcha -mi turkchada ham bor, lekin alohida yoziladi va unli uygʻunligiga boʻysunadi: mı, mi, mu, mü.",
    points: ["Bu çay mı? — oxirgi unli a → mı.", "Shaxs qoʻshimchasi yuklamaga qoʻshiladi: Hazır mısın? (Tayyormisan?)"],
    table: { head: ["Gap", "Savol", "Oʻzbekcha"], rows: [["Bu çay", "Bu çay mı?", "Bu choymi?"], ["Ev güzel", "Ev güzel mi?", "Uy chiroylimi?"], ["Sen hazırsın", "Sen hazır mısın?", "Sen tayyormisan?"], ["O Türk", "O Türk mü?", "U turkmi?"]] },
    compare: "Oʻzbekchada “choymi” qoʻshib yoziladi, turkchada “çay mı” ajratib yoziladi.",
    examples: [["Türkçe biliyor musun?", "Turkcha bilasanmi?"], ["Bu otobüs Taksim'e gidiyor mu?", "Bu avtobus Taksimga boradimi?"]],
    quiz: [
      { q: "Bu choymi? = Bu çay ___?", o: ["mı", "mi", "mu"], a: 0 },
      { q: "Uy chiroylimi? = Ev güzel ___?", o: ["mı", "mi", "mü"], a: 1 },
      { q: "Qaysi biri toʻgʻri yozilgan?", o: ["Bu kitapmı?", "Bu kitap mı?"], a: 1 }
    ] },
  { id: "simdiki", tr: "Şimdiki zaman: -iyor", uz: "Hozirgi zamon: kelyapman",
    lead: "Hozir boʻlayotgan ish -iyor bilan ifodalanadi. Bu oʻzbekcha -yap- ning turkchadagi juftligi: kel-yap-man ↔ gel-iyor-um.",
    points: ["Feʼl oʻzagi + ıyor/iyor/uyor/üyor + shaxs qoʻshimchasi. “-yor” qismi hech qachon oʻzgarmaydi.", "Oʻzak unli bilan tugasa, u tushib qoladi: oku-mak → okuyorum, bekle-mek → bekliyorum (kutyapman)."],
    table: { head: ["Shaxs", "gelmek", "Oʻzbekcha"], rows: [["ben", "geliyorum", "kelyapman"], ["sen", "geliyorsun", "kelyapsan"], ["o", "geliyor", "kelyapti"], ["biz", "geliyoruz", "kelyapmiz"], ["siz", "geliyorsunuz", "kelyapsiz"], ["onlar", "geliyorlar", "kelyaptilar"]] },
    compare: "Turklar bu zamonni oʻzbekcha “kelaman” (doimiy ish) oʻrnida ham ishlatadi: “Her gün çalışıyorum” = Har kuni ishlayman.",
    examples: [["Ne yapıyorsun?", "Nima qilyapsan?"], ["Türkçe öğreniyorum", "Turk tilini oʻrganyapman"], ["Kitap okuyorum", "Kitob oʻqiyapman"]],
    quiz: [
      { q: "Men kelyapman = gel + ?", o: ["geliyorum", "gelyorum", "geliyoruz"], a: 0 },
      { q: "Biz yozyapmiz = yaz + ?", o: ["yazıyoruz", "yaziyoruz", "yazıyorsunuz"], a: 0 },
      { q: "Sen ichyapsan = iç + ?", o: ["içiyorsun", "içıyorsun", "içiyorum"], a: 0 }
    ] },
  { id: "gecmis", tr: "Geçmiş zaman: -di", uz: "Oʻtgan zamon: keldim",
    lead: "Bu zamon oʻzbekchaga eng yaqin: geldim, geldin, geldi… deyarli harfma-harf bir xil!",
    points: ["Qoʻshimcha 4 xil: -dı, -di, -du, -dü.", "Jarangsiz undoshdan keyin d → t: yaptım (qildim), içtim (ichdim), konuştum (gapirdim)."],
    table: { head: ["Shaxs", "gelmek", "Oʻzbekcha"], rows: [["ben", "geldim", "keldim"], ["sen", "geldin", "kelding"], ["o", "geldi", "keldi"], ["biz", "geldik", "keldik"], ["siz", "geldiniz", "keldingiz"], ["onlar", "geldiler", "keldilar"]] },
    compare: "Yagona farq: “kelding” turkchada “geldin”, “keldingiz” esa “geldiniz”.",
    examples: [["Dün geldim", "Kecha keldim"], ["Ne yaptın?", "Nima qilding?"], ["Çay içtik", "Choy ichdik"]],
    quiz: [
      { q: "Men keldim = gel + ?", o: ["geldim", "geltim", "geldik"], a: 0 },
      { q: "Men qildim = yap + ?", o: ["yapdım", "yaptım", "yaptı"], a: 1 },
      { q: "Ular bordi = git + ?", o: ["gittiler", "gitdiler", "gittik"], a: 0 }
    ] },
  { id: "olumsuz", tr: "Olumsuzluk", uz: "Inkor: -ma, değil",
    lead: "Feʼlni inkor qilish oʻzbekchadagidek: oʻzakka -ma/-me qoʻshiladi. Ot va sifatlar uchun “değil” (emas) ishlatiladi.",
    points: ["gel-me-di-m = kel-ma-di-m. Tartib ham bir xil!", "Hozirgi zamonda -me + -iyor → -miyor: gelmiyorum (kelmayapman).", "Ben doktor değilim = Men shifokor emasman."],
    table: { head: ["Ha", "Yoʻq", "Oʻzbekcha"], rows: [["geldim", "gelmedim", "kelmadim"], ["yaptı", "yapmadı", "qilmadi"], ["anlıyorum", "anlamıyorum", "tushunmayapman"], ["Türk'üm", "Türk değilim", "turk emasman"]] },
    compare: "“Değil” gapning oxirida keladi va shaxs qoʻshimchasini oʻziga oladi: değilim, değilsin, değil.",
    examples: [["Bilmiyorum", "Bilmayman"], ["Acele etme!", "Shoshilma!"], ["Pahalı değil", "Qimmat emas"]],
    quiz: [
      { q: "Kelmadim = gel + ?", o: ["gelmedim", "gelmadım", "gelmedi"], a: 0 },
      { q: "Tushunmayapman = ?", o: ["Anlamıyorum", "Anlamadım", "Anlamıyor"], a: 0 },
      { q: "Qimmat emas = Pahalı ___", o: ["yok", "değil", "mı"], a: 1 }
    ] }
];
