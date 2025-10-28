import axios from "axios";
import React, { useEffect, useMemo, useState, Suspense, lazy } from "react";
import { Link } from "react-router-dom";

// Code Splitting: Recharts library ko sirf zaroorat par load karein
const LineChart = lazy(() => import("recharts").then(module => ({ default: module.LineChart })));
const Line = lazy(() => import("recharts").then(module => ({ default: module.Line })));
const XAxis = lazy(() => import("recharts").then(module => ({ default: module.XAxis })));
const YAxis = lazy(() => import("recharts").then(module => ({ default: module.YAxis })));
const Tooltip = lazy(() => import("recharts").then(module => ({ default: module.Tooltip })));
const CartesianGrid = lazy(() => import("recharts").then(module => ({ default: module.CartesianGrid })));
const ResponsiveContainer = lazy(() => import("recharts").then(module => ({ default: module.ResponsiveContainer })));

// -----------------------------
// Helper Functions (Saaf-suthra version)
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
  if (!ym || !ym.includes('-')) return ym;
  const d = new Date(`${ym}-02`); // 2 tarikh istemal karein time-zone issues se bachne ke liye
  return isNaN(d) ? ym : d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

const downloadCustomCSV = (headers, rows, filename) => {
  if (!rows?.length) return;
  const headerLine = headers.map(h => h.label).join(",");
  const bodyLines = rows.map(row => 
    headers.map(h => `"${row[h.key] ?? ""}"`).join(",")
  );
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
    keys.forEach((key, i) => { obj[key] = parts[i]; });
    obj[valueKey] = total;
    return obj;
  });
};

// -----------------------------
// Main Component
// -----------------------------
const Overview = () => {
  const [users, setUsers] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [selectedUploader, setSelectedUploader] = useState("All");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [usersRes, monthlyRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_BASE_URL}/users/`),
          axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get-image-by-month`),
        ]);

        if (usersRes.status === 200) setUsers(usersRes.data || []);

        if (monthlyRes.status === 200) {
          const stats = (monthlyRes.data?.stats || monthlyRes.data || []).map((item) => ({
            month: item.month || item._id?.month || item._id || "",
            uploadedBy: item.uploadedBy || item._id?.uploadedBy || "Unknown",
            count: item.count ?? item.total ?? 0,
          }));
          setMonthlyStats(stats);
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

  // Behtar Memoized Calculations
  const uploaders = useMemo(() => {
    const uploaderSet = new Set(monthlyStats.map(s => s.uploadedBy).filter(Boolean));
    return ["All", ...Array.from(uploaderSet).sort()];
  }, [monthlyStats]);
  
  const availableYears = useMemo(() => {
    const years = new Set(monthlyStats.map(m => m.month?.split("-")?.[0]).filter(Boolean));
    return ["All", ...Array.from(years).sort((a, b) => b - a)]; // Naye saal pehle
  }, [monthlyStats]);

  const filteredMonthlyStats = useMemo(() => {
    return monthlyStats.filter((row) => {
      const [y, m] = (row.month || "").split("-");
      if (!y || !m) return false;
      if (selectedYear !== "All" && y !== selectedYear) return false;
      if (selectedMonth !== "All" && m !== selectedMonth) return false;
      if (selectedUploader !== "All" && row.uploadedBy !== selectedUploader) return false;
      return true;
    });
  }, [monthlyStats, selectedYear, selectedMonth, selectedUploader]);

  const chartData = useMemo(() => {
    const allMonths = [...new Set(monthlyStats.map(r => r.month))].sort();
    const relevantMonths = allMonths.filter(m => {
        const [y, mo] = m.split('-');
        if (selectedYear !== 'All' && y !== selectedYear) return false;
        if (selectedMonth !== 'All' && mo !== selectedMonth) return false;
        return true;
    });

    if (selectedUploader !== "All") {
        const dataMap = new Map(filteredMonthlyStats.map(item => [item.month, item.count]));
        return relevantMonths.map(m => ({ month: m, count: dataMap.get(m) || 0 }));
    } else {
        const uploaderSet = [...new Set(filteredMonthlyStats.map(r => r.uploadedBy))].sort();
        return relevantMonths.map(m => {
            const row = { month: m };
            for (const u of uploaderSet) {
                const rec = monthlyStats.find(x => x.month === m && x.uploadedBy === u);
                row[u] = rec?.count || 0;
            }
            return row;
        });
    }
  }, [filteredMonthlyStats, monthlyStats, selectedYear, selectedMonth, selectedUploader]);

  const seriesUploaders = useMemo(() => {
      if (selectedUploader !== "All") return [selectedUploader];
      return [...new Set(filteredMonthlyStats.map(r => r.uploadedBy))].sort();
  }, [filteredMonthlyStats, selectedUploader]);

  const reportMonthlyRows = useMemo(() => groupSum(filteredMonthlyStats, ["uploadedBy", "month"], "count"), [filteredMonthlyStats]);
  
  const reportYearlyRows = useMemo(() => {
    const rows = filteredMonthlyStats.map(r => ({
      uploadedBy: r.uploadedBy,
      year: r.month.split("-")[0],
      count: r.count,
    }));
    return groupSum(rows, ["uploadedBy", "year"], "count");
  }, [filteredMonthlyStats]);

  if (loading) return <div className="text-center p-10 font-semibold">Loading Dashboard...</div>;
  if (error) return <div className="text-center p-10 text-red-500 font-semibold">{error}</div>;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between bg-gray-200 dark:bg-zinc-800 p-4 rounded-lg shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
          Total Users: <span className="text-blue-600 dark:text-blue-400">{users.length}</span>
        </h1>
        <Link to="/dashboard/Requests/Permissions-Users" className="mt-2 sm:mt-0 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
          Manage Users
        </Link>
      </div>

      <div className="bg-gray-200 dark:bg-zinc-800 p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Filter Options</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FilterSelect label="Year" value={selectedYear} onChange={setSelectedYear} options={availableYears} />
          <FilterSelect label="Month" value={selectedMonth} onChange={setSelectedMonth} options={["All", ...MONTHS]} />
          <FilterSelect label="Uploader" value={selectedUploader} onChange={setSelectedUploader} options={uploaders} />
        </div>
      </div>

      <div className="bg-gray-200 dark:bg-zinc-800 p-4 rounded-lg shadow-sm min-h-[350px]">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Monthly Uploads</h2>
        <Suspense fallback={<div className="text-center pt-20">Loading Chart...</div>}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
              <XAxis dataKey="month" tickFormatter={ymLabel} fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1f2937", color: "#fff", borderRadius: "0.5rem", border: 'none' }}
                formatter={(value, name) => [value, name === "count" ? "Images" : name]}
                labelFormatter={ymLabel}
              />
              {selectedUploader === "All"
                ? seriesUploaders.map(u => <Line key={u} type="monotone" dataKey={u} name={u} strokeWidth={2} dot={false} />)
                : <Line type="monotone" dataKey="count" name="Images" strokeWidth={2} dot={false} />
              }
            </LineChart>
          </ResponsiveContainer>
        </Suspense>
      </div>

      {/* ✅ UI Behtari: 2-column grid ab behtar lagega */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ReportTable title="Monthly Summary" headers={[{label: 'Uploader', key: 'uploadedBy'}, {label: 'Month', key: 'month'}, {label: 'Images', key: 'count'}]} rows={reportMonthlyRows} filename="monthly_report.csv" />
        <ReportTable title="Yearly Summary" headers={[{label: 'Uploader', key: 'uploadedBy'}, {label: 'Year', key: 'year'}, {label: 'Images', key: 'count'}]} rows={reportYearlyRows} filename="yearly_report.csv" />
      </div>
    </div>
  );
};

// Reusable Filter Dropdown
const FilterSelect = ({ label, value, onChange, options }) => (
    <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">{label}</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="rounded-md px-3 py-2 w-full bg-white dark:bg-zinc-700 text-gray-900 dark:text-white border-gray-300 dark:border-zinc-600 focus:ring-blue-500 focus:border-blue-500"
        >
            {options.map(opt => (
                <option key={typeof opt === 'object' ? opt.value : opt} value={typeof opt === 'object' ? opt.value : opt}>
                    {typeof opt === 'object' ? opt.label : opt}
                </option>
            ))}
        </select>
    </div>
);

// Reusable Report Table
const ReportTable = ({ title, headers, rows, filename }) => (
  <div className="bg-gray-200 dark:bg-zinc-800 p-4 rounded-lg shadow-sm overflow-x-auto">
    <div className="flex justify-between items-center mb-3">
      <h3 className="font-semibold text-gray-800 dark:text-white">{title}</h3>
      <button
        onClick={() => downloadCustomCSV(headers, rows, filename)}
        className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50 hover:bg-blue-700 transition-colors"
        disabled={!rows.length}
      >
        Download
      </button>
    </div>
    {rows.length > 0 ? (
      <div className="max-h-80 overflow-y-auto">
        <table className="w-full text-sm min-w-[300px]">
          <thead className="sticky top-0 bg-gray-200 dark:bg-zinc-800">
            <tr className="border-b-2 border-gray-300 dark:border-gray-600">
              {headers.map(h => <th key={h.key} className="p-2 text-left font-semibold">{h.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b dark:border-gray-700 last:border-b-0">
                {headers.map(h => <td key={h.key} className="p-2 whitespace-nowrap">{h.key === 'month' ? ymLabel(r[h.key]) : r[h.key]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="text-center text-gray-500 dark:text-gray-400 py-4">No data for selected filters.</p>
    )}
  </div>
);

export default Overview;
