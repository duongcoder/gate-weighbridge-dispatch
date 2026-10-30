import { useState, useEffect } from 'react';
import { NguoiDung, VaiTro, ChucNang, PhanQuyen, MaChucNang, PermissionAction } from '../types/auth';
import { authApi, LoginDto, RegisterDto, UserSessionDto, AuthResponseDto } from '../services/authApi';
import { dispatchStore } from './dispatchStore';

export const CHUC_NANG_LIST: ChucNang[] = [
  {
    MaChucNang: 'Frm_Command',
    TenChucNang: 'Quản lý Lệnh Vận Chuyển',
    MoTa: 'Xem, tạo mới, sửa, xóa và theo dõi tiến độ các Lệnh nhập/xuất',
    Nhom: 'Nghiệp vụ vận tải',
  },
  {
    MaChucNang: 'Frm_CardVehicle',
    TenChucNang: 'Quản lý Phương Tiện',
    MoTa: 'Đăng ký xe, cài đặt bì định mức và quản lý danh sách xe',
    Nhom: 'Nghiệp vụ vận tải',
  },
  {
    MaChucNang: 'Frm_DispatchOrder',
    TenChucNang: 'Điều Phối Ghép Lệnh & Xe',
    MoTa: 'Ghép 1-1, 1-N, N-1, N-N, theo dõi quy trình 5 bước cổng trạm',
    Nhom: 'Nghiệp vụ vận tải',
  },
  {
    MaChucNang: 'Frm_ScaleCapture',
    TenChucNang: 'Ghi Nhận Số Cân Bàn Cân',
    MoTa: 'Đọc và chốt số cân Lần 1 (Gross/Tare), Lần 2 (Tare/Gross)',
    Nhom: 'Trạm cân điện tử',
  },
  {
    MaChucNang: 'Frm_WeighingTicket',
    TenChucNang: 'In Phiếu Cân & Giấy Ra Cổng',
    MoTa: 'In chứng từ cân điện tử chuẩn A5 ngang hoặc vé nhiệt 80mm',
    Nhom: 'Trạm cân điện tử',
  },
  {
    MaChucNang: 'Frm_QuickCheckin',
    TenChucNang: 'Khai Báo Nhanh Tại Barrier',
    MoTa: 'Nhập biển số để cấp lốt vào cổng nhanh',
    Nhom: 'Kiểm soát cổng',
  },
  {
    MaChucNang: 'Frm_UserPermission',
    TenChucNang: 'Quản Trị Ma Trận Phân Quyền',
    MoTa: 'Cấu hình quyền Xem, Thêm, Sửa, Xóa, Báo cáo cho các vai trò',
    Nhom: 'Hệ thống',
  },
  {
    MaChucNang: 'Frm_Reports',
    TenChucNang: 'Báo Cáo & Thống Kê',
    MoTa: 'Nhật ký cân xe, báo cáo sản lượng Net và phân tích trạm cân',
    Nhom: 'Trạm cân điện tử',
  },
];

export const VAI_TRO_LIST: VaiTro[] = [
  {
    Id: 'ROLE_ADMIN',
    TenVaiTro: 'Quản Trị Viên (Admin)',
    MoTa: 'Toàn quyền cấu hình, vận hành và quản trị phân quyền hệ thống',
    MauSac: 'emerald',
  },
  {
    Id: 'ROLE_MANAGER',
    TenVaiTro: 'Trưởng Phòng (Quản Lý)',
    MoTa: 'Quản lý điều hành, xem/sửa lệnh, xe, duyệt lệnh',
    MauSac: 'indigo',
  },
  {
    Id: 'ROLE_SALES',
    TenVaiTro: 'Kinh Doanh (Quản Lý Lệnh)',
    MoTa: 'Tạo và theo dõi lệnh cân nhập/xuất',
    MauSac: 'purple',
  },
  {
    Id: 'ROLE_STATION_HEAD',
    TenVaiTro: 'Trạm Trưởng',
    MoTa: 'Quản lý phương tiện và điều phối cổng trạm',
    MauSac: 'sky',
  },
  {
    Id: 'ROLE_ACCOUNTANT',
    TenVaiTro: 'Kế Toán',
    MoTa: 'Báo cáo, thống kê sản lượng và xuất phiếu cân',
    MauSac: 'teal',
  },
  {
    Id: 'ROLE_SCALE',
    TenVaiTro: 'Nhân Viên Bàn Cân',
    MoTa: 'Vận hành bàn cân điện tử, ghi nhận khối lượng và in phiếu cân',
    MauSac: 'amber',
  },
];

export const DEFAULT_PHAN_QUYEN: PhanQuyen[] = [
  // 1. Quản Trị Viên (Full All Permissions)
  ...CHUC_NANG_LIST.map((fn, idx) => ({
    Id: `pq-admin-${idx}`,
    VaiTroId: 'ROLE_ADMIN',
    MaChucNang: fn.MaChucNang,
    Xem: true,
    Them: true,
    Sua: true,
    Xoa: true,
    BaoCao: true,
    Gate_Id: 'ALL',
  })),

  // 2. Nhân Viên Bàn Cân (Scale Operator)
  { Id: 'pq-scale-1', VaiTroId: 'ROLE_SCALE', MaChucNang: 'Frm_Command', Xem: true, Them: false, Sua: false, Xoa: false, BaoCao: false, Gate_Id: 'GATE_01' },
  { Id: 'pq-scale-2', VaiTroId: 'ROLE_SCALE', MaChucNang: 'Frm_CardVehicle', Xem: true, Them: false, Sua: false, Xoa: false, BaoCao: false, Gate_Id: 'GATE_01' },
  { Id: 'pq-scale-3', VaiTroId: 'ROLE_SCALE', MaChucNang: 'Frm_DispatchOrder', Xem: true, Them: false, Sua: false, Xoa: false, BaoCao: true, Gate_Id: 'GATE_01' },
  { Id: 'pq-scale-4', VaiTroId: 'ROLE_SCALE', MaChucNang: 'Frm_Reports', Xem: true, Them: false, Sua: false, Xoa: false, BaoCao: true, Gate_Id: 'GATE_01' },
  { Id: 'pq-scale-4', VaiTroId: 'ROLE_SCALE', MaChucNang: 'Frm_ScaleCapture', Xem: true, Them: true, Sua: true, Xoa: false, BaoCao: true, Gate_Id: 'GATE_01' },
  { Id: 'pq-scale-5', VaiTroId: 'ROLE_SCALE', MaChucNang: 'Frm_WeighingTicket', Xem: true, Them: true, Sua: false, Xoa: false, BaoCao: true, Gate_Id: 'GATE_01' },
  { Id: 'pq-scale-6', VaiTroId: 'ROLE_SCALE', MaChucNang: 'Frm_QuickCheckin', Xem: true, Them: false, Sua: false, Xoa: false, BaoCao: false, Gate_Id: 'GATE_01' },
  { Id: 'pq-scale-7', VaiTroId: 'ROLE_SCALE', MaChucNang: 'Frm_UserPermission', Xem: false, Them: false, Sua: false, Xoa: false, BaoCao: false, Gate_Id: 'GATE_01' },

  // 3. Bảo Vệ Cổng (Gate Guard)
  { Id: 'pq-guard-1', VaiTroId: 'ROLE_GUARD', MaChucNang: 'Frm_Command', Xem: false, Them: false, Sua: false, Xoa: false, BaoCao: false, Gate_Id: 'GATE_01' },
  { Id: 'pq-guard-2', VaiTroId: 'ROLE_GUARD', MaChucNang: 'Frm_CardVehicle', Xem: true, Them: true, Sua: false, Xoa: false, BaoCao: false, Gate_Id: 'GATE_01' },
  { Id: 'pq-guard-3', VaiTroId: 'ROLE_GUARD', MaChucNang: 'Frm_DispatchOrder', Xem: true, Them: false, Sua: false, Xoa: false, BaoCao: false, Gate_Id: 'GATE_01' },
  { Id: 'pq-guard-4', VaiTroId: 'ROLE_GUARD', MaChucNang: 'Frm_ScaleCapture', Xem: false, Them: false, Sua: false, Xoa: false, BaoCao: false, Gate_Id: 'GATE_01' },
  { Id: 'pq-guard-5', VaiTroId: 'ROLE_GUARD', MaChucNang: 'Frm_WeighingTicket', Xem: true, Them: false, Sua: false, Xoa: false, BaoCao: false, Gate_Id: 'GATE_01' },
  { Id: 'pq-guard-6', VaiTroId: 'ROLE_GUARD', MaChucNang: 'Frm_QuickCheckin', Xem: true, Them: true, Sua: true, Xoa: false, BaoCao: false, Gate_Id: 'GATE_01' },
  { Id: 'pq-guard-7', VaiTroId: 'ROLE_GUARD', MaChucNang: 'Frm_UserPermission', Xem: false, Them: false, Sua: false, Xoa: false, BaoCao: false, Gate_Id: 'GATE_01' },

];

const DEFAULT_GUEST: NguoiDung = {
  Id: '0',
  TenDangNhap: 'chua_dang_nhap',
  HoTen: 'Chưa Đăng Nhập',
  VaiTroId: 'ROLE_GUEST',
  ChucVu: 'Khách / Vui lòng đăng nhập',
  KichHoat: false,
  Avatar: '👤',
};

const STORAGE_KEYS = {
  AUTH_TOKEN: 'gw_auth_token',
  USER_SESSION: 'gw_user_session',
  PERMISSIONS: 'gw_auth_permissions_v2',
};

function loadStorage<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return defaultValue;
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveStorage<T>(key: string, value: T) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    if (value === null || value === undefined) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

class AuthStoreManager {
  private token: string | null = (typeof window !== 'undefined' && window.localStorage)
    ? window.localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    : null;
  private liveUserSession: UserSessionDto | null = loadStorage<UserSessionDto | null>(STORAGE_KEYS.USER_SESSION, null);
  private permissions: PhanQuyen[] = loadStorage(STORAGE_KEYS.PERMISSIONS, DEFAULT_PHAN_QUYEN);
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('gw:unauthorized', () => {
        this.logout();
      });
    }
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.liveUserSession;
  }

  getLiveUserSession(): UserSessionDto | null {
    return this.liveUserSession;
  }

  isSuperAdmin(): boolean {
    if (!this.liveUserSession) return false;
    const { vaiTroId, tenDangNhap } = this.liveUserSession;
    return vaiTroId === 1 || vaiTroId === 2 || tenDangNhap?.toLowerCase() === 'admin';
  }

  getCurrentUser(): NguoiDung {
    if (this.liveUserSession) {
      const isAdm = this.isSuperAdmin();
      const roleIdStr = this.mapRoleIdToCode(this.liveUserSession.vaiTroId, this.liveUserSession.tenDangNhap);
      return {
        Id: String(this.liveUserSession.id),
        TenDangNhap: this.liveUserSession.tenDangNhap,
        HoTen: this.liveUserSession.hoTen,
        VaiTroId: roleIdStr,
        Email: this.liveUserSession.email,
        SoDienThoai: this.liveUserSession.dienThoai,
        ChucVu: isAdm ? 'Quản Trị Viên (Admin)' : (this.liveUserSession.tenVaiTro || 'Nhân Viên Bàn Cân'),
        KichHoat: true,
        Avatar: this.getAvatarForRole(this.liveUserSession.vaiTroId, this.liveUserSession.tenDangNhap),
      };
    }
    return DEFAULT_GUEST;
  }

  getCurrentRole(): VaiTro {
    const user = this.getCurrentUser();
    const role = VAI_TRO_LIST.find((r) => r.Id === user.VaiTroId);
    return role || {
      Id: user.VaiTroId,
      TenVaiTro: user.ChucVu,
      MoTa: 'Tài khoản kết nối từ cơ sở dữ liệu SQL Server',
      MauSac: 'emerald',
    };
  }

  // Real Database Login
  async login(credentials: LoginDto): Promise<AuthResponseDto> {
    const res = await authApi.login(credentials);
    this.token = res.token;
    this.liveUserSession = res.userSession;

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, res.token);
    }
    saveStorage(STORAGE_KEYS.USER_SESSION, res.userSession);

    this.notify();
    // Auto load commands, vehicles, and orders immediately after login
    dispatchStore.fetchInitialData().catch(console.error);
    return res;
  }

  // Real Database Register
  async register(data: RegisterDto): Promise<AuthResponseDto> {
    const res = await authApi.register(data);
    this.token = res.token;
    this.liveUserSession = res.userSession;

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, res.token);
    }
    saveStorage(STORAGE_KEYS.USER_SESSION, res.userSession);

    this.notify();
    dispatchStore.fetchInitialData().catch(console.error);
    return res;
  }

  // Logout
  logout() {
    this.token = null;
    this.liveUserSession = null;

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    }
    saveStorage(STORAGE_KEYS.USER_SESSION, null);

    this.notify();
  }

  // Auto-restore session from token on startup
  async initAuthFromToken(): Promise<boolean> {
    const savedToken = (typeof window !== 'undefined' && window.localStorage)
      ? window.localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
      : null;

    if (!savedToken) {
      return false;
    }

    try {
      this.token = savedToken;
      const session = await authApi.getCurrentUser();
      this.liveUserSession = session;
      saveStorage(STORAGE_KEYS.USER_SESSION, session);
      this.notify();
      // Auto load commands, vehicles, and orders immediately after session restore
      dispatchStore.fetchInitialData().catch(console.error);
      return true;
    } catch (err) {
      console.warn('Saved auth token is invalid or backend unreachable:', err);
      this.logout();
      return false;
    }
  }

  // Universal Permission Check: checks dynamic permissions from SQL Server
  hasPermission(maChucNang: MaChucNang, action: PermissionAction): boolean {
    if (!this.liveUserSession) {
      return false;
    }

    // Admin (admin / VaiTroId = 1 / VaiTroId = 2) always has full permissions
    if (this.isSuperAdmin()) {
      return true;
    }

    const permDetail = this.liveUserSession.permissions[maChucNang];
    if (permDetail) {
      switch (action) {
        case 'xem': return !!permDetail.xem;
        case 'them': return !!permDetail.them;
        case 'sua': return !!permDetail.sua;
        case 'xoa': return !!permDetail.xoa;
        case 'baoCao': return !!permDetail.baoCao;
        default: return false;
      }
    }

    return false;
  }

  getPermission(maChucNang: MaChucNang): PhanQuyen | undefined {
    if (this.liveUserSession) {
      if (this.isSuperAdmin()) {
        return {
          Id: `live-${maChucNang}`,
          VaiTroId: 'ROLE_ADMIN',
          MaChucNang: maChucNang,
          Xem: true,
          Them: true,
          Sua: true,
          Xoa: true,
          BaoCao: true,
          Gate_Id: 'ALL',
        };
      }
      const permDetail = this.liveUserSession.permissions[maChucNang];
      if (permDetail) {
        return {
          Id: `live-${maChucNang}`,
          VaiTroId: this.mapRoleIdToCode(this.liveUserSession.vaiTroId, this.liveUserSession.tenDangNhap),
          MaChucNang: maChucNang,
          Xem: !!permDetail.xem,
          Them: !!permDetail.them,
          Sua: !!permDetail.sua,
          Xoa: !!permDetail.xoa,
          BaoCao: !!permDetail.baoCao,
          Gate_Id: `GATE_${this.liveUserSession.gateId || 1}`,
        };
      }
    }
    return this.permissions.find(
      (p) => p.VaiTroId === this.getCurrentUser().VaiTroId && p.MaChucNang === maChucNang
    );
  }

  getPermissionsForRole(roleId: string): PhanQuyen[] {
    return this.permissions.filter((p) => p.VaiTroId === roleId);
  }

  updatePermissionFlag(roleId: string, maChucNang: MaChucNang, flag: 'Xem' | 'Them' | 'Sua' | 'Xoa' | 'BaoCao', value: boolean) {
    this.permissions = this.permissions.map((p) => {
      if (p.VaiTroId === roleId && p.MaChucNang === maChucNang) {
        return { ...p, [flag]: value };
      }
      return p;
    });
    saveStorage(STORAGE_KEYS.PERMISSIONS, this.permissions);
    this.notify();
  }

  updateRoleMatrix(roleId: string, newPermissions: PhanQuyen[]) {
    const otherPerms = this.permissions.filter((p) => p.VaiTroId !== roleId);
    this.permissions = [...otherPerms, ...newPermissions];
    saveStorage(STORAGE_KEYS.PERMISSIONS, this.permissions);
    this.notify();
  }

  resetPermissions() {
    this.permissions = [...DEFAULT_PHAN_QUYEN];
    saveStorage(STORAGE_KEYS.PERMISSIONS, this.permissions);
    this.notify();
  }

  private mapRoleIdToCode(vaiTroId?: number, tenDangNhap?: string): string {
    if (tenDangNhap?.toLowerCase() === 'admin' || vaiTroId === 1 || vaiTroId === 2) {
      return 'ROLE_ADMIN';
    }
    switch (vaiTroId) {
      case 4: return 'ROLE_MANAGER';
      case 5: return 'ROLE_SALES';
      case 7: return 'ROLE_STATION_HEAD';
      case 9: return 'ROLE_ACCOUNTANT';
      case 13: return 'ROLE_SCALE';
      default: return 'ROLE_SCALE';
    }
  }

  private getAvatarForRole(vaiTroId?: number, tenDangNhap?: string): string {
    if (tenDangNhap?.toLowerCase() === 'admin' || vaiTroId === 1 || vaiTroId === 2) {
      return '👑';
    }
    switch (vaiTroId) {
      case 4: return '👔';
      case 5: return '💼';
      case 7: return '🏭';
      case 9: return '📊';
      case 13: return '⚖️';
      default: return '👤';
    }
  }

  getState() {
    return {
      currentUser: this.getCurrentUser(),
      currentRole: this.getCurrentRole(),
      roles: VAI_TRO_LIST,
      forms: CHUC_NANG_LIST,
      permissions: this.permissions,
      isAuthenticated: this.isAuthenticated(),
      liveUserSession: this.liveUserSession,
    };
  }
}

export const authStore = new AuthStoreManager();

export function useAuthStore() {
  const [state, setState] = useState(authStore.getState());

  useEffect(() => {
    return authStore.subscribe(() => {
      setState(authStore.getState());
    });
  }, []);

  return {
    ...state,
    login: (credentials: LoginDto) => authStore.login(credentials),
    register: (data: RegisterDto) => authStore.register(data),
    logout: () => authStore.logout(),
    initAuthFromToken: () => authStore.initAuthFromToken(),
    hasPermission: (maChucNang: MaChucNang, action: PermissionAction) =>
      authStore.hasPermission(maChucNang, action),
    getPermission: (maChucNang: MaChucNang) =>
      authStore.getPermission(maChucNang),
    updatePermissionFlag: (roleId: string, maChucNang: MaChucNang, flag: 'Xem' | 'Them' | 'Sua' | 'Xoa' | 'BaoCao', value: boolean) =>
      authStore.updatePermissionFlag(roleId, maChucNang, flag, value),
    updateRoleMatrix: (roleId: string, newPermissions: PhanQuyen[]) =>
      authStore.updateRoleMatrix(roleId, newPermissions),
    resetPermissions: () => authStore.resetPermissions(),
  };
}
