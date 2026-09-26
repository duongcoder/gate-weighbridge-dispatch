import { useState, useEffect } from 'react';
import { NguoiDung, VaiTro, ChucNang, PhanQuyen, MaChucNang, PermissionAction } from '../types/auth';

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
    TenVaiTro: 'Quản Trị Viên',
    MoTa: 'Toàn quyền cấu hình hệ thống, danh mục, phân quyền và dữ liệu',
    MauSac: 'emerald',
  },
  {
    Id: 'ROLE_SCALE',
    TenVaiTro: 'Nhân Viên Bàn Cân',
    MoTa: 'Thực hiện cân xe 2 lần, in phiếu cân, giám sát bàn cân điện tử',
    MauSac: 'amber',
  },
  {
    Id: 'ROLE_GUARD',
    TenVaiTro: 'Bảo Vệ Cổng',
    MoTa: 'Kiểm soát xe vào ra, quẹt thẻ RFID và khai báo nhanh barrier',
    MauSac: 'sky',
  },
  {
    Id: 'ROLE_DISPATCH',
    TenVaiTro: 'Nhân Viên Điều Độ',
    MoTa: 'Lập lệnh, ghép xe, điều phối đội xe; không được sửa số cân',
    MauSac: 'purple',
  },
];

export const NGUOI_DUNG_LIST: NguoiDung[] = [
  {
    Id: 'usr-admin',
    TenDangNhap: 'admin',
    HoTen: 'Trần Quản Trị',
    VaiTroId: 'ROLE_ADMIN',
    Email: 'admin@weighbridge.vn',
    SoDienThoai: '0912.888.999',
    ChucVu: 'Trưởng Trạm Cân & IT',
    KichHoat: true,
    Avatar: '👑',
  },
  {
    Id: 'usr-scale',
    TenDangNhap: 'canvien01',
    HoTen: 'Lê Văn Cân',
    VaiTroId: 'ROLE_SCALE',
    Email: 'canvien01@weighbridge.vn',
    SoDienThoai: '0983.111.222',
    ChucVu: 'Kỹ Thuật Viên Bàn Cân #01',
    KichHoat: true,
    Avatar: '⚖️',
  },
  {
    Id: 'usr-guard',
    TenDangNhap: 'baove01',
    HoTen: 'Nguyễn Văn Cổng',
    VaiTroId: 'ROLE_GUARD',
    Email: 'baove01@weighbridge.vn',
    SoDienThoai: '0905.333.444',
    ChucVu: 'Bảo Vệ Barrier Cổng 1',
    KichHoat: true,
    Avatar: '🛡️',
  },
  {
    Id: 'usr-dispatch',
    TenDangNhap: 'dieudo01',
    HoTen: 'Phạm Điều Độ',
    VaiTroId: 'ROLE_DISPATCH',
    Email: 'dieudo01@weighbridge.vn',
    SoDienThoai: '0936.555.666',
    ChucVu: 'Chuyên Viên Điều Phối Đội Xe',
    KichHoat: true,
    Avatar: '🚚',
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

  // 4. Nhân Viên Điều Độ (Dispatcher)
  { Id: 'pq-disp-1', VaiTroId: 'ROLE_DISPATCH', MaChucNang: 'Frm_Command', Xem: true, Them: true, Sua: true, Xoa: false, BaoCao: true, Gate_Id: 'ALL' },
  { Id: 'pq-disp-2', VaiTroId: 'ROLE_DISPATCH', MaChucNang: 'Frm_CardVehicle', Xem: true, Them: true, Sua: true, Xoa: false, BaoCao: true, Gate_Id: 'ALL' },
  { Id: 'pq-disp-3', VaiTroId: 'ROLE_DISPATCH', MaChucNang: 'Frm_DispatchOrder', Xem: true, Them: true, Sua: true, Xoa: false, BaoCao: true, Gate_Id: 'ALL' },
  { Id: 'pq-disp-4', VaiTroId: 'ROLE_DISPATCH', MaChucNang: 'Frm_ScaleCapture', Xem: true, Them: false, Sua: false, Xoa: false, BaoCao: false, Gate_Id: 'ALL' },
  { Id: 'pq-disp-5', VaiTroId: 'ROLE_DISPATCH', MaChucNang: 'Frm_WeighingTicket', Xem: true, Them: false, Sua: false, Xoa: false, BaoCao: true, Gate_Id: 'ALL' },
  { Id: 'pq-disp-6', VaiTroId: 'ROLE_DISPATCH', MaChucNang: 'Frm_QuickCheckin', Xem: true, Them: true, Sua: false, Xoa: false, BaoCao: false, Gate_Id: 'ALL' },
  { Id: 'pq-disp-7', VaiTroId: 'ROLE_DISPATCH', MaChucNang: 'Frm_UserPermission', Xem: false, Them: false, Sua: false, Xoa: false, BaoCao: false, Gate_Id: 'ALL' },
];

const STORAGE_KEYS = {
  CURRENT_USER_ID: 'gw_auth_user_id_v2',
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
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

class AuthStoreManager {
  private currentUserId: string = loadStorage(STORAGE_KEYS.CURRENT_USER_ID, NGUOI_DUNG_LIST[0].Id);
  private permissions: PhanQuyen[] = loadStorage(STORAGE_KEYS.PERMISSIONS, DEFAULT_PHAN_QUYEN);
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  getCurrentUser(): NguoiDung {
    const found = NGUOI_DUNG_LIST.find((u) => u.Id === this.currentUserId);
    return found || NGUOI_DUNG_LIST[0];
  }

  getCurrentRole(): VaiTro {
    const user = this.getCurrentUser();
    const role = VAI_TRO_LIST.find((r) => r.Id === user.VaiTroId);
    return role || VAI_TRO_LIST[0];
  }

  setCurrentUser(userId: string) {
    this.currentUserId = userId;
    saveStorage(STORAGE_KEYS.CURRENT_USER_ID, userId);
    this.notify();
  }

  getPermissionsForRole(roleId: string): PhanQuyen[] {
    return this.permissions.filter((p) => p.VaiTroId === roleId);
  }

  getPermission(roleId: string, maChucNang: MaChucNang): PhanQuyen | undefined {
    return this.permissions.find(
      (p) => p.VaiTroId === roleId && p.MaChucNang === maChucNang
    );
  }

  hasPermission(roleId: string, maChucNang: MaChucNang, action: PermissionAction): boolean {
    const perm = this.getPermission(roleId, maChucNang);
    if (!perm) return false;
    switch (action) {
      case 'xem': return perm.Xem;
      case 'them': return perm.Them;
      case 'sua': return perm.Sua;
      case 'xoa': return perm.Xoa;
      case 'baoCao': return perm.BaoCao;
      default: return false;
    }
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

  getState() {
    return {
      currentUser: this.getCurrentUser(),
      currentRole: this.getCurrentRole(),
      users: NGUOI_DUNG_LIST,
      roles: VAI_TRO_LIST,
      forms: CHUC_NANG_LIST,
      permissions: this.permissions,
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
    setCurrentUser: (userId: string) => authStore.setCurrentUser(userId),
    hasPermission: (maChucNang: MaChucNang, action: PermissionAction) => 
      authStore.hasPermission(state.currentUser.VaiTroId, maChucNang, action),
    getPermission: (maChucNang: MaChucNang) =>
      authStore.getPermission(state.currentUser.VaiTroId, maChucNang),
    updatePermissionFlag: (roleId: string, maChucNang: MaChucNang, flag: 'Xem' | 'Them' | 'Sua' | 'Xoa' | 'BaoCao', value: boolean) =>
      authStore.updatePermissionFlag(roleId, maChucNang, flag, value),
    updateRoleMatrix: (roleId: string, newPermissions: PhanQuyen[]) =>
      authStore.updateRoleMatrix(roleId, newPermissions),
    resetPermissions: () => authStore.resetPermissions(),
  };
}
