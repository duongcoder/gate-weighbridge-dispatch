import React, { useState } from 'react';
import { useStore } from '../../store/dispatchStore';
import { Modal } from '../common/Modal';
import { Truck, Plus, Check } from 'lucide-react';
import { formatWeight } from '../../utils/formatters';

interface AttachVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
}

export const AttachVehicleModal: React.FC<AttachVehicleModalProps> = ({
  isOpen,
  onClose,
  orderId,
}) => {
  const { orders, vehicles, attachVehicleToOrder } = useStore();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  const order = orderId ? orders.find((o) => o.id === orderId) : undefined;
  const availableVehicles = vehicles.filter((v) => v.status === 'Rảnh (Idle)');

  if (!order) return null;

  const handleAttach = () => {
    if (!selectedVehicleId) {
      alert('Vui lòng chọn 1 xe.');
      return;
    }
    attachVehicleToOrder(order.id, selectedVehicleId);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-amber-500" />
          <span>Bổ Sung Xe Vào Lệnh: {order.code}</span>
        </div>
      }
      subtitle="Thêm phương tiện mới tham gia vận chuyển trong cùng lệnh điều phối"
      maxWidth="md"
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-500">
          Chọn một phương tiện đang rảnh để cấp lốt vào trạm theo lệnh <b>{order.code}</b>:
        </p>

        <div className="max-h-60 overflow-y-auto space-y-2">
          {availableVehicles.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              Không còn xe rảnh. Hãy hoàn tất chuyến xe khác hoặc thêm xe mới.
            </div>
          ) : (
            availableVehicles.map((veh) => {
              const isSelected = selectedVehicleId === veh.id;
              return (
                <div
                  key={veh.id}
                  onClick={() => setSelectedVehicleId(veh.id)}
                  className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-500'
                      : 'border-slate-200 dark:border-industrial-800 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <span className="font-mono font-black text-sm text-industrial-900 dark:text-white">
                      {veh.plateNumber}
                    </span>
                    <div className="text-xs text-slate-500">
                      Lái xe: {veh.driverName} | {veh.cardNo}
                    </div>
                  </div>
                  <div className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                    Bì: {formatWeight(veh.defaultTareWeight)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-industrial-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-industrial-800 rounded"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={!selectedVehicleId}
            onClick={handleAttach}
            className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded shadow disabled:opacity-50"
          >
            Thêm Xe Vào Lệnh
          </button>
        </div>
      </div>
    </Modal>
  );
};
