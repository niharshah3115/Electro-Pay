import React from 'react';
import { Badge } from '../common/Badge';

export function ShopkeeperAgingBadge({ outstanding, oldestOverdueDays = 0 }) {
  if (outstanding <= 0) {
    return (
      <Badge variant="emerald" dot>
        All Clear (₹0 Due)
      </Badge>
    );
  }

  if (oldestOverdueDays > 30) {
    return (
      <Badge variant="red" dot className="animate-pulse">
        {oldestOverdueDays}d Past 39D (Critical)
      </Badge>
    );
  }

  if (oldestOverdueDays > 15) {
    return (
      <Badge variant="rose" dot>
        {oldestOverdueDays}d Past 39D
      </Badge>
    );
  }

  if (oldestOverdueDays > 0) {
    return (
      <Badge variant="amber" dot>
        {oldestOverdueDays}d Overdue
      </Badge>
    );
  }

  return (
    <Badge variant="brand" dot>
      On Track (Within 39D)
    </Badge>
  );
}
