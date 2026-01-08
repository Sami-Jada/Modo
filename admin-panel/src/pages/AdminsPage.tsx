import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, AdminUser } from '../lib/api'
import Card, { CardContent } from '../components/Card'
import DataTable from '../components/DataTable'
import Button from '../components/Button'
import Modal from '../components/Modal'
import { Plus, Key } from 'lucide-react'
import styles from './AdminsPage.module.css'

export default function AdminsPage() {
  const queryClient = useQueryClient()
  const [createModal, setCreateModal] = useState(false)
  const [changePasswordModal, setChangePasswordModal] = useState<AdminUser | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'operator' as 'superadmin' | 'operator',
  })
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')

  const { data: admins = [], isLoading } = useQuery({
    queryKey: ['admins'],
    queryFn: api.admins.list,
  })

  const createMutation = useMutation({
    mutationFn: ({ email, password, name, role }: { email: string; password: string; name: string; role: 'superadmin' | 'operator' }) =>
      api.admins.create(email, password, name, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] })
      setCreateModal(false)
      setFormData({ email: '', password: '', name: '', role: 'operator' })
      setError('')
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      api.admins.changePassword(id, newPassword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] })
      setChangePasswordModal(null)
      setPasswordData({ newPassword: '', confirmPassword: '' })
      setError('')
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.email || !formData.password || !formData.name) {
      setError('All fields are required')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    createMutation.mutate(formData)
  }

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      setError('All fields are required')
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!changePasswordModal) return

    changePasswordMutation.mutate({
      id: changePasswordModal.id,
      newPassword: passwordData.newPassword,
    })
  }

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: (admin: AdminUser) => (
        <span className={admin.role === 'superadmin' ? styles.superadmin : styles.operator}>
          {admin.role}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (admin: AdminUser) => new Date(admin.createdAt).toLocaleDateString(),
    },
    {
      key: 'lastLoginAt',
      header: 'Last Login',
      render: (admin: AdminUser) => admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleDateString() : 'Never',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (admin: AdminUser) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation()
            setChangePasswordModal(admin)
          }}
        >
          <Key size={16} />
        </Button>
      ),
    },
  ]

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Admin Users</h1>
        <Button onClick={() => setCreateModal(true)}>
          <Plus size={18} />
          Create Admin
        </Button>
      </div>

      <Card>
        <CardContent>
          {isLoading ? (
            <div className={styles.loading}>Loading...</div>
          ) : (
            <DataTable data={admins} columns={columns} />
          )}
        </CardContent>
      </Card>

      {/* Create Admin Modal */}
      <Modal isOpen={createModal} onClose={() => { setCreateModal(false); setError(''); setFormData({ email: '', password: '', name: '', role: 'operator' }) }} title="Create Admin User">
        <form onSubmit={handleCreate} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.field}>
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Admin name"
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="admin@modo.jo"
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimum 6 characters"
              required
              minLength={6}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="role">Role</label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'superadmin' | 'operator' })}
              required
            >
              <option value="operator">Operator</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="secondary" onClick={() => { setCreateModal(false); setError(''); setFormData({ email: '', password: '', name: '', role: 'operator' }) }} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Admin'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal isOpen={!!changePasswordModal} onClose={() => { setChangePasswordModal(null); setError(''); setPasswordData({ newPassword: '', confirmPassword: '' }) }} title={`Change Password - ${changePasswordModal?.name}`}>
        <form onSubmit={handleChangePassword} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.field}>
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              placeholder="Minimum 6 characters"
              required
              minLength={6}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              placeholder="Confirm new password"
              required
              minLength={6}
            />
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="secondary" onClick={() => { setChangePasswordModal(null); setError(''); setPasswordData({ newPassword: '', confirmPassword: '' }) }} disabled={changePasswordMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={changePasswordMutation.isPending}>
              {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

