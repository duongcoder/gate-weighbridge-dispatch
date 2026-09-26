import React from 'react';
import { OrderTrip } from '../../types';
import { useStore } from '../../store/dispatchStore';
import { formatWeight } from '../../utils/formatters';
import { Authorize } from '../common/Authorize';
import { 
  Scale, 
  Printer, 
  ArrowRight, 
  Clock, 
  FileText 
} from 'lucide-react';

interface TripCardProps {
  trip: OrderTrip;
  onOpenWeighing: (trip: OrderTrip) => void;
  onOpenTicket: (trip: OrderTrip) => void;
  onSelectTrip?: (trip: OrderTrip) => void;
  onAttachVehicleModal?: (orderId: string) => void;
}

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  onOpenWeighing,
  onOpenTicket,
  onSelectTrip,
}) => {
  const { orders, commands, advanceTripStep } = useStore();

  const parentOrder = orders.find((o) => o.id === trip.orderId);
  const primaryCommand = parentOrder?.commandIds.length
    ? commands.find((c) => c.id === parentOrder.commandIds[0])
    : undefined;

  const isInbound = primaryCommand?.type === 'Nhập hàng';
  const isWeighingStep = trip.step === 'SCALE_1' || trip.step === 'SCALE_2';

  const handleQuickAdvance = (e: React.MouseEvent) => {
    e.stopPropagation();
    advanceTripStep(trip.id);
  };

  const handleWeighClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenWeighing(trip);
  };

  const handleTicketClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenTicket(trip);
  };

  // Compact single-line weight summary calculation
  const renderWeightSummary = () => {
    if (trip.netWeight !== undefined) {
      return (
        <div className="flex items-center justify-between text-[11px] font-mono bg-emerald-50/80 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
          <span className="truncate">
            #1: {formatWeight(trip.firstWeight)} | #2: {formatWeight(trip.secondWeight)}
          </span>
          <span className="font-black text-xs ml-1 text-emerald-600 dark:text-emerald-400">
            Hàng: {formatWeight(trip.netWeight)}
          </span>
        </div>
      );
    }

    if (trip.firstWeight !== undefined) {
      return (
        <div className="flex items-center justify-between text-[11px] font-mono bg-amber-50/80 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
          <span>{isInbound ? 'Cân Tổng (#1):' : 'Cân Bì (#1):'}</span>
          <span className="font-bold">{formatWeight(trip.firstWeight)}</span>
        </div>
      );
    }

    return (
      <div className="text-[10px] text-slate-400 dark:text-slate-500 italic py-0.5">
        Chưa có số cân
      </div>
    );
  };

  return (
    <div 
      onClick={() => onSelectTrip && onSelectTrip(trip)}
      className="group bg-white dark:bg-industrial-900 border border-slate-200 dark:border-industrial-800 hover:border-amber-400 dark:hover:border-amber-500/70 rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-[155px] select-none"
    >
      {/* 1. Header: License Plate & Order Code Tag */}
      <div>
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-mono font-black text-sm text-industrial-900 dark:text-white bg-slate-100 dark:bg-industrial-800 px-2 py-0.5 rounded border border-slate-300 dark:border-industrial-700 truncate group-hover:border-amber-400">
              {trip.plateNumber}
            </span>
            {parentOrder && (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-industrial-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-industrial-700 shrink-0">
                {parentOrder.code}
              </span>
            )}
          </div>

          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shrink-0">
            {parentOrder?.relationType || '1-1'}
          </span>
        </div>

        {/* 2. Middle: Material name & Driver */}
        <div className="mt-1.5 text-xs">
          <div className="font-bold text-industrial-900 dark:text-white truncate" title={primaryCommand?.material}>
            {primaryCommand?.material || 'Hàng hóa chung'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {trip.driverName}
          </div>
        </div>
      </div>

      {/* 3. Single-line weight summary */}
      <div className="my-1">
        {renderWeightSummary()}
      </div>

      {/* 4. Bottom Action Row */}
      <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100 dark:border-industrial-800/80">
        {/* Quick Ticket Print Icon */}
        <Authorize form="Frm_WeighingTicket" action="baoCao" mode="disable">
          <button
          type="button"
          onClick={handleTicketClick}
          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-industrial-800 transition"
          title="In phiếu cân & giấy vào ra cổng"
        >
          <Printer className="w-3.5 h-3.5" />
        </button>
        </Authorize>

        {/* Primary Action Button */}
        <div>
          {trip.step === 'SCALE_1' && (
            <Authorize form="Frm_ScaleCapture" action="sua" mode="disable">
              <button
              type="button"
              onClick={handleWeighClick}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-sm active:scale-95 transition"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Cân Lần 1</span>
            </button>
            </Authorize>
          )}

          {trip.step === 'SCALE_2' && (
            <Authorize form="Frm_ScaleCapture" action="sua" mode="disable">
              <button
              type="button"
              onClick={handleWeighClick}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm active:scale-95 transition"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Cân Lần 2</span>
            </button>
            </Authorize>
          )}

          {trip.step !== 'SCALE_1' && trip.step !== 'SCALE_2' && trip.step !== 'COMPLETED' && (
            <Authorize form="Frm_DispatchOrder" action="sua" mode="disable">
              <button
              type="button"
              onClick={handleQuickAdvance}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-industrial-800 hover:bg-slate-200 dark:hover:bg-industrial-700 text-industrial-900 dark:text-white transition"
            >
              <span>Tiếp</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            </Authorize>
          )}

          {trip.step === 'COMPLETED' && (
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 rounded">
              ✓ Hoàn tất
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
