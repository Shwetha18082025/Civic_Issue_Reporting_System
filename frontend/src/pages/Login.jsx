import { useState } from 'react'
import CitizenLogin from './CitizenLogin'
import AuthorityLogin from './AuthorityLogin'

export default function Login() {
  const [view, setView] = useState('citizen')

  if (view === 'authority') {
    return <AuthorityLogin onSwitchToCitizen={() => setView('citizen')} />
  }

  return <CitizenLogin onSwitchToAuth={() => setView('authority')} />
}