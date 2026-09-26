import React, { useState, useMemo } from 'react';
import { Command, CommandType, CommandStatus } from '../../types';
import { useStore } from '../../store/dispatchStore';
import { CommandStatusBadge } from '../common/Badge';
import { Authorize } from '../common/Authorize';
import { formatWeight, formatDateOnly } from '../../utils/formatters';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Share2, 
  Filter, 
  CheckSquare, 
  Square, 
  CheckCircle2, 
  PlayCircle, 
  Clock, 
  AlertCircle 
} from 'lucide-react';

interface CommandTableProps {
  onOpenCreateModal: () => void;
  onEditCommand: (cmd: Command) => void;
  onDispatchWithCommand: (cmdId: string) => void;
}

export const CommandTable: React.FC<CommandTableProps> = ({
  onOpenCreateModal,
  onEditCommand,
  onDispatchWithCommand,
}) => {
  const { 
    commands, 
    searchQuery, 
    deleteCommand, 
    bulkDeleteCommands, 
    bulkUpdateCommandStatus 
  } = useStore();

  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter and search logic
  const filteredCommands = useMemo(() => {
    return commands.filter((cmd) => {
      // Search text match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCode = cmd.code.toLowerCase().includes(q);
        const matchesCustomer = cmd.customer.toLowerCase().includes(q);
        const matchesMaterial = cmd.material.toLowerCase().includes(q);
        const matchesType = cmd.type.toLowerCase().includes(q);
        if (!matchesCode && !matchesCustomer && !matchesMaterial && !matchesType) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== 'ALL' && cmd.type !== typeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && cmd.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [commands, searchQuery, typeFilter, statusFilter]);

  // Selection toggle
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCommands.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCommands.map((c) => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk actions
  const handleBulkDelete = () => {
    if (window.confirm(`Bạn có chắc muốn xóa ${selectedIds.length} lệnh vận chuyển đã chọn?`)) {
      bulkDeleteCommands(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleBulkStatusChange = (status: CommandStatus) => {
    bulkUpdateCommandStatus(selectedIds, status);
    setSelectedIds([]);
  };

  return (
    <div className="space-y-4">
      {/* Top action & filter row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-industrial-900 p-4 rounded-xl border border-slate-200 dark:border-industrial-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Loại:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-industrial-700 bg-slate-50 dark:bg-industrial-950 text-xs text-industrial-900 dark:text-white font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none"
            >
              <option value="ALL">Tất cả loại nghiệp vụ</option>
              <option value="Nhập hàng">Nhập hàng</option>
              <option value="Xuất hàng">Xuất hàng</option>
              <option value="Vận chuyển nội bộ">Vận chuyển nội bộ</option>
              <option value="Cân dịch vụ">Cân dịch vụ</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-industrial-700 bg-slate-50 dark:bg-industrial-950 text-xs text-industrial-900 dark:text-white font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="Chờ thực hiện">Chờ thực hiện</option>
              <option value="Đang chạy">Đang chạy</option>
              <option value="Hoàn thành">Hoàn thành</option>
              <option value="Đã hủy">Đã hủy</option>
            </select>
          </div>
        </div>

        {/* Create new command action */}
        <Authorize form="Frm_Command" action="them" mode="disable">
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-500 active:scale-95 rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Lệnh Mới</span>
          </button>
        </Authorize>
      </div>

      {/* Batch Action Toolbar when items are selected */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-xl animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-amber-900 dark:text-amber-200">
            <CheckSquare className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Đã chọn {selectedIds.length} lệnh</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleBulkStatusChange('Đang chạy')}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-industrial-900 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-industrial-800 transition"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Chạy lệnh</span>
            </button>
            <button
              type="button"
              onClick={() => handleBulkStatusChange('Hoàn thành')}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-industrial-900 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-industrial-800 transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Hoàn thành</span>
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa ({selectedIds.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-500 dark:text-slate-400 underline hover:text-slate-700"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* Desktop High-Density Data Grid */}
      <div className="hidden md:block bg-white dark:bg-industrial-900 rounded-xl border border-slate-200 dark:border-industrial-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse text-xs min-w-[850px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-industrial-800 bg-slate-50 dark:bg-industrial-950 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <th className="p-3 w-10 text-center">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  {selectedIds.length === filteredCommands.length && filteredCommands.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-amber-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="p-3 w-28">Mã Lệnh</th>
              <th className="p-3 w-28">Loại Lệnh</th>
              <th className="p-3">Khách Hàng / Chủ Hàng</th>
              <th className="p-3">Hàng Hóa / Vật Tư</th>
              <th className="p-3 w-48">Tiến Độ Khối Lượng</th>
              <th className="p-3 w-32 text-center">Trạng Thái</th>
              <th className="p-3 w-28">Ngày Tạo</th>
              <th className="p-3 w-36 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-industrial-800">
            {filteredCommands.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-400 dark:text-slate-500">
                  Không tìm thấy lệnh nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              filteredCommands.map((cmd) => {
                const isSelected = selectedIds.includes(cmd.id);
                const percent = Math.min(
                  100,
                  Math.round(((cmd.completedWeight || 0) / (cmd.targetWeight || 1)) * 100)
                );

                return (
                  <tr
                    key={cmd.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-industrial-800/50 transition-colors ${
                      isSelected ? 'bg-amber-50/50 dark:bg-amber-950/30' : ''
                    }`}
                  >
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggleSelectOne(cmd.id)}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-amber-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                      {cmd.code}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-industrial-800 text-slate-700 dark:text-slate-300">
                        {cmd.type}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-industrial-900 dark:text-white max-w-[200px] truncate" title={cmd.customer}>
                      {cmd.customer}
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      {cmd.material}
                    </td>
                    <td className="p-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {formatWeight(cmd.completedWeight)}
                          </span>
                          <span className="text-slate-400">
                            / {formatWeight(cmd.targetWeight)}
                          </span>
                          <span className="font-bold">{percent}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-industrial-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              percent >= 100
                                ? 'bg-emerald-500'
                                : percent > 50
                                ? 'bg-amber-500'
                                : 'bg-sky-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <CommandStatusBadge status={cmd.status} />
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {formatDateOnly(cmd.createdAt)}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Authorize form="Frm_DispatchOrder" action="them" mode="disable">
                          <button
                            type="button"
                            onClick={() => onDispatchWithCommand(cmd.id)}
                            className="p-1.5 rounded text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60"
                            title="Ghép xe ngay với lệnh này (F3)"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </Authorize>
                        <Authorize form="Frm_Command" action="sua" mode="disable">
                          <button
                            type="button"
                            onClick={() => onEditCommand(cmd)}
                            className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-industrial-800"
                            title="Chỉnh sửa lệnh"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </Authorize>
                        <Authorize form="Frm_Command" action="xoa" mode="disable">
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Xác nhận xóa lệnh ${cmd.code}?`)) {
                                deleteCommand(cmd.id);
                              }
                            }}
                            className="p-1.5 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60"
                            title="Xóa lệnh"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </Authorize>
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

      {/* Mobile Responsive Cards List */}
      <div className="md:hidden space-y-3">
        {filteredCommands.length === 0 ? (
          <div className="p-6 text-center text-slate-400 bg-white dark:bg-industrial-900 rounded-xl border border-slate-200 dark:border-industrial-800">
            Không tìm thấy lệnh nào.
          </div>
        ) : (
          filteredCommands.map((cmd) => {
            const percent = Math.min(
              100,
              Math.round(((cmd.completedWeight || 0) / (cmd.targetWeight || 1)) * 100)
            );
            const isSelected = selectedIds.includes(cmd.id);

            return (
              <div
                key={cmd.id}
                className={`p-4 rounded-xl border bg-white dark:bg-industrial-900 shadow-sm space-y-3 transition ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20'
                    : 'border-slate-200 dark:border-industrial-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSelectOne(cmd.id)}
                      className="text-slate-400"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-amber-600" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                    <div>
                      <span className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400">
                        {cmd.code}
                      </span>
                      <span className="ml-2 text-xs text-slate-500 px-1.5 py-0.5 bg-slate-100 dark:bg-industrial-800 rounded">
                        {cmd.type}
                      </span>
                    </div>
                  </div>
                  <CommandStatusBadge status={cmd.status} />
                </div>

                <div>
                  <h4 className="font-bold text-sm text-industrial-900 dark:text-white">
                    {cmd.customer}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Hàng: <span className="font-medium">{cmd.material}</span>
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1 bg-slate-50 dark:bg-industrial-950 p-2 rounded-lg">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-500">Đã cân:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatWeight(cmd.completedWeight)} / {formatWeight(cmd.targetWeight)} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-industrial-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 bg-amber-500 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-industrial-800">
                  <span className="text-[11px] font-mono text-slate-400">
                    {formatDateOnly(cmd.createdAt)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Authorize form="Frm_DispatchOrder" action="them" mode="disable">
                      <button
                        type="button"
                        onClick={() => onDispatchWithCommand(cmd.id)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-amber-500 text-white"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Ghép xe</span>
                      </button>
                    </Authorize>
                    <Authorize form="Frm_Command" action="sua" mode="disable">
                      <button
                        type="button"
                        onClick={() => onEditCommand(cmd)}
                        className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-industrial-800"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </Authorize>
                    <Authorize form="Frm_Command" action="xoa" mode="disable">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Xóa lệnh ${cmd.code}?`)) {
                            deleteCommand(cmd.id);
                          }
                        }}
                        className="p-1.5 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </Authorize>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
