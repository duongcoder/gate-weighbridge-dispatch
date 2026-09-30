import { useState, useEffect } from 'react';
import { NguoiDung, VaiTro, ChucNang, PhanQuyen, MaChucNang, PermissionAction } from '../types/auth';
import { authApi, LoginDto, RegisterDto, UserSessionDto, AuthResponseDto } from '../services/authApi';

export const CHUC_NANG_LIST: ChucNang[] = [
  {
    MaChucNang: 'Frm_Command',
    TenChucNang: 'Quản lý Lệnh Vận Chuyển',
    MoTa: 'Xem, tạo mới, sửa, xóa và theo dõi tiến độ các Lệnh nhập/xuất',
    Nhom: 'Nghiệp vụ vận tải',
  },
  {
    MaChucNang: 'Frm_CardVehicle',
    TenChucNang: 'Quản lý Thẻ RFID & Phương Tiện',
    MoTa: 'Đăng ký xe, gắn thẻ từ RFID, cài đặt bì định mức và khóa xe',
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
    MoTa: 'Quét thẻ hoặc nhập biển số để cấp lốt vào cổng nhanh',
    Nhom: 'Kiểm soát cổng',
  },
  {
    MaChucNang: 'Frm_UserPermission',
    TenChucNang: 'Quản Trị Ma Trận Phân Quyền',
    MoTa: 'Cấu hình quyền Xem, Thêm, Sửa, Xóa, Báo cáo cho các vai trò',
    Nhom: 'Hệ thống',
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
    Id: 'ROLE_SCALE',
    TenVaiTro: 'Nhân Viên Bàn Cân',
    MoTa: 'Vận hành bàn cân điện tử, ghi nhận khối lượng và in phiếu cân',
    MauSac: 'amber',
  },
  {
    Id: 'ROLE_GUARD',
    TenVaiTro: 'Bảo Vệ',
    MoTa: 'Kiểm tra xe, cấp lốt vào cổng và quét nhận diện thẻ RFID',
    MauSac: 'sky',
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

  getCurrentUser(): NguoiDung {
    if (this.liveUserSession) {
      const roleIdStr = this.mapRoleIdToCode(this.liveUserSession.vaiTroId);
      return {
        Id: String(this.liveUserSession.id),
        TenDangNhap: this.liveUserSession.tenDangNhap,
        HoTen: this.liveUserSession.hoTen,
        VaiTroId: roleIdStr,
        Email: this.liveUserSession.email,
        SoDienThoai: this.liveUserSession.dienThoai,
        ChucVu: this.liveUserSession.tenVaiTro,
        KichHoat: true,
        Avatar: this.getAvatarForRole(this.liveUserSession.vaiTroId),
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

    // Admin (VaiTroId = 1) always has full permissions
    if (this.liveUserSession.vaiTroId === 1) {
      return true;
    }

    const permDetail = this.liveUserSession.permissions[maChucNang];
    if (permDetail) {
      switch (action) {
        case 'xem': return permDetail.xem;
        case 'them': return permDetail.them;
        case 'sua': return permDetail.sua;
        case 'xoa': return permDetail.xoa;
        case 'baoCao': return permDetail.baoCao;
        default: return false;
      }
    }

    return false;
  }

  getPermission(maChucNang: MaChucNang): PhanQuyen | undefined {
    if (this.liveUserSession) {
      if (this.liveUserSession.vaiTroId === 1) {
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
          VaiTroId: this.mapRoleIdToCode(this.liveUserSession.vaiTroId),
          MaChucNang: maChucNang,
          Xem: permDetail.xem,
          Them: permDetail.them,
          Sua: permDetail.sua,
          Xoa: permDetail.xoa,
          BaoCao: permDetail.baoCao,
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

  private mapRoleIdToCode(vaiTroId?: number): string {
    switch (vaiTroId) {
      case 1: return 'ROLE_ADMIN';
      case 2: return 'ROLE_SCALE';
      case 3: return 'ROLE_GUARD';
      default: return 'ROLE_GUARD';
    }
  }

  private getAvatarForRole(vaiTroId?: number): string {
    switch (vaiTroId) {
      case 1: return '👑';
      case 2: return '⚖️';
      case 3: return '🛡️';
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
