import React, { useState, useEffect, useCallback } from 'react'
import {
  Wallet, Plus, Download, Filter, X,
} from 'lucide-react'
import { useProfileStore } from '@/shared/stores'
import { operations, parcels as parcelsApi, type CropOperation, type OperationSummary, type Parcel } from '@/shared/lib/api'
import { useApi } from '@/shared/hooks/useApi'
import FinancialKPIs from './FinancialKPIs'
import FinancialCharts from './FinancialCharts'
import OperationsTable from './OperationsTable'
import OperationForm from './OperationForm'

const OP_TYPE_OPTIONS = [
  { value: '', label: 'ყველა ოპერაცია' },
  { value: 'plowing', label: 'ხნულობა' },
  { value: 'planting', label: 'დარგვა' },
  { value: 'sowing', label: 'თესვა' },
  { value: 'fertilizing', label: 'სასუქი' },
  { value: 'pesticide_application', label: 'პესტიციდი' },
  { value: 'irrigation', label: 'მორწყვა' },
  { value: 'harvesting', label: 'მკა' },
  { value: 'cultivation', label: 'კულტივაცია' },
  { value: 'drone_spraying', label: 'დრონით შესხურება' },
  { value: 'soil_sampling', label: 'ნიადაგის ნიმუში' },
  { value: 'pruning', label: 'ჭრა-ჩეხა' },
  { value: 'other', label: 'სხვა' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'ყველა სტატუსი' },
  { value: 'planned', label: 'დაგეგმილი' },
  { value: 'completed', label: 'შესრულებული' },
  { value: 'cancelled', label: 'გაუქმებული' },
]

export default function FinancesDashboard(): React.ReactElement {
  const { activeProfile } = useProfileStore()
  const profileId = activeProfile?.id

  const [operationsList, setOperationsList] = useState<CropOperation[]>([])
  const [summary, setSummary] = useState<OperationSummary | null>(null)
  const [allParcels, setAllParcels] = useState<Parcel[]>([])
  const [loading, setLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(true)

  const [filters, setFilters] = useState({
    crop_type: '',
    operation_type: '',
    status: '',
    parcel_id: '',
    date_from: '',
    date_to: '',
  })

  const [showForm, setShowForm] = useState(false)
  const [editingOp, setEditingOp] = useState<CropOperation | null>(null)

  const { data: parcelsData } = useApi(() => parcelsApi.list(1, 200, undefined, profileId), [profileId])

  useEffect(() => {
    if (parcelsData?.items) setAllParcels(parcelsData.items)
  }, [parcelsData])

  const fetchOperations = useCallback(async () => {
    setLoading(true)
    try {
      const data = await operations.list({ ...filters, page: 1, per_page: 200 })
      setOperationsList(data.items)
    } catch (e) {
      console.error('Failed to load operations:', e)
    } finally {
      setLoading(false)
    }
  }, [filters])

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true)
    try {
      const data = await operations.summary(filters)
      setSummary(data)
    } catch (e) {
      console.error('Failed to load summary:', e)
    } finally {
      setSummaryLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchOperations()
    fetchSummary()
  }, [fetchOperations, fetchSummary])

  const handleExport = () => {
    const url = operations.exportExcel(filters)
    const token = localStorage.getItem('token')
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `operations_${new Date().toISOString().slice(0, 10)}.xlsx`
        link.click()
        URL.revokeObjectURL(link.href)
      })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ნამდვილად გსურთ ოპერაციის წაშლა?')) return
    try {
      await operations.delete(id)
      fetchOperations()
      fetchSummary()
    } catch (e) {
      alert('წაშლა ვერ მოხერხდა')
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingOp(null)
    fetchOperations()
    fetchSummary()
  }

  const cropTypes = Array.from(new Set(allParcels.map((p) => p.crop_type).filter(Boolean)))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sensor via-sensor to-accent shadow-glow-blue">
            <Wallet className="h-6 w-6 text-base-primary" />
            <div className="absolute inset-0 rounded-xl border border-sensor/30 animate-pulse-slow" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary font-display tracking-tight">ფინანსები</h1>
            <p className="text-text-secondary mt-0.5 text-sm">კულტურების საოპერაციო ხარჯების მართვა და ანალიზი</p>
          </div>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={handleExport}
            className="btn-outline flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Excel</span>
          </button>
          <button
            onClick={() => { setEditingOp(null); setShowForm(true) }}
            className="btn-blue flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>ოპერაცია</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card-flat rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-text-muted">
            <Filter className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider font-display">ფილტრები</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <select
            value={filters.crop_type}
            onChange={(e) => setFilters((f) => ({ ...f, crop_type: e.target.value }))}
            className="select text-sm py-1.5"
          >
            <option value="">ყველა კულტურა</option>
            {cropTypes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filters.operation_type}
            onChange={(e) => setFilters((f) => ({ ...f, operation_type: e.target.value }))}
            className="select text-sm py-1.5"
          >
            {OP_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="select text-sm py-1.5"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            value={filters.parcel_id}
            onChange={(e) => setFilters((f) => ({ ...f, parcel_id: e.target.value }))}
            className="select text-sm py-1.5"
          >
            <option value="">ყველა ნაკვეთი</option>
            {allParcels.map((p) => (
              <option key={p.id} value={p.id}>{p.parcel_nr || p.parcel_nr}</option>
            ))}
          </select>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
            className="input text-sm py-1.5"
          />
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
            className="input text-sm py-1.5"
          />
          <button
            onClick={() => setFilters({ crop_type: '', operation_type: '', status: '', parcel_id: '', date_from: '', date_to: '' })}
            className="btn-ghost btn-icon-sm text-text-muted hover:text-danger"
            title="ფილტრების გასუფთავება"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <FinancialKPIs summary={summary} loading={summaryLoading} />

      {/* Charts */}
      {summary && !summaryLoading && (
        <FinancialCharts summary={summary} operations={operationsList} />
      )}

      {/* Operations Table */}
      <OperationsTable
        operations={operationsList}
        loading={loading}
        parcels={allParcels}
        onEdit={(op) => { setEditingOp(op); setShowForm(true) }}
        onDelete={handleDelete}
      />

      {/* Form Modal */}
      <OperationForm
        open={showForm}
        operation={editingOp}
        parcels={allParcels}
        onClose={() => { setShowForm(false); setEditingOp(null) }}
        onSaved={handleFormSuccess}
      />
    </div>
  )
}
