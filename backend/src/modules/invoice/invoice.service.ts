import PDFDocument from 'pdfkit';
import { IOrder } from '../order/order.model';
import { ISettings } from '../settings/settings.model';

interface InvoiceData {
  order: IOrder;
  settings: ISettings;
}

/**
 * Generate a PDF invoice for the given order and settings
 */
export function generateInvoicePDF(data: InvoiceData): PDFKit.PDFDocument {
  const { order, settings } = data;
  const currency = settings.currencySymbol || '₹';

  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  // --- Business Header ---
  drawBusinessHeader(doc, settings);

  // --- Invoice Number & Order Info ---
  const invoiceNumber = `${settings.invoicePrefix || 'INV'}-${settings.invoiceStartNumber + getOrderSequence(order.orderNumber)}`;
  drawInvoiceInfo(doc, invoiceNumber, order);

  // --- Customer Details ---
  drawCustomerDetails(doc, order);

  // --- Items Table ---
  drawItemsTable(doc, order, currency);

  // --- Financial Summary ---
  drawFinancialSummary(doc, order, currency);

  // --- Payment Info ---
  drawPaymentInfo(doc, order, currency);

  // --- Footer ---
  drawFooter(doc);

  doc.end();
  return doc;
}

function drawBusinessHeader(doc: PDFKit.PDFDocument, settings: ISettings): void {
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .text(settings.businessName, { align: 'center' });

  doc.fontSize(10).font('Helvetica');

  const addressParts = [
    settings.contact.address,
    settings.contact.city,
    settings.contact.state,
    settings.contact.pincode,
  ].filter(Boolean);

  if (addressParts.length > 0) {
    doc.text(addressParts.join(', '), { align: 'center' });
  }

  if (settings.contact.phone) {
    doc.text(`Phone: ${settings.contact.phone}`, { align: 'center' });
  }

  if (settings.gstNumber) {
    doc.text(`GST: ${settings.gstNumber}`, { align: 'center' });
  }

  doc.moveDown(1.5);

  // Separator line
  drawHorizontalLine(doc);
  doc.moveDown(0.5);
}

function drawInvoiceInfo(doc: PDFKit.PDFDocument, invoiceNumber: string, order: IOrder): void {
  const startY = doc.y;

  doc.fontSize(12).font('Helvetica-Bold').text('INVOICE', 50, startY);
  doc.moveDown(0.3);

  doc.fontSize(9).font('Helvetica');
  doc.text(`Invoice No: ${invoiceNumber}`, 50);
  doc.text(`Order No: ${order.orderNumber}`, 50);
  doc.text(`Date: ${formatDate(order.orderDate)}`, 50);
  doc.text(`Payment: ${formatPaymentMethod(order.paymentMethod)}`, 50);

  doc.moveDown(1);
}

function drawCustomerDetails(doc: PDFKit.PDFDocument, order: IOrder): void {
  doc.fontSize(10).font('Helvetica-Bold').text('Bill To:');
  doc.fontSize(9).font('Helvetica');

  const customer = order.customer as any;
  if (customer?.name) {
    doc.text(customer.name);
  }
  if (customer?.phone) {
    doc.text(`Phone: ${customer.phone}`);
  }

  // Delivery address
  const addr = order.deliveryAddress;
  const addrParts = [addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean);
  if (addrParts.length > 0) {
    doc.text(addrParts.join(', '));
  }

  doc.moveDown(1);
}

function drawItemsTable(doc: PDFKit.PDFDocument, order: IOrder, currency: string): void {
  // Table header
  const tableTop = doc.y;
  const colX = { num: 50, item: 75, unit: 250, qty: 310, rate: 370, amount: 450 };

  // Header background
  doc.rect(45, tableTop - 3, 510, 18).fill('#f0f0f0');

  doc.fillColor('#000000').fontSize(8).font('Helvetica-Bold');
  doc.text('#', colX.num, tableTop, { width: 20 });
  doc.text('Item', colX.item, tableTop, { width: 170 });
  doc.text('Unit', colX.unit, tableTop, { width: 55 });
  doc.text('Qty', colX.qty, tableTop, { width: 55 });
  doc.text('Rate', colX.rate, tableTop, { width: 75 });
  doc.text('Amount', colX.amount, tableTop, { width: 80, align: 'right' });

  doc.moveDown(0.5);
  let y = doc.y + 5;

  // Table rows
  doc.font('Helvetica').fontSize(8);
  order.items.forEach((item, index) => {
    // Check if we need a new page
    if (y > 700) {
      doc.addPage();
      y = 50;
    }

    doc.text(`${index + 1}`, colX.num, y, { width: 20 });
    doc.text(item.name, colX.item, y, { width: 170 });
    doc.text(item.unit, colX.unit, y, { width: 55 });
    doc.text(`${item.quantity}`, colX.qty, y, { width: 55 });
    doc.text(`${currency}${item.price.toFixed(2)}`, colX.rate, y, { width: 75 });
    doc.text(`${currency}${item.total.toFixed(2)}`, colX.amount, y, { width: 80, align: 'right' });

    y += 18;
  });

  doc.y = y + 5;
  drawHorizontalLine(doc);
  doc.moveDown(0.5);
}

function drawFinancialSummary(doc: PDFKit.PDFDocument, order: IOrder, currency: string): void {
  const rightCol = 400;
  const valueCol = 480;

  doc.fontSize(9).font('Helvetica');
  doc.text('Subtotal:', rightCol, doc.y, { continued: false });
  doc.text(`${currency}${order.subtotal.toFixed(2)}`, valueCol, doc.y - doc.currentLineHeight(), {
    width: 75,
    align: 'right',
  });

  if (order.deliveryCharge > 0) {
    doc.text('Delivery Charge:', rightCol);
    doc.text(`${currency}${order.deliveryCharge.toFixed(2)}`, valueCol, doc.y - doc.currentLineHeight(), {
      width: 75,
      align: 'right',
    });
  }

  if (order.discount > 0) {
    doc.text('Discount:', rightCol);
    doc.text(`-${currency}${order.discount.toFixed(2)}`, valueCol, doc.y - doc.currentLineHeight(), {
      width: 75,
      align: 'right',
    });
  }

  doc.moveDown(0.3);
  doc.font('Helvetica-Bold').fontSize(11);
  doc.text('Total:', rightCol);
  doc.text(`${currency}${order.total.toFixed(2)}`, valueCol, doc.y - doc.currentLineHeight(), {
    width: 75,
    align: 'right',
  });

  doc.moveDown(1);
}

function drawPaymentInfo(doc: PDFKit.PDFDocument, order: IOrder, currency: string): void {
  doc.fontSize(9).font('Helvetica-Bold').text('Payment Information');
  doc.font('Helvetica').fontSize(9);
  doc.text(`Method: ${formatPaymentMethod(order.paymentMethod)}`);
  doc.text(`Status: ${order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}`);
  doc.text(`Paid Amount: ${currency}${order.paidAmount.toFixed(2)}`);

  if (order.paymentStatus !== 'paid') {
    const balance = order.total - order.paidAmount;
    doc.text(`Balance Due: ${currency}${balance.toFixed(2)}`);
  }

  doc.moveDown(1.5);
}

function drawFooter(doc: PDFKit.PDFDocument): void {
  drawHorizontalLine(doc);
  doc.moveDown(0.5);
  doc.fontSize(9).font('Helvetica').text('Thank you for your business!', { align: 'center' });
  doc.fontSize(7).text('This is a computer-generated invoice.', { align: 'center' });
}

// --- Helpers ---

function drawHorizontalLine(doc: PDFKit.PDFDocument): void {
  const y = doc.y;
  doc.moveTo(50, y).lineTo(555, y).strokeColor('#cccccc').stroke();
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatPaymentMethod(method: string): string {
  const map: Record<string, string> = {
    cash: 'Cash',
    upi: 'UPI',
    bank_transfer: 'Bank Transfer',
    credit: 'Credit',
  };
  return map[method] || method;
}

/**
 * Extract a numeric sequence from the order number.
 * Assumes orderNumber is like "ORD-0001" and we want 1 (zero-based offset).
 */
function getOrderSequence(orderNumber: string): number {
  const match = orderNumber.match(/(\d+)$/);
  if (match) {
    return parseInt(match[1], 10) - 1;
  }
  return 0;
}
