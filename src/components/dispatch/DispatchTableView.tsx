import React from 'react';
import { OrderTrip } from '../../types';
import { useStore } from '../../store/dispatchStore';
import { formatWeight } from '../../utils/formatters';
import { Authorize } from '../common/Authorize';
import { 
  Scale, 
  Printer, 
  ArrowRight, 
  CheckCircle2, 
  Eye, 
  Truck 
} from 'lucide-react';

interface DispatchTableViewProps {
  trips: OrderTrip[];
  onOpenWeighing: (trip: OrderTrip) => void;
  onOpenTicket: (trip: OrderTrip) => void;
  onSelectTrip: (trip: OrderTrip) => void;
}

const STEP_KEYS = ['GATE_IN', 'SCALE_1', 'LOADING_UNLOADING', 'SCALE_2', 'COMPLETED'];
const STEP_LABELS = ['1. Cổng vào', '2. Cân #1', '3. Bốc dỡ', '4. Cân #2', '5. Hoàn tất'];

export const DispatchTableView: React.FC<DispatchTableViewProps> = ({
  trips,
  onOpenWeighing,
  onOpenTicket,
  onSelectTrip,
}) => {
  const { orders, commands, advanceTripStep } = useStore();

  const handleQuickAdvance = (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation();
    advanceTripStep(tripId);
  };

  const handleWeighClick = (e: React.MouseEvent, trip: OrderTrip) => {
    e.stopPropagation();
    onOpenWeighing(trip);
  };

  const handleTicketClick = (e: React.MouseEvent, trip: OrderTrip) => {
    e.stopPropagation();
    onOpenTicket(trip);
  };

  return (
    <div className="bg-white dark:bg-industrial-900 rounded-xl border border-slate-200 dark:border-industrial-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse text-xs min-w-[950px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-industrial-800 bg-slate-50 dark:bg-industrial-950 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <th className="p-3 w-40">Biển Số Xe & Lái Xe</th>
              <th className="p-3 w-52">Lệnh & Mặt Hàng</th>
              <th className="p-3 w-28">Nghiệp Vụ</th>
              <th className="p-3 w-72 text-center">Tiến Trình 5 Bước (Mini Stepper)</th>
              <th className="p-3 w-48 text-center">Số Cân (Lần 1 / 2 / Ròng)</th>
              <th className="p-3 w-40 text-right">Xử Lý Nhanh</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-industrial-800">
            {trips.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 dark:text-slate-500">
                  Không tìm thấy chuyến xe nào phù hợp.
                </td>
              </tr>
            ) : (
              trips.map((trip) => {
                const parentOrder = orders.find((o) => o.id === trip.orderId);
                const primaryCommand = parentOrder?.commandIds.length
                  ? commands.find((c) => c.id === parentOrder.commandIds[0])
                  : undefined;

                const currentStepIdx = STEP_KEYS.indexOf(trip.step);
                const isWeighingStep = trip.step === 'SCALE_1' || trip.step === 'SCALE_2';

                return (
                  <tr
                    key={trip.id}
                    onClick={() => onSelectTrip(trip)}
                    className="hover:bg-amber-50/40 dark:hover:bg-industrial-800/60 transition-colors cursor-pointer group"
                  >
                    {/* 1. Vehicle & Driver */}
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-industrial-900 dark:text-white bg-slate-100 dark:bg-industrial-800 px-2 py-0.5 rounded border border-slate-300 dark:border-industrial-700 group-hover:border-amber-400">
                          {trip.plateNumber}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {trip.driverName}
                      </div>
                    </td>

                    {/* 2. Order & Material */}
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {parentOrder?.code || '---'}
                        </span>
                        <span className="text-[10px] text-slate-400">({parentOrder?.relationType})</span>
                      </div>
                      <div className="font-bold text-industrial-900 dark:text-white truncate max-w-[200px]" title={primaryCommand?.material}>
                        {primaryCommand?.material || '---'}
                      </div>
                    </td>

                    {/* 3. Type */}
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-industrial-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-industrial-700">
                        {primaryCommand?.type || 'Vận chuyển'}
                      </span>
                    </td>

                    {/* 4. Mini Stepper */}
                    <td className="p-3">
                      <div className="flex items-center justify-between gap-1 max-w-[280px] mx-auto">
                        {STEP_KEYS.map((key, idx) => {
                          const isDone = idx < currentStepIdx || trip.step === 'COMPLETED';
                          const isCurrent = idx === currentStepIdx && trip.step !== 'COMPLETED';

                          let circleClass = 'bg-slate-200 text-slate-500 dark:bg-industrial-800 dark:text-slate-500';
                          if (isCurrent) {
                            circleClass = 'bg-amber-500 text-white ring-2 ring-amber-300 dark:ring-amber-900 animate-pulse';
                          } else if (isDone) {
                            circleClass = 'bg-emerald-500 text-white';
                          }

                          return (
                            <div key={key} className="flex items-center gap-1 flex-1 min-w-0">
                              <div 
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${circleClass}`}
                                title={STEP_LABELS[idx]}
                              >
                                {isDone ? '✓' : idx + 1}
                              </div>
                              {idx < STEP_KEYS.length - 1 && (
                                <div className={`h-0.5 flex-1 transition-all ${idx < currentStepIdx ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-industrial-800'}`} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-[10px] text-center font-medium text-amber-600 dark:text-amber-400 mt-1">
                        {STEP_LABELS[currentStepIdx] || 'Hoàn tất'}
                      </div>
                    </td>

                    {/* 5. Weight readings */}
                    <td className="p-3 text-center font-mono">
                      <div className="text-[11px] space-y-0.5">
                        <div className="text-slate-600 dark:text-slate-300">
                          #1: <b>{formatWeight(trip.firstWeight)}</b> | #2: <b>{formatWeight(trip.secondWeight)}</b>
                        </div>
                        {trip.netWeight !== undefined ? (
                          <div className="font-black text-emerald-600 dark:text-emerald-400 text-xs">
                            Hàng: {formatWeight(trip.netWeight)}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 italic">Chưa chốt hàng ròng</div>
                        )}
                      </div>
                    </td>

                    {/* 6. Quick Action */}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Ticket button */}
                        <Authorize form="Frm_WeighingTicket" action="baoCao" mode="disable">
                          <button
                          type="button"
                          onClick={(e) => handleTicketClick(e, trip)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-industrial-800 transition"
                          title="In phiếu cân"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        </Authorize>

                        {/* Detail button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTrip(trip);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-industrial-800 transition"
                          title="Xem chi tiết chuyến xe"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Primary Step action */}
                        {isWeighingStep ? (
                          <Authorize form="Frm_ScaleCapture" action="sua" mode="disable">
                            <button
                            type="button"
                            onClick={(e) => handleWeighClick(e, trip)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-sm transition active:scale-95 ml-1"
                          >
                            <Scale className="w-3.5 h-3.5" />
                            <span>Cân</span>
                          </button>
                          </Authorize>
                        ) : trip.step !== 'COMPLETED' ? (
                          <Authorize form="Frm_DispatchOrder" action="sua" mode="disable">
                            <button
                            type="button"
                            onClick={(e) => handleQuickAdvance(e, trip.id)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-industrial-800 hover:bg-slate-200 dark:hover:bg-industrial-700 text-industrial-900 dark:text-white transition ml-1"
                          >
                            <span>Tiếp</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          </Authorize>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 rounded ml-1">
                            ✓ Xong
                          </span>
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
  );
};
