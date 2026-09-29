/**
 * RBAC Authentication & Authorization Data Models
 * Matching standard SQL Server relational schema:
 * - NguoiDung (Users)
 * - VaiTro (Roles)
 * - ChucNang (Functions / Forms)
 * - PhanQuyen (Permissions Matrix)
 */

export type MaChucNang = 
  | 'Frm_Command'          // Quản lý Lệnh
  | 'Frm_CardVehicle'      // Thẻ & Xe
  | 'Frm_DispatchOrder'    // Điều phối Ghép Lệnh
  | 'Frm_ScaleCapture'     // Ghi nhận bàn cân
  | 'Frm_WeighingTicket'   // In phiếu cân
  | 'Frm_QuickCheckin'     // Khai báo nhanh cổng
  | 'Frm_UserPermission';  // Quản trị phân quyền

export type PermissionAction = 'xem' | 'them' | 'sua' | 'xoa' | 'baoCao';

export interface ChucNang {
  MaChucNang: MaChucNang;
  TenChucNang: string;
  MoTa: string;
  Nhom: string; // Grouping category ('Nghiệp vụ vận tải', 'Trạm cân điện tử', 'Kiểm soát cổng', 'Hệ thống')
}

export interface VaiTro {
  Id: string;
  TenVaiTro: string;
  MoTa: string;
  MauSac: string; // Badge color styling
}

export interface PhanQuyen {
  Id: string;
  VaiTroId: string;
  MaChucNang: MaChucNang;
  Xem: boolean;     // Can view the form / screen / tab
  Them: boolean;    // Can create / insert new records
  Sua: boolean;     // Can update / modify records / capture scale weights
  Xoa: boolean;     // Can delete records
  BaoCao: boolean;  // Can print slips / export reports
  Gate_Id: string;  // Multi-gate lane assignment ('GATE_01', 'ALL')
}

export interface NguoiDung {
  Id: string;
  TenDangNhap: string;
  HoTen: string;
  VaiTroId: string;
  Email?: string;
  SoDienThoai?: string;
  ChucVu: string;
  KichHoat: boolean;
  Avatar: string;
}
