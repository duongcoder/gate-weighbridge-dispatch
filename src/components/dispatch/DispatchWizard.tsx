import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/dispatchStore';
import { Modal } from '../common/Modal';
import { RelationBadge } from '../common/Badge';
import { Command, VehicleCard, RelationType } from '../../types';
import { formatWeight } from '../../utils/formatters';
import { soundFx } from '../../utils/audio';
import { 
  Share2, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Truck, 
  FileText, 
  CheckCircle2, 
  Search, 
  AlertCircle 
} from 'lucide-react';

interface DispatchWizardProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCommandId?: string | null;
  preselectedVehicleId?: string | null;
}

export const DispatchWizard: React.FC<DispatchWizardProps> = ({
  isOpen,
  onClose,
  preselectedCommandId,
  preselectedVehicleId,
}) => {
  const { commands, vehicles, createDispatchOrder } = useStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCommandIds, setSelectedCommandIds] = useState<string[]>([]);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [cmdSearch, setCmdSearch] = useState('');
  const [vehSearch, setVehSearch] = useState('');

  // Auto pre-populate when triggered from Command or Vehicle tables
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedCommandIds(preselectedCommandId ? [preselectedCommandId] : []);
      setSelectedVehicleIds(preselectedVehicleId ? [preselectedVehicleId] : []);
      setDispatchNotes('');
      setCmdSearch('');
      setVehSearch('');
    }
  }, [isOpen, preselectedCommandId, preselectedVehicleId]);

  // Determine current relation type
  const relationType: RelationType = React.useMemo(() => {
    const cCount = selectedCommandIds.length;
    const vCount = selectedVehicleIds.length;
    if (cCount <= 1 && vCount <= 1) return '1-1';
    if (cCount === 1 && vCount > 1) return '1-N';
    if (cCount > 1 && vCount === 1) return 'N-1';
    return 'N-N';
  }, [selectedCommandIds.length, selectedVehicleIds.length]);

  const toggleCommand = (id: string) => {
    setSelectedCommandIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleVehicle = (id: string) => {
    setSelectedVehicleIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredCommands = commands.filter((c) => {
    if (!cmdSearch.trim()) return true;
    const q = cmdSearch.toLowerCase();
    return (
      c.code.toLowerCase().includes(q) ||
      c.customer.toLowerCase().includes(q) ||
      c.material.toLowerCase().includes(q)
    );
  });

  const availableVehicles = vehicles.filter((v) => {
    // Show idle vehicles, or the currently preselected vehicle
    const isAvailable = v.status === 'Rảnh (Idle)' || v.id === preselectedVehicleId;
    if (!vehSearch.trim()) return isAvailable;
    const q = vehSearch.toLowerCase();
    return (
      isAvailable &&
      (v.plateNumber.toLowerCase().includes(q) ||
        v.cardNo.toLowerCase().includes(q) ||
        v.driverName.toLowerCase().includes(q))
    );
  });

  const handleFinish = () => {
    if (selectedCommandIds.length === 0 || selectedVehicleIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 Lệnh và 1 Xe.');
      return;
    }

    const res = createDispatchOrder(selectedCommandIds, selectedVehicleIds, dispatchNotes);
    if (res) {
      soundFx.playScaleCaptureTone();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-amber-500" />
          <span>Tạo Phiếu Điều Phối Ghép Lệnh & Xe</span>
        </div>
      }
      subtitle="Thiết lập liên kết 1-1, 1-N, N-1 hoặc N-N cho luồng phương tiện qua cổng"
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Wizard Step Progress Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-industrial-800 pb-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 1
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-slate-200 dark:bg-industrial-800 text-slate-500'
              }`}
            >
              1
            </span>
            <span className={`text-xs font-bold ${step === 1 ? 'text-amber-500' : 'text-slate-500'}`}>
              Chọn Lệnh ({selectedCommandIds.length})
            </span>
          </div>

          <div className="h-0.5 flex-1 mx-3 bg-slate-200 dark:bg-industrial-800" />

          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 2
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-slate-200 dark:bg-industrial-800 text-slate-500'
              }`}
            >
              2
            </span>
            <span className={`text-xs font-bold ${step === 2 ? 'text-amber-500' : 'text-slate-500'}`}>
              Chọn Xe ({selectedVehicleIds.length})
            </span>
          </div>

          <div className="h-0.5 flex-1 mx-3 bg-slate-200 dark:bg-industrial-800" />

          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 3
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-slate-200 dark:bg-industrial-800 text-slate-500'
              }`}
            >
              3
            </span>
            <span className={`text-xs font-bold ${step === 3 ? 'text-amber-500' : 'text-slate-500'}`}>
              Xác Nhận & Cấp Lốt
            </span>
          </div>
        </div>

        {/* Dynamic Mapping Badge Banner */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-industrial-950 border border-slate-200 dark:border-industrial-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              QUAN HỆ ĐIỀU PHỐI TỰ TÍNH:
            </span>
            <RelationBadge relation={relationType} />
          </div>
          <div className="text-xs font-mono font-bold text-industrial-900 dark:text-white">
            {selectedCommandIds.length} Lệnh ⇄ {selectedVehicleIds.length} Phương Tiện
          </div>
        </div>

        {/* =========================================================================
            STEP 1: SELECT COMMANDS
            ========================================================================= */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={cmdSearch}
                  onChange={(e) => setCmdSearch(e.target.value)}
                  placeholder="Lọc mã lệnh, khách hàng, mặt hàng..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-industrial-700 bg-white dark:bg-industrial-950 text-industrial-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                (Có thể chọn 1 hoặc nhiều lệnh)
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {filteredCommands.map((cmd) => {
                const isChecked = selectedCommandIds.includes(cmd.id);
                return (
                  <div
                    key={cmd.id}
                    onClick={() => toggleCommand(cmd.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      isChecked
                        ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 ring-1 ring-amber-500'
                        : 'border-slate-200 dark:border-industrial-800 bg-white dark:bg-industrial-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 mt-0.5 rounded flex items-center justify-center border transition ${
                          isChecked
                            ? 'bg-amber-500 border-amber-500 text-white'
                            : 'border-slate-300 dark:border-industrial-700'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                            {cmd.code}
                          </span>
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-industrial-800 rounded">
                            {cmd.type}
                          </span>
                        </div>
                        <div className="font-bold text-xs text-industrial-900 dark:text-white mt-0.5">
                          {cmd.customer}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Hàng: <span className="font-medium text-slate-700 dark:text-slate-300">{cmd.material}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono text-xs">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {formatWeight(cmd.completedWeight)}
                      </span>
                      <span className="text-slate-400"> / {formatWeight(cmd.targetWeight)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 2: SELECT VEHICLES
            ========================================================================= */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={vehSearch}
                  onChange={(e) => setVehSearch(e.target.value)}
                  placeholder="Lọc biển số, mã thẻ RFID, tên tài xế..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-industrial-700 bg-white dark:bg-industrial-950 text-industrial-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                (Có thể chọn 1 hoặc nhiều xe)
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {availableVehicles.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  Hiện không có xe rảnh sẵn sàng. Hãy hoàn tất chuyến xe trước hoặc đăng ký xe mới.
                </div>
              ) : (
                availableVehicles.map((veh) => {
                  const isChecked = selectedVehicleIds.includes(veh.id);
                  return (
                    <div
                      key={veh.id}
                      onClick={() => toggleVehicle(veh.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isChecked
                          ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 ring-1 ring-amber-500'
                          : 'border-slate-200 dark:border-industrial-800 bg-white dark:bg-industrial-900 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center border transition ${
                            isChecked
                              ? 'bg-amber-500 border-amber-500 text-white'
                              : 'border-slate-300 dark:border-industrial-700'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-industrial-900 dark:text-white bg-slate-100 dark:bg-industrial-800 px-2 py-0.5 rounded">
                              {veh.plateNumber}
                            </span>
                            <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
                              🏷️ {veh.cardNo}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            Lái xe: <span className="font-medium text-slate-800 dark:text-slate-200">{veh.driverName}</span> ({veh.driverPhone || '---'})
                          </div>
                        </div>
                      </div>

                      <div className="text-right text-xs">
                        <div className="text-slate-400 text-[10px]">Bì định mức:</div>
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {formatWeight(veh.defaultTareWeight)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 3: REVIEW & CONFIRM
            ========================================================================= */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-industrial-800 bg-slate-50 dark:bg-industrial-950 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                TÓM TẮT ĐIỀU PHỐI VẬN CHUYỂN
              </h4>

              {/* Commands Summary */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Lệnh vận chuyển ({selectedCommandIds.length}):
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedCommandIds.map((cId) => {
                    const c = commands.find((item) => item.id === cId);
                    return c ? (
                      <span
                        key={c.id}
                        className="px-2.5 py-1 rounded bg-white dark:bg-industrial-900 border border-slate-200 dark:border-industrial-800 text-xs font-medium"
                      >
                        <b className="font-mono text-amber-600">{c.code}</b> ({c.material} - {c.customer})
                      </span>
                    ) : null;
                  })}
                </div>
              </div>

              {/* Vehicles Summary */}
              <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-industrial-800">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Đội xe nhận lệnh ({selectedVehicleIds.length}):
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedVehicleIds.map((vId) => {
                    const v = vehicles.find((item) => item.id === vId);
                    return v ? (
                      <span
                        key={v.id}
                        className="px-2.5 py-1 rounded bg-white dark:bg-industrial-900 border border-slate-200 dark:border-industrial-800 text-xs font-mono font-bold"
                      >
                        🚛 {v.plateNumber} ({v.driverName})
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Ghi Chú Điều Phối / Cổng Làn Ưu Tiên
              </label>
              <textarea
                rows={2}
                value={dispatchNotes}
                onChange={(e) => setDispatchNotes(e.target.value)}
                placeholder="Cho phép vào qua Cổng 1, bốc hàng khu B..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-industrial-700 bg-white dark:bg-industrial-950 text-industrial-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Wizard Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-industrial-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as 1 | 2)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-industrial-700 hover:bg-slate-100 dark:hover:bg-industrial-800 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay Lại</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              disabled={
                (step === 1 && selectedCommandIds.length === 0) ||
                (step === 2 && selectedVehicleIds.length === 0)
              }
              onClick={() => setStep((s) => (s + 1) as 2 | 3)}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 active:scale-95 rounded-lg shadow transition disabled:opacity-50"
            >
              <span>Tiếp Theo: {step === 1 ? 'Chọn Xe' : 'Xác Nhận'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-lg shadow-md transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Hoàn Tất Ghép & Cấp Lốt Ra Vào</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
