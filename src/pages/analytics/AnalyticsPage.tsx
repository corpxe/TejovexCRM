import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import {
  TrendingUp, DollarSign, Target, Users, BarChart3, PieChart as PieIcon,
  Activity, ArrowUpRight, ArrowDownRight, Layers,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const BASE = import.meta.env.VITE_API_URL;

function getToken() {
  return localStorage.getItem("token");
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

interface Lead {
  id: string;
  title: string;
  status: string;
  source: string;
  value?: number;
  createdAt: string;
}

interface Deal {
  id: string;
  title: string;
  value?: number;
  status: string;
  createdAt: string;
  contactName?: string;
  assignedToName?: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  company?: { name: string } | null;
  createdAt: string;
}

interface Task {
  id: string;
  status: string;
  createdAt: string;
}

const COLORS = ["#eab308", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#f97316", "#06b6d4", "#ec4899"];

function formatValue(val?: number) {
  if (!val) return "0";
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${val}`;
}

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "12px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
  },
  itemStyle: { padding: "2px 0" },
};

function KPICard({
  label,
  value,
  change,
  up,
  icon,
  accent,
}: {
  label: string;
  value: string;
  change: string;
  up: boolean;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
        <span className={accent}>{icon}</span>
      </div>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      <div className="mt-1 flex items-center gap-1 text-xs">
        {up ? (
          <ArrowUpRight size={14} className="text-green-500" />
        ) : (
          <ArrowDownRight size={14} className="text-red-500" />
        )}
        <span className={up ? "text-green-600" : "text-red-500"}>{change}</span>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const isAdminUser = user?.role === "ADMIN";

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals]       = useState<Deal[]>([]);
  const [leads, setLeads]       = useState<Lead[]>([]);
  const [tasks, setTasks]       = useState<Task[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    const h = authHeaders();
    Promise.all([
      fetch(`${BASE}/contacts`, { headers: h }).then((r) => r.json()),
      fetch(`${BASE}/deals`,    { headers: h }).then((r) => r.json()),
      fetch(`${BASE}/leads`,    { headers: h }).then((r) => r.json()),
      fetch(`${BASE}/tasks`,    { headers: h }).then((r) => r.json()),
    ])
      .then(([c, d, l, t]) => {
        setContacts(Array.isArray(c) ? c : c?.data ?? []);
        setDeals(Array.isArray(d) ? d : d?.data ?? []);
        setLeads(Array.isArray(l) ? l : l?.data ?? []);
        setTasks(Array.isArray(t) ? t : t?.data ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load analytics data.");
        setLoading(false);
      });
  }, []);

  const kpis = useMemo(() => {
    const totalRevenue = deals
      .filter((d) => d.status === "WON")
      .reduce((s, d) => s + (d.value ?? 0), 0);
    const openDeals = deals.filter((d) => d.status === "OPEN");
    const pipelineValue = openDeals.reduce((s, d) => s + (d.value ?? 0), 0);
    const avgDealSize = deals.length > 0 ? totalRevenue / Math.max(deals.filter((d) => d.status === "WON").length, 1) : 0;
    const winRate = deals.length > 0 ? (deals.filter((d) => d.status === "WON").length / deals.length) * 100 : 0;
    const convertedLeads = leads.filter((l) => l.status === "CONVERTED").length;
    const conversionRate = leads.length > 0 ? (convertedLeads / leads.length) * 100 : 0;
    return { totalRevenue, pipelineValue, avgDealSize, winRate, convertedLeads, conversionRate, totalDeals: deals.length, totalLeads: leads.length };
  }, [deals, leads]);

  const revenueByMonth = useMemo(() => {
    const map: Record<string, { month: string; revenue: number; deals: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      map[key] = { month: d.toLocaleDateString("en-IN", { month: "short" }), revenue: 0, deals: 0 };
    }
    deals.forEach((d) => {
      const date = new Date(d.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, "0")}`;
      if (map[key]) {
        map[key].revenue += d.value ?? 0;
        map[key].deals += 1;
      }
    });
    return Object.values(map);
  }, [deals]);

  const leadSources = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach((l) => {
      const src = l.source ?? "Unknown";
      map[src] = (map[src] ?? 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [leads]);

  const leadStatus = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach((l) => {
      map[l.status] = (map[l.status] ?? 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [leads]);

  const dealPipeline = useMemo(() => {
    const map: Record<string, number> = {};
    deals.forEach((d) => {
      const s = d.status || "OPEN";
      map[s] = (map[s] ?? 0) + (d.value ?? 0);
    });
    return Object.entries(map).map(([stage, value]) => ({ stage, value }));
  }, [deals]);

  const monthlyContacts = useMemo(() => {
    const map: Record<string, { month: string; count: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      map[key] = { month: d.toLocaleDateString("en-IN", { month: "short" }), count: 0 };
    }
    contacts.forEach((c) => {
      const date = new Date(c.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, "0")}`;
      if (map[key]) map[key].count += 1;
    });
    return Object.values(map);
  }, [contacts]);

  const funnelData = useMemo(() => {
    const total = leads.length;
    const newL = leads.filter((l) => l.status === "NEW").length;
    const contacted = leads.filter((l) => l.status === "CONTACTED").length;
    const qualified = leads.filter((l) => l.status === "QUALIFIED").length;
    const converted = leads.filter((l) => l.status === "CONVERTED").length;
    return [
      { stage: "Leads", count: total, pct: 100 },
      { stage: "New", count: newL, pct: total > 0 ? (newL / total) * 100 : 0 },
      { stage: "Contacted", count: contacted, pct: total > 0 ? (contacted / total) * 100 : 0 },
      { stage: "Qualified", count: qualified, pct: total > 0 ? (qualified / total) * 100 : 0 },
      { stage: "Converted", count: converted, pct: total > 0 ? (converted / total) * 100 : 0 },
    ];
  }, [leads]);

  const taskCompletion = useMemo(() => {
    const completed = tasks.filter((t) => t.status === "COMPLETED").length;
    const pending = tasks.filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS").length;
    const cancelled = tasks.filter((t) => t.status === "CANCELLED").length;
    return [
      { name: "Completed", value: completed },
      { name: "In Progress", value: pending },
      { name: "Cancelled", value: cancelled },
    ];
  }, [tasks]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-yellow-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          {isAdminUser ? "Analytics" : "My Analytics"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Deep-dive into your CRM performance metrics.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Total Revenue"
          value={formatValue(kpis.totalRevenue)}
          change="+12.5%"
          up
          icon={<DollarSign size={18} />}
          accent="text-green-600"
        />
        <KPICard
          label="Pipeline Value"
          value={formatValue(kpis.pipelineValue)}
          change={`${kpis.totalDeals} deals`}
          up={kpis.totalDeals > 0}
          icon={<Layers size={18} />}
          accent="text-blue-600"
        />
        <KPICard
          label="Win Rate"
          value={`${kpis.winRate.toFixed(1)}%`}
          change={`${kpis.convertedLeads} converted`}
          up={kpis.winRate > 30}
          icon={<Target size={18} />}
          accent="text-yellow-600"
        />
        <KPICard
          label="Lead Conversion"
          value={`${kpis.conversionRate.toFixed(1)}%`}
          change={`${kpis.totalLeads} total leads`}
          up={kpis.conversionRate > 20}
          icon={<TrendingUp size={18} />}
          accent="text-purple-600"
        />
      </div>

      {/* Row 2: Revenue Trend + Lead Sources */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <BarChart3 size={16} className="text-yellow-600" />
            <h2 className="text-sm font-semibold text-gray-800">Revenue Trend (Last 6 Months)</h2>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueByMonth}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => formatValue(v)} />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(value) => [formatValue(Number(value)), "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#eab308"
                  strokeWidth={2}
                  fill="url(#revGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <PieIcon size={16} className="text-blue-600" />
            <h2 className="text-sm font-semibold text-gray-800">Lead Sources</h2>
          </div>
          <div className="p-5 flex flex-col items-center">
            {leadSources.length === 0 ? (
              <p className="text-sm text-gray-400 py-12">No lead data</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={leadSources}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {leadSources.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      {...tooltipStyle}
                      formatter={(value) => [`${value} leads`]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 flex flex-wrap gap-3 justify-center">
                  {leadSources.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      {s.name} ({s.value})
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Lead Status + Deal Pipeline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Activity size={16} className="text-purple-600" />
            <h2 className="text-sm font-semibold text-gray-800">Lead Status Distribution</h2>
          </div>
          <div className="p-5">
            {leadStatus.length === 0 ? (
              <p className="text-sm text-gray-400 py-12 text-center">No leads yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={leadStatus} layout="vertical" barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#9ca3af" width={80} />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(value) => [`${value} leads`, "Count"]}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {leadStatus.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Layers size={16} className="text-green-600" />
            <h2 className="text-sm font-semibold text-gray-800">Deal Pipeline Value</h2>
          </div>
          <div className="p-5">
            {dealPipeline.length === 0 ? (
              <p className="text-sm text-gray-400 py-12 text-center">No deals yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dealPipeline} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="stage" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => formatValue(v)} />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(value) => [formatValue(Number(value)), "Revenue"]}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    <Cell fill="#3b82f6" />
                    <Cell fill="#eab308" />
                    <Cell fill="#10b981" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Conversion Funnel + Task Completion + Contacts Trend */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Target size={16} className="text-yellow-600" />
            <h2 className="text-sm font-semibold text-gray-800">Conversion Funnel</h2>
          </div>
          <div className="p-5 space-y-3">
            {funnelData.map((step, i) => {
              const widths = ["100%", "85%", "65%", "45%", "30%"];
              const funnelColors = ["#eab308", "#f59e0b", "#3b82f6", "#8b5cf6", "#10b981"];
              return (
                <div key={step.stage} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-700">{step.stage}</span>
                    <span className="text-gray-500">
                      {step.count} ({step.pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-7 bg-gray-100 rounded-md overflow-hidden">
                    <div
                      className="h-full rounded-md transition-all duration-700 flex items-center justify-end pr-2"
                      style={{
                        width: widths[i],
                        backgroundColor: funnelColors[i],
                        opacity: 0.85,
                      }}
                    >
                      {step.count > 0 && (
                        <span className="text-[10px] font-bold text-white">{step.count}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Users size={16} className="text-orange-600" />
            <h2 className="text-sm font-semibold text-gray-800">Task Breakdown</h2>
          </div>
          <div className="p-5 flex flex-col items-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={taskCompletion}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#eab308" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip
                  {...tooltipStyle}
                  formatter={(value) => [value]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap gap-3 justify-center">
              {taskCompletion.map((t, i) => (
                <div key={t.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: ["#10b981", "#eab308", "#ef4444"][i] }}
                  />
                  {t.name} ({t.value})
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Users size={16} className="text-cyan-600" />
            <h2 className="text-sm font-semibold text-gray-800">Contacts Growth</h2>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={monthlyContacts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" allowDecimals={false} />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(value) => [value, "Contacts"]}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={{ fill: "#06b6d4", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 5: Monthly Deals + Top Deals Table */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <TrendingUp size={16} className="text-green-600" />
            <h2 className="text-sm font-semibold text-gray-800">Deals by Month</h2>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenueByMonth} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" allowDecimals={false} />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(value) => [value, "Deals"]}
                />
                <Bar dataKey="deals" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-3 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Top Deals</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Deal</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Contact</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Value</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {deals.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-gray-400">No deals yet</td>
                  </tr>
                ) : (
                  [...deals]
                    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
                    .slice(0, 6)
                    .map((deal) => (
                      <tr key={deal.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-800">{deal.title}</td>
                        <td className="px-5 py-3 text-gray-600">{deal.contactName ?? "—"}</td>
                        <td className="px-5 py-3 text-gray-700">{formatValue(deal.value)}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              deal.status === "WON"
                                ? "bg-green-100 text-green-700"
                                : deal.status === "LOST"
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {deal.status}
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}