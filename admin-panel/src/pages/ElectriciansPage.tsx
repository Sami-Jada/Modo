import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, Electrician } from '../lib/api'
import Card, { CardContent } from '../components/Card'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Modal from '../components/Modal'
import { Star, Eye } from 'lucide-react'
import styles from './ElectriciansPage.module.css'

export default function ElectriciansPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<string>('')
  const [selected, setSelected] = useState<Electrician | null>(null)
  const [statusModal, setStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [reason, setReason] = useState('')
  
  const { data: electricians = [], isLoading } = useQuery({
    queryKey: ['electricians', filter],
    queryFn: () => api.electricians.list(filter || undefined),
  })
  
  const statusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason: string }) =>
      api.electricians.updateStatus(id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['electricians'] })
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
      closeModal()
    },
  })
  
  const closeModal = () => {
    setSelected(null)
    setStatusModal(false)
    setNewStatus('')
    setReason('')
  }
  
  const handleStatusChange = () => {
    if (!selected || !newStatus || !reason.trim()) return
    statusMutation.mutate({ id: selected.id, status: newStatus, reason })
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>
      case 'suspended':
        return <Badge variant="warning">Suspended</Badge>
      case 'inactive':
        return <Badge variant="danger">Inactive</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }
  
  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'phone', header: 'Phone' },
    {
      key: 'rating',
      header: 'Rating',
      render: (e: Electrician) => (
        <span className={styles.rating}>
          <Star size={14} fill="#f59e0b" color="#f59e0b" />
          {e.rating.toFixed(1)}
        </span>
      ),
    },
    {
      key: 'jobs',
      header: 'Jobs',
      render: (e: Electrician) => `${e.completedJobs}/${e.totalJobs}`,
    },
    {
      key: 'balance',
      header: 'Balance',
      render: (e: Electrician) => `${e.balance.toFixed(2)} JOD`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (e: Electrician) => getStatusBadge(e.status),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (e: Electrician) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e_) => {
            e_.stopPropagation()
            setSelected(e)
          }}
        >
          <Eye size={16} />
        </Button>
      ),
    },
  ]
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Electricians</h1>
        <div className={styles.filters}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      
      <Card>
        {isLoading ? (
          <CardContent>Loading electricians...</CardContent>
        ) : (
          <DataTable
            data={electricians}
            columns={columns}
            keyExtractor={(e) => e.id}
            onRowClick={setSelected}
            emptyMessage="No electricians found"
          />
        )}
      </Card>
      
      <Modal
        isOpen={!!selected && !statusModal}
        onClose={closeModal}
        title="Electrician Details"
      >
        {selected && (
          <div className={styles.details}>
            <div className={styles.detailRow}>
              <span>Name:</span>
              <strong>{selected.name}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Email:</span>
              <strong>{selected.email}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Phone:</span>
              <strong>{selected.phone}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Experience:</span>
              <strong>{selected.yearsExperience} years</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Specializations:</span>
              <strong>{selected.specializations.join(', ')}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Rating:</span>
              <span className={styles.rating}>
                <Star size={14} fill="#f59e0b" color="#f59e0b" />
                <strong>{selected.rating.toFixed(1)}</strong>
              </span>
            </div>
            <div className={styles.detailRow}>
              <span>Jobs:</span>
              <strong>{selected.completedJobs} completed / {selected.totalJobs} total</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Balance:</span>
              <strong>{selected.balance.toFixed(2)} JOD</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Status:</span>
              {getStatusBadge(selected.status)}
            </div>
            
            <div className={styles.actionButtons}>
              <Button
                variant="secondary"
                onClick={() => {
                  setNewStatus(selected.status === 'active' ? 'suspended' : 'active')
                  setStatusModal(true)
                }}
              >
                {selected.status === 'active' ? 'Suspend' : 'Activate'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
      
      <Modal
        isOpen={statusModal}
        onClose={closeModal}
        title="Change Status"
      >
        <div className={styles.reasonForm}>
          <p>
            Change {selected?.name}'s status to <strong>{newStatus}</strong>
          </p>
          <div className={styles.field}>
            <label>Reason (required)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for this status change..."
              rows={3}
            />
          </div>
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={!reason.trim() || statusMutation.isPending}
            >
              {statusMutation.isPending ? 'Updating...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
