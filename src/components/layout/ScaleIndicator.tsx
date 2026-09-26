import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/dispatchStore';
import { useAuthStore } from '../../store/authStore';
import { Activity, RotateCcw, Lock } from 'lucide-react';
import { soundFx } from '../../utils/audio';
import { Authorize } from '../common/Authorize';

export const ScaleIndicator: React.FC = () => {
  const { scaleReading, setSimulatedScaleWeight, zeroScale } = useStore();
  const { hasPermission } = useAuthStore();
  const canControlScale = hasPermission('Frm_ScaleCapture', 'sua');

  const [isSimulatingMotion, setIsSimulatingMotion] = useState(false);

  // Simulation loop for realistic scale fluctuation when a truck drives onto the weighbridge
  useEffect(() => {
    if (!isSimulatingMotion) return;

    const targetWeight = 38.50 + Math.random() * 8.0;
    let step = 0;
    const totalSteps = 12;

    const timer = setInterval(() => {
      step++;
      const noise = (Math.random() - 0.5) * 1.5;
      const progress = step / totalSteps;
      const current = Number((targetWeight * Math.min(progress, 1) + noise).toFixed(2));
      
      const isFinal = step >= totalSteps;
      setSimulatedScaleWeight(Math.max(0, current), isFinal);

      if (isFinal) {
        setIsSimulatingMotion(false);
        soundFx.playScaleCaptureTone();
        clearInterval(timer);
      }
    }, 180);

    return () => clearInterval(timer);
  }, [isSimulatingMotion, setSimulatedScaleWeight]);

  const handleSimulateTruck = () => {
    if (!canControlScale) return;
    setIsSimulatingMotion(true);
    setSimulatedScaleWeight(5.2, false);
  };

  const handleSetTare = () => {
    if (!canControlScale) return;
    setSimulatedScaleWeight(14.50, true);
    soundFx.playScaleCaptureTone();
  };

  const handleSetGross = () => {
    if (!canControlScale) return;
    setSimulatedScaleWeight(48.60, true);
    soundFx.playScaleCaptureTone();
  };

  const handleZero = () => {
    if (!canControlScale) return;
    zeroScale();
    soundFx.playScaleCaptureTone();
  };

  return (
    <div className="bg-industrial-900 border-b border-industrial-800 text-slate-100 px-4 py-2.5 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Scale identity and live LED readout */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono font-semibold tracking-wider text-slate-300 hidden sm:inline">
              BÀN CÂN ĐIỆN TỬ #01 (80T):
            </span>
          </div>

          {/* LED Digital Display */}
          <div className="flex items-baseline bg-industrial-950 px-3.5 py-1 rounded-lg border border-industrial-700 shadow-inner">
            <span className="scale-led-display text-emerald-400 font-mono font-black text-2xl tracking-widest min-w-[110px] text-right">
              {scaleReading.currentWeight.toFixed(2)}
            </span>
            <span className="ml-1.5 text-xs font-mono font-bold text-emerald-500">
              {scaleReading.unit}
            </span>
          </div>

          {/* Hardware status flags */}
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span
              className={`px-1.5 py-0.5 rounded ${
                scaleReading.isStable
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
              }`}
            >
              {scaleReading.isStable ? '● ỔN ĐỊNH' : '◌ DAO ĐỘNG'}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded hidden md:inline ${
                scaleReading.isZero
                  ? 'bg-sky-950 text-sky-300 border border-sky-800'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              ZERO [0]
            </span>
          </div>

          {/* Read-Only Mode Badge if user lacks edit permission */}
          {!canControlScale && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-industrial-950 border border-industrial-800 text-[11px] font-mono text-slate-400">
              <Lock className="w-3 h-3 text-amber-500" />
              <span>CHẾ ĐỘ XEM (READ-ONLY)</span>
            </span>
          )}
        </div>

        {/* Right: Scale Hardware Controls & Simulator for Testing (Protected by RBAC Frm_ScaleCapture 'sua') */}
        <div className="flex items-center gap-2 flex-wrap">
          <Authorize form="Frm_ScaleCapture" action="sua" mode="disable">
            <button
              type="button"
              onClick={handleSimulateTruck}
              disabled={isSimulatingMotion}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-500 text-white rounded-md transition shadow-sm disabled:opacity-50"
              title="Mô phỏng xe tải lên bàn cân với dao động thật"
            >
              <Activity className={`w-3.5 h-3.5 ${isSimulatingMotion ? 'animate-spin' : ''}`} />
              <span>Mô phỏng Xe Lên Cân</span>
            </button>
          </Authorize>

          <div className="hidden sm:flex items-center gap-1.5">
            <Authorize form="Frm_ScaleCapture" action="sua" mode="disable">
              <button
                type="button"
                onClick={handleSetTare}
                className="px-2 py-1 text-xs font-mono bg-industrial-800 hover:bg-industrial-700 text-slate-200 rounded border border-industrial-700 transition"
                title="Đặt nhanh tải bì 14.50T"
              >
                Bì: 14.5T
              </button>
            </Authorize>

            <Authorize form="Frm_ScaleCapture" action="sua" mode="disable">
              <button
                type="button"
                onClick={handleSetGross}
                className="px-2 py-1 text-xs font-mono bg-industrial-800 hover:bg-industrial-700 text-slate-200 rounded border border-industrial-700 transition"
                title="Đặt nhanh tổng tải 48.60T"
              >
                Tổng: 48.6T
              </button>
            </Authorize>
          </div>

          <Authorize form="Frm_ScaleCapture" action="sua" mode="disable">
            <button
              type="button"
              onClick={handleZero}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-industrial-800 hover:bg-industrial-700 text-slate-300 rounded border border-industrial-700 transition"
              title="Về 0 điểm chuẩn (Zeroing)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Về 0</span>
            </button>
          </Authorize>
        </div>
      </div>
    </div>
  );
};
