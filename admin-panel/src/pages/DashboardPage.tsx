import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import Card, { CardContent, CardHeader, CardTitle } from '../components/Card'
import {
  Users,
  Zap,
  Briefcase,
  AlertTriangle,
  DollarSign,
  Star,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import styles from './DashboardPage.module.css'

export default function DashboardPage() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: api.metrics.get,
  })
  
  if (isLoading) {
    return <div className={styles.loading}>Loading dashboard...</div>
  }
  
  const stats = [
    {
      label: 'Pending Applications',
      value: metrics?.pendingApplications ?? 0,
      icon: Users,
      color: 'warning',
    },
    {
      label: 'Active Electricians',
      value: metrics?.activeElectricians ?? 0,
      icon: Zap,
      color: 'success',
    },
    {
      label: 'Total Jobs',
      value: metrics?.totalJobs ?? 0,
      icon: Briefcase,
      color: 'info',
    },
    {
      label: 'Open Disputes',
      value: metrics?.openDisputes ?? 0,
      icon: AlertTriangle,
      color: 'danger',
    },
    {
      label: 'Total Revenue',
      value: `${(metrics?.totalRevenue ?? 0).toFixed(2)} JOD`,
      icon: DollarSign,
      color: 'success',
    },
    {
      label: 'Avg Rating',
      value: (metrics?.averageRating ?? 0).toFixed(1),
      icon: Star,
      color: 'warning',
    },
    {
      label: 'Completed Jobs',
      value: metrics?.completedJobs ?? 0,
      icon: CheckCircle,
      color: 'success',
    },
    {
      label: 'Cancelled Jobs',
      value: metrics?.cancelledJobs ?? 0,
      icon: XCircle,
      color: 'danger',
    },
  ]
  
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Dashboard</h1>
      
      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className={styles.statCard}>
              <div className={`${styles.iconWrapper} ${styles[stat.color]}`}>
                <stat.icon size={24} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className={styles.summarySection}>
        <Card>
          <CardHeader>
            <CardTitle>Quick Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Total Electricians</span>
                <span className={styles.summaryValue}>{metrics?.totalElectricians ?? 0}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Avg Job Value</span>
                <span className={styles.summaryValue}>{(metrics?.averageJobValue ?? 0).toFixed(2)} JOD</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Completion Rate</span>
                <span className={styles.summaryValue}>
                  {metrics?.totalJobs
                    ? ((metrics.completedJobs / metrics.totalJobs) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
