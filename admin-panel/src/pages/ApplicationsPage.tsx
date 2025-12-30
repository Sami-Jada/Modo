import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, Application } from '../lib/api'
import Card, { CardContent, CardHeader, CardTitle } from '../components/Card'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Modal from '../components/Modal'
import { Check, X, Eye } from 'lucide-react'
import styles from './ApplicationsPage.module.css'

export default function ApplicationsPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<string>('')
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
  const [reason, setReason] = useState('')
  
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['applications', filter],
    queryFn: () => api.applications.list(filter || undefined),
  })
  
  const approveMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.applications.approve(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
      closeModal()
    },
  })
  
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.applications.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
      closeModal()
    },
  })
  
  const closeModal = () => {
    setSelectedApp(null)
    setActionType(null)
    setReason('')
  }
  
  const handleAction = () => {
    if (!selectedApp || !actionType || !reason.trim()) return
    
    if (actionType === 'approve') {
      approveMutation.mutate({ id: selectedApp.id, reason })
    } else {
      rejectMutation.mutate({ id: selectedApp.id, reason })
    }
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>
      case 'approved':
        return <Badge variant="success">Approved</Badge>
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }
  
  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    {
      key: 'yearsExperience',
      header: 'Experience',
      render: (app: Application) => `${app.yearsExperience} years`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (app: Application) => getStatusBadge(app.status),
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      render: (app: Application) => new Date(app.submittedAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (app: Application) => (
        <div className={styles.actions}>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedApp(app)
            }}
          >
            <Eye size={16} />
          </Button>
          {app.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="success"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedApp(app)
                  setActionType('approve')
                }}
              >
                <Check size={16} />
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedApp(app)
                  setActionType('reject')
                }}
              >
                <X size={16} />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Electrician Applications</h1>
        <div className={styles.filters}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
      
      <Card>
        {isLoading ? (
          <CardContent>Loading applications...</CardContent>
        ) : (
          <DataTable
            data={applications}
            columns={columns}
            keyExtractor={(app) => app.id}
            onRowClick={setSelectedApp}
            emptyMessage="No applications found"
          />
        )}
      </Card>
      
      <Modal
        isOpen={!!selectedApp && !actionType}
        onClose={closeModal}
        title="Application Details"
      >
        {selectedApp && (
          <div className={styles.details}>
            <div className={styles.detailRow}>
              <span>Name:</span>
              <strong>{selectedApp.name}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Email:</span>
              <strong>{selectedApp.email}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Phone:</span>
              <strong>{selectedApp.phone}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>National ID:</span>
              <strong>{selectedApp.nationalId}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Experience:</span>
              <strong>{selectedApp.yearsExperience} years</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Specializations:</span>
              <strong>{selectedApp.specializations.join(', ')}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Certifications:</span>
              <strong>{selectedApp.certifications.join(', ')}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Status:</span>
              {getStatusBadge(selectedApp.status)}
            </div>
            {selectedApp.reviewReason && (
              <div className={styles.detailRow}>
                <span>Review Note:</span>
                <strong>{selectedApp.reviewReason}</strong>
              </div>
            )}
            
            {selectedApp.status === 'pending' && (
              <div className={styles.actionButtons}>
                <Button
                  variant="success"
                  onClick={() => setActionType('approve')}
                >
                  <Check size={18} /> Approve
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setActionType('reject')}
                >
                  <X size={18} /> Reject
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
      
      <Modal
        isOpen={!!actionType}
        onClose={closeModal}
        title={actionType === 'approve' ? 'Approve Application' : 'Reject Application'}
      >
        <div className={styles.reasonForm}>
          <p>
            {actionType === 'approve'
              ? `You are about to approve ${selectedApp?.name}'s application.`
              : `You are about to reject ${selectedApp?.name}'s application.`}
          </p>
          <div className={styles.field}>
            <label>Reason (required)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for this action..."
              rows={3}
            />
          </div>
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'approve' ? 'success' : 'danger'}
              onClick={handleAction}
              disabled={!reason.trim() || approveMutation.isPending || rejectMutation.isPending}
            >
              {approveMutation.isPending || rejectMutation.isPending
                ? 'Processing...'
                : actionType === 'approve'
                  ? 'Confirm Approval'
                  : 'Confirm Rejection'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
