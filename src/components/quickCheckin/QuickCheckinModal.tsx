import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/dispatchStore';
import { Modal } from '../common/Modal';
import { Zap, CheckCircle2, Truck, CreditCard, ArrowRight } from 'lucide-react';
import { formatWeight } from '../../utils/formatters';
import { soundFx } from '../../utils/audio';

interface QuickCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickCheckinModal: React.FC<QuickCheckinModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { 
    vehicles, 
    commands, 
    findVehicleByCardOrPlate, 
    addVehicle, 
    createDispatchOrder, 
    setActiveTab 
  } = useStore();

  const [inputPlateOrCard, setInputPlateOrCard] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [transportCompany, setTransportCompany] = useState('');
  const [tareWeight, setTareWeight] = useState<number>(13.5);
  const [selectedCommandId, setSelectedCommandId] = useState<string>('');
  const [isExistingVehicle, setIsExistingVehicle] = useState(false);
  const [matchedVehicleId, setMatchedVehicleId] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [assignedTicketToken, setAssignedTicketToken] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputPlateOrCard('');
      setDriverName('');
      setDriverPhone('');
      setTransportCompany('');
      setTareWeight(13.5);
      setSelectedCommandId(commands.length > 0 ? commands[0].id : '');
      setIsExistingVehicle(false);
      setMatchedVehicleId(null);
      setIsSuccess(false);
    }
  }, [isOpen, commands]);

  // Real-time lookup as user types plate or scans RFID
  const handleInputChange = (val: string) => {
    const clean = val.toUpperCase();
    setInputPlateOrCard(clean);

    const found = findVehicleByCardOrPlate(clean);
    if (found) {
      setIsExistingVehicle(true);
      setMatchedVehicleId(found.id);
      setDriverName(found.driverName);
      setDriverPhone(found.driverPhone || '');
      setTransportCompany(found.transportCompany);
      setTareWeight(found.defaultTareWeight);
    } else {
      setIsExistingVehicle(false);
      setMatchedVehicleId(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPlateOrCard.trim() || !selectedCommandId) {
      alert('Vui lòng nhập Biển số/Mã thẻ và chọn Lệnh vận chuyển.');
      return;
    }

    let vehicleIdToUse = matchedVehicleId;

    // If new vehicle, register immediately
    if (!vehicleIdToUse) {
      const newVeh = addVehicle({
        cardNo: `RFID-${Math.floor(1000 + Math.random() * 9000)}`,
        plateNumber: inputPlateOrCard.trim().toUpperCase(),
        driverName: driverName.trim() || 'Tài xế vãng lai',
        driverPhone: driverPhone.trim(),
        transportCompany: transportCompany.trim() || 'Tự do',
        defaultTareWeight: Number(tareWeight),
        status: 'Rảnh (Idle)',
      });
      vehicleIdToUse = newVeh.id;
    }

    // Create 1-1 dispatch order for this vehicle
    const result = createDispatchOrder([selectedCommandId], [vehicleIdToUse], 'Khai báo nhanh tại barrier');
    if (result) {
      soundFx.playBarrierOpenTone();
      setAssignedTicketToken(`GATE-${Math.floor(100 + Math.random() * 900)}`);
      setIsSuccess(true);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
          <span>Khai Báo Nhanh Qua Cổng (Quick Check-in)</span>
        </div>
      }
      subtitle="Dành cho tài xế quét mã tại Barrier hoặc nhân viên trạm tạo lốt nhanh"
      maxWidth="md"
    >
      {isSuccess ? (
        <div className="py-6 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50 dark:ring-emerald-900/30 animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-industrial-900 dark:text-white uppercase">
              CẤP LỐT VÀO CỔNG THÀNH CÔNG!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Barrier đang mở. Mời xe di chuyển lên Bàn Cân Số 1.
            </p>
          </div>

          <div className="p-4 bg-slate-100 dark:bg-industrial-950 rounded-xl border border-slate-200 dark:border-industrial-800 font-mono text-center">
            <div className="text-xs text-slate-400">MÃ TOKEN VÀO CỔNG:</div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-widest mt-1">
              {assignedTicketToken}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-sans">
              Biển số: <b>{inputPlateOrCard}</b>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                setActiveTab('DISPATCH');
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow transition"
            >
              <span>Xem Trên Bảng Kanban Điều Phối</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="max-h-[85vh] sm:max-h-[80vh] overflow-y-auto pr-1">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Plate or Card No */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Biển Số Xe hoặc Quẹt Thẻ RFID Cổng
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                required
                value={inputPlateOrCard}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="VD: 29H-123.45 hoặc RFID-8831"
                className="w-full pl-3 pr-24 py-2.5 text-base font-mono font-bold rounded-lg border-2 border-amber-500 bg-white dark:bg-industrial-950 text-industrial-900 dark:text-white uppercase focus:ring-4 focus:ring-amber-500/20 focus:outline-none"
              />
              {isExistingVehicle && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                  ✓ Đã có trong hệ thống
                </span>
              )}
            </div>
          </div>

          {/* Target Command Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Chọn Lệnh Vận Chuyển / Nghiệp Vụ
            </label>
            <select
              value={selectedCommandId}
              onChange={(e) => setSelectedCommandId(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-industrial-700 bg-white dark:bg-industrial-950 text-industrial-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              {commands.map((cmd) => (
                <option key={cmd.id} value={cmd.id}>
                  [{cmd.code}] {cmd.type} - {cmd.material} ({cmd.customer})
                </option>
              ))}
            </select>
          </div>

          {/* Inline fields if registering a new vehicle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200 dark:border-industrial-800">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Họ tên lái xe</label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="VD: Nguyễn Văn Nam"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-industrial-700 bg-white dark:bg-industrial-950 text-industrial-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Số điện thoại</label>
              <input
                type="tel"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                placeholder="0912.xxx.xxx"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-industrial-700 bg-white dark:bg-industrial-950 text-industrial-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Đơn vị vận tải</label>
              <input
                type="text"
                value={transportCompany}
                onChange={(e) => setTransportCompany(e.target.value)}
                placeholder="VD: LogiTrans"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-industrial-700 bg-white dark:bg-industrial-950 text-industrial-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Khối lượng bì mặc định (Tấn)</label>
              <input
                type="number"
                step="0.01"
                value={tareWeight}
                onChange={(e) => setTareWeight(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-industrial-700 bg-white dark:bg-industrial-950 text-industrial-900 dark:text-white"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="sticky bottom-0 bg-white dark:bg-industrial-900 pt-3 pb-1 border-t border-slate-200 dark:border-industrial-800 flex items-center justify-end gap-3 z-10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-industrial-800 rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 active:scale-95 rounded-lg shadow transition"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Xác Nhận & Cấp Lốt Vào Cổng</span>
            </button>
          </div>
        </form>
        </div>
      )}
    </Modal>
  );
};
