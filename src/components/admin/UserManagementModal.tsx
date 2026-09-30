import React, { useState, useEffect } from 'react';
import { 
  authApi, 
  UserListItemDto, 
  CreateUserDto, 
  UpdateUserDto,
  RoleDto 
} from '../../services/authApi';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Pencil,
  Save,
  X, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Phone, 
  KeyRound, 
  Lock, 
  User, 
  RefreshCw,
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
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Edit mode state: null = Create mode, UserListItemDto = Edit mode
  const [editingUser, setEditingUser] = useState<UserListItemDto | null>(null);

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
      handleCancelEdit();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'vaiTroId' ? Number(value) : value,
    }));
  };

  const handleStartEdit = (user: UserListItemDto) => {
    setEditingUser(user);
    setFormData({
      tenDangNhap: user.tenDangNhap,
      matKhau: '', // Để trống khi sửa, chỉ nhập nếu muốn đổi mật khẩu
      hoTen: user.hoTen,
      vaiTroId: user.vaiTroId || 2,
      gate_Id: user.gate_Id || 1,
      dienThoai: user.dienThoai || '',
      diaChi: user.diaChi || '',
    });
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setFormData({
      tenDangNhap: '',
      matKhau: '123',
      hoTen: '',
      vaiTroId: roles.length > 1 ? roles[1].id : 2,
      gate_Id: 1,
      dienThoai: '',
      diaChi: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingUser) {
      // --------------------------------------------------
      // CHẾ ĐỘ CẬP NHẬT (EDIT MODE)
      // --------------------------------------------------
      if (!formData.hoTen.trim()) {
        setErrorMessage('Vui lòng điền Họ và tên.');
        return;
      }

      setSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      try {
        const payload: UpdateUserDto = {
          hoTen: formData.hoTen.trim(),
          vaiTroId: Number(formData.vaiTroId) || 2,
          dienThoai: formData.dienThoai?.trim() || undefined,
          matKhau: formData.matKhau?.trim() || undefined,
          gate_Id: 1,
          diaChi: '',
        };

        const updated = await authApi.updateUser(editingUser.id, payload);
        setSuccessMessage(`Đã cập nhật thông tin tài khoản @${updated.tenDangNhap} thành công!`);
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        handleCancelEdit();
      } catch (err: unknown) {
        const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
        setErrorMessage(errorObj.response?.data?.message || 'Lỗi khi cập nhật tài khoản.');
      } finally {
        setSubmitting(false);
      }
    } else {
      // --------------------------------------------------
      // CHẾ ĐỘ TẠO MỚI (CREATE MODE)
      // --------------------------------------------------
      if (!formData.tenDangNhap.trim() || !formData.matKhau.trim() || !formData.hoTen.trim()) {
        setErrorMessage('Vui lòng điền đầy đủ Tên đăng nhập, Mật khẩu và Họ tên.');
        return;
      }

      setSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      try {
        const payload: CreateUserDto = {
          tenDangNhap: formData.tenDangNhap.trim(),
          matKhau: formData.matKhau.trim(),
          hoTen: formData.hoTen.trim(),
          vaiTroId: Number(formData.vaiTroId) || 2,
          gate_Id: 1,
          dienThoai: formData.dienThoai?.trim() || undefined,
          diaChi: '',
        };
        const created = await authApi.createUser(payload);
        setSuccessMessage(`Đã tạo thành công tài khoản: @${created.tenDangNhap} (${created.hoTen})`);
        setUsers((prev) => [...prev, created]);
        handleCancelEdit();
      } catch (err: unknown) {
        const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
        setErrorMessage(errorObj.response?.data?.message || 'Lỗi khi tạo tài khoản mới.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleDeleteUser = async (user: UserListItemDto) => {
    if (user.tenDangNhap.toLowerCase() === 'admin') {
      alert('Không thể xóa tài khoản Quản Trị Viên Hệ Thống (admin)!');
      return;
    }

    if (!window.confirm(`Xác nhận xóa tài khoản "${user.tenDangNhap}" (${user.hoTen}) khỏi hệ thống?`)) {
      return;
    }

    setDeletingId(user.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await authApi.deleteUser(user.id);
      setSuccessMessage(`Đã xóa tài khoản @${user.tenDangNhap} thành công!`);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      if (editingUser?.id === user.id) {
        handleCancelEdit();
      }
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
            <h3 className="text-base font-black tracking-tight uppercase">QUẢN LÝ TÀI KHOẢN HỆ THỐNG</h3>
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

        {/* Content Body: Scrollable area with Form + User Table */}
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

          {/* Section 1: Form Thêm / Cập Nhật Tài Khoản */}
          <div className={`rounded-2xl border p-5 shadow-xs transition-colors ${
            editingUser 
              ? 'bg-sky-50/60 dark:bg-sky-950/20 border-sky-300 dark:border-sky-800' 
              : 'bg-slate-50 dark:bg-industrial-950/80 border-slate-200 dark:border-industrial-800'
          }`}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/80 dark:border-industrial-800">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                {editingUser ? (
                  <>
                    <Pencil className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span>CẬP NHẬT THÔNG TIN TÀI KHOẢN: <span className="text-sky-600 dark:text-sky-400 font-mono">@{editingUser.tenDangNhap}</span></span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 text-amber-500" />
                    <span>Tạo Mới Tài Khoản Người Dùng</span>
                  </>
                )}
              </div>

              {editingUser && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 transition"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Hủy Chỉnh Sửa</span>
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                {/* Tên đăng nhập */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tên Đăng Nhập {!editingUser && <span className="text-rose-500">*</span>}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required={!editingUser}
                      disabled={!!editingUser}
                      name="tenDangNhap"
                      value={formData.tenDangNhap}
                      onChange={handleInputChange}
                      placeholder="canvien_01"
                      className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-industrial-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        editingUser 
                          ? 'bg-slate-200/70 dark:bg-industrial-800/80 cursor-not-allowed opacity-80 font-mono font-bold' 
                          : 'bg-white dark:bg-industrial-900'
                      }`}
                    />
                  </div>
                </div>

                {/* Mật khẩu */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {editingUser ? (
                      <span>Đổi Mật Khẩu</span>
                    ) : (
                      <>Mật Khẩu Khởi Tạo <span className="text-rose-500">*</span></>
                    )}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required={!editingUser}
                      name="matKhau"
                      value={formData.matKhau}
                      onChange={handleInputChange}
                      placeholder={editingUser ? "Nhập mật khẩu mới (để trống nếu không đổi)" : "123"}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-industrial-900 border border-slate-300 dark:border-industrial-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                    placeholder="Nguyễn Văn An"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-industrial-900 border border-slate-300 dark:border-industrial-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Vai trò */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vai Trò Phân Quyền <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      name="vaiTroId"
                      value={formData.vaiTroId}
                      disabled={editingUser?.tenDangNhap.toLowerCase() === 'admin'}
                      onChange={handleInputChange}
                      className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-industrial-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        editingUser?.tenDangNhap.toLowerCase() === 'admin'
                          ? 'bg-slate-200/70 dark:bg-industrial-800/80 cursor-not-allowed opacity-80'
                          : 'bg-white dark:bg-industrial-900'
                      }`}
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

              {/* Hàng dưới: Số điện thoại + Nhóm Nút Submit / Hủy */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-1">
                <div className="w-full sm:max-w-xs">
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

                <div className="flex items-center gap-2">
                  {editingUser && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-industrial-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-industrial-800 font-semibold text-xs sm:text-sm transition"
                    >
                      Hủy Bỏ
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs sm:text-sm shadow-md active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-50 shrink-0 ${
                      editingUser 
                        ? 'bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 shadow-sky-600/20' 
                        : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-amber-600/20'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{editingUser ? 'Đang lưu cập nhật...' : 'Đang lưu...'}</span>
                      </>
                    ) : editingUser ? (
                      <>
                        <Save className="w-4 h-4" />
                        <span>💾 Lưu Cập Nhật</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Tạo Tài Khoản Mới</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Section 2: Bảng Danh Sách Tài Khoản */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                <span>DANH SÁCH TÀI KHOẢN ({users.length})</span>
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
                    <th className="px-4 py-3">Liên Hệ</th>
                    <th className="px-4 py-3">Ngày Tạo</th>
                    <th className="px-4 py-3 text-center w-24">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-industrial-800 bg-white dark:bg-industrial-900">
                  {loading && users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                        <span>Đang tải danh sách tài khoản...</span>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Chưa có người dùng nào.
                      </td>
                    </tr>
                  ) : (
                    users.map((u, idx) => {
                      const isSuperAdmin = u.tenDangNhap.toLowerCase() === 'admin';
                      const isRowEditing = editingUser?.id === u.id;
                      return (
                        <tr 
                          key={u.id} 
                          className={`transition ${
                            isRowEditing 
                              ? 'bg-sky-50 dark:bg-sky-950/40 ring-1 ring-inset ring-sky-300 dark:ring-sky-700' 
                              : 'hover:bg-slate-50/80 dark:hover:bg-industrial-800/50'
                          }`}
                        >
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
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs">
                            {u.dienThoai || '--'}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {u.ngayTao ? new Date(u.ngayTao).toLocaleDateString('vi-VN') : '--'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Nút Sửa: Hỗ trợ sửa cho mọi tài khoản bao gồm cả admin */}
                              <button
                                type="button"
                                onClick={() => handleStartEdit(u)}
                                className="p-1.5 rounded-lg text-sky-600 dark:text-sky-400 hover:text-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition"
                                title={`Chỉnh sửa thông tin tài khoản @${u.tenDangNhap}`}
                              >
                                <Pencil className="w-4 h-4" />
                              </button>

                              {/* Nút Xóa: Khóa không cho xóa admin */}
                              {isSuperAdmin ? (
                                <span 
                                  className="text-[10px] font-semibold text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-industrial-800 cursor-not-allowed select-none" 
                                  title="Tài khoản Quản Trị Viên khởi tạo được bảo vệ cố định"
                                >
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
                            </div>
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
