import React, { useState, useMemo } from 'react';
import { VehicleCard, VehicleStatus } from '../../types';
import { useStore } from '../../store/dispatchStore';
import { VehicleStatusBadge } from '../common/Badge';
import { Authorize } from '../common/Authorize';
import { formatWeight } from '../../utils/formatters';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  CreditCard, 
  Truck, 
  Share2, 
  Filter, 
  Phone, 
  Lock, 
  Unlock, 
  ScanLine 
} from 'lucide-react';

interface VehicleTableProps {
  onOpenCreateModal: () => void;
  onEditVehicle: (veh: VehicleCard) => void;
  onDispatchWithVehicle: (vehicleId: string) => void;
  onOpenRfidSimulator: () => void;
}

export const VehicleTable: React.FC<VehicleTableProps> = ({
  onOpenCreateModal,
  onEditVehicle,
  onDispatchWithVehicle,
  onOpenRfidSimulator,
}) => {
  const { vehicles, trips, searchQuery, deleteVehicle, updateVehicleStatus } = useStore();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((veh) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesPlate = veh.plateNumber.toLowerCase().includes(q);
        const matchesCard = veh.cardNo.toLowerCase().includes(q);
        const matchesDriver = veh.driverName.toLowerCase().includes(q);
        const matchesCompany = veh.transportCompany.toLowerCase().includes(q);
        const matchesTrailer = veh.trailerPlate?.toLowerCase().includes(q);
        if (!matchesPlate && !matchesCard && !matchesDriver && !matchesCompany && !matchesTrailer) {
          return false;
        }
      }

      if (statusFilter !== 'ALL' && veh.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [vehicles, searchQuery, statusFilter]);

  const toggleStatus = (veh: VehicleCard) => {
    if (veh.status === 'Tạm khóa (Blocked)') {
      updateVehicleStatus(veh.id, 'Rảnh (Idle)');
    } else if (veh.status === 'Rảnh (Idle)') {
      updateVehicleStatus(veh.id, 'Tạm khóa (Blocked)');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action and filter bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-industrial-900 p-4 rounded-xl border border-slate-200 dark:border-industrial-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Lọc trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-industrial-700 bg-slate-50 dark:bg-industrial-950 text-xs text-industrial-900 dark:text-white font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none"
            >
              <option value="ALL">Tất cả phương tiện ({vehicles.length})</option>
              <option value="Rảnh (Idle)">Rảnh (Sẵn sàng)</option>
              <option value="Đang trong trạm (In-Station)">Đang trong trạm</option>
              <option value="Tạm khóa (Blocked)">Tạm khóa</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Authorize form="Frm_QuickCheckin" action="them" mode="disable">
            <button
              type="button"
              onClick={onOpenRfidSimulator}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-industrial-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-industrial-700 border border-slate-300 dark:border-industrial-700 transition shadow-sm"
            >
              <ScanLine className="w-4 h-4 text-amber-500" />
              <span>Quét Thẻ RFID</span>
            </button>
          </Authorize>

          <Authorize form="Frm_CardVehicle" action="them" mode="disable">
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-500 active:scale-95 rounded-lg shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Đăng Ký Xe Mới</span>
            </button>
          </Authorize>
        </div>
      </div>

      {/* Desktop High-Density Table */}
      <div className="hidden md:block bg-white dark:bg-industrial-900 rounded-xl border border-slate-200 dark:border-industrial-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse text-xs min-w-[850px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-industrial-800 bg-slate-50 dark:bg-industrial-950 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <th className="p-3 w-32">Mã Thẻ RFID</th>
              <th className="p-3 w-36">Biển Số Xe</th>
              <th className="p-3 w-32">Rơ-moóc</th>
              <th className="p-3">Lái Xe & Liên Hệ</th>
              <th className="p-3">Đơn Vị Vận Tải</th>
              <th className="p-3 w-32 text-right">Bì Định Mức</th>
              <th className="p-3 w-36 text-center">Trạng Thái</th>
              <th className="p-3 w-36 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-industrial-800">
            {filteredVehicles.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400 dark:text-slate-500">
                  Không tìm thấy xe nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              filteredVehicles.map((veh) => {
                const linkedTrip = veh.activeTripId
                  ? trips.find((t) => t.id === veh.activeTripId)
                  : undefined;

                return (
                  <tr
                    key={veh.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-industrial-800/50 transition-colors"
                  >
                    <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      <span>{veh.cardNo}</span>
                    </td>
                    <td className="p-3">
                      <div className="font-mono font-black text-sm text-industrial-900 dark:text-white bg-slate-100 dark:bg-industrial-800 px-2 py-0.5 rounded border border-slate-300 dark:border-industrial-700 inline-block">
                        {veh.plateNumber}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                      {veh.trailerPlate || '---'}
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-industrial-900 dark:text-white">
                        {veh.driverName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{veh.driverPhone || '---'}</span>
                      </div>
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">
                      {veh.transportCompany}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                      {formatWeight(veh.defaultTareWeight)}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <VehicleStatusBadge status={veh.status} />
                        {linkedTrip && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-semibold">
                            Chuyến #{linkedTrip.id.slice(-4)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {veh.status === 'Rảnh (Idle)' && (
                          <Authorize form="Frm_DispatchOrder" action="them" mode="disable">
                            <button
                              type="button"
                              onClick={() => onDispatchWithVehicle(veh.id)}
                              className="p-1.5 rounded text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60"
                              title="Ghép lệnh cho xe này"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          </Authorize>
                        )}
                        <Authorize form="Frm_CardVehicle" action="sua" mode="disable">
                          <button
                            type="button"
                            onClick={() => toggleStatus(veh)}
                            className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-industrial-800"
                            title={veh.status === 'Tạm khóa (Blocked)' ? 'Mở khóa xe' : 'Tạm khóa xe'}
                          >
                            {veh.status === 'Tạm khóa (Blocked)' ? (
                              <Unlock className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Lock className="w-4 h-4" />
                            )}
                          </button>
                        </Authorize>
                        <Authorize form="Frm_CardVehicle" action="sua" mode="disable">
                          <button
                            type="button"
                            onClick={() => onEditVehicle(veh)}
                            className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-industrial-800"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </Authorize>
                        <Authorize form="Frm_CardVehicle" action="xoa" mode="disable">
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Xác nhận xóa xe ${veh.plateNumber}?`)) {
                                deleteVehicle(veh.id);
                              }
                            }}
                            className="p-1.5 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60"
                            title="Xóa phương tiện"
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

      {/* Mobile Responsive Cards */}
      <div className="md:hidden space-y-3">
        {filteredVehicles.length === 0 ? (
          <div className="p-6 text-center text-slate-400 bg-white dark:bg-industrial-900 rounded-xl border border-slate-200 dark:border-industrial-800">
            Không tìm thấy xe nào.
          </div>
        ) : (
          filteredVehicles.map((veh) => (
            <div
              key={veh.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-industrial-800 bg-white dark:bg-industrial-900 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="font-mono font-black text-base text-industrial-900 dark:text-white bg-slate-100 dark:bg-industrial-800 px-2.5 py-0.5 rounded border border-slate-300 dark:border-industrial-700 inline-block">
                    {veh.plateNumber}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-mono font-bold">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{veh.cardNo}</span>
                    {veh.trailerPlate && (
                      <span className="text-slate-400">/ Moóc: {veh.trailerPlate}</span>
                    )}
                  </div>
                </div>
                <VehicleStatusBadge status={veh.status} />
              </div>

              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Lái xe:</span>
                  <span className="font-medium text-industrial-900 dark:text-white">
                    {veh.driverName} ({veh.driverPhone || 'Chưa có SĐT'})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vận tải:</span>
                  <span className="font-medium">{veh.transportCompany}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bì định mức:</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {formatWeight(veh.defaultTareWeight)}
                  </span>
                </div>
              </div>

              {/* Mobile Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-industrial-800">
                {veh.status === 'Rảnh (Idle)' && (
                  <Authorize form="Frm_DispatchOrder" action="them" mode="disable">
                    <button
                      type="button"
                      onClick={() => onDispatchWithVehicle(veh.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded bg-amber-500 text-white"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Ghép Lệnh</span>
                    </button>
                  </Authorize>
                )}
                <Authorize form="Frm_CardVehicle" action="sua" mode="disable">
                  <button
                    type="button"
                    onClick={() => toggleStatus(veh)}
                    className="p-2 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-industrial-800"
                  >
                    {veh.status === 'Tạm khóa (Blocked)' ? (
                      <Unlock className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                  </button>
                </Authorize>
                <Authorize form="Frm_CardVehicle" action="sua" mode="disable">
                  <button
                    type="button"
                    onClick={() => onEditVehicle(veh)}
                    className="p-2 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-industrial-800"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </Authorize>
                <Authorize form="Frm_CardVehicle" action="xoa" mode="disable">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Xác nhận xóa xe ${veh.plateNumber}?`)) {
                        deleteVehicle(veh.id);
                      }
                    }}
                    className="p-2 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Authorize>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
