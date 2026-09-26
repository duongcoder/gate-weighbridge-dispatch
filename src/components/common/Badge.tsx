import React from 'react';
import { CommandStatus, VehicleStatus, RelationType } from '../../types';
import { getGateStepMeta } from '../../utils/formatters';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'emerald' | 'amber' | 'sky' | 'rose' | 'purple' | 'slate' | 'indigo';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  const variantClasses = {
    default: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    amber: 'bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    sky: 'bg-sky-50 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 border-sky-300 dark:border-sky-800',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300 dark:border-purple-800',
    indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
    slate: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium uppercase tracking-wider ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};

export const CommandStatusBadge: React.FC<{ status: CommandStatus }> = ({ status }) => {
  switch (status) {
    case 'Hoàn thành':
      return <Badge variant="emerald"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Hoàn thành</Badge>;
    case 'Đang chạy':
      return <Badge variant="amber"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />Đang chạy</Badge>;
    case 'Chờ thực hiện':
      return <Badge variant="sky"><span className="w-1.5 h-1.5 rounded-full bg-sky-500" />Chờ thực hiện</Badge>;
    case 'Đã hủy':
      return <Badge variant="rose"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" />Đã hủy</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export const VehicleStatusBadge: React.FC<{ status: VehicleStatus }> = ({ status }) => {
  switch (status) {
    case 'Rảnh (Idle)':
      return <Badge variant="emerald"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Rảnh (Sẵn sàng)</Badge>;
    case 'Đang trong trạm (In-Station)':
      return <Badge variant="amber"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />Trong trạm</Badge>;
    case 'Tạm khóa (Blocked)':
      return <Badge variant="rose"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" />Tạm khóa</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export const GateStepBadge: React.FC<{ step: string }> = ({ step }) => {
  const meta = getGateStepMeta(step);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${meta.badgeColor}`}>
      <span className={`w-2 h-2 rounded-full ${meta.dotColor} animate-pulse`} />
      {meta.label}
    </span>
  );
};

export const RelationBadge: React.FC<{ relation: RelationType; size?: 'sm' | 'md' }> = ({ relation, size = 'md' }) => {
  const meta = {
    '1-1': { label: '1 Lệnh - 1 Xe', desc: 'Đơn lẻ', variant: 'sky' as const },
    '1-N': { label: '1 Lệnh - N Xe', desc: 'Đội xe lớn', variant: 'purple' as const },
    'N-1': { label: 'N Lệnh - 1 Xe', desc: 'Xe gộp lệnh', variant: 'amber' as const },
    'N-N': { label: 'N Lệnh - N Xe', desc: 'Tổ hợp cụm', variant: 'indigo' as const },
  }[relation];

  return (
    <Badge variant={meta.variant} size={size} className="font-mono">
      <span className="font-bold">[{relation}]</span> {meta.label}
    </Badge>
  );
};
