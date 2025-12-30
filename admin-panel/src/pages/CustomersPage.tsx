import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, Customer } from '../lib/api'
import Card, { CardContent } from '../components/Card'
import DataTable from '../components/DataTable'
import Button from '../components/Button'
import Modal from '../components/Modal'
import { Eye, Plus, Minus } from 'lucide-react'
import styles from './CustomersPage.module.css'

export default function CustomersPage() {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<Customer | null>(null)
  const [adjustModal, setAdjustModal] = useState<'balance' | 'credits' | null>(null)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: api.customers.list,
  })
  
  const balanceMutation = useMutation({
    mutationFn: ({ id, amount, reason }: { id: string; amount: number; reason: string }) =>
      api.customers.adjustBalance(id, amount, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      closeModal()
    },
  })
  
  const creditsMutation = useMutation({
    mutationFn: ({ id, amount, reason }: { id: string; amount: number; reason: string }) =>
      api.customers.adjustCredits(id, amount, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      closeModal()
    },
  })
  
  const closeModal = () => {
    setSelected(null)
    setAdjustModal(null)
    setAmount('')
    setReason('')
  }
  
  const handleAdjust = () => {
    if (!selected || !amount || !reason.trim()) return
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount)) return
    
    if (adjustModal === 'balance') {
      balanceMutation.mutate({ id: selected.id, amount: numAmount, reason })
    } else if (adjustModal === 'credits') {
      creditsMutation.mutate({ id: selected.id, amount: numAmount, reason })
    }
  }
  
  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'phone', header: 'Phone' },
    {
      key: 'email',
      header: 'Email',
      render: (c: Customer) => c.email || '-',
    },
    {
      key: 'balance',
      header: 'Balance',
      render: (c: Customer) => `${c.balance.toFixed(2)} JOD`,
    },
    {
      key: 'credits',
      header: 'Credits',
      render: (c: Customer) => `${c.credits.toFixed(2)} JOD`,
    },
    {
      key: 'totalJobs',
      header: 'Jobs',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (c: Customer) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation()
            setSelected(c)
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
        <h1 className={styles.title}>Customers</h1>
      </div>
      
      <Card>
        {isLoading ? (
          <CardContent>Loading customers...</CardContent>
        ) : (
          <DataTable
            data={customers}
            columns={columns}
            keyExtractor={(c) => c.id}
            onRowClick={setSelected}
            emptyMessage="No customers found"
          />
        )}
      </Card>
      
      <Modal
        isOpen={!!selected && !adjustModal}
        onClose={closeModal}
        title="Customer Details"
      >
        {selected && (
          <div className={styles.details}>
            <div className={styles.detailRow}>
              <span>Name:</span>
              <strong>{selected.name}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Phone:</span>
              <strong>{selected.phone}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Email:</span>
              <strong>{selected.email || '-'}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Balance:</span>
              <strong>{selected.balance.toFixed(2)} JOD</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Credits:</span>
              <strong>{selected.credits.toFixed(2)} JOD</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Total Jobs:</span>
              <strong>{selected.totalJobs}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Member Since:</span>
              <strong>{new Date(selected.createdAt).toLocaleDateString()}</strong>
            </div>
            
            <div className={styles.actionButtons}>
              <Button
                variant="secondary"
                onClick={() => setAdjustModal('balance')}
              >
                <Plus size={16} /> Adjust Balance
              </Button>
              <Button
                variant="secondary"
                onClick={() => setAdjustModal('credits')}
              >
                <Plus size={16} /> Adjust Credits
              </Button>
            </div>
          </div>
        )}
      </Modal>
      
      <Modal
        isOpen={!!adjustModal}
        onClose={closeModal}
        title={adjustModal === 'balance' ? 'Adjust Balance' : 'Adjust Credits'}
      >
        <div className={styles.adjustForm}>
          <p>
            Adjusting {adjustModal} for <strong>{selected?.name}</strong>
          </p>
          <p className={styles.hint}>
            Use positive values to add, negative values to subtract
          </p>
          
          <div className={styles.field}>
            <label>Amount (JOD)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 10 or -5"
              step="0.01"
            />
          </div>
          
          <div className={styles.field}>
            <label>Reason (required)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for this adjustment..."
              rows={3}
            />
          </div>
          
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              onClick={handleAdjust}
              disabled={!amount || !reason.trim() || balanceMutation.isPending || creditsMutation.isPending}
            >
              {balanceMutation.isPending || creditsMutation.isPending ? 'Processing...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
