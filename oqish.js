/* Oʻqish matnlari (Okuma): A1–C1, har birida lugʻat va 4 ta savol. Hammasi original matnlar.
   { id, lv, tr: sarlavha, uz: tarjima, text: abzaslar (\n\n), gloss: [[turkcha, oʻzbekcha]], q: [{ q, o: [4 variant], a: toʻgʻri variant indeksi }] } */
var OQ = [
  {
    id: "aile", lv: "A1", tr: "Benim Ailem", uz: "Mening oilam",
    text: "Merhaba! Benim adım Ali. Ben on iki yaşındayım ve Taşkent'te yaşıyorum.\n\nBenim ailem büyük. Annem öğretmen, babam doktor. Bir ablam ve bir küçük kardeşim var. Ablamın adı Leyla. O on sekiz yaşında ve üniversitede okuyor. Kardeşimin adı Emir. O beş yaşında.\n\nBizim bir kedimiz de var. Kedimizin adı Tekir. Tekir gri ve çok tatlı. Akşamları hep birlikte yemek yiyoruz ve sohbet ediyoruz.",
    gloss: [["aile", "oila"], ["abla", "opa"], ["küçük kardeş", "uka, singil"], ["yaşamak", "yashamoq"], ["birlikte", "birga"], ["sohbet etmek", "suhbatlashmoq"]],
    q: [
      { q: "Ali kaç yaşında?", o: ["On iki", "On sekiz", "Beş", "On"], a: 0 },
      { q: "Ali'nin annesi ne iş yapıyor?", o: ["Doktor", "Öğretmen", "Öğrenci", "Aşçı"], a: 1 },
      { q: "Leyla nerede okuyor?", o: ["Lisede", "İlkokulda", "Üniversitede", "Kursta"], a: 2 },
      { q: "Akşamları aile ne yapıyor?", o: ["Televizyon izliyor", "Birlikte yemek yiyor", "Parkta yürüyor", "Kitap okuyor"], a: 1 }
    ]
  },
  {
    id: "gunum", lv: "A1", tr: "Bir Günüm", uz: "Mening bir kunim",
    text: "Ben her sabah saat yedide kalkarım. Önce yüzümü yıkarım, sonra kahvaltı yaparım. Kahvaltıda peynir, zeytin, ekmek ve yumurta yerim. Bir bardak çay içerim.\n\nSaat sekizde evden çıkarım. İşe otobüsle giderim. Ben bir bankada çalışırım. Öğle yemeğini iş arkadaşlarımla yerim.\n\nSaat beşte işten çıkarım. Akşam eve dönerim, yemek pişiririm ve biraz kitap okurum. Saat on birde yatarım.",
    gloss: [["kalkmak", "turmoq (uyqudan)"], ["yıkamak", "yuvmoq"], ["kahvaltı", "nonushta"], ["çıkmak", "chiqmoq"], ["pişirmek", "pishirmoq"], ["yatmak", "yotmoq"]],
    q: [
      { q: "Saat kaçta kalkıyor?", o: ["Altıda", "Yedide", "Sekizde", "Dokuzda"], a: 1 },
      { q: "Kahvaltıda ne içiyor?", o: ["Kahve", "Süt", "Çay", "Meyve suyu"], a: 2 },
      { q: "İşe nasıl gidiyor?", o: ["Yürüyerek", "Arabayla", "Metroyla", "Otobüsle"], a: 3 },
      { q: "Nerede çalışıyor?", o: ["Okulda", "Bankada", "Hastanede", "Mağazada"], a: 1 }
    ]
  },
  {
    id: "pazar", lv: "A1", tr: "Pazarda", uz: "Bozorda",
    text: "Bugün cumartesi. Zeynep Hanım pazara gidiyor. Pazar çok kalabalık.\n\nZeynep Hanım önce domates ve salatalık alıyor. Bir kilo domates otuz lira. Sonra meyve tezgâhına gidiyor. Elmalar çok güzel ama biraz pahalı. Zeynep Hanım iki kilo portakal alıyor, çünkü portakal ucuz.\n\nSatıcı ona \"Afiyet olsun!\" diyor. Zeynep Hanım çok mutlu, çünkü akşam misafirleri var.",
    gloss: [["kalabalık", "gavjum"], ["tezgâh", "rasta, peshtaxta"], ["pahalı", "qimmat"], ["ucuz", "arzon"], ["satıcı", "sotuvchi"], ["misafir", "mehmon"]],
    q: [
      { q: "Bugün hangi gün?", o: ["Pazar", "Cumartesi", "Cuma", "Pazartesi"], a: 1 },
      { q: "Bir kilo domates kaç lira?", o: ["Yirmi", "Otuz", "Kırk", "On"], a: 1 },
      { q: "Zeynep Hanım neden portakal alıyor?", o: ["Elma yok", "Portakal ucuz", "Satıcı istiyor", "Portakal büyük"], a: 1 },
      { q: "Akşam ne var?", o: ["Toplantı", "Misafirler", "Ders", "Konser"], a: 1 }
    ]
  },
  {
    id: "tatil", lv: "A2", tr: "Tatil Planı", uz: "Taʼtil rejasi",
    text: "Geçen hafta Murat ve arkadaşı Selin yaz tatili için plan yaptılar. Murat denize gitmek istiyordu, ama Selin dağları daha çok seviyordu.\n\nSonunda ikisi de Karadeniz'e gitmeye karar verdiler, çünkü orada hem deniz hem de yeşil dağlar var. Otobüs biletlerini internetten aldılar. Küçük bir pansiyonda üç gece kalacaklar.\n\nSelin yaylada yürüyüş yapmak istiyor, Murat ise balık tutmayı planlıyor. Akşamları Karadeniz'in meşhur yemeklerini deneyecekler.",
    gloss: [["karar vermek", "qaror qilmoq"], ["bilet", "chipta"], ["pansiyon", "kichik mehmonxona"], ["yayla", "togʻ yaylovi"], ["balık tutmak", "baliq tutmoq"], ["meşhur", "mashhur"]],
    q: [
      { q: "Murat nereye gitmek istiyordu?", o: ["Dağa", "Denize", "Şehre", "Köye"], a: 1 },
      { q: "Neden Karadeniz'i seçtiler?", o: ["Ucuz olduğu için", "Hem deniz hem dağ olduğu için", "Akrabaları orada olduğu için", "Uçak bileti bulamadıkları için"], a: 1 },
      { q: "Kaç gece kalacaklar?", o: ["İki", "Üç", "Dört", "Beş"], a: 1 },
      { q: "Murat ne yapmayı planlıyor?", o: ["Yürüyüş yapmayı", "Balık tutmayı", "Yüzmeyi", "Resim yapmayı"], a: 1 }
    ]
  },
  {
    id: "yeniev", lv: "A2", tr: "Yeni Ev", uz: "Yangi uy",
    text: "Aylin geçen ay yeni bir eve taşındı. Eski evi şehir merkezindeydi ve çok gürültülüydü. Yeni evi daha sessiz bir mahallede. Evin iki odası, geniş bir mutfağı ve küçük bir balkonu var. Aylin balkona çiçekler koydu.\n\nKomşuları çok cana yakın. Taşındığı ilk gün yan komşusu ona bir tabak börek getirdi. Aylin de ertesi gün komşusunu çaya davet etti. Şimdi her cuma birlikte çay içiyorlar.\n\nTek sorun şu: Yeni ev işine biraz uzak. Bu yüzden Aylin her sabah daha erken kalkıyor.",
    gloss: [["taşınmak", "koʻchib oʻtmoq"], ["gürültülü", "shovqinli"], ["sessiz", "jimjit"], ["mahalle", "mahalla"], ["cana yakın", "samimiy, yoqimli"], ["davet etmek", "taklif qilmoq"]],
    q: [
      { q: "Eski ev neredeydi?", o: ["Köyde", "Şehir merkezinde", "Deniz kenarında", "Üniversitenin yanında"], a: 1 },
      { q: "Yeni evde kaç oda var?", o: ["Bir", "İki", "Üç", "Dört"], a: 1 },
      { q: "Komşu ilk gün ne getirdi?", o: ["Çiçek", "Börek", "Çay", "Kek"], a: 1 },
      { q: "Yeni evin sorunu ne?", o: ["Çok gürültülü", "Çok pahalı", "İşe uzak", "Çok küçük"], a: 2 }
    ]
  },
  {
    id: "doktor", lv: "A2", tr: "Doktorda", uz: "Shifokorda",
    text: "Dün sabah Kerem'in boğazı ağrıyordu ve biraz ateşi vardı. Annesi onu doktora götürdü.\n\nDoktor Kerem'i muayene etti ve \"Grip olmuşsun\" dedi. Ona bir şurup ve bazı vitaminler verdi. \"Üç gün evde dinlen, bol su iç ve sıcak çorba ye\" dedi.\n\nKerem okula gidemeyeceği için biraz üzüldü, çünkü cuma günü futbol maçı vardı. Ama annesi \"Önce sağlık\" dedi. Kerem bugün kendini daha iyi hissediyor.",
    gloss: [["boğaz", "tomoq"], ["ateş", "isitma, harorat"], ["muayene etmek", "koʻrikdan oʻtkazmoq"], ["şurup", "sharbat dori"], ["dinlenmek", "dam olmoq"], ["sağlık", "sogʻliq"]],
    q: [
      { q: "Kerem'in nesi ağrıyordu?", o: ["Başı", "Boğazı", "Karnı", "Dişi"], a: 1 },
      { q: "Doktor ne dedi?", o: ["Grip olmuş", "Kolu kırılmış", "Hiç hasta değil", "Hastanede kalmalı"], a: 0 },
      { q: "Kerem kaç gün evde dinlenecek?", o: ["Bir", "İki", "Üç", "Beş"], a: 2 },
      { q: "Kerem neden üzüldü?", o: ["İlaç acı", "Futbol maçını kaçıracak", "Doktordan korkuyor", "Çorbayı sevmiyor"], a: 1 }
    ]
  },
  {
    id: "uzaktan", lv: "B1", tr: "Evden Çalışmak", uz: "Uydan ishlash",
    text: "Son yıllarda pek çok şirket çalışanlarına evden çalışma imkânı sunuyor. Bu durumun hem avantajları hem de dezavantajları var.\n\nEvden çalışan kişiler trafikte zaman kaybetmiyor ve çalışma saatlerini daha esnek bir şekilde planlayabiliyor. Ayrıca yol masrafı da azalıyor. Öte yandan bazı çalışanlar kendilerini yalnız hissettiklerini söylüyor. İş ile özel hayat arasındaki sınır da bulanıklaşabiliyor: İnsanlar akşam geç saatlere kadar e-postalarına bakmaya devam ediyor.\n\nUzmanlara göre evden çalışırken düzenli molalar vermek, ayrı bir çalışma köşesi oluşturmak ve iş bitince bilgisayarı kapatmak çok önemli.",
    gloss: [["imkân", "imkoniyat"], ["esnek", "moslashuvchan"], ["masraf", "xarajat"], ["öte yandan", "boshqa tomondan"], ["bulanıklaşmak", "xiralashmoq, aniq boʻlmay qolmoq"], ["mola", "tanaffus"]],
    q: [
      { q: "Metne göre evden çalışmanın avantajı hangisi değildir?", o: ["Trafikte zaman kaybetmemek", "Esnek çalışma saatleri", "Yol masrafının azalması", "Daha yüksek maaş"], a: 3 },
      { q: "Bazı çalışanlar neden şikâyet ediyor?", o: ["Kendilerini yalnız hissediyorlar", "İnternetleri yavaş", "Patronları kızgın", "Evleri küçük"], a: 0 },
      { q: "\"Sınır bulanıklaşıyor\" ne anlama geliyor?", o: ["İş ve özel hayat birbirine karışıyor", "Çalışanlar işi bırakıyor", "Şirketler kapanıyor", "İnsanlar daha az çalışıyor"], a: 0 },
      { q: "Uzmanlar ne öneriyor?", o: ["Hiç mola vermemeyi", "Ayrı bir çalışma köşesi oluşturmayı", "Gece çalışmayı", "Her gün ofise gitmeyi"], a: 1 }
    ]
  },
  {
    id: "sosyal", lv: "B1", tr: "Sosyal Medya ve Gençler", uz: "Ijtimoiy tarmoqlar va yoshlar",
    text: "Bir araştırmaya göre gençler günde ortalama dört saatini sosyal medyada geçiriyor. Sosyal medya, arkadaşlarla iletişim kurmak ve yeni şeyler öğrenmek için faydalı olabilir.\n\nAncak çok fazla kullanıldığında uyku düzenini bozabilir ve dikkat süresini kısaltabilir. Bazı gençler, başkalarının paylaştığı \"mükemmel\" hayatları gördükçe kendi hayatlarından memnun olmadıklarını ifade ediyor.\n\nPsikologlar, telefonu yatmadan en az bir saat önce bırakmayı ve günlük kullanım süresini takip etmeyi tavsiye ediyor. Böylece sosyal medya bir zaman hırsızı değil, faydalı bir araç olabilir.",
    gloss: [["araştırma", "tadqiqot"], ["ortalama", "oʻrtacha"], ["faydalı", "foydali"], ["dikkat süresi", "diqqat davomiyligi"], ["memnun olmak", "mamnun boʻlmoq"], ["tavsiye etmek", "tavsiya qilmoq"]],
    q: [
      { q: "Gençler günde ortalama kaç saat sosyal medyada?", o: ["İki", "Üç", "Dört", "Altı"], a: 2 },
      { q: "Aşırı kullanımın etkisi hangisidir?", o: ["Uyku düzeni bozulabilir", "Notlar yükselir", "Daha çok spor yapılır", "Göz rengi değişir"], a: 0 },
      { q: "Bazı gençler neden mutsuz?", o: ["Başkalarının mükemmel görünen hayatlarını görüyorlar", "İnternet pahalı", "Telefonları eski", "Arkadaşları yok"], a: 0 },
      { q: "Psikologlar ne tavsiye ediyor?", o: ["Telefonu tamamen atmayı", "Yatmadan önce telefonu bırakmayı", "Gece geç yatmayı", "Daha çok paylaşım yapmayı"], a: 1 }
    ]
  },
  {
    id: "istanbul", lv: "B1", tr: "İstanbul'dan Bir Mektup", uz: "Istanbuldan maktub",
    text: "Sevgili Dilnoza,\n\nİstanbul'dan selamlar! Dün sabah erkenden Sultanahmet'e gittim. Ayasofya'yı ve Topkapı Sarayı'nı gezdim. Sarayda o kadar çok tarihî eser vardı ki saatlerin nasıl geçtiğini anlamadım.\n\nÖğleden sonra vapurla Asya yakasına, Kadıköy'e geçtim. Vapurda simit alıp martılara attım; çok eğlenceliydi. Kadıköy çarşısında baharat ve lokum aldım, senin için de küçük bir hediye seçtim. Akşam Moda sahilinde gün batımını izledim.\n\nEğer bir gün buraya gelirsen sana mutlaka eşlik ederim.\n\nSevgilerle,\nMalika",
    gloss: [["gezmek", "aylanmoq, tomosha qilmoq"], ["tarihî eser", "tarixiy obida"], ["vapur", "parom, kema"], ["martı", "chagʻalay"], ["gün batımı", "quyosh botishi"], ["eşlik etmek", "hamroh boʻlmoq"]],
    q: [
      { q: "Malika sabah nereye gitti?", o: ["Kadıköy'e", "Sultanahmet'e", "Moda'ya", "Taksim'e"], a: 1 },
      { q: "Asya yakasına nasıl geçti?", o: ["Metroyla", "Otobüsle", "Vapurla", "Taksiyle"], a: 2 },
      { q: "Kadıköy'de ne aldı?", o: ["Kitap", "Baharat ve lokum", "Kıyafet", "Saat"], a: 1 },
      { q: "Akşam ne yaptı?", o: ["Müzeye gitti", "Gün batımını izledi", "Sinemaya gitti", "Otelde dinlendi"], a: 1 }
    ]
  },
  {
    id: "kahve", lv: "B2", tr: "Bir Fincan Kahve", uz: "Bir piyola qahva",
    text: "Türk kahvesi yalnızca bir içecek değil, aynı zamanda köklü bir sosyal gelenektir. Kahvenin 16. yüzyılda İstanbul'a ulaşmasıyla birlikte şehirde ilk kahvehaneler açılmış ve bu mekânlar kısa sürede insanların bir araya gelip sohbet ettiği, haberleri paylaştığı yerlere dönüşmüştür.\n\nTürk kahvesinin hazırlanışı da kendine özgüdür: Çok ince öğütülmüş kahve, soğuk su ve isteğe göre şekerle birlikte cezvede yavaş yavaş pişirilir. Köpüğü ise iyi bir kahvenin en önemli göstergesi sayılır.\n\n\"Bir fincan kahvenin kırk yıl hatırı vardır\" atasözü, kahvenin dostluk ve misafirperverlikle ne kadar iç içe olduğunu gösterir. Türk kahvesi kültürü ve geleneği, 2013 yılında UNESCO'nun Somut Olmayan Kültürel Miras listesine alınmıştır.",
    gloss: [["köklü", "tomiri chuqur, qadimiy"], ["gelenek", "anʼana"], ["kendine özgü", "oʻziga xos"], ["öğütülmüş", "maydalangan, tuyilgan"], ["gösterge", "koʻrsatkich, belgi"], ["hatır", "hurmat, eʼtibor"]],
    q: [
      { q: "Kahve İstanbul'a ne zaman ulaşmış?", o: ["14. yüzyılda", "16. yüzyılda", "18. yüzyılda", "20. yüzyılda"], a: 1 },
      { q: "Kahvehaneler neye dönüşmüştür?", o: ["Sohbet edilen ve haberlerin paylaşıldığı yerlere", "Pazar yerlerine", "Okullara", "Kütüphanelere"], a: 0 },
      { q: "Metne göre iyi bir kahvenin göstergesi nedir?", o: ["Rengi", "Köpüğü", "Fiyatı", "Fincanı"], a: 1 },
      { q: "Atasözü neyi vurgular?", o: ["Kahvenin pahalı olduğunu", "Kahvenin dostlukla bağını", "Kahvenin sağlığa zararını", "Kahvenin acı olduğunu"], a: 1 }
    ]
  },
  {
    id: "yapayzeka", lv: "B2", tr: "Yapay Zekâ ve Dil Öğrenimi", uz: "Sunʼiy intellekt va til oʻrganish",
    text: "Yapay zekâ destekli uygulamalar, dil öğrenme biçimimizi hızla değiştiriyor. Artık öğrenciler, telaffuzlarını anında değerlendiren ya da yazdıkları metinlerdeki hataları açıklayan araçlara kolayca ulaşabiliyor. Bu teknolojiler, özellikle bir öğretmene düzenli olarak erişimi olmayan öğrenciler için büyük bir fırsat sunuyor.\n\nBununla birlikte uzmanlar bazı noktalara dikkat çekiyor: Makine çevirisine fazla güvenmek, öğrencinin kendi cümlelerini kurma becerisini zayıflatabilir. Ayrıca dil yalnızca kelimelerden ve kurallardan ibaret değildir; kültürel bağlam, mimikler ve gerçek insanlarla kurulan iletişim de öğrenmenin ayrılmaz bir parçasıdır.\n\nBu nedenle en verimli yöntemin, teknolojiyi gerçek konuşma pratiğiyle dengelemek olduğu düşünülüyor.",
    gloss: [["destekli", "yordamida, qoʻllab-quvvatlanadigan"], ["değerlendirmek", "baholamoq"], ["erişim", "kirish imkoni"], ["beceri", "koʻnikma"], ["ibaret olmak", "iborat boʻlmoq"], ["dengelemek", "muvozanatlamoq"]],
    q: [
      { q: "Metne göre bu araçlar kimler için özellikle bir fırsattır?", o: ["Öğretmene düzenli erişimi olmayanlar için", "Sadece çocuklar için", "Profesyonel çevirmenler için", "Yazılımcılar için"], a: 0 },
      { q: "Makine çevirisine fazla güvenmenin riski nedir?", o: ["Telefonun bozulması", "Cümle kurma becerisinin zayıflaması", "Kelime sayısının artması", "Daha hızlı öğrenme"], a: 1 },
      { q: "Metne göre dil neyden ibaret değildir?", o: ["Sadece kelime ve kurallardan", "Sadece kültürden", "Sadece mimiklerden", "Sadece konuşmadan"], a: 0 },
      { q: "En verimli yöntem nedir?", o: ["Sadece uygulama kullanmak", "Teknolojiyi gerçek konuşma pratiğiyle dengelemek", "Sadece kitap okumak", "Hiç teknoloji kullanmamak"], a: 1 }
    ]
  },
  {
    id: "gonullu", lv: "B2", tr: "Gönüllülük", uz: "Koʻngillilik",
    text: "Son yıllarda gönüllülük faaliyetlerine katılan gençlerin sayısı belirgin bir şekilde artıyor. Gençler; ağaç dikme kampanyalarından yaşlıları ziyaret etmeye, çocuklara ücretsiz ders vermekten sokak hayvanlarını beslemeye kadar pek çok alanda zamanlarını gönüllü olarak paylaşıyor.\n\nAraştırmalar, gönüllü çalışmanın yalnızca topluma değil, gönüllünün kendisine de fayda sağladığını ortaya koyuyor: Gönüllüler yeni insanlarla tanışıyor, takım çalışması ve iletişim gibi becerilerini geliştiriyor; üstelik bu deneyimler iş başvurularında da avantaj sağlıyor.\n\nYine de uzmanlar, gönüllülüğün sürdürülebilir olması için kişinin kendi gücünü ve zamanını gerçekçi bir şekilde planlaması gerektiğini vurguluyor. Aksi takdirde kısa sürede tükenmişlik yaşanabileceğini belirtiyorlar.",
    gloss: [["faaliyet", "faoliyat"], ["belirgin", "sezilarli"], ["fayda sağlamak", "foyda keltirmoq"], ["üstelik", "buning ustiga"], ["sürdürülebilir", "barqaror, davomli"], ["tükenmişlik", "charchab qolish, kuyib qolish"]],
    q: [
      { q: "Metinde hangi gönüllülük örneği yoktur?", o: ["Ağaç dikmek", "Yaşlıları ziyaret etmek", "Çocuklara ders vermek", "Ev inşa etmek"], a: 3 },
      { q: "Gönüllülük gönüllüye ne kazandırır?", o: ["Yeni beceriler ve tanışıklıklar", "Yüksek maaş", "Ücretsiz tatil", "Diploma"], a: 0 },
      { q: "Tükenmişlik hangi durumda yaşanabilir?", o: ["Kişi gücünü ve zamanını gerçekçi planlamazsa", "Kişi çok uyursa", "Kişi hiç gönüllü olmazsa", "Kişi yalnız çalışırsa"], a: 0 },
      { q: "Metnin ana fikri nedir?", o: ["Gönüllülük artıyor ve hem topluma hem gönüllüye fayda sağlıyor", "Gençler çalışmak istemiyor", "Gönüllülük zararlıdır", "Sadece yaşlılar gönüllü oluyor"], a: 0 }
    ]
  },
  {
    id: "unutmak", lv: "C1", tr: "Unutmanın faydası", uz: "Unutishning foydasi",
    text: "Unutkanlıktan yakınmayan yoktur. Bir ismi hatırlayamadığımızda ya da anahtarı nereye koyduğumuzu bulamadığımızda belleğimizin bizi yarı yolda bıraktığını düşünürüz. Oysa sinirbilimciler, unutmanın bir kusur değil, sağlıklı bir belleğin vazgeçilmez işlevi olduğunu ileri sürmektedir.\n\nBeyin, karşılaştığı her ayrıntıyı saklasaydı önemli olanla önemsiz olanı ayırt edemezdi. Dün öğle yemeğinde ne yediğimizi unutmamız, bugünkü toplantının saatini hatırlamamızı kolaylaştırır. Araştırmalar, beynin uyku sırasında gün içinde edinilen bilgileri elediğini, sık kullanılan bağlantıları güçlendirirken kullanılmayanları zayıflattığını göstermektedir. Başka bir deyişle unutmak, yeni bilgiye yer açmaksızın öğrenmenin mümkün olmadığı bir düzende, öğrenmenin ön koşuludur.\n\nBu bulgu, ders çalışma alışkanlıklarımız açısından da önemlidir. Bir bilgiyi unutmak üzereyken yeniden hatırlamaya çalışmak, onu art arda on kez okumaktan daha kalıcı bir iz bırakır. Zorlanarak hatırlanan bilgi, beyin tarafından \"önemli\" olarak işaretlenir.\n\nElbette her unutkanlık zararsız değildir; günlük yaşamı aksatan bellek kayıpları mutlaka bir uzmana danışılmayı gerektirir. Ancak sıradan unutkanlıklar için kendimizi suçlamak yerine şunu hatırlamakta fayda var: iyi bir bellek her şeyi saklayan değil, neyi bırakacağını bilen bellektir.",
    gloss: [["yakınmak", "nolimoq, shikoyat qilmoq"], ["bellek", "xotira"], ["sinirbilimci", "neyrobiolog"], ["işlev", "vazifa, funksiya"], ["ayırt etmek", "ajrata olmoq"], ["elemek", "saralamoq, elakdan oʻtkazmoq"], ["ön koşul", "dastlabki shart"], ["aksatmak", "izdan chiqarmoq"]],
    q: [
      { q: "Sinirbilimcilere göre unutmak nedir?", o: ["Sağlıklı bir belleğin vazgeçilmez işlevi", "Belleğin en büyük kusuru", "Yaşlılığın belirtisi", "Dikkatsizliğin sonucu"], a: 0 },
      { q: "Beyin her ayrıntıyı saklasaydı ne olurdu?", o: ["Daha hızlı öğrenirdik", "Hiç uyumamız gerekmezdi", "Önemli olanla önemsiz olanı ayırt edemezdik", "Hiçbir şeyi unutmazdık ve mutlu olurduk"], a: 2 },
      { q: "Hangi yöntem daha kalıcı bir iz bırakır?", o: ["Bilgiyi art arda on kez okumak", "Bilgiyi unutmak üzereyken yeniden hatırlamaya çalışmak", "Bilgiyi yüksek sesle okumak", "Bilgiyi hiç tekrar etmemek"], a: 1 },
      { q: "Yazara göre iyi bir bellek nasıldır?", o: ["Her şeyi saklar", "Hiçbir şeyi unutmaz", "Yalnızca sayıları hatırlar", "Neyi bırakacağını bilir"], a: 3 }
    ]
  },
  {
    id: "sessizlik", lv: "C1", tr: "Sessizliğin değeri", uz: "Sukunatning qadri",
    text: "Büyük şehirlerde yaşayanların çoğu gürültüye o kadar alışmıştır ki onu artık fark etmez. Oysa beden fark etmeyi sürdürür. Araştırmalar, sürekli trafik gürültüsüne maruz kalan kişilerde uyku bozukluklarının, yüksek tansiyonun ve dikkat dağınıklığının daha sık görüldüğünü ortaya koymaktadır. Gürültü, hava kirliliğinden sonra kent sağlığını tehdit eden ikinci büyük çevresel etken sayılmaktadır.\n\nSorun yalnızca ses düzeyiyle ilgili değildir. Beklenmedik ve denetleyemediğimiz sesler, sürekli ama düzenli seslerden çok daha yorucudur. Açık ofislerde çalışanların verimindeki düşüşün nedeni çoğu zaman sesin yüksekliği değil, yarım yamalak duyulan konuşmalardır; zira beyin, anlamlı sesi istemeksizin çözmeye çalışır.\n\nBuna karşın sessizlik bir lüks olarak görülmeye başlanmıştır. Bazı şehirler parklarda \"sessiz bölgeler\" oluşturmakta, trenlerde telefonla konuşulmayan vagonlar ayırmaktadır. Uzmanlara göre günde yalnızca birkaç dakikalık gerçek sessizlik bile stres düzeyini belirgin biçimde düşürmektedir.\n\nSessizlik, sesin yokluğundan ibaret değildir; düşüncenin kendini duyabildiği bir alandır. Şehirleri planlarken yolları ve binaları hesaba kattığımız kadar, insanın susabileceği yerleri de hesaba katmamız gerekir.",
    gloss: [["bozukluk", "buzilish"], ["tansiyon", "qon bosimi"], ["dikkat dağınıklığı", "diqqatning tarqoqligi"], ["yarım yamalak", "chala-chulpa"], ["çözmek", "anglamoq, yechmoq"], ["ibaret", "iborat"], ["hesaba katmak", "hisobga olmoq"]],
    q: [
      { q: "Sürekli gürültüye maruz kalan kişilerde ne görülür?", o: ["Daha iyi uyku", "Uyku bozuklukları, yüksek tansiyon ve dikkat dağınıklığı", "Daha güçlü hafıza", "İşitme yeteneğinin artması"], a: 1 },
      { q: "Hangi sesler daha yorucudur?", o: ["Beklenmedik ve denetleyemediğimiz sesler", "Sürekli ve düzenli sesler", "Doğa sesleri", "Kısık sesli müzik"], a: 0 },
      { q: "Açık ofislerde verim neden düşer?", o: ["Ses çok yüksek olduğu için", "Işık yetersiz olduğu için", "Çalışanlar çok konuştuğu için", "Beyin, yarım yamalak duyulan konuşmaları çözmeye çalıştığı için"], a: 3 },
      { q: "Yazara göre sessizlik nedir?", o: ["Yalnızca sesin yokluğu", "Bir lüks ve gereksiz bir istek", "Düşüncenin kendini duyabildiği bir alan", "Şehirlerde imkânsız bir durum"], a: 2 }
    ]
  },
  {
    id: "ceviri", lv: "C1", tr: "Çevrilemeyen sözcükler", uz: "Tarjima qilib boʻlmaydigan soʻzlar",
    text: "Her dilde, başka dillere tek sözcükle aktarılamayan kavramlar vardır. Türkçedeki \"hüzün\", yalnızca üzüntü demek değildir; içinde bir yitirmişlik duygusu, biraz da tatlı bir kabulleniş taşır. \"Gönül\" sözcüğünü \"kalp\" diye çevirdiğimizde ise anlamın yarısı yolda kalır: kalp bir organdır, gönül ise sevginin, isteğin ve kırgınlığın yaşadığı yerdir.\n\nDilbilimciler bu tür sözcükleri bir eksiklik olarak değil, bir pencere olarak görür. Bir toplum neye ad vermişse ona dikkat ediyor demektir. Misafirlikle ilgili sözcüklerin zenginliği, o kültürde konukseverliğin taşıdığı önemi ele verir. Özbekçe ile Türkçe arasında bu açıdan şaşırtıcı bir yakınlık bulunur: iki dilde de \"gönül\" ve \"koʻngil\" neredeyse aynı kapıları açar.\n\nÖte yandan çevrilemezlik mutlak değildir. Tek sözcükle karşılanamayan bir kavram, bir cümleyle, bir örnekle, kimi zaman da bir hikâyeyle anlatılabilir. İyi çevirmen sözcüğün karşılığını aramakla yetinmez; o sözcüğün okurda uyandırdığı duyguyu başka bir dilde yeniden kurmaya çalışır.\n\nYabancı dil öğrenenler için bu sözcükler en değerli kazanımlardır. Çünkü onları gerçekten anladığımız gün, o dili konuşmakla kalmaz, o dilde hissetmeye de başlarız.",
    gloss: [["aktarmak", "oʻgirmoq, yetkazmoq"], ["yitirmişlik", "yoʻqotganlik hissi"], ["kabulleniş", "tan olish, koʻnish"], ["kırgınlık", "ranjish"], ["ele vermek", "oshkor qilmoq"], ["mutlak", "mutlaq"], ["kazanım", "yutuq"]],
    q: [
      { q: "Yazara göre \"hüzün\" sözcüğü neyi içerir?", o: ["Yalnızca üzüntüyü", "Öfke ve kırgınlığı", "Bir yitirmişlik duygusunu ve tatlı bir kabullenişi", "Sevinci ve umudu"], a: 2 },
      { q: "Dilbilimciler çevrilemeyen sözcükleri nasıl görür?", o: ["Bir pencere olarak", "Bir eksiklik olarak", "Gereksiz sözcükler olarak", "Çeviri hatası olarak"], a: 0 },
      { q: "İyi çevirmen ne yapmaya çalışır?", o: ["Her sözcüğü sözlükteki karşılığıyla değiştirir", "Çevrilemeyen sözcükleri metinden çıkarır", "Metni kısaltır", "Sözcüğün uyandırdığı duyguyu başka dilde yeniden kurar"], a: 3 },
      { q: "Bu sözcükleri gerçekten anladığımızda ne olur?", o: ["Ana dilimizi unuturuz", "O dilde hissetmeye de başlarız", "Çeviri yapmayı bırakırız", "Sözlüğe ihtiyacımız artar"], a: 1 }
    ]
  }
];
