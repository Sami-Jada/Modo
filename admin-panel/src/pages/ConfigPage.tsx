import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, Config } from '../lib/api'
import Card, { CardContent, CardHeader, CardTitle } from '../components/Card'
import Button from '../components/Button'
import Modal from '../components/Modal'
import { Plus, Edit, History } from 'lucide-react'
import styles from './ConfigPage.module.css'

const DEFAULT_CONFIGS = [
  { key: 'service_fee_percentage', label: 'Service Fee (%)', type: 'number' },
  { key: 'min_job_price', label: 'Minimum Job Price (JOD)', type: 'number' },
  { key: 'max_broadcast_radius_km', label: 'Max Broadcast Radius (km)', type: 'number' },
  { key: 'broadcast_timeout_minutes', label: 'Broadcast Timeout (min)', type: 'number' },
  { key: 'cancellation_fee_percentage', label: 'Cancellation Fee (%)', type: 'number' },
]

export default function ConfigPage() {
  const queryClient = useQueryClient()
  const [editConfig, setEditConfig] = useState<{ key: string; label: string } | null>(null)
  const [historyConfig, setHistoryConfig] = useState<string | null>(null)
  const [value, setValue] = useState('')
  const [reason, setReason] = useState('')
  
  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['configs'],
    queryFn: api.configs.list,
  })
  
  const { data: history = [] } = useQuery({
    queryKey: ['configs', 'history', historyConfig],
    queryFn: () => api.configs.history(historyConfig!),
    enabled: !!historyConfig,
  })
  
  const updateMutation = useMutation({
    mutationFn: ({ key, value, reason }: { key: string; value: unknown; reason: string }) =>
      api.configs.set(key, value, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] })
      closeModal()
    },
  })
  
  const closeModal = () => {
    setEditConfig(null)
    setHistoryConfig(null)
    setValue('')
    setReason('')
  }
  
  const handleUpdate = () => {
    if (!editConfig || !value || !reason.trim()) return
    let parsedValue: unknown = value
    try {
      parsedValue = JSON.parse(value)
    } catch {
      // Keep as string if not valid JSON
    }
    updateMutation.mutate({ key: editConfig.key, value: parsedValue, reason })
  }
  
  const getConfigValue = (key: string) => {
    const config = configs.find((c) => c.key === key)
    return config ? JSON.stringify(config.value) : 'Not set'
  }
  
  const getConfigVersion = (key: string) => {
    const config = configs.find((c) => c.key === key)
    return config ? `v${config.version}` : '-'
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Configuration</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading configs...</p>
          ) : (
            <div className={styles.configList}>
              {DEFAULT_CONFIGS.map((cfg) => (
                <div key={cfg.key} className={styles.configItem}>
                  <div className={styles.configInfo}>
                    <span className={styles.configLabel}>{cfg.label}</span>
                    <span className={styles.configKey}>{cfg.key}</span>
                  </div>
                  <div className={styles.configValue}>
                    <span>{getConfigValue(cfg.key)}</span>
                    <span className={styles.version}>{getConfigVersion(cfg.key)}</span>
                  </div>
                  <div className={styles.configActions}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditConfig(cfg)
                        const current = configs.find((c) => c.key === cfg.key)
                        setValue(current ? JSON.stringify(current.value) : '')
                      }}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setHistoryConfig(cfg.key)}
                    >
                      <History size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Modal
        isOpen={!!editConfig}
        onClose={closeModal}
        title={`Edit ${editConfig?.label || 'Config'}`}
      >
        <div className={styles.editForm}>
          <div className={styles.field}>
            <label>Value</label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter value..."
            />
          </div>
          
          <div className={styles.field}>
            <label>Reason for Change (required)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you making this change?"
              rows={3}
            />
          </div>
          
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!value || !reason.trim() || updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>
      
      <Modal
        isOpen={!!historyConfig}
        onClose={closeModal}
        title="Config History"
      >
        <div className={styles.historyList}>
          {history.length === 0 ? (
            <p className={styles.noHistory}>No history available</p>
          ) : (
            history.map((h) => (
              <div key={h.id} className={styles.historyItem}>
                <div className={styles.historyHeader}>
                  <span className={styles.historyVersion}>v{h.version}</span>
                  <span className={styles.historyDate}>
                    {new Date(h.updatedAt).toLocaleString()}
                  </span>
                </div>
                <div className={styles.historyValue}>
                  Value: <strong>{JSON.stringify(h.value)}</strong>
                </div>
                <div className={styles.historyReason}>
                  Reason: {h.reason}
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  )
}
