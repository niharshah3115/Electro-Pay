import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatINR } from './currencyUtils';
import { formatDate } from './dateUtils';

/**
 * Generates a clean PDF Statement of Account for a Shopkeeper
 */
export function generateShopkeeperStatementPDF({
  shopkeeper,
  payments = [],
  businessProfile = {},
}) {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(2, 132, 199); // Electric Blue #0284c7
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(businessProfile.businessName || 'ELECTROTRACK DISTRIBUTORS', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${businessProfile.address || 'Electrical Wholesale Market'} | Phone: ${businessProfile.phone || 'N/A'} | UPI: ${businessProfile.upiId || 'N/A'}`,
    14,
    26
  );

  // Statement Meta Info
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('STATEMENT OF ACCOUNT', 14, 48);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated Date: ${formatDate(new Date().toISOString())}`, 140, 48);

  // Shopkeeper Details Box
  const outstanding = Number(shopkeeper.totalOutstanding) || 0;
  const totalPaid = Number(shopkeeper.totalPaidAmount) || 0;
  const totalBilled = (outstanding + totalPaid) || Number(shopkeeper.billAmount) || 0;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 54, 182, 34, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.text(`Customer: ${shopkeeper.shopName}`, 20, 63);
  doc.setFont('helvetica', 'normal');
  doc.text(`Proprietor: ${shopkeeper.ownerName || 'N/A'} | Goods Delivered: ${formatDate(shopkeeper.deliveryDate || shopkeeper.invoiceDate || shopkeeper.createdAt)}`, 20, 71);
  doc.text(`Phone: ${shopkeeper.phone} | Route: ${shopkeeper.areaRoute || 'General'}`, 20, 79);

  doc.setFont('helvetica', 'bold');
  doc.text('Total Bill Amount:', 120, 63);
  doc.text(formatINR(totalBilled), 160, 63);

  doc.text('Paid Amount:', 120, 71);
  doc.setTextColor(16, 185, 129); // Green
  doc.text(formatINR(totalPaid), 160, 71);

  doc.setTextColor(220, 38, 38); // Red
  doc.text('Total Due Balance:', 120, 79);
  doc.text(formatINR(outstanding), 160, 79);
  doc.setTextColor(30, 41, 59);

  // Payments History Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Collections & Receipts History', 14, 98);

  const paymentRows = payments.map(pay => [
    pay.receiptNumber || 'REC',
    `#${pay.invoiceNumber || 'INV-GENERAL'}`,
    formatDate(pay.paymentDate, 'short'),
    (pay.paymentMethod || pay.paymentMode || 'UPI').toUpperCase().replace('_', ' '),
    pay.notes || pay.referenceNumber || '—',
    formatINR(pay.amount),
    'RECEIVED',
  ]);

  if (paymentRows.length === 0) {
    paymentRows.push(['—', '—', '—', '—', 'No payments recorded yet', '₹0', '—']);
  }

  autoTable(doc, {
    startY: 104,
    head: [['Receipt #', 'Invoice #', 'Date Given', 'Method', 'Notes / Ref', 'Amount Paid', 'Status']],
    body: paymentRows,
    headStyles: { fillColor: [2, 132, 199], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  const finalY = doc.lastAutoTable?.finalY || 160;

  // Footer Payment Instructions
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Please remit pending dues to UPI: ${businessProfile.upiId || 'Direct Bank/UPI'} or contact ${businessProfile.phone || 'distributor'}.`,
    14,
    finalY + 14
  );

  doc.save(`Statement_${shopkeeper.shopName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}
