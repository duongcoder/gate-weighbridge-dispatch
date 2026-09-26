import React, { ReactNode } from 'react';
import { useAuthStore } from '../../store/authStore';
import { MaChucNang, PermissionAction } from '../../types/auth';

export interface AuthorizeProps {
  form: MaChucNang;
  action: PermissionAction;
  mode?: 'hide' | 'disable';
  fallback?: ReactNode;
  children: ReactNode;
}

export const Authorize: React.FC<AuthorizeProps> = ({
  form,
  action,
  mode = 'hide',
  fallback = null,
  children,
}) => {
  const { hasPermission } = useAuthStore();
  const isAllowed = hasPermission(form, action);

  if (isAllowed) {
    return <>{children}</>;
  }

  if (mode === 'hide') {
    return <>{fallback}</>;
  }

  // mode === 'disable': Render child component with disabled, opacity-40 cursor-not-allowed, and tooltip
  if (React.isValidElement(children)) {
    const childProps = (children.props || {}) as {
      disabled?: boolean;
      className?: string;
      title?: string;
      onClick?: (e: React.MouseEvent) => void;
    };

    return React.cloneElement(children as React.ReactElement<any>, {
      disabled: true,
      title: 'Không có quyền thực hiện',
      className: `${childProps.className || ''} opacity-40 cursor-not-allowed select-none`.trim(),
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
      },
    });
  }

  return (
    <span 
      className="opacity-40 cursor-not-allowed inline-block select-none" 
      title="Không có quyền thực hiện"
    >
      {children}
    </span>
  );
};
