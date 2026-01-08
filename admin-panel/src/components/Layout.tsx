import { ReactNode, useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import ChangePasswordModal from './ChangePasswordModal'
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
  ChevronDown,
  Key,
  UserCog,
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
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])
  
  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isSuperadmin = user?.role === 'superadmin'
  
  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <Zap size={24} />
          <span>Modo Admin</span>
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
          <div className={styles.dropdownContainer} ref={dropdownRef}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)} 
              className={styles.dropdownBtn}
            >
              <ChevronDown size={18} />
            </button>
            {dropdownOpen && (
              <div className={styles.dropdown}>
                {isSuperadmin && (
                  <button
                    onClick={() => {
                      setDropdownOpen(false)
                      navigate('/admins')
                    }}
                    className={styles.dropdownItem}
                  >
                    <UserCog size={16} />
                    <span>Admin Users List</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setDropdownOpen(false)
                    setChangePasswordOpen(true)
                  }}
                  className={styles.dropdownItem}
                >
                  <Key size={16} />
                  <span>Change Password</span>
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false)
                    handleLogout()
                  }}
                  className={styles.dropdownItem}
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
      
      <main className={styles.main}>
        {children}
      </main>

      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        onSuccess={() => {
          // Password changed successfully
        }}
      />
    </div>
  )
}
