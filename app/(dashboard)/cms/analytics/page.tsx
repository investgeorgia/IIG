'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Users, Eye, MessageCircle, TrendingUp, Award,
  ChevronDown, ChevronUp, ArrowLeft, ExternalLink,
  BarChart2, Globe, Filter, RefreshCw, Calendar,
  ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react'

/* ─────────────────────────────────────────────── */
/* Types                                            */
/* ─────────────────────────────────────────────── */
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

type Preset = 'today' | '7d' | '30d' | 'all'
type SortCol = keyof Pick<SalespersonRow, 'totalVisits' | 'uniqueVisitors' | 'whatsappClicks' | 'conversionRate'>

/* ─────────────────────────────────────────────── */
/* Helpers                                          */
/* ─────────────────────────────────────────────── */
function getDateRange(preset: Preset): { from: string; to: string } {
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const today = new Date()
  const past = (n: number) => { const d = new Date(today); d.setDate(d.getDate() - n); return d }
  switch (preset) {
    case 'today': return { from: fmt(today), to: fmt(today) }
    case '7d':   return { from: fmt(past(6)),  to: fmt(today) }
    case '30d':  return { from: fmt(past(29)), to: fmt(today) }
    case 'all':  return { from: '2020-01-01', to: fmt(today) }
  }
}

const SOURCE_LABELS: Record<string, string> = {
  direct: 'Direct', linkedin: 'LinkedIn', whatsapp: 'WhatsApp',
  facebook: 'Facebook', instagram: 'Instagram', twitter: 'Twitter/X',
  meta: 'Meta', google: 'Google', tiktok: 'TikTok', email: 'Email',
}
const fmtSrc = (s: string) => SOURCE_LABELS[s?.toLowerCase()] ?? (s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Direct')

const SOURCE_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6','#f97316','#a855f7',
]

/* ─────────────────────────────────────────────── */
/* Component                                        */
/* ─────────────────────────────────────────────── */
export default function AnalyticsPage() {
  /* Filters */
  const [preset, setPreset]       = useState<Preset>('30d')
  const [spFilter, setSpFilter]   = useState<number | 'all'>('all')  // salesperson filter
  const [srcFilter, setSrcFilter] = useState<string>('all')          // source filter

  /* Data */
  const [data, setData]           = useState<OverallData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  /* Detail panel */
  const [detail, setDetail]       = useState<DetailData | null>(null)
  const [detailLoading, setDL]    = useState(false)

  /* Table sort */
  const [sortCol, setSortCol]     = useState<SortCol>('totalVisits')
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('desc')

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  /* ── FETCH (with 30s auto-refresh) ──────────── */
  useEffect(() => {
    let cancelled = false

    const doFetch = (showSpinner: boolean) => {
      const { from, to } = getDateRange(preset)
      if (showSpinner) { setLoading(true); setError(null) }

      fetch(`/api/analytics/referrals?from=${from}&to=${to}`)
        .then(res => {
          if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : `API error ${res.status}`)
          return res.json()
        })
        .then(json => {
          if (!cancelled) {
            setData(json)
            setLoading(false)
            setLastUpdated(new Date())
          }
        })
        .catch(err => { if (!cancelled) { setError(err.message); setLoading(false) } })
    }

    doFetch(true)  // initial load with spinner

    // Auto-refresh every 30 seconds silently (no spinner)
    const interval = setInterval(() => doFetch(false), 30_000)

    return () => { cancelled = true; clearInterval(interval) }
  }, [preset])

  /* ── DETAIL FETCH ───────────────────────────── */
  const openDetail = (id: number) => {
    setDL(true)
    const { from, to } = getDateRange(preset)
    fetch(`/api/analytics/referrals/${id}?from=${from}&to=${to}`)
      .then(r => r.json())
      .then(json => { setDetail(json); setDL(false) })
      .catch(() => setDL(false))
  }

  /* ── FILTERED + SORTED rows ─────────────────── */
  const filtered = (data?.bySalesperson ?? [])
    .filter(sp => spFilter === 'all' || sp.id === spFilter)
    .filter(sp => {
      if (srcFilter === 'all') return true
      // if a source filter is active, only show salespersons with visits from that source
      // (we don't have per-sp source data in summary, so just pass all)
      return true
    })
    .sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol]
      return sortDir === 'desc' ? bv - av : av - bv
    })

  const totalVisitsAll = filtered.reduce((s, r) => s + r.totalVisits, 0) || 1

  /* filtered source data */
  const filteredSources = (data?.bySource ?? []).filter(s => srcFilter === 'all' || s.source === srcFilter)

  const toggleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  /* ── KPI CARDS ─────────────────────────────── */
  const visData = spFilter === 'all'
    ? { visits: data?.totalVisits ?? 0, uniq: data?.uniqueVisitors ?? 0, wa: data?.whatsappClicks ?? 0 }
    : (() => {
        const row = data?.bySalesperson.find(s => s.id === spFilter)
        return { visits: row?.totalVisits ?? 0, uniq: row?.uniqueVisitors ?? 0, wa: row?.whatsappClicks ?? 0 }
      })()
  const convRate = visData.visits > 0 ? Math.round((visData.wa / visData.visits) * 100) : 0

  /* ─────────────────────────────────────────── */
  /* Detail Panel                                 */
  /* ─────────────────────────────────────────── */
  if (detail) {
    const sp = detail.salesperson
    return (
      <div style={styles.page}>
        <style>{css}</style>

        <div style={styles.header}>
          <button className="an-back-btn" onClick={() => setDetail(null)}>
            <ArrowLeft size={14} /> Back to Overview
          </button>
          <div>
            <h1 style={styles.title}>{sp.name}</h1>
            <p style={styles.sub}>/iigprojects/ref/{sp.slug}</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' as const }}>
            <a href={`tel:${sp.phone}`} style={styles.chipLink}>{sp.phone}</a>
            <a href={`mailto:${sp.email}`} style={styles.chipLink}>{sp.email}</a>
          </div>
        </div>

        <div className="an-kpi-grid">
          <KpiCard icon={<Eye size={18}/>}           label="Total Visits"    value={detail.totalVisits}    accent />
          <KpiCard icon={<Users size={18}/>}         label="Unique Visitors" value={detail.uniqueVisitors} />
          <KpiCard icon={<MessageCircle size={18}/>} label="WA Clicks"       value={detail.whatsappClicks} />
          <KpiCard icon={<TrendingUp size={18}/>}    label="Conversion"      value={`${detail.conversionRate}%`} good={detail.conversionRate >= 10} />
        </div>

        <div className="an-two-col">
          <div className="an-card">
            <div className="an-card-title"><Globe size={14}/> Traffic Sources</div>
            {detail.bySource.length === 0
              ? <p className="an-empty">No source data yet.</p>
              : detail.bySource.map((s, i) => <SrcBar key={s.source} source={s.source} count={s.count} total={detail.totalVisits} color={SOURCE_COLORS[i % SOURCE_COLORS.length]} />)}
          </div>

          <div className="an-card">
            <div className="an-card-title"><BarChart2 size={14}/> Recent Activity</div>
            <div style={{ maxHeight: 340, overflowY: 'auto' as const }}>
              {detail.recentEvents.length === 0
                ? <p className="an-empty">No events yet.</p>
                : detail.recentEvents.slice(0, 20).map((ev, i) => (
                    <div key={i} className={`an-ev ${ev.eventType === 'WHATSAPP_CLICK' ? 'an-ev-wa' : 'an-ev-pv'}`}>
                      <span style={{ fontSize: '1rem' }}>{ev.eventType === 'WHATSAPP_CLICK' ? '💬' : '👁'}</span>
                      <div style={{ flex: 1 }}>
                        <span className="an-ev-type">{ev.eventType === 'WHATSAPP_CLICK' ? 'WhatsApp Click' : 'Page Visit'}</span>
                        {ev.utmSource && <span className="an-ev-meta"> via {fmtSrc(ev.utmSource)}</span>}
                      </div>
                      <span className="an-ev-time">{new Date(ev.createdAt).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}</span>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ─────────────────────────────────────────── */
  /* Main Overview                                */
  /* ─────────────────────────────────────────── */
  return (
    <div style={styles.page}>
      <style>{css}</style>

      {/* ── Header ──────────────────────────── */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Referral Analytics</h1>
          <p style={styles.sub}>Track salesperson performance and traffic sources</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' as const }}>
          {/* Live indicator */}
          {data && (
            <div className="an-live-badge">
              <span className="an-live-dot"/>
              Live
            </div>
          )}

          {/* Last updated */}
          {lastUpdated && (
            <span style={{ fontSize: '0.72rem', color: '#9ca3af', whiteSpace: 'nowrap' as const }}>
              Updated {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}

          {/* Date preset */}
          <div className="an-preset-group">
            {(['today','7d','30d','all'] as Preset[]).map(p => (
              <button key={p} className={`an-preset ${preset === p ? 'active' : ''}`} onClick={() => setPreset(p)}>
                {p === 'today' ? 'Today' : p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : 'All Time'}
              </button>
            ))}
          </div>

          <button className="an-icon-btn" onClick={() => {
            const { from, to } = getDateRange(preset)
            fetch(`/api/analytics/referrals?from=${from}&to=${to}`)
              .then(r => r.json())
              .then(json => { setData(json); setLastUpdated(new Date()) })
              .catch(() => {})
          }} title="Refresh now">
            <RefreshCw size={14}/>
          </button>
        </div>
      </div>

      {/* ── Filters bar ─────────────────────── */}
      {data && (
        <div className="an-filter-bar">
          <Filter size={13} style={{ color: '#6b7280' }}/>
          <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>Filter:</span>

          {/* Salesperson */}
          <select className="an-select" value={String(spFilter)} onChange={e => setSpFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
            <option value="all">All Salespersons</option>
            {data.bySalesperson.map(sp => (
              <option key={sp.id} value={sp.id}>{sp.name}</option>
            ))}
          </select>

          {/* Source */}
          <select className="an-select" value={srcFilter} onChange={e => setSrcFilter(e.target.value)}>
            <option value="all">All Sources</option>
            {data.bySource.map(s => (
              <option key={s.source} value={s.source}>{fmtSrc(s.source)}</option>
            ))}
          </select>

          {(spFilter !== 'all' || srcFilter !== 'all') && (
            <button className="an-clear-btn" onClick={() => { setSpFilter('all'); setSrcFilter('all') }}>
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* ── Loading / Error ──────────────────── */}
      {loading && (
        <div className="an-state-box">
          <div className="an-spinner"/>
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading analytics…</p>
        </div>
      )}

      {!loading && error && (
        <div className="an-state-box">
          <p style={{ color: '#dc2626', fontWeight: 600 }}>⚠ {error}</p>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            {error === 'Unauthorized' ? 'You need Admin access to view analytics.' : 'Try refreshing the page.'}
          </p>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* ── KPI cards ─────────────────── */}
          <div className="an-kpi-grid">
            <KpiCard icon={<Eye size={18}/>}           label="Total Visits"    value={visData.visits}    accent />
            <KpiCard icon={<Users size={18}/>}         label="Unique Visitors" value={visData.uniq} />
            <KpiCard icon={<MessageCircle size={18}/>} label="WA Clicks"       value={visData.wa} />
            <KpiCard icon={<TrendingUp size={18}/>}    label="Conversion Rate" value={`${convRate}%`} good={convRate >= 10} />
          </div>

          {/* ── Charts row ──────────────────── */}
          <div className="an-two-col">
            {/* Source breakdown */}
            <div className="an-card">
              <div className="an-card-title"><Globe size={14}/> Traffic Sources</div>
              {filteredSources.length === 0
                ? <p className="an-empty">No source data for this period.</p>
                : filteredSources.map((s, i) => (
                    <SrcBar key={s.source} source={s.source} count={s.count}
                      total={filteredSources.reduce((a, b) => a + b.count, 0)}
                      color={SOURCE_COLORS[i % SOURCE_COLORS.length]}
                      onClick={() => setSrcFilter(s.source)}
                      active={srcFilter === s.source}
                    />
                  ))}
            </div>

            {/* Top 5 performers */}
            <div className="an-card">
              <div className="an-card-title"><Award size={14}/> Top Performers</div>
              {filtered.slice(0, 5).map((sp, i) => (
                <div key={sp.id} className="an-top-row">
                  <span className="an-rank">#{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="an-sp-name">{sp.name}</div>
                    <div className="an-sp-slug">/ref/{sp.slug}</div>
                  </div>
                  <div style={{ textAlign: 'right' as const }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>{sp.totalVisits.toLocaleString()}</div>
                    <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>visits</div>
                  </div>
                  <button className="an-detail-btn" onClick={() => openDetail(sp.id)}>
                    <ExternalLink size={11}/>
                  </button>
                </div>
              ))}
              {filtered.length === 0 && <p className="an-empty">No data for this period.</p>}
            </div>
          </div>

          {/* ── Full Table ─────────────────── */}
          <div className="an-card" style={{ marginTop: 0 }}>
            <div className="an-card-title">
              <BarChart2 size={14}/> Salesperson Breakdown
              <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#6b7280', fontWeight: 400 }}>
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ overflowX: 'auto' as const }}>
              <table className="an-table">
                <thead>
                  <tr>
                    <th>Salesperson</th>
                    <SortTh label="Visits"     col="totalVisits"    current={sortCol} dir={sortDir} onToggle={toggleSort} />
                    <SortTh label="Unique"     col="uniqueVisitors" current={sortCol} dir={sortDir} onToggle={toggleSort} />
                    <SortTh label="WA Clicks"  col="whatsappClicks" current={sortCol} dir={sortDir} onToggle={toggleSort} />
                    <SortTh label="Conv. %"    col="conversionRate" current={sortCol} dir={sortDir} onToggle={toggleSort} />
                    <th>Share</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="an-empty" style={{ padding: '2rem', textAlign: 'center' as const }}>No data in this period.</td></tr>
                  ) : filtered.map(sp => {
                    const share = Math.round((sp.totalVisits / totalVisitsAll) * 100)
                    return (
                      <tr key={sp.id} className="an-tr">
                        <td>
                          <div className="an-sp-name">{sp.name}</div>
                          <div className="an-sp-slug">/ref/{sp.slug}</div>
                        </td>
                        <td className="an-num">{sp.totalVisits.toLocaleString()}</td>
                        <td className="an-num">{sp.uniqueVisitors.toLocaleString()}</td>
                        <td className="an-num">{sp.whatsappClicks.toLocaleString()}</td>
                        <td className="an-num">
                          <span className={`an-badge ${sp.conversionRate >= 20 ? 'good' : sp.conversionRate >= 10 ? 'mid' : 'low'}`}>
                            {sp.conversionRate}%
                          </span>
                        </td>
                        <td>
                          <div className="an-share-wrap">
                            <div className="an-share-bar" style={{ width: `${share}%` }}/>
                            <span className="an-share-pct">{share}%</span>
                          </div>
                        </td>
                        <td>
                          <button className="an-view-btn" onClick={() => openDetail(sp.id)}>
                            {detailLoading ? '…' : 'View'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────── */
/* Sub-components                                   */
/* ─────────────────────────────────────────────── */
function KpiCard({ icon, label, value, accent, good }: {
  icon: React.ReactNode; label: string; value: string | number; accent?: boolean; good?: boolean
}) {
  return (
    <div className={`an-kpi ${accent ? 'accent' : ''}`}>
      <div className="an-kpi-icon">{icon}</div>
      <div>
        <div className="an-kpi-val">{typeof value === 'number' ? value.toLocaleString() : value}</div>
        <div className="an-kpi-label">{label}</div>
      </div>
    </div>
  )
}

function SrcBar({ source, count, total, color, onClick, active }: {
  source: string; count: number; total: number; color: string; onClick?: () => void; active?: boolean
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className={`an-src-row ${active ? 'active' : ''}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="an-src-dot" style={{ background: color }}/>
      <span className="an-src-name">{fmtSrc(source)}</span>
      <div className="an-src-track">
        <div className="an-src-fill" style={{ width: `${pct}%`, background: color }}/>
      </div>
      <span className="an-src-count">{count.toLocaleString()}</span>
      <span className="an-src-pct">{pct}%</span>
    </div>
  )
}

function SortTh({ label, col, current, dir, onToggle }: {
  label: string; col: SortCol; current: SortCol; dir: 'asc' | 'desc'; onToggle: (c: SortCol) => void
}) {
  const active = col === current
  return (
    <th className="an-sort-th" onClick={() => onToggle(col)}>
      {label}
      {active ? (dir === 'desc' ? <ChevronDown size={11}/> : <ChevronUp size={11}/>) : null}
    </th>
  )
}

/* ─────────────────────────────────────────────── */
/* Inline styles (non-Tailwind so CMS works)        */
/* ─────────────────────────────────────────────── */
const styles = {
  page:   { padding: '2rem', maxWidth: 1400, color: '#111827' } as React.CSSProperties,
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' as const, marginBottom: '1.5rem' },
  title:  { fontSize: '1.625rem', fontWeight: 700, color: '#111827', margin: '0 0 0.2rem' } as React.CSSProperties,
  sub:    { fontSize: '0.8125rem', color: '#6b7280', margin: 0 } as React.CSSProperties,
  chipLink: { fontSize: '0.75rem', padding: '0.25rem 0.75rem', background: '#f3f4f6', borderRadius: 999, color: '#374151', textDecoration: 'none' } as React.CSSProperties,
}

const css = `
/* ── Presets ── */
.an-preset-group { display: flex; background: #f3f4f6; border-radius: 10px; padding: 3px; gap: 2px; }
.an-preset { padding: 0.35rem 0.8rem; border: none; background: transparent; color: #6b7280; border-radius: 7px; cursor: pointer; font-size: 0.8125rem; font-weight: 500; transition: all 0.18s; white-space: nowrap; }
.an-preset:hover { color: #111827; }
.an-preset.active { background: #ffffff; color: #6366f1; box-shadow: 0 1px 3px rgba(0,0,0,0.12); font-weight: 600; }
.an-icon-btn { display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; color: #6b7280; cursor: pointer; transition: all 0.18s; }
.an-icon-btn:hover { color: #6366f1; border-color: #6366f1; }

/* ── Filter bar ── */
.an-filter-bar { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; margin-bottom: 1.5rem; padding: 0.75rem 1rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; }
.an-select { padding: 0.35rem 0.75rem; border: 1px solid #d1d5db; border-radius: 7px; font-size: 0.8125rem; color: #374151; background: #fff; cursor: pointer; outline: none; }
.an-select:focus { border-color: #6366f1; }
.an-clear-btn { padding: 0.3rem 0.75rem; background: #fee2e2; color: #dc2626; border: none; border-radius: 7px; font-size: 0.75rem; font-weight: 600; cursor: pointer; }
.an-clear-btn:hover { background: #fca5a5; }

/* ── State boxes ── */
.an-state-box { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 5rem 2rem; text-align: center; }
.an-spinner { width: 36px; height: 36px; border: 3px solid #e5e7eb; border-top-color: #6366f1; border-radius: 50%; animation: an-spin 0.7s linear infinite; }
@keyframes an-spin { to { transform: rotate(360deg); } }

/* ── KPI Grid ── */
.an-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
.an-kpi { display: flex; align-items: center; gap: 1rem; background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 1.25rem 1.5rem; box-shadow: 0 1px 4px rgba(0,0,0,0.05); transition: box-shadow 0.2s; }
.an-kpi:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.an-kpi.accent { border-color: rgba(99,102,241,0.35); background: linear-gradient(135deg, rgba(99,102,241,0.06) 0%, #fff 100%); }
.an-kpi-icon { color: #6366f1; flex-shrink: 0; }
.an-kpi-val { font-size: 1.625rem; font-weight: 700; color: #111827; line-height: 1.15; }
.an-kpi-label { font-size: 0.75rem; color: #6b7280; margin-top: 0.15rem; font-weight: 500; }

/* ── Two-col ── */
.an-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
@media (max-width: 768px) { .an-two-col { grid-template-columns: 1fr; } }

/* ── Card ── */
.an-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 1.5rem; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
.an-card-title { display: flex; align-items: center; gap: 0.45rem; font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 1.25rem; }
.an-empty { color: #9ca3af; font-size: 0.875rem; text-align: center; padding: 1.5rem 0; margin: 0; }

/* ── Source bars ── */
.an-src-row { display: grid; grid-template-columns: 10px 110px 1fr 52px 38px; align-items: center; gap: 0.6rem; margin-bottom: 0.6rem; padding: 0.3rem 0.4rem; border-radius: 6px; transition: background 0.15s; }
.an-src-row:hover { background: #f9fafb; }
.an-src-row.active { background: rgba(99,102,241,0.06); }
.an-src-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.an-src-name { font-size: 0.8125rem; color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.an-src-track { height: 6px; background: #f3f4f6; border-radius: 3px; overflow: hidden; }
.an-src-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
.an-src-count { text-align: right; font-size: 0.8125rem; font-weight: 600; color: #111827; }
.an-src-pct { font-size: 0.75rem; color: #9ca3af; }

/* ── Top performers ── */
.an-top-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem 0; border-bottom: 1px solid #f3f4f6; }
.an-top-row:last-child { border-bottom: none; }
.an-rank { color: #6366f1; font-weight: 700; font-size: 0.875rem; width: 26px; flex-shrink: 0; }
.an-sp-name { font-weight: 600; font-size: 0.875rem; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.an-sp-slug { font-size: 0.7rem; color: #9ca3af; }
.an-detail-btn { display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: rgba(99,102,241,0.08); border: none; border-radius: 6px; color: #6366f1; cursor: pointer; flex-shrink: 0; }
.an-detail-btn:hover { background: #6366f1; color: #fff; }

/* ── Table ── */
.an-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.an-table th { text-align: left; padding: 0.6rem 0.75rem; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; border-bottom: 2px solid #f3f4f6; white-space: nowrap; }
.an-sort-th { cursor: pointer; user-select: none; display: table-cell; }
.an-sort-th:hover { color: #374151; }
.an-tr { border-bottom: 1px solid #f9fafb; transition: background 0.12s; }
.an-tr:hover { background: #fafafa; }
.an-tr td { padding: 0.75rem; vertical-align: middle; }
.an-num { text-align: right; font-variant-numeric: tabular-nums; color: #374151; }
.an-badge { padding: 0.2rem 0.55rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
.an-badge.good { background: rgba(16,185,129,0.1); color: #059669; }
.an-badge.mid  { background: rgba(245,158,11,0.1);  color: #d97706; }
.an-badge.low  { background: rgba(239,68,68,0.08);  color: #dc2626; }
.an-share-wrap { display: flex; align-items: center; gap: 0.5rem; min-width: 80px; }
.an-share-bar { height: 5px; background: linear-gradient(90deg, #6366f1, #8b5cf6); border-radius: 3px; min-width: 2px; transition: width 0.35s; }
.an-share-pct { font-size: 0.7rem; color: #9ca3af; white-space: nowrap; }
.an-view-btn { padding: 0.3rem 0.7rem; background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2); color: #6366f1; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 600; transition: all 0.15s; white-space: nowrap; }
.an-view-btn:hover { background: #6366f1; color: #fff; border-color: #6366f1; }

/* ── Back button ── */
.an-back-btn { display: flex; align-items: center; gap: 0.4rem; background: #f3f4f6; border: none; color: #374151; border-radius: 8px; padding: 0.45rem 1rem; cursor: pointer; font-size: 0.8125rem; font-weight: 500; transition: all 0.18s; }
.an-back-btn:hover { background: #e5e7eb; }

/* ── Events ── */
.an-ev { display: flex; align-items: center; gap: 0.65rem; padding: 0.5rem 0.5rem; border-radius: 7px; margin-bottom: 0.3rem; font-size: 0.8125rem; }
.an-ev-pv { background: rgba(99,102,241,0.05); }
.an-ev-wa { background: rgba(16,185,129,0.06); }
.an-ev-type { font-weight: 600; color: #111827; }
.an-ev-meta { color: #6b7280; margin-left: 0.25rem; }
.an-ev-time { color: #9ca3af; white-space: nowrap; font-size: 0.75rem; }

/* ── Live badge ── */
.an-live-badge { display: flex; align-items: center; gap: 0.35rem; font-size: 0.7rem; font-weight: 600; color: #059669; background: rgba(16,185,129,0.1); padding: 0.25rem 0.6rem; border-radius: 999px; }
.an-live-dot { width: 7px; height: 7px; border-radius: 50%; background: #10b981; animation: an-pulse 2s ease-in-out infinite; }
@keyframes an-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.75); } }
`
