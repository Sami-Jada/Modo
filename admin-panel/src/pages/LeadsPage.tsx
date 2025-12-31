import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, MarketingLead } from '../lib/api'
import Card, { CardContent } from '../components/Card'
import Button from '../components/Button'
import Modal from '../components/Modal'
import Badge from '../components/Badge'
import { Eye, Phone, Mail, MapPin, MessageSquare } from 'lucide-react'
import styles from './LeadsPage.module.css'

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'default',
  contacted: 'info',
  converted: 'success',
  closed: 'danger',
}

export default function LeadsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selected, setSelected] = useState<MarketingLead | null>(null)
  const [statusModal, setStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [notes, setNotes] = useState('')
  
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads', statusFilter],
    queryFn: () => api.leads.list(statusFilter || undefined),
  })
  
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      api.leads.updateStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      closeModal()
    },
  })
  
  const closeModal = () => {
    setSelected(null)
    setStatusModal(false)
    setNewStatus('')
    setNotes('')
  }
  
  const handleUpdateStatus = () => {
    if (!selected || !newStatus) return
    updateStatusMutation.mutate({ id: selected.id, status: newStatus, notes: notes || undefined })
  }
  
  const openStatusModal = (lead: MarketingLead) => {
    setSelected(lead)
    setNewStatus(lead.status)
    setNotes(lead.notes || '')
    setStatusModal(true)
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Marketing Leads</h1>
        <p className={styles.subtitle}>
          Requests submitted via the marketing website contact form
        </p>
      </div>
      
      <div className={styles.filters}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.select}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="contacted">Contacted</option>
          <option value="converted">Converted</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      
      <Card>
        {isLoading ? (
          <CardContent>Loading leads...</CardContent>
        ) : leads.length === 0 ? (
          <CardContent>
            <div className={styles.empty}>
              <MessageSquare size={48} />
              <p>No marketing leads yet</p>
              <span>Leads submitted through the marketing website will appear here</span>
            </div>
          </CardContent>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} onClick={() => setSelected(lead)} className={styles.clickable}>
                    <td><Badge variant={statusColors[lead.status]}>{lead.status}</Badge></td>
                    <td>{lead.customerName}</td>
                    <td>{lead.customerPhone}</td>
                    <td><span className={styles.truncate}>{lead.serviceAddress}</span></td>
                    <td>{new Date(lead.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelected(lead)
                        }}
                      >
                        <Eye size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      
      <Modal
        isOpen={!!selected && !statusModal}
        onClose={closeModal}
        title="Lead Details"
      >
        {selected && (
          <div className={styles.details}>
            <div className={styles.detailHeader}>
              <Badge variant={statusColors[selected.status]}>{selected.status}</Badge>
              <span className={styles.date}>
                Submitted {new Date(selected.createdAt).toLocaleString()}
              </span>
            </div>
            
            <div className={styles.detailSection}>
              <h4>Contact Information</h4>
              <div className={styles.detailRow}>
                <span><Phone size={16} /> Phone:</span>
                <a href={`tel:${selected.customerPhone}`}>{selected.customerPhone}</a>
              </div>
              {selected.customerEmail && (
                <div className={styles.detailRow}>
                  <span><Mail size={16} /> Email:</span>
                  <a href={`mailto:${selected.customerEmail}`}>{selected.customerEmail}</a>
                </div>
              )}
              <div className={styles.detailRow}>
                <span><MapPin size={16} /> Address:</span>
                <strong>{selected.serviceAddress}</strong>
              </div>
            </div>
            
            <div className={styles.detailSection}>
              <h4>Issue Description</h4>
              <p className={styles.description}>{selected.issueDescription}</p>
            </div>
            
            {selected.notes && (
              <div className={styles.detailSection}>
                <h4>Notes</h4>
                <p className={styles.notes}>{selected.notes}</p>
              </div>
            )}
            
            <div className={styles.actionButtons}>
              <Button variant="primary" onClick={() => openStatusModal(selected)}>
                Update Status
              </Button>
            </div>
          </div>
        )}
      </Modal>
      
      <Modal
        isOpen={statusModal}
        onClose={closeModal}
        title="Update Lead Status"
      >
        <div className={styles.statusForm}>
          <div className={styles.field}>
            <label>Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className={styles.select}
            >
              <option value="pending">Pending</option>
              <option value="contacted">Contacted</option>
              <option value="converted">Converted</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          
          <div className={styles.field}>
            <label>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this lead..."
              rows={4}
            />
          </div>
          
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
