import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import CloudinaryOrganizer from "../components/CloudinaryOrganizer";

// -----------------------------
// Helpers
// -----------------------------
const MONTHS = [
  { label: "January", value: "01" },
  { label: "February", value: "02" },
  { label: "March", value: "03" },
  { label: "April", value: "04" },
  { label: "May", value: "05" },
  { label: "June", value: "06" },
  { label: "July", value: "07" },
  { label: "August", value: "08" },
  { label: "September", value: "09" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

// Format YYYY-MM into "Month Year"
const ymLabel = (ym) => {
  const d = new Date(`${ym}-01`);
  return isNaN(d)
    ? ym
    : d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

// CSV download
const downloadCustomCSV = (headers, rows, filename) => {
  if (!rows?.length) return;
  const headerLine = headers.join(",");
  const bodyLines = rows.map((r) =>
    headers.map((h) => (r[h] ?? "")).join(",")
  );
  const csv = [headerLine, ...bodyLines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

// Group helper
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
    keys.forEach((kk, i) => {
      obj[kk] = parts[i];
    });
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
  const [loading, setLoading] = useState(true);
  const [dailyAvailable, setDailyAvailable] = useState(true);

  // -----------------------------
  // API Calls
  // -----------------------------
  const getUsers = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/users/`);
      if (res.status === 200) setUsers(res.data || []);
    } catch (e) {
      console.error("getUsers failed", e);
    }
  };

  const getMonthlyStats = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/photos/get-image-by-month`
      );
      if (res.status === 200) {
        const stats = (res.data?.stats || res.data || []).map((item) => ({
          month: item.month || item._id?.month || item._id || "",
          uploadedBy: item.uploadedBy || item._id?.uploadedBy || "Unknown",
          count: item.count ?? item.total ?? 0,
        }));
        setMonthlyStats(stats);
        setUploaders([
          ...new Set(stats.map((s) => s.uploadedBy).filter(Boolean)),
        ]);
      }
    } catch (e) {
      console.error("getMonthlyStats failed", e);
    }
  };

  const getDailyStats = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/photos/get-image-by-day`
      );
      if (res.status === 200) {
        const stats = (res.data?.stats || res.data || []).map((item) => ({
          date: item.date || item._id?.date || item._id || "",
          uploadedBy: item.uploadedBy || item._id?.uploadedBy || "Unknown",
          count: item.count ?? item.total ?? 0,
        }));
        setDailyStats(stats);
        setDailyAvailable(true);
      } else {
        setDailyAvailable(false);
      }
    } catch (e) {
      setDailyAvailable(false);
      setDailyStats([]);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([getUsers(), getMonthlyStats(), getDailyStats()]);
      setLoading(false);
    })();
  }, []);

  // -----------------------------
  // Filters
  // -----------------------------
  const availableYears = useMemo(() => {
    const years = new Set();
    for (const m of monthlyStats) {
      const y = m.month?.split("-")?.[0];
      if (y) years.add(String(y));
    }
    return ["All", ...Array.from(years).sort()];
  }, [monthlyStats]);

  const uploaderOptions = useMemo(() => {
    return ["All", ...Array.from(new Set(uploaders))];
  }, [uploaders]);

  const baseFiltered = useMemo(() => {
    return monthlyStats.filter((row) => {
      const [y, m] = (row.month || "").split("-");
      if (!y || !m) return false;
      if (selectedYear !== "All" && y !== selectedYear) return false;
      if (selectedMonth !== "All" && m !== selectedMonth) return false;
      return true;
    });
  }, [monthlyStats, selectedYear, selectedMonth]);

  // -----------------------------
  // Chart data
  // -----------------------------
  const { chartData, seriesUploaders } = useMemo(() => {
    const months = Array.from(new Set(baseFiltered.map((r) => r.month))).sort();
    if (selectedUploader !== "All") {
      const filtered = baseFiltered
        .filter((r) => r.uploadedBy === selectedUploader)
        .map((r) => ({ month: r.month, count: r.count }));
      const filled = months.map((m) => {
        const rec = filtered.find((x) => x.month === m);
        return { month: m, count: rec ? rec.count : 0 };
      });
      return { chartData: filled, seriesUploaders: [selectedUploader] };
    }
    const uploadersSet = Array.from(
      new Set(baseFiltered.map((r) => r.uploadedBy))
    ).sort();
    const pivotRows = months.map((m) => {
      const row = { month: m };
      for (const u of uploadersSet) {
        const rec = baseFiltered.find(
          (x) => x.month === m && x.uploadedBy === u
        );
        row[u] = rec ? rec.count : 0;
      }
      return row;
    });
    return { chartData: pivotRows, seriesUploaders: uploadersSet };
  }, [baseFiltered, selectedUploader]);

  // -----------------------------
  // Reports
  // -----------------------------
  const reportMonthlyRows = useMemo(() => {
    return baseFiltered.map((r) => ({
      uploadedBy: r.uploadedBy,
      month: r.month,
      count: r.count,
    }));
  }, [baseFiltered]);

  const reportYearlyRows = useMemo(() => {
    const rows = baseFiltered.map((r) => ({
      uploadedBy: r.uploadedBy,
      year: (r.month || "").split("-")[0],
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
      if (selectedUploader !== "All" && row.uploadedBy !== selectedUploader)
        return false;
      return true;
    });
  }, [dailyStats, selectedYear, selectedMonth, selectedUploader]);

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Cloudinary Organizer */}
      <CloudinaryOrganizer />
      
      {/* Users */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-gray-200 dark:bg-zinc-800 p-4 rounded-lg">
        <h1 className="text-xl sm:text-2xl font-bold uppercase text-gray-800 dark:text-white text-center sm:text-left">
          Total Users ({users.length})
        </h1>
        <Link
          to="/dashboard/Requests/Permissions-Users"
          className="mt-2 sm:mt-0 text-blue-600 dark:text-blue-400 hover:underline text-center sm:text-right"
        >
          View Users
        </Link>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-gray-200 dark:bg-zinc-800 p-4 rounded-lg">
        <div>
          <label className="text-sm mb-1 block">Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="rounded-md px-3 py-2 w-full dark:bg-zinc-700 dark:text-white"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm mb-1 block">Month</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-md px-3 py-2 w-full dark:bg-zinc-700 dark:text-white"
          >
            <option value="All">All</option>
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm mb-1 block">Uploader</label>
          <select
            value={selectedUploader}
            onChange={(e) => setSelectedUploader(e.target.value)}
            className="rounded-md px-3 py-2 w-full dark:bg-zinc-700 dark:text-white"
          >
            {uploaderOptions.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-gray-200 dark:bg-zinc-800 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4 text-center sm:text-left">
          Images Per Month {selectedUploader === "All" ? "(by Uploader)" : `(${selectedUploader})`}
        </h2>
        {loading ? (
          <p className="text-center">Loading…</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={ymLabel} />
              <YAxis allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1f2937", color: "#fff", borderRadius: "0.5rem" }}
                formatter={(value, name) => [
                  value,
                  name === "count" ? "Total Images" : name,
                ]}
                labelFormatter={(label) => ymLabel(label)}
              />
              {selectedUploader === "All"
                ? seriesUploaders.map((u) => (
                    <Line key={u} type="monotone" dataKey={u} strokeWidth={3} dot />
                  ))
                : (
                  <Line type="monotone" dataKey="count" strokeWidth={3} dot />
                )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly */}
        <div className="bg-gray-200 dark:bg-zinc-800 p-4 rounded-lg overflow-x-auto">
          <div className="flex flex-col sm:flex-row justify-between mb-3 gap-2 items-center">
            <h3 className="font-semibold">By Month</h3>
            <button
              onClick={() => downloadCustomCSV(["uploadedBy", "month", "count"], reportMonthlyRows, "report_monthly.csv")}
              className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm"
            >
              ⬇️ Download
            </button>
          </div>
          <table className="w-full text-sm min-w-[300px]">
            <thead>
              <tr>
                <th className="p-2 text-left">Uploader</th>
                <th className="p-2 text-left">Month</th>
                <th className="p-2 text-left">Images</th>
              </tr>
            </thead>
            <tbody>
              {reportMonthlyRows.map((r, i) => (
                <tr key={i} className="border-b dark:border-gray-700">
                  <td className="p-2">{r.uploadedBy}</td>
                  <td className="p-2">{ymLabel(r.month)}</td>
                  <td className="p-2">{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Yearly */}
        <div className="bg-gray-200 dark:bg-zinc-800 p-4 rounded-lg overflow-x-auto">
          <div className="flex flex-col sm:flex-row justify-between mb-3 gap-2 items-center">
            <h3 className="font-semibold">By Year</h3>
            <button
              onClick={() => downloadCustomCSV(["uploadedBy", "year", "count"], reportYearlyRows, "report_yearly.csv")}
              className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm"
            >
              ⬇️ Download
            </button>
          </div>
          <table className="w-full text-sm min-w-[300px]">
            <thead>
              <tr>
                <th className="p-2 text-left">Uploader</th>
                <th className="p-2 text-left">Year</th>
                <th className="p-2 text-left">Images</th>
              </tr>
            </thead>
            <tbody>
              {reportYearlyRows.map((r, i) => (
                <tr key={i} className="border-b dark:border-gray-700">
                  <td className="p-2">{r.uploadedBy}</td>
                  <td className="p-2">{r.year}</td>
                  <td className="p-2">{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Daily */}
        <div className="bg-gray-200 dark:bg-zinc-800 p-4 rounded-lg overflow-x-auto">
          <div className="flex flex-col sm:flex-row justify-between mb-3 gap-2 items-center">
            <h3 className="font-semibold">By Day</h3>
            <button
              onClick={() => downloadCustomCSV(["uploadedBy", "date", "count"], reportDailyRows, "report_daily.csv")}
              className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm"
            >
              ⬇️ Download
            </button>
          </div>
          {dailyAvailable ? (
            <table className="w-full text-sm min-w-[300px]">
              <thead>
                <tr>
                  <th className="p-2 text-left">Uploader</th>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Images</th>
                </tr>
              </thead>
              <tbody>
                {reportDailyRows.map((r, i) => (
                  <tr key={i} className="border-b dark:border-gray-700">
                    <td className="p-2">{r.uploadedBy}</td>
                    <td className="p-2">{r.date}</td>
                    <td className="p-2">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-amber-600 text-center">Daily report API not available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overview;

