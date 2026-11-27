/* Türkçe Yoʻl — imtihon sinovlari (mock). Oʻynatgich, vaqt va baholash — js/exam.js; kerak boʻlganda yuklanadi (loadMock).
   Hammasi original: matnlar, suhbatlar, savollar va topshiriqlar oʻzimiz yozgan; kitoblardan faqat imtihon qolipi olinadi.
   Test: {id, tr, uz, free, l, r, w, s} — toʻrt boʻlim:
     l (tinglash), r (oʻqish): {min — daqiqa, parts: [qism]}
       qism: {t — nomi, d — koʻrsatma, k: "mc" | "gap", audio?: {cast: {ism: "f"|"m"}, lines: [[ism, gap]]}, title?, text?,
              o? — hamma savolga umumiy variantlar (harf bilan: A, B…), qs: [savol]}
       mc savol: {q, o?, a — toʻgʻri variant raqami, e — izoh, audio?}; gap savol: {q — «___» joyi bilan, a — «a / b» variantlar, e}
     w (yozish): {min, tasks: [{id, t, d, tr — topshiriq matni, min, max — soʻz, w — vazn, lv, need: [[talab, qolip]], m — namunaviy javob}]}
       qolip — soʻz boshlari: "merhaba|selam" (js/exam.js soʻz chegarasini oʻzi qoʻshadi)
     s (gapirish): {parts: [{t, d, prep, talk — soniya, qs: [{q, cues?, pro?, con?, kw — mavzu soʻzlari qolipi, m — namunaviy javob}]}]}
   Ball: har boʻlim 0–75, umumiy — boʻlimlar oʻrtachasi; daraja — scale.bands (taxminiy). */
var MOCK = {
  scale: { max: 75, bands: [["C1", 65], ["B2", 51], ["B1", 38]] },
  tests: [
    {
      id: "1", tr: "Deneme Sınavı 1", uz: "Namunaviy sinov 1", free: true,
      l: {
        min: 30,
        parts: [
          {
            t: "1-qism · Qisqa suhbatlar", k: "mc",
            d: "Oltita qisqa suhbatni tinglang. Har biridan keyin savolga javob bering. Har bir suhbatni 2 marta tinglash mumkin.",
            qs: [
              {
                audio: { cast: { "Ayşe": "f", "Can": "m" }, lines: [
                  ["Ayşe", "Can, akşam yemeğe kaçta geliyorsun? Annem yediyi düşünüyordu."],
                  ["Can", "Yedide zor yetişirim, toplantım altı buçukta bitiyor. Sekize doğru orada olurum."],
                  ["Ayşe", "Tamam, o zaman yemeği sekiz buçuğa alalım."]] },
                q: "Akşam yemeği saat kaçta olacak?", o: ["Yedide", "Sekizde", "Sekiz buçukta"], a: 2,
                e: "Ayşe oxirida «yemeği sekiz buçuğa alalım» deydi — kechki ovqat 8:30 da. Can esa faqat «sekize doğru» yetib kelishini aytadi."
              },
              {
                audio: { cast: { "Oya": "f", "Cem": "m" }, lines: [
                  ["Oya", "Bu ceketi geçen hafta aldım ama kolları biraz uzun geldi."],
                  ["Cem", "Değiştirmek mi istiyorsunuz, yoksa paranızı geri mi verelim?"],
                  ["Oya", "Aslında rengini çok seviyorum. Bir küçük bedeni varsa onu alırım."]] },
                q: "Oya ne istiyor?", o: ["Parasını geri almak", "Ceketin bir küçük bedenini almak", "Başka renk bir ceket almak"], a: 1,
                e: "«Bir küçük bedeni varsa onu alırım» — bir oʻlcham kichigini olmoqchi. Rangi unga yoqadi, pulini qaytarishni soʻramaydi."
              },
              {
                audio: { cast: { "Ece": "f", "Tolga": "m" }, lines: [
                  ["Tolga", "Hafta sonu dağa çıkacaktık ama hava raporu yağmur diyor."],
                  ["Ece", "O zaman planı iptal etmeyelim, sadece erteleyelim. Gelecek cumartesi nasıl?"],
                  ["Tolga", "Gelecek cumartesi kardeşimin düğünü var. Pazar olur mu?"],
                  ["Ece", "Olur, pazar sabahı erkenden çıkarız."]] },
                q: "Dağ yürüyüşü ne zamana kaldı?", o: ["Bu hafta sonuna", "Gelecek cumartesiye", "Gelecek pazara"], a: 2,
                e: "Kelasi shanba Tolganing ukasining toʻyi, shuning uchun «Pazar olur mu?» — «Olur». Sayr kelasi yakshanbaga qoldi."
              },
              {
                audio: { cast: { "Gül": "f", "Kaan": "m" }, lines: [
                  ["Gül", "Kaan, eczaneye gidiyorum. Senin için de bir şey alayım mı?"],
                  ["Kaan", "Baş ağrısı ilacım bitmişti ama dün aldım. Bana sadece bir şişe su alır mısın?"],
                  ["Gül", "Tabii, eczanenin yanındaki marketten alırım."]] },
                q: "Gül, Kaan için ne alacak?", o: ["Baş ağrısı ilacı", "Su", "Vitamin"], a: 1,
                e: "Kaan dorini kecha olgan, endi faqat «bir şişe su» — bir shisha suv soʻraydi."
              },
              {
                audio: { cast: { "Ayşe": "f", "Can": "m" }, lines: [
                  ["Can", "Yeni işin nasıl gidiyor? Yol uzun değil mi?"],
                  ["Ayşe", "Yol eskisinden kısa aslında, metroyla yirmi dakika. Asıl zor olan, her şeyi yeniden öğrenmek."],
                  ["Can", "İlk aylar hep böyledir, alışırsın."]] },
                q: "Ayşe'yi yeni işinde en çok ne zorluyor?", o: ["Yolun uzun olması", "Yeni şeyler öğrenmek", "Metronun kalabalık olması"], a: 1,
                e: "«Asıl zor olan, her şeyi yeniden öğrenmek» — eng qiyini hammasini qaytadan oʻrganish. Yoʻl esa avvalgidan qisqa."
              },
              {
                audio: { cast: { "Oya": "f", "Cem": "m" }, lines: [
                  ["Oya", "Bu kitabı kütüphaneden ödünç almıştım. Acaba iade tarihi geçti mi?"],
                  ["Cem", "Bir bakayım… Son gün dündü. Ama bir gün için ceza yok, sadece bir dahaki sefere dikkat edin."],
                  ["Oya", "Çok teşekkür ederim, bir daha olmaz."]] },
                q: "Kütüphane görevlisi ne söylüyor?", o: ["Oya'nın ceza ödemesi gerektiğini", "Kitabın iade tarihinin yarın olduğunu", "Bu sefer ceza olmadığını"], a: 2,
                e: "«Bir gün için ceza yok» — bir kunlik kechikish uchun jarima yoʻq. Oxirgi kun kecha boʻlgan, ertaga emas."
              }
            ]
          },
          {
            t: "2-qism · Eʼlon", k: "gap",
            d: "Kutubxona eʼlonini tinglang va yozuvdagi boʻsh joylarni toʻldiring. Har bir joyga bitta soʻz yoki raqam yozing.",
            audio: { cast: { "Spiker": "f" }, lines: [
              ["Spiker", "Değerli dinleyiciler, Karşıyaka Halk Kütüphanesi'nden önemli bir duyuru."],
              ["Spiker", "Kütüphanemiz bakım çalışmaları nedeniyle on beş Mart'tan itibaren iki hafta kapalı olacaktır."],
              ["Spiker", "Bu süre içinde kitaplarınızı kütüphanenin arka kapısındaki iade kutusuna bırakabilirsiniz."],
              ["Spiker", "Yeniden açılışla birlikte çalışma saatlerimiz de değişiyor: hafta içi sabah dokuzdan akşam sekize kadar hizmet vereceğiz."],
              ["Spiker", "Cumartesi günleri ise çocuklar için ücretsiz masal saati düzenlenecek."],
              ["Spiker", "Masal saatine katılmak için kütüphanenin internet sitesinden kayıt yaptırmanız gerekiyor."],
              ["Spiker", "Kayıtlar her hafta perşembe günü başlıyor ve yer sayısı yirmi çocukla sınırlı."],
              ["Spiker", "Ayrıntılı bilgi için bizi her zaman arayabilirsiniz. İyi günler dileriz."]] },
            title: "Karşıyaka Halk Kütüphanesi — notlar",
            qs: [
              { q: "Kütüphane ___ hafta kapalı olacak.", a: "iki / 2", e: "«İki hafta kapalı olacaktır» — ikki hafta yopiq boʻladi." },
              { q: "Kitaplar arka kapıdaki iade ___ bırakılabilir.", a: "kutusuna / kutusu / kutu", e: "«İade kutusuna bırakabilirsiniz» — qaytarish qutisiga." },
              { q: "Yeni çalışma saatleri: hafta içi 09.00 – ___", a: "20.00 / 20:00 / 20 / sekiz / akşam sekiz / 8", e: "«Sabah dokuzdan akşam sekize kadar» — 9:00 dan 20:00 gacha." },
              { q: "Cumartesi günleri çocuklar için ücretsiz ___ saati var.", a: "masal", e: "«Ücretsiz masal saati» — bepul ertak soati." },
              { q: "Kayıtlar her hafta ___ günü başlıyor.", a: "perşembe", e: "«Kayıtlar her hafta perşembe günü başlıyor» — roʻyxat payshanba kuni boshlanadi." },
              { q: "Masal saatine en fazla ___ çocuk katılabilir.", a: "yirmi / 20", e: "«Yer sayısı yirmi çocukla sınırlı» — joylar 20 bola bilan cheklangan." }
            ]
          },
          {
            t: "3-qism · Suhbat", k: "mc",
            d: "Radiodagi suhbatni tinglang va savollarga javob bering. Suhbatni 2 marta tinglash mumkin.",
            audio: { cast: { "Sunucu": "f", "Mehmet Bey": "m" }, lines: [
              ["Sunucu", "Bugün stüdyomuzda Mehmet Bey var. Mehmet Bey, mahallenizde bir tamir kafesi açtınız. Bu fikir nereden çıktı?"],
              ["Mehmet Bey", "Otuz yıl elektrikçi olarak çalıştım. Emekli olunca, insanların küçük bir arıza yüzünden çalışan cihazları çöpe attığını gördüm. Bu beni çok üzdü."],
              ["Sunucu", "Peki tamir kafesi tam olarak nasıl çalışıyor?"],
              ["Mehmet Bey", "Ayda iki kez, cumartesi günleri mahallenin kültür merkezinde buluşuyoruz. İnsanlar bozuk eşyalarını getiriyor, gönüllülerimiz onları ücretsiz tamir ediyor."],
              ["Sunucu", "Sadece elektrikli eşyalar mı geliyor?"],
              ["Mehmet Bey", "Hayır. Aramızda bir terzi de var, bir bisiklet tamircisi de. En çok lamba, ütü ve elbise geliyor."],
              ["Sunucu", "Gönüllüleriniz kimlerden oluşuyor?"],
              ["Mehmet Bey", "Çoğu benim gibi emekli. Ama son zamanlarda üniversite öğrencileri de katılmaya başladı. Onlar bizden tamir öğreniyor, biz de onlardan telefon ve bilgisayar hakkında çok şey öğreniyoruz."],
              ["Sunucu", "Karşılaştığınız en büyük zorluk ne?"],
              ["Mehmet Bey", "Yedek parça bulmak. Bazı firmalar parçaları ayrı satmıyor, bu yüzden bazen basit bir cihazı bile tamir edemiyoruz."],
              ["Sunucu", "Son olarak dinleyicilerimize ne söylemek istersiniz?"],
              ["Mehmet Bey", "Bir şeyi atmadan önce iki kez düşünün. Belki birkaç vidayla yeniden çalışır."]] },
            qs: [
              { q: "Mehmet Bey tamir kafesini neden açtı?", o: ["Emekli maaşı yetmediği için", "İnsanların kolayca eşya attığını gördüğü için", "Elektrikçi dükkânı kapandığı için"], a: 1, e: "U odamlar kichik nosozlik tufayli ishlab turgan buyumlarni axlatga tashlashini koʻrib xafa boʻlgan." },
              { q: "Tamir kafesi ne sıklıkla toplanıyor?", o: ["Her cumartesi", "Ayda iki kez", "Ayda bir kez"], a: 1, e: "«Ayda iki kez, cumartesi günleri» — oyda ikki marta, shanba kunlari." },
              { q: "Kafeye en çok hangi eşyalar getiriliyor?", o: ["Telefon ve bilgisayar", "Bisiklet ve oyuncak", "Lamba, ütü ve elbise"], a: 2, e: "«En çok lamba, ütü ve elbise geliyor» — eng koʻp chiroq, dazmol va kiyim." },
              { q: "Üniversite öğrencileri hakkında ne söyleniyor?", o: ["Tamir kafesinden ücret alıyorlar", "Gönüllülerle karşılıklı bilgi paylaşıyorlar", "Sadece bilgisayar tamir ediyorlar"], a: 1, e: "Talabalar taʼmirlashni oʻrganadi, keksalar esa ulardan telefon va kompyuter haqida oʻrganadi — bilim almashinuvi." },
              { q: "Mehmet Bey'e göre en büyük sorun nedir?", o: ["Yedek parça bulmanın zor olması", "Gönüllü sayısının az olması", "Kültür merkezinin küçük olması"], a: 0, e: "«Yedek parça bulmak» — ehtiyot qism topish; baʼzi firmalar qismlarni alohida sotmaydi." }
            ]
          },
          {
            t: "4-qism · Fikrlar", k: "mc",
            d: "Toʻrt kishi uydan ishlash haqida gapiradi. Har bir soʻzlovchiga mos fikrni tanlang (A–F). Ikkita variant ortiqcha.",
            audio: { cast: { "Selma": "f", "Burak": "m", "Leyla": "f", "Emre": "m" }, lines: [
              ["Selma", "Evden çalışmaya başladığımdan beri sabahları trafikte kaybettiğim bir saati spora ayırıyorum. Kendimi hiç bu kadar enerjik hissetmemiştim."],
              ["Burak", "Evde çalışmak bana göre değil. Mutfakla çalışma masası arasında gidip gelirken dikkatim sürekli dağılıyor. Ofiste çok daha verimliyim."],
              ["Leyla", "Bence en iyisi karma sistem. Haftada iki gün ofise gidip arkadaşlarımla yüz yüze görüşüyorum, kalan günlerde evde sessizce çalışıyorum."],
              ["Emre", "Evden çalışınca iş ile özel hayat arasındaki sınır kayboldu. Akşam dokuzda bile e-posta cevaplıyorum ve bu beni çok yoruyor."]] },
            o: ["Ofiste daha iyi odaklanıyor.", "Kazandığı zamanı sağlığı için kullanıyor.", "Çalışma saatlerinin uzadığından şikâyet ediyor.", "İki çalışma biçimini birleştirmeyi tercih ediyor.", "Evden çalışmak için yeni bir ev aldı.", "Patronunun izin vermediğini söylüyor."],
            qs: [
              { q: "Selma", a: 1, e: "Selma tirbandlikda yoʻqotadigan bir soatini sportga ajratadi — vaqtini sogʻligʻiga sarflaydi." },
              { q: "Burak", a: 0, e: "Burak uyda chalgʻiydi, ofisda «çok daha verimli» — samaraliroq ishlaydi." },
              { q: "Leyla", a: 3, e: "«Karma sistem» — haftada ikki kun ofisda, qolgan kunlar uyda: ikkala usulni birlashtiradi." },
              { q: "Emre", a: 2, e: "Ish va shaxsiy hayot chegarasi yoʻqolgan, kechki toʻqqizda ham xatlarga javob beradi — ish soatlari choʻzilgan." }
            ]
          }
        ]
      },
      r: {
        min: 50,
        parts: [
          {
            t: "1-qism · Boʻsh joylar", k: "mc",
            d: "Eʼlonni oʻqing. Har bir boʻsh joyga mos keladigan soʻzni tanlang.",
            title: "Apartman bahar şenliği",
            text: "Sevgili komşularımız,\n\nÖnümüzdeki cumartesi apartmanımızın bahçesinde bir temizlik ve bahar şenliği (1) ___. Etkinlik sabah onda başlayıp öğleden sonra üçe (2) ___ sürecek. Temizlikten sonra hep birlikte bahçeye çiçek ekeceğiz. Eldivenleri ve çöp torbalarını yönetim karşılayacak; sizden (3) ___ istediğimiz şey, güler yüz ve biraz zaman. Etkinliğe katılmak (4) ___ komşularımızın cuma akşamına kadar kapıcımız Hasan Bey'e haber vermesi yeterli. Çocuklar için bir resim yarışması da olacak, bu yüzden çocuklarınızı da (5) ___ getirin. Yağmur yağarsa etkinlik bir hafta (6) ___ ertelenecek.\n\nApartman Yönetimi",
            qs: [
              { q: "(1)", o: ["düzenliyoruz", "düzenlendi", "düzenleyecekti", "düzenlemişler"], a: 0, e: "Eʼlonni yozganlar oʻzlari tashkil qiladi va voqea kelajakda: «düzenliyoruz» — tashkil qilyapmiz (rejalashtirilgan ish)." },
              { q: "(2)", o: ["kadar", "göre", "için", "beri"], a: 0, e: "«-e kadar» — «…gacha»: üçe kadar = soat uchgacha." },
              { q: "(3)", o: ["sadece", "hiç", "henüz", "artık"], a: 0, e: "«Sizden sadece istediğimiz şey…» — sizdan faqat soʻraydiganimiz…" },
              { q: "(4)", o: ["isteyen", "istedi", "isterse", "istemek"], a: 0, e: "Sifatdosh «-en»: katılmak isteyen komşular — qatnashishni xohlagan qoʻshnilar." },
              { q: "(5)", o: ["mutlaka", "asla", "hiçbir", "henüz"], a: 0, e: "«Mutlaka getirin» — albatta olib keling. «Asla» inkor bilan ishlatiladi." },
              { q: "(6)", o: ["sonraya", "önce", "kadar", "boyunca"], a: 0, e: "«Bir hafta sonraya ertelenecek» — bir hafta keyinga qoldiriladi." }
            ]
          },
          {
            t: "2-qism · Sarlavhalar", k: "mc",
            d: "Matndagi beshta xatboshini oʻqing va har biriga mos sarlavhani tanlang (A–G). Ikkita sarlavha ortiqcha.",
            title: "İyi bir uyku için beş öneri",
            o: ["Gündüz hareket edin", "Kahve içmenin faydaları", "Uyku için doğru ortam", "Düzenli bir uyku saati", "Öğle uykusu ne kadar olmalı?", "Akşam yemeğine dikkat", "Ekranlardan uzak durun"],
            qs: [
              { q: "Her gece farklı saatlerde yatmak vücudun iç saatini karıştırır. Hafta sonları bile aynı saatte yatıp kalkmak, uykuya dalmayı kolaylaştırır.", a: 3, e: "Har kecha bir vaqtda yotish — «Düzenli bir uyku saati» (muntazam uyqu vaqti)." },
              { q: "Telefon ve bilgisayar ekranlarının mavi ışığı, beyne hâlâ gündüz olduğu mesajını verir. Yatmadan en az bir saat önce ekranları kapatmak uykunun kalitesini artırır.", a: 6, e: "Ekranlar nuri haqida — «Ekranlardan uzak durun» (ekranlardan uzoq turing)." },
              { q: "Ağır ve yağlı bir yemek midede uzun süre kalır. Akşam yemeğini yatmadan iki üç saat önce ve hafif bir şekilde yemek daha doğrudur.", a: 5, e: "Ogʻir kechki ovqat haqida — «Akşam yemeğine dikkat»." },
              { q: "Yatak odası serin, karanlık ve sessiz olmalıdır. Kalın perdeler ve rahat bir yastık, küçük ama etkili değişikliklerdir.", a: 2, e: "Xona salqin, qorongʻi va jim boʻlishi — «Uyku için doğru ortam» (uyqu uchun toʻgʻri muhit)." },
              { q: "Gün içinde yapılan yürüyüş ya da hafif egzersiz, gece daha derin uyumayı sağlar. Ancak yoğun sporu yatmadan hemen önce yapmamak gerekir.", a: 0, e: "Kunduzi yurish va mashq — «Gündüz hareket edin» (kunduzi harakat qiling)." }
            ]
          },
          {
            t: "3-qism · Matn", k: "mc",
            d: "Matnni oʻqing va savollarga javob bering.",
            title: "Tohumları paylaşan köy",
            text: "Ege'nin küçük bir köyünde yaşayan Fatma Hanım, yıllar önce annesinden kalan bir avuç domates tohumunu saklarken bunun bir gün köyün kaderini değiştireceğini bilmiyordu. Köylüler uzun süre marketlerden aldıkları hazır tohumları kullanmıştı. Bu tohumlardan alınan ürünler güzel görünüyordu ama bir sonraki yıl yeniden ekilemiyordu; çiftçiler her yıl tohum satın almak zorundaydı.\n\nFatma Hanım, emekli öğretmen olan komşusu Hüseyin Bey'le birlikte köy kahvesinin bir köşesine küçük bir dolap yerleştirdi. Dolaba yerel tohumlarla dolu kavanozlar koydular ve basit bir kural belirlediler: Dolaptan tohum alan kişi, hasattan sonra aldığının iki katını geri getirecekti. İlk yıl sadece birkaç komşu bu fikre güvendi. İkinci yıl ise dolap yetmedi ve köy okulunun boş bir sınıfı tohum kütüphanesine dönüştürüldü.\n\nBugün kütüphanede kırktan fazla yerel bitki türü var. Öğrenciler her bahar kavanozlara etiket yazıyor; tohumların hangi aileden geldiğini ve hangi toprağı sevdiğini kaydediyor. Yaşlılar ise bu sayede unuttukları tatları yeniden buluyor. Hüseyin Bey'e göre asıl kazanç ekonomik değil: \"İnsanlar birbirine yeniden güvenmeye başladı. Tohum paylaşmak, aslında hikâye paylaşmak demek.\"\n\nYine de her şey kolay olmadı. Bazı çiftçiler yerel tohumların daha az ürün verdiğini söyleyerek eski alışkanlıklarına döndü. Fatma Hanım bunu doğal karşılıyor: \"Herkesin ikna olması zaman alır. Biz kimseyi zorlamıyoruz, sadece seçenek sunuyoruz.\" Komşu köylerden gelen ziyaretçilerin sayısı her yıl artıyor. Belki birkaç yıl sonra bu küçük kavanozlar, bütün bölgenin ortak hafızası olacak.",
            qs: [
              { q: "Köylüler hazır tohumlarla ilgili hangi sorunu yaşıyordu?", o: ["Ürünler güzel görünmüyordu", "Tohumlar bir sonraki yıl yeniden ekilemiyordu", "Tohumlar köye çok geç geliyordu", "Ürünler marketlerde satılmıyordu"], a: 1, e: "1-xatbosh: hosil chiroyli, lekin urugʻini keyingi yili qayta ekib boʻlmasdi — har yili yangi urugʻ sotib olish kerak edi." },
              { q: "Tohum dolabının kuralı neydi?", o: ["Tohum almak için para ödemek", "Hasattan sonra aldığının iki katını geri getirmek", "Sadece öğretmenlerin tohum alabilmesi", "Her ailenin yılda bir kavanoz alması"], a: 1, e: "«Aldığının iki katını geri getirecekti» — olganining ikki baravarini qaytarib olib kelish." },
              { q: "Tohum kütüphanesi neden okula taşındı?", o: ["Kahve kapandığı için", "Öğrenciler istediği için", "Dolap artık yeterli olmadığı için", "Belediye izin vermediği için"], a: 2, e: "«İkinci yıl ise dolap yetmedi» — ikkinchi yili shkaf yetmay qoldi." },
              { q: "Hüseyin Bey'e göre projenin en önemli kazancı nedir?", o: ["Köyün daha çok para kazanması", "İnsanlar arasındaki güvenin artması", "Okulun yeni sınıflar açması", "Ürünlerin daha çok satılması"], a: 1, e: "«Asıl kazanç ekonomik değil… İnsanlar birbirine yeniden güvenmeye başladı» — asosiy foyda — ishonch." },
              { q: "Fatma Hanım, eski alışkanlıklarına dönen çiftçiler hakkında ne düşünüyor?", o: ["Onlara kızıyor", "Onları ikna etmek için para veriyor", "Bunu doğal buluyor ve kimseyi zorlamıyor", "Onları kütüphaneden uzaklaştırıyor"], a: 2, e: "«Bunu doğal karşılıyor… Biz kimseyi zorlamıyoruz» — buni tabiiy qabul qiladi, hech kimni majburlamaydi." }
            ]
          },
          {
            t: "4-qism · Toʻgʻri, notoʻgʻri yoki berilmagan", k: "mc",
            d: "Matnni oʻqing. Har bir gap matnga mos kelsa — «Doğru», zid boʻlsa — «Yanlış», matnda bu haqda maʼlumot boʻlmasa — «Verilmemiş».",
            title: "Çatıda sebze bahçeleri",
            text: "Bir yıl önce Yeşilvadi Belediyesi, şehir merkezindeki okulların ve kamu binalarının düz çatılarını sebze bahçesine dönüştürmeye karar verdi. Projenin ilk aşamasında on iki binanın çatısında toplam üç bin metrekarelik bir alan hazırlandı. Bahçelerde domates, biber, fasulye ve çeşitli otlar yetiştiriliyor.\n\nBahçelerin bakımını belediye çalışanları değil, mahalle sakinlerinden oluşan gönüllü grupları yapıyor. Her grup, sulama ve temizlik için haftada en az iki kez çatıya çıkıyor. Elde edilen ürünlerin yarısı okul yemekhanelerine gönderiliyor, kalanı ise gönüllüler arasında paylaştırılıyor.\n\nUzmanlara göre çatı bahçeleri yazın binaların içini birkaç derece serinletiyor; bu da klima kullanımını azaltıyor. Belediye, projenin ikinci aşamasında hastane ve kütüphane çatılarını da eklemeyi planlıyor. Ancak bazı eski binaların çatıları toprağın ağırlığını taşıyamayacağı için bu binalar projeye dahil edilmeyecek.",
            o: ["Doğru", "Yanlış", "Verilmemiş"],
            qs: [
              { q: "Proje, şehir merkezindeki binalarla başladı.", a: 0, e: "«Şehir merkezindeki okulların ve kamu binalarının düz çatılarını…» — loyiha markazdagi binolardan boshlangan." },
              { q: "İlk aşamada yirmi binanın çatısı hazırlandı.", a: 1, e: "Matnda «on iki binanın çatısında» — yigirma emas, oʻn ikkita bino." },
              { q: "Bahçelerin bakımını belediye çalışanları yapıyor.", a: 1, e: "«Belediye çalışanları değil, … gönüllü grupları yapıyor» — parvarishini koʻngillilar qiladi." },
              { q: "Gönüllüler bu iş için belediyeden maaş alıyor.", a: 2, e: "Koʻngillilarga maosh toʻlanishi haqida matnda hech narsa yoʻq — «Verilmemiş»." },
              { q: "Çatı bahçeleri yazın binaların daha serin olmasına yardım ediyor.", a: 0, e: "«Yazın binaların içini birkaç derece serinletiyor» — yozda binolar ichini salqinlatadi." },
              { q: "Hastanelerin çatılarında şimdiden bahçe var.", a: 1, e: "Kasalxonalar faqat «ikinci aşamada» rejalashtirilgan — hozircha bogʻ yoʻq." },
              { q: "Projenin maliyeti üç milyon liradır.", a: 2, e: "Loyihaning narxi matnda aytilmagan («üç bin» — maydon, metr kvadrat). Javob — «Verilmemiş»." }
            ]
          }
        ]
      },
      w: {
        min: 60,
        tasks: [
          {
            id: "1.1", t: "1.1-topshiriq · Doʻstga xat", min: 50, max: 70, w: 1, lv: "A2",
            m: "Merhaba Selin! Şehrime geleceğine çok sevindim. Kalacak yer için eski çarşının yanındaki küçük pansiyonu öneririm; hem temiz hem de ucuz. Mutlaka sahildeki parkta yürüyüş yap ve şehir müzesini gör. Akşamları sahil çok güzel ama biraz kalabalık oluyor. Cumartesi akşamı saat yedide buluşalım mı? Seni en sevdiğim balık lokantasına götürmek istiyorum. Bir de bana hangi saatte geleceğini yaz. Görüşmek üzere, sevgiler!",
            d: "Doʻstingiz Selin sizga xat yozdi. Unga norasmiy uslubda javob yozing (50–70 soʻz).",
            tr: "Merhaba! Gelecek ay üç günlüğüne senin şehrine geliyorum. Nerede kalmalıyım, neleri görmeliyim? Bir de seninle buluşmak istiyorum, hangi gün uygun? Sevgiler, Selin\n\nSelin'e cevap yazın: kalacak bir yer önerin, görülecek bir-iki yer söyleyin ve buluşmak için gün ile saat önerin.",
            need: [
              ["Salomlashish", "merhaba|selam|sevgili|canım"],
              ["Qayerda qolish", "otel|pansiyon|bizde|bizim ev|kal"],
              ["Koʻriladigan joy", "gör|gez|ziyaret|müze|park|çarşı|pazar|sahil|meydan|kale|cami"],
              ["Uchrashuv kuni va vaqti", "pazartesi|salı|çarşamba|perşembe|cuma|cumartesi|pazar|saat|akşam|sabah|öğle"],
              ["Xayrlashish", "görüşürüz|görüşmek üzere|sevgiler|selamlar|kendine iyi bak|hoşça kal|öptüm"]
            ]
          },
          {
            id: "1.2", t: "1.2-topshiriq · Rasmiy xat", min: 120, max: 150, w: 1.5, lv: "B1",
            m: "Sayın Yetkili,\n\n3 Mart tarihinde sitenizden 48213 numaralı siparişle bir çamaşır makinesi satın aldım. Sitede teslimat süresi üç gün olarak belirtilmişti; ancak makine iki hafta gecikmeyle, 17 Mart'ta teslim edildi. Üstelik kutuyu açtığımda makinenin kapağının çatlak olduğunu gördüm. Bu nedenle makineyi hiç kullanamadım. Müşteri hizmetlerinizi iki kez aradım, fakat sorunumla ilgilenen olmadı. Sitenizden bu kadar özensiz bir hizmet beklemiyordum, çünkü daha önce yaptığım alışverişlerde hiçbir sorun yaşamamıştım.\n\nHasarlı ürünün fotoğraflarını ekte gönderiyorum. Makineyi orijinal kutusunda sakladım, dolayısıyla geri göndermeye hazırdır. Sizden makinenin en geç bir hafta içinde yenisiyle değiştirilmesini rica ediyorum. Eğer değişim mümkün değilse, ödediğim ücretin tamamının iade edilmesini talep ediyorum. Ayrıca yaşadığım gecikme için bir açıklama bekliyorum.\n\nBana bu e-posta adresinden ya da telefonla ulaşabilirsiniz. İlginiz için şimdiden teşekkür ederim.\n\nSaygılarımla,\nDilnoza Karimova",
            d: "Internet doʻkonga rasmiy shikoyat xati yozing (120–150 soʻz).",
            tr: "Bir internet sitesinden çamaşır makinesi sipariş ettiniz. Makine iki hafta geç geldi ve kapağı çatlaktı. Şirketin müşteri hizmetlerine resmî bir e-posta yazın: sorunu anlatın, ne zaman ve ne sipariş ettiğinizi belirtin, ne istediğinizi (değişim ya da para iadesi) açıkça yazın.",
            need: [
              ["Rasmiy murojaat", "sayın|ilgili|yetkili"],
              ["Buyurtma maʼlumoti", "sipariş|tarih|numara"],
              ["Muammo bayoni", "geç|gecik|çatla|kırık|hasar|bozuk|arıza"],
              ["Aniq talab", "değiş|iade|geri öde|geri ver"],
              ["Rasmiy ohang", "rica|talep|bekliyorum|bekl|arz"],
              ["Rasmiy yakun", "saygılarımla|saygılarımızla|iyi çalışmalar"]
            ]
          },
          {
            id: "2", t: "2-topshiriq · Insho", min: 180, max: 220, w: 2.5, lv: "B2",
            m: "Çocukların yabancı dil öğrenmeye ne zaman başlaması gerektiği, ailelerin ve öğretmenlerin sık sık tartıştığı bir konudur. Bence yabancı dil eğitimi ilkokulun ilk yılında başlamalıdır; ancak bu, ana dilin ihmal edilmesi anlamına gelmemelidir.\n\nHer şeyden önce, küçük çocuklar yeni sesleri büyüklerden çok daha kolay taklit eder. Örneğin altı yaşında şarkılar ve oyunlarla İngilizce öğrenen bir çocuk, yıllar sonra bile doğal bir telaffuzla konuşabilir. Ayrıca erken yaşta başka bir dille tanışmak, çocuğun farklı kültürlere karşı merakını artırır ve dünyaya daha açık bakmasını sağlar. Üstelik dil öğrenen çocuklar problem çözmede ve dikkat gerektiren işlerde de daha başarılı olabilir.\n\nÖte yandan, ana dilini henüz iyi bilmeyen bir çocuğun iki dili karıştırabileceği de doğrudur. Bu nedenle bazı uzmanlar önce ana dilin sağlamlaştırılmasını önerir. Ne var ki araştırmalar, bu karışıklığın genellikle kısa sürdüğünü gösteriyor. Asıl önemli olan, derslerin çocuğun yaşına uygun ve eğlenceli olmasıdır. Bu yüzden derslerde oyun, şarkı ve hikâye gibi yöntemler kullanılmalıdır.\n\nSonuç olarak, yabancı dil eğitimine erken başlamanın faydaları zararlarından fazladır. Okullar ana dil derslerine de yeterli zaman ayırırsa, çocuklar iki dili de başarıyla öğrenebilir. Bunun için ailelerin de evde çocuklarıyla bol bol kitap okuması gerekir. Kısacası, iki dil birbirinin rakibi değil, tamamlayıcısıdır.",
            d: "Berilgan mavzu boʻyicha fikringizni dalillar va misollar bilan asoslab, insho yozing (180–220 soʻz).",
            tr: "Bazı insanlar, çocukların yabancı dili ilkokulun ilk yılından itibaren öğrenmesi gerektiğini düşünüyor. Bazıları ise önce ana dilin iyice öğrenilmesi gerektiğini savunuyor. Siz ne düşünüyorsunuz? Görüşünüzü gerekçeler ve örneklerle açıklayan bir kompozisyon yazın.",
            need: [
              ["Oʻz fikringiz", "bence|bana göre|kanaatimce|düşünüyorum|katılıyorum|katılmıyorum"],
              ["Dalil va misol", "örneğin|mesela|çünkü|nedeniyle|sebebiyle|bu yüzden"],
              ["Qarshi fikrni koʻrib chiqish", "öte yandan|buna karşın|ancak|bununla birlikte|aksine|diğer taraftan|oysa"],
              ["Xulosa", "sonuç olarak|kısacası|özetle|sonuçta|son olarak"]
            ]
          }
        ]
      },
      s: {
        parts: [
          {
            t: "1-qism · Oʻzingiz haqingizda", prep: 5, talk: 30,
            d: "Uchta savolga javob bering. Har biriga 30 soniya vaqt bor. Toʻliq gaplar bilan, misol keltirib gapiring.",
            qs: [
              { q: "Boş zamanlarınızda ne yapmaktan hoşlanırsınız?", kw: "hoşlan|sev|zaman|hafta sonu|kitap|spor|müzik|film|yürü|oku|arkadaş",
                m: "Boş zamanlarımda kitap okumayı ve yürüyüş yapmayı çok severim. Özellikle hafta sonları arkadaşlarımla parka gidiyoruz. Akşamları da bazen Türk dizileri izliyorum, çünkü hem eğleniyorum hem de Türkçemi geliştiriyorum." },
              { q: "Yaşadığınız şehri ya da köyü kısaca anlatır mısınız?", kw: "şehir|köy|yaşa|güzel|büyük|küçük|insan|sokak|park|kalabalık|sakin",
                m: "Taşkent'te yaşıyorum. Büyük ve kalabalık bir şehir ama aynı zamanda çok yeşil. Geniş caddeleri, güzel parkları ve tarihî binaları var. İnsanlar misafirperverdir. Akşamları şehir ışıklarla daha da güzel oluyor." },
              { q: "Türkçe öğrenmeye neden başladınız?", kw: "türkçe|öğren|çünkü|iş|okul|üniversite|türkiye|dizi|arkadaş|seyahat",
                m: "Türkçe öğrenmeye iki yıl önce başladım, çünkü Türkiye'de üniversitede okumak istiyorum. Ayrıca Türkçe ile Özbekçe birbirine çok benziyor, bu yüzden öğrenmek bana zevkli geliyor." }
            ]
          },
          {
            t: "2-qism · Voqeani aytib berish", prep: 60, talk: 120,
            d: "Bir daqiqa tayyorlaning, keyin ikki daqiqa gapiring. Quyidagi savollarga toʻxtaling.",
            qs: [
              { q: "Hayatınızda unutamadığınız bir yolculuğu anlatın.", cues: ["Nereye ve kiminle gittiniz?", "Orada neler yaptınız?", "Bu yolculuk sizin için neden önemliydi?"], kw: "git|yolculuk|tatil|gör|arkadaş|aile|otobüs|uçak|tren|deniz|unutama|önemli",
                m: "Geçen yaz ailemle birlikte Semerkant'a gittik. Taşkent'ten hızlı trenle sadece iki saatte vardık. İlk gün Registan Meydanı'nı gezdik; mavi çinileri görünce gerçekten büyülendim. Akşam meydanda bir ışık gösterisi vardı, çok kalabalıktı ama harikaydı. İkinci gün eski çarşıya gittik ve orada taze ekmekle kuru meyve aldık. Öğleden sonra Şah-ı Zinde'yi ziyaret ettik; rehberimiz bize binaların yüzyıllar önce nasıl yapıldığını anlattı. Akşam yemeğinde de meşhur Semerkant pilavını yedik. Annem bana, dedemin çocukken bu çarşıda çalıştığını anlattı. Bu yolculuk benim için çok önemliydi, çünkü hem ülkemin tarihini daha yakından tanıdım hem de ailemle uzun zamandır ilk kez birlikte vakit geçirdim. Bu yüzden o günleri hiç unutamıyorum." }
            ]
          },
          {
            t: "3-qism · Munozara", prep: 60, talk: 120,
            d: "Fikrni ikki tomondan muhokama qiling va oʻz qarashingizni ayting. Jadvaldagi dalillardan foydalanishingiz mumkin.",
            qs: [
              { q: "«Teknoloji insanları birbirinden uzaklaştırıyor.»",
                pro: ["Aileler yemekte bile telefona bakıyor.", "Yüz yüze görüşmeler azaldı.", "Sanal arkadaşlıklar yüzeysel kalıyor."],
                con: ["Uzaktaki akrabalarla görüntülü konuşabiliyoruz.", "Aynı ilgi alanına sahip insanlarla tanışmak kolaylaştı.", "Yalnız yaşayan yaşlılar için büyük bir destek."],
                kw: "teknoloji|telefon|internet|insan|uzaklaş|yakınlaş|aile|arkadaş|görüş|sanal",
                m: "Bu konuda iki farklı görüş var. Bir yandan teknolojinin insanları uzaklaştırdığı doğru. Örneğin birçok aile yemekte bile telefonuna bakıyor ve yüz yüze konuşmalar azalıyor. Sanal arkadaşlıklar da çoğu zaman yüzeysel kalıyor. Gençler bazen sokakta yürürken bile başlarını telefondan kaldırmıyor. Öte yandan teknoloji insanları birbirine yakınlaştırıyor da. Yurt dışında yaşayan akrabalarımla her hafta görüntülü konuşabiliyorum. Ayrıca yalnız yaşayan yaşlılar için internet büyük bir destek; torunlarını ekranda görerek yalnızlık hissinden biraz olsun kurtuluyorlar. Bence sorun teknolojinin kendisi değil, onu nasıl kullandığımız. Teknoloji bir araçtır; onu iyi ya da kötü yapan bizim alışkanlıklarımızdır. Sonuç olarak teknolojiyi bilinçli kullanırsak insanları uzaklaştırmaz, aksine yakınlaştırır." }
            ]
          }
        ]
      }
    }
  ]
};
