import axios from 'axios';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';

const MONTHS = [
  { label: 'January', value: '01' },
  { label: 'February', value: '02' },
  { label: 'March', value: '03' },
  { label: 'April', value: '04' },
  { label: 'May', value: '05' },
  { label: 'June', value: '06' },
  { label: 'July', value: '07' },
  { label: 'August', value: '08' },
  { label: 'September', value: '09' },
  { label: 'October', value: '10' },
  { label: 'November', value: '11' },
  { label: 'December', value: '12' },
];

const ymLabel = (ym) => {
  const d = new Date(`${ym}-01`);
  return isNaN(d) ? ym : d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const sortYM = (a, b) => a.localeCompare(b);

// Address parsing helper
const parsePlaceDetails = (components = [], formattedAddress = '') => {
  const extractComponent = (components, types) =>
    components.find((c) => types.some((type) => c.types.includes(type)))?.long_name || '';

  const provinceTypes = ['administrative_area_level_1'];
  const districtTypes = ['administrative_area_level_2', 'administrative_area_level_1'];

  const province = extractComponent(components, provinceTypes);
  const district = extractComponent(components, districtTypes) || formattedAddress.split(',')[0].trim() || 'Not Available';

  return { province, district };
};

// ---- Helpers to filter and aggregate ----
const filterByYearMonthProvinceDistrict = (photos, yearSel, monthSel, provinceSel, districtSel) => {
  if (yearSel === 'All' && monthSel === 'All' && provinceSel === 'All' && districtSel === 'All') return photos;
  return photos.filter((p) => {
    const d = new Date(p.timestamp);
    if (isNaN(d)) return false;
    const y = String(d.getFullYear());
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const province = p.province || 'Not Available';
    const district = p.district || 'Not Available';
    if (yearSel !== 'All' && y !== yearSel) return false;
    if (monthSel !== 'All' && m !== monthSel) return false;
    if (provinceSel !== 'All' && province !== provinceSel) return false;
    if (districtSel !== 'All' && district !== districtSel) return false;
    return true;
  });
};

const computeMonthly = (photos) => {
  const map = new Map();
  for (const p of photos) {
    const d = new Date(p.timestamp);
    if (isNaN(d)) continue;
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    map.set(ym, (map.get(ym) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => sortYM(a.month, b.month));
};

const computeYMProvinceDistrictRows = (photos) => {
  const grouped = {};
  for (const p of photos) {
    const d = new Date(p.timestamp);
    if (isNaN(d)) continue;
    const y = d.getFullYear();
    const mName = d.toLocaleDateString('en-US', { month: 'long' });
    const province = p.province || 'Not Available';
    const district = p.district || 'Not Available';

    grouped[y] ??= {};
    grouped[y][mName] ??= {};
    grouped[y][mName][province] ??= {};
    grouped[y][mName][province][district] ??= 0;
    grouped[y][mName][province][district] += 1;
  }

  // Transform into pivot table structure
  const pivotData = [];
  Object.keys(grouped)
    .sort((a, b) => a - b)
    .forEach((y) => {
      const months = [];
      Object.keys(grouped[y])
        .sort((a, b) => new Date(`${a} 1, 2000`).getMonth() - new Date(`${b} 1, 2000`).getMonth())
        .forEach((m) => {
          const details = [];
          Object.keys(grouped[y][m])
            .sort()
            .forEach((p) => {
              Object.keys(grouped[y][m][p])
                .sort()
                .forEach((d) => {
                  details.push({
                    Province: p,
                    District: d,
                    TotalImages: grouped[y][m][p][d],
                  });
                });
            });
          months.push({ Month: m, Details: details, TotalImages: details.reduce((sum, d) => sum + d.TotalImages, 0) });
        });
      pivotData.push({ Year: y, Months: months, TotalImages: months.reduce((sum, m) => sum + m.TotalImages, 0) });
    });
  return pivotData;
};

const exportMonthlyExcel = (title, monthly) => {
  if (!monthly.length) return alert('No monthly data to export.');
  const ws = XLSX.utils.json_to_sheet(monthly.map((r) => ({ Month: ymLabel(r.month), 'Total Images': r.count })));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Monthly');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([buf], { type: 'application/octet-stream' }), `Image_Monthly_${title.replace(/[^a-zA-Z0-9._-]/g, '_')}.xlsx`);
};

const exportYMProvinceDistrictExcel = (title, pivotData) => {
  if (!pivotData.length) return alert('No Year-Month-Province-District data to export.');
  const flatRows = [];
  pivotData.forEach((yearData) => {
    yearData.Months.forEach((monthData) => {
      monthData.Details.forEach((detail) => {
        flatRows.push({
          Year: yearData.Year,
          Month: monthData.Month,
          Province: detail.Province,
          District: detail.District,
          'Total Images': detail.TotalImages,
        });
      });
    });
  });
  const ws = XLSX.utils.json_to_sheet(flatRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Year-Month-Province-District');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([buf], { type: 'application/octet-stream' }), `Image_Summary_${title.replace(/[^a-zA-Z0-9._-]/g, '_')}.xlsx`);
};

// ======= Reusable Email Section =======
const EmailSection = ({ title, photos, yearSel, monthSel, provinceSel, districtSel }) => {
  const filtered = useMemo(() => filterByYearMonthProvinceDistrict(photos, yearSel, monthSel, provinceSel, districtSel), [
    photos,
    yearSel,
    monthSel,
    provinceSel,
    districtSel,
  ]);
  const monthly = useMemo(() => computeMonthly(filtered), [filtered]);
  const pivotData = useMemo(() => computeYMProvinceDistrictRows(filtered), [filtered]);

  const total = filtered.length;
  const peak = monthly.reduce((best, r) => (r.count > (best?.count || 0) ? r : best), null);
  const uniqueProvinces = [...new Set(filtered.map((p) => p.province || 'Not Available'))].sort();
  const uniqueDistricts = [...new Set(filtered.map((p) => p.district || 'Not Available'))].sort();

  const [expandedYears, setExpandedYears] = useState({});
  const [expandedMonths, setExpandedMonths] = useState({});

  const toggleYear = (year) => {
    setExpandedYears((prev) => ({ ...prev, [year]: !prev[year] }));
  };

  const toggleMonth = (year, month) => {
    setExpandedMonths((prev) => ({ ...prev, [`${year}-${month}`]: !prev[`${year}-${month}`] }));
  };

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 rounded-xl shadow-md bg-gray-200 dark:bg-zinc-800 transition-colors duration-300 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">
            {title}{' '}
            {yearSel !== 'All' || monthSel !== 'All' || provinceSel !== 'All' || districtSel !== 'All'
              ? `— ${yearSel !== 'All' ? yearSel : 'All Years'}${
                  monthSel !== 'All' ? `, ${MONTHS.find((m) => m.value === monthSel)?.label}` : ''
                }${provinceSel !== 'All' ? `, ${provinceSel}` : ''}${districtSel !== 'All' ? `, ${districtSel}` : ''}`
              : ''}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => exportMonthlyExcel(title, monthly)}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Download Monthly (.xlsx)
            </button>
            <button
              onClick={() => exportYMProvinceDistrictExcel(title, pivotData)}
              className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 text-sm"
            >
              Download Year-Month-Province-District (.xlsx)
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="rounded-lg p-4 bg-gray-100 dark:bg-zinc-900/50">
            <div className="text-sm text-gray-600 dark:text-gray-300">Total Images</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{total}</div>
          </div>
          <div className="rounded-lg p-4 bg-gray-100 dark:bg-zinc-900/50">
            <div className="text-sm text-gray-600 dark:text-gray-300">Peak Month</div>
            <div className="text-base font-semibold text-gray-900 dark:text-white">
              {peak ? `${ymLabel(peak.month)} (${peak.count})` : '—'}
            </div>
          </div>
          <div className="rounded-lg p-4 bg-gray-100 dark:bg-zinc-900/50">
            <div className="text-sm text-gray-600 dark:text-gray-300">Distinct Provinces</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{uniqueProvinces.length}</div>
          </div>
          <div className="rounded-lg p-4 bg-gray-100 dark:bg-zinc-900/50">
            <div className="text-sm text-gray-600 dark:text-gray-300">Distinct Districts</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{uniqueDistricts.length}</div>
          </div>
        </div>

        {/* Chart */}
        <div className="w-full h-[280px] sm:h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
              <XAxis dataKey="month" stroke="currentColor" tickFormatter={(m) => ymLabel(m)} />
              <YAxis allowDecimals={false} stroke="currentColor" />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', color: '#fff' }}
                labelStyle={{ color: '#fff' }}
                formatter={(v, name) => [v, name === 'count' ? 'Total Images' : name]}
                labelFormatter={(label) => ymLabel(label)}
              />
              <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-300 dark:border-zinc-700">
          <table className="w-full border-collapse text-sm sm:text-base">
            <thead>
              <tr className="bg-gray-300 dark:bg-zinc-700 text-gray-900 dark:text-white">
                <th className="py-2 px-4 border">Month</th>
                <th className="py-2 px-4 border">Total Images</th>
              </tr>
            </thead>
            <tbody>
              {monthly.map((r, i) => (
                <tr
                  key={i}
                  className="text-center odd:bg-gray-100 even:bg-gray-200 dark:odd:bg-zinc-800 dark:even:bg-zinc-900"
                >
                  <td className="py-2 px-4 border">{ymLabel(r.month)}</td>
                  <td className="py-2 px-4 border">{r.count}</td>
                </tr>
              ))}
              {!monthly.length && (
                <tr>
                  <td className="py-3 px-4 border text-center" colSpan={2}>
                    No data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Year-Month-Province-District Pivot Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-300 dark:border-zinc-700">
          <table className="w-full border-collapse text-sm sm:text-base">
            <thead>
              <tr className="bg-gray-300 dark:bg-zinc-700 text-gray-900 dark:text-white">
                <th className="py-2 px-4 border">Year</th>
                <th className="py-2 px-4 border">Month</th>
                <th className="py-2 px-4 border">Province</th>
                <th className="py-2 px-4 border">District</th>
                <th className="py-2 px-4 border">Total Images</th>
              </tr>
            </thead>
            <tbody>
              {pivotData.length === 0 && (
                <tr>
                  <td className="py-3 px-4 border text-center" colSpan={5}>
                    No data
                  </td>
                </tr>
              )}
              {pivotData.map((yearData) => (
                <React.Fragment key={yearData.Year}>
                  <tr className="text-center bg-gray-100 dark:bg-zinc-800">
                    <td className="py-2 px-4 border flex items-center justify-center">
                      <button
                        onClick={() => toggleYear(yearData.Year)}
                        className="mr-2 focus:outline-none"
                        aria-label={expandedYears[yearData.Year] ? `Collapse ${yearData.Year}` : `Expand ${yearData.Year}`}
                      >
                        {expandedYears[yearData.Year] ? <FaChevronDown /> : <FaChevronRight />}
                      </button>
                      {yearData.Year} ({yearData.TotalImages})
                    </td>
                    <td className="py-2 px-4 border"></td>
                    <td className="py-2 px-4 border"></td>
                    <td className="py-2 px-4 border"></td>
                    <td className="py-2 px-4 border"></td>
                  </tr>
                  {expandedYears[yearData.Year] &&
                    yearData.Months.map((monthData) => (
                      <React.Fragment key={`${yearData.Year}-${monthData.Month}`}>
                        <tr className="text-center bg-gray-150 dark:bg-zinc-850">
                          <td className="py-2 px-4 border"></td>
                          <td className="py-2 px-4 border flex items-center justify-center">
                            <button
                              onClick={() => toggleMonth(yearData.Year, monthData.Month)}
                              className="mr-2 focus:outline-none"
                              aria-label={
                                expandedMonths[`${yearData.Year}-${monthData.Month}`]
                                  ? `Collapse ${monthData.Month}`
                                  : `Expand ${monthData.Month}`
                              }
                            >
                              {expandedMonths[`${yearData.Year}-${monthData.Month}`] ? <FaChevronDown /> : <FaChevronRight />}
                            </button>
                            {monthData.Month} ({monthData.TotalImages})
                          </td>
                          <td className="py-2 px-4 border"></td>
                          <td className="py-2 px-4 border"></td>
                          <td className="py-2 px-4 border"></td>
                        </tr>
                        {expandedMonths[`${yearData.Year}-${monthData.Month}`] &&
                          monthData.Details.map((detail, idx) => (
                            <tr
                              key={`${yearData.Year}-${monthData.Month}-${detail.Province}-${detail.District}-${idx}`}
                              className="text-center odd:bg-gray-100 even:bg-gray-200 dark:odd:bg-zinc-800 dark:even:bg-zinc-900"
                            >
                              <td className="py-2 px-4 border"></td>
                              <td className="py-2 px-4 border"></td>
                              <td className="py-2 px-4 border">{detail.Province}</td>
                              <td className="py-2 px-4 border">{detail.District}</td>
                              <td className="py-2 px-4 border">{detail.TotalImages}</td>
                            </tr>
                          ))}
                      </React.Fragment>
                    ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ======= Main Overview Component =======
const Overview = () => {
  const [users, setUsers] = useState([]);
  const [serverMonthlyStats, setServerMonthlyStats] = useState([]);
  const [firstEmailPhotos, setFirstEmailPhotos] = useState([]);
  const [secondEmailPhotos, setSecondEmailPhotos] = useState([]);
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedProvince, setSelectedProvince] = useState('All');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const geocodeCache = React.useRef(new Map());
  const MAX_CACHE_SIZE = 1000;

  // Fetch place details with retry logic
  const fetchPlaceDetails = useCallback(async (latitude, longitude, retries = 3) => {
    const cacheKey = `${latitude},${longitude}`;
    if (geocodeCache.current.has(cacheKey)) return geocodeCache.current.get(cacheKey);
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
          params: { latlng: `${latitude},${longitude}`, key: import.meta.env.VITE_GEOCODING_API_KEY },
        });
        if (res.data.status === 'OK' && res.data.results.length > 0) {
          const parsed = parsePlaceDetails(
            res.data.results[0].address_components || [],
            res.data.results[0].formatted_address || ''
          );
          if (geocodeCache.current.size >= MAX_CACHE_SIZE) {
            geocodeCache.current.clear();
          }
          geocodeCache.current.set(cacheKey, parsed);
          return parsed;
        } else if (res.data.status === 'OVER_QUERY_LIMIT') {
          if (attempt === retries) {
            return { province: 'Not Available', district: 'Not Available' };
          }
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        } else {
          return { province: 'Not Available', district: 'Not Available' };
        }
      } catch (error) {
        console.error(`Geocoding attempt ${attempt} failed:`, error);
        if (attempt === retries) {
          return { province: 'Not Available', district: 'Not Available' };
        }
      }
    }
  }, []);

  // APIs
  const getUsers = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/users/`);
      if (res.status === 200) setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const getMonthlyStatsServer = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get-image-by-month`);
      if (res.status === 200) {
        const formatted = (res.data?.stats || []).map((item) => ({
          month: item._id,
          count: item.count,
        }));
        setServerMonthlyStats(formatted);
      }
    } catch (err) {
      console.error('Failed to fetch image stats:', err);
    }
  };

  const fetchFirstEmail = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get1stEmailPhotos`);
      const photos = res.data || [];
      const enrichedPhotos = await Promise.all(
        photos.map(async (photo) => {
          if (photo.latitude && photo.longitude && (!photo.province || !photo.district || photo.district === 'Unknown')) {
            const { province, district } = await fetchPlaceDetails(photo.latitude, photo.longitude);
            return { ...photo, province, district };
          }
          return { ...photo, province: photo.province || 'Not Available', district: photo.district || 'Not Available' };
        })
      );
      return enrichedPhotos;
    } catch (err) {
      console.error('Failed to fetch first email photos:', err);
      return [];
    }
  };

  const fetchSecondEmail = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/photos/get2ndEmailPhotos`);
      const photos = res.data || [];
      const enrichedPhotos = await Promise.all(
        photos.map(async (photo) => {
          if (photo.latitude && photo.longitude && (!photo.province || !photo.district || photo.district === 'Unknown')) {
            const { province, district } = await fetchPlaceDetails(photo.latitude, photo.longitude);
            return { ...photo, province, district };
          }
          return { ...photo, province: photo.province || 'Not Available', district: photo.district || 'Not Available' };
        })
      );
      return enrichedPhotos;
    } catch (err) {
      console.error('Failed to fetch second email photos:', err);
      return [];
    }
  };

  useEffect(() => {
    getUsers();
    getMonthlyStatsServer();
    (async () => {
      try {
        const [p1, p2] = await Promise.all([fetchFirstEmail(), fetchSecondEmail()]);
        setFirstEmailPhotos(p1);
        setSecondEmailPhotos(p2);
      } catch (e) {
        console.error('Failed to fetch per-email photos:', e);
      }
    })();
  }, []);

  // Available years, provinces, and districts
  const availableYears = useMemo(() => {
    const years = new Set();
    const add = (arr) => {
      for (const p of arr) {
        const d = new Date(p.timestamp);
        if (!isNaN(d)) years.add(String(d.getFullYear()));
      }
    };
    add(firstEmailPhotos);
    add(secondEmailPhotos);
    for (const m of serverMonthlyStats) {
      const y = m.month?.split('-')?.[0];
      if (y) years.add(String(y));
    }
    return ['All', ...Array.from(years).sort()];
  }, [firstEmailPhotos, secondEmailPhotos, serverMonthlyStats]);

  const availableProvinces = useMemo(() => {
    const provinces = new Set();
    firstEmailPhotos.forEach((p) => provinces.add(p.province || 'Not Available'));
    secondEmailPhotos.forEach((p) => provinces.add(p.province || 'Not Available'));
    return ['All', ...Array.from(provinces).sort()];
  }, [firstEmailPhotos, secondEmailPhotos]);

  const availableDistricts = useMemo(() => {
    const districts = new Set();
    firstEmailPhotos.forEach((p) => districts.add(p.district || 'Not Available'));
    secondEmailPhotos.forEach((p) => districts.add(p.district || 'Not Available'));
    return ['All', ...Array.from(districts).sort()];
  }, [firstEmailPhotos, secondEmailPhotos]);

  // Filter server-wide monthly stats
  const serverMonthlyFiltered = useMemo(() => {
    if (selectedYear === 'All' && selectedMonth === 'All') return serverMonthlyStats;
    return serverMonthlyStats.filter((row) => {
      const [y, m] = (row.month || '').split('-');
      if (!y || !m) return false;
      if (selectedYear !== 'All' && y !== selectedYear) return false;
      if (selectedMonth !== 'All' && m !== selectedMonth) return false;
      return true;
    });
  }, [serverMonthlyStats, selectedYear, selectedMonth]);

  // Extract unique emails
  const uniqueEmails = useMemo(() => {
    const emails = new Set();
    firstEmailPhotos.forEach((p) => emails.add(p.uploadedBy || 'Not Available'));
    secondEmailPhotos.forEach((p) => emails.add(p.uploadedBy || 'Not Available'));
    return ['All', ...Array.from(emails).sort()];
  }, [firstEmailPhotos, secondEmailPhotos]);

  // Aggregate photos by email
  const photosByEmail = useMemo(() => {
    const map = {};
    uniqueEmails.forEach((email) => {
      if (email === 'All') {
        map[email] = [...firstEmailPhotos, ...secondEmailPhotos];
      } else {
        map[email] = [
          ...firstEmailPhotos.filter((p) => p.uploadedBy === email),
          ...secondEmailPhotos.filter((p) => p.uploadedBy === email),
        ];
      }
    });
    return map;
  }, [firstEmailPhotos, secondEmailPhotos, uniqueEmails]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Users & Filters */}
      <div className="w-full">
        <div className="flex flex-col gap-4 py-5 px-4 rounded-lg dark:bg-zinc-800 bg-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-roboto uppercase text-gray-800 dark:text-white">
              Total Users ({users.length})
            </h1>
            <Link
              to="/dashboard/Requests/Permissions-Users"
              className="text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-800 dark:hover:text-blue-300 text-sm sm:text-base"
            >
              View Users
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="flex flex-col">
              <label className="text-sm mb-1 text-gray-700 dark:text-gray-200">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="rounded-md px-3 py-2 bg-white dark:bg-zinc-900 border dark:border-zinc-700"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm mb-1 text-gray-700 dark:text-gray-200">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-md px-3 py-2 bg-white dark:bg-zinc-900 border dark:border-zinc-700"
              >
                <option value="All">All</option>
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm mb-1 text-gray-700 dark:text-gray-200">Province</label>
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="rounded-md px-3 py-2 bg-white dark:bg-zinc-900 border dark:border-zinc-700"
              >
                {availableProvinces.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm mb-1 text-gray-700 dark:text-gray-200">District</label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="rounded-md px-3 py-2 bg-white dark:bg-zinc-900 border dark:border-zinc-700"
              >
                {availableDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Server-wide Monthly Stats */}
      <div className="w-full">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 rounded-xl shadow-md bg-gray-200 dark:bg-zinc-800 transition-colors duration-300">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-white">
            Images Fetched Per Month (All Users){' '}
            {selectedYear !== 'All' || selectedMonth !== 'All'
              ? `— ${selectedYear !== 'All' ? selectedYear : 'All Years'}${
                  selectedMonth !== 'All' ? `, ${MONTHS.find((m) => m.value === selectedMonth)?.label}` : ''
                }`
              : ''}
          </h2>
          <div className="w-full h-[280px] sm:h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={serverMonthlyFiltered}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                <XAxis dataKey="month" stroke="currentColor" tickFormatter={(month) => ymLabel(month)} />
                <YAxis allowDecimals={false} stroke="currentColor" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', color: '#fff' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value, name) => [value, name === 'count' ? 'Total Images' : name]}
                  labelFormatter={(label) => ymLabel(label)}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Email-based Sections */}
      {uniqueEmails.map((email) => (
        <EmailSection
          key={email}
          title={email === 'All' ? 'All Emails' : `Email: ${email}`}
          photos={photosByEmail[email] || []}
          yearSel={selectedYear}
          monthSel={selectedMonth}
          provinceSel={selectedProvince}
          districtSel={selectedDistrict}
        />
      ))}
    </div>
  );
};

export default Overview;