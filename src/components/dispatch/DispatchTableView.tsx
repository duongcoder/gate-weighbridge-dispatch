import React from 'react';
import { OrderTrip } from '../../types';
import {
  DispatchTableHead,
  TripTableRow,
  DISPATCH_TABLE_COL_SPAN,
  DISPATCH_TABLE_MIN_WIDTH,
} from './DispatchTable';

interface DispatchTableViewProps {
  trips: OrderTrip[];
  onOpenWeighing: (trip: OrderTrip) => void;
  onOpenTicket: (trip: OrderTrip) => void;
  onSelectTrip: (trip: OrderTrip) => void;
}

/**
 * ============================================================================
 * "BẢNG DANH SÁCH XE" — Bảng phẳng liệt kê mọi chuyến xe (không nhóm theo lệnh).
 * ============================================================================
 * ⚠️ TẠM ẨN khỏi tab Điều Phối Ghép Lệnh theo cờ `SHOW_DISPATCH_TABLE_VIEW`
 *    (src/config/features.ts) — tab hiện chỉ hiển thị "Gộp Theo Lệnh"
 *    (xem `DispatchOrderListView.tsx`).
 * File này ĐƯỢC GIỮ LẠI nguyên vẹn; đặt `SHOW_DISPATCH_TABLE_VIEW = true`
 * để hiện lại nút chuyển đổi chế độ và dùng lại giao diện này.
 * Phần header cột & hàng xe dùng chung với `DispatchOrderListView` qua `DispatchTable.tsx`.
 */
export const DispatchTableView: React.FC<DispatchTableViewProps> = ({
  trips,
  onOpenWeighing,
  onOpenTicket,
  onSelectTrip,
}) => {
  return (
    <div className="bg-white dark:bg-industrial-900 rounded-xl border border-slate-200 dark:border-industrial-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto w-full">
        <table className={`w-full text-left border-collapse text-xs ${DISPATCH_TABLE_MIN_WIDTH}`}>
          <DispatchTableHead />
          <tbody className="divide-y divide-slate-200 dark:divide-industrial-800">
            {trips.length === 0 ? (
              <tr>
                <td colSpan={DISPATCH_TABLE_COL_SPAN} className="p-8 text-center text-slate-400 dark:text-slate-500">
                  Không tìm thấy chuyến xe nào phù hợp.
                </td>
              </tr>
            ) : (
              trips.map((trip) => (
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
        </table>
      </div>
    </div>
  );
};