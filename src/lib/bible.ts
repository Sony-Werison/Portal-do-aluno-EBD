export const BIBLE_BOOK_MAP: { [key: string]: string } = {
    'gênesis': 'gn', 'êxodo': 'ex', 'levítico': 'lv', 'números': 'nm', 'deuteronômio': 'dt',
    'josué': 'js', 'juízes': 'jz', 'rute': 'rt', '1 samuel': '1sm', '2 samuel': '2sm',
    '1 reis': '1rs', '2 reis': '2rs', '1 crônicas': '1cr', '2 crônicas': '2cr', 'esdras': 'ed',
    'neemias': 'ne', 'ester': 'et', 'jó': 'job', 'salmos': 'sl', 'provérbios': 'pv',
    'eclesiastes': 'ec', 'cântico dos cânticos': 'ct', 'cantares': 'ct', 'isaías': 'is', 'jeremias': 'jr', 'lamentações': 'lm',
    'ezequiel': 'ez', 'daniel': 'dn', 'oséias': 'os', 'joel': 'jl', 'amós': 'am', 'obadias': 'ob',
    'jonas': 'jn', 'miquéias': 'mq', 'naum': 'na', 'habacuque': 'hc', 'sofonias': 'sf',
    'ageu': 'ag', 'zacarias': 'zc', 'malaquias': 'ml',
    'mateus': 'mt', 'marcos': 'mc', 'lucas': 'lc', 'joão': 'jo', 'atos': 'at', 'romanos': 'rm',
    '1 coríntios': '1co', '2 coríntios': '2co', 'gálatas': 'gl', 'efésios': 'ef', 'filipenses': 'fp',
    'colossenses': 'cl', '1 tessalonicenses': '1ts', '2 tessalonicenses': '2ts', '1 timóteo': '1tm',
    '2 timóteo': '2tm', 'tito': 'tt', 'filemom': 'fm', 'hebreus': 'hb', 'tiago': 'tg',
    '1 pedro': '1pe', '2 pedro': '2pe', '1 joão': '1jo', '2 joão': '2jo', '3 joão': '3jo',
    'judas': 'jd', 'apocalipse': 'ap'
};

export const BIBLE_ABBREV_TO_FULL_NAME: { [key: string]: string } = {};
Object.entries(BIBLE_BOOK_MAP).forEach(([fullName, abbrev]) => {
    const capitalized = fullName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    if (!BIBLE_ABBREV_TO_FULL_NAME[abbrev]) {
      BIBLE_ABBREV_TO_FULL_NAME[abbrev] = capitalized;
    }
});

export const FULL_NAME_TO_ABBREV: { [key: string]: string } = {};
Object.entries(BIBLE_ABBREV_TO_FULL_NAME).forEach(([abbrev, fullName]) => {
    FULL_NAME_TO_ABBREV[fullName] = abbrev;
});

export const BIBLE_BOOK_ORDER = [
    'gn', 'ex', 'lv', 'nm', 'dt', 'js', 'jz', 'rt', '1sm', '2sm', '1rs', '2rs', '1cr', '2cr', 'ed', 'ne', 'et', 'job', 'sl', 'pv', 'ec', 'ct', 'is', 'jr', 'lm', 'ez', 'dn', 'os', 'jl', 'am', 'ob', 'jn', 'mq', 'na', 'hc', 'sf', 'ag', 'zc', 'ml',
    'mt', 'mc', 'lc', 'jo', 'at', 'rm', '1co', '2co', 'gl', 'ef', 'fp', 'cl', '1ts', '2ts', '1tm', '2tm', 'tt', 'fm', 'hb', 'tg', '1pe', '2pe', '1jo', '2jo', '3jo', 'jd', 'ap'
];
