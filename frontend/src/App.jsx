import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/common/ProtectedRoute'
import Home from './pages/Home'
import CitizenLogin from './pages/CitizenLogin'
import AuthorityLogin from './pages/AuthorityLogin'
import ReportIssue from './pages/ReportIssue'
import MyIssues from './pages/MyIssues'
import IssueDetail from './pages/IssueDetail'
import Dashboard from './pages/Dashboard'
import AuthCallback from './pages/AuthCallback'
import Login from './pages/Login'
import AuthorityDashboard from './pages/AuthorityDashboard'

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="citizen-login" element={<CitizenLogin />} />
        <Route path="authority-login" element={<AuthorityLogin />} />
        <Route path="auth/callback" element={<AuthCallback />} />
        <Route path="issues/:id" element={<IssueDetail />} />

        {/* Protected: any logged in user */}
        <Route path="report" element={
          <ProtectedRoute><ReportIssue /></ProtectedRoute>
        } />
        <Route path="my-issues" element={
          <ProtectedRoute><MyIssues /></ProtectedRoute>
        } />

        {/* Protected: admin only */}
        <Route path="authority/dashboard" element={
          <ProtectedRoute allowedRoles={['admin','officer']}>
            <AuthorityDashboard />
          </ProtectedRoute>
        } />

        {/* Protected: citizen dashboard */}
        <Route path="dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  )
}

export default App
