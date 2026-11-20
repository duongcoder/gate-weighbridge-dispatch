import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/dispatchStore';
import { OrderTrip, OrderStatusFilter } from '../../types';
import { TripDetailModal } from './TripDetailModal';
import { DispatchTableView } from './DispatchTableView';
import { DispatchOrderListView } from './DispatchOrderListView';
import { SHOW_FIVE_STEP_PROGRESS, SHOW_DISPATCH_TABLE_VIEW } from '../../config/features';
import { Authorize } from '../common/Authorize';
import { 
  Plus, 
  TableProperties, 
  List, 
  Filter 
} from 'lucide-react';

/**
 * Bộ lọc "Trạng thái lệnh" của tab Điều Phối Ghép Lệnh — CHỈ 2 chế độ:
 *   ACTIVE    = Đang chạy
 *   COMPLETED = Hoàn thành
 * (Đã loại bỏ hoàn toàn lựa chọn "Tất cả" — không còn nhánh xử lý 'ALL'.)
 * Kiểu `OrderStatusFilter` được khai báo chung tại `src/types/index.ts`.
 */

/** Xe đang vận hành = chuyến chưa hoàn tất (tương ứng Card.Status = false / TRONG TRẠM) */
const isTripRunning = (trip: OrderTrip): boolean => trip.step !== 'COMPLETED';

/**
 * Các LƯỢT thuộc LỊCH SỬ HOÀN THÀNH của một lệnh điều phối:
 *  • Lệnh ĐÃ hoàn thành (dbo.command.Status = 2) → TOÀN BỘ xe/lượt của lệnh đó.
 *  • Lệnh còn ĐANG CHẠY:
 *      - LƯỢT LỊCH SỬ (dòng dbo.Order cũ bị lượt mới hơn thay thế) ⇒ luôn thuộc lịch sử.
 *      - LƯỢT HIỆN TẠI đã kết thúc (chuyến đã COMPLETED / xe đã rời trạm) ⇒ vào lịch sử
 *        NGAY khi xe xong lượt, KHÔNG chờ cả lệnh đóng ⇒ số lượt tăng LIỀN MẠCH (6 → 7),
 *        không bị thu hẹp rồi nhảy vọt khi lệnh mở chạy lại.
 */
const historyTripsOf = (allTrips: OrderTrip[], orderId: string, orderCompleted: boolean): OrderTrip[] => {
  const groupTrips = allTrips.filter((t) => t.orderId === orderId);
  if (orderCompleted) return groupTrips;
  return groupTrips.filter((t) => t.isHistoricalRound === true || t.step === 'COMPLETED');
};

/** Nhãn hiển thị cho bộ lọc (map từ DispatchOrder.status). Thứ tự khoá = thứ tự option. */
const ORDER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Đang chạy',
  COMPLETED: 'Hoàn thành',
};

interface DispatchKanbanProps {
  onOpenWizard: () => void;
  onOpenWeighing: (trip: OrderTrip) => void;
  onOpenTicket: (trip: OrderTrip) => void;
  onAttachVehicle: (orderId: string) => void;
}

export const DispatchKanban: React.FC<DispatchKanbanProps> = ({
  onOpenWizard,
  onOpenWeighing,
  onOpenTicket,
  onAttachVehicle,
}) => {
  const { trips, orders, commands, searchQuery } = useStore();
  // Mặc định LUÔN là "Gộp Theo Lệnh"; chế độ "Bảng Danh Sách Xe" chỉ dùng lại được khi
  // SHOW_DISPATCH_TABLE_VIEW = true (xem src/config/features.ts).
  const [viewMode, setViewMode] = useState<'TABLE' | 'LIST'>('LIST');
  // Bộ lọc Trạng thái lệnh — CHỈ 2 chế độ: ACTIVE (Đang chạy) | COMPLETED (Hoàn thành).
  // Mặc định ACTIVE để mở tab lên là thấy ngay các lệnh đang vận hành.
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('ACTIVE');

  // Selected trip for full detail modal
  const [detailTrip, setDetailTrip] = useState<OrderTrip | null>(null);

  // 1. Filter individual trips for TABLE view
  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      const order = orders.find((o) => o.id === trip.orderId);
      const primaryCommand = order?.commandIds.length
        ? commands.find((c) => c.id === order.commandIds[0])
        : undefined;

      // LỌC THÔNG MINH theo trạng thái lệnh:
      //   - Đang chạy  → CHỈ lệnh ACTIVE + CHỈ xe đang vận hành (chuyến chưa hoàn tất)
      //   - Hoàn thành → CHỈ lệnh ĐÃ hoàn thành (lịch sử) + toàn bộ xe của lệnh đó
      if (statusFilter === 'ACTIVE') {
        if (order?.status !== 'ACTIVE' || !isTripRunning(trip)) {
          return false;
        }
      } else if (
        order?.status !== 'COMPLETED' &&
        trip.isHistoricalRound !== true &&
        trip.step !== 'COMPLETED'
      ) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesPlate = (trip.plateNumber || '').toLowerCase().includes(q);
        const matchesOrder = (order?.code || '').toLowerCase().includes(q);
        const matchesDriver = (trip.driverName || '').toLowerCase().includes(q);
        const matchesMaterial = (primaryCommand?.material || '').toLowerCase().includes(q);
        const matchesCustomer = (primaryCommand?.customer || '').toLowerCase().includes(q);
        if (!matchesPlate && !matchesOrder && !matchesDriver && !matchesMaterial && !matchesCustomer) {
          return false;
        }
      }

      return true;
    });
  }, [trips, orders, commands, searchQuery, statusFilter]);

  // 2. Filter orders for VIEW 3 (LIST / Gộp Theo Lệnh)
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const groupTrips = trips.filter((t) => t.orderId === order.id);

      // LỌC THÔNG MINH (khớp đúng số xe hiển thị trong tiêu đề nhóm):
      //   - Đang chạy  → lệnh ACTIVE và còn ≥1 xe ĐANG vận hành
      //   - Hoàn thành → CHỈ lệnh ĐÃ hoàn thành (dbo.command.Status = 2) — xem như LỊCH SỬ,
      //     KHÔNG trộn nhóm "Đang điều phối" vào danh sách lịch sử.
      if (statusFilter === 'ACTIVE') {
        if (order.status !== 'ACTIVE' || !groupTrips.some(isTripRunning)) {
          return false;
        }
      } else if (historyTripsOf(trips, order.id, order.status === 'COMPLETED').length === 0) {
        return false;
      }

      // Filter by search query across order code, commands, and vehicles
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesOrderCode = (order.code || '').toLowerCase().includes(q);

        const primaryCmds = order.commandIds
          .map((id) => commands.find((c) => c.id === id))
          .filter(Boolean);
        const matchesCommand = primaryCmds.some(
          (cmd) =>
            cmd &&
            ((cmd.code || '').toLowerCase().includes(q) ||
              (cmd.material || '').toLowerCase().includes(q) ||
              (cmd.customer || '').toLowerCase().includes(q) ||
              (cmd.type || '').toLowerCase().includes(q))
        );

        const orderTrips = trips.filter((t) => t.orderId === order.id);
        const matchesVehicle = orderTrips.some(
          (t) =>
            (t.plateNumber || '').toLowerCase().includes(q) ||
            (t.driverName || '').toLowerCase().includes(q)
        );

        if (!matchesOrderCode && !matchesCommand && !matchesVehicle) {
          return false;
        }
      }

      return true;
    });
  }, [orders, statusFilter, searchQuery, commands, trips]);

  // Tổng số xe THỰC TẾ đang hiển thị trong chế độ "Gộp Theo Lệnh"
  // (= tổng số xe ở tiêu đề các nhóm lệnh, khớp với bộ lọc thông minh theo trạng thái xe)
  const visibleTripsCount = useMemo(
    () =>
      filteredOrders.reduce((sum, order) => {
        const groupTrips = trips.filter((t) => t.orderId === order.id);
        // Đang chạy: đếm xe đang vận hành • Lịch sử: đếm các LƯỢT thuộc lịch sử hoàn thành
        const shown = statusFilter === 'ACTIVE'
          ? groupTrips.filter(isTripRunning)
          : historyTripsOf(trips, order.id, order.status === 'COMPLETED');
        return sum + shown.length;
      }, 0),
    [filteredOrders, trips, statusFilter]
  );

  return (
    <div className="space-y-4">
      {/* Top Controls & View Toggle Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-industrial-900 p-3.5 rounded-xl border border-slate-200 dark:border-industrial-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Trạng thái lệnh Filter — CHỈ 2 chế độ: Đang chạy / Hoàn thành */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Trạng thái lệnh:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatusFilter)}
              className="px-2 py-1 rounded-lg border border-slate-300 dark:border-industrial-700 bg-slate-50 dark:bg-industrial-950 text-xs text-industrial-900 dark:text-white font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none"
            >
              {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold">
            {statusFilter === 'ACTIVE'
              ? `${visibleTripsCount} xe đang vận hành (${filteredOrders.length} lệnh Đang chạy)`
              : `${visibleTripsCount} xe đã hoàn thành (${filteredOrders.length} lệnh đã hoàn thành)`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View Switcher: Table View & Grouped View —
              TẠM ẨN theo cờ SHOW_DISPATCH_TABLE_VIEW (src/config/features.ts).
              Đặt = true để hiện lại nút chuyển đổi và dùng lại "Bảng Danh Sách Xe". */}
          {SHOW_DISPATCH_TABLE_VIEW && (
            <div className="flex items-center bg-slate-100 dark:bg-industrial-950 p-1 rounded-lg border border-slate-200 dark:border-industrial-800">
              {/* 1. Dispatch Table View */}
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
                  viewMode === 'TABLE'
                    ? 'bg-white dark:bg-industrial-800 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={SHOW_FIVE_STEP_PROGRESS ? 'Xem danh sách xe phẳng với thanh tiến trình mini stepper' : 'Xem danh sách xe dạng bảng chi tiết'}
              >
                <TableProperties className="w-3.5 h-3.5" />
                <span>Bảng Danh Sách Xe</span>
              </button>

              {/* 2. Grouped by Order */}
              <button
                type="button"
                onClick={() => setViewMode('LIST')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
                  viewMode === 'LIST'
                    ? 'bg-white dark:bg-industrial-800 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Gộp xe theo từng lệnh điều phối cha"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Gộp Theo Lệnh</span>
              </button>
            </div>
          )}

          {/* New Dispatch Wizard button */}
          <Authorize form="Frm_DispatchOrder" action="them" mode="disable">
            <button
            type="button"
            onClick={onOpenWizard}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-amber-600 hover:bg-amber-500 active:scale-95 rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Ghép Lệnh (F3)</span>
          </button>
          </Authorize>
        </div>
      </div>

            {/* =========================================================================
          VIEW 2: DISPATCH TABLE VIEW (High-density flat view with Mini Stepper)
          ========================================================================= */}
      {viewMode === 'TABLE' && (
        <DispatchTableView
          trips={filteredTrips}
          onOpenWeighing={onOpenWeighing}
          onOpenTicket={onOpenTicket}
          onSelectTrip={(t) => setDetailTrip(t)}
        />
      )}

      {/* =========================================================================
          VIEW 3: "GỘP THEO LỆNH" — dạng DANH SÁCH BẢNG nhóm theo lệnh điều phối.
          (Giao diện thẻ lưới trước đây được GIỮ LẠI trong TripCard.tsx nếu cần quay về.)
          ========================================================================= */}
      {viewMode === 'LIST' && (
        <DispatchOrderListView
          orders={filteredOrders}
          statusFilter={statusFilter}
          statusLabel={ORDER_STATUS_LABELS[statusFilter]}
          onOpenWeighing={onOpenWeighing}
          onOpenTicket={onOpenTicket}
          onSelectTrip={(t) => setDetailTrip(t)}
          onAttachVehicle={onAttachVehicle}
        />
      )}

      {/* Trip Detail Modal */}
      <TripDetailModal
        isOpen={!!detailTrip}
        onClose={() => setDetailTrip(null)}
        trip={detailTrip}
        onOpenWeighing={onOpenWeighing}
        onOpenTicket={onOpenTicket}
      />
    </div>
  );
};
