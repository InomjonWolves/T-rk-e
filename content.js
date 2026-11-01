// Türkçe Yoʻl — dars mazmuni. Har bir soʻz: [turkcha, oʻzbekcha, izoh (ixtiyoriy)].
// Yangi dars qoʻshish uchun shu roʻyxatga obyekt qoʻshing; "id" takrorlanmasin, turkcha soʻzlar ham takrorlanmasin.
const UNITS = [
  { id: "selam", tr: "Selamlaşma", uz: "Salomlashish",
    tip: ["Sen va Siz", "Turkchada ham xuddi oʻzbekchadagidek: doʻstga “sen”, kattalarga “siz”. “Merhaba” har qanday vaziyatda ishlaydi."],
    words: [
      ["Merhaba", "Salom"],
      ["Günaydın", "Xayrli tong"],
      ["İyi akşamlar", "Xayrli kech"],
      ["İyi geceler", "Xayrli tun"],
      ["Nasılsın?", "Qalaysan?"],
      ["İyiyim, teşekkürler", "Yaxshiman, rahmat"],
      ["Hoş geldiniz", "Xush kelibsiz"],
      ["Görüşürüz", "Koʻrishguncha"],
      ["Hoşça kal", "Xayr, sogʻ boʻl", "Ketayotgan odam qolayotganga aytadi"],
      ["Lütfen", "Iltimos"],
      ["Teşekkür ederim", "Rahmat"],
      ["Evet", "Ha"],
      ["Hayır", "Yoʻq"]
    ] },
  { id: "tanisma", tr: "Tanışma", uz: "Tanishuv",
    tip: ["-man / -im", "Oʻzbekcha “oʻzbekman” → turkcha “Özbeğim”. Shaxs qoʻshimchasi deyarli bir xil ishlaydi: -ım, -im, -um, -üm."],
    words: [
      ["Adın ne?", "Isming nima?"],
      ["Benim adım …", "Mening ismim …"],
      ["Nerelisin?", "Qayerliksan?"],
      ["Özbekistanlıyım", "Oʻzbekistonlikman"],
      ["Memnun oldum", "Tanishganimdan xursandman"],
      ["Kaç yaşındasın?", "Necha yoshdasan?"],
      ["Türkçe öğreniyorum", "Turk tilini oʻrganyapman"],
      ["Anlamadım", "Tushunmadim"],
      ["Tekrar eder misiniz?", "Takrorlay olasizmi?"],
      ["Yavaş konuşur musunuz?", "Sekinroq gapira olasizmi?"]
    ] },
  { id: "sayilar", tr: "Sayılar", uz: "Raqamlar",
    tip: ["Deyarli bir xil", "Sonlar oʻzbekchaga juda yaqin: bir, iki, üç… Faqat “yüz” 100 degani, “bin” esa 1000 (oʻzbekcha “ming”)."],
    words: [
      ["bir", "1 — bir"], ["iki", "2 — ikki"], ["üç", "3 — uch"], ["dört", "4 — toʻrt"],
      ["beş", "5 — besh"], ["altı", "6 — olti"], ["yedi", "7 — yetti"], ["sekiz", "8 — sakkiz"],
      ["dokuz", "9 — toʻqqiz"], ["on", "10 — oʻn"], ["yirmi", "20 — yigirma"], ["elli", "50 — ellik"],
      ["yüz", "100 — yuz"], ["bin", "1000 — ming"]
    ] },
  { id: "aile", tr: "Aile", uz: "Oila",
    tip: ["“Kardeş” ehtiyot boʻling", "Turkcha “kardeş” = aka-uka yoki opa-singil. Oʻzbekcha “qarindosh” turkchada “akraba” boʻladi."],
    words: [
      ["aile", "oila"], ["anne", "ona"], ["baba", "ota"],
      ["kardeş", "aka-uka, opa-singil", "“Qarindosh” emas!"],
      ["ağabey", "aka"], ["abla", "opa"], ["oğul", "oʻgʻil"], ["kız", "qiz"],
      ["dede", "bobo"], ["nine", "buvi"], ["eş", "turmush oʻrtoq"], ["çocuk", "bola"]
    ] },
  { id: "yemek", tr: "Yemek", uz: "Ovqat",
    tip: ["Restoranda", "Ofitsiantni chaqirish uchun “Bakar mısınız?” deng. Ovqatdan oldin hamma “Afiyet olsun!” deydi."],
    words: [
      ["su", "suv"], ["ekmek", "non"], ["çay", "choy"], ["kahve", "qahva"],
      ["et", "goʻsht"], ["tavuk", "tovuq"], ["pirinç", "guruch"], ["süt", "sut"],
      ["elma", "olma"], ["şeker", "shakar"], ["Hesap, lütfen", "Hisobni bering"],
      ["Afiyet olsun", "Yoqimli ishtaha"], ["Bakar mısınız?", "Qarab yuboring-chi? (ofitsiantga)"]
    ] },
  { id: "renkler", tr: "Renkler", uz: "Ranglar",
    tip: ["“Mavi” koʻk", "Turkchada osmon rangi “mavi”. “Gök” esa osmonning oʻzi. “Kahverengi” — soʻzma-soʻz “qahva rangi”."],
    words: [
      ["kırmızı", "qizil"], ["mavi", "koʻk"], ["yeşil", "yashil"], ["sarı", "sariq"],
      ["siyah", "qora"], ["beyaz", "oq"], ["turuncu", "toʻq sariq"], ["mor", "binafsha"],
      ["pembe", "pushti"], ["gri", "kulrang"], ["kahverengi", "jigarrang"]
    ] },
  { id: "zaman", tr: "Zaman", uz: "Vaqt",
    tip: ["“Ay” ikki maʼnoli", "“Ay” ham oy (osmondagi), ham oy (taqvimdagi). Oʻzbekchadagidek!"],
    words: [
      ["bugün", "bugun"], ["yarın", "ertaga"], ["dün", "kecha"], ["şimdi", "hozir"],
      ["sabah", "ertalab"], ["akşam", "kechqurun"], ["gece", "tun"], ["saat", "soat"],
      ["hafta", "hafta"], ["ay", "oy"], ["yıl", "yil"], ["Saat kaç?", "Soat necha?"]
    ] },
  { id: "sehir", tr: "Şehirde", uz: "Shaharda",
    tip: ["Bozorda", "“Pazar” — bozor va yakshanba kuni. Narx soʻrash uchun: “Bu ne kadar?”"],
    words: [
      ["… nerede?", "… qayerda?"], ["tuvalet", "hojatxona"], ["otel", "mehmonxona"],
      ["havalimanı", "aeroport"], ["otobüs", "avtobus"], ["sağ", "oʻng"], ["sol", "chap"],
      ["düz", "toʻgʻri"], ["Bu ne kadar?", "Bu qancha turadi?"], ["pahalı", "qimmat"],
      ["ucuz", "arzon"], ["pazar", "bozor; yakshanba"]
    ] },
  { id: "fiiller", tr: "Fiiller", uz: "Feʼllar",
    tip: ["-mak / -mek = -moq", "Turkcha feʼlning oxiridagi -mak/-mek oʻzbekcha -moq bilan bir xil: yazmak → yozmoq."],
    words: [
      ["gelmek", "kelmoq"], ["gitmek", "bormoq"], ["yemek", "yemoq; ovqat"], ["içmek", "ichmoq"],
      ["okumak", "oʻqimoq"], ["yazmak", "yozmoq"], ["konuşmak", "gapirmoq"], ["bilmek", "bilmoq"],
      ["sevmek", "sevmoq"], ["istemek", "xohlamoq"], ["yapmak", "qilmoq"], ["görmek", "koʻrmoq"]
    ] },
  { id: "dostlar", tr: "Tanıdık kelimeler", uz: "Oʻxshash va aldamchi soʻzlar",
    tip: ["Aldamchi doʻstlar", "Qizil yozuvli soʻzlar oʻzbekchaga oʻxshaydi, lekin boshqa maʼnoni bildiradi. Ularni alohida yodlang."],
    words: [
      ["dil", "til", "Oʻzbekcha “dil” (yurak) emas!"],
      ["ayna", "koʻzgu", "Oʻzbekcha “oyna” (deraza) emas!"],
      ["kol", "bilak", "Kaft “el” deyiladi"],
      ["gök", "osmon", "Rang emas, osmon"],
      ["göz", "koʻz"], ["yol", "yoʻl"], ["kitap", "kitob"], ["kalem", "qalam"],
      ["dost", "doʻst"], ["kar", "qor"], ["baş", "bosh"], ["güzel", "chiroyli"]
    ] },
  { id: "meslek", tr: "Meslekler", uz: "Kasblar",
    tip: ["-çı / -ci = -chi", "Kasb qoʻshimchasi oʻzbekcha -chi bilan bir xil: iş → işçi (ishchi), aş → aşçı (oshpaz)."],
    words: [
      ["öğretmen", "oʻqituvchi"], ["öğrenci", "talaba, oʻquvchi"], ["doktor", "shifokor"], ["hemşire", "hamshira"],
      ["mühendis", "muhandis"], ["aşçı", "oshpaz"], ["garson", "ofitsiant"], ["şoför", "haydovchi"],
      ["polis", "politsiyachi"], ["avukat", "advokat"], ["satıcı", "sotuvchi"], ["işçi", "ishchi"],
      ["çiftçi", "dehqon, fermer"], ["berber", "sartarosh"], ["Ne iş yapıyorsun?", "Nima ish qilasan?"], ["İşsizim", "Ishsizman"]
    ] },
  { id: "ev", tr: "Ev", uz: "Uy",
    tip: ["Oda va salon", "“Oda” — xona, “salon” — mehmonxona (zal). Mehmonxona-otel esa “otel”."],
    words: [
      ["ev", "uy"], ["oda", "xona"], ["mutfak", "oshxona"], ["banyo", "vannaxona"], ["yatak odası", "yotoqxona"],
      ["salon", "zal, mehmonxona (uyda)"], ["kapı", "eshik"], ["pencere", "deraza"], ["masa", "stol"],
      ["sandalye", "stul"], ["yatak", "karavot, toʻshak"], ["dolap", "shkaf"], ["buzdolabı", "muzlatgich"],
      ["halı", "gilam"], ["anahtar", "kalit"], ["duvar", "devor"], ["merdiven", "zinapoya"]
    ] },
  { id: "vucut", tr: "Vücut", uz: "Tana",
    tip: ["Tanish soʻzlar", "Koʻp aʼzolar nomi oʻzbekchaga yaqin: kulak — quloq, burun — burun, diş — tish, boyun — boʻyin."],
    words: [
      ["vücut", "tana"], ["el", "qoʻl (kaft)"], ["ayak", "oyoq"], ["kulak", "quloq"], ["burun", "burun"],
      ["ağız", "ogʻiz"], ["diş", "tish"], ["saç", "soch"], ["parmak", "barmoq"], ["kalp", "yurak"],
      ["karın", "qorin"], ["sırt", "orqa (bel)"], ["boyun", "boʻyin"], ["omuz", "yelka"], ["diz", "tizza"], ["dudak", "lab"]
    ] },
  { id: "gunler", tr: "Günler ve aylar", uz: "Kunlar va oylar",
    tip: ["Yakshanba qayerda?", "Yakshanba — “pazar” (8-darsda bor). Kunlar va oylar bosh harf bilan yoziladi: Pazartesi, Ocak."],
    words: [
      ["Pazartesi", "dushanba"], ["Salı", "seshanba"], ["Çarşamba", "chorshanba"], ["Perşembe", "payshanba"],
      ["Cuma", "juma"], ["Cumartesi", "shanba"], ["Ocak", "yanvar"], ["Şubat", "fevral"], ["Mart", "mart"],
      ["Nisan", "aprel"], ["Mayıs", "may"], ["Haziran", "iyun"], ["Temmuz", "iyul"], ["Ağustos", "avgust"],
      ["Eylül", "sentabr"], ["Ekim", "oktabr"], ["Kasım", "noyabr"], ["Aralık", "dekabr"]
    ] },
  { id: "hava", tr: "Hava ve mevsimler", uz: "Ob-havo va fasllar",
    tip: ["Yağmur yağıyor", "“Yogʻmoq” feʼli turkchada “yağmak”: Yağmur yağıyor — yomgʻir yogʻyapti, Kar yağıyor — qor yogʻyapti."],
    words: [
      ["hava", "havo, ob-havo"], ["güneş", "quyosh"], ["yağmur", "yomgʻir"], ["rüzgâr", "shamol"], ["bulut", "bulut"],
      ["sıcak", "issiq"], ["soğuk", "sovuq"], ["ilkbahar", "bahor"], ["yaz", "yoz"], ["sonbahar", "kuz"], ["kış", "qish"],
      ["Hava nasıl?", "Havo qanday?"], ["Yağmur yağıyor", "Yomgʻir yogʻyapti"], ["Kar yağıyor", "Qor yogʻyapti"], ["Bugün hava güzel", "Bugun havo yaxshi"]
    ] },
  { id: "sifat", tr: "Sıfatlar", uz: "Sifatlar",
    tip: ["Umumiy soʻzlar", "Koʻp sifatlar ikki tilda bir xil yoki juda yaqin: uzun, eski, boş (boʻsh), dolu (toʻla)."],
    words: [
      ["büyük", "katta"], ["küçük", "kichik"], ["uzun", "uzun"], ["kısa", "qisqa"], ["yeni", "yangi"], ["eski", "eski"],
      ["iyi", "yaxshi"], ["kötü", "yomon"], ["kolay", "oson"], ["zor", "qiyin"], ["hızlı", "tez"], ["yavaş", "sekin"],
      ["temiz", "toza"], ["kirli", "iflos"], ["dolu", "toʻla"], ["boş", "boʻsh"], ["genç", "yosh"], ["yaşlı", "keksa"]
    ] },
  { id: "soru", tr: "Soru kelimeleri", uz: "Savol soʻzlari va bogʻlovchilar",
    tip: ["Ne, kim, nasıl", "Savol soʻzlari gap boshida emas, odatda feʼldan oldin turadi: Sen nerede oturuyorsun? (Sen qayerda yashaysan?)"],
    words: [
      ["ne", "nima"], ["kim", "kim"], ["nerede", "qayerda"], ["nereye", "qayerga"], ["nereden", "qayerdan"],
      ["ne zaman", "qachon"], ["neden", "nega"], ["nasıl", "qanday"], ["hangi", "qaysi"], ["kaç", "nechta"],
      ["ne kadar", "qancha"], ["kimin", "kimning"], ["ve", "va"], ["ama", "lekin"], ["çünkü", "chunki"],
      ["veya", "yoki"], ["de / da", "ham", "Alohida yoziladi: Ben de geliyorum"], ["sonra", "keyin"], ["önce", "oldin"]
    ] },
  { id: "zamir", tr: "Zamirler", uz: "Olmoshlar",
    tip: ["O = u", "Turkcha “o” ham “u” (u kishi), ham “ana u” degani. “Bu, şu, o” — bu, shu, u."],
    words: [
      ["ben", "men"], ["sen", "sen"], ["o", "u; ana u"], ["biz", "biz"], ["siz", "siz"], ["onlar", "ular"],
      ["bu", "bu"], ["şu", "shu"], ["bunlar", "bular"], ["burada", "bu yerda"], ["şurada", "shu yerda"],
      ["orada", "u yerda"], ["benim", "mening"], ["senin", "sening"], ["hepsi", "hammasi"], ["herkes", "hamma (odamlar)"],
      ["hiçbir şey", "hech narsa"], ["bir şey", "bir narsa"]
    ] },
  { id: "kalip", tr: "Kalıplar", uz: "Foydali iboralar",
    tip: ["Kolay gelsin", "Ishlayotgan odamga (sotuvchi, ishchi, hamkasb) salomlashganda “Kolay gelsin!” deyiladi. Bu turkchaning eng koʻp ishlatiladigan iborasi."],
    words: [
      ["Tamam", "Mayli, xoʻp"], ["Pardon", "Kechirasiz (eʼtibor uchun)"], ["Özür dilerim", "Uzr soʻrayman"], ["Buyurun", "Marhamat"],
      ["Kolay gelsin", "Ishingizga omad", "Ishlayotgan odamga aytiladi"], ["İnşallah", "Inshoolloh"], ["Maşallah", "Mashaolloh"],
      ["Sağ ol", "Rahmat (samimiy)"], ["Rica ederim", "Arzimaydi"], ["Önemli değil", "Muhim emas"], ["Bir dakika", "Bir daqiqa"],
      ["Tabii", "Albatta"], ["Belki", "Balki"], ["Galiba", "Shekilli"], ["Aynen", "Xuddi shunday"], ["Haydi!", "Qani, ketdik!"]
    ] },
  { id: "kahvalti", tr: "Kahvaltı", uz: "Nonushta",
    tip: ["Turk nonushtasi", "Turkiyada nonushta (kahvaltı) — muqaddas: pishloq, zaytun, tuxum, asal va albatta choy. Soʻzning oʻzi “kahve altı” — “qahvadan oldin”."],
    words: [
      ["kahvaltı", "nonushta"], ["yumurta", "tuxum"], ["peynir", "pishloq"], ["zeytin", "zaytun"], ["bal", "asal", "Oʻzbekchada ham “bol”"],
      ["tereyağı", "sariyogʻ"], ["reçel", "murabbo"], ["tuz", "tuz"], ["biber", "qalampir"], ["yoğurt", "qatiq"],
      ["çorba", "shoʻrva"], ["meyve suyu", "sharbat"], ["Kahvaltı hazır", "Nonushta tayyor"], ["Bir çay daha, lütfen", "Yana bitta choy, iltimos"]
    ] },
  { id: "meyve", tr: "Meyve ve sebze", uz: "Mevalar va sabzavotlar",
    tip: ["Bozordagi qardoshlar", "Kavun — qovun, karpuz — tarvuz, sarımsak — sarimsoq, üzüm — uzum. Bozorda oʻzingizni uydagidek his qilasiz."],
    words: [
      ["meyve", "meva"], ["sebze", "sabzavot"], ["muz", "banan"], ["portakal", "apelsin"], ["armut", "nok"],
      ["üzüm", "uzum"], ["karpuz", "tarvuz"], ["kavun", "qovun"], ["çilek", "qulupnay"], ["kiraz", "gilos"],
      ["domates", "pomidor"], ["salatalık", "bodring"], ["patates", "kartoshka"], ["soğan", "piyoz"],
      ["havuç", "sabzi"], ["limon", "limon"], ["sarımsak", "sarimsoq"]
    ] },
  { id: "restoran", tr: "Restoranda", uz: "Restoranda",
    tip: ["Halolmi?", "Turkiyada deyarli barcha taomlar halol. Ishonch hosil qilish uchun “Domuz eti var mı?” deb soʻrashingiz mumkin."],
    words: [
      ["menü", "menyu"], ["Bir kişilik masa var mı?", "Bir kishilik stol bormi?"], ["İki kişiyiz", "Ikki kishimiz"],
      ["Menüyü alabilir miyim?", "Menyuni bera olasizmi?"], ["Ne tavsiye edersiniz?", "Nimani tavsiya qilasiz?"],
      ["Ben … istiyorum", "Men … xohlayman"], ["Acı olmasın", "Achchiq boʻlmasin"], ["Domuz eti var mı?", "Choʻchqa goʻshti bormi?"],
      ["Helal mi?", "Halolmi?"], ["Çok lezzetli", "Juda mazali"], ["Paket yapar mısınız?", "Olib ketishga qadoqlab bera olasizmi?"],
      ["Kartla ödeyebilir miyim?", "Karta bilan toʻlasam boʻladimi?"], ["bahşiş", "choychaqa"], ["Su alabilir miyim?", "Suv bera olasizmi?"]
    ] },
  { id: "alisveris", tr: "Alışveriş", uz: "Xarid",
    tip: ["Savdolashish", "Bozorda (pazar) savdolashish mumkin, doʻkonda (mağaza) esa odatda yoʻq. “İndirim var mı?” — chegirma bormi?"],
    words: [
      ["mağaza", "doʻkon"], ["market", "oziq-ovqat doʻkoni"], ["para", "pul"], ["fiyat", "narx"], ["indirim", "chegirma"],
      ["fiş", "chek"], ["kasa", "kassa"], ["beden", "oʻlcham (kiyim)"], ["Daha ucuz var mı?", "Arzonrogʻi bormi?"],
      ["İndirim var mı?", "Chegirma bormi?"], ["Sadece bakıyorum", "Shunchaki qarayapman"], ["Bunu alıyorum", "Buni olaman"],
      ["Poşet ister misiniz?", "Paket kerakmi?"], ["nakit", "naqd pul"], ["kredi kartı", "bank kartasi"], ["Çok pahalı", "Juda qimmat"]
    ] },
  { id: "giysi", tr: "Giysiler", uz: "Kiyim-kechak",
    tip: ["Gömlek va elbise", "“Gömlek” — erkaklar koʻylagi, “elbise” — ayollar koʻylagi. Kiyib koʻrish uchun: “Bunu deneyebilir miyim?”"],
    words: [
      ["gömlek", "koʻylak (erkaklar)"], ["tişört", "futbolka"], ["pantolon", "shim"], ["etek", "yubka"], ["elbise", "koʻylak (ayollar)"],
      ["ceket", "pidjak, kurtka"], ["mont", "qishki kurtka"], ["ayakkabı", "poyabzal"], ["çorap", "paypoq"], ["şapka", "shlyapa, kepka"],
      ["kazak", "sviter"], ["atkı", "sharf"], ["eldiven", "qoʻlqop"], ["çanta", "sumka"], ["gözlük", "koʻzoynak"],
      ["Bunu deneyebilir miyim?", "Buni kiyib koʻrsam boʻladimi?"]
    ] },
  { id: "ulasim", tr: "Ulaşım", uz: "Transport",
    tip: ["Istanbulda", "Istanbulda avtobus, metro va parom (vapur) uchun bitta transport kartasi ishlatiladi. Bekat — “durak”."],
    words: [
      ["araba", "mashina"], ["taksi", "taksi"], ["metro", "metro"], ["tren", "poyezd"], ["uçak", "samolyot"],
      ["gemi", "kema"], ["vapur", "parom"], ["bisiklet", "velosiped"], ["durak", "bekat"], ["istasyon", "stansiya, vokzal"],
      ["bilet", "chipta"], ["yolcu", "yoʻlovchi"], ["Bu otobüs nereye gidiyor?", "Bu avtobus qayerga boradi?"],
      ["Bir bilet, lütfen", "Bitta chipta, iltimos"], ["Burada inebilir miyim?", "Shu yerda tushsam boʻladimi?"], ["Ne kadar sürer?", "Qancha vaqt oladi?"]
    ] },
  { id: "sehir2", tr: "Şehir", uz: "Shahar joylari",
    tip: ["Sokak va cadde", "“Sokak” — kichik koʻcha, “cadde” — katta koʻcha. Manzillarda ikkalasi ham uchraydi: İstiklal Caddesi."],
    words: [
      ["şehir", "shahar"], ["köy", "qishloq"], ["sokak", "koʻcha"], ["cadde", "katta koʻcha, prospekt"], ["meydan", "maydon"],
      ["park", "park"], ["hastane", "kasalxona"], ["eczane", "dorixona"], ["banka", "bank"], ["postane", "pochta"],
      ["okul", "maktab"], ["üniversite", "universitet"], ["cami", "masjid"], ["müze", "muzey"], ["restoran", "restoran"],
      ["köprü", "koʻprik"], ["plaj", "plyaj"]
    ] },
  { id: "yon", tr: "Yer ve yön", uz: "Joy va yoʻnalish",
    tip: ["Deyarli bir xil", "Üst — ust, alt — ost, ön — old, iç — ich, yan — yon. Kelishik ham bir xil: masanın üstünde — stolning ustida."],
    words: [
      ["üst", "ust"], ["alt", "ost"], ["ön", "old"], ["arka", "orqa"], ["yan", "yon"], ["iç", "ich"], ["dış", "tashqi"],
      ["yakın", "yaqin"], ["uzak", "uzoq"], ["karşı", "qarshi"], ["arasında", "orasida"], ["köşe", "burchak"],
      ["Masanın üstünde", "Stolning ustida"], ["Evin önünde", "Uyning oldida"], ["Çok uzak mı?", "Juda uzoqmi?"]
    ] },
  { id: "rutin", tr: "Günlük rutin", uz: "Kundalik ishlar",
    tip: ["Hozirgi zamon", "Kundalik ishlar haqida turklar -iyor zamonini ishlatadi: Saat yedide kalkıyorum — soat yettida turaman."],
    words: [
      ["uyanmak", "uygʻonmoq"], ["kalkmak", "turmoq"], ["yıkanmak", "yuvinmoq"], ["giyinmek", "kiyinmoq"], ["uyumak", "uxlamoq"],
      ["dinlenmek", "dam olmoq"], ["çalışmak", "ishlamoq; tirishib oʻqimoq"], ["başlamak", "boshlamoq"], ["bitirmek", "tugatmoq"],
      ["beklemek", "kutmoq"], ["dönmek", "qaytmoq"], ["yürümek", "yurmoq"], ["koşmak", "yugurmoq"], ["oturmak", "oʻtirmoq; yashamoq"],
      ["Saat yedide kalkıyorum", "Soat yettida turaman"]
    ] },
  { id: "fiil2", tr: "Fiiller 2", uz: "Feʼllar 2",
    tip: ["Etmek yordamchi feʼli", "Koʻp feʼllar “etmek” (qilmoq) bilan yasaladi: yardım etmek — yordam bermoq, teşekkür etmek — rahmat aytmoq."],
    words: [
      ["almak", "olmoq"], ["vermek", "bermoq"], ["açmak", "ochmoq"], ["kapamak", "yopmoq"], ["söylemek", "aytmoq"],
      ["sormak", "soʻramoq"], ["anlamak", "tushunmoq"], ["öğrenmek", "oʻrganmoq"], ["öğretmek", "oʻrgatmoq"], ["düşünmek", "oʻylamoq"],
      ["bulmak", "topmoq"], ["kaybetmek", "yoʻqotmoq"], ["satmak", "sotmoq"], ["ödemek", "toʻlamoq"], ["yardım etmek", "yordam bermoq"],
      ["dinlemek", "tinglamoq"], ["bakmak", "qaramoq"], ["aramak", "qidirmoq; qoʻngʻiroq qilmoq"]
    ] },
  { id: "duygu", tr: "Duygular", uz: "His-tuygʻular",
    tip: ["Aç va tok", "“Aç” — och, “tok” — toʻq. Ochlikni bildirish: Açım (ochman), Çok açım (juda ochman)."],
    words: [
      ["mutlu", "baxtli"], ["üzgün", "xafa"], ["yorgun", "charchagan"], ["aç", "och"], ["tok", "toʻq"],
      ["kızgın", "jahldor"], ["korkmuş", "qoʻrqqan"], ["heyecanlı", "hayajonlangan"], ["Sıkıldım", "Zerikdim"],
      ["Seni seviyorum", "Seni sevaman"], ["Özledim", "Sogʻindim"], ["Merak etme", "Xavotir olma"],
      ["Çok yorgunum", "Juda charchadim"], ["Canım sıkılıyor", "Kayfiyatim yoʻq, zerikyapman"]
    ] },
  { id: "hayvan", tr: "Hayvanlar", uz: "Hayvonlar",
    tip: ["Kurt — boʻri!", "Turkcha “kurt” — boʻri (oʻzbekcha “qurt” emas). Qurt-chuvalchang turkchada “solucan”."],
    words: [
      ["hayvan", "hayvon"], ["kedi", "mushuk"], ["köpek", "it"], ["at", "ot"], ["inek", "sigir"], ["koyun", "qoʻy"],
      ["kuş", "qush"], ["balık", "baliq"], ["arı", "ari"], ["ayı", "ayiq"], ["kurt", "boʻri", "Oʻzbekcha “qurt” emas!"],
      ["aslan", "sher"], ["deve", "tuya"], ["keçi", "echki"], ["fare", "sichqon"], ["tilki", "tulki"], ["yılan", "ilon"], ["eşek", "eshak"]
    ] },
  { id: "saglik", tr: "Sağlık", uz: "Sogʻliq",
    tip: ["Tez yordam: 112", "Turkiyada tez yordam, politsiya va oʻt oʻchiruvchilar uchun yagona raqam — 112."],
    words: [
      ["hasta", "kasal"], ["ağrı", "ogʻriq"], ["ateş", "isitma (harorat)"], ["öksürük", "yoʻtal"], ["grip", "gripp"],
      ["ilaç", "dori"], ["reçete", "retsept"], ["randevu", "qabulga yozilish"], ["ambulans", "tez yordam mashinasi"],
      ["alerji", "allergiya"], ["Başım ağrıyor", "Boshim ogʻriyapti"], ["Midem bulanıyor", "Koʻnglim aynayapti"],
      ["Doktora gitmem lazım", "Shifokorga borishim kerak"], ["Geçmiş olsun", "Tezroq tuzaling", "Kasal odamga aytiladi"], ["Acil!", "Shoshilinch!"]
    ] },
  { id: "telefon", tr: "Telefon ve internet", uz: "Telefon va internet",
    tip: ["Cep telefonu", "Mobil telefon turkchada “cep telefonu” — soʻzma-soʻz “choʻntak telefoni”. Qisqasi: “cep”."],
    words: [
      ["telefon", "telefon"], ["cep telefonu", "mobil telefon"], ["numara", "raqam"], ["mesaj", "xabar"], ["şarj", "zaryad"],
      ["internet", "internet"], ["şifre", "parol"], ["bilgisayar", "kompyuter"], ["ekran", "ekran"], ["uygulama", "ilova"],
      ["Wi-Fi şifresi ne?", "Wi-Fi paroli qanday?"], ["Şarjım bitti", "Zaryadim tugadi"], ["Seni arayacağım", "Senga qoʻngʻiroq qilaman"],
      ["Numaranı verir misin?", "Raqamingni berasanmi?"], ["Mesaj at", "Xabar yoz"]
    ] },
  { id: "sayi2", tr: "Sayılar 2", uz: "Sonlar va pul",
    tip: ["Birinci = birinchi", "Tartib son qoʻshimchasi -ıncı/-inci oʻzbekcha -inchi bilan bir xil. 1 lira = 100 kuruş."],
    words: [
      ["otuz", "30 — oʻttiz"], ["kırk", "40 — qirq"], ["altmış", "60 — oltmish"], ["yetmiş", "70 — yetmish"], ["seksen", "80 — sakson"],
      ["doksan", "90 — toʻqson"], ["iki yüz", "200 — ikki yuz"], ["milyon", "million"], ["birinci", "birinchi"], ["ikinci", "ikkinchi"],
      ["üçüncü", "uchinchi"], ["son", "oxirgi"], ["yarım", "yarim"], ["çeyrek", "chorak"], ["lira", "lira (Turkiya puli)"], ["kuruş", "kurush (1/100 lira)"]
    ] },
  { id: "isokul", tr: "İş ve okul", uz: "Ish va oʻqish",
    tip: ["Ders çalışmak", "“Dars tayyorlamoq” turkchada “ders çalışmak”. “Çalışmak” ham ishlash, ham oʻqib tayyorlanish degani."],
    words: [
      ["iş", "ish"], ["ders", "dars"], ["sınav", "imtihon"], ["ödev", "uy vazifasi"], ["sınıf", "sinf"], ["defter", "daftar"],
      ["silgi", "oʻchirgʻich"], ["maaş", "maosh"], ["patron", "xoʻjayin"], ["toplantı", "majlis, yigʻilish"], ["ofis", "ofis"],
      ["tatil", "taʼtil"], ["meslektaş", "hamkasb"], ["İşe gidiyorum", "Ishga ketyapman"], ["Ders çalışıyorum", "Dars tayyorlayapman"]
    ] },
  { id: "bayram", tr: "Bayramlar", uz: "Bayram va tabriklar",
    tip: ["Kutlu olsun", "Har qanday tabrikning qolipi: … kutlu olsun (… muborak boʻlsin). Bayramınız kutlu olsun!"],
    words: [
      ["bayram", "bayram, hayit"], ["Bayramınız kutlu olsun", "Bayramingiz muborak"], ["Doğum günün kutlu olsun", "Tugʻilgan kuning muborak"],
      ["Yeni yılınız kutlu olsun", "Yangi yilingiz muborak"], ["Tebrikler", "Tabriklayman"], ["Ramazan Bayramı", "Ramazon hayiti"],
      ["Kurban Bayramı", "Qurbon hayiti"], ["düğün", "toʻy"], ["nişan", "unashtiruv, fotiha"], ["hediye", "sovgʻa"],
      ["misafir", "mehmon"], ["davet", "taklif"], ["Başınız sağ olsun", "Boshingiz omon boʻlsin", "Taziya bildirishda aytiladi"],
      ["Allah'a emanet ol", "Xudoga omonat (xayrlashuv)"]
    ] }
];
