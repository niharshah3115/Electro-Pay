import React from 'react';
import { Badge } from '../common/Badge';

export function InvoiceStatusPill({ invoice }) {
  if (invoice.balanceAmount <= 0) {
    return (
      <Badge variant="emerald" dot size="sm">
        Paid Full
      </Badge>
    );
  }

  if (invoice.isOverdue) {
    const isCritical = invoice.diffDays > 30;
    const isHigh = invoice.diffDays > 15;
    return (
      <Badge
        variant={isCritical ? 'red' : isHigh ? 'rose' : 'orange'}
        dot
        size="sm"
        className={isCritical ? 'animate-pulse' : ''}
      >
        {invoice.diffDays}d Overdue
      </Badge>
    );
  }

  if (invoice.isDueToday) {
    return (
      <Badge variant="amber" dot size="sm" className="animate-pulse">
        Due Today
      </Badge>
    );
  }

  // Upcoming
  return (
    <Badge variant="sky" dot size="sm">
      Due in {invoice.diffDays}d
    </Badge>
  );
}
