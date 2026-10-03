import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'hi', label: 'हिन्दी' },
]

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const current = i18n.resolvedLanguage || 'en'

  return (
    <label
      style={{
        display: 'flex', alignItems: 'center', gap: '0.35rem',
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '9999px',
        padding: '0.3rem 0.4rem 0.3rem 0.75rem',
        color: 'rgba(255,255,255,0.8)',
        fontSize: '0.85rem',
      }}
    >
      <span aria-hidden="true">🌐</span>
      <select
        aria-label={t('language.label')}
        value={current}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'white',
          fontSize: '0.85rem',
          fontWeight: 500,
          cursor: 'pointer',
          outline: 'none',
          fontFamily: 'inherit',
        }}
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code} style={{ color: '#0a0f2e' }}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  )
}
