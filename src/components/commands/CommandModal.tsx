import React, { useState, useEffect, useMemo } from 'react';
import { Command, CommandType, CommandStatus } from '../../types';
import { useStore } from '../../store/dispatchStore';
import { Modal } from '../common/Modal';
import { ComboboxInput } from '../common/ComboboxInput';
import { SelectDropdown } from '../common/SelectDropdown';

// Danh sách option cố định (giá trị value giữ nguyên khớp CommandType / CommandStatus)
const TYPE_OPTIONS = [
  { value: 'Nhập hàng', label: 'Nhập hàng (Inbound)' },
  { value: 'Xuất hàng', label: 'Xuất hàng (Outbound)' },
  { value: 'Vận chuyển nội bộ', label: 'Vận chuyển nội bộ' },
  { value: 'Cân dịch vụ', label: 'Cân dịch vụ' },
];

const STATUS_OPTIONS = [
  { value: 'Chờ thực hiện', label: 'Chờ thực hiện' },
  { value: 'Đang chạy', label: 'Đang chạy' },
  { value: 'Hoàn thành', label: 'Hoàn thành' },
  { value: 'Đã hủy', label: 'Đã hủy' },
];
import { FilePlus2, Save, FileEdit } from 'lucide-react';

interface CommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Command, 'id' | 'createdAt' | 'completedWeight'>) => void;
  onUpdate?: (id: string, data: Partial<Command>) => void;
  initialData?: Command | null;
  existingCount: number;
}

export const CommandModal: React.FC<CommandModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  initialData,
  existingCount,
}) => {
  const [code, setCode] = useState('');
  const [type, setType] = useState<CommandType>('Nhập hàng');
  const [customer, setCustomer] = useState('');
  const [material, setMaterial] = useState('');
  const [targetWeight, setTargetWeight] = useState<number>(100);
  const [status, setStatus] = useState<CommandStatus>('Chờ thực hiện');
  const [notes, setNotes] = useState('');
  const [seller, setSeller] = useState('');

  const { commands } = useStore();

  // Gợi ý lịch sử: lấy giá trị unique từ các lệnh đã có để autocomplete (datalist)
  const codeSuggestions = useMemo(
    () => Array.from(new Set(commands.map((c) => (c.code || '').trim()).filter(Boolean))).sort(),
    [commands]
  );
  const customerSuggestions = useMemo(
    () => Array.from(new Set(commands.map((c) => (c.customer || '').trim()).filter(Boolean))).sort(),
    [commands]
  );
  const sellerSuggestions = useMemo(
    () => Array.from(new Set(commands.map((c) => (c.seller || '').trim()).filter(Boolean))).sort(),
    [commands]
  );
  const materialSuggestions = useMemo(
    () => Array.from(new Set(commands.map((c) => (c.material || '').trim()).filter(Boolean))).sort(),
    [commands]
  );

  useEffect(() => {
    if (initialData) {
      setCode(initialData.code);
      setType(initialData.type);
      setCustomer(initialData.customer);
      setMaterial(initialData.material);
      setTargetWeight(initialData.targetWeight);
      setStatus(initialData.status);
      setNotes(initialData.notes || '');
      setSeller(initialData.seller || '');
    } else {
      // Auto-generate realistic code
      const nextNum = 100 + existingCount + 1;
      setCode(`CMD-${nextNum}`);
      setType('Nhập hàng');
      setCustomer('');
      setMaterial('');
      setTargetWeight(100);
      setStatus('Chờ thực hiện');
      setNotes('');
      setSeller('');
    }
  }, [initialData, existingCount, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.trim() || !material.trim() || targetWeight <= 0) {
      alert('Vui lòng nhập đầy đủ thông tin Bên mua, Hàng hóa và Khối lượng chỉ tiêu.');
      return;
    }

    if (initialData && onUpdate) {
      onUpdate(initialData.id, {
        code,
        type,
        customer,
        seller: seller || undefined,
        material,
        targetWeight: Number(targetWeight),
        status,
        notes,
      });
    } else {
      onSave({
        code,
        type,
        customer,
        seller: seller || undefined,
        material,
        targetWeight: Number(targetWeight),
        status,
        notes,
      });
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          {initialData ? <FileEdit className="w-5 h-5 text-amber-500" /> : <FilePlus2 className="w-5 h-5 text-amber-500" />}
          <span>{initialData ? `Chỉnh Sửa Lệnh: ${initialData.code}` : 'Tạo Lệnh Vận Chuyển Mới'}</span>
        </div>
      }
      subtitle="Thiết lập chỉ tiêu khối lượng và tuyến hàng cho trạm cân"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Code */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Mã Lệnh Điều Động
            </label>
            <ComboboxInput
              required
              value={code}
              onChange={(v) => setCode(v.toUpperCase())}
              options={codeSuggestions}
              inputClassName="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-300 dark:border-industrial-700 bg-slate-50 dark:bg-industrial-950 text-industrial-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              placeholder="CMD-108"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Loại Nghiệp Vụ
            </label>
            <SelectDropdown
              value={type}
              onChange={(v) => setType(v as CommandType)}
              options={TYPE_OPTIONS}
              triggerClassName="bg-slate-50 dark:bg-industrial-950"
            />
          </div>
        </div>

        {/* Customer */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
            Bên Mua
          </label>
          <ComboboxInput
            required
            value={customer}
            onChange={setCustomer}
            options={customerSuggestions}
            inputClassName="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-industrial-700 bg-white dark:bg-industrial-950 text-industrial-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            placeholder="VD: Công ty Xi Măng Vicem Hoàng Thạch"
          />
        </div>

        {/* Seller — Bên Bán */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
            Bên Bán
          </label>
          <ComboboxInput
            value={seller}
            onChange={setSeller}
            options={sellerSuggestions}
            inputClassName="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-industrial-700 bg-white dark:bg-industrial-950 text-industrial-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            placeholder="VD: Công ty Khai Thác Khoáng Sản ABC"
          />
        </div>

        {/* Material & Target Weight */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Loại Hàng Hóa / Vật Tư
            </label>
            <ComboboxInput
              required
              value={material}
              onChange={setMaterial}
              options={materialSuggestions}
              inputClassName="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-industrial-700 bg-white dark:bg-industrial-950 text-industrial-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              placeholder="VD: Thép cuộn D10, Cát san lấp..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Khối Lượng Kế Hoạch (Tấn)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.1"
              required
              value={targetWeight}
              onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-300 dark:border-industrial-700 bg-white dark:bg-industrial-950 text-industrial-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              placeholder="100.00"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
            Trạng Thái Lệnh
          </label>
          <SelectDropdown
            value={status}
            onChange={(v) => setStatus(v as CommandStatus)}
            options={STATUS_OPTIONS}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
            Ghi Chú
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-industrial-700 bg-white dark:bg-industrial-950 text-industrial-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            placeholder="Yêu cầu kiểm tra độ ẩm, ưu tiên bãi A..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-industrial-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-industrial-800 rounded-lg transition"
          >
            Hủy Bỏ
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-500 active:scale-95 rounded-lg shadow transition"
          >
            <Save className="w-4 h-4" />
            <span>{initialData ? 'Lưu Thay Đổi' : 'Tạo Lệnh Ngay'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
