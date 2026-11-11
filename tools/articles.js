// SEO articles for maqola/ (tools/seo.js builds the pages). Written with the plain apostrophe (o'rganish),
// the way people type their searches. Blocks: { h: heading, p: [paragraphs], list: [items], pairs: [[tr, uz]], cta: [text, app hash] }.
// Two articles are built from the content itself: the alphabet (LETTERS) and the 100 words (UNITS) — see seo.js.
module.exports = [
  {
    id: "turk-tilini-organish",
    title: "Turk tilini noldan o'rganish: 10 ta amaliy maslahat",
    desc: "Turk tilini noldan qanday o'rganish kerak? O'zbek tilida so'zlashuvchilar uchun 10 ta amaliy maslahat: alifbo, so'z yodlash, grammatika, tinglash va gapirish.",
    lead: "O'zbek va turk tillari qarindosh — bu sizga katta ustunlik beradi. Quyidagi 10 ta maslahat bilan har kuni 10–15 daqiqa shug'ullanib, bir necha oyda oddiy suhbat qura olasiz.",
    blocks: [
      { h: "1. Alifbo va talaffuzdan boshlang", p: ["Turk alifbosi lotin yozuvida, 29 ta harfdan iborat. Ko'p harflar o'zbekchadagidek o'qiladi, lekin C (j), Ç (ch), Ş (sh), Ğ (yumshoq g'), I (y) va Ö, Ü harflariga e'tibor bering. Turkchada so'zlar qanday yozilsa, shunday o'qiladi."], cta: ["Turk alifbosi va talaffuz", "maqola/turk-alifbosi.html"] },
      { h: "2. Har kuni oz-ozdan, lekin to'xtamasdan", p: ["Haftada bir marta 2 soat o'qishdan ko'ra har kuni 10 daqiqa o'qish samaraliroq. Miya takrorlanib turgan narsani eslab qoladi. Ketma-ket kunlar (streak) sonini kuzatish odat hosil qilishga yordam beradi."] },
      { h: "3. So'zlarni oraliqli takrorlash bilan yodlang", p: ["Yangi so'zni bir kunda o'n marta takrorlash o'rniga, uni 1, 3, 7 kundan keyin qayta ko'ring. Bu usul (spaced repetition) so'zlarni uzoq muddatli xotiraga o'tkazadi. Avval eng ko'p ishlatiladigan 500–1000 so'zni o'rganing."], cta: ["Eng ko'p ishlatiladigan 100 so'z", "maqola/100-soz.html"] },
      { h: "4. O'xshash so'zlardan foydalaning", p: ["Kitap — kitob, kalem — qalam, su — suv, göz — ko'z, baş — bosh. Turkchada yuzlab so'z o'zbekchaga o'xshaydi va ularni darhol eslab qolasiz. Lekin \"soxta do'stlar\"ga ehtiyot bo'ling: masalan, turkcha pul — pochta markasi (pul esa para), hayır — yo'q."], cta: ["Turk va o'zbek tillari: o'xshashliklar va farqlar", "maqola/turk-va-ozbek.html"] },
      { h: "5. Grammatikani qo'shimchalar orqali tushuning", p: ["Turk tili ham o'zbek tili kabi agglyutinativ til: so'zga qo'shimchalar ketma-ket qo'shiladi. Ev-ler-imiz-de — uylarimizda. Unli uyg'unligi (ünlü uyumu) qoidasini erta o'rganing: qo'shimchalar so'zdagi oxirgi unliga qarab o'zgaradi."], cta: ["Turk tili grammatikasi", "qoida/"] },
      { h: "6. Har kuni tinglang", p: ["Qisqa dialoglar, qo'shiqlar va seriallar quloqni turkcha nutqqa o'rgatadi. Avval matn bilan, keyin matnsiz tinglang. Sekin tezlikdan boshlab, asta-sekin odatiy tezlikka o'ting."] },
      { h: "7. Ovoz chiqarib gapiring", p: ["Faqat o'qish bilan gapirishni o'rganib bo'lmaydi. Har bir yangi gapni ovoz chiqarib takrorlang, o'zingizni yozib eshiting. Talaffuz mashqlari xatolaringizni darhol ko'rsatadi."] },
      { h: "8. Kichik matnlar yozing", p: ["Har kuni 3–5 gap yozing: kuningiz, oilangiz, rejalaringiz haqida. Yozish grammatikani mustahkamlaydi va yangi so'zlarni faol lug'atga o'tkazadi."] },
      { h: "9. Darajangizni biling", p: ["A1 (boshlang'ich) dan B2 (o'rta-yuqori) gacha bo'lgan darajalar o'qish, tinglash, yozish va gapirish bo'yicha aniq maqsad beradi. Darajangizni aniqlab, aynan o'sha joydan boshlang."], cta: ["Turk tili darajalari A1–B2", "maqola/darajalar.html"] },
      { h: "10. Birga o'rganing", p: ["Do'stlar yoki guruh bilan o'rganish motivatsiyani oshiradi. Haftalik reyting, kunlik vazifalar va kichik musobaqalar odatni saqlashga yordam beradi."] }
    ]
  },
  {
    id: "salomlashish",
    title: "Turkcha salomlashish va kundalik iboralar (tarjimasi bilan)",
    desc: "Turkcha salomlashish, xayrlashish, minnatdorchilik va kundalik iboralar o'zbekcha tarjimasi bilan: Merhaba, Günaydın, Teşekkürler, Kolay gelsin va boshqalar.",
    lead: "Turkiyaga safar yoki turk do'stlar bilan suhbat uchun eng kerakli iboralar. Har birini ovoz chiqarib takrorlang — ilovada talaffuzini eshitishingiz mumkin.",
    blocks: [
      { h: "Salomlashish", pairs: [["Merhaba", "Salom"], ["Selam", "Salom (do'stlar orasida)"], ["Günaydın", "Xayrli tong"], ["İyi günler", "Xayrli kun"], ["İyi akşamlar", "Xayrli kech"], ["Hoş geldiniz", "Xush kelibsiz"], ["Hoş bulduk", "Xush ko'rdik (javob)"]] },
      { h: "Hol-ahvol so'rash", pairs: [["Nasılsınız?", "Qalaysiz?"], ["Nasılsın?", "Qalaysan?"], ["İyiyim, teşekkür ederim.", "Yaxshiman, rahmat."], ["Siz nasılsınız?", "O'zingiz qalaysiz?"], ["Ne var ne yok?", "Nima gaplar?"], ["Fena değil.", "Yomon emas."]] },
      { h: "Tanishish", pairs: [["Adınız ne?", "Ismingiz nima?"], ["Benim adım Aziz.", "Mening ismim Aziz."], ["Nerelisiniz?", "Qayerliksiz?"], ["Özbekistanlıyım.", "O'zbekistonlikman."], ["Memnun oldum.", "Tanishganimdan xursandman."]] },
      { h: "Minnatdorchilik va uzr", pairs: [["Teşekkürler / Teşekkür ederim", "Rahmat"], ["Çok sağ olun", "Katta rahmat"], ["Rica ederim", "Arzimaydi"], ["Özür dilerim", "Kechirasiz (uzr so'rash)"], ["Affedersiniz", "Kechirasiz (murojaat)"], ["Önemli değil", "Hech qisi yo'q"]] },
      { h: "Xayrlashish", pairs: [["Hoşça kalın", "Xayr, sog' bo'ling (ketayotgan kishi aytadi)"], ["Güle güle", "Yaxshi boring (qolayotgan kishi aytadi)"], ["Görüşürüz", "Ko'rishguncha"], ["İyi geceler", "Xayrli tun"], ["Kendine iyi bak", "O'zingni ehtiyot qil"]] },
      { h: "Turkchaga xos iboralar", p: ["Bu iboralar so'zma-so'z tarjima qilinmaydi, lekin kundalik hayotda juda ko'p ishlatiladi."], pairs: [["Kolay gelsin", "Ishingizga omad (ishlayotgan odamga)"], ["Afiyet olsun", "Yoqimli ishtaha"], ["Geçmiş olsun", "Tezroq sog'ayib keting"], ["Elinize sağlık", "Qo'lingiz dard ko'rmasin (taom uchun)"], ["İyi şanslar", "Omad tilayman"], ["Hayırlı olsun", "Muborak bo'lsin"]], cta: ["Salomlashish darsini ilovada o'tish", "#lesson-1"] }
    ]
  },
  {
    id: "turk-va-ozbek",
    title: "Turk va o'zbek tillari: o'xshashliklar va farqlar",
    desc: "Turk va o'zbek tillari qanchalik o'xshash? Umumiy so'zlar, grammatika, unli uyg'unligi va o'zbeklar turk tilini o'rganishda e'tibor beradigan farqlar.",
    lead: "Ikkala til ham turkiy tillar oilasiga kiradi. Shuning uchun o'zbek tilida so'zlashuvchi uchun turk tili boshqa ko'plab tillardan ancha oson. Lekin o'xshashlik ba'zan chalg'itadi ham.",
    blocks: [
      { h: "Umumiy so'zlar", p: ["Yuzlab asosiy so'zlar bir xil yoki juda yaqin:"], pairs: [["su", "suv"], ["göz", "ko'z"], ["baş", "bosh"], ["taş", "tosh"], ["kitap", "kitob"], ["kalem", "qalam"], ["yol", "yo'l"], ["gün", "kun"], ["at", "ot"], ["bal", "bol, asal"]] },
      { h: "Grammatikadagi o'xshashlik", p: ["Ikkala tilda ham qo'shimchalar so'z oxiriga qo'shiladi, egalik qo'shimchalari (kitabım — kitobim), kelishiklar (eve — uyga, evde — uyda, evden — uydan) va fe'l zamonlari mantiqan o'xshash. Gap tartibi ham bir xil: ega — to'ldiruvchi — kesim. Ben kitap okuyorum — Men kitob o'qiyapman."] },
      { h: "Asosiy farq: unli uyg'unligi", p: ["Turkchada qo'shimcha unlisi so'zning oxirgi unlisiga moslashadi: ev-ler (uylar), lekin kitap-lar (kitoblar); ev-de, lekin okul-da. O'zbek tilida bu qoida deyarli saqlanmagan, shuning uchun o'zbeklar uchun eng muhim mashq — shu."] },
      { h: "Talaffuz va yozuv", p: ["Turk yozuvida Ç (ch), Ş (sh), Ğ (yumshoq g'), Ö, Ü, I (y) kabi harflar bor. C harfi \"j\" deb o'qiladi: cami — jome', cep — cho'ntak. Turkchada \"x\" va \"q\" tovushlari yo'q: xalq — halk, qalam — kalem."] },
      { h: "Soxta do'stlar", p: ["Ba'zi so'zlar bir xil ko'rinadi, lekin ma'nosi boshqa. Ularni alohida o'rganing:"], pairs: [["pul", "pochta markasi (pul — para)"], ["hayır", "yo'q (xayr emas)"], ["bekâr", "bo'ydoq, turmush qurmagan (bekor emas)"], ["çalmak", "o'g'irlamoq; cholg'u chalmoq"], ["kızmak", "jahli chiqmoq (kız — qiz)"], ["yemek", "ovqat; yemoq"]] },
      { h: "Xulosa", p: ["O'xshashliklardan foydalaning, lekin farqlarni tizimli o'rganing: unli uyg'unligi, turkcha harflar va soxta do'stlar. Shunda turk tilini juda tez o'zlashtirasiz."], cta: ["Turk tili kursini boshlash", "#course"] }
    ]
  },
  {
    id: "darajalar",
    title: "Turk tili darajalari A1, A2, B1, B2: qaysi darajadasiz?",
    desc: "Turk tili darajalari A1, A2, B1 va B2 nimani anglatadi? Har darajada nimani bila olishingiz kerak va darajangizni 5 daqiqada qanday aniqlash mumkin.",
    lead: "Til darajalari Yevropa umumiy tizimi (CEFR) asosida belgilanadi. Ular o'qish, tinglash, yozish va gapirish ko'nikmalarini o'lchaydi.",
    blocks: [
      { h: "A1 — boshlang'ich", list: ["O'zingizni tanishtirasiz, oddiy savollar berasiz va javob berasiz", "Raqamlar, vaqt, oila, ovqat, xarid haqida oddiy gaplar", "Taxminan 500–700 so'z", "Hozirgi zamon (-yor), egalik, asosiy kelishiklar"] },
      { h: "A2 — elementar", list: ["Kundalik vaziyatlar: do'konda, shifokorda, transportda", "O'tgan va kelasi zamon haqida gapirish", "Qisqa xat va xabarlar yozish", "Taxminan 1200–1500 so'z"] },
      { h: "B1 — o'rta", list: ["Ish, o'qish, sayohat haqida erkin suhbat", "Fikringizni sabablari bilan tushuntirish", "Gazeta maqolalarining asosiy mazmunini tushunish", "Taxminan 2500–3000 so'z, murakkab gaplar"] },
      { h: "B2 — o'rta-yuqori", list: ["Ijtimoiy mavzularda munozara", "Film va yangiliklarni ko'p qismini tushunish", "Rasmiy xat va insho yozish", "Ish va o'qish uchun yetarli daraja"] },
      { h: "C1 — ilg'or", list: ["Uzun va murakkab matnlarni, yashirin ma'nolarni tushunish", "Akademik va rasmiy uslubda dalilli insho yozish", "Tayyorgarliksiz ravon va aniq gapirish", "Universitet va kasbiy imtihonlarga tayyor daraja"] },
      { h: "Darajangizni qanday aniqlash mumkin?", p: ["Qisqa test o'qish, tinglash, yozish va gapirish bo'yicha savollar beradi va qaysi darajadan boshlash kerakligini ko'rsatadi. Har daraja oxirida 4 qismli test bilan natijangizni tasdiqlashingiz mumkin."], cta: ["Darajani aniqlash testi (5 daqiqa)", "#placement"] }
    ]
  }
];
