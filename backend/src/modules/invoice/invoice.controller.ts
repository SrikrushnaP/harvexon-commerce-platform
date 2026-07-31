import { Request, Response } from 'express';
import { orderService } from '../order';
import { settingsService } from '../settings';
import { generateInvoicePDF } from './invoice.service';
import { asyncHandler } from '../../common/middleware';
import { NotFoundError } from '../../common/middleware';

export const generateInvoice = asyncHandler(async (req: Request, res: Response) => {
  const orderId = req.params.orderId as string;

  // Load order (with populated customer)
  const order = await orderService.getById(orderId);

  // Load settings
  const settings = await settingsService.getSettings();
  if (!settings) {
    throw new NotFoundError('Settings not configured');
  }

  // Generate PDF
  const doc = generateInvoicePDF({ order, settings });

  // Set response headers
  const filename = `INV-${order.orderNumber}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  // Pipe the PDF stream to the response
  doc.pipe(res);
});
