import React, { useState, useEffect } from 'react';
import { 
  authApi, 
  UserListItemDto, 
  CreateUserDto, 
  RoleDto 
} from '../../services/authApi';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Phone, 
  Building, 
  KeyRound, 
  Lock, 
  User, 
  RefreshCw,
  ShieldCheck,
  Calendar
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [users, setUsers] = useState<UserListItemDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateUserDto>({
    tenDangNhap: '',
    matKhau: '123',
    hoTen: '',
    vaiTroId: 2, // Mặc định: Nhân viên Bàn Cân
    gate_Id: 1,
    dienThoai: '',
    diaChi: '',
  });

  const fetchData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [usersData, rolesData] = await Promise.all([
        authApi.getUsers(),
        authApi.getRoles(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      if (rolesData.length > 0 && !formData.vaiTroId) {
        setFormData((prev) => ({ ...prev, vaiTroId: rolesData[0].id }));
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(errorObj.response?.data?.message || 'Lỗi khi tải dữ liệu người dùng từ SQL Server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'vaiTroId' || name === 'gate_Id' ? Number(value) : value,
    }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tenDangNhap.trim() || !formData.matKhau.trim() || !formData.hoTen.trim()) {
      setErrorMessage('Vui lòng điền đầy đủ Tên đăng nhập, Mật khẩu và Họ tên.');
      return;
    }

    setCreating(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const created = await authApi.createUser(formData);
      setSuccessMessage(`Đã tạo thành công tài khoản: @${created.tenDangNhap} (${created.hoTen})`);
      setUsers((prev) => [...prev, created]);
      // Reset form
      setFormData({
        tenDangNhap: '',
        matKhau: '123',
        hoTen: '',
        vaiTroId: roles.length > 1 ? roles[1].id : 2,
        gate_Id: 1,
        dienThoai: '',
        diaChi: '',
      });
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(errorObj.response?.data?.message || 'Lỗi khi tạo tài khoản mới.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (user: UserListItemDto) => {
    if (user.tenDangNhap.toLowerCase() === 'admin') {
      alert('Không thể xóa tài khoản Quản Trị Viên Hệ Thống (admin)!');
      return;
    }

    if (!window.confirm(`Xác nhận xóa tài khoản "${user.tenDangNhap}" (${user.hoTen}) khỏi cơ sở dữ liệu SQL Server?`)) {
      return;
    }

    setDeletingId(user.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await authApi.deleteUser(user.id);
      setSuccessMessage(`Đã xóa tài khoản @${user.tenDangNhap} thành công!`);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(errorObj.response?.data?.message || 'Lỗi khi xóa người dùng.');
    } finally {
      setDeletingId(null);
    }
  };

  const roleColors: Record<number, string> = {
    1: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    2: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    3: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300 dark:border-sky-800',
    4: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-5xl bg-white dark:bg-industrial-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-industrial-700 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur border border-white/10 text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight uppercase">QUẢN LÝ TÀI KHOẢN HỆ THỐNG</h3>
              <p className="text-[11px] text-slate-300 flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Thêm mới, phân vai trò và quản trị người dùng cơ sở dữ liệu SQL Server</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
              title="Tải lại danh sách"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Scrollable area with Add User Form + User Table */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Alerts */}
          {errorMessage && (
            <div className="p-3.5 text-xs rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 text-xs rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Section 1: Form Thêm Tài Khoản Mới */}
          <div className="bg-slate-50 dark:bg-industrial-950/80 rounded-2xl border border-slate-200 dark:border-industrial-800 p-5 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-4 pb-2 border-b border-slate-200 dark:border-industrial-800">
              <UserPlus className="w-4 h-4 text-amber-500" />
              <span>Tạo Mới Tài Khoản Người Dùng</span>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                {/* Tên đăng nhập */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tên Đăng Nhập <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      name="tenDangNhap"
                      value={formData.tenDangNhap}
                      onChange={handleInputChange}
                      placeholder="canvien02 / baove02"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-industrial-900 border border-slate-300 dark:border-industrial-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Mật khẩu khởi tạo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mật Khẩu Khởi Tạo <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      name="matKhau"
                      value={formData.matKhau}
                      onChange={handleInputChange}
                      placeholder="Mặc định: 123"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-industrial-900 border border-slate-300 dark:border-industrial-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>
                </div>

                {/* Họ và tên */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Họ Và Tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    name="hoTen"
                    value={formData.hoTen}
                    onChange={handleInputChange}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-industrial-900 border border-slate-300 dark:border-industrial-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Chọn vai trò */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vai Trò Phân Quyền <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      name="vaiTroId"
                      value={formData.vaiTroId}
                      onChange={handleInputChange}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-industrial-900 border border-slate-300 dark:border-industrial-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.tenVaiTro}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Cổng trực */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cổng / Làn Trực
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      name="gate_Id"
                      value={formData.gate_Id}
                      onChange={handleInputChange}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-industrial-900 border border-slate-300 dark:border-industrial-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value={1}>Cổng 01 (Gate 1 - Trạm Cân Chính)</option>
                      <option value={2}>Cổng 02 (Gate 2 - Làn Xe Tải Nặng)</option>
                      <option value={3}>Cổng 03 (Gate 3 - Xuất Container)</option>
                    </select>
                  </div>
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Số Điện Thoại
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      name="dienThoai"
                      value={formData.dienThoai}
                      onChange={handleInputChange}
                      placeholder="0912.345.678"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-industrial-900 border border-slate-300 dark:border-industrial-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Đơn vị công tác */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Đơn Vị / Phòng Ban
                  </label>
                  <input
                    type="text"
                    name="diaChi"
                    value={formData.diaChi}
                    onChange={handleInputChange}
                    placeholder="Tổ Cân Ca 1 / Đội Bảo Vệ"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-industrial-900 border border-slate-300 dark:border-industrial-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Nút submit form */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-600/20 active:scale-95 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu vào SQL Server...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Tạo Tài Khoản Mới</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Bảng Danh Sách Người Dùng Hiện Có */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                <span>Danh Sách Người Dùng Trên SQL Server ({users.length} tài khoản)</span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-industrial-800 shadow-xs">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-100 dark:bg-industrial-950 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-industrial-800">
                  <tr>
                    <th className="px-4 py-3 text-center w-12">#</th>
                    <th className="px-4 py-3">Tài Khoản</th>
                    <th className="px-4 py-3">Họ Và Tên</th>
                    <th className="px-4 py-3">Vai Trò</th>
                    <th className="px-4 py-3">Làn Cổng</th>
                    <th className="px-4 py-3">Liên Hệ</th>
                    <th className="px-4 py-3">Ngày Tạo</th>
                    <th className="px-4 py-3 text-center w-20">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-industrial-800 bg-white dark:bg-industrial-900">
                  {loading && users.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                        <span>Đang tải danh sách tài khoản từ SQL Server...</span>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Chưa có người dùng nào.
                      </td>
                    </tr>
                  ) : (
                    users.map((u, idx) => {
                      const isSuperAdmin = u.tenDangNhap.toLowerCase() === 'admin';
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-industrial-800/50 transition">
                          <td className="px-4 py-3 text-center text-slate-400 font-mono text-xs">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                            @{u.tenDangNhap}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                            {u.hoTen}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${roleColors[u.vaiTroId || 0] || 'bg-slate-100 text-slate-700'}`}>
                              {u.tenVaiTro}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                            Cổng {u.gate_Id || 1}
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs">
                            {u.dienThoai || '--'}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {u.ngayTao ? new Date(u.ngayTao).toLocaleDateString('vi-VN') : '--'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isSuperAdmin ? (
                              <span className="text-[10px] font-semibold text-slate-400 px-2 py-1 rounded bg-slate-100 dark:bg-industrial-800">
                                Cố định
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u)}
                                disabled={deletingId === u.id}
                                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition disabled:opacity-50"
                                title={`Xóa tài khoản @${u.tenDangNhap}`}
                              >
                                {deletingId === u.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
