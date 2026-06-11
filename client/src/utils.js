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
  'Estados Unidos': '🇺🇸', 'México': '🇲🇽', 'Canadá': '🇨🇦',
  'Brasil': '🇧🇷', 'Argentina': '🇦🇷', 'Colômbia': '🇨🇴',
  'Uruguai': '🇺🇾', 'Peru': '🇵🇪', 'Chile': '🇨🇱',
  'Equador': '🇪🇨', 'Venezuela': '🇻🇪', 'Bolívia': '🇧🇴',
  'Paraguai': '🇵🇾', 'Panamá': '🇵🇦', 'Costa Rica': '🇨🇷',
  'Jamaica': '🇯🇲', 'Haiti': '🇭🇹', 'Curaçau': '🇨🇼',
  // Europa
  'Espanha': '🇪🇸', 'França': '🇫🇷', 'Alemanha': '🇩🇪',
  'Inglaterra': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Portugal': '🇵🇹', 'Holanda': '🇳🇱',
  'Países Baixos': '🇳🇱', 'Bélgica': '🇧🇪', 'Itália': '🇮🇹',
  'Croácia': '🇭🇷', 'Sérvia': '🇷🇸', 'Polônia': '🇵🇱',
  'Ucrânia': '🇺🇦', 'Turquia': '🇹🇷', 'Escócia': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Áustria': '🇦🇹', 'Dinamarca': '🇩🇰', 'Noruega': '🇳🇴',
  'Suíça': '🇨🇭', 'Albânia': '🇦🇱', 'Suécia': '🇸🇪',
  'República Tcheca': '🇨🇿', 'Bósnia e Herzegovina': '🇧🇦',
  // África
  'Marrocos': '🇲🇦', 'Senegal': '🇸🇳', 'Nigéria': '🇳🇬',
  'Egito': '🇪🇬', 'Costa do Marfim': '🇨🇮', 'Camarões': '🇨🇲',
  'Gana': '🇬🇭', 'África do Sul': '🇿🇦', 'Tunísia': '🇹🇳',
  'Argélia': '🇩🇿', 'RD Congo': '🇨🇩', 'Cabo Verde': '🇨🇻',
  // Ásia / Oceania
  'Japão': '🇯🇵', 'Coreia do Sul': '🇰🇷', 'Arábia Saudita': '🇸🇦',
  'Irã': '🇮🇷', 'Austrália': '🇦🇺', 'Nova Zelândia': '🇳🇿',
  'Iraque': '🇮🇶', 'Jordânia': '🇯🇴', 'Uzbequistão': '🇺🇿',
  'Catar': '🇶🇦',
}

export function getFlagEmoji(name) {
  return FLAGS[name] || '🏳️'
}
