// Turk tili grammatikasi A1–B2 — kitob qoʻllanma. Betlar: book/pNN.webp, matn (qidiruv uchun): book/text.json
const BOOK = {
 "pages": 87,
 "pdf": "book/turk-tili-grammatikasi-A1-B2.pdf",
 "front": [
  {
   "uz": "Muqova",
   "page": 1
  },
  {
   "uz": "Shartli belgilar",
   "page": 2
  },
  {
   "uz": "Mundarija",
   "page": 3
  }
 ],
 "toc": [
  {
   "id": "kirish",
   "name": "Kirish",
   "uz": "alifbo, unli va undosh qoidalari",
   "page": 9,
   "items": [
    {
     "code": "",
     "tr": "Alifbo",
     "uz": "Oʻzbek yozuvidan farq qiladigan harflar",
     "page": 9,
     "group": ""
    },
    {
     "code": "",
     "tr": "Ünlü uyumu",
     "uz": "Unli uygʻunligi",
     "page": 10,
     "group": ""
    },
    {
     "code": "",
     "tr": "Ünsüz kuralları",
     "uz": "Undosh qoidalari",
     "page": 11,
     "group": ""
    }
   ]
  },
  {
   "id": "A1",
   "name": "A1",
   "uz": "Boshlangʻich daraja",
   "page": 12,
   "items": [
    {
     "code": "A1.01",
     "tr": "Çoğul eki",
     "uz": "Koʻplik qoʻshimchasi",
     "page": 12,
     "group": "OT (İSİM)"
    },
    {
     "code": "A1.02",
     "tr": "İyelik ekleri",
     "uz": "Egalik qoʻshimchalari",
     "page": 12,
     "group": "OT (İSİM)"
    },
    {
     "code": "A1.03",
     "tr": "Hal ekleri (umumiy jadval)",
     "uz": "Kelishiklar — umumiy koʻrinish",
     "page": 13,
     "group": "OT (İSİM)"
    },
    {
     "code": "A1.04",
     "tr": "Belirtme hâli",
     "uz": "Tushum kelishigi (-ni)",
     "page": 14,
     "group": "OT (İSİM)"
    },
    {
     "code": "A1.05",
     "tr": "Yönelme hâli",
     "uz": "Joʻnalish kelishigi (-ga)",
     "page": 14,
     "group": "OT (İSİM)"
    },
    {
     "code": "A1.06",
     "tr": "Bulunma hâli",
     "uz": "Oʻrin-payt kelishigi (-da)",
     "page": 14,
     "group": "OT (İSİM)"
    },
    {
     "code": "A1.07",
     "tr": "Ayrılma hâli",
     "uz": "Chiqish kelishigi (-dan)",
     "page": 15,
     "group": "OT (İSİM)"
    },
    {
     "code": "A1.08",
     "tr": "İlgi hâli",
     "uz": "Qaratqich kelishigi (-ning)",
     "page": 15,
     "group": "OT (İSİM)"
    },
    {
     "code": "A1.09",
     "tr": "Vasıta eki / ile",
     "uz": "Vosita qoʻshimchasi (bilan)",
     "page": 16,
     "group": "OT (İSİM)"
    },
    {
     "code": "A1.10",
     "tr": "İsim tamlaması",
     "uz": "Qaratqich-egalik birikmasi",
     "page": 16,
     "group": "OT (İSİM)"
    },
    {
     "code": "A1.11",
     "tr": "-CI eki",
     "uz": "Kasb qoʻshimchasi (-chi)",
     "page": 16,
     "group": "OT (İSİM)"
    },
    {
     "code": "A1.12",
     "tr": "Sıfatın yeri",
     "uz": "Sifatning oʻrni",
     "page": 17,
     "group": "SIFAT"
    },
    {
     "code": "A1.13",
     "tr": "-lI / -sIz ekleri",
     "uz": "-li / -siz qoʻshimchalari",
     "page": 17,
     "group": "SIFAT"
    },
    {
     "code": "A1.14",
     "tr": "Karşılaştırma: daha / en",
     "uz": "Qiyoslash: -roq / eng",
     "page": 18,
     "group": "SIFAT"
    },
    {
     "code": "A1.15",
     "tr": "Sayma sayıları",
     "uz": "Sanoq sonlar",
     "page": 18,
     "group": "SON (SAYI)"
    },
    {
     "code": "A1.16",
     "tr": "Sıra sayıları",
     "uz": "Tartib sonlar",
     "page": 19,
     "group": "SON (SAYI)"
    },
    {
     "code": "A1.17",
     "tr": "Saatler",
     "uz": "Soat aytish",
     "page": 19,
     "group": "SON (SAYI)"
    },
    {
     "code": "A1.18",
     "tr": "Şahıs ve işaret zamirleri",
     "uz": "Kishilik va koʻrsatish olmoshlari",
     "page": 20,
     "group": "OLMOSH (ZAMİR)"
    },
    {
     "code": "A1.19",
     "tr": "Soru kelimeleri",
     "uz": "Soʻroq soʻzlari",
     "page": 21,
     "group": "OLMOSH (ZAMİR)"
    },
    {
     "code": "A1.20",
     "tr": "Ek-fiil (geniş zaman)",
     "uz": "Bogʻlama: -man, -san",
     "page": 22,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "A1.21",
     "tr": "Var / Yok",
     "uz": "Bor / Yoʻq",
     "page": 22,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "A1.22",
     "tr": "Mastar eki",
     "uz": "Fe’lning noaniq shakli (-moq)",
     "page": 23,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "A1.23",
     "tr": "Emir kipi",
     "uz": "Buyruq mayli",
     "page": 23,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "A1.24",
     "tr": "Şimdiki zaman",
     "uz": "Hozirgi zamon (-yap)",
     "page": 24,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "A1.25",
     "tr": "Görülen geçmiş zaman",
     "uz": "Aniq oʻtgan zamon (-di)",
     "page": 25,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "A1.26",
     "tr": "Gelecek zaman",
     "uz": "Kelasi zamon (-adi)",
     "page": 26,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "A1.27",
     "tr": "İstek: -(y)AlIm",
     "uz": "Taklif: -aylik",
     "page": 26,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "A1.28",
     "tr": "Zarflar",
     "uz": "Ravishlar",
     "page": 27,
     "group": "RAVISH (ZARF)"
    },
    {
     "code": "A1.29",
     "tr": "ile / için / gibi",
     "uz": "bilan / uchun / kabi",
     "page": 27,
     "group": "KOʻMAKCHI (EDAT)"
    },
    {
     "code": "A1.30",
     "tr": "Yer bildiren kelimeler",
     "uz": "Joy bildiruvchi soʻzlar",
     "page": 28,
     "group": "KOʻMAKCHI (EDAT)"
    },
    {
     "code": "A1.31",
     "tr": "Bağlaçlar",
     "uz": "Bogʻlovchilar",
     "page": 29,
     "group": "BOGʻLOVCHI (BAĞLAÇ)"
    },
    {
     "code": "A1.32",
     "tr": "Cümle dizilişi",
     "uz": "Soʻz tartibi",
     "page": 29,
     "group": "GAP TUZILISHI"
    },
    {
     "code": "A1.33",
     "tr": "Soru eki mI",
     "uz": "Soʻroq yuklamasi (-mi)",
     "page": 30,
     "group": "GAP TUZILISHI"
    },
    {
     "code": "",
     "tr": "",
     "uz": "Mashqlar va javoblar",
     "page": 30,
     "group": "MASHQ"
    }
   ]
  },
  {
   "id": "A2",
   "name": "A2",
   "uz": "Asosiy daraja",
   "page": 31,
   "items": [
    {
     "code": "A2.01",
     "tr": "-ki eki",
     "uz": "-dagi / -niki qoʻshimchasi",
     "page": 31,
     "group": "OT (İSİM)"
    },
    {
     "code": "A2.02",
     "tr": "-lIk eki",
     "uz": "-lik qoʻshimchasi",
     "page": 31,
     "group": "OT (İSİM)"
    },
    {
     "code": "A2.03",
     "tr": "-CA eki",
     "uz": "-cha qoʻshimchasi",
     "page": 32,
     "group": "OT (İSİM)"
    },
    {
     "code": "A2.04",
     "tr": "İsim-fiil -mA",
     "uz": "Harakat nomi (-ish)",
     "page": 32,
     "group": "OT (İSİM)"
    },
    {
     "code": "A2.05",
     "tr": "Pekiştirme sıfatları",
     "uz": "Kuchaytirma sifatlar",
     "page": 33,
     "group": "SIFAT"
    },
    {
     "code": "A2.06",
     "tr": "-(I)msI / -(I)mtIrAk",
     "uz": "-ish / -imtir (kuchsiz belgi)",
     "page": 33,
     "group": "SIFAT"
    },
    {
     "code": "A2.07",
     "tr": "Sıfat-fiil -(y)An",
     "uz": "Sifatdosh (-gan / -ayotgan)",
     "page": 34,
     "group": "SIFAT"
    },
    {
     "code": "A2.08",
     "tr": "Üleştirme sayıları",
     "uz": "Taqsim sonlar (-tadan)",
     "page": 34,
     "group": "SON (SAYI)"
    },
    {
     "code": "A2.09",
     "tr": "Kesir ve yüzde",
     "uz": "Kasr va foiz",
     "page": 35,
     "group": "SON (SAYI)"
    },
    {
     "code": "A2.10",
     "tr": "Dönüşlülük zamiri: kendi",
     "uz": "Oʻzlik olmoshi: oʻz",
     "page": 36,
     "group": "OLMOSH (ZAMİR)"
    },
    {
     "code": "A2.11",
     "tr": "Belgisiz zamirler",
     "uz": "Gumon va jamlovchi olmoshlar",
     "page": 37,
     "group": "OLMOSH (ZAMİR)"
    },
    {
     "code": "A2.12",
     "tr": "Geniş zaman",
     "uz": "Hozirgi-kelasi zamon (-ar)",
     "page": 38,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "A2.13",
     "tr": "Yeterlik fiili",
     "uz": "Qila olmoq (-a olmoq)",
     "page": 39,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "A2.14",
     "tr": "Gereklilik kipi",
     "uz": "Majburiyat mayli (-ishi kerak)",
     "page": 39,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "A2.15",
     "tr": "Öğrenilen geçmiş zaman",
     "uz": "Eshitilgan oʻtgan zamon (-ibdi)",
     "page": 40,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "A2.16",
     "tr": "Şimdiki zamanın hikâyesi",
     "uz": "Oʻtgan davomiy (-ayotgan edi)",
     "page": 40,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "A2.17",
     "tr": "Geniş zamanın hikâyesi",
     "uz": "Oʻtmishdagi odat (-ardi)",
     "page": 41,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "A2.18",
     "tr": "Dilek-şart kipi",
     "uz": "Shart mayli (-sa)",
     "page": 41,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "A2.19",
     "tr": "İstek kipi",
     "uz": "Istak mayli (-ay, -aylik)",
     "page": 42,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "A2.20",
     "tr": "Ek-fiil: -(y)DI, -(y)mIş, -(y)sA",
     "uz": "Bogʻlama: edi, ekan, boʻlsa",
     "page": 42,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "A2.21",
     "tr": "-mAk için",
     "uz": "-ish uchun (maqsad)",
     "page": 43,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "A2.22",
     "tr": "Zarf-fiil -(y)Ip",
     "uz": "Ravishdosh (-ib)",
     "page": 43,
     "group": "RAVISHDOSH (ZARF-FİİL)"
    },
    {
     "code": "A2.23",
     "tr": "-(y)ken",
     "uz": "-ayotganda / -lik paytida",
     "page": 43,
     "group": "RAVISHDOSH (ZARF-FİİL)"
    },
    {
     "code": "A2.24",
     "tr": "-mAdAn önce / -DIktAn sonra",
     "uz": "-ishdan oldin / -gandan keyin",
     "page": 44,
     "group": "RAVISHDOSH (ZARF-FİİL)"
    },
    {
     "code": "A2.25",
     "tr": "-(y)ArAk",
     "uz": "-ib (ish tarzi)",
     "page": 44,
     "group": "RAVISHDOSH (ZARF-FİİL)"
    },
    {
     "code": "A2.26",
     "tr": "-(y)IncA",
     "uz": "-ganda / -gach",
     "page": 45,
     "group": "RAVISHDOSH (ZARF-FİİL)"
    },
    {
     "code": "A2.27",
     "tr": "Hal isteyen edatlar",
     "uz": "Kelishik talab qiluvchi koʻmakchilar",
     "page": 45,
     "group": "KOʻMAKCHI (EDAT)"
    },
    {
     "code": "A2.28",
     "tr": "Eşitlik: kadar / gibi",
     "uz": "Tenglik: -chalik / kabi",
     "page": 46,
     "group": "KOʻMAKCHI (EDAT)"
    },
    {
     "code": "A2.29",
     "tr": "İkili bağlaçlar",
     "uz": "Juft bogʻlovchilar",
     "page": 46,
     "group": "BOGʻLOVCHI (BAĞLAÇ)"
    },
    {
     "code": "A2.30",
     "tr": "Sonuç ve açıklama bağlaçları",
     "uz": "Natija va izoh bogʻlovchilari",
     "page": 47,
     "group": "BOGʻLOVCHI (BAĞLAÇ)"
    },
    {
     "code": "A2.31",
     "tr": "Onay sorusu: değil mi? / acaba",
     "uz": "Tasdiq soʻrogʻi: shundaymi? / -mikan",
     "page": 47,
     "group": "GAP TUZILISHI"
    },
    {
     "code": "",
     "tr": "",
     "uz": "Mashqlar va javoblar",
     "page": 48,
     "group": "MASHQ"
    }
   ]
  },
  {
   "id": "B1",
   "name": "B1",
   "uz": "Oʻrta daraja",
   "page": 49,
   "items": [
    {
     "code": "B1.01",
     "tr": "İsim-fiil -(y)Iş",
     "uz": "Harakat nomi (-ish)",
     "page": 49,
     "group": "OT (İSİM)"
    },
    {
     "code": "B1.02",
     "tr": "Fiilden isim yapma ekleri",
     "uz": "Fe’ldan ot yasovchilar",
     "page": 49,
     "group": "OT (İSİM)"
    },
    {
     "code": "B1.03",
     "tr": "-DIK / -(y)AcAK + iyelik",
     "uz": "Ot vazifasidagi gap (-ganini, -ishini)",
     "page": 50,
     "group": "OT (İSİM)"
    },
    {
     "code": "B1.04",
     "tr": "Sıfat-fiil -DIk + iyelik",
     "uz": "Sifatdosh (-gan …im)",
     "page": 51,
     "group": "SIFAT"
    },
    {
     "code": "B1.05",
     "tr": "Sıfat-fiil -(y)AcAk",
     "uz": "Sifatdosh (-adigan)",
     "page": 51,
     "group": "SIFAT"
    },
    {
     "code": "B1.06",
     "tr": "Sıfat-fiil -mIş / -(A/I)r / -mAz",
     "uz": "Sifatdosh (-gan, -ar, -mas)",
     "page": 52,
     "group": "SIFAT"
    },
    {
     "code": "B1.07",
     "tr": "Sıfat yapım ekleri: -(s)Al, -sI, -(y)IcI",
     "uz": "Sifat yasovchilar",
     "page": 52,
     "group": "SIFAT"
    },
    {
     "code": "B1.08",
     "tr": "Topluluk sayıları",
     "uz": "Jamlovchi sonlar (ikkalamiz)",
     "page": 53,
     "group": "SON (SAYI)"
    },
    {
     "code": "B1.09",
     "tr": "Yaklaşık sayılar",
     "uz": "Taxminiy sonlar",
     "page": 53,
     "group": "SON (SAYI)"
    },
    {
     "code": "B1.10",
     "tr": "Karşılıklılık: birbiri",
     "uz": "Oʻzaro olmosh: bir-biri",
     "page": 54,
     "group": "OLMOSH (ZAMİR)"
    },
    {
     "code": "B1.11",
     "tr": "Belgisiz zamir + iyelik",
     "uz": "Gumon olmoshlari egalik bilan",
     "page": 54,
     "group": "OLMOSH (ZAMİR)"
    },
    {
     "code": "B1.12",
     "tr": "Ettirgen çatı",
     "uz": "Orttirma nisbat (-tir, -dir)",
     "page": 55,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "B1.13",
     "tr": "Edilgen çatı",
     "uz": "Majhul nisbat (-il, -in)",
     "page": 55,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "B1.14",
     "tr": "Dönüşlü ve işteş çatı",
     "uz": "Oʻzlik va birgalik nisbati",
     "page": 56,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "B1.15",
     "tr": "Fiil yapım ekleri: -lA, -lAş, -lAn",
     "uz": "Otdan fe’l yasovchilar",
     "page": 57,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "B1.16",
     "tr": "Gelecek zamanın hikâyesi",
     "uz": "Kelasi zamonning oʻtgan shakli (-moqchi edi)",
     "page": 57,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "B1.17",
     "tr": "Öğrenilen geçmişin hikâyesi",
     "uz": "Uzoq oʻtgan zamon (-gan edi)",
     "page": 58,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "B1.18",
     "tr": "Rivayet birleşikleri",
     "uz": "Koʻchirma shakllar (… ekan)",
     "page": 58,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "B1.19",
     "tr": "Şart birleşikleri",
     "uz": "Shartning murakkab shakllari",
     "page": 59,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "B1.20",
     "tr": "Tasvir fiilleri",
     "uz": "Koʻmakchi fe’llar (-ib yubormoq…)",
     "page": 59,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "B1.21",
     "tr": "-sAnA / -sAnIzA",
     "uz": "Yumshoq buyruq (-sang-chi)",
     "page": 60,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "B1.22",
     "tr": "-mAlIydI / -(y)AbilirdI",
     "uz": "Mayllarning oʻtgan shakli",
     "page": 60,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "B1.23",
     "tr": "-DIğIndA / -DIğI zaman",
     "uz": "-ganda",
     "page": 61,
     "group": "RAVISHDOSH (ZARF-FİİL)"
    },
    {
     "code": "B1.24",
     "tr": "-DIkçA / -(y)AlI",
     "uz": "-gan sari / -gandan beri",
     "page": 61,
     "group": "RAVISHDOSH (ZARF-FİİL)"
    },
    {
     "code": "B1.25",
     "tr": "-(y)AnA kadar / -(y)IncAyA kadar",
     "uz": "-guncha",
     "page": 62,
     "group": "RAVISHDOSH (ZARF-FİİL)"
    },
    {
     "code": "B1.26",
     "tr": "-DIğI için / -DIğIndAn",
     "uz": "-gani uchun (sabab)",
     "page": 62,
     "group": "RAVISHDOSH (ZARF-FİİL)"
    },
    {
     "code": "B1.27",
     "tr": "-mAk yerine / -mAktAnsA / -mAksIzIn",
     "uz": "-ish oʻrniga / -masdan",
     "page": 62,
     "group": "RAVISHDOSH (ZARF-FİİL)"
    },
    {
     "code": "B1.28",
     "tr": "Edatlar: rağmen, dolayı, sayesinde…",
     "uz": "Koʻmakchilar: qaramay, sababli, tufayli…",
     "page": 63,
     "group": "KOʻMAKCHI (EDAT)"
    },
    {
     "code": "B1.29",
     "tr": "ki / diye",
     "uz": "-ki / deb",
     "page": 64,
     "group": "BOGʻLOVCHI (BAĞLAÇ)"
    },
    {
     "code": "B1.30",
     "tr": "Bağlaçlar: oysa, üstelik, hatta, madem",
     "uz": "Qarshilik va kuchaytiruv bogʻlovchilari",
     "page": 64,
     "group": "BOGʻLOVCHI (BAĞLAÇ)"
    },
    {
     "code": "B1.31",
     "tr": "Dolaylı anlatım",
     "uz": "Oʻzlashtirma gap",
     "page": 65,
     "group": "GAP TUZILISHI"
    },
    {
     "code": "B1.32",
     "tr": "-mAsI için / -sIn diye",
     "uz": "Maqsad (boshqa shaxs uchun)",
     "page": 65,
     "group": "GAP TUZILISHI"
    },
    {
     "code": "B1.33",
     "tr": "-sA da / -sA bile",
     "uz": "-sa ham (toʻsiqsiz gap)",
     "page": 66,
     "group": "GAP TUZILISHI"
    },
    {
     "code": "",
     "tr": "",
     "uz": "Mashqlar va javoblar",
     "page": 66,
     "group": "MASHQ"
    }
   ]
  },
  {
   "id": "B2",
   "name": "B2",
   "uz": "Oʻrtadan yuqori daraja",
   "page": 67,
   "items": [
    {
     "code": "B2.01",
     "tr": "-CIlIk / -sIzlIk / -mAzlIk",
     "uz": "Mavhum otlar (-chilik, -sizlik)",
     "page": 67,
     "group": "OT (İSİM)"
    },
    {
     "code": "B2.02",
     "tr": "-mAk + hal ekleri",
     "uz": "Mastar kelishik bilan",
     "page": 68,
     "group": "OT (İSİM)"
    },
    {
     "code": "B2.03",
     "tr": "Adlaşmış sıfat-fiiller",
     "uz": "Otlashgan sifatdoshlar",
     "page": 68,
     "group": "OT (İSİM)"
    },
    {
     "code": "B2.04",
     "tr": "Birleşik sıfatlar",
     "uz": "Qoʻshma sifatlar (baland boʻyli)",
     "page": 69,
     "group": "SIFAT"
    },
    {
     "code": "B2.05",
     "tr": "Sıfat-fiil -(y)AsI",
     "uz": "Istak sifatdoshi (-gim keldi)",
     "page": 69,
     "group": "SIFAT"
    },
    {
     "code": "B2.06",
     "tr": "Derece zarfları",
     "uz": "Daraja soʻzlari",
     "page": 70,
     "group": "SIFAT"
    },
    {
     "code": "B2.07",
     "tr": "Kere, kat ve dört işlem",
     "uz": "Marta, baravar va arifmetika",
     "page": 70,
     "group": "SON (SAYI)"
    },
    {
     "code": "B2.08",
     "tr": "Soru zamiri + -sA … -sIn",
     "uz": "Umumlashtiruvchi: kim boʻlsa ham",
     "page": 71,
     "group": "OLMOSH (ZAMİR)"
    },
    {
     "code": "B2.09",
     "tr": "-mAktA(dIr)",
     "uz": "Rasmiy davomiy zamon (-moqda)",
     "page": 72,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "B2.10",
     "tr": "-DIr eki",
     "uz": "Taxmin va rasmiy tasdiq",
     "page": 72,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "B2.11",
     "tr": "-mIş olmalı / -sA gerek",
     "uz": "Ehtimol: …gan boʻlsa kerak",
     "page": 73,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "B2.12",
     "tr": "olmak ile birleşik zamanlar",
     "uz": "«Boʻlmoq» bilan murakkab zamonlar",
     "page": 73,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "B2.13",
     "tr": "Çatı birleşimleri",
     "uz": "Nisbatlar birikmasi",
     "page": 74,
     "group": "FE’L (FİİL)"
    },
    {
     "code": "B2.14",
     "tr": "-DIğI halde / -mAsInA rağmen",
     "uz": "…sa ham / …ga qaramay",
     "page": 74,
     "group": "RAVISHDOSH (ZARF-FİİL)"
    },
    {
     "code": "B2.15",
     "tr": "-cAsInA / -mIş gibi",
     "uz": "goʻyo …dek",
     "page": 75,
     "group": "RAVISHDOSH (ZARF-FİİL)"
    },
    {
     "code": "B2.16",
     "tr": "-mAdIkçA / -DIğI sürece / -DIğI takdirde",
     "uz": "Shart ravishdoshlari",
     "page": 75,
     "group": "RAVISHDOSH (ZARF-FİİL)"
    },
    {
     "code": "B2.17",
     "tr": "-(A/I)r -mAz / -DIğI gibi",
     "uz": "…ishi bilanoq",
     "page": 76,
     "group": "RAVISHDOSH (ZARF-FİİL)"
    },
    {
     "code": "B2.18",
     "tr": "-mAk üzere",
     "uz": "…ish arafasida / …sharti bilan",
     "page": 76,
     "group": "RAVISHDOSH (ZARF-FİİL)"
    },
    {
     "code": "B2.19",
     "tr": "-DIğIncA / -(y)AbildiğIncA",
     "uz": "…gancha / iloji boricha",
     "page": 76,
     "group": "RAVISHDOSH (ZARF-FİİL)"
    },
    {
     "code": "B2.20",
     "tr": "Edatlar: dair, ilişkin, yönelik, itibaren",
     "uz": "Rasmiy koʻmakchilar",
     "page": 77,
     "group": "KOʻMAKCHI (EDAT)"
    },
    {
     "code": "B2.21",
     "tr": "Edatlar: aksine, kıyasla, açısından, yanı sıra",
     "uz": "Qiyos va nuqtai nazar koʻmakchilari",
     "page": 78,
     "group": "KOʻMAKCHI (EDAT)"
    },
    {
     "code": "B2.22",
     "tr": "Metin bağlaçları",
     "uz": "Matn bogʻlovchilari",
     "page": 78,
     "group": "BOGʻLOVCHI (BAĞLAÇ)"
    },
    {
     "code": "B2.23",
     "tr": "Kip zarfları: sanki, meğer, güya…",
     "uz": "Modal soʻzlar",
     "page": 79,
     "group": "BOGʻLOVCHI (BAĞLAÇ)"
    },
    {
     "code": "B2.24",
     "tr": "olarak / olan / olduğu",
     "uz": "sifatida / boʻlgan",
     "page": 80,
     "group": "GAP TUZILISHI"
    },
    {
     "code": "B2.25",
     "tr": "Haber dili",
     "uz": "Rasmiy axborot uslubi",
     "page": 80,
     "group": "GAP TUZILISHI"
    },
    {
     "code": "B2.26",
     "tr": "Şart cümlesi türleri",
     "uz": "Shart gap turlari",
     "page": 81,
     "group": "GAP TUZILISHI"
    },
    {
     "code": "B2.27",
     "tr": "Vurgulu cümle",
     "uz": "Ta’kidli gap (… -dir)",
     "page": 81,
     "group": "GAP TUZILISHI"
    },
    {
     "code": "",
     "tr": "",
     "uz": "Mashqlar va javoblar",
     "page": 81,
     "group": "MASHQ"
    }
   ]
  },
  {
   "id": "az",
   "name": "A–Z",
   "uz": "Qoʻshimchalar jadvali",
   "page": 83,
   "items": [
    {
     "code": "",
     "tr": "",
     "uz": "Qoʻshimchalar jadvali (A–Z)",
     "page": 83,
     "group": ""
    }
   ]
  }
 ]
};
