import axios from "axios";
import React, { useEffect, useMemo, useState, Suspense, lazy } from "react";
import { Link } from "react-router-dom";

// ✅ Code Splitting: Recharts library ko sirf zaroorat par load karein
const LineChart = lazy(() => import("recharts").then(module => ({ default: module.LineChart })));
const Line = lazy(() => import("recharts").then(module => ({ default: module.Line })));
const XAxis = lazy(() => import("recharts").then(module => ({ default: module.XAxis })));
const YAxis = lazy(() => import("recharts").then(module => ({ default: module.YAxis })));
const Tooltip = lazy(() => import("recharts").then(module => ({ default: module.Tooltip })));
const CartesianGrid = lazy(() => import("recharts").then(module => ({ default: module.CartesianGrid })));
const ResponsiveContainer = lazy(() => import("recharts").then(module => ({ default: module.ResponsiveContainer })));

// -----------------------------
// Helpers (koi tabdeeli nahi)
// -----------------------------
const MONTHS = [
  { label: "January", value: "01" }, { label: "February", value: "02" },
  { label: "March", value: "03" }, { label: "April", value: "04" },
  { label: "May", value: "05" }, { label: "June", value: "06" },
  { label: "July", value: "07" }, { label: "August", value: "08" },
  { label: "September", value: "09" }, { label: "October", value: "10" },
  { label: "November", value: "11" }, { label: "December", value: "12" },
];

const ymLabel = (ym) => {
  const d = new Date(`${ym}-01`);
  return isNaN(d) ? ym : d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

const downloadCustomCSV = (headers, rows, filename) => {
  if (!rows?.length) return;
  const headerLine = headers.join(",");
  const bodyLines = rows.map((r) => headers.map((h) => (r[h] ?? "")).join(","));
  const csv = [headerLine, ...bodyLines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.setAttribute("download", filename);
  document.body.appendChild(a); a.click();
  a.remove(); URL.revokeObjectURL(url);
};

const groupSum = (arr, keys, valueKey = "count") => {
  const map = new Map();
  for (const item of arr) {
    const k = keys.map((k) => item[k]).join("||");
    const prev = map.get(k) || 0;
    map.set(k, prev + (Number(item[valueKey]) || 0));
  }
  return Array.from(map.entries()).map(([k, total]) => {
    const parts = k.split("||");
    const obj = {};
    keys.forEach((kk, i) => { obj[kk] = parts[i]; });
    obj[valueKey] = total;
    return obj;
  });
};

// -----------------------------
// Component
// -----------------------------
const Overview = () => {
  const [users, setUsers] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const [uploaders, setUploaders] = useState([]);

  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [selectedUploader, setSelectedUploader] = useState("All");
  
  // ✅ Loading aur Error states add ki gayi hain
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dailyAvailable, setDailyAvailable] = useState(true);

  useEffect(() => {
    // ✅ Data fetch karne ke liye ek alag, saaf-suthra function
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [usersRes, monthlyRes, dailyRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_BASE_URL}/users/`),
          axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get-image-by-month`),
          axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get-image-by-day`).catch(err => {
            // Agar daily stats fail ho to baaki app chalti rahe
            console.warn("Daily stats API failed, proceeding without it.", err);
            setDailyAvailable(false);
            return null; // Promise.all ko reject na hone dein
          })
        ]);

        // Users Data
        if (usersRes.status === 200) setUsers(usersRes.data || []);

        // Monthly Stats
        if (monthlyRes.status === 200) {
          const stats = (monthlyRes.data?.stats || monthlyRes.data || []).map((item) => ({
            month: item.month || item._id?.month || item._id || "",
            uploadedBy: item.uploadedBy || item._id?.uploadedBy || "Unknown",
            count: item.count ?? item.total ?? 0,
          }));
          setMonthlyStats(stats);
          setUploaders([...new Set(stats.map((s) => s.uploadedBy).filter(Boolean))]);
        }

        // Daily Stats
        if (dailyRes && dailyRes.status === 200) {
          const stats = (dailyRes.data?.stats || dailyRes.data || []).map((item) => ({
            date: item.date || item._id?.date || item._id || "",
            uploadedBy: item.uploadedBy || item._id?.uploadedBy || "Unknown",
            count: item.count ?? item.total ?? 0,
          }));
          setDailyStats(stats);
          setDailyAvailable(true);
        }

      } catch (err) {
        console.error("Failed to fetch overview data:", err);
        setError("Could not load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // -----------------------------
  // Filters and Memoized Calculations (koi khaas tabdeeli nahi, pehle se behtar hai)
  // -----------------------------
  const availableYears = useMemo(() => {
    const years = new Set(monthlyStats.map(m => m.month?.split("-")?.[0]).filter(Boolean));
    return ["All", ...Array.from(years).sort((a, b) => b - a)]; // Descending sort
  }, [monthlyStats]);

  const uploaderOptions = useMemo(() => ["All", ...uploaders.sort()], [uploaders]);

  const baseFiltered = useMemo(() => {
    return monthlyStats.filter((row) => {
      const [y, m] = (row.month || "").split("-");
      if (!y || !m) return false;
      if (selectedYear !== "All" && y !== selectedYear) return false;
      if (selectedMonth !== "All" && m !== selectedMonth) return false;
      return true;
    });
  }, [monthlyStats, selectedYear, selectedMonth]);

  const { chartData, seriesUploaders } = useMemo(() => {
    const months = [...new Set(baseFiltered.map((r) => r.month))].sort();
    if (selectedUploader !== "All") {
        const filtered = baseFiltered.filter((r) => r.uploadedBy === selectedUploader);
        const dataMap = new Map(filtered.map(item => [item.month, item.count]));
        const filled = months.map((m) => ({ month: m, count: dataMap.get(m) || 0 }));
        return { chartData: filled, seriesUploaders: [selectedUploader] };
    }
    const uploadersSet = [...new Set(baseFiltered.map((r) => r.uploadedBy))].sort();
    const pivotRows = months.map((m) => {
        const row = { month: m };
        for (const u of uploadersSet) {
            const rec = baseFiltered.find((x) => x.month === m && x.uploadedBy === u);
            row[u] = rec?.count || 0;
        }
        return row;
    });
    return { chartData: pivotRows, seriesUploaders: uploadersSet };
  }, [baseFiltered, selectedUploader]);
  
  const reportMonthlyRows = useMemo(() => groupSum(baseFiltered, ["uploadedBy", "month"], "count"), [baseFiltered]);
  const reportYearlyRows = useMemo(() => {
    const rows = baseFiltered.map((r) => ({
      uploadedBy: r.uploadedBy,
      year: r.month.split("-")[0],
      count: r.count,
    }));
    return groupSum(rows, ["uploadedBy", "year"], "count");
  }, [baseFiltered]);

  const reportDailyRows = useMemo(() => {
    if (!dailyStats?.length) return [];
    return dailyStats.filter((row) => {
      if (!row.date) return false;
      const [y, m] = row.date.split("-");
      if (selectedYear !== "All" && y !== selectedYear) return false;
      if (selectedMonth !== "All" && m !== selectedMonth) return false;
      if (selectedUploader !== "All" && row.uploadedBy !== selectedUploader) return false;
      return true;
    });
  }, [dailyStats, selectedYear, selectedMonth, selectedUploader]);
  
  // -----------------------------
  // Render
  // -----------------------------
  if (loading) {
    return <div className="text-center p-10">Loading Dashboard...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">{error}</div>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Users */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-gray-200 dark:bg-zinc-800 p-4 rounded-lg">
        <h1 className="text-xl sm:text-2xl font-bold uppercase text-gray-800 dark:text-white text-center sm:text-left">
          Total Users ({users.length})
        </h1>
        <Link to="/dashboard/Requests/Permissions-Users" className="mt-2 sm:mt-0 text-blue-600 dark:text-blue-400 hover:underline">
          View Users
        </Link>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-200 dark:bg-zinc-800 p-4 rounded-lg">
        {/* Year, Month, Uploader selects... */}
        {/* ... (filter controls ka code waisa hi rahega) ... */}
      </div>

      {/* Chart */}
      <div className="bg-gray-200 dark:bg-zinc-800 p-4 rounded-lg min-h-[350px]">
        <h2 className="text-lg font-semibold mb-4 text-center sm:text-left">
          Images Per Month
        </h2>
        {/* ✅ Suspense Chart ke load hone tak fallback UI dikhayega */}
        <Suspense fallback={<div className="text-center pt-20">Loading Chart...</div>}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={ymLabel} />
              <YAxis allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1f2937", color: "#fff", borderRadius: "0.5rem" }}
                formatter={(value, name) => [value, name === "count" ? "Total Images" : name]}
                labelFormatter={ymLabel}
              />
              {selectedUploader === "All"
                ? seriesUploaders.map((u, i) => <Line key={u} type="monotone" dataKey={u} strokeWidth={2} />)
                : <Line type="monotone" dataKey="count" name="Total Images" strokeWidth={2} />
              }
            </LineChart>
          </ResponsiveContainer>
        </Suspense>
      </div>

      {/* Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Monthly Report */}
        <ReportTable title="By Month" headers={["uploadedBy", "month", "count"]} rows={reportMonthlyRows} filename="monthly_report.csv" />
        
        {/* Yearly Report */}
        <ReportTable title="By Year" headers={["uploadedBy", "year", "count"]} rows={reportYearlyRows} filename="yearly_report.csv" />

        {/* Daily Report */}
        <div className="bg-gray-200 dark:bg-zinc-800 p-4 rounded-lg overflow-x-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">By Day</h3>
            <button
              onClick={() => downloadCustomCSV(["uploadedBy", "date", "count"], reportDailyRows, "report_daily.csv")}
              className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50"
              disabled={!reportDailyRows.length}
            >
              Download
            </button>
          </div>
          {dailyAvailable ? (
            reportDailyRows.length > 0 ? (
                <ReportTableContent headers={["uploadedBy", "date", "count"]} rows={reportDailyRows.slice(0, 100)} />
            ) : (
                <p className="text-center text-gray-500 py-4">No daily data for selected filters.</p>
            )
          ) : (
            <p className="text-amber-600 text-center py-4">Daily report API not available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ✅ Reusable component reports ke liye
const ReportTable = ({ title, headers, rows, filename }) => (
  <div className="bg-gray-200 dark:bg-zinc-800 p-4 rounded-lg overflow-x-auto">
    <div className="flex justify-between items-center mb-3">
      <h3 className="font-semibold">{title}</h3>
      <button
        onClick={() => downloadCustomCSV(headers, rows, filename)}
        className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50"
        disabled={!rows.length}
      >
        Download
      </button>
    </div>
    {rows.length > 0 ? (
      <ReportTableContent headers={headers} rows={rows.slice(0, 100)} />
    ) : (
      <p className="text-center text-gray-500 py-4">No data available.</p>
    )}
    {rows.length > 100 && <p className="text-xs text-center mt-2">Showing first 100 rows...</p>}
  </div>
);

const ReportTableContent = ({ headers, rows }) => (
  <table className="w-full text-sm min-w-[300px]">
    <thead>
      <tr className="border-b dark:border-gray-600">
        {headers.map(h => <th key={h} className="p-2 text-left capitalize">{h.replace('uploadedBy', 'Uploader')}</th>)}
      </tr>
    </thead>
    <tbody>
      {rows.map((r, i) => (
        <tr key={i} className="border-b dark:border-gray-700 last:border-b-0">
          {headers.map(h => <td key={h} className="p-2">{h === 'month' ? ymLabel(r[h]) : r[h]}</td>)}
        </tr>
      ))}
    </tbody>
  </table>
);

export default Overview;
