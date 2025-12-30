import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ApplicationsPage from './pages/ApplicationsPage'
import ElectriciansPage from './pages/ElectriciansPage'
import JobsPage from './pages/JobsPage'
import DisputesPage from './pages/DisputesPage'
import CustomersPage from './pages/CustomersPage'
import ConfigPage from './pages/ConfigPage'
import AuditLogPage from './pages/AuditLogPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        Loading...
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/applications" element={<ApplicationsPage />} />
                <Route path="/electricians" element={<ElectriciansPage />} />
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="/disputes" element={<DisputesPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/config" element={<ConfigPage />} />
                <Route path="/audit-log" element={<AuditLogPage />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
