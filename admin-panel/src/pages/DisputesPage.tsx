import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, Dispute } from '../lib/api'
import Card, { CardContent } from '../components/Card'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Modal from '../components/Modal'
import { Eye } from 'lucide-react'
import styles from './DisputesPage.module.css'

export default function DisputesPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<string>('')
  const [selected, setSelected] = useState<Dispute | null>(null)
  const [updateModal, setUpdateModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [resolution, setResolution] = useState('')
  const [reason, setReason] = useState('')
  
  const { data: disputes = [], isLoading } = useQuery({
    queryKey: ['disputes', filter],
    queryFn: () => api.disputes.list(filter ? { status: filter } : undefined),
  })
  
  const updateMutation = useMutation({
    mutationFn: (updates: Parameters<typeof api.disputes.update>[1] & { id: string }) =>
      api.disputes.update(updates.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] })
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
      closeModal()
    },
  })
  
  const closeModal = () => {
    setSelected(null)
    setUpdateModal(false)
    setNewStatus('')
    setResolution('')
    setReason('')
  }
  
  const handleUpdate = () => {
    if (!selected || !reason.trim()) return
    updateMutation.mutate({
      id: selected.id,
      status: newStatus as Dispute['status'] || undefined,
      resolution: resolution || undefined,
      reason,
    })
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="danger">Open</Badge>
      case 'investigating':
        return <Badge variant="warning">Investigating</Badge>
      case 'resolved':
        return <Badge variant="success">Resolved</Badge>
      case 'escalated':
        return <Badge variant="danger">Escalated</Badge>
      case 'closed':
        return <Badge>Closed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }
  
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="danger">Urgent</Badge>
      case 'high':
        return <Badge variant="warning">High</Badge>
      case 'medium':
        return <Badge variant="info">Medium</Badge>
      case 'low':
        return <Badge>Low</Badge>
      default:
        return <Badge>{priority}</Badge>
    }
  }
  
  const columns = [
    { key: 'customerName', header: 'Customer' },
    { key: 'type', header: 'Type' },
    {
      key: 'priority',
      header: 'Priority',
      render: (d: Dispute) => getPriorityBadge(d.priority),
    },
    {
      key: 'status',
      header: 'Status',
      render: (d: Dispute) => getStatusBadge(d.status),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (d: Dispute) => new Date(d.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (d: Dispute) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation()
            setSelected(d)
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
        <h1 className={styles.title}>Disputes</h1>
        <div className={styles.filters}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="escalated">Escalated</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>
      
      <Card>
        {isLoading ? (
          <CardContent>Loading disputes...</CardContent>
        ) : (
          <DataTable
            data={disputes}
            columns={columns}
            keyExtractor={(d) => d.id}
            onRowClick={setSelected}
            emptyMessage="No disputes found"
          />
        )}
      </Card>
      
      <Modal
        isOpen={!!selected && !updateModal}
        onClose={closeModal}
        title="Dispute Details"
      >
        {selected && (
          <div className={styles.details}>
            <div className={styles.detailRow}>
              <span>Customer:</span>
              <strong>{selected.customerName}</strong>
            </div>
            {selected.electricianName && (
              <div className={styles.detailRow}>
                <span>Electrician:</span>
                <strong>{selected.electricianName}</strong>
              </div>
            )}
            <div className={styles.detailRow}>
              <span>Type:</span>
              <strong>{selected.type}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Priority:</span>
              {getPriorityBadge(selected.priority)}
            </div>
            <div className={styles.detailRow}>
              <span>Status:</span>
              {getStatusBadge(selected.status)}
            </div>
            <div className={styles.descriptionRow}>
              <span>Description:</span>
              <p>{selected.description}</p>
            </div>
            {selected.resolution && (
              <div className={styles.descriptionRow}>
                <span>Resolution:</span>
                <p>{selected.resolution}</p>
              </div>
            )}
            
            {selected.status !== 'closed' && selected.status !== 'resolved' && (
              <div className={styles.actionButtons}>
                <Button onClick={() => setUpdateModal(true)}>
                  Update Status
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
      
      <Modal
        isOpen={updateModal}
        onClose={closeModal}
        title="Update Dispute"
      >
        <div className={styles.updateForm}>
          <div className={styles.field}>
            <label>New Status</label>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              <option value="">Keep current</option>
              <option value="investigating">Investigating</option>
              <option value="escalated">Escalated</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          
          <div className={styles.field}>
            <label>Resolution Notes</label>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Enter resolution details..."
              rows={3}
            />
          </div>
          
          <div className={styles.field}>
            <label>Reason for Update (required)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for this update..."
              rows={2}
            />
          </div>
          
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!reason.trim() || updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
