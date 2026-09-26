import React, { useState, useEffect } from 'react';
import { VehicleCard, VehicleStatus } from '../../types';
import { Modal } from '../common/Modal';
import { Truck, Save, CreditCard } from 'lucide-react';
import { soundFx } from '../../utils/audio';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<VehicleCard, 'id' | 'lastActiveAt' | 'activeTripId'>) => void;
  onUpdate?: (id: string, data: Partial<VehicleCard>) => void;
  initialData?: VehicleCard | null;
}

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  initialData,
}) => {
  const [cardNo, setCardNo] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [trailerPlate, setTrailerPlate] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [transportCompany, setTransportCompany] = useState('');
  const [defaultTareWeight, setDefaultTareWeight] = useState<number>(12.5);
  const [status, setStatus] = useState<VehicleStatus>('Rảnh (Idle)');

  useEffect(() => {
    if (initialData) {
      setCardNo(initialData.cardNo);
      setPlateNumber(initialData.plateNumber);
      setTrailerPlate(initialData.trailerPlate || '');
      setDriverName(initialData.driverName);
      setDriverPhone(initialData.driverPhone || '');
      setTransportCompany(initialData.transportCompany);
      setDefaultTareWeight(initialData.defaultTareWeight);
      setStatus(initialData.status);
    } else {
      setCardNo(`RFID-${Math.floor(1000 + Math.random() * 9000)}`);
      setPlateNumber('');
      setTrailerPlate('');
      setDriverName('');
      setDriverPhone('');
      setTransportCompany('');
      setDefaultTareWeight(12.5);
      setStatus('Rảnh (Idle)');
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNo.trim() || !plateNumber.trim() || !driverName.trim()) {
      alert('Vui lòng điền đủ Mã thẻ RFID, Biển số xe và Tên tài xế.');
      return;
    }

    if (initialData && onUpdate) {
      onUpdate(initialData.id, {
        cardNo: cardNo.trim().toUpperCase(),
        plateNumber: plateNumber.trim().toUpperCase(),
        trailerPlate: trailerPlate.trim().toUpperCase() || undefined,
        driverName: driverName.trim(),
        driverPhone: driverPhone.trim(),
        transportCompany: transportCompany.trim(),
        defaultTareWeight: Number(defaultTareWeight),
        status,
      });
    } else {
      onSave({
        cardNo: cardNo.trim().toUpperCase(),
        plateNumber: plateNumber.trim().toUpperCase(),
        trailerPlate: trailerPlate.trim().toUpperCase() || undefined,
        driverName: driverName.trim(),
        driverPhone: driverPhone.trim(),
        transportCompany: transportCompany.trim(),
        defaultTareWeight: Number(defaultTareWeight),
        status,
      });
    }
    soundFx.playScaleCaptureTone();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-amber-500" />
          <span>{initialData ? `Cập Nhật Phương Tiện: ${initialData.plateNumber}` : 'Đăng Ký Xe & Gán Thẻ RFID Mới'}</span>
        </div>
      }
      subtitle="Quản lý định danh phương tiện và khối lượng bì tiêu chuẩn"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* RFID Card No & Plate */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-amber-500" />
              Mã Thẻ RFID / Barcode
            </label>
            <input
              type="text"
              required
              value={cardNo}
              onChange={(e) => setCardNo(e.target.value.toUpperCase())}
              placeholder="RFID-8831"
              className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-300 dark:border-industrial-700 bg-slate-50 dark:bg-industrial-950 text-industrial-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Biển Số Xe Đầu Kéo / Xe Tải
            </label>
            <input
              type="text"
              required
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
              placeholder="VD: 29H-123.45"
              className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-300 dark:border-industrial-700 bg-white dark:bg-industrial-950 text-industrial-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase"
            />
          </div>
        </div>

        {/* Trailer Plate & Default Tare */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Biển Số Rơ-moóc (Nếu có)
            </label>
            <input
              type="text"
              value={trailerPlate}
              onChange={(e) => setTrailerPlate(e.target.value.toUpperCase())}
              placeholder="VD: 29R-012.34"
              className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-300 dark:border-industrial-700 bg-white dark:bg-industrial-950 text-industrial-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Khối Lượng Bì Định Mức (Tấn)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={defaultTareWeight}
              onChange={(e) => setDefaultTareWeight(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-300 dark:border-industrial-700 bg-white dark:bg-industrial-950 text-industrial-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              placeholder="14.50"
            />
          </div>
        </div>

        {/* Driver Name & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Họ Tên Lái Xe
            </label>
            <input
              type="text"
              required
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="VD: Nguyễn Văn Hùng"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-industrial-700 bg-white dark:bg-industrial-950 text-industrial-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Số Điện Thoại Lái Xe
            </label>
            <input
              type="tel"
              value={driverPhone}
              onChange={(e) => setDriverPhone(e.target.value)}
              placeholder="0912.345.678"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-industrial-700 bg-white dark:bg-industrial-950 text-industrial-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Company & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Doanh Nghiệp / Công Ty Vận Tải
            </label>
            <input
              type="text"
              required
              value={transportCompany}
              onChange={(e) => setTransportCompany(e.target.value)}
              placeholder="VD: LogiTrans Bắc Nam"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-industrial-700 bg-white dark:bg-industrial-950 text-industrial-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Trạng Thái Thẻ / Xe
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as VehicleStatus)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-industrial-700 bg-white dark:bg-industrial-950 text-industrial-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="Rảnh (Idle)">Rảnh (Sẵn sàng nhận lệnh)</option>
              <option value="Đang trong trạm (In-Station)">Đang trong trạm</option>
              <option value="Tạm khóa (Blocked)">Tạm khóa</option>
            </select>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-industrial-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-industrial-800 rounded-lg transition"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-500 active:scale-95 rounded-lg shadow transition"
          >
            <Save className="w-4 h-4" />
            <span>{initialData ? 'Cập Nhật' : 'Lưu Phương Tiện'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
