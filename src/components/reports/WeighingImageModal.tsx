import React, { useEffect, useState, useCallback } from 'react';
import {
  Camera,
  ImageOff,
  Loader2,
  Maximize2,
  X,
  ZoomIn,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import {
  reportApi,
  buildImageViewUrl,
  WeighingImageItem,
  WeighingReportItem,
} from '../../services/reportApi';

interface WeighingImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: WeighingReportItem | null;
}

export const WeighingImageModal: React.FC<WeighingImageModalProps> = ({
  isOpen,
  onClose,
  ticket,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<WeighingImageItem[]>([]);
  const [zoomImage, setZoomImage] = useState<{ label: string; src: string } | null>(null);
  const [brokenPaths, setBrokenPaths] = useState<Set<string>>(new Set());

  const fetchImages = useCallback(async () => {
    if (!ticket) return;
    setLoading(true);
    setError(null);
    setImages([]);
    setBrokenPaths(new Set());
    try {
      const res = await reportApi.getWeighingImages(ticket.soPhieu);
      setImages(res.images ?? []);
      if (!res.hasImage || (res.images?.length ?? 0) === 0) {
        setError('Phiếu cân này chưa có ảnh chụp.');
      }
    } catch (err: any) {
      console.error('Lỗi khi tải ảnh phiếu cân:', err);
      setError(
        err?.response?.data?.message ||
          'Không thể tải ảnh. Kiểm tra kết nối hoặc bảng Weighing_Image.',
      );
    } finally {
      setLoading(false);
    }
  }, [ticket]);

  useEffect(() => {
    if (isOpen && ticket) {
      fetchImages();
    } else {
      setImages([]);
      setError(null);
      setZoomImage(null);
      setBrokenPaths(new Set());
    }
  }, [isOpen, ticket, fetchImages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && zoomImage) {
        setZoomImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomImage]);

  const markBroken = (path: string) => {
    setBrokenPaths((prev) => new Set(prev).add(path));
  };

  const visibleImages = images.filter((img) => !brokenPaths.has(img.path));

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <span className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-500" />
            Hình Ảnh Lượt Cân #{ticket?.soPhieu ?? ''}
          </span>
        }
        subtitle={
          ticket
            ? `Biển số ${ticket.bienSoXe} · ${ticket.hangHoa} · ${ticket.nghiepVu}`
            : undefined
        }
        maxWidth="full"
      >
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="mt-3 text-xs font-medium">Đang tải hình ảnh...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <ImageOff className="w-10 h-10 text-slate-300 dark:text-industrial-700" />
            <p className="mt-3 text-sm font-medium text-slate-500">{error}</p>
          </div>
        )}

        {!loading && !error && visibleImages.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleImages.map((img) => {
              const src = buildImageViewUrl(img.path);
              return (
                <figure
                  key={img.key + img.path}
                  className="group relative bg-slate-50 dark:bg-industrial-950 border border-slate-200 dark:border-industrial-800 rounded-xl overflow-hidden"
                >
                  <figcaption className="px-3 py-2 flex items-center justify-between border-b border-slate-200 dark:border-industrial-800">
                    <span className="text-xs font-bold text-industrial-900 dark:text-industrial-100">
                      {img.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono truncate ml-2" title={img.path}>
                      {img.key}
                    </span>
                  </figcaption>
                  <button
                    type="button"
                    onClick={() => setZoomImage({ label: img.label, src })}
                    className="relative block w-full aspect-[4/3] bg-slate-100 dark:bg-industrial-900 cursor-zoom-in"
                    title="Phóng to"
                  >
                    <img
                      src={src}
                      alt={img.label}
                      loading="lazy"
                      onError={() => markBroken(img.path)}
                      className="absolute inset-0 w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
                    />
                    <span className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 className="w-4 h-4" />
                    </span>
                  </button>
                </figure>
              );
            })}
          </div>
        )}

        {!loading && !error && visibleImages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Camera className="w-10 h-10 text-slate-300 dark:text-industrial-700" />
            <p className="mt-3 text-sm font-medium text-slate-500">
              Không có ảnh nào khả dụng cho phiếu cân này.
            </p>
          </div>
        )}
      </Modal>

      {zoomImage && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-sm animate-in fade-in"
          onClick={() => setZoomImage(null)}
        >
          <button
            type="button"
            onClick={() => setZoomImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
            title="Đóng (Esc)"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex flex-col items-center max-w-5xl w-full max-h-full">
            <span className="mb-3 flex items-center gap-1.5 text-sm font-bold text-white">
              <ZoomIn className="w-4 h-4" />
              {zoomImage.label}
            </span>
            <img
              src={zoomImage.src}
              alt={zoomImage.label}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default WeighingImageModal;