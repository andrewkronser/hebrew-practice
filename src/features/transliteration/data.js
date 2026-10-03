/* =============================================================================
   data.js — all of the trainer's content.

   CURRICULUM is an ordered list: item 0 is what a new learner starts with, and
   each later item unlocks in turn. The order deliberately separates look-alike
   characters (resh at 8, dalet at 19; he at 13, het at 27; vav at 16, zayin at
   34), so you are never learning two confusable glyphs at once.

     he    the Hebrew character(s) shown on the card
     n     its name — this is what the reveal panel drills
     a     the answer in Seow's system
     s     the answer in everyday transliteration
     alt   further spellings accepted under forgiving grading
     v     1 if this is a vowel point rather than a consonant
     cov   Hebrew codepoints this item "teaches", used to decide which words are
           readable yet. Leave [] for items adding no new codepoint (the dagesh
           forms, holam vav, shuruq, hiriq yod, tsere yod).
     note  shown after you answer

   WORDS has the same shape plus g for the gloss. A word surfaces automatically
   once every codepoint in it is unlocked, so adding one needs no other change.
   ========================================================================== */

/* -----------------------------------------------------------------------------
   Conventions that differ between editions.

   shewa    Seow groups vocal shewa with the reduced vowels a-breve, e-breve and
            o-breve, so "\u0259" is the natural fit and matches comparable charts.
            If your edition prints a raised e, set this to "\u1D49".

   finalHe  Seow writes a final vowel-letter he in parentheses: t\u00F4r\u0101(h),
            \u02BEi\u0161\u0161\u0101(h). Most other grammars write t\u00F4r\u00E2 instead — set this to
            "circumflex" for that convention.
   -------------------------------------------------------------------------- */

export const STYLE_OPTIONS = {
  shewa:   "\u0259",
  finalHe: "paren"   // "paren" | "circumflex"
};

export const CURRICULUM = [
  {he:"א",  n:"alef",           a:"ʾ",  s:"'",  alt:["silent","-","aleph"], cov:["א"], note:"Silent. It carries whatever vowel sits beneath it."},
  {he:"בָ",  n:"qamats",        a:"ā",  s:"a",  alt:[], v:1, cov:["\u05B8","\u05C7"], note:"Long a. Qamats qatan, the short o, is written with the same mark — the syllable tells you which, and Seow writes that one o."},
  {he:"ל",  n:"lamed",          a:"l",  s:"l",  alt:[], cov:["ל"], note:"The only letter that rises above the line."},
  {he:"שׁ",  n:"shin",           a:"š",  s:"sh", alt:[], cov:["ש","\u05C1"], note:"Dot on the right — š."},
  {he:"בַ",  n:"patach",        a:"a",  s:"a",  alt:[], v:1, cov:["\u05B7"], note:"Short a. Short vowels take no mark at all in Seow's system."},
  {he:"מ",  n:"mem",            a:"m",  s:"m",  alt:[], cov:["מ"]},
  {he:"ם",  n:"mem sofit",      a:"m",  s:"m",  alt:[], cov:["ם"], note:"The closed-up form of mem, used only at the end of a word."},
  {he:"ר",  n:"resh",           a:"r",  s:"r",  alt:[], cov:["ר"], note:"Round shoulder. Later you'll meet dalet, which has a square one."},
  {he:"בֶ",  n:"segol",         a:"e",  s:"e",  alt:[], v:1, cov:["\u05B6"], note:"Short e. Three dots in a triangle."},
  {he:"י",  n:"yod",            a:"y",  s:"y",  alt:["j"], cov:["י"], note:"The smallest letter. It also props up the historic-long vowels î and ê."},
  {he:"ב",  n:"vet",            a:"ḇ",  s:"v",  alt:["bh"], cov:["ב"], note:"No dagesh, so it is soft: underlined ḇ. With the dot (בּ) it hardens to b."},
  {he:"בִ",  n:"hiriq",         a:"i",  s:"i",  alt:["ī","ee"], v:1, cov:["\u05B4"], note:"Short i here; long ī in an open syllable. Written î when it rests on a yod."},
  {he:"ה",  n:"he",             a:"h",  s:"h",  alt:[], cov:["ה"], note:"Open on the left, with a gap at the top left corner."},
  {he:"נ",  n:"nun",            a:"n",  s:"n",  alt:[], cov:["נ"]},
  {he:"בֹ",  n:"holam",         a:"ō",  s:"o",  alt:[], v:1, cov:["\u05B9"], note:"Long o. The macron is Seow's mark for every long vowel."},
  {he:"ו",  n:"vav",            a:"w",  s:"v",  alt:["v"], cov:["ו"], note:"Seow transliterates it w, as biblical grammars do; modern Hebrew says v."},
  {he:"בוֹ", n:"holam vav",      a:"ô",  s:"o",  alt:[], v:1, cov:[], note:"Historic long o — holam resting on a vav. The circumflex marks this class."},
  {he:"ן",  n:"nun sofit",      a:"n",  s:"n",  alt:[], cov:["ן"], note:"Like a vav, but it drops below the line."},
  {he:"ד",  n:"dalet",          a:"ḏ",  s:"d",  alt:["dh"], cov:["ד"], note:"Soft dalet, underlined. Square corner at the top right — that is what separates it from resh."},
  {he:"בֵ",  n:"tsere",         a:"ē",  s:"e",  alt:[], v:1, cov:["\u05B5"], note:"Long e. Two dots side by side."},
  {he:"ת",  n:"tav",            a:"ṯ",  s:"t",  alt:["th"], cov:["ת"], note:"Soft tav, underlined. Its left leg has a small foot; he's leg is detached and footless."},
  {he:"בְ",  n:"shva",          a:"ə",  s:"e",  alt:["'","silent","-"], v:1, cov:["\u05B0"], note:"Vocal shewa, the fourth reduced vowel alongside ă ĕ ŏ. Silent shewa is left unwritten."},
  {he:"בוּ", n:"shuruq",         a:"û",  s:"u",  alt:[], v:1, cov:[], note:"Historic long u — a vav with a dot in its belly."},
  {he:"ק",  n:"qof",            a:"q",  s:"k",  alt:[], cov:["ק"], note:"Always q, kept distinct from kaf even though both sound like k today."},
  {he:"ע",  n:"ayin",           a:"ʿ",  s:"'",  alt:["silent","-"], cov:["ע"], note:"Its mark curls the opposite way from alef's: ʿ opens to the right, ʾ to the left."},
  {he:"ס",  n:"samekh",         a:"s",  s:"s",  alt:[], cov:["ס"], note:"Fully closed and round — final mem is squarer."},
  {he:"ח",  n:"ḥet",            a:"ḥ",  s:"ch", alt:["kh","h"], cov:["ח"], note:"Dot beneath. Solid roof, unlike he."},
  {he:"כ",  n:"khaf",           a:"ḵ",  s:"kh", alt:["ch"], cov:["כ"], note:"Soft kaf, underlined. Rounder than vet, with no heel at the bottom right."},
  {he:"ך",  n:"khaf sofit",     a:"ḵ",  s:"kh", alt:["ch"], cov:["ך"], note:"Final kaf, dropping well below the line. Nearly always carries a silent shewa."},
  {he:"ג",  n:"gimel",          a:"ḡ",  s:"g",  alt:["gh"], cov:["ג"], note:"Soft gimel. Overlined rather than underlined, because the letter descends below the baseline."},
  {he:"פ",  n:"fe",             a:"p̄",  s:"f",  alt:["ph"], cov:["פ"], note:"Soft pe, overlined for the same reason as ḡ. With the dot (פּ) it hardens to p."},
  {he:"ף",  n:"fe sofit",       a:"p̄",  s:"f",  alt:["ph"], cov:["ף"], note:"Final pe, always soft."},
  {he:"ט",  n:"tet",            a:"ṭ",  s:"t",  alt:[], cov:["ט"], note:"Emphatic t historically; identical to tav today, but never confuse the two in transliteration."},
  {he:"ז",  n:"zayin",          a:"z",  s:"z",  alt:[], cov:["ז"], note:"A vav wearing a hat."},
  {he:"צ",  n:"tsadi",          a:"ṣ",  s:"ts", alt:["tz"], cov:["צ"], note:"A single letter, so a single mark: ṣ, not ts."},
  {he:"ץ",  n:"tsadi sofit",    a:"ṣ",  s:"ts", alt:["tz"], cov:["ץ"], note:"Final tsadi, straightened out below the line."},
  {he:"בֻ",  n:"qubuts",        a:"u",  s:"u",  alt:["ū"], v:1, cov:["\u05BB"], note:"Short u here; long ū in an open syllable. Three dots on a diagonal."},
  {he:"שׂ",  n:"sin",            a:"ś",  s:"s",  alt:[], cov:["ש","\u05C2"], note:"Same body as shin, but the dot sits on the left and the mark is ś."},
  {he:"בִי", n:"hiriq yod",      a:"î",  s:"i",  alt:["ee"], v:1, cov:[], note:"Historic long i. Always long, because the yod is written."},
  {he:"בֵי", n:"tsere yod",      a:"ê",  s:"ei", alt:[], v:1, cov:[], note:"Historic long e, tsere resting on a yod."},
  {he:"בֲ",  n:"hataf patach",  a:"ă",  s:"a",  alt:[], v:1, cov:["\u05B2"], note:"Reduced a. The breve is Seow's mark for the reduced class."},
  {he:"בֱ",  n:"hataf segol",   a:"ĕ",  s:"e",  alt:[], v:1, cov:["\u05B1"], note:"Reduced e, found under gutturals."},
  {he:"בֳ",  n:"hataf qamats",  a:"ŏ",  s:"o",  alt:[], v:1, cov:["\u05B3"], note:"Reduced o, found under gutturals."},
  {he:"בּ",  n:"bet",            a:"b",  s:"b",  alt:[], cov:[], note:"The dot is the dagesh lene. It hardens ḇ to b, and the underline goes away."},
  {he:"גּ",  n:"gimel + dagesh", a:"g",  s:"g",  alt:[], cov:[], note:"Hard gimel: ḡ becomes g. Same sound today, but a different mark."},
  {he:"דּ",  n:"dalet + dagesh", a:"d",  s:"d",  alt:[], cov:[], note:"Hard dalet: ḏ becomes d."},
  {he:"כּ",  n:"kaf",            a:"k",  s:"k",  alt:[], cov:[], note:"Hard kaf: ḵ becomes k. Still not the same letter as qof."},
  {he:"פּ",  n:"pe",             a:"p",  s:"p",  alt:[], cov:[], note:"Hard pe: p̄ becomes p."},
  {he:"תּ",  n:"tav + dagesh",   a:"t",  s:"t",  alt:[], cov:[], note:"Hard tav: ṯ becomes t."}
];
CURRICULUM.forEach((it, i) => { it.id = "c" + i; it.idx = i; });

export const WORDS = [
  {he:"שָׁלוֹם",   a:"šālôm",      s:"shalom",   alt:["salom"],                      g:"peace"},
  {he:"תּוֹרָה",   a:"tôrā(h)",    s:"torah",    alt:["tora","tôrâ"],                g:"instruction, Torah"},
  {he:"מֶלֶךְ",    a:"meleḵ",      s:"melekh",   alt:["melech","melek"],             g:"king"},
  {he:"דָּבָר",    a:"dāḇār",      s:"davar",    alt:["dabar"],                      g:"word, thing"},
  {he:"בַּיִת",    a:"bayit",      s:"bayit",    alt:["bait"],                       g:"house"},
  {he:"אֱלֹהִים",  a:"ʾĕlōhîm",    s:"elohim",   alt:[],                             g:"God, gods"},
  {he:"יִשְׂרָאֵל", a:"yiśrāʾēl",   s:"yisrael",  alt:["israel"],                     g:"Israel"},
  {he:"סֵפֶר",    a:"sēp̄er",      s:"sefer",    alt:["seper"],                      g:"book, scroll"},
  {he:"אִישׁ",     a:"ʾîš",        s:"ish",      alt:[],                             g:"man"},
  {he:"אִשָּׁה",    a:"ʾiššā(h)",   s:"ishah",    alt:["isha","ʾiššâ"],               g:"woman"},
  {he:"יוֹם",     a:"yôm",        s:"yom",      alt:[],                             g:"day"},
  {he:"לַיְלָה",   a:"laylā(h)",   s:"laylah",   alt:["layla","laylâ"],              g:"night"},
  {he:"מַיִם",    a:"mayim",      s:"mayim",    alt:["maim"],                       g:"water"},
  {he:"אֶרֶץ",    a:"ʾereṣ",      s:"erets",    alt:["eretz"],                      g:"land, earth"},
  {he:"שָׁמַיִם",  a:"šāmayim",    s:"shamayim", alt:["shamaim"],                    g:"heavens, sky"},
  {he:"כֹּהֵן",    a:"kōhēn",      s:"kohen",    alt:[],                             g:"priest"},
  {he:"נָבִיא",   a:"nāḇîʾ",      s:"navi",     alt:["nabi"],                       g:"prophet"},
  {he:"חֶסֶד",    a:"ḥesed",      s:"chesed",   alt:["hesed","khesed"],             g:"steadfast love"},
  {he:"רוּחַ",    a:"rû(a)ḥ",     s:"ruach",    alt:["ruah","ruakh","rûaḥ"],        g:"spirit, wind", note:"The patach under the ḥet is furtive — it is pronounced before the guttural, and Seow puts it in parentheses."},
  {he:"עַם",     a:"ʿam",        s:"am",       alt:[],                             g:"people"},
  {he:"דֶּרֶךְ",   a:"dereḵ",      s:"derekh",   alt:["derech","derek"],             g:"way, road"},
  {he:"לֵב",     a:"lēḇ",        s:"lev",      alt:["leb"],                        g:"heart"},
  {he:"יָד",     a:"yāḏ",        s:"yad",      alt:[],                             g:"hand"},
  {he:"עֶבֶד",    a:"ʿeḇeḏ",      s:"eved",     alt:["ebed"],                       g:"servant, slave"},
  {he:"קֹדֶשׁ",    a:"qōḏeš",      s:"qodesh",   alt:["kodesh"],                     g:"holiness"},
  {he:"שֶׁמֶשׁ",   a:"šemeš",      s:"shemesh",  alt:[],                             g:"sun"},
  {he:"בֵּן",     a:"bēn",        s:"ben",      alt:[],                             g:"son"},
  {he:"אָב",     a:"ʾāḇ",        s:"av",       alt:["ab"],                         g:"father"},
  {he:"אֵם",     a:"ʾēm",        s:"em",       alt:[],                             g:"mother"},
  {he:"מִשְׁפָּט",  a:"mišpāṭ",     s:"mishpat",  alt:[],                             g:"judgment, justice"},
  {he:"צֶדֶק",    a:"ṣedeq",      s:"tsedeq",   alt:["tzedek","tsedek"],            g:"righteousness"},
  {he:"מִצְוָה",   a:"miṣwā(h)",   s:"mitsvah",  alt:["mitzvah","miṣwâ"],            g:"commandment"},
  {he:"כֶּסֶף",    a:"kesep̄",      s:"kesef",    alt:["keseph"],                     g:"silver, money"},
  {he:"זָהָב",    a:"zāhāḇ",      s:"zahav",    alt:["zahab"],                      g:"gold"},
  {he:"גָּדוֹל",   a:"gāḏôl",      s:"gadol",    alt:[],                             g:"great, big"},
  {he:"טוֹב",    a:"ṭôḇ",        s:"tov",      alt:["tob"],                        g:"good"},
  {he:"קָטָן",    a:"qāṭān",      s:"qatan",    alt:["katan"],                      g:"small"},
  {he:"חַיִּים",   a:"ḥayyîm",     s:"chayim",   alt:["hayyim","chaim"],             g:"life"},
  {he:"שָׁנָה",    a:"šānā(h)",    s:"shanah",   alt:["shana","šānâ"],               g:"year"},
  {he:"מַלְאָךְ",  a:"malʾāḵ",     s:"malakh",   alt:["malach"],                     g:"messenger, angel"},
  {he:"תַּלְמִיד",  a:"talmîḏ",     s:"talmid",   alt:[],                             g:"student"},
  {he:"שָׁמַע",    a:"šāmaʿ",      s:"shama",    alt:[],                             g:"he heard"},
  {he:"אָדָם",    a:"ʾāḏām",      s:"adam",     alt:[],                             g:"human, Adam"},
  {he:"מִדְבָּר",  a:"miḏbār",     s:"midbar",   alt:[],                             g:"wilderness"},
  {he:"בְּרִית",   a:"bərîṯ",      s:"brit",     alt:["berit","berith"],             g:"covenant"},
  {he:"נֶפֶשׁ",    a:"nep̄eš",      s:"nefesh",   alt:["nephesh"],                    g:"soul, life"},
  {he:"עוֹלָם",   a:"ʿôlām",      s:"olam",     alt:[],                             g:"forever, world"},
  {he:"שַׁבָּת",   a:"šabbāṯ",     s:"shabbat",  alt:["shabat"],                     g:"sabbath"},
  {he:"חָכְמָה",  a:"ḥoḵmā(h)",   s:"chokhmah", alt:["hokmah","chochma","ḥoḵmâ"],   g:"wisdom", note:"The qamats is qamats qatan here — a closed unstressed syllable, so it is short o, not ā."},
  {he:"אֱמֶת",   a:"ʾĕmeṯ",      s:"emet",     alt:[],                             g:"truth"}
];
WORDS.forEach((w, i) => { w.id = "w" + i; w.word = 1; });

export const DIACRITIC_KEYS = ["ʾ","ʿ","ḇ","ḡ","ḏ","ḵ","p̄","ṯ","ḥ","ṭ","ṣ","š","ś",
              "ā","ē","ī","ō","ū","â","ê","î","ô","û","ă","ĕ","ŏ","ə","(",")"];

/* Apply STYLE_OPTIONS to every answer above. */
(function applyStyleOptions() {
  const swap = (s) => {
    if (typeof s !== "string") return s;
    let out = s;
    if (STYLE_OPTIONS.shewa !== "\u0259") out = out.split("\u0259").join(STYLE_OPTIONS.shewa);
    if (STYLE_OPTIONS.finalHe === "circumflex") out = out.replace(/\u0101\(h\)$/, "\u00E2");
    return out;
  };
  for (const it of CURRICULUM.concat(WORDS)) {
    it.a = swap(it.a);
    if (Array.isArray(it.alt)) it.alt = it.alt.map(swap);
  }
})();
