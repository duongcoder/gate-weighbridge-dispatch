import React, { useState } from 'react';
import { useStore } from '../../store/dispatchStore';
import { Modal } from '../common/Modal';
import { VehicleCard } from '../../types';
import { VehicleStatusBadge, GateStepBadge } from '../common/Badge';
import { soundFx } from '../../utils/audio';
import { ScanLine, Search, CheckCircle2, AlertCircle, ArrowRight, Zap } from 'lucide-react';

interface RfidScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVehicleForAction?: (vehicle: VehicleCard) => void;
}

export const RfidScanModal: React.FC<RfidScanModalProps> = ({
  isOpen,
  onClose,
  onSelectVehicleForAction,
}) => {
  const { vehicles, trips, findVehicleByCardOrPlate } = useStore();
  const [inputCode, setInputCode] = useState('');
  const [matchedVehicle, setMatchedVehicle] = useState<VehicleCard | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleScan = (codeToScan: string) => {
    const clean = codeToScan.trim().toUpperCase();
    setInputCode(clean);
    setHasSearched(true);

    const found = findVehicleByCardOrPlate(clean);
    if (found) {
      setMatchedVehicle(found);
      soundFx.playRfidBeep();
    } else {
      setMatchedVehicle(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleScan(inputCode);
    }
  };

  const matchedTrip = matchedVehicle?.activeTripId
    ? trips.find((t) => t.id === matchedVehicle.activeTripId)
    : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-amber-500 animate-pulse" />
          <span>Mô Phỏng Đầu Đọc Thẻ RFID / Barcode Cổng</span>
        </div>
      }
      subtitle="Quét thẻ từ tần số cao UHF RFID hoặc quét mã vạch nhận diện tự động"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Input Barcode / RFID */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
            Nhập hoặc Quét Mã Thẻ RFID / Biển Số (Nhấn Enter)
          </label>
          <div className="relative">
            <input
              type="text"
              autoFocus
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              placeholder="VD: RFID-8831 hoặc 29H-123.45"
              className="w-full pl-3 pr-24 py-2.5 text-base font-mono font-bold rounded-lg border-2 border-amber-500/80 bg-white dark:bg-industrial-950 text-industrial-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-amber-500/20"
            />
            <button
              type="button"
              onClick={() => handleScan(inputCode)}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold transition flex items-center gap-1"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Quét (Enter)</span>
            </button>
          </div>
        </div>

        {/* Quick simulation tag chips */}
        <div className="space-y-1.5 bg-slate-50 dark:bg-industrial-950 p-3 rounded-lg border border-slate-200 dark:border-industrial-800">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Nhấp Thẻ Mẫu Đang Hoạt Động Để Thử Nghiệm:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {vehicles.slice(0, 5).map((veh) => (
              <button
                key={veh.id}
                type="button"
                onClick={() => handleScan(veh.cardNo)}
                className="px-2.5 py-1 text-xs font-mono font-semibold bg-white dark:bg-industrial-800 hover:bg-amber-100 dark:hover:bg-amber-950/80 hover:text-amber-700 dark:hover:text-amber-300 rounded border border-slate-200 dark:border-industrial-700 transition"
              >
                🏷️ {veh.cardNo} ({veh.plateNumber})
              </button>
            ))}
          </div>
        </div>

        {/* Scan Result */}
        {hasSearched && (
          <div className="pt-2">
            {matchedVehicle ? (
              <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold text-sm text-emerald-800 dark:text-emerald-300">
                      NHẬN DIỆN THÀNH CÔNG!
                    </span>
                  </div>
                  <VehicleStatusBadge status={matchedVehicle.status} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Biển số xe:</span>{' '}
                    <span className="font-mono font-bold text-base text-industrial-900 dark:text-white">
                      {matchedVehicle.plateNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Mã thẻ RFID:</span>{' '}
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {matchedVehicle.cardNo}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Lái xe:</span>{' '}
                    <span className="font-medium text-industrial-900 dark:text-white">
                      {matchedVehicle.driverName} ({matchedVehicle.driverPhone})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Bì định mức:</span>{' '}
                    <span className="font-mono font-bold">
                      {matchedVehicle.defaultTareWeight} Tấn
                    </span>
                  </div>
                </div>

                {/* Active trip status */}
                {matchedTrip && (
                  <div className="p-2.5 rounded-lg bg-white dark:bg-industrial-900 border border-slate-200 dark:border-industrial-800 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-slate-500">Bước trạm hiện tại:</span>
                      <div className="mt-1">
                        <GateStepBadge step={matchedTrip.step} />
                      </div>
                    </div>
                    {matchedTrip.firstWeight && (
                      <div className="text-right">
                        <span className="text-slate-500">Cân #1:</span>
                        <div className="font-mono font-bold text-amber-600">
                          {matchedTrip.firstWeight} Tấn
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectVehicleForAction) {
                        onSelectVehicleForAction(matchedVehicle);
                      }
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow transition"
                  >
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    <span>Xử Lý Điều Phối Phương Tiện Này</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 flex items-center gap-3 text-rose-700 dark:text-rose-300 text-xs">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
                <div>
                  <div className="font-bold">Không tìm thấy thẻ hoặc biển số: "{inputCode}"</div>
                  <div className="mt-0.5 text-rose-600 dark:text-rose-400">
                    Xe chưa được đăng ký vào hệ thống. Bạn có thể bấm "Đăng ký xe mới" để cấp thẻ.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
