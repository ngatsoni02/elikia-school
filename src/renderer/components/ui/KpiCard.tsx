import React, { ReactNode } from 'react';
import { Card } from './Card';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  valueColor?: string;
}

export const KpiCard = ({ title, value, icon, valueColor = 'text-brand-text' }: KpiCardProps) => (
  <Card className="w-full">
    <div className="flex items-center text-brand-text-secondary mb-2">
      {icon}
      <h3 className="ml-2 font-semibold">{title}</h3>
    </div>
    <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
  </Card>
);
