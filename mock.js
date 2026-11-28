/* Türkçe Yoʻl — imtihon sinovlari (mock). Oʻynatgich, vaqt va baholash — js/exam.js; kerak boʻlganda yuklanadi (loadMock).
   Hammasi original: matnlar, suhbatlar, savollar va topshiriqlar oʻzimiz yozgan; kitoblardan faqat imtihon qolipi olinadi.
   Tuzilma — CEFR multilevel imtihoni qolipida: tinglash 6 qism / 35 savol, oʻqish 5 qism / 35 savol (60 daq), yozish 1.1 + 1.2
   (bitta vaziyat) + 2 (60 daq), gapirish 1.1, 1.2 (ikki rasm), 2 (rasm), 3 (munozara).
   Test: {id, tr, uz, free, l, r, w, s} — toʻrt boʻlim:
     l (tinglash), r (oʻqish): {min — daqiqa, parts: [qism]}
       qism: {t — nomi, d — koʻrsatma, k: "mc" | "gap", audio?: {cast: {ism: "f"|"m"}, lines: [[ism, gap]]}, title?, text?,
              sum? — xulosa matni «(n) ___» boʻsh joylari bilan, map? — xarita {w, h, paths, boxes: [{l, x, y, w, h}], marks, gate},
              o? — hamma savolga umumiy variantlar (uzun boʻlsa harf bilan: A, B…), qs: [savol]}
       savol: {q, k? — shu savolning turi (qismnikidan farq qilsa), h? — sarlavha («1-parcha»), audio?, e — izoh}
       mc: {o?, a — toʻgʻri variant raqami}; gap: {q — «___» joyi bilan, a — «a / b» variantlar}
     w (yozish): {min, ctx? — 1.1 va 1.2 uchun umumiy vaziyat, tasks: [{id, t, d, tr — topshiriq matni, ctx? — vaziyatni koʻrsatish,
       min, max — soʻz, w — vazn, lv, need: [[talab, qolip]], m — namunaviy javob}]}
       qolip — soʻz boshlari: "merhaba|selam" (js/exam.js soʻz chegarasini oʻzi qoʻshadi)
     s (gapirish): {parts: [{t, d, prep, talk — soniya, pics? — rasmlar (MK_PICS kalitlari),
       qs: [{q, prep?, talk? — shu savolniki, cues?, pro?, con?, kw — mavzu soʻzlari qolipi, m — namunaviy javob}]}]}
   Ball: har boʻlim 0–75, umumiy — boʻlimlar oʻrtachasi; daraja — scale.bands (taxminiy). */
var MOCK = {
 "scale": {
  "max": 75,
  "bands": [
   [
    "C1",
    65
   ],
   [
    "B2",
    51
   ],
   [
    "B1",
    38
   ]
  ]
 },
 "tests": [
  {
   "id": "1",
   "tr": "Deneme Sınavı 1",
   "uz": "Namunaviy sinov 1",
   "free": true,
   "l": {
    "min": 45,
    "parts": [
     {
      "t": "1-qism · Qisqa suhbatlar",
      "k": "mc",
      "d": "Sakkizta qisqa suhbatni tinglang va har biridan keyin savolga javob bering.",
      "qs": [
       {
        "audio": {
         "cast": {
          "Ayşe": "f",
          "Can": "m"
         },
         "lines": [
          [
           "Ayşe",
           "Can, akşam yemeğe kaçta geliyorsun? Annem yediyi düşünüyordu."
          ],
          [
           "Can",
           "Yedide zor yetişirim, toplantım altı buçukta bitiyor. Sekize doğru orada olurum."
          ],
          [
           "Ayşe",
           "Tamam, o zaman yemeği sekiz buçuğa alalım."
          ]
         ]
        },
        "q": "Akşam yemeği saat kaçta olacak?",
        "o": [
         "Yedide",
         "Sekizde",
         "Sekiz buçukta"
        ],
        "a": 2,
        "e": "Ayşe oxirida «yemeği sekiz buçuğa alalım» deydi — kechki ovqat 8:30 da. Can esa faqat «sekize doğru» yetib kelishini aytadi."
       },
       {
        "audio": {
         "cast": {
          "Oya": "f",
          "Cem": "m"
         },
         "lines": [
          [
           "Oya",
           "Bu ceketi geçen hafta aldım ama kolları biraz uzun geldi."
          ],
          [
           "Cem",
           "Değiştirmek mi istiyorsunuz, yoksa paranızı geri mi verelim?"
          ],
          [
           "Oya",
           "Aslında rengini çok seviyorum. Bir küçük bedeni varsa onu alırım."
          ]
         ]
        },
        "q": "Oya ne istiyor?",
        "o": [
         "Parasını geri almak",
         "Ceketin bir küçük bedenini almak",
         "Başka renk bir ceket almak"
        ],
        "a": 1,
        "e": "«Bir küçük bedeni varsa onu alırım» — bir oʻlcham kichigini olmoqchi. Rangi unga yoqadi, pulini qaytarishni soʻramaydi."
       },
       {
        "audio": {
         "cast": {
          "Ece": "f",
          "Tolga": "m"
         },
         "lines": [
          [
           "Tolga",
           "Hafta sonu dağa çıkacaktık ama hava raporu yağmur diyor."
          ],
          [
           "Ece",
           "O zaman planı iptal etmeyelim, sadece erteleyelim. Gelecek cumartesi nasıl?"
          ],
          [
           "Tolga",
           "Gelecek cumartesi kardeşimin düğünü var. Pazar olur mu?"
          ],
          [
           "Ece",
           "Olur, pazar sabahı erkenden çıkarız."
          ]
         ]
        },
        "q": "Dağ yürüyüşü ne zamana kaldı?",
        "o": [
         "Bu hafta sonuna",
         "Gelecek cumartesiye",
         "Gelecek pazara"
        ],
        "a": 2,
        "e": "Kelasi shanba Tolganing ukasining toʻyi, shuning uchun «Pazar olur mu?» — «Olur». Sayr kelasi yakshanbaga qoldi."
       },
       {
        "audio": {
         "cast": {
          "Gül": "f",
          "Kaan": "m"
         },
         "lines": [
          [
           "Gül",
           "Kaan, eczaneye gidiyorum. Senin için de bir şey alayım mı?"
          ],
          [
           "Kaan",
           "Baş ağrısı ilacım bitmişti ama dün aldım. Bana sadece bir şişe su alır mısın?"
          ],
          [
           "Gül",
           "Tabii, eczanenin yanındaki marketten alırım."
          ]
         ]
        },
        "q": "Gül, Kaan için ne alacak?",
        "o": [
         "Baş ağrısı ilacı",
         "Su",
         "Vitamin"
        ],
        "a": 1,
        "e": "Kaan dorini kecha olgan, endi faqat «bir şişe su» — bir shisha suv soʻraydi."
       },
       {
        "audio": {
         "cast": {
          "Ayşe": "f",
          "Can": "m"
         },
         "lines": [
          [
           "Can",
           "Yeni işin nasıl gidiyor? Yol uzun değil mi?"
          ],
          [
           "Ayşe",
           "Yol eskisinden kısa aslında, metroyla yirmi dakika. Asıl zor olan, her şeyi yeniden öğrenmek."
          ],
          [
           "Can",
           "İlk aylar hep böyledir, alışırsın."
          ]
         ]
        },
        "q": "Ayşe'yi yeni işinde en çok ne zorluyor?",
        "o": [
         "Yolun uzun olması",
         "Yeni şeyler öğrenmek",
         "Metronun kalabalık olması"
        ],
        "a": 1,
        "e": "«Asıl zor olan, her şeyi yeniden öğrenmek» — eng qiyini hammasini qaytadan oʻrganish. Yoʻl esa avvalgidan qisqa."
       },
       {
        "audio": {
         "cast": {
          "Oya": "f",
          "Cem": "m"
         },
         "lines": [
          [
           "Oya",
           "Bu kitabı kütüphaneden ödünç almıştım. Acaba iade tarihi geçti mi?"
          ],
          [
           "Cem",
           "Bir bakayım… Son gün dündü. Ama bir gün için ceza yok, sadece bir dahaki sefere dikkat edin."
          ],
          [
           "Oya",
           "Çok teşekkür ederim, bir daha olmaz."
          ]
         ]
        },
        "q": "Kütüphane görevlisi ne söylüyor?",
        "o": [
         "Oya'nın ceza ödemesi gerektiğini",
         "Kitabın iade tarihinin yarın olduğunu",
         "Bu sefer ceza olmadığını"
        ],
        "a": 2,
        "e": "«Bir gün için ceza yok» — bir kunlik kechikish uchun jarima yoʻq. Oxirgi kun kecha boʻlgan, ertaga emas."
       },
       {
        "audio": {
         "cast": {
          "Ece": "f",
          "Tolga": "m"
         },
         "lines": [
          [
           "Ece",
           "Tolga, bu akşamki konsere nasıl gidiyoruz? Otobüsle mi, metroyla mı?"
          ],
          [
           "Tolga",
           "Otobüs çok yavaş, metro da konser salonuna uzak. Bence taksiye binelim, zaten üç kişiyiz."
          ],
          [
           "Ece",
           "Haklısın, ücreti de üçe böleriz."
          ]
         ]
        },
        "q": "Konsere nasıl gidecekler?",
        "o": [
         "Otobüsle",
         "Metroyla",
         "Taksiyle"
        ],
        "a": 2,
        "e": "Tolga «taksiye binelim» deydi, Ece rozi boʻladi — taksida boradilar. Avtobus sekin, metro esa konsert zalidan uzoq."
       },
       {
        "audio": {
         "cast": {
          "Gül": "f",
          "Kaan": "m"
         },
         "lines": [
          [
           "Kaan",
           "Gül, toplantı yarın sabah değil miydi?"
          ],
          [
           "Gül",
           "Öyleydi ama müdür hastalandı. Toplantıyı perşembe öğleden sonraya aldık."
          ],
          [
           "Kaan",
           "Perşembe öğleden sonra dersim var ama dersten sonra yetişirim."
          ]
         ]
        },
        "q": "Toplantı ne zaman yapılacak?",
        "o": [
         "Yarın sabah",
         "Perşembe öğleden sonra",
         "Perşembe sabah"
        ],
        "a": 1,
        "e": "«Toplantıyı perşembe öğleden sonraya aldık» — yigʻilish payshanba kuni tushdan keyinga koʻchirildi."
       }
      ]
     },
     {
      "t": "2-qism · Eʼlon",
      "k": "gap",
      "d": "Kutubxona eʼlonini tinglang va yozuvdagi boʻsh joylarni toʻldiring. Har bir joyga bitta soʻz yoki raqam yozing.",
      "audio": {
       "cast": {
        "Spiker": "f"
       },
       "lines": [
        [
         "Spiker",
         "Değerli dinleyiciler, Karşıyaka Halk Kütüphanesi'nden önemli bir duyuru."
        ],
        [
         "Spiker",
         "Kütüphanemiz bakım çalışmaları nedeniyle on beş Mart'tan itibaren iki hafta kapalı olacaktır."
        ],
        [
         "Spiker",
         "Bu süre içinde kitaplarınızı kütüphanenin arka kapısındaki iade kutusuna bırakabilirsiniz."
        ],
        [
         "Spiker",
         "Yeniden açılışla birlikte çalışma saatlerimiz de değişiyor: hafta içi sabah dokuzdan akşam sekize kadar hizmet vereceğiz."
        ],
        [
         "Spiker",
         "Cumartesi günleri ise çocuklar için ücretsiz masal saati düzenlenecek."
        ],
        [
         "Spiker",
         "Masal saatine katılmak için kütüphanenin internet sitesinden kayıt yaptırmanız gerekiyor."
        ],
        [
         "Spiker",
         "Kayıtlar her hafta perşembe günü başlıyor ve yer sayısı yirmi çocukla sınırlı."
        ],
        [
         "Spiker",
         "Ayrıntılı bilgi için bizi her zaman arayabilirsiniz. İyi günler dileriz."
        ]
       ]
      },
      "title": "Karşıyaka Halk Kütüphanesi — notlar",
      "qs": [
       {
        "q": "Kütüphane ___ hafta kapalı olacak.",
        "a": "iki / 2",
        "e": "«İki hafta kapalı olacaktır» — ikki hafta yopiq boʻladi."
       },
       {
        "q": "Kitaplar arka kapıdaki iade ___ bırakılabilir.",
        "a": "kutusuna / kutusu / kutu",
        "e": "«İade kutusuna bırakabilirsiniz» — qaytarish qutisiga."
       },
       {
        "q": "Yeni çalışma saatleri: hafta içi 09.00 – ___",
        "a": "20.00 / 20:00 / 20 / sekiz / akşam sekiz / 8",
        "e": "«Sabah dokuzdan akşam sekize kadar» — 9:00 dan 20:00 gacha."
       },
       {
        "q": "Cumartesi günleri çocuklar için ücretsiz ___ saati var.",
        "a": "masal",
        "e": "«Ücretsiz masal saati» — bepul ertak soati."
       },
       {
        "q": "Kayıtlar her hafta ___ günü başlıyor.",
        "a": "perşembe",
        "e": "«Kayıtlar her hafta perşembe günü başlıyor» — roʻyxat payshanba kuni boshlanadi."
       },
       {
        "q": "Masal saatine en fazla ___ çocuk katılabilir.",
        "a": "yirmi / 20",
        "e": "«Yer sayısı yirmi çocukla sınırlı» — joylar 20 bola bilan cheklangan."
       }
      ]
     },
     {
      "t": "3-qism · Fikrlar",
      "k": "mc",
      "d": "Toʻrt kishi uydan ishlash haqida gapiradi. Har bir soʻzlovchiga mos fikrni tanlang (A–F). Ikkita variant ortiqcha.",
      "audio": {
       "cast": {
        "Selma": "f",
        "Burak": "m",
        "Leyla": "f",
        "Emre": "m"
       },
       "lines": [
        [
         "Selma",
         "Evden çalışmaya başladığımdan beri sabahları trafikte kaybettiğim bir saati spora ayırıyorum. Kendimi hiç bu kadar enerjik hissetmemiştim."
        ],
        [
         "Burak",
         "Evde çalışmak bana göre değil. Mutfakla çalışma masası arasında gidip gelirken dikkatim sürekli dağılıyor. Ofiste çok daha verimliyim."
        ],
        [
         "Leyla",
         "Bence en iyisi karma sistem. Haftada iki gün ofise gidip arkadaşlarımla yüz yüze görüşüyorum, kalan günlerde evde sessizce çalışıyorum."
        ],
        [
         "Emre",
         "Evden çalışınca iş ile özel hayat arasındaki sınır kayboldu. Akşam dokuzda bile e-posta cevaplıyorum ve bu beni çok yoruyor."
        ]
       ]
      },
      "o": [
       "Ofiste daha iyi odaklanıyor.",
       "Kazandığı zamanı sağlığı için kullanıyor.",
       "Çalışma saatlerinin uzadığından şikâyet ediyor.",
       "İki çalışma biçimini birleştirmeyi tercih ediyor.",
       "Evden çalışmak için yeni bir ev aldı.",
       "Patronunun izin vermediğini söylüyor."
      ],
      "qs": [
       {
        "q": "Selma",
        "a": 1,
        "e": "Selma tirbandlikda yoʻqotadigan bir soatini sportga ajratadi — vaqtini sogʻligʻiga sarflaydi."
       },
       {
        "q": "Burak",
        "a": 0,
        "e": "Burak uyda chalgʻiydi, ofisda «çok daha verimli» — samaraliroq ishlaydi."
       },
       {
        "q": "Leyla",
        "a": 3,
        "e": "«Karma sistem» — haftada ikki kun ofisda, qolgan kunlar uyda: ikkala usulni birlashtiradi."
       },
       {
        "q": "Emre",
        "a": 2,
        "e": "Ish va shaxsiy hayot chegarasi yoʻqolgan, kechki toʻqqizda ham xatlarga javob beradi — ish soatlari choʻzilgan."
       }
      ]
     },
     {
      "t": "4-qism · Xarita",
      "k": "mc",
      "d": "Kampus boʻylab sayohatni tinglang. Xaritaga qarab har bir joyning harfini tanlang (A–G). Ikkita harf ortiqcha.",
      "audio": {
       "cast": {
        "Rehber": "f"
       },
       "lines": [
        [
         "Rehber",
         "Kampüsümüze hoş geldiniz! Şu anda ana girişteyiz. Tam karşınızda gördüğünüz fıskiye, kampüsün ortasında yer alıyor."
        ],
        [
         "Rehber",
         "Fıskiyenin sol tarafındaki bina kütüphanemiz. Hafta içi gece yarısına kadar açık."
        ],
        [
         "Rehber",
         "Fıskiyenin arkasından dümdüz devam ederseniz spor salonuna ulaşırsınız."
        ],
        [
         "Rehber",
         "Sağlık merkezi ise spor salonunun hemen solunda, köşedeki binada."
        ],
        [
         "Rehber",
         "Fıskiyenin sağ tarafında öğrenci işleri var; kayıt işlemlerinizi orada yapacaksınız."
        ],
        [
         "Rehber",
         "Girişten girer girmez sağ tarafta kafeteryayı göreceksiniz, öğle yemeği orada veriliyor."
        ],
        [
         "Rehber",
         "Sağ üst köşedeki bina öğrenci yurdu. Girişin solundaki bina ise şu anda yenileniyor, o yüzden kapalı."
        ]
       ]
      },
      "map": {
       "w": 320,
       "h": 232,
       "paths": [
        [
         160,
         200,
         160,
         135
        ],
        [
         160,
         91,
         160,
         58
        ],
        [
         138,
         113,
         92,
         113
        ],
        [
         182,
         113,
         228,
         113
        ]
       ],
       "boxes": [
        {
         "l": "A",
         "x": 10,
         "y": 10,
         "w": 95,
         "h": 46
        },
        {
         "l": "B",
         "x": 112,
         "y": 10,
         "w": 96,
         "h": 46
        },
        {
         "l": "C",
         "x": 215,
         "y": 10,
         "w": 95,
         "h": 46
        },
        {
         "l": "D",
         "x": 10,
         "y": 90,
         "w": 80,
         "h": 46
        },
        {
         "l": "E",
         "x": 230,
         "y": 90,
         "w": 80,
         "h": 46
        },
        {
         "l": "F",
         "x": 10,
         "y": 172,
         "w": 100,
         "h": 46
        },
        {
         "l": "G",
         "x": 210,
         "y": 172,
         "w": 100,
         "h": 46
        }
       ],
       "marks": [
        {
         "t": "Fıskiye",
         "x": 160,
         "y": 113,
         "r": 22
        }
       ],
       "gate": {
        "t": "Giriş",
        "x": 124,
        "y": 202,
        "w": 72,
        "h": 26
       }
      },
      "o": [
       "A",
       "B",
       "C",
       "D",
       "E",
       "F",
       "G"
      ],
      "qs": [
       {
        "q": "Kütüphane",
        "a": 3,
        "e": "«Fıskiyenin sol tarafındaki bina kütüphanemiz» — favvoraning chap tomoni: D."
       },
       {
        "q": "Spor salonu",
        "a": 1,
        "e": "«Fıskiyenin arkasından dümdüz devam ederseniz spor salonu» — favvoradan toʻgʻri yuqoriga: B."
       },
       {
        "q": "Sağlık merkezi",
        "a": 0,
        "e": "«Spor salonunun hemen solunda, köşedeki binada» — sport zalining chap tomonidagi burchak: A."
       },
       {
        "q": "Öğrenci işleri",
        "a": 4,
        "e": "«Fıskiyenin sağ tarafında öğrenci işleri var» — favvoraning oʻng tomoni: E."
       },
       {
        "q": "Kafeterya",
        "a": 6,
        "e": "«Girişten girer girmez sağ tarafta kafeterya» — kirish eshigining oʻng tomoni: G."
       }
      ]
     },
     {
      "t": "5-qism · Uchta parcha",
      "k": "mc",
      "d": "Uchta qisqa parchani tinglang. Har bir parchadan keyin ikkita savolga javob bering.",
      "qs": [
       {
        "h": "1-parcha",
        "audio": {
         "cast": {
          "Sunucu": "f",
          "Mehmet Bey": "m"
         },
         "lines": [
          [
           "Sunucu",
           "Mehmet Bey, mahallenizdeki tamir kafesi fikri nereden çıktı?"
          ],
          [
           "Mehmet Bey",
           "Emekli olunca insanların küçük bir arıza yüzünden çalışan cihazları çöpe attığını gördüm. Şimdi ayda iki kez, cumartesi günleri kültür merkezinde buluşuyoruz ve gönüllülerimiz eşyaları ücretsiz tamir ediyor."
          ],
          [
           "Sunucu",
           "En büyük zorluğunuz ne?"
          ],
          [
           "Mehmet Bey",
           "Yedek parça bulmak. Bazı firmalar parçaları ayrı satmıyor, bu yüzden basit bir cihazı bile tamir edemediğimiz oluyor."
          ]
         ]
        },
        "q": "Tamir kafesi ne sıklıkla toplanıyor?",
        "o": [
         "Her cumartesi",
         "Ayda iki kez",
         "Ayda bir kez"
        ],
        "a": 1,
        "e": "«Ayda iki kez, cumartesi günleri» — oyda ikki marta, shanba kunlari."
       },
       {
        "q": "Mehmet Bey'e göre en büyük zorluk nedir?",
        "o": [
         "Yedek parça bulmak",
         "Gönüllü bulmak",
         "Toplanacak yer bulmak"
        ],
        "a": 0,
        "e": "«Yedek parça bulmak» — ehtiyot qism topish; baʼzi firmalar qismlarni alohida sotmaydi."
       },
       {
        "h": "2-parcha",
        "audio": {
         "cast": {
          "Oya": "f",
          "Can": "m"
         },
         "lines": [
          [
           "Oya",
           "Bu yaz tatili için ne düşünüyorsun? Ben deniz kenarında güzel bir otel buldum."
          ],
          [
           "Can",
           "Otel güzel ama fiyatı çok yüksek. Geçen yıl kamp yapmıştık, çok eğlenmiştik."
          ],
          [
           "Oya",
           "Kamp çok yorucu ama. Ortasını bulalım: deniz kenarında küçük bir pansiyon tutalım."
          ],
          [
           "Can",
           "Tamam, ama ağustos yerine temmuzun başında gidelim. Ağustosta her yer çok kalabalık oluyor."
          ]
         ]
        },
        "q": "Tatilde nerede kalacaklar?",
        "o": [
         "Otelde",
         "Kampta",
         "Pansiyonda"
        ],
        "a": 2,
        "e": "Oya «küçük bir pansiyon tutalım» deydi, Can «tamam» deb rozi boʻladi."
       },
       {
        "q": "Can neden temmuzu tercih ediyor?",
        "o": [
         "Ağustosta her yer kalabalık olduğu için",
         "Temmuzda fiyatlar düşük olduğu için",
         "Ağustosta işi olduğu için"
        ],
        "a": 0,
        "e": "«Ağustosta her yer çok kalabalık oluyor» — avgustda hamma joy gavjum boʻladi."
       },
       {
        "h": "3-parcha",
        "audio": {
         "cast": {
          "Spiker": "f"
         },
         "lines": [
          [
           "Spiker",
           "Şimdi de hafta sonu için hava durumu. Cumartesi sabah saatlerinde İzmir ve çevresinde sağanak yağış bekleniyor. Öğleden sonra ise yağmur yerini güneşe bırakacak."
          ],
          [
           "Spiker",
           "Pazar günü hava açık ve sıcak olacak; sıcaklık otuz dereceye kadar çıkacak. Denize girmek isteyenler için en uygun gün pazar. Ancak akşam saatlerinde rüzgâr kuvvetlenebilir."
          ]
         ]
        },
        "q": "Cumartesi sabahı hava nasıl olacak?",
        "o": [
         "Güneşli",
         "Yağmurlu",
         "Rüzgârlı"
        ],
        "a": 1,
        "e": "«Cumartesi sabah saatlerinde sağanak yağış bekleniyor» — shanba ertalab jala kutilmoqda."
       },
       {
        "q": "Spikere göre denize girmek için en uygun zaman hangisi?",
        "o": [
         "Cumartesi öğleden sonra",
         "Pazar günü",
         "Pazar akşamı"
        ],
        "a": 1,
        "e": "«Denize girmek isteyenler için en uygun gün pazar» — lekin kechqurun shamol kuchayishi mumkin."
       }
      ]
     },
     {
      "t": "6-qism · Maʼruza",
      "k": "gap",
      "d": "Universitetdagi qisqa maʼruzani tinglang va qaydlardagi boʻsh joylarni toʻldiring. Har bir joyga bitta soʻz yoki raqam yozing.",
      "audio": {
       "cast": {
        "Elif Hoca": "f"
       },
       "lines": [
        [
         "Elif Hoca",
         "Bugün sizlere üniversitemizde geçen yıl yapılan bir araştırmadan söz edeceğim. Araştırmaya iki yüz öğrenci katıldı."
        ],
        [
         "Elif Hoca",
         "Öğrencilerin çoğu en verimli çalışma saatinin sabah olduğunu söyledi; ama aslında büyük bir kısmı gece çalışıyordu."
        ],
        [
         "Elif Hoca",
         "Katılımcıların yarısından fazlası çalışırken telefonunu yanında tutuyordu ve ortalama her on iki dakikada bir telefonuna bakıyordu."
        ],
        [
         "Elif Hoca",
         "Telefonunu başka bir odaya bırakan öğrencilerin sınav notları ise yüzde on beş daha yüksekti."
        ],
        [
         "Elif Hoca",
         "Bir diğer sonuç da şuydu: kısa molalar veren öğrenciler, saatlerce ara vermeden çalışanlardan daha az yoruluyordu."
        ],
        [
         "Elif Hoca",
         "Bu yüzden size kırk beş dakika çalışıp on dakika mola vermenizi öneriyorum. Bir sonraki dersimizde not alma yöntemlerini konuşacağız."
        ]
       ]
      },
      "title": "Ders çalışma alışkanlıkları — notlar",
      "qs": [
       {
        "q": "Araştırmaya ___ öğrenci katıldı.",
        "a": "iki yüz / 200 / ikiyüz",
        "e": "«Araştırmaya iki yüz öğrenci katıldı» — tadqiqotda 200 talaba qatnashgan."
       },
       {
        "q": "Öğrenciler en verimli saatin ___ olduğunu söyledi.",
        "a": "sabah",
        "e": "«En verimli çalışma saatinin sabah olduğunu söyledi» — lekin aslida koʻpchilik kechasi oʻqigan."
       },
       {
        "q": "Öğrenciler ortalama her ___ dakikada bir telefona bakıyordu.",
        "a": "on iki / 12 / oniki",
        "e": "«Ortalama her on iki dakikada bir» — oʻrtacha har 12 daqiqada."
       },
       {
        "q": "Telefonunu başka odada bırakanların notları yüzde ___ daha yüksekti.",
        "a": "on beş / 15 / onbeş",
        "e": "«Yüzde on beş daha yüksekti» — 15 foiz yuqori."
       },
       {
        "q": "Kısa ___ veren öğrenciler daha az yoruluyordu.",
        "a": "molalar / mola",
        "e": "«Kısa molalar veren öğrenciler» — qisqa tanaffus qilgan talabalar kamroq charchagan."
       },
       {
        "q": "Bir sonraki derste ___ alma yöntemleri konuşulacak.",
        "a": "not",
        "e": "«Bir sonraki dersimizde not alma yöntemlerini konuşacağız» — keyingi darsda qayd olish usullari."
       }
      ]
     }
    ]
   },
   "r": {
    "min": 60,
    "parts": [
     {
      "t": "1-qism · Boʻsh joylar",
      "k": "gap",
      "d": "Eʼlonni oʻqing. Har bir boʻsh joyga mos keladigan bitta soʻz yozing.",
      "title": "Apartman bahar şenliği",
      "text": "Sevgili komşularımız,\n\nÖnümüzdeki cumartesi apartmanımızın bahçesinde bir temizlik ve bahar şenliği düzenliyoruz. Etkinlik sabah onda başlayıp öğleden sonra üçe (1) ___ sürecek. Temizlikten sonra hep (2) ___ bahçeye çiçek ekeceğiz. Eldivenleri ve çöp torbalarını yönetim karşılayacak; sizden (3) ___ istediğimiz şey, güler yüz ve biraz zaman. Etkinliğe katılmak isteyen komşularımızın cuma akşamına (4) ___ kapıcımız Hasan Bey'e haber vermesi yeterli. Çocuklar (5) ___ bir resim yarışması da olacak. Yağmur yağarsa etkinlik bir hafta (6) ___ ertelenecek.\n\nApartman Yönetimi",
      "qs": [
       {
        "q": "___",
        "a": "kadar",
        "e": "«-e kadar» — «…gacha»: üçe kadar = soat uchgacha."
       },
       {
        "q": "___",
        "a": "birlikte / beraber",
        "e": "«Hep birlikte» — hammamiz birgalikda."
       },
       {
        "q": "___",
        "a": "sadece / yalnızca / yalnız",
        "e": "«Sizden sadece istediğimiz şey…» — sizdan faqat soʻraydiganimiz…"
       },
       {
        "q": "___",
        "a": "kadar / dek",
        "e": "«Cuma akşamına kadar» — juma kechqurungacha."
       },
       {
        "q": "___",
        "a": "için",
        "e": "«Çocuklar için» — bolalar uchun."
       },
       {
        "q": "___",
        "a": "sonraya / ileriye",
        "e": "«Bir hafta sonraya ertelenecek» — bir hafta keyinga qoldiriladi."
       }
      ]
     },
     {
      "t": "2-qism · Eʼlonlar",
      "k": "mc",
      "d": "Oʻnta qisqa eʼlonni (A–J) va sakkiz kishi haqidagi maʼlumotni oʻqing. Har bir kishiga eng mos eʼlonni tanlang. Ikkita eʼlon ortiqcha.",
      "o": [
       "Yüzme kursu: Yetişkinler için hafta sonu sabah grupları açılıyor. İlk ders ücretsiz.",
       "Satılık bisiklet: Az kullanılmış, şehir içi için ideal. Yanında kask da veriyoruz.",
       "Gitar dersleri: Deneyimli öğretmenden birebir ders. Çocuklar ve yetişkinler kabul edilir; dersler akşam saatlerinde.",
       "Evde yemek hizmeti: Haftada üç gün evinize sıcak ve sağlıklı yemek getiriyoruz. Yaşlılara indirim yapılır.",
       "Kayıp kedi: Beyaz, mavi gözlü kedimiz Kar dün akşamdan beri kayıp. Görenlerin bizi aramasını rica ederiz.",
       "Fotoğrafçılık atölyesi: Telefonla güzel fotoğraf çekmenin yollarını öğrenin. Cumartesi öğleden sonra, tek günlük ve ücretsiz.",
       "Özel matematik dersi: Lise öğrencilerine üniversite sınavına hazırlık. Çevrim içi ders de verilir.",
       "Ev arkadaşı aranıyor: Üniversiteye yürüme mesafesindeki iki odalı evde kalacak sessiz bir öğrenci arıyoruz. Kira uygun.",
       "Bahçe bakımı: Çim biçme, ağaç budama ve çiçek dikimi. Hafta içi her gün hizmetinizdeyiz.",
       "Türkçe konuşma kulübü: Yabancı öğrenciler için her çarşamba akşamı kafede sohbet. Katılım ücretsiz."
      ],
      "qs": [
       {
        "q": "Rustam İzmir'e yeni geldi ve Türkçesini geliştirmek için yerli insanlarla konuşmak istiyor.",
        "a": 9,
        "e": "J — chet ellik talabalar uchun har chorshanba kafeda suhbat: turklar bilan gaplashish imkoniyati."
       },
       {
        "q": "Zehra Hanım yetmiş yaşında; artık her gün yemek yapmakta zorlanıyor.",
        "a": 3,
        "e": "D — uyga issiq ovqat yetkazish, keksalarga chegirma bor."
       },
       {
        "q": "Murat hafta içi çok çalışıyor ama cumartesi sabahları spor yapmak istiyor.",
        "a": 0,
        "e": "A — kattalar uchun dam olish kunlari ertalabki suzish guruhlari."
       },
       {
        "q": "Leyla üniversiteyi kazandı ve okula yakın, uygun fiyatlı bir yer arıyor.",
        "a": 7,
        "e": "H — universitetga piyoda boriladigan uyda arzon ijara."
       },
       {
        "q": "Kerem'in oğlu üniversite sınavına hazırlanıyor ve matematikte zorlanıyor.",
        "a": 6,
        "e": "G — litsey oʻquvchilarini universitet imtihoniga tayyorlash (matematika)."
       },
       {
        "q": "Defne tatilde çektiği fotoğrafların daha güzel olmasını istiyor ama kursa para vermek istemiyor.",
        "a": 5,
        "e": "F — telefon bilan suratga olish boʻyicha bepul bir kunlik ustaxona."
       },
       {
        "q": "Can okula arabayla gitmek yerine daha sağlıklı ve ucuz bir yol arıyor.",
        "a": 1,
        "e": "B — sotiladigan velosiped: arzon va sogʻliq uchun foydali."
       },
       {
        "q": "Akşamları boş vakti olan Selin bir müzik aleti çalmayı öğrenmek istiyor.",
        "a": 2,
        "e": "C — gitara darslari kechqurun boʻladi."
       }
      ]
     },
     {
      "t": "3-qism · Sarlavhalar",
      "k": "mc",
      "d": "Matndagi oltita xatboshini oʻqing va har biriga mos sarlavhani tanlang (A–H). Ikkita sarlavha ortiqcha.",
      "title": "İyi bir uyku için altı öneri",
      "o": [
       "Gündüz hareket edin",
       "Kahve içmenin faydaları",
       "Uyku için doğru ortam",
       "Düzenli bir uyku saati",
       "Öğle uykusu ne kadar olmalı?",
       "Akşam yemeğine dikkat",
       "Ekranlardan uzak durun",
       "Akşamları kafeinden uzak durun"
      ],
      "qs": [
       {
        "q": "Her gece farklı saatlerde yatmak vücudun iç saatini karıştırır. Hafta sonları bile aynı saatte yatıp kalkmak, uykuya dalmayı kolaylaştırır.",
        "a": 3,
        "e": "Har kecha bir vaqtda yotish — «Düzenli bir uyku saati» (muntazam uyqu vaqti)."
       },
       {
        "q": "Telefon ve bilgisayar ekranlarının mavi ışığı, beyne hâlâ gündüz olduğu mesajını verir. Yatmadan en az bir saat önce ekranları kapatmak uykunun kalitesini artırır.",
        "a": 6,
        "e": "Ekranlar nuri haqida — «Ekranlardan uzak durun» (ekranlardan uzoq turing)."
       },
       {
        "q": "Ağır ve yağlı bir yemek midede uzun süre kalır. Akşam yemeğini yatmadan iki üç saat önce ve hafif bir şekilde yemek daha doğrudur.",
        "a": 5,
        "e": "Ogʻir kechki ovqat haqida — «Akşam yemeğine dikkat»."
       },
       {
        "q": "Kafein yalnızca kahvede değil, çayda ve bazı gazlı içeceklerde de bulunur. Bu içecekleri öğleden sonra içmek, gece uykuya dalmayı zorlaştırabilir.",
        "a": 7,
        "e": "Kofein faqat qahvada emas — kechqurun kofeindan saqlanish haqida: H. «Kahve içmenin faydaları» bu yerga mos emas."
       },
       {
        "q": "Yatak odası serin, karanlık ve sessiz olmalıdır. Kalın perdeler ve rahat bir yastık, küçük ama etkili değişikliklerdir.",
        "a": 2,
        "e": "Xona salqin, qorongʻi va jim boʻlishi — «Uyku için doğru ortam» (uyqu uchun toʻgʻri muhit)."
       },
       {
        "q": "Gün içinde yapılan yürüyüş ya da hafif egzersiz, gece daha derin uyumayı sağlar. Ancak yoğun sporu yatmadan hemen önce yapmamak gerekir.",
        "a": 0,
        "e": "Kunduzi yurish va mashq — «Gündüz hareket edin» (kunduzi harakat qiling)."
       }
      ]
     },
     {
      "t": "4-qism · Matn",
      "k": "mc",
      "d": "Matnni oʻqing. 1–4 savollarda toʻgʻri javobni tanlang. Keyingi gaplar matnga mos kelsa — «Doğru», zid boʻlsa — «Yanlış», matnda bu haqda maʼlumot boʻlmasa — «Verilmemiş».",
      "title": "Tohumları paylaşan köy",
      "text": "Ege'nin küçük bir köyünde yaşayan Fatma Hanım, yıllar önce annesinden kalan bir avuç domates tohumunu saklarken bunun bir gün köyün kaderini değiştireceğini bilmiyordu. Köylüler uzun süre marketlerden aldıkları hazır tohumları kullanmıştı. Bu tohumlardan alınan ürünler güzel görünüyordu ama bir sonraki yıl yeniden ekilemiyordu; çiftçiler her yıl tohum satın almak zorundaydı.\n\nFatma Hanım, emekli öğretmen olan komşusu Hüseyin Bey'le birlikte köy kahvesinin bir köşesine küçük bir dolap yerleştirdi. Dolaba yerel tohumlarla dolu kavanozlar koydular ve basit bir kural belirlediler: Dolaptan tohum alan kişi, hasattan sonra aldığının iki katını geri getirecekti. İlk yıl sadece birkaç komşu bu fikre güvendi. İkinci yıl ise dolap yetmedi ve köy okulunun boş bir sınıfı tohum kütüphanesine dönüştürüldü.\n\nBugün kütüphanede kırktan fazla yerel bitki türü var. Öğrenciler her bahar kavanozlara etiket yazıyor; tohumların hangi aileden geldiğini ve hangi toprağı sevdiğini kaydediyor. Yaşlılar ise bu sayede unuttukları tatları yeniden buluyor. Hüseyin Bey'e göre asıl kazanç ekonomik değil: \"İnsanlar birbirine yeniden güvenmeye başladı. Tohum paylaşmak, aslında hikâye paylaşmak demek.\"\n\nYine de her şey kolay olmadı. Bazı çiftçiler yerel tohumların daha az ürün verdiğini söyleyerek eski alışkanlıklarına döndü. Fatma Hanım bunu doğal karşılıyor: \"Herkesin ikna olması zaman alır. Biz kimseyi zorlamıyoruz, sadece seçenek sunuyoruz.\" Komşu köylerden gelen ziyaretçilerin sayısı her yıl artıyor. Belki birkaç yıl sonra bu küçük kavanozlar, bütün bölgenin ortak hafızası olacak.",
      "o": [
       "Doğru",
       "Yanlış",
       "Verilmemiş"
      ],
      "qs": [
       {
        "q": "Köylüler hazır tohumlarla ilgili hangi sorunu yaşıyordu?",
        "o": [
         "Ürünler güzel görünmüyordu",
         "Tohumlar bir sonraki yıl yeniden ekilemiyordu",
         "Tohumlar köye çok geç geliyordu",
         "Ürünler marketlerde satılmıyordu"
        ],
        "a": 1,
        "e": "1-xatbosh: hosil chiroyli, lekin urugʻini keyingi yili qayta ekib boʻlmasdi — har yili yangi urugʻ sotib olish kerak edi."
       },
       {
        "q": "Tohum dolabının kuralı neydi?",
        "o": [
         "Tohum almak için para ödemek",
         "Hasattan sonra aldığının iki katını geri getirmek",
         "Sadece öğretmenlerin tohum alabilmesi",
         "Her ailenin yılda bir kavanoz alması"
        ],
        "a": 1,
        "e": "«Aldığının iki katını geri getirecekti» — olganining ikki baravarini qaytarib olib kelish."
       },
       {
        "q": "Hüseyin Bey'e göre projenin en önemli kazancı nedir?",
        "o": [
         "Köyün daha çok para kazanması",
         "İnsanlar arasındaki güvenin artması",
         "Okulun yeni sınıflar açması",
         "Ürünlerin daha çok satılması"
        ],
        "a": 1,
        "e": "«Asıl kazanç ekonomik değil… İnsanlar birbirine yeniden güvenmeye başladı» — asosiy foyda — ishonch."
       },
       {
        "q": "Fatma Hanım, eski alışkanlıklarına dönen çiftçiler hakkında ne düşünüyor?",
        "o": [
         "Onlara kızıyor",
         "Onları ikna etmek için para veriyor",
         "Bunu doğal buluyor ve kimseyi zorlamıyor",
         "Onları kütüphaneden uzaklaştırıyor"
        ],
        "a": 2,
        "e": "«Bunu doğal karşılıyor… Biz kimseyi zorlamıyoruz» — buni tabiiy qabul qiladi, hech kimni majburlamaydi."
       },
       {
        "q": "Fatma Hanım'ın sakladığı tohumlar annesinden kalmıştı.",
        "a": 0,
        "e": "«Annesinden kalan bir avuç domates tohumu» — urugʻlar onasidan qolgan."
       },
       {
        "q": "Tohum dolabı daha ilk yılında çok popüler oldu.",
        "a": 1,
        "e": "«İlk yıl sadece birkaç komşu bu fikre güvendi» — birinchi yili faqat bir necha qoʻshni ishongan."
       },
       {
        "q": "Kütüphane köy okulunun boş bir sınıfına taşındı.",
        "a": 0,
        "e": "«Köy okulunun boş bir sınıfı tohum kütüphanesine dönüştürüldü»."
       },
       {
        "q": "Kütüphanedeki tohumlar başka ülkelere de gönderiliyor.",
        "a": 2,
        "e": "Urugʻlarning chet elga yuborilishi haqida matnda hech narsa yoʻq — «Verilmemiş»."
       },
       {
        "q": "Köydeki bütün çiftçiler yerel tohumlara geçti.",
        "a": 1,
        "e": "«Bazı çiftçiler … eski alışkanlıklarına döndü» — hammasi emas."
       }
      ]
     },
     {
      "t": "5-qism · Matn va xulosa",
      "k": "mc",
      "d": "Matnni oʻqing. Xulosadagi boʻsh joylarni matndagi bitta soʻz bilan toʻldiring, soʻng ikkita savolga javob bering.",
      "title": "Çatıda sebze bahçeleri",
      "text": "Bir yıl önce Yeşilvadi Belediyesi, şehir merkezindeki okulların ve kamu binalarının düz çatılarını sebze bahçesine dönüştürmeye karar verdi. Projenin ilk aşamasında on iki binanın çatısında toplam üç bin metrekarelik bir alan hazırlandı. Bahçelerde domates, biber, fasulye ve çeşitli otlar yetiştiriliyor.\n\nBahçelerin bakımını belediye çalışanları değil, mahalle sakinlerinden oluşan gönüllü grupları yapıyor. Her grup, sulama ve temizlik için haftada en az iki kez çatıya çıkıyor. Elde edilen ürünlerin yarısı okul yemekhanelerine gönderiliyor, kalanı ise gönüllüler arasında paylaştırılıyor.\n\nUzmanlara göre çatı bahçeleri yazın binaların içini birkaç derece serinletiyor; bu da klima kullanımını azaltıyor. Belediye, projenin ikinci aşamasında hastane ve kütüphane çatılarını da eklemeyi planlıyor. Ancak bazı eski binaların çatıları toprağın ağırlığını taşıyamayacağı için bu binalar projeye dahil edilmeyecek.",
      "sum": "Yeşilvadi Belediyesi, şehir merkezindeki okulların ve kamu binalarının (30) ___ sebze bahçesine dönüştürdü. Bahçelerin bakımını mahalle sakinlerinden oluşan (31) ___ grupları yapıyor. Elde edilen ürünlerin yarısı okul (32) ___ gönderiliyor. Uzmanlara göre bu bahçeler yazın binaları serinletiyor ve (33) ___ kullanımını azaltıyor.",
      "qs": [
       {
        "k": "gap",
        "q": "___",
        "a": "çatılarını / çatılarını / çatıları / çatılar",
        "e": "Matnda: «düz çatılarını sebze bahçesine dönüştürmeye karar verdi» — tomlarini."
       },
       {
        "k": "gap",
        "q": "___",
        "a": "gönüllü",
        "e": "«Mahalle sakinlerinden oluşan gönüllü grupları» — koʻngillilar guruhlari."
       },
       {
        "k": "gap",
        "q": "___",
        "a": "yemekhanelerine / yemekhanelere / yemekhanesine",
        "e": "«Ürünlerin yarısı okul yemekhanelerine gönderiliyor» — maktab oshxonalariga."
       },
       {
        "k": "gap",
        "q": "___",
        "a": "klima",
        "e": "«Klima kullanımını azaltıyor» — konditsionerdan foydalanishni kamaytiradi."
       },
       {
        "q": "Bazı eski binalar projeye neden dahil edilmeyecek?",
        "o": [
         "Çatıları toprağın ağırlığını taşıyamayacağı için",
         "Sahipleri izin vermediği için",
         "Çatıları çok küçük olduğu için",
         "Yeterince güneş almadıkları için"
        ],
        "a": 0,
        "e": "«Bazı eski binaların çatıları toprağın ağırlığını taşıyamayacağı için…» — tomlari tuproq ogʻirligini koʻtara olmaydi."
       },
       {
        "q": "Metnin ana fikri nedir?",
        "o": [
         "Şehirde tarım yapmak imkânsızdır",
         "Çatı bahçeleri hem çevreye hem de topluma fayda sağlıyor",
         "Belediye okul yemeklerini ucuzlatmak istiyor",
         "Gönüllüler maaş almadan çalışmak istemiyor"
        ],
        "a": 1,
        "e": "Matn tom bogʻlarining foydasi haqida: hosil, binolarni salqinlatish, mahalla aholisining birga ishlashi."
       }
      ]
     }
    ]
   },
   "w": {
    "min": 60,
    "ctx": "Spor salonunuzun müdüründen bütün üyelere şu e-posta geldi:\n\n«Değerli üyelerimiz, önümüzdeki aydan itibaren salonumuzda yenileme çalışmaları başlayacak. Bu nedenle salon iki ay boyunca hafta sonları kapalı olacak, yüzme havuzu da kullanılamayacak. Ayrıca artan masraflar yüzünden aylık üyelik ücreti yüzde yirmi artacak. Görüş ve önerilerinizi bekliyoruz.»",
    "tasks": [
     {
      "id": "1.1",
      "t": "1.1-topshiriq · Doʻstga xabar",
      "min": 45,
      "max": 65,
      "w": 1,
      "lv": "A2",
      "ctx": 1,
      "d": "Eʼlonni oʻqing. Shu sport zaliga birga qatnaydigan doʻstingizga norasmiy xabar yozing (taxminan 50 soʻz).",
      "tr": "Bu spor salonuna birlikte gittiğiniz arkadaşınıza bir mesaj yazın. Değişiklikler hakkında ne hissettiğinizi ve ne yapmayı düşündüğünüzü anlatın.",
      "m": "Selam Elif! Spor salonundan gelen e-postayı okudun mu? Hafta sonları kapalı olacakmış ve üyelik ücreti de artıyor. Buna çok üzüldüm, çünkü ben sadece cumartesi günleri gidebiliyorum. Havuzun kapanması da kötü bir haber. Bence başka bir salona bakalım. Belki birlikte daha ucuz bir yer buluruz. Sen ne düşünüyorsun? Yarın akşam konuşalım mı? Görüşürüz!",
      "need": [
       [
        "Salomlashish",
        "merhaba|selam|sevgili|canım"
       ],
       [
        "His-tuygʻu va fikr",
        "üzül|kız|sevin|kötü|iyi|bence|düşünüyorum|hoşuma|maalesef"
       ],
       [
        "Nima qilmoqchi",
        "bakalım|gidelim|yapalım|planlıyorum|düşünüyorum|karar|başka|konuşalım"
       ],
       [
        "Xayrlashish",
        "görüşürüz|görüşmek üzere|sevgiler|kendine iyi bak|hoşça kal|öptüm"
       ]
      ]
     },
     {
      "id": "1.2",
      "t": "1.2-topshiriq · Rasmiy xat",
      "min": 120,
      "max": 150,
      "w": 1.5,
      "lv": "B1",
      "ctx": 1,
      "d": "Xuddi shu eʼlon boʻyicha sport zali direktoriga rasmiy xat yozing (120–150 soʻz).",
      "tr": "Spor salonunun müdürüne resmî bir e-posta yazın. Değişiklikler hakkındaki görüşlerinizi belirtin ve önerilerde bulunun.",
      "m": "Sayın Müdür,\n\nSalonunuza üç yıldır düzenli olarak gelen bir üyeyim. Gönderdiğiniz e-postayı okudum ve planlanan değişiklikler hakkındaki görüşlerimi paylaşmak istiyorum.\n\nÖncelikle yenileme çalışmalarının gerekli olduğunu anlıyorum. Ancak salonun hafta sonları tamamen kapanması, benim gibi hafta içi çalışan üyeler için büyük bir sorun. Ben de hafta içi akşamları geç saatlere kadar çalıştığım için salona ancak cumartesi ve pazar günleri gelebiliyorum. Bu nedenle çalışmaların hafta içi gece saatlerinde yapılmasını öneriyorum. Ayrıca havuz kullanılamazken üyelik ücretinin artırılması bence adil değil. En azından bu iki ay boyunca ücretin aynı kalmasını ya da üyelere indirim yapılmasını rica ediyorum. Yenileme süresince üyelerin başka bir şubeyi kullanabilmesi de iyi bir çözüm olabilir.\n\nSalonunuzdan bugüne kadar çok memnun kaldım ve üyeliğime devam etmek istiyorum. Önerilerimi değerlendireceğinizi umuyor, cevabınızı bekliyorum.\n\nSaygılarımla,\nJasur Karimov",
      "need": [
       [
        "Rasmiy murojaat",
        "sayın|ilgili|yetkili"
       ],
       [
        "Oʻzini tanishtirish",
        "üyeyim|üye|yıldır"
       ],
       [
        "Fikr bildirish",
        "anlıyorum|düşünüyorum|bence|kanaatimce|sorun|adil"
       ],
       [
        "Taklif",
        "öneri|öner|yapılmasını|olmasını|kalmasını"
       ],
       [
        "Rasmiy ohang",
        "rica|talep|bekliyorum|bekl|arz|umuyor"
       ],
       [
        "Rasmiy yakun",
        "saygılarımla|saygılarımızla|iyi çalışmalar"
       ]
      ]
     },
     {
      "id": "2",
      "t": "2-topshiriq · Insho",
      "min": 180,
      "max": 200,
      "w": 2.5,
      "lv": "B2",
      "m": "Çocukların yabancı dil öğrenmeye ne zaman başlaması gerektiği, ailelerin ve öğretmenlerin sık sık tartıştığı bir konudur. Bence yabancı dil eğitimi ilkokulun ilk yılında başlamalıdır; ancak bu, ana dilin ihmal edilmesi anlamına gelmemelidir.\n\nHer şeyden önce, küçük çocuklar yeni sesleri büyüklerden çok daha kolay taklit eder. Örneğin altı yaşında şarkılar ve oyunlarla İngilizce öğrenen bir çocuk, yıllar sonra bile doğal bir telaffuzla konuşabilir. Ayrıca erken yaşta başka bir dille tanışmak, çocuğun farklı kültürlere karşı merakını artırır ve dünyaya daha açık bakmasını sağlar. Üstelik dil öğrenen çocuklar problem çözmede ve dikkat gerektiren işlerde de daha başarılı olabilir.\n\nÖte yandan, ana dilini henüz iyi bilmeyen bir çocuğun iki dili karıştırabileceği de doğrudur. Bu nedenle bazı uzmanlar önce ana dilin sağlamlaştırılmasını önerir. Ne var ki araştırmalar, bu karışıklığın genellikle kısa sürdüğünü gösteriyor. Asıl önemli olan, derslerin çocuğun yaşına uygun ve eğlenceli olmasıdır. Bu yüzden derslerde oyun, şarkı ve hikâye gibi yöntemler kullanılmalıdır.\n\nSonuç olarak, yabancı dil eğitimine erken başlamanın faydaları zararlarından fazladır. Okullar ana dil derslerine de yeterli zaman ayırırsa, çocuklar iki dili de başarıyla öğrenebilir. Bunun için ailelerin de evde çocuklarıyla bol bol kitap okuması gerekir. Kısacası, iki dil birbirinin rakibi değil, tamamlayıcısıdır.",
      "d": "Berilgan mavzu boʻyicha fikringizni dalillar va misollar bilan asoslab, insho yozing (180–200 soʻz).",
      "tr": "Bazı insanlar, çocukların yabancı dili ilkokulun ilk yılından itibaren öğrenmesi gerektiğini düşünüyor. Bazıları ise önce ana dilin iyice öğrenilmesi gerektiğini savunuyor. Siz ne düşünüyorsunuz? Görüşünüzü gerekçeler ve örneklerle açıklayan bir kompozisyon yazın.",
      "need": [
       [
        "Oʻz fikringiz",
        "bence|bana göre|kanaatimce|düşünüyorum|katılıyorum|katılmıyorum"
       ],
       [
        "Dalil va misol",
        "örneğin|mesela|çünkü|nedeniyle|sebebiyle|bu yüzden"
       ],
       [
        "Qarshi fikrni koʻrib chiqish",
        "öte yandan|buna karşın|ancak|bununla birlikte|aksine|diğer taraftan|oysa"
       ],
       [
        "Xulosa",
        "sonuç olarak|kısacası|özetle|sonuçta|son olarak"
       ]
      ]
     }
    ]
   },
   "s": {
    "parts": [
     {
      "t": "1.1-qism · Oʻzingiz haqingizda",
      "prep": 5,
      "talk": 30,
      "d": "Uchta savolga javob bering. Har biriga 30 soniya vaqt bor. Toʻliq gaplar bilan, misol keltirib gapiring.",
      "qs": [
       {
        "q": "Boş zamanlarınızda ne yapmaktan hoşlanırsınız?",
        "kw": "hoşlan|sev|zaman|hafta sonu|kitap|spor|müzik|film|yürü|oku|arkadaş",
        "m": "Boş zamanlarımda kitap okumayı ve yürüyüş yapmayı çok severim. Özellikle hafta sonları arkadaşlarımla parka gidiyoruz. Akşamları da bazen Türk dizileri izliyorum, çünkü hem eğleniyorum hem de Türkçemi geliştiriyorum."
       },
       {
        "q": "Yaşadığınız şehri ya da köyü kısaca anlatır mısınız?",
        "kw": "şehir|köy|yaşa|güzel|büyük|küçük|insan|sokak|park|kalabalık|sakin",
        "m": "Taşkent'te yaşıyorum. Büyük ve kalabalık bir şehir ama aynı zamanda çok yeşil. Geniş caddeleri, güzel parkları ve tarihî binaları var. İnsanlar misafirperverdir. Akşamları şehir ışıklarla daha da güzel oluyor."
       },
       {
        "q": "Türkçe öğrenmeye neden başladınız?",
        "kw": "türkçe|öğren|çünkü|iş|okul|üniversite|türkiye|dizi|arkadaş|seyahat",
        "m": "Türkçe öğrenmeye iki yıl önce başladım, çünkü Türkiye'de üniversitede okumak istiyorum. Ayrıca Türkçe ile Özbekçe birbirine çok benziyor, bu yüzden öğrenmek bana zevkli geliyor."
       }
      ]
     },
     {
      "t": "1.2-qism · Ikki rasm",
      "prep": 5,
      "talk": 30,
      "pics": [
       "sehir",
       "koy"
      ],
      "d": "Ikki rasmga qarang va savollarga javob bering. Birinchi savolga 45 soniya, qolganlariga 30 soniyadan vaqt bor.",
      "qs": [
       {
        "q": "Bu iki resmi karşılaştırın. Resimlerde neler görüyorsunuz?",
        "prep": 10,
        "talk": 45,
        "kw": "resim|şehir|köy|bina|ev|ağaç|araba|yol|kalabalık|sakin|huzur",
        "m": "Birinci resimde büyük bir şehir var: yüksek binalar, geniş bir yol ve arabalar görüyorum. İkinci resimde ise sakin bir köy var; küçük bir ev, ağaçlar ve yeşil tepeler görünüyor. Şehir kalabalık ve hareketli görünüyor, köy ise çok huzurlu."
       },
       {
        "q": "Sizce şehirde yaşamanın en büyük avantajı nedir?",
        "kw": "şehir|iş|okul|hastane|imkân|ulaşım|avantaj|kolay",
        "m": "Bence şehirde yaşamanın en büyük avantajı imkânların fazla olması. İş bulmak daha kolay, iyi okullar ve hastaneler var. Ayrıca toplu taşıma sayesinde her yere hızlıca gidebiliyorsunuz."
       },
       {
        "q": "Gelecekte insanlar daha çok şehirde mi, köyde mi yaşayacak? Neden?",
        "kw": "gelecek|şehir|köy|yaşa|iş|uzaktan|çünkü|sakin",
        "m": "Bence gelecekte insanlar yine daha çok şehirde yaşayacak, çünkü iş imkânları orada. Ama uzaktan çalışma yaygınlaştıkça bazı aileler sakin bir hayat için köylere dönebilir."
       }
      ]
     },
     {
      "t": "2-qism · Rasm va savollar",
      "prep": 60,
      "talk": 120,
      "pics": [
       "calisma"
      ],
      "d": "Rasmga qarang. Bir daqiqa tayyorlaning, keyin ikki daqiqa davomida uchala savolga javob bering.",
      "qs": [
       {
        "q": "Resimdeki kişiyi ve yeri anlatın.",
        "cues": [
         "Resimde neler görüyorsunuz?",
         "Siz en çok nerede ve nasıl ders çalışırsınız?",
         "Sizce teknoloji öğrenmeyi kolaylaştırıyor mu?"
        ],
        "kw": "resim|kütüphane|kitap|bilgisayar|ders|çalış|teknoloji|internet|sessiz|öğren",
        "m": "Resimde genç bir kız kütüphanede ders çalışıyor. Masasında bir dizüstü bilgisayar ve birkaç kitap var. Arkasında büyük bir kitaplık görünüyor; raflar renkli kitaplarla dolu. Pencereden gün ışığı giriyor, bu yüzden ortam aydınlık ve sakin. Ben de genellikle evde değil, kütüphanede çalışırım, çünkü evde dikkatim kolayca dağılıyor. Kütüphanede herkes sessizce çalışıyor ve bu bana motivasyon veriyor. Bence teknoloji öğrenmeyi gerçekten kolaylaştırıyor. İnternette her konuda video ve kaynak bulabiliyoruz. Örneğin ben Türkçe telaffuzumu çevrim içi derslerle geliştirdim. Ancak teknoloji tek başına yeterli değil; düzenli çalışmak ve sabırlı olmak da çok önemli."
       }
      ]
     },
     {
      "t": "3-qism · Munozara",
      "prep": 60,
      "talk": 120,
      "d": "Fikrni ikki tomondan muhokama qiling va oʻz qarashingizni ayting. Jadvaldagi dalillardan foydalanishingiz mumkin.",
      "qs": [
       {
        "q": "«Teknoloji insanları birbirinden uzaklaştırıyor.»",
        "pro": [
         "Aileler yemekte bile telefona bakıyor.",
         "Yüz yüze görüşmeler azaldı.",
         "Sanal arkadaşlıklar yüzeysel kalıyor."
        ],
        "con": [
         "Uzaktaki akrabalarla görüntülü konuşabiliyoruz.",
         "Aynı ilgi alanına sahip insanlarla tanışmak kolaylaştı.",
         "Yalnız yaşayan yaşlılar için büyük bir destek."
        ],
        "kw": "teknoloji|telefon|internet|insan|uzaklaş|yakınlaş|aile|arkadaş|görüş|sanal",
        "m": "Bu konuda iki farklı görüş var. Bir yandan teknolojinin insanları uzaklaştırdığı doğru. Örneğin birçok aile yemekte bile telefonuna bakıyor ve yüz yüze konuşmalar azalıyor. Sanal arkadaşlıklar da çoğu zaman yüzeysel kalıyor. Gençler bazen sokakta yürürken bile başlarını telefondan kaldırmıyor. Öte yandan teknoloji insanları birbirine yakınlaştırıyor da. Yurt dışında yaşayan akrabalarımla her hafta görüntülü konuşabiliyorum. Ayrıca yalnız yaşayan yaşlılar için internet büyük bir destek; torunlarını ekranda görerek yalnızlık hissinden biraz olsun kurtuluyorlar. Bence sorun teknolojinin kendisi değil, onu nasıl kullandığımız. Teknoloji bir araçtır; onu iyi ya da kötü yapan bizim alışkanlıklarımızdır. Sonuç olarak teknolojiyi bilinçli kullanırsak insanları uzaklaştırmaz, aksine yakınlaştırır."
       }
      ]
     }
    ]
   }
  }
 ]
};
