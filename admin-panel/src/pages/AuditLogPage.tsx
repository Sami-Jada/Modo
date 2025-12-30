import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, AuditLog } from '../lib/api'
import Card, { CardContent } from '../components/Card'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Modal from '../components/Modal'
import { Eye } from 'lucide-react'
import styles from './AuditLogPage.module.css'

export default function AuditLogPage() {
  const [entityTypeFilter, setEntityTypeFilter] = useState('')
  const [selected, setSelected] = useState<AuditLog | null>(null)
  
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', entityTypeFilter],
    queryFn: () => api.auditLogs.list(entityTypeFilter ? { entityType: entityTypeFilter } : undefined),
  })
  
  const getEntityTypeBadge = (type: string) => {
    const colors: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
      electrician_application: 'info',
      electrician: 'success',
      job: 'warning',
      dispute: 'danger',
      customer: 'info',
      balance: 'success',
      credit: 'success',
      config: 'warning',
      auth: 'default',
    }
    return <Badge variant={colors[type] || 'default'}>{type}</Badge>
  }
  
  const formatTimestamp = (ts: string) => {
    return new Date(ts).toLocaleString()
  }
  
  const columns = [
    {
      key: 'timestamp',
      header: 'Time',
      render: (log: AuditLog) => formatTimestamp(log.timestamp),
    },
    { key: 'adminEmail', header: 'Admin' },
    { key: 'action', header: 'Action' },
    {
      key: 'entityType',
      header: 'Entity Type',
      render: (log: AuditLog) => getEntityTypeBadge(log.entityType),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (log: AuditLog) => (
        <span className={styles.truncate}>{log.reason}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (log: AuditLog) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation()
            setSelected(log)
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
        <h1 className={styles.title}>Audit Log</h1>
        <div className={styles.filters}>
          <select
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="electrician_application">Applications</option>
            <option value="electrician">Electricians</option>
            <option value="job">Jobs</option>
            <option value="dispute">Disputes</option>
            <option value="customer">Customers</option>
            <option value="balance">Balance</option>
            <option value="credit">Credits</option>
            <option value="config">Config</option>
            <option value="auth">Auth</option>
          </select>
        </div>
      </div>
      
      <Card>
        {isLoading ? (
          <CardContent>Loading audit logs...</CardContent>
        ) : (
          <DataTable
            data={logs}
            columns={columns}
            keyExtractor={(log) => log.id}
            onRowClick={setSelected}
            emptyMessage="No audit logs found"
          />
        )}
      </Card>
      
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Audit Log Details"
      >
        {selected && (
          <div className={styles.details}>
            <div className={styles.detailRow}>
              <span>Timestamp:</span>
              <strong>{formatTimestamp(selected.timestamp)}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Admin:</span>
              <strong>{selected.adminEmail}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Action:</span>
              <strong>{selected.action}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Entity Type:</span>
              {getEntityTypeBadge(selected.entityType)}
            </div>
            <div className={styles.detailRow}>
              <span>Entity ID:</span>
              <strong className={styles.mono}>{selected.entityId || '-'}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>IP Address:</span>
              <strong>{selected.ipAddress || '-'}</strong>
            </div>
            <div className={styles.reasonSection}>
              <span>Reason:</span>
              <p>{selected.reason}</p>
            </div>
            {selected.details && Object.keys(selected.details).length > 0 && (
              <div className={styles.detailsSection}>
                <span>Details:</span>
                <pre>{JSON.stringify(selected.details, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
