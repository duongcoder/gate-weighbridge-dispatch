import { api } from './api';

export interface ReportFilter {
  tuNgay?: string; // YYYY-MM-DD
  denNgay?: string; // YYYY-MM-DD
  nghiepVu?: string; // 'Tất cả' | 'Nhập hàng' | 'Xuất hàng' | 'Nội bộ' | 'Cân dịch vụ'
  khachHang?: string;
  hangHoa?: string;
  bienSoXe?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface WeighingReportItem {
  soPhieu: string;
  ngayGioCan: string;
  bienSoXe: string;
  laiXe: string;
  khachHang: string;
  hangHoa: string;
  nghiepVu: string;
  khoiLuongGross: number;
  khoiLuongTare: number;
  khoiLuongNet: number;
  nguoiCan: string;
  trangThai: string;
}

export interface ReportSummary {
  tongLuotCan: number;
  tongSanLuongNet: number;
  tongNhapNet: number;
  tongXuatNet: number;
  totalCount: number;
  items: WeighingReportItem[];
}

// Realistic local fallback data for uninterrupted offline demo / development
const FALLBACK_WEIGHINGS: WeighingReportItem[] = [
  {
    soPhieu: 'PC-20261009-24',
    ngayGioCan: '2026-10-09T09:10:00',
    bienSoXe: '15C-334.88',
    laiXe: 'Đặng Quốc Bảo',
    khachHang: 'Kết Cấu Thép Đại Dũng',
    hangHoa: 'Thép hình H200x200',
    nghiepVu: 'Xuất hàng',
    khoiLuongGross: 45.20,
    khoiLuongTare: 13.90,
    khoiLuongNet: 31.30,
    nguoiCan: 'Trần Văn Mạnh',
    trangThai: 'Hoàn tất',
  },
  {
    soPhieu: 'PC-20261009-23',
    ngayGioCan: '2026-10-09T08:20:00',
    bienSoXe: '29H-123.45',
    laiXe: 'Nguyễn Văn Hùng',
    khachHang: 'Công ty Bê Tông Vĩnh Tuy',
    hangHoa: 'Xi măng rời PCB40',
    nghiepVu: 'Nhập hàng',
    khoiLuongGross: 49.30,
    khoiLuongTare: 14.50,
    khoiLuongNet: 34.80,
    nguoiCan: 'Trần Văn Mạnh',
    trangThai: 'Hoàn tất',
  },
  {
    soPhieu: 'PC-20261008-22',
    ngayGioCan: '2026-10-08T11:20:00',
    bienSoXe: '90C-112.34',
    laiXe: 'Đỗ Minh Quân',
    khachHang: 'Nhà Máy Bê Tông Minh Đức',
    hangHoa: 'Phụ gia khoáng hoạt tính',
    nghiepVu: 'Nhập hàng',
    khoiLuongGross: 40.50,
    khoiLuongTare: 12.40,
    khoiLuongNet: 28.10,
    nguoiCan: 'Trần Văn Mạnh',
    trangThai: 'Hoàn tất',
  },
  {
    soPhieu: 'PC-20261007-21',
    ngayGioCan: '2026-10-07T09:00:00',
    bienSoXe: '29C-556.78',
    laiXe: 'Hoàng Văn Quyết',
    khachHang: 'Logistics Tân Cảng',
    hangHoa: 'Cân dịch vụ thương mại',
    nghiepVu: 'Cân dịch vụ',
    khoiLuongGross: 31.20,
    khoiLuongTare: 10.60,
    khoiLuongNet: 20.60,
    nguoiCan: 'Lê Thị Mai',
    trangThai: 'Hoàn tất',
  },
  {
    soPhieu: 'PC-20261006-20',
    ngayGioCan: '2026-10-06T15:15:00',
    bienSoXe: '88C-234.56',
    laiXe: 'Vũ Hải Nam',
    khachHang: 'Xi Măng Bỉm Sơn',
    hangHoa: 'Clinker đặc khối tiêu chuẩn',
    nghiepVu: 'Nội bộ',
    khoiLuongGross: 48.00,
    khoiLuongTare: 14.05,
    khoiLuongNet: 33.95,
    nguoiCan: 'Trần Văn Mạnh',
    trangThai: 'Hoàn tất',
  },
  {
    soPhieu: 'PC-20261005-19',
    ngayGioCan: '2026-10-05T14:30:00',
    bienSoXe: '30E-771.22',
    laiXe: 'Bùi Đình Trọng',
    khachHang: 'Công ty Xây Dựng Delta',
    hangHoa: 'Đá dăm 1x2 bê tông',
    nghiepVu: 'Xuất hàng',
    khoiLuongGross: 37.10,
    khoiLuongTare: 11.25,
    khoiLuongNet: 25.85,
    nguoiCan: 'Trần Văn Mạnh',
    trangThai: 'Hoàn tất',
  },
  {
    soPhieu: 'PC-20261004-18',
    ngayGioCan: '2026-10-04T13:45:00',
    bienSoXe: '15C-334.88',
    laiXe: 'Đặng Quốc Bảo',
    khachHang: 'Đại Lý Sắt Thép An Phát',
    hangHoa: 'Thép cuộn D10 mạ kẽm',
    nghiepVu: 'Xuất hàng',
    khoiLuongGross: 43.80,
    khoiLuongTare: 13.85,
    khoiLuongNet: 29.95,
    nguoiCan: 'Lê Thị Mai',
    trangThai: 'Hoàn tất',
  },
  {
    soPhieu: 'PC-20261003-17',
    ngayGioCan: '2026-10-03T10:55:00',
    bienSoXe: '14C-455.90',
    laiXe: 'Phạm Tuấn Anh',
    khachHang: 'Xi Măng Bút Sơn',
    hangHoa: 'Than cám 4A tuyển chọn',
    nghiepVu: 'Nhập hàng',
    khoiLuongGross: 53.00,
    khoiLuongTare: 15.25,
    khoiLuongNet: 37.75,
    nguoiCan: 'Trần Văn Mạnh',
    trangThai: 'Hoàn tất',
  },
  {
    soPhieu: 'PC-20261002-16',
    ngayGioCan: '2026-10-02T09:40:00',
    bienSoXe: '29C-982.11',
    laiXe: 'Nguyễn Hữu Thắng',
    khachHang: 'Tập đoàn Sun Group',
    hangHoa: 'Cát vàng san lấp',
    nghiepVu: 'Nhập hàng',
    khoiLuongGross: 39.10,
    khoiLuongTare: 12.15,
    khoiLuongNet: 26.95,
    nguoiCan: 'Lê Thị Mai',
    trangThai: 'Hoàn tất',
  },
  {
    soPhieu: 'PC-20261001-15',
    ngayGioCan: '2026-10-01T08:30:00',
    bienSoXe: '29H-123.45',
    laiXe: 'Nguyễn Văn Hùng',
    khachHang: 'Bê Tông Chèm',
    hangHoa: 'Xi măng rời PCB40',
    nghiepVu: 'Nhập hàng',
    khoiLuongGross: 48.90,
    khoiLuongTare: 14.52,
    khoiLuongNet: 34.38,
    nguoiCan: 'Trần Văn Mạnh',
    trangThai: 'Hoàn tất',
  },
  {
    soPhieu: 'PC-20260930-14',
    ngayGioCan: '2026-09-30T16:10:00',
    bienSoXe: '88C-234.56',
    laiXe: 'Vũ Hải Nam',
    khachHang: 'Xi Măng Phúc Sơn',
    hangHoa: 'Clinker đặc khối tiêu chuẩn',
    nghiepVu: 'Nội bộ',
    khoiLuongGross: 47.30,
    khoiLuongTare: 14.10,
    khoiLuongNet: 33.20,
    nguoiCan: 'Trần Văn Mạnh',
    trangThai: 'Hoàn tất',
  },
  {
    soPhieu: 'PC-20260928-13',
    ngayGioCan: '2026-09-28T11:40:00',
    bienSoXe: '30E-771.22',
    laiXe: 'Bùi Đình Trọng',
    khachHang: 'Công ty Giao Thông Đô Thị',
    hangHoa: 'Đá mi bụi sàng lọc',
    nghiepVu: 'Xuất hàng',
    khoiLuongGross: 36.80,
    khoiLuongTare: 11.30,
    khoiLuongNet: 25.50,
    nguoiCan: 'Trần Văn Mạnh',
    trangThai: 'Hoàn tất',
  },
  {
    soPhieu: 'PC-20260925-12',
    ngayGioCan: '2026-09-25T14:50:00',
    bienSoXe: '15C-334.88',
    laiXe: 'Đặng Quốc Bảo',
    khachHang: 'Công nghiệp Tàu Thủy Bạch Đằng',
    hangHoa: 'Thép cây V75x75',
    nghiepVu: 'Xuất hàng',
    khoiLuongGross: 44.50,
    khoiLuongTare: 13.90,
    khoiLuongNet: 30.60,
    nguoiCan: 'Lê Thị Mai',
    trangThai: 'Hoàn tất',
  },
  {
    soPhieu: 'PC-20260922-11',
    ngayGioCan: '2026-09-22T10:15:00',
    bienSoXe: '14C-455.90',
    laiXe: 'Phạm Tuấn Anh',
    khachHang: 'Nhà Máy Kính Nổi Viglacera',
    hangHoa: 'Than cục tuyển 3B',
    nghiepVu: 'Nhập hàng',
    khoiLuongGross: 51.20,
    khoiLuongTare: 15.10,
    khoiLuongNet: 36.10,
    nguoiCan: 'Trần Văn Mạnh',
    trangThai: 'Hoàn tất',
  },
  {
    soPhieu: 'PC-20260920-10',
    ngayGioCan: '2026-09-20T13:25:00',
    bienSoXe: '29H-123.45',
    laiXe: 'Nguyễn Văn Hùng',
    khachHang: 'Bê Tông Tươi Việt Đức',
    hangHoa: 'Xi măng rời PCB40',
    nghiepVu: 'Nhập hàng',
    khoiLuongGross: 49.10,
    khoiLuongTare: 14.50,
    khoiLuongNet: 34.60,
    nguoiCan: 'Lê Thị Mai',
    trangThai: 'Hoàn tất',
  },
  {
    soPhieu: 'PC-20260918-09',
    ngayGioCan: '2026-09-18T09:50:00',
    bienSoXe: '19C-667.89',
    laiXe: 'Ngô Văn Toàn',
    khachHang: 'Thép Pomina',
    hangHoa: 'Quặng sắt tinh chế',
    nghiepVu: 'Nhập hàng',
    khoiLuongGross: 55.40,
    khoiLuongTare: 16.20,
    khoiLuongNet: 39.20,
    nguoiCan: 'Trần Văn Mạnh',
    trangThai: 'Hoàn tất',
  },
  {
    soPhieu: 'PC-20260915-08',
    ngayGioCan: '2026-09-15T16:00:00',
    bienSoXe: '29C-556.78',
    laiXe: 'Hoàng Văn Quyết',
    khachHang: 'Vận Tải Hoàng Long',
    hangHoa: 'Cân kiểm tra tải trọng',
    nghiepVu: 'Cân dịch vụ',
    khoiLuongGross: 28.50,
    khoiLuongTare: 10.50,
    khoiLuongNet: 18.00,
    nguoiCan: 'Trần Văn Mạnh',
    trangThai: 'Hoàn tất',
  },
  {
    soPhieu: 'PC-20260912-07',
    ngayGioCan: '2026-09-12T08:10:00',
    bienSoXe: '90C-112.34',
    laiXe: 'Đỗ Minh Quân',
    khachHang: 'Nhà Máy Gạch Không Nung',
    hangHoa: 'Tro bay công nghiệp',
    nghiepVu: 'Nhập hàng',
    khoiLuongGross: 39.50,
    khoiLuongTare: 12.50,
    khoiLuongNet: 27.00,
    nguoiCan: 'Lê Thị Mai',
    trangThai: 'Hoàn tất',
  },
  {
    soPhieu: 'PC-20260910-06',
    ngayGioCan: '2026-09-10T15:40:00',
    bienSoXe: '88C-234.56',
    laiXe: 'Vũ Hải Nam',
    khachHang: 'Xi Măng Hạ Long',
    hangHoa: 'Clinker đặc khối tiêu chuẩn',
    nghiepVu: 'Nội bộ',
    khoiLuongGross: 46.80,
    khoiLuongTare: 14.00,
    khoiLuongNet: 32.80,
    nguoiCan: 'Trần Văn Mạnh',
    trangThai: 'Hoàn tất',
  },
  {
    soPhieu: 'PC-20260908-05',
    ngayGioCan: '2026-09-08T11:05:00',
    bienSoXe: '30E-771.22',
    laiXe: 'Bùi Đình Trọng',
    khachHang: 'Công ty Xây Dựng Số 1',
    hangHoa: 'Đá dăm 1x2 bê tông',
    nghiepVu: 'Xuất hàng',
    khoiLuongGross: 35.60,
    khoiLuongTare: 11.20,
    khoiLuongNet: 24.40,
    nguoiCan: 'Trần Văn Mạnh',
    trangThai: 'Hoàn tất',
  },
  {
    soPhieu: 'PC-20260905-04',
    ngayGioCan: '2026-09-05T14:20:00',
    bienSoXe: '15C-334.88',
    laiXe: 'Đặng Quốc Bảo',
    khachHang: 'Công ty Cơ Khí Hải Phòng',
    hangHoa: 'Thép cuộn D10 mạ kẽm',
    nghiepVu: 'Xuất hàng',
    khoiLuongGross: 42.15,
    khoiLuongTare: 13.80,
    khoiLuongNet: 28.35,
    nguoiCan: 'Lê Thị Mai',
    trangThai: 'Hoàn tất',
  },
  {
    soPhieu: 'PC-20260903-03',
    ngayGioCan: '2026-09-03T10:30:00',
    bienSoXe: '14C-455.90',
    laiXe: 'Phạm Tuấn Anh',
    khachHang: 'Nhiệt điện Phả Lại',
    hangHoa: 'Than cám 4A tuyển chọn',
    nghiepVu: 'Nhập hàng',
    khoiLuongGross: 52.80,
    khoiLuongTare: 15.30,
    khoiLuongNet: 37.50,
    nguoiCan: 'Lê Thị Mai',
    trangThai: 'Hoàn tất',
  },
  {
    soPhieu: 'PC-20260902-02',
    ngayGioCan: '2026-09-02T09:15:00',
    bienSoXe: '29C-982.11',
    laiXe: 'Nguyễn Hữu Thắng',
    khachHang: 'Tập đoàn Vingroup',
    hangHoa: 'Cát vàng san lấp',
    nghiepVu: 'Nhập hàng',
    khoiLuongGross: 38.20,
    khoiLuongTare: 12.10,
    khoiLuongNet: 26.10,
    nguoiCan: 'Trần Văn Mạnh',
    trangThai: 'Hoàn tất',
  },
  {
    soPhieu: 'PC-20260901-01',
    ngayGioCan: '2026-09-01T08:45:00',
    bienSoXe: '29H-123.45',
    laiXe: 'Nguyễn Văn Hùng',
    khachHang: 'Vicem Hoàng Thạch',
    hangHoa: 'Xi măng rời PCB40',
    nghiepVu: 'Nhập hàng',
    khoiLuongGross: 48.60,
    khoiLuongTare: 14.52,
    khoiLuongNet: 34.08,
    nguoiCan: 'Trần Văn Mạnh',
    trangThai: 'Hoàn tất',
  },
];

export const reportApi = {
  async getWeighingReport(filters: ReportFilter = {}): Promise<ReportSummary> {
    try {
      const response = await api.get<ReportSummary>('/reports/weighing', {
        params: {
          TuNgay: filters.tuNgay,
          DenNgay: filters.denNgay,
          NghiepVu: filters.nghiepVu,
          KhachHang: filters.khachHang,
          HangHoa: filters.hangHoa,
          BienSoXe: filters.bienSoXe,
          PageIndex: filters.pageIndex || 1,
          PageSize: filters.pageSize || 20,
        },
      });
      return response.data;
    } catch (error) {
      console.warn('Backend /reports/weighing API not reachable or unauthorized. Using realistic local data:', error);
      return filterLocalWeighings(filters);
    }
  },
};

function filterLocalWeighings(filter: ReportFilter): ReportSummary {
  let list = [...FALLBACK_WEIGHINGS];

  if (filter.tuNgay) {
    const fromTime = new Date(filter.tuNgay).getTime();
    list = list.filter((item) => new Date(item.ngayGioCan).getTime() >= fromTime);
  }

  if (filter.denNgay) {
    const toTime = new Date(filter.denNgay).getTime() + 86400000;
    list = list.filter((item) => new Date(item.ngayGioCan).getTime() <= toTime);
  }

  if (filter.nghiepVu && filter.nghiepVu !== 'ALL' && filter.nghiepVu !== 'Tất cả') {
    const nv = filter.nghiepVu.toLowerCase();
    list = list.filter((item) => item.nghiepVu.toLowerCase().includes(nv));
  }

  if (filter.bienSoXe) {
    const q = filter.bienSoXe.toLowerCase().trim();
    list = list.filter((item) => item.bienSoXe.toLowerCase().includes(q));
  }

  if (filter.khachHang) {
    const q = filter.khachHang.toLowerCase().trim();
    list = list.filter((item) => item.khachHang.toLowerCase().includes(q));
  }

  if (filter.hangHoa) {
    const q = filter.hangHoa.toLowerCase().trim();
    list = list.filter((item) => item.hangHoa.toLowerCase().includes(q));
  }

  const tongLuotCan = list.length;
  const tongSanLuongNet = list.reduce((sum, item) => sum + item.khoiLuongNet, 0);
  const tongNhapNet = list
    .filter((item) => item.nghiepVu.toLowerCase().includes('nhập'))
    .reduce((sum, item) => sum + item.khoiLuongNet, 0);
  const tongXuatNet = list
    .filter((item) => item.nghiepVu.toLowerCase().includes('xuất'))
    .reduce((sum, item) => sum + item.khoiLuongNet, 0);

  const page = filter.pageIndex || 1;
  const pageSize = filter.pageSize || 20;
  const items = list.slice((page - 1) * pageSize, page * pageSize);

  return {
    tongLuotCan,
    tongSanLuongNet: Math.round(tongSanLuongNet * 100) / 100,
    tongNhapNet: Math.round(tongNhapNet * 100) / 100,
    tongXuatNet: Math.round(tongXuatNet * 100) / 100,
    totalCount: tongLuotCan,
    items,
  };
}
