import React, { useState } from 'react';
import { OrderTrip, Command, DispatchOrder, VehicleCard } from '../../types';
import { useStore } from '../../store/dispatchStore';
import { Modal } from '../common/Modal';
import { Printer, FileText, QrCode, CheckCircle2, ShieldCheck } from 'lucide-react';
import { formatWeight, formatDateTime } from '../../utils/formatters';

interface WeighingTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: OrderTrip | null;
}

export const WeighingTicketModal: React.FC<WeighingTicketModalProps> = ({
  isOpen,
  onClose,
  trip,
}) => {
  const { orders, commands, vehicles } = useStore();
  const [printFormat, setPrintFormat] = useState<'a5' | 'thermal80'>('a5');

  const parentOrder = trip ? orders.find((o) => o.id === trip.orderId) : undefined;
  const primaryCommand = parentOrder?.commandIds.length
    ? commands.find((c) => c.id === parentOrder.commandIds[0])
    : undefined;
  const vehicle = trip ? vehicles.find((v) => v.id === trip.vehicleId) : undefined;

  if (!trip) return null;

  const handlePrint = () => {
    document.body.setAttribute('data-print-mode', printFormat);
    window.print();
  };

  const isInbound = primaryCommand?.type === 'Nhập hàng';
  const ticketCode = `TKT-${trip.id.replace('trip-', '')}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Printer className="w-5 h-5 text-amber-500" />
          <span>In Phiếu Cân & Giấy Ra Cổng: {trip.plateNumber}</span>
        </div>
      }
      subtitle="Chứng từ cân điện tử chính thức kèm chữ ký điện tử xác thực"
      maxWidth="4xl"
      headerAction={
        <div className="flex items-center gap-2 mr-2">
          {/* Format Switcher */}
          <div className="flex items-center bg-slate-200 dark:bg-industrial-800 p-0.5 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setPrintFormat('a5')}
              className={`px-2.5 py-1 rounded-md transition ${
                printFormat === 'a5'
                  ? 'bg-white dark:bg-industrial-950 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Khổ A5 Ngang
            </button>
            <button
              type="button"
              onClick={() => setPrintFormat('thermal80')}
              className={`px-2.5 py-1 rounded-md transition ${
                printFormat === 'thermal80'
                  ? 'bg-white dark:bg-industrial-950 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Nhiệt 80mm
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-sm transition active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In Ngay</span>
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Printable Area Wrapper */}
        <div
          id="printable-ticket-area"
          className={`mx-auto bg-white text-black p-6 rounded-xl border border-slate-300 shadow-lg ${
            printFormat === 'a5' ? 'max-w-3xl font-sans' : 'max-w-xs font-mono text-xs'
          }`}
        >
          {printFormat === 'a5' ? (
            /* =========================================================================
               A5 LANDSCAPE OFFICIAL WEIGHBRIDGE SLIP
               ========================================================================= */
            <div className="space-y-4 text-xs">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-black pb-3">
                <div>
                  <h2 className="text-base font-black uppercase tracking-tight text-black">
                    TRẠM KIỂM SOÁT CỔNG & CÂN ĐIỆN TỬ SỐ 01
                  </h2>
                  <p className="text-[11px] text-gray-700 font-medium">
                    Khu Cụm Công Nghiệp & Cảng Logistics Trung Tâm • Hotline: 1900 888 999
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Bàn Cân: METTLER TOLEDO 80 TẤN (Kiểm định số: KĐ-2026/088)
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs font-black">
                    SỐ PHIẾU: <span className="text-red-700 font-bold">{ticketCode}</span>
                  </div>
                  <div className="text-[10px] text-gray-600">
                    Mã Lệnh: {parentOrder?.code || 'DSP-AUTO'}
                  </div>
                  <div className="text-[10px] text-gray-600">
                    Ngày in: {formatDateTime(new Date().toISOString())}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="text-center py-1">
                <h1 className="text-lg font-black uppercase tracking-widest text-black">
                  PHIẾU CÂN HÀNG ĐIỆN TỬ
                </h1>
                <p className="text-[11px] font-semibold text-gray-600">
                  (Dành cho phương tiện vào - ra trạm cân)
                </p>
              </div>

              {/* Logistics & Vehicle Info Grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 border border-black p-3 rounded bg-gray-50/50">
                <div>
                  <span className="text-gray-600">Biển số xe đầu kéo:</span>{' '}
                  <span className="font-mono font-black text-sm text-black">{trip.plateNumber}</span>
                </div>
                <div>
                  <span className="text-gray-600">Rơ-moóc:</span>{' '}
                  <span className="font-mono font-bold">{vehicle?.trailerPlate || 'Không có'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Họ tên lái xe:</span>{' '}
                  <span className="font-bold">{trip.driverName}</span> ({trip.driverPhone || '---'})
                </div>
                <div>
                  <span className="text-gray-600">Đơn vị vận tải:</span>{' '}
                  <span className="font-bold">{trip.transportCompany || vehicle?.transportCompany || '---'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Khách hàng / Chủ hàng:</span>{' '}
                  <span className="font-bold">{primaryCommand?.customer || '---'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Loại nghiệp vụ:</span>{' '}
                  <span className="font-bold uppercase">{primaryCommand?.type || 'Vận chuyển'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Loại hàng hóa / Vật tư:</span>{' '}
                  <span className="font-black text-black">{primaryCommand?.material || 'Hàng rời tổng hợp'}</span>
                </div>
              </div>

              {/* Weight Measurement Matrix */}
              <table className="w-full border-collapse border-2 border-black text-center text-xs">
                <thead>
                  <tr className="bg-gray-200 text-black font-bold">
                    <th className="border border-black p-2">LẦN CÂN</th>
                    <th className="border border-black p-2">LOẠI TẢI TRỌNG</th>
                    <th className="border border-black p-2">THỜI GIAN CÂN</th>
                    <th className="border border-black p-2">KHỐI LƯỢNG (TẤN)</th>
                    <th className="border border-black p-2">QUY ĐỔI (KG)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-2 font-bold">CÂN LẦN 1</td>
                    <td className="border border-black p-2 font-semibold">
                      {isInbound ? 'CÂN TỔNG (GROSS)' : 'CÂN BÌ (TARE)'}
                    </td>
                    <td className="border border-black p-2 font-mono">
                      {formatDateTime(trip.firstWeightTime)}
                    </td>
                    <td className="border border-black p-2 font-mono font-bold text-sm">
                      {formatWeight(trip.firstWeight)}
                    </td>
                    <td className="border border-black p-2 font-mono">
                      {formatWeight(trip.firstWeight, 'KG')}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold">CÂN LẦN 2</td>
                    <td className="border border-black p-2 font-semibold">
                      {isInbound ? 'CÂN BÌ (TARE)' : 'CÂN TỔNG (GROSS)'}
                    </td>
                    <td className="border border-black p-2 font-mono">
                      {formatDateTime(trip.secondWeightTime)}
                    </td>
                    <td className="border border-black p-2 font-mono font-bold text-sm">
                      {formatWeight(trip.secondWeight)}
                    </td>
                    <td className="border border-black p-2 font-mono">
                      {formatWeight(trip.secondWeight, 'KG')}
                    </td>
                  </tr>
                  {/* Highlighted Net Row */}
                  <tr className="bg-yellow-50 border-t-2 border-black">
                    <td colSpan={3} className="border border-black p-2.5 text-right font-black text-sm uppercase">
                      KHỐI LƯỢNG HÀNG RÒNG (NET WEIGHT):
                    </td>
                    <td className="border border-black p-2.5 font-mono font-black text-base text-red-700">
                      {formatWeight(trip.netWeight)}
                    </td>
                    <td className="border border-black p-2.5 font-mono font-black text-sm text-red-700">
                      {formatWeight(trip.netWeight, 'KG')}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Barcode simulation & Notes */}
              <div className="flex justify-between items-center text-[10px] text-gray-600">
                <div>
                  <span>Ghi chú: {trip.notes || 'Không có ghi chú đặc biệt.'}</span>
                  <div className="font-mono mt-1 text-[9px] text-gray-500">
                    HASH: SHA256-VLD-TRIP-{trip.id}-SECURE-AUTH-2026
                  </div>
                </div>
                {/* Simulated Barcode */}
                <div className="text-center font-mono">
                  <div className="tracking-[3px] text-lg font-black uppercase">
                    ||| | | |||| | || ||| | |||
                  </div>
                  <div>*{ticketCode}*</div>
                </div>
              </div>

              {/* Dual Signature Blocks */}
              <div className="grid grid-cols-2 gap-8 pt-6 pb-8 text-center text-xs">
                <div>
                  <p className="font-bold uppercase text-black">LÁI XE / CHỦ HÀNG</p>
                  <p className="text-[10px] text-gray-500 italic">(Ký, ghi rõ họ tên)</p>
                  <div className="h-16 flex items-end justify-center font-semibold text-gray-800">
                    {trip.driverName}
                  </div>
                </div>
                <div>
                  <p className="font-bold uppercase text-black">NGƯỜI CÂN HÀNG (KTV TRẠM CÂN)</p>
                  <p className="text-[10px] text-gray-500 italic">(Ký, ghi rõ họ tên và đóng dấu)</p>
                  <div className="h-16 flex items-end justify-center font-semibold text-gray-800">
                    {trip.scaleOperator || 'Trần Văn Mạnh'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* =========================================================================
               80MM COMPACT THERMAL RECEIPT
               ========================================================================= */
            <div className="space-y-3 leading-tight">
              <div className="text-center border-b border-dashed border-black pb-2">
                <h3 className="font-black text-xs uppercase">TRẠM CÂN ĐIỆN TỬ SỐ 01</h3>
                <p className="text-[10px]">CỔNG KIỂM SOÁT TRUNG TÂM</p>
                <div className="font-bold text-xs mt-1">PHIẾU CÂN NHANH</div>
                <div className="text-[10px]">Số: {ticketCode}</div>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Biển số:</span>
                  <span className="font-bold text-xs">{trip.plateNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lái xe:</span>
                  <span>{trip.driverName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hàng hóa:</span>
                  <span className="font-bold">{primaryCommand?.material || 'Hàng rời'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Nghiệp vụ:</span>
                  <span>{primaryCommand?.type}</span>
                </div>
              </div>

              <div className="border-t border-b border-dashed border-black py-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Cân Lần 1:</span>
                  <span className="font-bold">{formatWeight(trip.firstWeight)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cân Lần 2:</span>
                  <span className="font-bold">{formatWeight(trip.secondWeight)}</span>
                </div>
                <div className="flex justify-between text-xs font-black pt-1 border-t border-dotted border-black">
                  <span>HÀNG RÒNG (NET):</span>
                  <span>{formatWeight(trip.netWeight)}</span>
                </div>
              </div>

              <div className="text-[10px] space-y-1">
                <div>Cân bởi: {trip.scaleOperator || 'Trần Văn Mạnh'}</div>
                <div>Giờ in: {formatDateTime(new Date().toISOString())}</div>
              </div>

              <div className="text-center pt-2 text-[9px] border-t border-dashed border-black">
                <div>*** XIN CẢM ƠN QUÝ KHÁCH ***</div>
                <div className="font-mono mt-1">|||| | ||| || ||||</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
