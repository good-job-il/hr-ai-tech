import React from 'react';
import { cn } from '@/lib/utils';

export const H1 = ({ className, ...props }) => (
  <h1 className={cn('text-8xl font-black leading-tight text-gray-900', className)} {...props} />
);

export const H2 = ({ className, ...props }) => (
  <h2 className={cn('text-7xl font-black leading-tight text-gray-900', className)} {...props} />
);

export const H3 = ({ className, ...props }) => (
  <h3 className={cn('text-3xl font-black text-gray-900', className)} {...props} />
);

export const H4 = ({ className, ...props }) => (
  <h4 className={cn('text-2xl font-bold text-gray-900', className)} {...props} />
);

export const H5 = ({ className, ...props }) => (
  <h5 className={cn('text-xl font-bold text-gray-900', className)} {...props} />
);

export const H6 = ({ className, ...props }) => (
  <h6 className={cn('text-lg font-semibold text-gray-900', className)} {...props} />
);

export const Body1 = ({ className, ...props }) => (
  <p className={cn('text-base leading-relaxed text-gray-700', className)} {...props} />
);

export const Body2 = ({ className, ...props }) => (
  <p className={cn('text-sm leading-relaxed text-gray-600', className)} {...props} />
);

export const Caption = ({ className, ...props }) => (
  <p className={cn('text-xs font-medium text-gray-500', className)} {...props} />
);

export const Label = ({ className, ...props }) => (
  <label className={cn('text-sm font-bold text-gray-700 uppercase tracking-wide', className)} {...props} />
);