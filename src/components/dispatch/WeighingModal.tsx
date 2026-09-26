import React, { useState, useEffect } from 'react';
import { OrderTrip, Command, DispatchOrder } from '../../types';
import { useStore } from '../../store/dispatchStore';
import { Modal } from '../common/Modal';
import { Scale, Save, CheckCircle2, ArrowRight, Activity, RotateCcw } from 'lucide-react';
import { formatWeight } from '../../utils/formatters';
import { soundFx } from '../../utils/audio';

interface WeighingModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: OrderTrip | null;
  onTripCompleted?: (tripId: string) => void;
}

export const WeighingModal: React.FC<WeighingModalProps> = ({
  isOpen,
  onClose,
  trip,
  onTripCompleted,
}) => {
  const { 
    orders, 
    commands, 
    scaleReading, 
    advanceTripStep, 
    setSimulatedScaleWeight 
  } = useStore();

  const [weightValue, setWeightValue] = useState<number>(0);
  const [operatorName, setOperatorName] = useState('Trần Văn Mạnh (KTV Bàn Cân 1)');
  const [notes, setNotes] = useState('');
  const [isServiceOnePass, setIsServiceOnePass] = useState(false);

  // Find parent order & primary command to deduce directional scale logic
  const parentOrder = trip ? orders.find((o) => o.id === trip.orderId) : undefined;
  const primaryCommand = parentOrder?.commandIds.length
    ? commands.find((c) => c.id === parentOrder.commandIds[0])
    : undefined;

  const isInbound = primaryCommand?.type === 'Nhập hàng';
  const isOutbound = primaryCommand?.type === 'Xuất hàng';
  const isService = primaryCommand?.type === 'Cân dịch vụ';

  const isWeighingStep1 = trip?.step === 'GATE_IN' || trip?.step === 'SCALE_1';
  const isWeighingStep2 = trip?.step === 'LOADING_UNLOADING' || trip?.step === 'SCALE_2';

  // Label configuration based on direction
  let scale1Label = 'Cân Lần 1';
  let scale2Label = 'Cân Lần 2';
  let scale1Type = 'Tổng (Gross)';
  let scale2Type = 'Bì (Tare)';

  if (isInbound) {
    scale1Label = 'Cân Lần 1 (Xe đầy hàng vào trạm)';
    scale1Type = 'Cân Tổng (Gross Weight)';
    scale2Label = 'Cân Lần 2 (Xe không tải sau khi dỡ)';
    scale2Type = 'Cân Bì (Tare Weight)';
  } else if (isOutbound) {
    scale1Label = 'Cân Lần 1 (Xe rỗng vào lấy hàng)';
    scale1Type = 'Cân Bì (Tare Weight)';
    scale2Label = 'Cân Lần 2 (Xe đầy hàng sau khi bốc)';
    scale2Type = 'Cân Tổng (Gross Weight)';
  }

  // Pre-fill weight with current scale reading on open
  useEffect(() => {
    if (isOpen) {
      if (scaleReading.currentWeight > 0) {
        setWeightValue(scaleReading.currentWeight);
      } else if (isWeighingStep1) {
        // Suggested default
        setWeightValue(isInbound ? 45.80 : 13.50);
      } else if (isWeighingStep2) {
        setWeightValue(isInbound ? 14.20 : 46.20);
      }
      setNotes(trip?.notes || '');
    }
  }, [isOpen, scaleReading.currentWeight, isWeighingStep1, isWeighingStep2, isInbound, trip?.notes]);

  if (!trip) return null;

  // Capture live weight from digital scale bar
  const handleCaptureFromScale = () => {
    setWeightValue(scaleReading.currentWeight);
    soundFx.playScaleCaptureTone();
  };

  const handleSaveWeight = () => {
    if (weightValue <= 0) {
      alert('Khối lượng cân phải lớn hơn 0.');
      return;
    }

    if (isWeighingStep1) {
      // Advance to LOADING_UNLOADING
      advanceTripStep(trip.id, 'LOADING_UNLOADING', {
        firstWeight: weightValue,
        operator: operatorName,
        notes,
      });
      soundFx.playScaleCaptureTone();
    } else if (isWeighingStep2) {
      // Calculate final Net weight and advance to COMPLETED
      const firstW = trip.firstWeight || 0;
      const net = Math.abs(Number((firstW - weightValue).toFixed(2)));

      advanceTripStep(trip.id, 'COMPLETED', {
        secondWeight: weightValue,
        netWeight: net,
        operator: operatorName,
        notes,
      });

      soundFx.playBarrierOpenTone();
      if (onTripCompleted) {
        onTripCompleted(trip.id);
      }
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-amber-500" />
          <span>Ghi Nhận Khối Lượng Cân: Xe {trip.plateNumber}</span>
        </div>
      }
      subtitle={`Lệnh: ${parentOrder?.code || '---'} | Nghiệp vụ: ${primaryCommand?.type || '---'} (${primaryCommand?.material || '---'})`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Direction Notice Banner */}
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
          <div className="font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Quy trình: {primaryCommand?.type || 'Tiêu chuẩn'}</span>
          </div>
          <div className="mt-1 font-medium">
            {isWeighingStep1 ? (
              <span>Đang thực hiện: <b>{scale1Label}</b> ➔ Ghi nhận: <b>{scale1Type}</b></span>
            ) : (
              <span>Đang thực hiện: <b>{scale2Label}</b> ➔ Ghi nhận: <b>{scale2Type}</b></span>
            )}
          </div>
        </div>

        {/* Existing First Weight Info if in Step 2 */}
        {trip.firstWeight !== undefined && isWeighingStep2 && (
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-100 dark:bg-industrial-950 border border-slate-200 dark:border-industrial-800 text-xs font-mono">
            <div>
              <span className="text-slate-500 block">Khối lượng Lần 1:</span>
              <span className="text-base font-black text-amber-600 dark:text-amber-400">
                {formatWeight(trip.firstWeight)}
              </span>
              <span className="text-[10px] text-slate-400 block">{trip.firstWeightTime ? new Date(trip.firstWeightTime).toLocaleTimeString('vi-VN') : ''}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Ước tính hàng ròng:</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                {formatWeight(Math.abs(trip.firstWeight - weightValue))}
              </span>
              <span className="text-[10px] text-slate-400 block">|Lần 1 - Lần 2|</span>
            </div>
          </div>
        )}

        {/* Live Weight Input and Quick Scale Sync */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Khối Lượng Cân Hiện Tại (Tấn)
            </label>
            <button
              type="button"
              onClick={handleCaptureFromScale}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <Activity className="w-3.5 h-3.5 animate-spin" />
              <span>Đọc từ Bàn Cân ({scaleReading.currentWeight.toFixed(2)} Tấn)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              min="0.1"
              value={weightValue}
              onChange={(e) => setWeightValue(parseFloat(e.target.value) || 0)}
              className="flex-1 px-4 py-3 text-2xl font-mono font-black rounded-lg border-2 border-amber-500 bg-white dark:bg-industrial-950 text-industrial-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-amber-500/20"
            />
            <span className="text-lg font-bold font-mono text-slate-500">TẤN</span>
          </div>
        </div>

        {/* Scale Operator Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
            Nhân Viên Trực Cân
          </label>
          <input
            type="text"
            value={operatorName}
            onChange={(e) => setOperatorName(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-industrial-700 bg-white dark:bg-industrial-950 text-industrial-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
            Ghi Chú Cân Hàng
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Xe sạch đáy thùng, đã chốt niêm phong bồn..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-industrial-700 bg-white dark:bg-industrial-950 text-industrial-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-industrial-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-industrial-800 rounded-lg transition"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSaveWeight}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-amber-600 hover:bg-amber-500 active:scale-95 rounded-lg shadow-md transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isWeighingStep1 ? 'Chốt Cân Lần 1 & Đi Bốc Hàng' : 'Chốt Cân Lần 2 & Hoàn Tất Chuyến'}
            </span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
