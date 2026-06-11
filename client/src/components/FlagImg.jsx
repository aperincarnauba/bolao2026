import { getFlagUrl } from '../utils'

export default function FlagImg({ name, size = 'md' }) {
  const url = getFlagUrl(name)
  if (!url) return null
  const cls = size === 'sm' ? 'w-5 h-3.5' : size === 'lg' ? 'w-8 h-[22px]' : 'w-6 h-4'
  return (
    <img
      src={url}
      alt={name}
      className={`${cls} object-cover rounded-[2px] shadow-sm inline-block shrink-0`}
      loading="lazy"
    />
  )
}
