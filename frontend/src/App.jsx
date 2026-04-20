import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/common/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ReportIssue from './pages/ReportIssue'
import MyIssues from './pages/MyIssues'
import IssueDetail from './pages/IssueDetail'
import Dashboard from './pages/Dashboard'
import AuthCallback from './pages/AuthCallback'

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="auth/callback" element={<AuthCallback />} />
        <Route path="issues/:id" element={<IssueDetail />} />

        {/* Protected: any logged in user */}
        <Route path="report" element={
          <ProtectedRoute><ReportIssue /></ProtectedRoute>
        } />
        <Route path="my-issues" element={
          <ProtectedRoute><MyIssues /></ProtectedRoute>
        } />

        {/* Protected: officers and admins only */}
        <Route path="dashboard" element={
          <ProtectedRoute allowedRoles={['officer', 'admin']}>
            <Dashboard />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  )
}

export default App