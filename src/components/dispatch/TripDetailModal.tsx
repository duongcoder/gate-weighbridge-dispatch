import React from 'react';
import { OrderTrip } from '../../types';
import { useStore } from '../../store/dispatchStore';
import { Modal } from '../common/Modal';
import { GateStepBadge, RelationBadge } from '../common/Badge';
import { formatWeight, formatDateTime } from '../../utils/formatters';
import { 
  Truck, 
  Scale, 
  Printer, 
  ArrowRight, 
  UserMinus, 
  Clock, 
  Phone, 
  MapPin, 
  Building, 
  FileText, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface TripDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: OrderTrip | null;
  onOpenWeighing: (trip: OrderTrip) => void;
  onOpenTicket: (trip: OrderTrip) => void;
}

export const TripDetailModal: React.FC<TripDetailModalProps> = ({
  isOpen,
  onClose,
  trip,
  onOpenWeighing,
  onOpenTicket,
}) => {
  const { orders, commands, vehicles, advanceTripStep, detachVehicleFromOrder } = useStore();

  if (!trip) return null;

  const parentOrder = orders.find((o) => o.id === trip.orderId);
  const primaryCommand = parentOrder?.commandIds.length
    ? commands.find((c) => c.id === parentOrder.commandIds[0])
    : undefined;
  const vehicle = vehicles.find((v) => v.id === trip.vehicleId);

  const isInbound = primaryCommand?.type === 'Nhập hàng';
  const isWeighingStep = trip.step === 'SCALE_1' || trip.step === 'SCALE_2';

  const handleDetach = () => {
    if (window.confirm(`Xác nhận tách xe ${trip.plateNumber} ra khỏi lệnh điều phối ${parentOrder?.code}?`)) {
      detachVehicleFromOrder(trip.id);
      onClose();
    }
  };

  const handleAdvance = () => {
    advanceTripStep(trip.id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-amber-500" />
          <span>Chi Tiết Chuyến Xe: {trip.plateNumber}</span>
        </div>
      }
      subtitle={`Mã Lệnh: ${parentOrder?.code || '---'} | Lốt: ${trip.id.slice(-6)}`}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Status Header Banner */}
        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-industrial-950 border border-slate-200 dark:border-industrial-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-lg text-industrial-900 dark:text-white bg-white dark:bg-industrial-900 px-3 py-1 rounded-lg border border-slate-300 dark:border-industrial-700 shadow-sm">
              {trip.plateNumber}
            </span>
            {parentOrder && <RelationBadge relation={parentOrder.relationType} />}
          </div>
          <GateStepBadge step={trip.step} />
        </div>

        {/* 2-Column Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Column 1: Vehicle & Driver */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-industrial-800 bg-white dark:bg-industrial-900/60 space-y-2 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-industrial-800">
              <Truck className="w-4 h-4 text-amber-500" />
              Thông Tin Phương Tiện & Lái Xe
            </h4>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Mã Thẻ RFID:</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{vehicle?.cardNo || '---'}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Rơ-moóc:</span>
              <span className="font-mono font-semibold">{vehicle?.trailerPlate || 'Không có'}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Lái xe:</span>
              <span className="font-bold text-industrial-900 dark:text-white">{trip.driverName}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Số điện thoại:</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{trip.driverPhone || '---'}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Đơn vị vận tải:</span>
              <span className="font-medium text-right">{trip.transportCompany || vehicle?.transportCompany || '---'}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Bì định mức mặc định:</span>
              <span className="font-mono font-bold">{formatWeight(vehicle?.defaultTareWeight)}</span>
            </div>
          </div>

          {/* Column 2: Order & Cargo */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-industrial-800 bg-white dark:bg-industrial-900/60 space-y-2 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-industrial-800">
              <FileText className="w-4 h-4 text-amber-500" />
              Hàng Hóa & Khách Hàng
            </h4>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Mã Lệnh Điều Động:</span>
              <span className="font-mono font-bold text-amber-600">{primaryCommand?.code || parentOrder?.code}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Nghiệp vụ:</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-industrial-800 text-slate-800 dark:text-slate-200">
                {primaryCommand?.type || 'Vận chuyển'}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Mặt hàng:</span>
              <span className="font-bold text-industrial-900 dark:text-white text-right">{primaryCommand?.material || '---'}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Chủ hàng / Khách hàng:</span>
              <span className="font-medium text-right">{primaryCommand?.customer || '---'}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Kế hoạch lệnh:</span>
              <span className="font-mono font-bold">{formatWeight(primaryCommand?.targetWeight)}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Đã giao lũy kế:</span>
              <span className="font-mono font-bold text-emerald-600">{formatWeight(primaryCommand?.completedWeight)}</span>
            </div>
          </div>
        </div>

        {/* Detailed Weighing Audit Log */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-industrial-800 bg-slate-50 dark:bg-industrial-950 space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-amber-500" />
              Nhật Ký Cân Điện Tử Trạm
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Làn: {trip.lane || 'Làn Cân #01 (Vào/Ra)'}</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
            <div className="p-2.5 rounded-lg bg-white dark:bg-industrial-900 border border-slate-200 dark:border-industrial-800 font-mono">
              <span className="text-[10px] text-slate-400 uppercase block">{isInbound ? 'Cân Lần 1 (Cân Tổng Gross)' : 'Cân Lần 1 (Cân Bì Tare)'}</span>
              <span className="text-base font-black text-amber-600 dark:text-amber-400 block mt-1">
                {formatWeight(trip.firstWeight)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {trip.firstWeightTime ? formatDateTime(trip.firstWeightTime) : 'Chưa cân'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white dark:bg-industrial-900 border border-slate-200 dark:border-industrial-800 font-mono">
              <span className="text-[10px] text-slate-400 uppercase block">{isInbound ? 'Cân Lần 2 (Cân Bì Tare)' : 'Cân Lần 2 (Cân Tổng Gross)'}</span>
              <span className="text-base font-black text-indigo-600 dark:text-indigo-400 block mt-1">
                {formatWeight(trip.secondWeight)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {trip.secondWeightTime ? formatDateTime(trip.secondWeightTime) : 'Chưa cân'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 font-mono">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase block">Khối Lượng Hàng Ròng (Net)</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">
                {formatWeight(trip.netWeight)}
              </span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-500 block mt-0.5">
                {trip.completedTime ? `Hoàn tất: ${formatDateTime(trip.completedTime)}` : 'Đang tính toán'}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
            <span>KTV Trực Cân: <b>{trip.scaleOperator || 'Trần Văn Mạnh'}</b></span>
            <span>Ghi chú: {trip.notes || 'Không có ghi chú'}</span>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-industrial-800">
          <div className="flex items-center gap-2">
            {trip.step !== 'COMPLETED' && (
              <button
                type="button"
                onClick={handleDetach}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg border border-rose-200 dark:border-rose-900 transition"
              >
                <UserMinus className="w-3.5 h-3.5" />
                <span>Tách Xe Khỏi Lệnh</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenTicket(trip);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-industrial-700 bg-white dark:bg-industrial-900 hover:bg-slate-100 dark:hover:bg-industrial-800 text-slate-700 dark:text-slate-200 transition"
            >
              <Printer className="w-3.5 h-3.5 text-amber-500" />
              <span>In Phiếu Cân (A5 / 80mm)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isWeighingStep ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenWeighing(trip);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow transition active:scale-95"
              >
                <Scale className="w-4 h-4" />
                <span>{trip.step === 'SCALE_1' ? 'Mở Cửa Sổ Cân Lần 1' : 'Mở Cửa Sổ Cân Lần 2'}</span>
              </button>
            ) : trip.step !== 'COMPLETED' ? (
              <button
                type="button"
                onClick={handleAdvance}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow transition"
              >
                <span>Chuyển Sang Bước Kế Tiếp</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-industrial-800 text-slate-600 dark:text-slate-300"
              >
                Đóng
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
