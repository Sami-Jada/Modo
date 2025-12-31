import { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard,
  Users,
  Zap,
  Briefcase,
  AlertTriangle,
  UserCircle,
  MessageSquare,
  Settings,
  FileText,
  LogOut,
} from 'lucide-react'
import styles from './Layout.module.css'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/applications', icon: Users, label: 'Applications' },
  { path: '/electricians', icon: Zap, label: 'Electricians' },
  { path: '/jobs', icon: Briefcase, label: 'Jobs' },
  { path: '/disputes', icon: AlertTriangle, label: 'Disputes' },
  { path: '/customers', icon: UserCircle, label: 'Customers' },
  { path: '/leads', icon: MessageSquare, label: 'Marketing Leads' },
  { path: '/config', icon: Settings, label: 'Config' },
  { path: '/audit-log', icon: FileText, label: 'Audit Log' },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }
  
  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <Zap size={24} />
          <span>Kahraba Admin</span>
        </div>
        
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
              end={item.path === '/'}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        
        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.name}</span>
            <span className={styles.userRole}>{user?.role}</span>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      
      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
}
