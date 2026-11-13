// Darajani aniqlash testi uchun alohida savollar banki (2026-11). Original savollar, kurs mashqlaridan mustaqil.
// Har daraja: r — oʻqish/grammatika (variantli; a — toʻgʻri variant raqami), w — yozish (bitta soʻz yoki shakl; "x / y" — bir nechta toʻgʻri javob),
// l — tinglab tushunish (B1–C1: gap eshittiriladi, maʼnosi oʻzbekcha variantlardan tanlanadi; a — toʻgʻri variant matni).
// Test har urinishda har darajadan 4 ta r, 2 ta w va 1 ta l ni tasodifiy tanlaydi; variantlar aralashtiriladi.
var PLB = {
  A1: {
    r: [
      { q: "Ben öğrenciyim. Sen de öğrenci ___?", o: ["misin", "mi", "musun", "miyim"], a: 0 },
      { q: "Kitabım ___? — Masanın üstünde.", o: ["nerede", "ne zaman", "kim", "kaç"], a: 0 },
      { q: "Selin her sabah kahvaltı ___.", o: ["yapar", "yaparım", "yaparsın", "yapıyorum"], a: 0 },
      { q: "Annem şu anda mutfakta yemek ___.", o: ["yapıyor", "yaptım", "yapacağım", "yaparız"], a: 0 },
      { q: "Saat kaç? — Saat üç___ çeyrek var.", o: ["e", "te", "de", "ten"], a: 0 },
      { q: "Benim iki kardeş___ var.", o: ["im", "in", "i", "imiz"], a: 0 },
      { q: "Ekmek almak için ___ gidiyorum.", o: ["fırına", "fırında", "fırından", "fırını"], a: 0 },
      { q: "Dün akşam sinemaya ___.", o: ["gittik", "gidiyoruz", "gideceğiz", "gideriz"], a: 0 },
      { q: "Kışın hava çok ___.", o: ["soğuk", "sıcak", "uzun", "genç"], a: 0 },
      { q: "Bu elma ___ lira? — On lira.", o: ["kaç", "ne", "hangi", "kim"], a: 0 }
    ],
    w: [
      { title: "Feʼlni toʻgʻri shaklda yozing (biz, hozirgi zamon)", q: "Biz her gün okula ___. (gitmek)", a: "gidiyoruz / gideriz" },
      { title: "Soʻzni egalik qoʻshimchasi bilan yozing", q: "Senin adın ne? — Benim ___ Kerem. (ad)", a: "adım" },
      { title: "Soʻzni qaratqich kelishigida yozing", q: "Kitaplar ___ üstünde. (masa)", a: "masanın" },
      { title: "Feʼlni oʻtgan zamonda yozing (men)", q: "Dün akşam film ___. (izlemek)", a: "izledim / seyrettim" }
    ]
  },
  A2: {
    r: [
      { q: "Yarın hava güzel olursa pikniğe ___.", o: ["gideceğiz", "gittik", "gidiyorduk", "gitmişiz"], a: 0 },
      { q: "Bu ev, eski evimiz___ daha büyük.", o: ["den", "de", "e", "i"], a: 0 },
      { q: "Türkçe öğrenmek ___ her gün çalışıyorum.", o: ["için", "gibi", "kadar", "ile"], a: 0 },
      { q: "Ben eve geldiğimde sen ne ___?", o: ["yapıyordun", "yapacaksın", "yaparsın", "yap"], a: 0 },
      { q: "Doktor bana daha çok su ___ söyledi.", o: ["içmemi", "içmek", "içtim", "içiyorum"], a: 0 },
      { q: "Bu filmi daha önce hiç ___.", o: ["izlemedim", "izlemiyorum", "izlemeyeceğim", "izlemem"], a: 0 },
      { q: "Kardeşim benden üç yaş ___.", o: ["küçük", "az", "alt", "geç"], a: 0 },
      { q: "Lütfen pencereyi ___ mısınız?", o: ["kapatır", "kapattı", "kapatacak", "kapatıyor"], a: 0 },
      { q: "Otobüsü kaçırdığım için işe ___ kaldım.", o: ["geç", "erken", "yavaş", "uzak"], a: 0 },
      { q: "Hafta sonları ne yapmayı ___?", o: ["seversin", "sevdin", "seveceksin", "sevmişsin"], a: 0 }
    ],
    w: [
      { title: "Feʼlni kelasi zamonda yozing (biz)", q: "Yarın sabah erken ___. (kalkmak)", a: "kalkacağız" },
      { title: "Qiyoslash uchun toʻgʻri shaklni yozing", q: "Bu çanta ___ daha ucuz. (o çanta)", a: "o çantadan" },
      { title: "Oʻtmishdagi odatni yozing (biz)", q: "Çocukken her yaz köye ___. (gitmek)", a: "giderdik / gidiyorduk" },
      { title: "Feʼlni kelasi zamonda yozing (men)", q: "Ders bitince seni ___. (aramak)", a: "arayacağım" }
    ]
  },
  B1: {
    r: [
      { q: "Ödevini ___ dışarı çıkamazsın.", o: ["bitirmeden", "bitirince", "bitirdikçe", "bitirerek"], a: 0 },
      { q: "Kitabı okudukça konuyu daha iyi ___.", o: ["anlıyorum", "anladım ki", "anlamadan", "anlasam"], a: 0 },
      { q: "Keşke dün akşam o kadar geç ___.", o: ["yatmasaydım", "yatmıyorum", "yatmayacağım", "yatmam"], a: 0 },
      { q: "Toplantının iptal ___ kimse bana söylemedi.", o: ["edildiğini", "ettiğini", "edeceğini", "etmesini"], a: 0 },
      { q: "Bu çorba çok tuzlu; aşçı tuzu fazla ___.", o: ["kaçırmış", "kaçıracak", "kaçırıyor", "kaçırmalı"], a: 0 },
      { q: "Hasta olduğu ___ işe geldi.", o: ["halde", "için", "kadar", "diye"], a: 0 },
      { q: "Mektubu ___ sonra postaneye gittim.", o: ["yazdıktan", "yazınca", "yazarken", "yazmadan"], a: 0 },
      { q: "Babam arabayı bana ___.", o: ["yıkattı", "yıkandı", "yıkanmış", "yıkanacak"], a: 0 },
      { q: "Ne kadar çok çalışırsan o kadar başarılı ___.", o: ["olursun", "oldun", "olsan", "olmuşsun"], a: 0 },
      { q: "Gelecek ay bu zamanlar tatilde ___.", o: ["olacağız", "olduk", "oluyorduk", "olmuştuk"], a: 0 }
    ],
    w: [
      { title: "Feʼlni «-madan» shaklida yozing", q: "Eve ___ yağmur başladı. (varmak)", a: "varmadan" },
      { title: "Feʼlni majhul nisbatda, oʻtgan zamonda yozing", q: "Bu mektup dün ___. (yazmak)", a: "yazıldı" },
      { title: "Afsusni ifodalang (men, oʻtgan zamon shart)", q: "Keşke daha çok ___. (çalışmak)", a: "çalışsaydım" },
      { title: "Feʼlni «-ıp» ravishdoshi bilan yozing", q: "Kardeşim kapıyı açık ___ gitmiş. (bırakmak)", a: "bırakıp" }
    ],
    l: [
      { t: "Toplantı yarın değil, cuma günü saat ikide yapılacak.", o: ["Yigʻilish juma kuni soat ikkida boʻladi", "Yigʻilish ertaga soat ikkida boʻladi", "Yigʻilish juma kuni ertalab boʻladi", "Yigʻilish bekor qilindi"], a: "Yigʻilish juma kuni soat ikkida boʻladi" },
      { t: "Kiralık ev aradığımızı öğrenince bize kendi evini önerdi.", o: ["Ijaraga uy izlayotganimizni bilib, oʻz uyini taklif qildi", "Bizga yangi uy sotib olishni maslahat berdi", "Uyini sotmoqchi ekanini aytdi", "Biz unga uyimizni ijaraga berdik"], a: "Ijaraga uy izlayotganimizni bilib, oʻz uyini taklif qildi" },
      { t: "Doktor ilacı yemekten sonra, günde iki kez içmemi söyledi.", o: ["Dorini ovqatdan keyin kuniga ikki marta ichish kerak", "Dorini ovqatdan oldin ichish kerak", "Dorini kuniga bir marta ichish kerak", "Doktor dorini ichishni taqiqladi"], a: "Dorini ovqatdan keyin kuniga ikki marta ichish kerak" }
    ]
  },
  B2: {
    r: [
      { q: "Sınav sonuçları açıklanır açıklanmaz herkes panoya ___.", o: ["koştu", "koşarken", "koşmadan", "koşalı"], a: 0 },
      { q: "Raporu yarına kadar bitirmemiz ___; yoksa proje gecikecek.", o: ["gerekiyor", "gerekse", "gerekeli", "gerekircesine"], a: 0 },
      { q: "Kendisine defalarca anlatılmasına ___, aynı hatayı yine yaptı.", o: ["rağmen", "göre", "dair", "doğru"], a: 0 },
      { q: "Komşumuz, sanki bizi hiç ___ gibi yanımızdan geçip gitti.", o: ["tanımıyormuş", "tanımamak", "tanımasın", "tanımayalı"], a: 0 },
      { q: "Uzmanların görüşüne ___ böyle bir karar vermek doğru olmaz.", o: ["başvurmadan", "başvurarak", "başvurdukça", "başvurunca"], a: 0 },
      { q: "O gün trene ___, şimdi burada olmazdım.", o: ["yetişmeseydim", "yetişmezsem", "yetişmiyorsam", "yetişmeyince"], a: 0 },
      { q: "Yönetmelik, çalışanların yıllık izinlerini iki parçaya ___ izin veriyor.", o: ["bölmelerine", "bölmeleri", "bölerek", "bölünce"], a: 0 },
      { q: "Öyle yorgundum ___ ayakta uyuyacaktım.", o: ["ki", "de", "ise", "mi"], a: 0 },
      { q: "Proje, bütçenin yetersiz ___ ertelendi.", o: ["olması nedeniyle", "olmasına rağmen", "olduğu halde", "olsa bile"], a: 0 },
      { q: "Uzun süredir görüşmediğimiz ___, onu hemen tanıdım.", o: ["halde", "için", "diye", "üzere"], a: 0 }
    ],
    w: [
      { title: "Feʼlni «-dığı» shaklida yozing", q: "Hasta ___ halde işe geldi. (olmak)", a: "olduğu" },
      { title: "Orttirma nisbat, oʻtgan zamon", q: "Öğretmen öğrencilere kompozisyon ___. (yazmak)", a: "yazdırdı" },
      { title: "«-ır -maz» qolipida yozing (ikki soʻz)", q: "Haber ___ herkes sevinçle bağırdı. (duyulmak)", a: "duyulur duyulmaz" },
      { title: "Shart maylida yozing (men)", q: "Ne kadar ___ da onu ikna edemedim. (anlatmak)", a: "anlatsam" }
    ],
    l: [
      { t: "Biletler tükenmeseydi konsere biz de giderdik.", o: ["Chiptalar tugab qolgani uchun konsertga bormadik", "Konsertga borib, chipta oldik", "Chiptalar arzon boʻlgani uchun bordik", "Konsert bekor qilingan edi"], a: "Chiptalar tugab qolgani uchun konsertga bormadik" },
      { t: "Projenin ertelenmesi, ekibin değil, tedarikçinin hatasından kaynaklandı.", o: ["Loyiha yetkazib beruvchining aybi bilan kechikdi", "Loyiha jamoaning xatosi bilan kechikdi", "Loyiha muddatidan oldin tugadi", "Yetkazib beruvchi loyihani maqtadi"], a: "Loyiha yetkazib beruvchining aybi bilan kechikdi" },
      { t: "Ne kadar ısrar etsek de fikrini değiştiremedik.", o: ["Qancha turib olsak ham, fikrini oʻzgartira olmadik", "Biroz turib olganimizdan keyin fikrini oʻzgartirdi", "U bizning fikrimizni oʻzgartirdi", "Biz unga hech narsa demadik"], a: "Qancha turib olsak ham, fikrini oʻzgartira olmadik" }
    ]
  },
  C1: {
    r: [
      { q: "Eleştirmenler, yazarın gereksiz süslerden arınmış ___ üslubunu övüyor.", o: ["yalın", "karmaşık", "ağdalı", "süslü"], a: 0 },
      { q: "Araştırma bulguları, hipotezi ___ nitelikte değildir; ek veriye ihtiyaç vardır.", o: ["doğrulayacak", "doğruladığı", "doğrulanmış", "doğrulayalı"], a: 0 },
      { q: "Kararın alınmasında kamuoyu baskısının ___ yadsınamaz.", o: ["etkisi", "etkili", "etkin", "etkileyici"], a: 0 },
      { q: "Göç olgusu, yalnızca ekonomik nedenlere ___ açıklanamaz; kültürel boyutu da hesaba katılmalıdır.", o: ["indirgenerek", "indirgeyince", "indirgendikçe", "indirgeyeli"], a: 0 },
      { q: "Ne kadar uğraşsa ___, bu alışkanlığından vazgeçemedi.", o: ["da", "ki", "mi", "ise"], a: 0 },
      { q: "Söz konusu düzenleme, ilk bakışta masum ___, uzun vadede ciddi sonuçlar doğurabilir.", o: ["görünse de", "göründüğü için", "görününce", "görünerek"], a: 0 },
      { q: "«Kentlerin hızla büyümesi yeşil alanların aleyhine işliyor; yetkililer ise bu durumu çoğu zaman “kalkınma” sözcüğüyle meşrulaştırıyor.» Yazarın tutumu nedir?", o: ["Eleştirel", "Tarafsız", "Övücü", "Kayıtsız"], a: 0 },
      { q: "«Ateş olmayan yerden duman çıkmaz.» sözü neyi anlatır?", o: ["Her söylentinin bir dayanağı vardır.", "Yangınlara karşı dikkatli olmak gerekir.", "Sabırlı olan sonunda kazanır.", "Az konuşan çok şey öğrenir."], a: 0 },
      { q: "Toplantıda öne sürülen görüşler birbiriyle ___; bu yüzden bir uzlaşmaya varılamadı.", o: ["çelişiyordu", "örtüşüyordu", "bağdaşıyordu", "uyuşuyordu"], a: 0 },
      { q: "Uzmanlar, hiçbir kanıt ___ ortaya atılan bu iddiaların ciddiye alınmaması gerektiğini vurguluyor.", o: ["gösterilmeksizin", "gösterilerek", "gösterildikçe", "gösterilince"], a: 0 }
    ],
    w: [
      { title: "Feʼlni «-maksızın» shaklida yozing", q: "Hiçbir açıklama ___ toplantıyı terk etti. (yapmak)", a: "yapmaksızın" },
      { title: "Feʼlni «-mışçasına» shaklida yozing", q: "Sanki her şeyi o ___ konuşuyordu. (bilmek)", a: "biliyormuşçasına / bilirmişçesine / bilmişçesine" },
      { title: "Harakat nomi + kelishik bilan yozing", q: "Sorunun çözümü, tarafların uzlaşmaya ___ bağlıdır. (varmak)", a: "varmasına" },
      { title: "Majhul nisbat, inkor, «-dığı» shakli", q: "Kurallara ___ takdirde ceza uygulanacaktır. (uymak)", a: "uyulmadığı" }
    ],
    l: [
      { t: "Uzmanlar, verilerin yetersizliğini gerekçe göstererek kesin bir yargıya varmaktan kaçındı.", o: ["Mutaxassislar maʼlumot yetishmasligi sababli aniq xulosa chiqarmadi", "Mutaxassislar aniq va qatʼiy xulosa chiqardi", "Mutaxassislar maʼlumotlarni yashirdi", "Mutaxassislar yangi tadqiqotni rad etdi"], a: "Mutaxassislar maʼlumot yetishmasligi sababli aniq xulosa chiqarmadi" },
      { t: "Yazarın son romanı, ilk okumada sade görünse de katmanlı bir anlatıya sahip.", o: ["Roman sodda koʻrinsa ham, koʻp qatlamli hikoyaga ega", "Roman juda murakkab va tushunarsiz", "Bu muallifning birinchi romani", "Romanni bir marta oʻqish kifoya"], a: "Roman sodda koʻrinsa ham, koʻp qatlamli hikoyaga ega" },
      { t: "Kararın aceleyle alındığı, sonradan ortaya çıkan aksaklıklardan anlaşılıyor.", o: ["Keyin chiqqan nuqsonlar qaror shoshilib qabul qilinganini koʻrsatadi", "Qaror uzoq muhokamadan keyin qabul qilindi", "Nuqsonlar qarordan oldin aniqlangan edi", "Qaror hech qanday muammo tugʻdirmadi"], a: "Keyin chiqqan nuqsonlar qaror shoshilib qabul qilinganini koʻrsatadi" }
    ]
  }
};
