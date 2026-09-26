import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../common/Modal';
import { PhanQuyen, MaChucNang } from '../../types/auth';
import { 
  ShieldCheck, 
  Save, 
  RotateCcw, 
  CheckSquare, 
  Square, 
  CheckCircle2, 
  Users, 
  Lock, 
  KeyRound 
} from 'lucide-react';
import { soundFx } from '../../utils/audio';

interface PermissionMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PermissionMatrixModal: React.FC<PermissionMatrixModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { roles, forms, permissions, updateRoleMatrix, resetPermissions, currentUser } = useAuthStore();
  const [selectedRoleId, setSelectedRoleId] = useState<string>('ROLE_SCALE');
  const [matrixData, setMatrixData] = useState<PhanQuyen[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync matrix data when selected role changes or modal opens
  useEffect(() => {
    if (isOpen) {
      const rolePerms = forms.map((fn, idx) => {
        const existing = permissions.find(
          (p) => p.VaiTroId === selectedRoleId && p.MaChucNang === fn.MaChucNang
        );
        return existing || {
          Id: `pq-${selectedRoleId}-${idx}`,
          VaiTroId: selectedRoleId,
          MaChucNang: fn.MaChucNang,
          Xem: false,
          Them: false,
          Sua: false,
          Xoa: false,
          BaoCao: false,
          Gate_Id: 'ALL',
        };
      });
      setMatrixData(rolePerms);
      setSavedSuccess(false);
    }
  }, [isOpen, selectedRoleId, permissions, forms]);

  const handleToggleFlag = (maChucNang: MaChucNang, flag: 'Xem' | 'Them' | 'Sua' | 'Xoa' | 'BaoCao') => {
    setMatrixData((prev) =>
      prev.map((row) => {
        if (row.MaChucNang === maChucNang) {
          const newVal = !row[flag];
          // If unchecking 'Xem', automatically uncheck all others
          if (flag === 'Xem' && !newVal) {
            return { ...row, Xem: false, Them: false, Sua: false, Xoa: false, BaoCao: false };
          }
          // If checking any action, automatically ensure 'Xem' is checked
          if (flag !== 'Xem' && newVal) {
            return { ...row, [flag]: true, Xem: true };
          }
          return { ...row, [flag]: newVal };
        }
        return row;
      })
    );
  };

  const handleToggleRowAll = (maChucNang: MaChucNang) => {
    setMatrixData((prev) =>
      prev.map((row) => {
        if (row.MaChucNang === maChucNang) {
          const allTrue = row.Xem && row.Them && row.Sua && row.Xoa && row.BaoCao;
          const nextVal = !allTrue;
          return {
            ...row,
            Xem: nextVal,
            Them: nextVal,
            Sua: nextVal,
            Xoa: nextVal,
            BaoCao: nextVal,
          };
        }
        return row;
      })
    );
  };

  const handleToggleColAll = (flag: 'Xem' | 'Them' | 'Sua' | 'Xoa' | 'BaoCao') => {
    const allTrue = matrixData.every((row) => row[flag]);
    const nextVal = !allTrue;
    setMatrixData((prev) =>
      prev.map((row) => {
        if (flag === 'Xem' && !nextVal) {
          return { ...row, Xem: false, Them: false, Sua: false, Xoa: false, BaoCao: false };
        }
        if (flag !== 'Xem' && nextVal) {
          return { ...row, [flag]: true, Xem: true };
        }
        return { ...row, [flag]: nextVal };
      })
    );
  };

  const handleSave = () => {
    updateRoleMatrix(selectedRoleId, matrixData);
    soundFx.playScaleCaptureTone();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Khôi phục ma trận phân quyền về thiết lập chuẩn SQL Server ban đầu?')) {
      resetPermissions();
      soundFx.playScaleCaptureTone();
    }
  };

  const selectedRole = roles.find((r) => r.Id === selectedRoleId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-amber-500" />
          <span>Quản Trị Ma Trận Phân Quyền (RBAC Matrix)</span>
        </div>
      }
      subtitle="Thiết lập quyền Xem, Thêm, Sửa, Xóa, Báo cáo theo chuẩn bảng PhanQuyen SQL Server"
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Role Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 dark:bg-industrial-950 p-2 rounded-xl border border-slate-200 dark:border-industrial-800">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {roles.map((role) => (
              <button
                key={role.Id}
                type="button"
                onClick={() => setSelectedRoleId(role.Id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  selectedRoleId === role.Id
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-industrial-900'
                }`}
              >
                <span>{role.TenVaiTro}</span>
                {role.Id === 'ROLE_ADMIN' && <span className="text-[10px] px-1 bg-amber-700 rounded font-mono">Full</span>}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-500 transition px-2 py-1"
            title="Khôi phục ma trận mẫu mặc định"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Đặt Lại Mặc Định</span>
          </button>
        </div>

        {/* Selected Role Description Banner */}
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs flex items-center justify-between">
          <div>
            <span className="font-bold text-amber-900 dark:text-amber-200">
              Đang phân quyền cho: <b>{selectedRole?.TenVaiTro}</b>
            </span>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
              {selectedRole?.MoTa}
            </p>
          </div>
          {savedSuccess && (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-950 px-2.5 py-1 rounded-md animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              Đã lưu thành công!
            </span>
          )}
        </div>

        {/* Permissions Matrix Table */}
        <div className="bg-white dark:bg-industrial-900 rounded-xl border border-slate-200 dark:border-industrial-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-industrial-800 bg-slate-50 dark:bg-industrial-950 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-3 w-64">Chức Năng (Form)</th>
                  <th className="p-3 w-24 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleColAll('Xem')}
                      className="hover:text-amber-500 flex items-center justify-center gap-1 mx-auto"
                      title="Bật/Tắt tất cả quyền Xem"
                    >
                      <span>Xem</span>
                    </button>
                  </th>
                  <th className="p-3 w-24 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleColAll('Them')}
                      className="hover:text-amber-500 flex items-center justify-center gap-1 mx-auto"
                      title="Bật/Tắt tất cả quyền Thêm"
                    >
                      <span>Thêm</span>
                    </button>
                  </th>
                  <th className="p-3 w-24 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleColAll('Sua')}
                      className="hover:text-amber-500 flex items-center justify-center gap-1 mx-auto"
                      title="Bật/Tắt tất cả quyền Sửa"
                    >
                      <span>Sửa</span>
                    </button>
                  </th>
                  <th className="p-3 w-24 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleColAll('Xoa')}
                      className="hover:text-amber-500 flex items-center justify-center gap-1 mx-auto"
                      title="Bật/Tắt tất cả quyền Xóa"
                    >
                      <span>Xóa</span>
                    </button>
                  </th>
                  <th className="p-3 w-28 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleColAll('BaoCao')}
                      className="hover:text-amber-500 flex items-center justify-center gap-1 mx-auto"
                      title="Bật/Tắt tất cả quyền Báo Cáo"
                    >
                      <span>Báo Cáo</span>
                    </button>
                  </th>
                  <th className="p-3 w-20 text-center">Dòng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-industrial-800">
                {forms.map((fn) => {
                  const perm = matrixData.find((p) => p.MaChucNang === fn.MaChucNang) || {
                    Id: '',
                    VaiTroId: selectedRoleId,
                    MaChucNang: fn.MaChucNang,
                    Xem: false,
                    Them: false,
                    Sua: false,
                    Xoa: false,
                    BaoCao: false,
                    Gate_Id: 'ALL',
                  };

                  return (
                    <tr 
                      key={fn.MaChucNang}
                      className="hover:bg-slate-50/80 dark:hover:bg-industrial-800/50 transition-colors"
                    >
                      {/* Form Details */}
                      <td className="p-3">
                        <div className="font-bold text-industrial-900 dark:text-white">
                          {fn.TenChucNang}
                        </div>
                        <div className="text-[11px] font-mono text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                          <span>{fn.MaChucNang}</span>
                          <span className="text-slate-400">• {fn.Nhom}</span>
                        </div>
                      </td>

                      {/* 1. Xem */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={perm.Xem}
                          onChange={() => handleToggleFlag(fn.MaChucNang, 'Xem')}
                          className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer accent-amber-600"
                        />
                      </td>

                      {/* 2. Thêm */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={perm.Them}
                          onChange={() => handleToggleFlag(fn.MaChucNang, 'Them')}
                          className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer accent-amber-600"
                        />
                      </td>

                      {/* 3. Sửa */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={perm.Sua}
                          onChange={() => handleToggleFlag(fn.MaChucNang, 'Sua')}
                          className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer accent-amber-600"
                        />
                      </td>

                      {/* 4. Xóa */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={perm.Xoa}
                          onChange={() => handleToggleFlag(fn.MaChucNang, 'Xoa')}
                          className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer accent-amber-600"
                        />
                      </td>

                      {/* 5. Báo Cáo */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={perm.BaoCao}
                          onChange={() => handleToggleFlag(fn.MaChucNang, 'BaoCao')}
                          className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer accent-amber-600"
                        />
                      </td>

                      {/* Row quick toggle */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleRowAll(fn.MaChucNang)}
                          className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-industrial-800 transition text-[11px]"
                          title="Bật/Tắt toàn bộ quyền cho chức năng này"
                        >
                          Tất cả
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-industrial-800">
          <span className="text-[11px] text-slate-500">
            * Thay đổi có hiệu lực ngay lập tức cho phiên làm việc hiện tại
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-industrial-800 rounded-lg transition"
            >
              Đóng
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 active:scale-95 rounded-lg shadow transition"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Ma Trận Quyền</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
