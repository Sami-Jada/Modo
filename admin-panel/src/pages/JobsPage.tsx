import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, Job, JobEvent } from '../lib/api'
import Card, { CardContent } from '../components/Card'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Modal from '../components/Modal'
import { Eye, Clock } from 'lucide-react'
import styles from './JobsPage.module.css'

export default function JobsPage() {
  const [filter, setFilter] = useState<string>('')
  const [selected, setSelected] = useState<Job | null>(null)
  
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs', filter],
    queryFn: () => api.jobs.list(filter ? { status: filter } : undefined),
  })
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CREATED':
      case 'BROADCAST':
        return <Badge variant="info">{status}</Badge>
      case 'ACCEPTED':
      case 'EN_ROUTE':
      case 'ARRIVED':
      case 'IN_PROGRESS':
        return <Badge variant="warning">{status}</Badge>
      case 'COMPLETED':
      case 'SETTLED':
        return <Badge variant="success">{status}</Badge>
      case 'CANCELLED':
        return <Badge variant="danger">{status}</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }
  
  const formatTimestamp = (ts: string) => {
    const date = new Date(ts)
    return date.toLocaleString()
  }
  
  const columns = [
    {
      key: 'customerName',
      header: 'Customer',
    },
    {
      key: 'serviceType',
      header: 'Service',
    },
    {
      key: 'electricianName',
      header: 'Electrician',
      render: (job: Job) => job.electricianName || '-',
    },
    {
      key: 'quotedPrice',
      header: 'Price',
      render: (job: Job) => `${job.quotedPrice.toFixed(2)} JOD`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (job: Job) => getStatusBadge(job.status),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (job: Job) => new Date(job.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (job: Job) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation()
            setSelected(job)
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
        <h1 className={styles.title}>Jobs</h1>
        <div className={styles.filters}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All</option>
            <option value="CREATED">Created</option>
            <option value="BROADCAST">Broadcast</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="EN_ROUTE">En Route</option>
            <option value="ARRIVED">Arrived</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="SETTLED">Settled</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>
      
      <Card>
        {isLoading ? (
          <CardContent>Loading jobs...</CardContent>
        ) : (
          <DataTable
            data={jobs}
            columns={columns}
            keyExtractor={(job) => job.id}
            onRowClick={setSelected}
            emptyMessage="No jobs found"
          />
        )}
      </Card>
      
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Job Details"
      >
        {selected && (
          <div className={styles.details}>
            <div className={styles.detailSection}>
              <h4>Customer</h4>
              <div className={styles.detailRow}>
                <span>Name:</span>
                <strong>{selected.customerName}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Phone:</span>
                <strong>{selected.customerPhone}</strong>
              </div>
            </div>
            
            <div className={styles.detailSection}>
              <h4>Job Info</h4>
              <div className={styles.detailRow}>
                <span>Service:</span>
                <strong>{selected.serviceType}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Description:</span>
                <strong>{selected.description}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Address:</span>
                <strong>{selected.address}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Quoted Price:</span>
                <strong>{selected.quotedPrice.toFixed(2)} JOD</strong>
              </div>
              {selected.finalPrice && (
                <div className={styles.detailRow}>
                  <span>Final Price:</span>
                  <strong>{selected.finalPrice.toFixed(2)} JOD</strong>
                </div>
              )}
              <div className={styles.detailRow}>
                <span>Status:</span>
                {getStatusBadge(selected.status)}
              </div>
            </div>
            
            {selected.electricianName && (
              <div className={styles.detailSection}>
                <h4>Electrician</h4>
                <div className={styles.detailRow}>
                  <span>Name:</span>
                  <strong>{selected.electricianName}</strong>
                </div>
              </div>
            )}
            
            <div className={styles.timeline}>
              <h4><Clock size={16} /> Timeline</h4>
              {selected.timeline.map((event: JobEvent) => (
                <div key={event.id} className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineContent}>
                    <span className={styles.timelineStatus}>{event.status}</span>
                    <span className={styles.timelineTime}>{formatTimestamp(event.timestamp)}</span>
                    <span className={styles.timelineActor}>{event.actorType}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
