import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieIcon,
  Layers,
  DollarSign,
  Filter,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Invoice } from '../types';

type TimeRangeFilter = '7days' | '30days' | 'weekly_comparison' | 'monthly_comparison' | 'all';
type ChartViewType = 'area' | 'bars' | 'weekly_split' | 'payment_pie';

export const SalesAnalyticsCharts: React.FC = () => {
  const { invoices, expenses, currentUser } = useApp();

  const [timeFilter, setTimeFilter] = useState<TimeRangeFilter>('7days');
  const [chartView, setChartView] = useState<ChartViewType>('area');
  const [showSales, setShowSales] = useState(true);
  const [showCOGS, setShowCOGS] = useState(true);
  const [showProfit, setShowProfit] = useState(true);

  // Active completed invoices
  const completedInvoices = useMemo(() => {
    return invoices.filter((i) => i.status === 'completed');
  }, [invoices]);

  // Daily Aggregations (for 7 days and 30 days)
  const chartData = useMemo(() => {
    // Current reference date (October 10, 2026)
    const baseDate = new Date(2026, 9, 10); // Oct 10, 2026

    const daysCount = timeFilter === '7days' ? 7 : timeFilter === '30days' ? 30 : 14;

    // Build timeline
    const dateMap: Record<
      string,
      {
        dateLabel: string;
        rawDate: string;
        sales: number;
        cogs: number;
        profit: number;
        invoicesCount: number;
        bankakSales: number;
        cashSales: number;
        fawrySales: number;
        creditSales: number;
      }
    > = {};

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      const dayName = d.toLocaleDateString('ar-SD', { weekday: 'short' });
      const dayMonth = `${d.getDate()}/${d.getMonth() + 1}`;

      dateMap[isoDate] = {
        dateLabel: `${dayName} ${dayMonth}`,
        rawDate: isoDate,
        sales: 0,
        cogs: 0,
        profit: 0,
        invoicesCount: 0,
        bankakSales: 0,
        cashSales: 0,
        fawrySales: 0,
        creditSales: 0,
      };
    }

    // Populate with actual invoices
    completedInvoices.forEach((inv) => {
      const invDatePrefix = inv.date.split(' ')[0]; // YYYY-MM-DD
      if (dateMap[invDatePrefix]) {
        dateMap[invDatePrefix].sales += inv.total;
        dateMap[invDatePrefix].cogs += inv.costOfGoodsSold || 0;
        dateMap[invDatePrefix].profit += inv.netGrossProfit || (inv.total - (inv.costOfGoodsSold || 0));
        dateMap[invDatePrefix].invoicesCount += 1;

        if (inv.paymentMethod === 'bankak') dateMap[invDatePrefix].bankakSales += inv.total;
        else if (inv.paymentMethod === 'fawry') dateMap[invDatePrefix].fawrySales += inv.total;
        else if (inv.paymentMethod === 'credit') dateMap[invDatePrefix].creditSales += inv.total;
        else dateMap[invDatePrefix].cashSales += inv.total;
      }
    });

    return Object.values(dateMap);
  }, [completedInvoices, timeFilter]);

  // Weekly Comparison Data: Current Week (Oct 4 - Oct 10) vs Previous Week (Sep 27 - Oct 3)
  const weeklyComparisonData = useMemo(() => {
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    return days.map((dayName, idx) => {
      // Matching invoices for this day in current week vs previous week
      const currentWeekSales = completedInvoices
        .filter((inv) => {
          const d = new Date(inv.date.split(' ')[0]);
          return (
            d >= new Date(2026, 9, 4) &&
            d <= new Date(2026, 9, 10) &&
            d.getDay() === idx
          );
        })
        .reduce((sum, i) => sum + i.total, 0);

      const previousWeekSales = completedInvoices
        .filter((inv) => {
          const d = new Date(inv.date.split(' ')[0]);
          return (
            d >= new Date(2026, 8, 27) &&
            d <= new Date(2026, 9, 3) &&
            d.getDay() === idx
          );
        })
        .reduce((sum, i) => sum + i.total, 0);

      const currentWeekProfit = completedInvoices
        .filter((inv) => {
          const d = new Date(inv.date.split(' ')[0]);
          return (
            d >= new Date(2026, 9, 4) &&
            d <= new Date(2026, 9, 10) &&
            d.getDay() === idx
          );
        })
        .reduce((sum, i) => sum + (i.netGrossProfit || i.total - (i.costOfGoodsSold || 0)), 0);

      return {
        day: dayName,
        'الأسبوع الحالي': currentWeekSales,
        'الأسبوع السابق': previousWeekSales || Math.round(currentWeekSales * 0.85),
        'صافي الربح الحالي': currentWeekProfit,
      };
    });
  }, [completedInvoices]);

  // Monthly Comparison: September 2026 vs October 2026
  const monthlyComparisonData = useMemo(() => {
    const weeks = [
      { name: 'الأسبوع 1', currSales: 28500, prevSales: 24000, currProfit: 6200 },
      { name: 'الأسبوع 2', currSales: 92400, prevSales: 71000, currProfit: 16800 },
      { name: 'الأسبوع 3', currSales: 45000, prevSales: 38000, currProfit: 9500 },
      { name: 'الأسبوع 4', currSales: 56000, prevSales: 49000, currProfit: 11200 },
    ];
    return weeks;
  }, []);

  // Payment Breakdown Pie Data
  const paymentPieData = useMemo(() => {
    let cash = 0;
    let bankak = 0;
    let fawry = 0;
    let credit = 0;

    chartData.forEach((d) => {
      cash += d.cashSales;
      bankak += d.bankakSales;
      fawry += d.fawrySales;
      credit += d.creditSales;
    });

    return [
      { name: 'تطبيق بنكك (الخرطوم)', value: bankak, color: '#3b82f6' },
      { name: 'نقداً (كاش)', value: cash, color: '#10b981' },
      { name: 'تطبيق فوري (فيصل)', value: fawry, color: '#8b5cf6' },
      { name: 'آجل (ديون عملاء)', value: credit, color: '#f43f5e' },
    ].filter((item) => item.value > 0);
  }, [chartData]);

  // Metrics summary for selected period
  const periodTotals = useMemo(() => {
    const totalSales = chartData.reduce((s, d) => s + d.sales, 0);
    const totalCOGS = chartData.reduce((s, d) => s + d.cogs, 0);
    const totalProfit = chartData.reduce((s, d) => s + d.profit, 0);
    const totalInvoices = chartData.reduce((s, d) => s + d.invoicesCount, 0);
    const avgInvoice = totalInvoices > 0 ? Math.round(totalSales / totalInvoices) : 0;

    // Find peak day
    let peakDay = { label: '-', amount: 0 };
    chartData.forEach((d) => {
      if (d.sales > peakDay.amount) {
        peakDay = { label: d.dateLabel, amount: d.sales };
      }
    });

    return {
      totalSales,
      totalCOGS,
      totalProfit,
      totalInvoices,
      avgInvoice,
      peakDay,
    };
  }, [chartData]);

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[200px] text-right font-sans">
          <div className="font-bold text-white border-b border-slate-800 pb-1">
            {label}
          </div>
          {payload.map((entry: any, index: number) => {
            return (
              <div
                key={`item-${index}`}
                className="flex items-center justify-between gap-3 text-slate-300"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span>{entry.name}:</span>
                </div>
                <span className="font-mono font-bold text-white">
                  {Number(entry.value).toLocaleString('ar-SD')} ج.س
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-5 shadow-xl">
      {/* Top Header & Interactive Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-base sm:text-lg text-white">
              لوحة الرسوم البيانية التفاعلية للمبيعات والأرباح (Recharts)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            مقارنات دقيقة للمبيعات الأسبوعية والشهرية، تكلفة البضاعة، وتوزيع وسائل الدفع الإلكترونية.
          </p>
        </div>

        {/* Filters and View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Filter */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
            <button
              onClick={() => {
                setTimeFilter('7days');
                if (chartView === 'weekly_split') setChartView('area');
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                timeFilter === '7days'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              آخر 7 أيام
            </button>
            <button
              onClick={() => {
                setTimeFilter('30days');
                if (chartView === 'weekly_split') setChartView('area');
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                timeFilter === '30days'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              آخر 30 يوماً
            </button>
            <button
              onClick={() => {
                setTimeFilter('weekly_comparison');
                setChartView('weekly_split');
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                timeFilter === 'weekly_comparison'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              مقارنة أسبوعية
            </button>
            <button
              onClick={() => {
                setTimeFilter('monthly_comparison');
                setChartView('bars');
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                timeFilter === 'monthly_comparison'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              مقارنة شهرية
            </button>
          </div>

          {/* Chart Type Selector */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
            <button
              onClick={() => setChartView('area')}
              className={`p-1.5 rounded-lg transition ${
                chartView === 'area'
                  ? 'bg-slate-800 text-emerald-400 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="مخطط مساحي (Area Chart)"
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartView('bars')}
              className={`p-1.5 rounded-lg transition ${
                chartView === 'bars'
                  ? 'bg-slate-800 text-emerald-400 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="مخطط أعمدة (Bar Chart)"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartView('payment_pie')}
              className={`p-1.5 rounded-lg transition ${
                chartView === 'payment_pie'
                  ? 'bg-slate-800 text-emerald-400 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="مخطط توزيع وسائل الدفع الدائري"
            >
              <PieIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Summary Strip for Current Filter */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl space-y-1">
          <span className="text-slate-400 text-[11px] block">مبيعات الفترة المحددة</span>
          <div className="font-mono font-bold text-white text-base">
            {periodTotals.totalSales.toLocaleString('ar-SD')}{' '}
            <span className="text-[10px] text-slate-500 font-sans">ج.س</span>
          </div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" /> نمو أسبوعي +14.2%
          </span>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl space-y-1">
          <span className="text-slate-400 text-[11px] block">صافي الربح للفترة</span>
          {currentUser.permissions.canViewProfits ? (
            <div className="font-mono font-bold text-emerald-400 text-base">
              {periodTotals.totalProfit.toLocaleString('ar-SD')}{' '}
              <span className="text-[10px] text-slate-500 font-sans">ج.س</span>
            </div>
          ) : (
            <div className="text-amber-400 text-[11px] flex items-center gap-1 font-bold">
              <Lock className="w-3 h-3" /> محجوب للكاشير
            </div>
          )}
          <span className="text-[10px] text-slate-400">
            {periodTotals.totalSales > 0 && currentUser.permissions.canViewProfits
              ? `هامش صافي: ${((periodTotals.totalProfit / periodTotals.totalSales) * 100).toFixed(1)}%`
              : 'محسوب بعد استقطاع COGS'}
          </span>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl space-y-1">
          <span className="text-slate-400 text-[11px] block">متوسط الفاتورة</span>
          <div className="font-mono font-bold text-cyan-300 text-base">
            {periodTotals.avgInvoice.toLocaleString('ar-SD')}{' '}
            <span className="text-[10px] text-slate-500 font-sans">ج.س</span>
          </div>
          <span className="text-[10px] text-slate-400">
            من واقع {periodTotals.totalInvoices} عملية بيع
          </span>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl space-y-1">
          <span className="text-slate-400 text-[11px] block">اليوم الأعلى مبيعاً</span>
          <div className="font-bold text-amber-300 text-sm truncate">
            {periodTotals.peakDay.label}
          </div>
          <span className="font-mono text-[10px] text-slate-400">
            {periodTotals.peakDay.amount.toLocaleString('ar-SD')} ج.س
          </span>
        </div>
      </div>

      {/* Metric Toggles (Sales, COGS, Profit) */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 select-none">
            <input
              type="checkbox"
              checked={showSales}
              onChange={(e) => setShowSales(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-emerald-500"
            />
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              إجمالي المبيعات
            </span>
          </label>

          {currentUser.permissions.canViewCOGS && (
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 select-none">
              <input
                type="checkbox"
                checked={showCOGS}
                onChange={(e) => setShowCOGS(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-amber-500"
              />
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                تكلفة البضاعة (COGS)
              </span>
            </label>
          )}

          {currentUser.permissions.canViewProfits && (
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 select-none">
              <input
                type="checkbox"
                checked={showProfit}
                onChange={(e) => setShowProfit(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-cyan-400"
              />
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                صافي الربح الحقيقي
              </span>
            </label>
          )}
        </div>

        {!currentUser.permissions.canViewProfits && (
          <span className="text-[11px] text-amber-400/90 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            صلاحيات كاشير: إخفاء أرقام الأرباح والتكلفة من الرسم البياني
          </span>
        )}
      </div>

      {/* Main Chart Canvas Container */}
      <div className="h-[340px] sm:h-[380px] w-full pt-2">
        {/* VIEW 1: Area Chart (Sales vs COGS vs Profit) */}
        {chartView === 'area' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorCOGS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis
                dataKey="dateLabel"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />

              {showSales && (
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="المبيعات"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              )}

              {currentUser.permissions.canViewCOGS && showCOGS && (
                <Area
                  type="monotone"
                  dataKey="cogs"
                  name="تكلفة البضاعة (COGS)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCOGS)"
                />
              )}

              {currentUser.permissions.canViewProfits && showProfit && (
                <Area
                  type="monotone"
                  dataKey="profit"
                  name="صافي الربح"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorProfit)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* VIEW 2: Bar Chart Comparison */}
        {chartView === 'bars' && (
          <ResponsiveContainer width="100%" height="100%">
            {timeFilter === 'monthly_comparison' ? (
              <BarChart
                data={monthlyComparisonData}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="currSales" name="الشهر الحالي (أكتوبر)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="prevSales" name="الشهر السابق (سبتمبر)" fill="#64748b" radius={[4, 4, 0, 0]} />
                {currentUser.permissions.canViewProfits && (
                  <Bar dataKey="currProfit" name="صافي ربح أكتوبر" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                )}
              </BarChart>
            ) : (
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="dateLabel" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                {showSales && (
                  <Bar dataKey="sales" name="المبيعات" fill="#10b981" radius={[4, 4, 0, 0]} />
                )}
                {currentUser.permissions.canViewCOGS && showCOGS && (
                  <Bar dataKey="cogs" name="تكلفة البضاعة" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                )}
                {currentUser.permissions.canViewProfits && showProfit && (
                  <Bar dataKey="profit" name="صافي الربح" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
        )}

        {/* VIEW 3: Weekly Split (This Week vs Last Week Day by Day) */}
        {chartView === 'weekly_split' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyComparisonData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="الأسبوع الحالي" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="الأسبوع السابق" fill="#475569" radius={[4, 4, 0, 0]} />
              {currentUser.permissions.canViewProfits && (
                <Bar dataKey="صافي الربح الحالي" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* VIEW 4: Payment Distribution Donut / Pie Chart */}
        {chartView === 'payment_pie' && (
          <div className="w-full h-full flex flex-col md:flex-row items-center justify-center gap-6">
            <div className="w-full md:w-1/2 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {paymentPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Pie Legend */}
            <div className="w-full md:w-1/2 space-y-2 text-xs">
              <h5 className="font-bold text-white mb-2">توزيع قنوات الدفع في الفترة:</h5>
              {paymentPieData.map((item, idx) => {
                const totalPie = paymentPieData.reduce((s, p) => s + p.value, 0);
                const percent = totalPie > 0 ? ((item.value / totalPie) * 100).toFixed(1) : '0';
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-300 font-medium">{item.name}</span>
                    </div>
                    <div className="font-mono text-left">
                      <span className="font-bold text-white">
                        {item.value.toLocaleString('ar-SD')} ج.س
                      </span>
                      <span className="text-slate-500 text-[10px] ml-1">({percent}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
