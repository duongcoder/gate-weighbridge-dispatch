import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/dispatchStore';
import { GateStep, OrderTrip } from '../../types';
import { TripCard } from './TripCard';
import { TripDetailModal } from './TripDetailModal';
import { DispatchTableView } from './DispatchTableView';
import { RelationBadge } from '../common/Badge';
import { formatWeight } from '../../utils/formatters';
import { Authorize } from '../common/Authorize';
import { 
  Plus, 
  Columns, 
  TableProperties, 
  List, 
  Filter 
} from 'lucide-react';

interface DispatchKanbanProps {
  onOpenWizard: () => void;
  onOpenWeighing: (trip: OrderTrip) => void;
  onOpenTicket: (trip: OrderTrip) => void;
  onAttachVehicle: (orderId: string) => void;
}

const KANBAN_STEPS: { key: GateStep; title: string; subtitle: string; color: string }[] = [
  {
    key: 'GATE_IN',
    title: '1. Chờ Vào Cổng',
    subtitle: 'Quẹt RFID Barrier',
    color: 'border-t-sky-500',
  },
  {
    key: 'SCALE_1',
    title: '2. Bàn Cân Lần 1',
    subtitle: 'Gross / Tare #1',
    color: 'border-t-amber-500',
  },
  {
    key: 'LOADING_UNLOADING',
    title: '3. Đang Bốc Dỡ',
    subtitle: 'Kho bãi / Silo',
    color: 'border-t-purple-500',
  },
  {
    key: 'SCALE_2',
    title: '4. Bàn Cân Lần 2',
    subtitle: 'Tare / Gross #2',
    color: 'border-t-indigo-500',
  },
  {
    key: 'COMPLETED',
    title: '5. Hoàn Tất',
    subtitle: 'In phiếu & Ra cổng',
    color: 'border-t-emerald-500',
  },
];

export const DispatchKanban: React.FC<DispatchKanbanProps> = ({
  onOpenWizard,
  onOpenWeighing,
  onOpenTicket,
  onAttachVehicle,
}) => {
  const { trips, orders, commands, searchQuery, completeOrder } = useStore();
  const [viewMode, setViewMode] = useState<'KANBAN' | 'TABLE' | 'LIST'>('KANBAN');
  const [relationFilter, setRelationFilter] = useState<string>('ALL');

  // Selected trip for full detail modal
  const [detailTrip, setDetailTrip] = useState<OrderTrip | null>(null);

  // 1. Filter individual trips for KANBAN & TABLE views
  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      const order = orders.find((o) => o.id === trip.orderId);
      const primaryCommand = order?.commandIds.length
        ? commands.find((c) => c.id === order.commandIds[0])
        : undefined;

      // Relation type filter
      if (relationFilter !== 'ALL' && order?.relationType !== relationFilter) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesPlate = trip.plateNumber.toLowerCase().includes(q);
        const matchesOrder = order?.code.toLowerCase().includes(q);
        const matchesDriver = trip.driverName.toLowerCase().includes(q);
        const matchesMaterial = primaryCommand?.material.toLowerCase().includes(q);
        const matchesCustomer = primaryCommand?.customer.toLowerCase().includes(q);
        if (!matchesPlate && !matchesOrder && !matchesDriver && !matchesMaterial && !matchesCustomer) {
          return false;
        }
      }

      return true;
    });
  }, [trips, orders, commands, searchQuery, relationFilter]);

  // 2. Filter orders for VIEW 3 (LIST / Gộp Theo Lệnh)
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Filter by relationship
      if (relationFilter !== 'ALL' && order.relationType !== relationFilter) {
        return false;
      }

      // Filter by search query across order code, commands, and vehicles
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesOrderCode = order.code.toLowerCase().includes(q);

        const primaryCmds = order.commandIds
          .map((id) => commands.find((c) => c.id === id))
          .filter(Boolean);
        const matchesCommand = primaryCmds.some(
          (cmd) =>
            cmd &&
            (cmd.code.toLowerCase().includes(q) ||
              cmd.material.toLowerCase().includes(q) ||
              cmd.customer.toLowerCase().includes(q) ||
              cmd.type.toLowerCase().includes(q))
        );

        const orderTrips = trips.filter((t) => t.orderId === order.id);
        const matchesVehicle = orderTrips.some(
          (t) =>
            t.plateNumber.toLowerCase().includes(q) ||
            t.driverName.toLowerCase().includes(q)
        );

        if (!matchesOrderCode && !matchesCommand && !matchesVehicle) {
          return false;
        }
      }

      return true;
    });
  }, [orders, relationFilter, searchQuery, commands, trips]);

  const activeTripsCount = filteredTrips.filter((t) => t.step !== 'COMPLETED').length;

  return (
    <div className="space-y-4">
      {/* Top Controls & View Toggle Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-industrial-900 p-3.5 rounded-xl border border-slate-200 dark:border-industrial-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Relation Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Quan hệ:</span>
            <select
              value={relationFilter}
              onChange={(e) => setRelationFilter(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-300 dark:border-industrial-700 bg-slate-50 dark:bg-industrial-950 text-xs text-industrial-900 dark:text-white font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none"
            >
              <option value="ALL">Tất cả (1-1, 1-N, N-1, N-N)</option>
              <option value="1-1">[1-1] 1 Lệnh - 1 Xe</option>
              <option value="1-N">[1-N] 1 Lệnh - N Xe</option>
              <option value="N-1">[N-1] N Lệnh - 1 Xe</option>
              <option value="N-N">[N-N] N Lệnh - N Xe</option>
            </select>
          </div>

          <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold">
            {activeTripsCount} xe đang vận hành {relationFilter !== 'ALL' ? `(${filteredOrders.length} lệnh)` : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* 3-Way View Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-industrial-950 p-1 rounded-lg border border-slate-200 dark:border-industrial-800">
            {/* 1. Kanban Board */}
            <button
              type="button"
              onClick={() => setViewMode('KANBAN')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
                viewMode === 'KANBAN'
                  ? 'bg-white dark:bg-industrial-800 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Xem dạng bảng Kanban 5 cột quy trình"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Bảng Kanban</span>
            </button>

            {/* 2. Dispatch Table View */}
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
                viewMode === 'TABLE'
                  ? 'bg-white dark:bg-industrial-800 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Xem danh sách xe phẳng với thanh tiến trình mini stepper"
            >
              <TableProperties className="w-3.5 h-3.5" />
              <span>Bảng Danh Sách Xe</span>
            </button>

            {/* 3. Grouped by Order */}
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
          VIEW 1: KANBAN BOARD (Compact 5-column layout fitting viewport 1366px - 1920px)
          ========================================================================= */}
      {viewMode === 'KANBAN' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 w-full min-w-0 items-start">
          {KANBAN_STEPS.map((col) => {
            const colTrips = filteredTrips.filter((t) => t.step === col.key);

            return (
              <div
                key={col.key}
                className={`bg-slate-50/80 dark:bg-industrial-950/80 border border-slate-200 dark:border-industrial-800 rounded-xl p-2.5 space-y-2.5 min-w-0 w-full flex flex-col border-t-4 ${col.color}`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-industrial-800">
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs text-industrial-900 dark:text-white uppercase tracking-wider truncate">
                      {col.title}
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {col.subtitle}
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-industrial-800 border border-slate-200 dark:border-industrial-700 shrink-0 ml-1">
                    {colTrips.length}
                  </span>
                </div>

                {/* Column Trip Cards List */}
                <div className="space-y-2.5 max-h-[72vh] overflow-y-auto pr-0.5">
                  {colTrips.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-industrial-800 rounded-lg">
                      Không có xe
                    </div>
                  ) : (
                    colTrips.map((trip) => (
                      <TripCard
                        key={trip.id}
                        trip={trip}
                        onOpenWeighing={onOpenWeighing}
                        onOpenTicket={onOpenTicket}
                        onSelectTrip={(t) => setDetailTrip(t)}
                        onAttachVehicleModal={onAttachVehicle}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
          VIEW 3: GROUPED BY DISPATCH ORDER (Parent-Child Tree)
          ========================================================================= */}
      {viewMode === 'LIST' && (
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-industrial-900 rounded-xl border border-slate-200 dark:border-industrial-800">
              Không tìm thấy lệnh điều phối nào phù hợp với bộ lọc quan hệ ({relationFilter}) hoặc từ khóa tìm kiếm.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const orderTrips = trips.filter((t) => t.orderId === order.id);
              const primaryCmds = order.commandIds
                .map((id) => commands.find((c) => c.id === id))
                .filter(Boolean);

              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-industrial-900 border border-slate-200 dark:border-industrial-800 rounded-xl p-4 shadow-sm space-y-4"
                >
                  {/* Order Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-industrial-800 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-base text-amber-600 dark:text-amber-400">
                        {order.code}
                      </span>
                      <RelationBadge relation={order.relationType} />
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-bold ${
                          order.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {order.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Đang điều phối'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onAttachVehicle(order.id)}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded bg-slate-100 dark:bg-industrial-800 hover:bg-slate-200 dark:hover:bg-industrial-700 text-slate-700 dark:text-slate-300 transition"
                      >
                        + Bổ sung xe
                      </button>
                      {order.status !== 'COMPLETED' && (
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
                      )}
                    </div>
                  </div>

                  {/* Commands Included */}
                  <div className="text-xs">
                    <span className="text-slate-500 font-semibold block mb-1">
                      Các lệnh thực hiện ({primaryCmds.length}):
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {primaryCmds.map((cmd) => (
                        <div
                          key={cmd?.id}
                          className="p-2.5 rounded-lg bg-slate-50 dark:bg-industrial-950 border border-slate-200 dark:border-industrial-800 flex justify-between"
                        >
                          <div>
                            <b className="font-mono text-amber-600">{cmd?.code}</b>: {cmd?.material}
                            <div className="text-[11px] text-slate-500">{cmd?.customer}</div>
                          </div>
                          <div className="text-right font-mono">
                            <span className="font-bold text-emerald-600">{formatWeight(cmd?.completedWeight)}</span>
                            <span className="text-slate-400"> / {formatWeight(cmd?.targetWeight)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Trucks in this order */}
                  <div>
                    <span className="text-xs text-slate-500 font-semibold block mb-2">
                      Danh sách xe trong lệnh ({orderTrips.length} phương tiện):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {orderTrips.map((trip) => (
                        <TripCard
                          key={trip.id}
                          trip={trip}
                          onOpenWeighing={onOpenWeighing}
                          onOpenTicket={onOpenTicket}
                          onSelectTrip={(t) => setDetailTrip(t)}
                          onAttachVehicleModal={onAttachVehicle}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
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
