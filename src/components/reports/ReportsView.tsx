import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  reportApi, 
  ReportFilter, 
  WeighingReportItem, 
  ReportSummary 
} from '../../services/reportApi';
import { 
  BarChart3, 
  Truck, 
  Scale, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Calendar, 
  FileSpreadsheet, 
  Eye, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  X,
  FileText
} from 'lucide-react';
import { formatWeight } from '../../utils/formatters';

export const ReportsView: React.FC = () => {
  // Filter States
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const todayStr = now.toISOString().split('T')[0];

  const [tuNgay, setTuNgay] = useState<string>(firstDayOfMonth);
  const [denNgay, setDenNgay] = useState<string>(todayStr);
  const [nghiepVu, setNghiepVu] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pageIndex, setPageIndex] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Data States
  const [loading, setLoading] = useState<boolean>(false);
  const [summary, setSummary] = useState<ReportSummary>({
    tongLuotCan: 0,
    tongSanLuongNet: 0,
    tongNhapNet: 0,
    tongXuatNet: 0,
    totalCount: 0,
    items: [],
  });

  // Selected item for Detail Modal
  const [selectedTicket, setSelectedTicket] = useState<WeighingReportItem | null>(null);

  // Fetch report data
  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const filters: ReportFilter = {
        tuNgay: tuNgay || undefined,
        denNgay: denNgay || undefined,
        nghiepVu: nghiepVu !== 'Tất cả' ? nghiepVu : undefined,
        pageIndex,
        pageSize,
      };

      if (searchQuery.trim()) {
        filters.bienSoXe = searchQuery.trim();
        filters.khachHang = searchQuery.trim();
        filters.hangHoa = searchQuery.trim();
      }

      const res = await reportApi.getWeighingReport(filters);
      setSummary(res);
    } catch (err) {
      console.error('Lỗi khi tải báo cáo:', err);
    } finally {
      setLoading(false);
    }
  }, [tuNgay, denNgay, nghiepVu, searchQuery, pageIndex, pageSize]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Quick Preset Handlers
  const handlePresetToday = () => {
    setTuNgay(todayStr);
    setDenNgay(todayStr);
    setPageIndex(1);
  };

  const handlePreset7Days = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    setTuNgay(d.toISOString().split('T')[0]);
    setDenNgay(todayStr);
    setPageIndex(1);
  };

  const handlePresetThisMonth = () => {
    setTuNgay(firstDayOfMonth);
    setDenNgay(todayStr);
    setPageIndex(1);
  };

  // Export CSV / Excel with UTF-8 BOM
  const handleExportExcel = () => {
    const items = summary.items;
    if (!items || items.length === 0) {
      alert('Không có dữ liệu để xuất file.');
      return;
    }

    const headers = [
      'STT',
      'Số Phiếu',
      'Ngày Giờ Cân',
      'Biển Số Xe',
      'Lái Xe',
      'Khách Hàng / Đối Tác',
      'Hàng Hóa',
      'Loại Nghiệp Vụ',
      'Tổng (Gross - Tấn)',
      'Bì (Tare - Tấn)',
      'Hàng (Net - Tấn)',
      'Người Cân',
      'Trạng Thái'
    ];

    const rows = items.map((it, idx) => [
      idx + 1 + (pageIndex - 1) * pageSize,
      `"${it.soPhieu}"`,
      `"${new Date(it.ngayGioCan).toLocaleString('vi-VN')}"`,
      `"${it.bienSoXe}"`,
      `"${it.laiXe}"`,
      `"${it.khachHang}"`,
      `"${it.hangHoa}"`,
      `"${it.nghiepVu}"`,
      it.khoiLuongGross.toFixed(2),
      it.khoiLuongTare.toFixed(2),
      it.khoiLuongNet.toFixed(2),
      `"${it.nguoiCan}"`,
      `"${it.trangThai}"`
    ]);

    // Summary row
    rows.push([
      'TỔNG CỘNG',
      `"${summary.tongLuotCan} lượt"`,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      summary.tongSanLuongNet.toFixed(2),
      '',
      ''
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateFormatted = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    a.download = `BaoCao_TramCan_${dateFormatted}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  // Total pages
  const totalPages = Math.max(1, Math.ceil(summary.totalCount / pageSize));

  // Operation Badge Styling
  const getOperationBadge = (op: string) => {
    if (op.includes('Nhập')) {
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';
    }
    if (op.includes('Xuất')) {
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
    }
    if (op.includes('Nội bộ')) {
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-industrial-800 dark:text-slate-300 dark:border-industrial-700';
  };

  return (
    <div className="space-y-4">
      {/* =========================================================================
          PRINT HEADER (Visible ONLY on window.print)
          ========================================================================= */}
      <div className="hidden print:block mb-6 text-center border-b pb-4">
        <h2 className="text-xl font-bold uppercase tracking-wider text-black">
          TRẠM CÂN ĐIỆN TỬ CÔNG NGHIỆP & KIỂM SOÁT CỔNG
        </h2>
        <h1 className="text-2xl font-black text-black mt-1">
          BÁO CÁO NHẬT KÝ CÂN XE & TỔNG HỢP SẢN LƯỢNG
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Khoảng thời gian: Từ ngày <b>{tuNgay}</b> đến ngày <b>{denNgay}</b> | Nghiệp vụ: <b>{nghiepVu}</b>
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          Thời điểm in: {new Date().toLocaleString('vi-VN')} | Đơn vị tính: Tấn
        </p>
      </div>

      {/* =========================================================================
          1. FILTER BAR (Screen only)
          ========================================================================= */}
      <div className="print:hidden bg-white dark:bg-industrial-900 border border-slate-200 dark:border-industrial-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Date Picker Group */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-500" />
              <span>Thời gian:</span>
            </span>

            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={tuNgay}
                onChange={(e) => {
                  setTuNgay(e.target.value);
                  setPageIndex(1);
                }}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-industrial-700 bg-slate-50 dark:bg-industrial-950 text-industrial-900 dark:text-white font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <span className="text-xs text-slate-400 font-bold">-</span>
              <input
                type="date"
                value={denNgay}
                onChange={(e) => {
                  setDenNgay(e.target.value);
                  setPageIndex(1);
                }}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-industrial-700 bg-slate-50 dark:bg-industrial-950 text-industrial-900 dark:text-white font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1 pl-1">
              <button
                type="button"
                onClick={handlePresetToday}
                className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 dark:border-industrial-700 bg-white dark:bg-industrial-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-industrial-700 transition"
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={handlePreset7Days}
                className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 dark:border-industrial-700 bg-white dark:bg-industrial-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-industrial-700 transition"
              >
                7 ngày qua
              </button>
              <button
                type="button"
                onClick={handlePresetThisMonth}
                className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 dark:border-industrial-700 bg-white dark:bg-industrial-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-industrial-700 transition"
              >
                Tháng này
              </button>
            </div>
          </div>

          {/* Action Buttons: Export & Print */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition active:scale-95"
              title="Xuất file CSV mở trên Excel chuẩn UTF-8 tiếng Việt"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Excel</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-industrial-800 hover:bg-slate-200 dark:hover:bg-industrial-700 border border-slate-200 dark:border-industrial-700 rounded-lg shadow-sm transition active:scale-95"
              title="In bảng kê báo cáo chuẩn A4 ngang"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Báo Cáo</span>
            </button>
          </div>
        </div>

        {/* Second Row: Operations Dropdown + Search Box */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-industrial-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              <span>Nghiệp vụ:</span>
            </span>
            <select
              value={nghiepVu}
              onChange={(e) => {
                setNghiepVu(e.target.value);
                setPageIndex(1);
              }}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-industrial-700 bg-slate-50 dark:bg-industrial-950 text-industrial-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="Tất cả">Tất cả nghiệp vụ</option>
              <option value="Nhập hàng">Nhập hàng</option>
              <option value="Xuất hàng">Xuất hàng</option>
              <option value="Nội bộ">Vận chuyển nội bộ</option>
              <option value="Cân dịch vụ">Cân dịch vụ</option>
            </select>
          </div>

          <div className="relative flex-1 sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setPageIndex(1)}
              placeholder="Nhập biển số xe, khách hàng hoặc tên hàng hóa..."
              className="w-full pl-9 pr-20 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-industrial-950 border border-slate-300 dark:border-industrial-700 text-industrial-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                setPageIndex(1);
                fetchReport();
              }}
              className="absolute right-1 top-1 bottom-1 px-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold transition flex items-center gap-1"
            >
              <Search className="w-3 h-3" />
              <span>Lọc</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. 4 METRIC KPI CARDS
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Tổng Lượt Cân */}
        <div className="bg-white dark:bg-industrial-900 border border-slate-200 dark:border-industrial-800 rounded-xl p-3.5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tổng Lượt Cân
            </span>
            <div className="text-2xl font-black font-mono text-industrial-900 dark:text-white mt-1">
              {summary.tongLuotCan.toLocaleString('vi-VN')}{' '}
              <span className="text-xs font-sans font-semibold text-slate-500">Lượt</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Đã ghi nhận vào SQL Server
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-industrial-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Tổng Sản Lượng Net */}
        <div className="bg-white dark:bg-industrial-900 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-3.5 shadow-sm flex items-center justify-between bg-gradient-to-br from-emerald-50/40 to-transparent dark:from-emerald-950/20">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Tổng Khối Lượng Net
            </span>
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {summary.tongSanLuongNet.toLocaleString('vi-VN', { minimumFractionDigits: 2 })}{' '}
              <span className="text-xs font-sans font-semibold">Tấn</span>
            </div>
            <div className="text-[10px] text-emerald-600/70 dark:text-emerald-400/60 mt-0.5">
              Hàng hóa thực xuất/nhập tịnh
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Tổng Nhập */}
        <div className="bg-white dark:bg-industrial-900 border border-blue-200 dark:border-blue-900/50 rounded-xl p-3.5 shadow-sm flex items-center justify-between bg-gradient-to-br from-blue-50/40 to-transparent dark:from-blue-950/20">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Tổng Hàng Nhập
            </span>
            <div className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400 mt-1">
              {summary.tongNhapNet.toLocaleString('vi-VN', { minimumFractionDigits: 2 })}{' '}
              <span className="text-xs font-sans font-semibold">Tấn</span>
            </div>
            <div className="text-[10px] text-blue-600/70 dark:text-blue-400/60 mt-0.5">
              Nguyên liệu vào trạm
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ArrowDownToLine className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Tổng Xuất */}
        <div className="bg-white dark:bg-industrial-900 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3.5 shadow-sm flex items-center justify-between bg-gradient-to-br from-amber-50/40 to-transparent dark:from-amber-950/20">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Tổng Hàng Xuất
            </span>
            <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1">
              {summary.tongXuatNet.toLocaleString('vi-VN', { minimumFractionDigits: 2 })}{' '}
              <span className="text-xs font-sans font-semibold">Tấn</span>
            </div>
            <div className="text-[10px] text-amber-600/70 dark:text-amber-400/60 mt-0.5">
              Thành phẩm rời trạm
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <ArrowUpFromLine className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. DETAILED WEIGHING DATA TABLE
          ========================================================================= */}
      <div className="bg-white dark:bg-industrial-900 border border-slate-200 dark:border-industrial-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-3.5 border-b border-slate-200 dark:border-industrial-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-industrial-900 dark:text-white">
              Bảng Kê Nhật Ký Cân Xe Chi Tiết ({summary.totalCount} Bản Ghi)
            </h3>
          </div>
          {loading && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Đang tải dữ liệu...</span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-industrial-950 border-b border-slate-200 dark:border-industrial-800 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                <th className="py-2.5 px-3 text-center w-12">STT</th>
                <th className="py-2.5 px-3">Số Phiếu</th>
                <th className="py-2.5 px-3">Ngày Giờ</th>
                <th className="py-2.5 px-3">Biển Số Xe</th>
                <th className="py-2.5 px-3">Khách Hàng / Đối Tác</th>
                <th className="py-2.5 px-3">Hàng Hóa</th>
                <th className="py-2.5 px-3 text-center">Nghiệp Vụ</th>
                <th className="py-2.5 px-3 text-right">Tổng (Gross)</th>
                <th className="py-2.5 px-3 text-right">Bì (Tare)</th>
                <th className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400">Hàng (Net)</th>
                <th className="py-2.5 px-3">Cân Viên</th>
                <th className="py-2.5 px-3 text-center print:hidden">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-industrial-800/80">
              {summary.items.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-industrial-700" />
                    Không tìm thấy dữ liệu cân nào trong khoảng thời gian đã chọn.
                  </td>
                </tr>
              ) : (
                summary.items.map((it, idx) => (
                  <tr 
                    key={it.soPhieu}
                    className="hover:bg-slate-50/80 dark:hover:bg-industrial-800/50 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                      {idx + 1 + (pageIndex - 1) * pageSize}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                      {it.soPhieu}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-mono text-[11px] whitespace-nowrap">
                      {new Date(it.ngayGioCan).toLocaleDateString('vi-VN')} {new Date(it.ngayGioCan).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-industrial-800 border border-slate-200 dark:border-industrial-700 text-industrial-900 dark:text-white">
                        {it.bienSoXe}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-industrial-900 dark:text-white max-w-xs truncate" title={it.khachHang}>
                      {it.khachHang}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 max-w-xs truncate" title={it.hangHoa}>
                      {it.hangHoa}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getOperationBadge(it.nghiepVu)}`}>
                        {it.nghiepVu}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                      {it.khoiLuongGross.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                      {it.khoiLuongTare.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {it.khoiLuongNet.toFixed(2)} T
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-[11px] truncate" title={it.nguoiCan}>
                      {it.nguoiCan}
                    </td>
                    <td className="py-2.5 px-3 text-center print:hidden">
                      <button
                        type="button"
                        onClick={() => setSelectedTicket(it)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-industrial-800 transition"
                        title="Xem chi tiết phiếu cân"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="print:hidden p-3 bg-slate-50 dark:bg-industrial-950 border-t border-slate-200 dark:border-industrial-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Hiển thị</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPageIndex(1);
              }}
              className="px-2 py-1 rounded border border-slate-300 dark:border-industrial-700 bg-white dark:bg-industrial-900 text-xs font-medium"
            >
              <option value={10}>10 dòng</option>
              <option value={20}>20 dòng</option>
              <option value={50}>50 dòng</option>
              <option value={100}>100 dòng</option>
            </select>
            <span>/ trang (Tổng số <b>{summary.totalCount}</b> lượt)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="mr-2">
              Trang <b>{pageIndex}</b> / <b>{totalPages}</b>
            </span>
            <button
              type="button"
              disabled={pageIndex <= 1}
              onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded border border-slate-300 dark:border-industrial-700 bg-white dark:bg-industrial-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-industrial-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={pageIndex >= totalPages}
              onClick={() => setPageIndex((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded border border-slate-300 dark:border-industrial-700 bg-white dark:bg-industrial-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-industrial-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          PRINT SIGNATURE BLOCK (Visible ONLY on window.print)
          ========================================================================= */}
      <div className="hidden print:grid grid-cols-3 gap-8 mt-12 text-center text-black pt-6">
        <div>
          <p className="font-bold text-sm">NGƯỜI LẬP BIỂU</p>
          <p className="text-xs text-gray-500 italic mt-0.5">(Ký, ghi rõ họ tên)</p>
          <div className="h-20" />
        </div>
        <div>
          <p className="font-bold text-sm">CÂN VIÊN TRỰC CA</p>
          <p className="text-xs text-gray-500 italic mt-0.5">(Ký, ghi rõ họ tên)</p>
          <div className="h-20" />
          <p className="font-bold text-xs">{summary.items[0]?.nguoiCan || 'Trần Văn Mạnh'}</p>
        </div>
        <div>
          <p className="font-bold text-sm">THỦ TRƯỞNG ĐƠN VỊ</p>
          <p className="text-xs text-gray-500 italic mt-0.5">(Ký, đóng dấu)</p>
          <div className="h-20" />
        </div>
      </div>

      {/* =========================================================================
          4. TICKET DETAIL MODAL
          ========================================================================= */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-industrial-900 border border-slate-200 dark:border-industrial-700 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-industrial-800 bg-slate-50 dark:bg-industrial-950">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <span className="font-bold text-base text-industrial-900 dark:text-white">
                  Chi Tiết Phiếu Cân #{selectedTicket.soPhieu}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-industrial-950 rounded-lg border border-slate-200 dark:border-industrial-800 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">Thời gian cân:</span>
                  <p className="font-mono font-bold text-industrial-900 dark:text-white mt-0.5">
                    {new Date(selectedTicket.ngayGioCan).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Biển số xe:</span>
                  <p className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm mt-0.5">
                    {selectedTicket.bienSoXe}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Lái xe:</span>
                  <p className="font-medium text-industrial-900 dark:text-white mt-0.5">
                    {selectedTicket.laiXe}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Loại nghiệp vụ:</span>
                  <p className="font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                    {selectedTicket.nghiepVu}
                  </p>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <span className="text-slate-400">Khách hàng / Đối tác:</span>
                <p className="font-bold text-industrial-900 dark:text-white text-sm">
                  {selectedTicket.khachHang}
                </p>
              </div>

              <div className="space-y-1 text-xs">
                <span className="text-slate-400">Hàng hóa vận chuyển:</span>
                <p className="font-bold text-industrial-900 dark:text-white text-sm">
                  {selectedTicket.hangHoa}
                </p>
              </div>

              {/* Weight Details */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-center">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Tổng (Gross)</span>
                  <p className="font-mono font-bold text-base text-industrial-900 dark:text-white mt-1">
                    {selectedTicket.khoiLuongGross.toFixed(2)} T
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Bì (Tare)</span>
                  <p className="font-mono font-bold text-base text-slate-600 dark:text-slate-300 mt-1">
                    {selectedTicket.khoiLuongTare.toFixed(2)} T
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase">Hàng (Net)</span>
                  <p className="font-mono font-black text-lg text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {selectedTicket.khoiLuongNet.toFixed(2)} T
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-industrial-800">
                <span>Cân viên thực hiện: <b>{selectedTicket.nguoiCan}</b></span>
                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{selectedTicket.trangThai}</span>
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 dark:bg-industrial-950 border-t border-slate-200 dark:border-industrial-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
