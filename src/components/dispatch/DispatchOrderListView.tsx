import React from 'react';
import { DispatchOrder, OrderTrip, OrderStatusFilter } from '../../types';
import { useStore } from '../../store/dispatchStore';
import { formatWeight } from '../../utils/formatters';
import {
  DispatchTableHead,
  TripTableRow,
  DISPATCH_TABLE_COL_SPAN,
  DISPATCH_TABLE_MIN_WIDTH,
} from './DispatchTable';

interface DispatchOrderListViewProps {
  orders: DispatchOrder[];
  onOpenWeighing: (trip: OrderTrip) => void;
  onOpenTicket: (trip: OrderTrip) => void;
  onSelectTrip: (trip: OrderTrip) => void;
  onAttachVehicle: (orderId: string) => void;
  /** Chế độ lọc đang chọn: ACTIVE (chỉ xe đang vận hành) / COMPLETED (chỉ xe đã hoàn thành) */
  statusFilter: OrderStatusFilter;
  /** Nhãn trạng thái lệnh đang lọc (Đang chạy / Hoàn thành) — dùng cho thông báo rỗng */
  statusLabel?: string;
}

/**
 * ============================================================================
 * "GỘP THEO LỆNH" — dạng DANH SÁCH BẢNG (Table/List)
 * ============================================================================
 * Mỗi lệnh điều phối = 1 dòng tiêu đề nhóm lệnh (mã lệnh điều phối,
 * trạng thái lệnh, số xe, danh sách lệnh + tiến độ khối lượng); bên dưới là các hàng xe
 * thuộc lệnh đó — dùng chung `TripTableRow` với "Bảng Danh Sách Xe" nên cột & style luôn đồng bộ.
 *
 * Hai chế độ hiển thị (theo prop `statusFilter`):
 *   - ACTIVE    (Đang chạy): CHỈ lệnh đang chạy + CHỈ xe đang vận hành (trong trạm);
 *                            vẫn có nút "+ Bổ sung xe" / "Hoàn tất lệnh".
 *   - COMPLETED (Hoàn thành): chế độ LỊCH SỬ — hiển thị MỌI LƯỢT ĐÃ KẾT THÚC:
 *                            lệnh đã hoàn thành (toàn bộ lượt) HOẶC lượt cũ + lượt hiện tại đã xong
 *                            của lệnh còn chạy; tiêu đề "N lượt • Lịch sử hoàn thành";
 *                            ẨN các nút thao tác điều phối.
 */
export const DispatchOrderListView: React.FC<DispatchOrderListViewProps> = ({
  orders,
  statusFilter,
  statusLabel,
  onOpenWeighing,
  onOpenTicket,
  onSelectTrip,
  onAttachVehicle,
}) => {
  const { trips, commands, completeOrder } = useStore();

  return (
    <div className="bg-white dark:bg-industrial-900 rounded-xl border border-slate-200 dark:border-industrial-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto w-full">
        <table className={`w-full text-left border-collapse text-xs ${DISPATCH_TABLE_MIN_WIDTH}`}>
          <DispatchTableHead />

          {orders.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={DISPATCH_TABLE_COL_SPAN} className="p-8 text-center text-slate-400 dark:text-slate-500">
                  Không tìm thấy lệnh điều phối nào ở trạng thái «{statusLabel || 'Đang chạy'}» phù hợp với từ khóa tìm kiếm.
                </td>
              </tr>
            </tbody>
          ) : (
            orders.map((order) => {
              // LỌC THEO CHẾ ĐỘ (LỊCH SỬ THEO LƯỢT):
              //   - Đang chạy  → chỉ LƯỢT HIỆN TẠI đang vận hành (chuyến chưa hoàn tất)
              //   - Hoàn thành → lệnh ĐÃ hoàn thành: TOÀN BỘ lượt; lệnh còn chạy: chỉ các LƯỢT LỊCH SỬ
              // Số lượt ở tiêu đề nhóm luôn khớp với danh sách hiển thị.
              const allOrderTrips = trips.filter((t) => t.orderId === order.id);
              const orderTrips = statusFilter === 'ACTIVE'
                ? allOrderTrips.filter((t) => t.step !== 'COMPLETED')
                : (order.status === 'COMPLETED'
                    ? allOrderTrips
                    : allOrderTrips.filter((t) => t.isHistoricalRound === true || t.step === 'COMPLETED'));

              const primaryCmds = order.commandIds
                .map((id) => commands.find((c) => c.id === id))
                .filter(Boolean);

              return (
                <tbody key={order.id} className="divide-y divide-slate-200 dark:divide-industrial-800">
                  {/* ---------- DÒNG TIÊU ĐỀ NHÓM LỆNH ---------- */}
                  <tr className="bg-slate-100/80 dark:bg-industrial-950/90 border-y border-slate-200 dark:border-industrial-800">
                    <td colSpan={DISPATCH_TABLE_COL_SPAN} className="p-0 align-top">
                      <div className="px-3 py-2.5 space-y-2">
                        {/* Mã lệnh điều phối + Trạng thái lệnh + Số xe + Thao tác lệnh.
                            (Đã BỎ badge quan hệ [1-1]/[1-N]… cho gọn dòng tiêu đề — thông tin
                            quan hệ vẫn hiển thị trên từng hàng xe dạng "(1-1)") */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-black text-sm text-amber-600 dark:text-amber-400">
                              {order.code}
                            </span>
                            {/* Ở chế độ LỊCH SỬ luôn hiển thị "Đã hoàn thành" vì nhóm chỉ chứa
                                các lượt đã kết thúc (kể cả khi lệnh đang chạy lại lượt mới). */}
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded font-bold ${
                                statusFilter === 'COMPLETED' || order.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              {statusFilter === 'COMPLETED' || order.status === 'COMPLETED'
                                ? 'Đã hoàn thành'
                                : 'Đang điều phối'}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              {statusFilter === 'COMPLETED'
                                ? `${orderTrips.length} lượt • Lịch sử hoàn thành`
                                : `${orderTrips.length} xe`}
                            </span>
                            {statusFilter === 'ACTIVE' && (
                              <span className="text-[11px] italic text-slate-400 dark:text-slate-500">
                                (đang trong trạm)
                              </span>
                            )}
                          </div>

                          {/* Thao tác điều phối CHỈ hiển thị ở chế độ ĐANG CHẠY với lệnh chưa hoàn thành.
                              Ở chế độ Hoàn thành (LỊCH SỬ) → ẩn cả "+ Bổ sung xe" lẫn "Hoàn tất lệnh". */}
                          {statusFilter === 'ACTIVE' && order.status !== 'COMPLETED' && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onAttachVehicle(order.id)}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded bg-slate-100 dark:bg-industrial-800 hover:bg-slate-200 dark:hover:bg-industrial-700 text-slate-700 dark:text-slate-300 transition"
                              >
                                + Bổ sung xe
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Hoàn tất toàn bộ các chuyến của lệnh ${order.code}?`)) {
                                    completeOrder(order.id);
                                  }
                                }}
                                className="text-xs font-bold px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition"
                              >
                                Hoàn tất lệnh
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Danh sách lệnh & tiến độ khối lượng */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                          <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide">
                            Lệnh:
                          </span>
                          {primaryCmds.map((cmd) => (
                            <span key={cmd?.id} className="inline-flex items-center gap-1.5">
                              <b className="font-mono text-amber-600 dark:text-amber-400">{cmd?.code}</b>
                              <span className="text-slate-400">—</span>
                              <span className="font-semibold text-industrial-900 dark:text-white">{cmd?.material}</span>
                              <span className="text-slate-400">— {cmd?.customer} —</span>
                              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {formatWeight(cmd?.completedWeight)}
                              </span>
                              <span className="text-slate-400">/ {formatWeight(cmd?.targetWeight)}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* ---------- CÁC HÀNG XE THUỘC LỆNH ---------- */}
                  {orderTrips.length === 0 ? (
                    <tr>
                      <td colSpan={DISPATCH_TABLE_COL_SPAN} className="p-4 text-center text-[11px] italic text-slate-400 dark:text-slate-500">
                        Lệnh chưa có xe nào. Nhấn “+ Bổ sung xe” để ghép thêm phương tiện.
                      </td>
                    </tr>
                  ) : (
                    orderTrips.map((trip) => (
                      <TripTableRow
                        key={trip.id}
                        trip={trip}
                        onOpenWeighing={onOpenWeighing}
                        onOpenTicket={onOpenTicket}
                        onSelectTrip={onSelectTrip}
                      />
                    ))
                  )}
                </tbody>
              );
            })
          )}
        </table>
      </div>
    </div>
  );
};