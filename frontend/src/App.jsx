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

// AI Chatbot
import Chatbot from './components/Chatbot'
import IssueMap from './pages/IssueMap'


function App() {
  return (
    <>

      {/* ================= ROUTES ================= */}

      <Routes>

        <Route path="/" element={<MainLayout />}>

          {/* Home */}
          <Route
            index
            element={<Home />}
          />

          {/* Login */}
          <Route
            path="login"
            element={<Login />}
          />

          {/* Citizen Login */}
          <Route
            path="citizen-login"
            element={<CitizenLogin />}
          />

          {/* Authority Login */}
          <Route
            path="authority-login"
            element={<AuthorityLogin />}
          />

          {/* Auth Callback */}
          <Route
            path="auth/callback"
            element={<AuthCallback />}
          />

          {/* Issue Details */}
          <Route
            path="issues/:id"
            element={<IssueDetail />}
          />

          {/* ================= PROTECTED ROUTES ================= */}

          {/* Report Issue */}
          <Route
            path="report"
            element={
              <ProtectedRoute>
                <ReportIssue />
              </ProtectedRoute>
            }
          />

          {/* My Issues */}
          <Route
            path="my-issues"
            element={
              <ProtectedRoute>
                <MyIssues />
              </ProtectedRoute>
            }
          />

          {/* Citizen Dashboard */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="issue-map" element={<IssueMap />} />

          {/* Authority Dashboard */}
          <Route
            path="authority/dashboard"
            element={
              <ProtectedRoute
                allowedRoles={['admin', 'officer']}
              >
                <AuthorityDashboard />
              </ProtectedRoute>
            }
          />

        </Route>

      </Routes>


      {/* ================= AI CHATBOT ================= */}

      <Chatbot />

    </>
  )
}

export default App