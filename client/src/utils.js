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
