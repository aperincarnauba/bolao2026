export function formatBRT(isoString) {
  return new Date(isoString).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function stageLabel(stage, groupName) {
  if (stage === 'group') return `Grupo ${groupName}`
  if (stage === 'r32') return 'Oitavas'
  if (stage === 'r16') return 'Quartas'
  if (stage === 'qf') return 'Semi'
  if (stage === 'sf') return 'Final'
  if (stage === 'final') return 'Final'
  return stage
}

// ISO 2-letter codes for flagcdn.com image flags — works on all platforms including Windows
export const FLAG_CODES = {
  // Américas
  'Argentina': 'ar', 'Brasil': 'br', 'Bolívia': 'bo', 'Canadá': 'ca',
  'Chile': 'cl', 'Colômbia': 'co', 'Costa Rica': 'cr', 'Cuba': 'cu',
  'Curaçau': 'cw', 'El Salvador': 'sv', 'Equador': 'ec', 'Estados Unidos': 'us',
  'Guatemala': 'gt', 'Haiti': 'ht', 'Honduras': 'hn', 'Jamaica': 'jm',
  'México': 'mx', 'Nicarágua': 'ni', 'Panamá': 'pa', 'Paraguai': 'py',
  'Peru': 'pe', 'República Dominicana': 'do', 'Trinidad e Tobago': 'tt',
  'Uruguai': 'uy', 'Venezuela': 've',
  // Europa
  'Albânia': 'al', 'Alemanha': 'de', 'Áustria': 'at', 'Azerbaijão': 'az',
  'Bélgica': 'be', 'Bósnia e Herzegovina': 'ba', 'Cazaquistão': 'kz',
  'Croácia': 'hr', 'Dinamarca': 'dk', 'Escócia': 'gb-sct', 'Eslováquia': 'sk',
  'Eslovênia': 'si', 'Espanha': 'es', 'França': 'fr', 'Gales': 'gb-wls',
  'Grécia': 'gr', 'Holanda': 'nl', 'Hungria': 'hu', 'Inglaterra': 'gb-eng',
  'Irlanda': 'ie', 'Irlanda do Norte': 'gb-nir', 'Itália': 'it',
  'Noruega': 'no', 'Países Baixos': 'nl', 'Polônia': 'pl', 'Portugal': 'pt',
  'República Tcheca': 'cz', 'Romênia': 'ro', 'Rússia': 'ru', 'Sérvia': 'rs',
  'Suécia': 'se', 'Suíça': 'ch', 'Turquia': 'tr', 'Ucrânia': 'ua',
  // África
  'África do Sul': 'za', 'Argélia': 'dz', 'Cabo Verde': 'cv', 'Camarões': 'cm',
  'Costa do Marfim': 'ci', 'Egito': 'eg', 'Gana': 'gh', 'Guiné': 'gn',
  'Mali': 'ml', 'Marrocos': 'ma', 'Mauritânia': 'mr', 'Moçambique': 'mz',
  'Namíbia': 'na', 'Nigéria': 'ng', 'RD Congo': 'cd', 'Senegal': 'sn',
  'Tanzânia': 'tz', 'Tunísia': 'tn', 'Uganda': 'ug', 'Zimbábue': 'zw',
  // Ásia / Oriente Médio
  'Arábia Saudita': 'sa', 'Bahrein': 'bh', 'Catar': 'qa', 'China': 'cn',
  'Coreia do Norte': 'kp', 'Coreia do Sul': 'kr', 'Emirados Árabes Unidos': 'ae',
  'Filipinas': 'ph', 'Iêmen': 'ye', 'Índia': 'in', 'Indonésia': 'id',
  'Irã': 'ir', 'Iraque': 'iq', 'Japão': 'jp', 'Jordânia': 'jo',
  'Kuwait': 'kw', 'Líbano': 'lb', 'Líbia': 'ly', 'Omã': 'om',
  'Palestina': 'ps', 'Quirguistão': 'kg', 'Síria': 'sy', 'Tailândia': 'th',
  'Tajiquistão': 'tj', 'Uzbequistão': 'uz', 'Vietnã': 'vn',
  // Oceania
  'Austrália': 'au', 'Nova Zelândia': 'nz', 'Papua Nova Guiné': 'pg',
}

export function getFlagUrl(name) {
  const code = FLAG_CODES[name]
  if (!code) return null
  return `https://flagcdn.com/w40/${code}.png`
}

// Legacy emoji map (kept for reference, not used for rendering)
const FLAGS = {
  // Américas
  'Argentina':       '🇦🇷',
  'Bolívia':         '🇧🇴',
  'Brasil':          '🇧🇷',
  'Canadá':          '🇨🇦',
  'Chile':           '🇨🇱',
  'Colômbia':        '🇨🇴',
  'Costa Rica':      '🇨🇷',
  'Curaçau':         '🇨🇼',
  'Equador':         '🇪🇨',
  'Estados Unidos':  '🇺🇸',
  'Haiti':           '🇭🇹',
  'Jamaica':         '🇯🇲',
  'México':          '🇲🇽',
  'Panamá':          '🇵🇦',
  'Paraguai':        '🇵🇾',
  'Peru':            '🇵🇪',
  'Trinidad e Tobago':'🇹🇹',
  'Uruguai':         '🇺🇾',
  'Venezuela':       '🇻🇪',
  // Europa
  'Albânia':              '🇦🇱',
  'Alemanha':             '🇩🇪',
  'Áustria':              '🇦🇹',
  'Bélgica':              '🇧🇪',
  'Bósnia e Herzegovina': '🇧🇦',
  'Croácia':              '🇭🇷',
  'Dinamarca':            '🇩🇰',
  'Escócia':              '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Eslováquia':           '🇸🇰',
  'Eslovênia':            '🇸🇮',
  'Espanha':              '🇪🇸',
  'França':               '🇫🇷',
  'Gales':                '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  'Grécia':               '🇬🇷',
  'Holanda':              '🇳🇱',
  'Hungria':              '🇭🇺',
  'Inglaterra':           '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Irlanda do Norte':     '🇬🇧',
  'Itália':               '🇮🇹',
  'Noruega':              '🇳🇴',
  'Países Baixos':        '🇳🇱',
  'Polônia':              '🇵🇱',
  'Portugal':             '🇵🇹',
  'República Tcheca':     '🇨🇿',
  'Romênia':              '🇷🇴',
  'Sérvia':               '🇷🇸',
  'Suécia':               '🇸🇪',
  'Suíça':                '🇨🇭',
  'Turquia':              '🇹🇷',
  'Ucrânia':              '🇺🇦',
  // África
  'África do Sul':  '🇿🇦',
  'Argélia':        '🇩🇿',
  'Cabo Verde':     '🇨🇻',
  'Camarões':       '🇨🇲',
  'Costa do Marfim':'🇨🇮',
  'Egito':          '🇪🇬',
  'Gana':           '🇬🇭',
  'Guiné':          '🇬🇳',
  'Líbia':          '🇱🇾',
  'Mali':           '🇲🇱',
  'Marrocos':       '🇲🇦',
  'Mauritânia':     '🇲🇷',
  'Moçambique':     '🇲🇿',
  'Namíbia':        '🇳🇦',
  'Nigéria':        '🇳🇬',
  'RD Congo':       '🇨🇩',
  'Senegal':        '🇸🇳',
  'Tanzânia':       '🇹🇿',
  'Tunísia':        '🇹🇳',
  'Uganda':         '🇺🇬',
  'Zimbábue':       '🇿🇼',
  // Ásia / Oriente Médio
  'Arábia Saudita': '🇸🇦',
  'Azerbaijão':     '🇦🇿',
  'Bahrein':        '🇧🇭',
  'Cazaquistão':    '🇰🇿',
  'China':          '🇨🇳',
  'Coreia do Norte':'🇰🇵',
  'Coreia do Sul':  '🇰🇷',
  'Emirados Árabes Unidos': '🇦🇪',
  'Índia':          '🇮🇳',
  'Indonésia':      '🇮🇩',
  'Irã':            '🇮🇷',
  'Iraque':         '🇮🇶',
  'Japão':          '🇯🇵',
  'Jordânia':       '🇯🇴',
  'Kuwait':         '🇰🇼',
  'Líbano':         '🇱🇧',
  'Omã':            '🇴🇲',
  'Palestina':      '🇵🇸',
  'Quirguistão':    '🇰🇬',
  'Síria':          '🇸🇾',
  'Tailândia':      '🇹🇭',
  'Tajiquistão':    '🇹🇯',
  'Uzbequistão':    '🇺🇿',
  'Vietnã':         '🇻🇳',
  'Iêmen':          '🇾🇪',
  // Oceania
  'Austrália':      '🇦🇺',
  'Catar':          '🇶🇦',
  'Nova Zelândia':  '🇳🇿',
  'Papua Nova Guiné':'🇵🇬',
  // Caribe / América Central
  'Cuba':           '🇨🇺',
  'El Salvador':    '🇸🇻',
  'Guatemala':      '🇬🇹',
  'Honduras':       '🇭🇳',
  'Nicarágua':      '🇳🇮',
  'República Dominicana': '🇩🇴',
}

export function getFlagEmoji(name) {
  return FLAGS[name] || ''
}
