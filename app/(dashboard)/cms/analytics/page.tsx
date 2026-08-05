'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Users, Eye, MessageCircle, TrendingUp, Award,
  ChevronDown, ChevronUp, X, Calendar, ExternalLink,
  BarChart2, Globe, ArrowLeft
} from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'

/* ────────────────────────────────────────────────────────── */
/* Types                                                       */
/* ────────────────────────────────────────────────────────── */
interface SalespersonRow {
  id: number
  name: string
  slug: string
  totalVisits: number
  uniqueVisitors: number
  whatsappClicks: number
  conversionRate: number
}

interface SourceRow { source: string; count: number }

interface OverallData {
  totalVisits: number
  uniqueVisitors: number
  whatsappClicks: number
  topSalesperson: { id: number; name: string; visits: number } | null
  topSource: string | null
  bySource: SourceRow[]
  bySalesperson: SalespersonRow[]
}

interface DetailData {
  salesperson: { id: number; name: string; slug: string; email: string; phone: string }
  totalVisits: number
  uniqueVisitors: number
  whatsappClicks: number
  conversionRate: number
  bySource: SourceRow[]
  recentEvents: { eventType: string; utmSource: string | null; utmCampaign: string | null; createdAt: string }[]
}

/* ────────────────────────────────────────────────────────── */
/* Date preset helpers                                         */
/* ────────────────────────────────────────────────────────── */
type Preset = 'today' | '7d' | '30d' | 'custom'

function presetDates(preset: Preset, custom: { from: string; to: string }) {
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  switch (preset) {
    case 'today': { const t = fmt(today); return { from: t, to: t } }
    case '7d':  { const f = new Date(today); f.setDate(f.getDate() - 6);  return { from: fmt(f), to: fmt(today) } }
    case '30d': { const f = new Date(today); f.setDate(f.getDate() - 29); return { from: fmt(f), to: fmt(today) } }
    case 'custom': return custom
  }
}

/* ────────────────────────────────────────────────────────── */
/* Source label formatter                                      */
/* ────────────────────────────────────────────────────────── */
function sourceLabel(src: string) {
  const map: Record<string, string> = {
    direct: 'Direct',
    linkedin: 'LinkedIn',
    whatsapp: 'WhatsApp',
    facebook: 'Facebook',
    instagram: 'Instagram',
    twitter: 'Twitter / X',
    meta: 'Meta',
    google: 'Google',
    tiktok: 'TikTok',
    email: 'Email',
  }
  return map[src.toLowerCase()] ?? src.charAt(0).toUpperCase() + src.slice(1)
}

/* ────────────────────────────────────────────────────────── */
/* Component                                                   */
/* ────────────────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const { hasPermission, isLoading: permissionsLoading } = usePermissions()
  const [preset, setPreset]       = useState<Preset>('30d')
  const [custom, setCustom]       = useState({ from: '', to: '' })
  const [data, setData]           = useState<OverallData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [detail, setDetail]       = useState<DetailData | null>(null)
  const [detailLoading, setDL]    = useState(false)
  const [sortCol, setSortCol]     = useState<keyof SalespersonRow>('totalVisits')
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('desc')

  const dates = presetDates(preset, custom)

  const fetchOverall = useCallback(async () => {
    if (permissionsLoading) return
    if (!hasPermission('Analytics', 'VIEW')) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const q = new URLSearchParams({ from: dates.from, to: dates.to })
      const res = await fetch(`/api/analytics/referrals?${q}`)
      if (res.ok) {
        setData(await res.json())
      } else {
        setData(null)
      }
    } catch (e) {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [dates.from, dates.to, permissionsLoading, hasPermission])

  useEffect(() => { fetchOverall() }, [fetchOverall])


  const openDetail = async (id: number) => {
    setDL(true)
    try {
      const q = new URLSearchParams({ from: dates.from, to: dates.to })
      const res = await fetch(`/api/analytics/referrals/${id}?${q}`)
      if (res.ok) setDetail(await res.json())
    } finally {
      setDL(false)
    }
  }

  const sorted = data?.bySalesperson
    ? [...data.bySalesperson].sort((a, b) => {
        const av = a[sortCol] as number
        const bv = b[sortCol] as number
        return sortDir === 'desc' ? bv - av : av - bv
      })
    : []

  const toggleSort = (col: keyof SalespersonRow) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  const SortIcon = ({ col }: { col: keyof SalespersonRow }) =>
    sortCol === col
      ? (sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)
      : null

  const totalVisitsAll = data?.bySalesperson.reduce((s, r) => s + r.totalVisits, 0) ?? 1

  /* ────────────────────────────────── */
  /* Detail Panel                        */
  /* ────────────────────────────────── */
  if (detail) {
    return (
      <div className="analytics-page">
        <style>{analyticsCSS}</style>

        <div className="analytics-header">
          <button className="back-btn" onClick={() => setDetail(null)}>
            <ArrowLeft size={16} /> Back to Overview
          </button>
          <div>
            <h1 className="analytics-title">{detail.salesperson.name}</h1>
            <p className="analytics-sub">
              Referral link: <code>/iigprojects/ref/{detail.salesperson.slug}</code>
            </p>
          </div>
        </div>

        <div className="stat-cards">
          <StatCard icon={<Eye size={20}/>}            label="Total Visits"      value={detail.totalVisits}    />
          <StatCard icon={<Users size={20}/>}          label="Unique Visitors"   value={detail.uniqueVisitors} />
          <StatCard icon={<MessageCircle size={20}/>}  label="WhatsApp Clicks"   value={detail.whatsappClicks} />
          <StatCard icon={<TrendingUp size={20}/>}     label="Conversion Rate"   value={`${detail.conversionRate}%`} accent />
        </div>

        <div className="analytics-grid-2">
          <div className="analytics-card">
            <h2 className="card-title"><Globe size={16}/> Traffic Sources</h2>
            {detail.bySource.length === 0
              ? <p className="empty-msg">No source data yet.</p>
              : detail.bySource.map(s => (
                  <SourceBar key={s.source} source={s.source} count={s.count}
                    total={detail.totalVisits} />
                ))}
          </div>

          <div className="analytics-card">
            <h2 className="card-title"><BarChart2 size={16}/> Recent Events</h2>
            <div className="events-list">
              {detail.recentEvents.length === 0
                ? <p className="empty-msg">No events yet.</p>
                : detail.recentEvents.slice(0, 20).map((ev, i) => (
                    <div key={i} className={`event-row ${ev.eventType === 'WHATSAPP_CLICK' ? 'ev-click' : 'ev-visit'}`}>
                      <span className="ev-badge">{ev.eventType === 'WHATSAPP_CLICK' ? '💬' : '👁'}</span>
                      <div className="ev-info">
                        <span className="ev-type">{ev.eventType === 'WHATSAPP_CLICK' ? 'WhatsApp Click' : 'Page Visit'}</span>
                        {ev.utmSource && <span className="ev-src">via {sourceLabel(ev.utmSource)}</span>}
                        {ev.utmCampaign && <span className="ev-campaign">· {ev.utmCampaign}</span>}
                      </div>
                      <span className="ev-time">{new Date(ev.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ────────────────────────────────── */
  /* Main Overview                       */
  /* ────────────────────────────────── */
  return (
    <div className="analytics-page">
      <style>{analyticsCSS}</style>

      <div className="analytics-header">
        <div>
          <h1 className="analytics-title">Referral Analytics</h1>
          <p className="analytics-sub">Track salesperson referral performance</p>
        </div>

        {/* Date filters */}
        <div className="date-filters">
          {(['today', '7d', '30d', 'custom'] as Preset[]).map(p => (
            <button
              key={p}
              className={`preset-btn ${preset === p ? 'active' : ''}`}
              onClick={() => setPreset(p)}
            >
              {p === 'today' ? 'Today' : p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : 'Custom'}
            </button>
          ))}
          {preset === 'custom' && (
            <div className="custom-dates">
              <input type="date" value={custom.from} onChange={e => setCustom(c => ({ ...c, from: e.target.value }))} className="date-input" />
              <span>–</span>
              <input type="date" value={custom.to}   onChange={e => setCustom(c => ({ ...c, to:   e.target.value }))} className="date-input" />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading analytics…</div>
      ) : !data ? (
        <div className="loading-state">Failed to load data.</div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="stat-cards">
            <StatCard icon={<Eye size={20}/>}           label="Total Visits"      value={data.totalVisits}    />
            <StatCard icon={<Users size={20}/>}         label="Unique Visitors"   value={data.uniqueVisitors} />
            <StatCard icon={<MessageCircle size={20}/>} label="WhatsApp Clicks"   value={data.whatsappClicks} />
            <StatCard icon={<Award size={20}/>}         label="Top Salesperson"
              value={data.topSalesperson?.name ?? '—'} accent />
          </div>

          <div className="analytics-grid-2">
            {/* Source breakdown */}
            <div className="analytics-card">
              <h2 className="card-title"><Globe size={16}/> Top Traffic Sources</h2>
              {data.bySource.length === 0
                ? <p className="empty-msg">No traffic data yet.</p>
                : data.bySource.slice(0, 8).map(s => (
                    <SourceBar key={s.source} source={s.source} count={s.count}
                      total={data.totalVisits} />
                  ))}
            </div>

            {/* Quick top performers */}
            <div className="analytics-card">
              <h2 className="card-title"><TrendingUp size={16}/> Top Performers</h2>
              {sorted.slice(0, 5).map((sp, i) => (
                <div key={sp.id} className="top-row">
                  <span className="top-rank">#{i + 1}</span>
                  <span className="top-name">{sp.name}</span>
                  <span className="top-stat">{sp.totalVisits} visits</span>
                  <button className="view-btn-sm" onClick={() => openDetail(sp.id)}>
                    <ExternalLink size={12}/>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Full salesperson table */}
          <div className="analytics-card mt-4">
            <h2 className="card-title"><BarChart2 size={16}/> Salesperson Breakdown</h2>
            <div className="table-wrap">
              <table className="sp-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th className="th-sort" onClick={() => toggleSort('totalVisits')}>
                      Total Visits <SortIcon col="totalVisits"/>
                    </th>
                    <th className="th-sort" onClick={() => toggleSort('uniqueVisitors')}>
                      Unique <SortIcon col="uniqueVisitors"/>
                    </th>
                    <th className="th-sort" onClick={() => toggleSort('whatsappClicks')}>
                      WA Clicks <SortIcon col="whatsappClicks"/>
                    </th>
                    <th className="th-sort" onClick={() => toggleSort('conversionRate')}>
                      Conv. % <SortIcon col="conversionRate"/>
                    </th>
                    <th>Share</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 ? (
                    <tr><td colSpan={7} className="empty-msg" style={{ padding: '2rem', textAlign: 'center' }}>
                      No data in this period.
                    </td></tr>
                  ) : sorted.map(sp => (
                    <tr key={sp.id} className="sp-row">
                      <td>
                        <div className="sp-name">{sp.name}</div>
                        <div className="sp-slug">/ref/{sp.slug}</div>
                      </td>
                      <td className="td-num">{sp.totalVisits.toLocaleString()}</td>
                      <td className="td-num">{sp.uniqueVisitors.toLocaleString()}</td>
                      <td className="td-num">{sp.whatsappClicks.toLocaleString()}</td>
                      <td className="td-num">
                        <span className={`rate-badge ${sp.conversionRate >= 20 ? 'rate-good' : sp.conversionRate >= 10 ? 'rate-mid' : 'rate-low'}`}>
                          {sp.conversionRate}%
                        </span>
                      </td>
                      <td>
                        <div className="share-bar-wrap">
                          <div className="share-bar" style={{ width: `${Math.round((sp.totalVisits / totalVisitsAll) * 100)}%` }}/>
                          <span className="share-pct">{Math.round((sp.totalVisits / totalVisitsAll) * 100)}%</span>
                        </div>
                      </td>
                      <td>
                        <button className="view-btn" onClick={() => openDetail(sp.id)}>
                          {detailLoading ? '…' : 'Detail'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────────────── */
/* Sub-components                                              */
/* ────────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, accent }: {
  icon: React.ReactNode; label: string; value: string | number; accent?: boolean
}) {
  return (
    <div className={`stat-card ${accent ? 'stat-accent' : ''}`}>
      <div className="stat-icon">{icon}</div>
      <div>
        <div className="stat-value">{typeof value === 'number' ? value.toLocaleString() : value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  )
}

function SourceBar({ source, count, total }: { source: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="source-row">
      <span className="source-name">{sourceLabel(source)}</span>
      <div className="source-track">
        <div className="source-fill" style={{ width: `${pct}%` }}/>
      </div>
      <span className="source-count">{count.toLocaleString()}</span>
      <span className="source-pct">{pct}%</span>
    </div>
  )
}

/* ────────────────────────────────────────────────────────── */
/* Styles                                                      */
/* ────────────────────────────────────────────────────────── */
const analyticsCSS = `
.analytics-page { padding: 2rem; max-width: 1400px; color: #111827; }
.analytics-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1.5rem; flex-wrap: wrap; margin-bottom: 2rem; }
.analytics-title { font-size: 1.75rem; font-weight: 700; color: #111827; margin: 0 0 0.25rem; }
.analytics-sub { color: #6b7280; font-size: 0.875rem; margin: 0; }
.back-btn { display: flex; align-items: center; gap: 0.4rem; background: #ffffff; border: 1px solid #d1d5db; color: #374151; border-radius: 8px; padding: 0.5rem 1rem; cursor: pointer; font-size: 0.875rem; margin-bottom: 0.5rem; transition: all 0.2s; }
.back-btn:hover { background: #f9fafb; border-color: #9ca3af; }

/* Date filters */
.date-filters { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.preset-btn { padding: 0.4rem 0.9rem; border-radius: 8px; border: 1px solid #d1d5db; background: #ffffff; color: #374151; cursor: pointer; font-size: 0.8125rem; transition: all 0.2s; font-weight: 500; }
.preset-btn:hover { border-color: #6366f1; color: #6366f1; }
.preset-btn.active { background: #6366f1; border-color: #6366f1; color: #ffffff; }
.custom-dates { display: flex; align-items: center; gap: 0.5rem; }
.date-input { background: #ffffff; border: 1px solid #d1d5db; color: #111827; border-radius: 8px; padding: 0.35rem 0.6rem; font-size: 0.8125rem; }

/* Stat cards */
.stat-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
.stat-card { display: flex; align-items: center; gap: 1rem; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.25rem 1.5rem; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05); }
.stat-accent { border-color: rgba(99, 102, 241, 0.4); background: linear-gradient(135deg, rgba(99,102,241,0.05) 0%, #ffffff 100%); }
.stat-icon { color: #6366f1; flex-shrink: 0; }
.stat-value { font-size: 1.5rem; font-weight: 700; color: #111827; line-height: 1.2; }
.stat-label { font-size: 0.8125rem; color: #6b7280; margin-top: 0.125rem; }

/* 2-col grid */
.analytics-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
@media (max-width: 768px) { .analytics-grid-2 { grid-template-columns: 1fr; } }

/* Cards */
.analytics-card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.5rem; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05); }
.mt-4 { margin-top: 1.5rem; }
.card-title { display: flex; align-items: center; gap: 0.5rem; font-size: 1rem; font-weight: 600; margin: 0 0 1.25rem; color: #111827; }

/* Source bars */
.source-row { display: grid; grid-template-columns: 120px 1fr 60px 44px; align-items: center; gap: 0.75rem; margin-bottom: 0.6rem; font-size: 0.8125rem; }
.source-name { color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.source-track { height: 6px; background: #f3f4f6; border-radius: 3px; overflow: hidden; }
.source-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #8b5cf6); border-radius: 3px; transition: width 0.6s ease; }
.source-count { text-align: right; color: #111827; font-weight: 500; }
.source-pct { color: #6b7280; }

/* Top performers */
.top-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0; border-bottom: 1px solid #e5e7eb; font-size: 0.875rem; }
.top-row:last-child { border-bottom: none; }
.top-rank { color: #6366f1; font-weight: 700; width: 28px; flex-shrink: 0; }
.top-name { flex: 1; font-weight: 500; color: #374151; }
.top-stat { color: #6b7280; font-size: 0.8125rem; }
.view-btn-sm { background: none; border: none; color: #6366f1; cursor: pointer; padding: 0.2rem; border-radius: 4px; display: flex; align-items: center; }
.view-btn-sm:hover { background: rgba(99,102,241,0.1); }

/* Main table */
.table-wrap { overflow-x: auto; }
.sp-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.sp-table th { text-align: left; padding: 0.6rem 0.75rem; font-size: 0.75rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb; white-space: nowrap; }
.th-sort { cursor: pointer; user-select: none; }
.th-sort:hover { color: #111827; }
.sp-row { border-bottom: 1px solid #f3f4f6; transition: background 0.15s; }
.sp-row:hover { background: #f9fafb; }
.sp-row td { padding: 0.75rem; vertical-align: middle; color: #374151; }
.sp-name { font-weight: 500; color: #111827; }
.sp-slug { font-size: 0.75rem; color: #6b7280; }
.td-num { text-align: right; font-variant-numeric: tabular-nums; }
.rate-badge { padding: 0.2rem 0.5rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
.rate-good { background: rgba(16,185,129,0.1); color: #059669; }
.rate-mid  { background: rgba(245,158,11,0.1); color: #d97706; }
.rate-low  { background: rgba(239,68,68,0.08);   color: #dc2626; }
.share-bar-wrap { display: flex; align-items: center; gap: 0.5rem; min-width: 100px; }
.share-bar { height: 6px; background: linear-gradient(90deg, #6366f1, #8b5cf6); border-radius: 3px; min-width: 2px; transition: width 0.4s; }
.share-pct { font-size: 0.75rem; color: #6b7280; white-space: nowrap; }
.view-btn { padding: 0.35rem 0.75rem; background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2); color: #6366f1; border-radius: 6px; cursor: pointer; font-size: 0.8125rem; transition: all 0.15s; white-space: nowrap; font-weight: 500; }
.view-btn:hover { background: #6366f1; color: #ffffff; border-color: #6366f1; }

/* Events list */
.events-list { max-height: 360px; overflow-y: auto; }
.event-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem; border-radius: 8px; margin-bottom: 0.35rem; font-size: 0.8125rem; }
.ev-visit { background: rgba(99,102,241,0.05); color: #374151; }
.ev-click { background: rgba(16,185,129,0.05); color: #065f46; }
.ev-badge { font-size: 1rem; flex-shrink: 0; }
.ev-info { flex: 1; display: flex; gap: 0.35rem; flex-wrap: wrap; }
.ev-type { font-weight: 500; color: #111827; }
.ev-src { color: #4b5563; }
.ev-campaign { color: #6b7280; }
.ev-time { color: #6b7280; white-space: nowrap; }

.loading-state { text-align: center; padding: 4rem; color: #6b7280; }
.empty-msg { color: #6b7280; font-size: 0.875rem; text-align: center; padding: 1.5rem 0; margin: 0; }
`
