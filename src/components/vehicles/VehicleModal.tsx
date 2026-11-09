import React, { useState, useEffect, useMemo } from 'react';
import { VehicleCard, VehicleStatus } from '../../types';
import { Modal } from '../common/Modal';
import { ComboboxInput } from '../common/ComboboxInput';
import { SelectDropdown } from '../common/SelectDropdown';
import { useStore } from '../../store/dispatchStore';
import { Truck, Save } from 'lucide-react';
import { soundFx } from '../../utils/audio';

// Danh sách option cố định cho Trạng Thái (giá trị value giữ nguyên khớp VehicleStatus)
const STATUS_OPTIONS = [
  { value: 'Rảnh (Idle)', label: 'Rảnh (Sẵn sàng nhận lệnh)' },
  { value: 'Đang trong trạm (In-Station)', label: 'Đang trong trạm' },
  { value: 'Tạm khóa (Blocked)', label: 'Tạm khóa' },
];

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vehicle: Omit<VehicleCard, 'id' | 'lastActiveAt' | 'activeTripId'>) => void;
  onUpdate?: (id: string, updates: Partial<VehicleCard>) => void;
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
  const [defaultTareWeight, setDefaultTareWeight] = useState<number>(14.5);
  const [status, setStatus] = useState<VehicleStatus>('Rảnh (Idle)');

  const { vehicles } = useStore();

  // Gợi ý lịch sử: trích xuất giá trị unique từ các phương tiện đã có trong store
  const plateSuggestions = useMemo(
    () => Array.from(new Set(vehicles.map((v) => (v.plateNumber || '').trim()).filter(Boolean))).sort(),
    [vehicles]
  );
  const trailerSuggestions = useMemo(
    () => Array.from(new Set(vehicles.map((v) => (v.trailerPlate || '').trim()).filter(Boolean))).sort(),
    [vehicles]
  );
  const companySuggestions = useMemo(
    () => Array.from(new Set(vehicles.map((v) => (v.transportCompany || '').trim()).filter(Boolean))).sort(),
    [vehicles]
  );
  const driverSuggestions = useMemo(
    () => Array.from(new Set(vehicles.map((v) => (v.driverName || '').trim()).filter(Boolean))).sort(),
    [vehicles]
  );

  useEffect(() => {
    if (initialData) {
      setCardNo(initialData.cardNo || '');
      setPlateNumber(initialData.plateNumber);
      setTrailerPlate(initialData.trailerPlate || '');
      setDriverName(initialData.driverName);
      setDriverPhone(initialData.driverPhone || '');
      setTransportCompany(initialData.transportCompany);
      setDefaultTareWeight(initialData.defaultTareWeight);
      setStatus(initialData.status);
    } else {
      setCardNo('');
      setPlateNumber('');
      setTrailerPlate('');
      setDriverName('');
      setDriverPhone('');
      setTransportCompany('');
      setDefaultTareWeight(14.5);
      setStatus('Rảnh (Idle)');
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPlate = plateNumber.trim().toUpperCase();
    if (!cleanPlate || !driverName.trim()) {
      alert('Vui lòng điền đủ Biển số xe và Họ tên tài xế.');
      return;
    }

    // Auto-generate consistent internal identifier to guarantee 100% backend/database compatibility
    const autoCardNo = initialData?.cardNo || `XE-${cleanPlate.replace(/[^A-Z0-9]/g, '')}`;

    if (initialData && onUpdate) {
      onUpdate(initialData.id, {
        cardNo: autoCardNo,
        plateNumber: cleanPlate,
        trailerPlate: trailerPlate.trim().toUpperCase() || undefined,
        driverName: driverName.trim(),
        driverPhone: driverPhone.trim(),
        transportCompany: transportCompany.trim(),
        defaultTareWeight: Number(defaultTareWeight),
        status,
      });
    } else {
      onSave({
        cardNo: autoCardNo,
        plateNumber: cleanPlate,
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
          <span>{initialData ? `Cập Nhật Phương Tiện: ${initialData.plateNumber}` : 'Đăng Ký Phương Tiện Mới'}</span>
        </div>
      }
      subtitle="Quản lý định danh phương tiện và khối lượng bì tiêu chuẩn"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Biển số xe & Cấp cành */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Biển Số Xe Đầu Kéo / Xe Tải
            </label>
            <ComboboxInput
              required
              autoFocus
              value={plateNumber}
              onChange={(v) => setPlateNumber(v.toUpperCase())}
              options={plateSuggestions}
              placeholder="VD: 29H-123.45"
              inputClassName="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-300 dark:border-industrial-700 bg-white dark:bg-industrial-950 text-industrial-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Cấp Cành
            </label>
            <ComboboxInput
              value={trailerPlate}
              onChange={(v) => setTrailerPlate(v.toUpperCase())}
              options={trailerSuggestions}
              placeholder="VD: CC1"
              inputClassName="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-300 dark:border-industrial-700 bg-white dark:bg-industrial-950 text-industrial-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase"
            />
          </div>
        </div>

        {/* Default Tare & Company */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Đơn Vị Vận Chuyển
            </label>
            <ComboboxInput
              required
              value={transportCompany}
              onChange={setTransportCompany}
              options={companySuggestions}
              placeholder="VD: LogiTrans Bắc Nam"
              inputClassName="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-industrial-700 bg-white dark:bg-industrial-950 text-industrial-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Driver Name & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Họ Tên Lái Xe
            </label>
            <ComboboxInput
              required
              value={driverName}
              onChange={setDriverName}
              options={driverSuggestions}
              placeholder="VD: Nguyễn Văn Hùng"
              inputClassName="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-industrial-700 bg-white dark:bg-industrial-950 text-industrial-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
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

        {/* Status */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
            Trạng Thái Phương Tiện
          </label>
          <SelectDropdown
            value={status}
            onChange={(v) => setStatus(v as VehicleStatus)}
            options={STATUS_OPTIONS}
          />
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
