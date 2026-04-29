import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { Invoice, Product, Customer, BusinessSettings } from '../types';

export const exportToExcel = (data: any[], fileName: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

export const shareInvoiceWhatsApp = async (elementId: string, invoice: Invoice, customer: Customer, settings: BusinessSettings) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    const dataUrl = canvas.toDataURL('image/png');
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], `bill-${invoice.invoiceNumber}.png`, { type: 'image/png' });

    const message = `*INVOICE FROM ${settings.name.toUpperCase()}*\n\n` +
      `*Invoice No:* ${invoice.invoiceNumber}\n` +
      `*Amount:* ₹${invoice.grandTotal.toFixed(2)}\n` +
      `*Recipient:* ${customer.businessName}\n\n` +
      `Thank you for your business!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${customer.phone ? customer.phone.replace(/\D/g, '') : ''}?text=${encodedMessage}`;

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Invoice ${invoice.invoiceNumber}`,
          text: message,
        });
      } catch (err) {
        // Fallback to link + download
        console.error('Share failed:', err);
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `bill-${invoice.invoiceNumber}.png`;
        link.click();
        window.open(whatsappUrl, '_blank');
      }
    } else {
      // Fallback: Download image and open WhatsApp
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `bill-${invoice.invoiceNumber}.png`;
      link.click();
      window.open(whatsappUrl, '_blank');
      alert('Invoice image downloaded. Please attach it to the WhatsApp chat.');
    }
  } catch (err) {
    console.error('WhatsApp share error:', err);
  }
};

export const generateInvoicePDF = (invoice: Invoice, customer: Customer, settings: BusinessSettings, salesPerson?: any) => {
  const doc = new jsPDF() as any;

  // Header
  if (settings.logoUrl) {
    try {
      doc.addImage(settings.logoUrl, 'PNG', 20, 10, 30, 30);
    } catch (e) {
      console.error("Logo failed to load", e);
    }
  }

  doc.setFontSize(20);
  doc.text('TAX INVOICE', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(settings.name, 140, 15, { align: 'right' });
  doc.text(settings.address, 140, 20, { align: 'right', maxWidth: 50 });
  doc.text(`GSTIN: ${settings.gstin}`, 140, 35, { align: 'right' });
  doc.text(`Phone: ${settings.phone}`, 140, 40, { align: 'right' });
  if (settings.email) doc.text(`Email: ${settings.email}`, 140, 45, { align: 'right' });
  
  // Invoice Details
  doc.text(`Invoice No: ${invoice.invoiceNumber}`, 20, 45);
  const invoiceDate = new Date(invoice.createdAt);
  doc.text(`Date/Time: ${invoiceDate.toLocaleDateString()} ${invoiceDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 20, 50);
  if (salesPerson) {
    doc.text(`Executive: ${salesPerson.name} (${salesPerson.code})`, 20, 55);
  }

  // Customer Details
  doc.setFontSize(12);
  doc.text('Bill To:', 20, 55);
  doc.setFontSize(10);
  doc.text(customer.businessName, 20, 60);
  doc.text(customer.address, 20, 65);
  doc.text(`GSTIN: ${customer.gstin}`, 20, 70);

  // Table
  const tableData = invoice.items.map(item => [
    item.productName,
    `${item.size} / ${item.color}`,
    item.quantity.toString(),
    item.price.toFixed(2),
    item.total.toFixed(2)
  ]);

  (doc as any).autoTable({
    startY: 80,
    head: [['Item Description', 'Size/Color', 'Qty', 'Rate', 'Total']],
    body: tableData,
    foot: [
      ['', '', '', 'Subtotal', invoice.subtotal.toFixed(2)],
      ['', '', '', 'Tax Total', invoice.taxTotal.toFixed(2)],
      ['', '', '', 'Grand Total', invoice.grandTotal.toFixed(2)]
    ]
  });

  doc.save(`${invoice.invoiceNumber}.pdf`);
};

export const printInvoice = (invoice: Invoice, customer: Customer, settings: BusinessSettings, salesPerson?: any) => {
  // Simple print view in new window or hidden iframe
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <html>
      <head>
        <title>Print Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 40px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .total-section { margin-left: auto; width: 300px; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
          .grand-total { font-weight: bold; border-top: 2px solid #000; margin-top: 8px; }
          .logo { max-width: 150px; height: auto; }
        </style>
      </head>
      <body>
        <div class="header" style="display: flex; justify-content: space-between; align-items: flex-start; text-align: left;">
          <div>
            ${settings.logoUrl ? `<img src="${settings.logoUrl}" class="logo">` : `<h1 style="margin:0">${settings.name}</h1>`}
          </div>
          <div style="text-align: right">
            <h2 style="margin:0; color:#2563eb">TAX INVOICE</h2>
            <p style="font-size: 14px; margin-top: 4px;">#${invoice.invoiceNumber}</p>
          </div>
        </div>
        <div class="grid">
          <div>
            <strong>Billing From:</strong><br>
            ${settings.name}<br>
            ${settings.address.replace(/\n/g, '<br>')}<br>
            GSTIN: ${settings.gstin}<br>
            Ph: ${settings.phone}${settings.email ? `<br>Email: ${settings.email}` : ''}
          </div>
          <div style="text-align: right">
            <strong>Date</strong>: ${new Date(invoice.createdAt).toLocaleDateString()}<br>
            <strong>Time</strong>: ${new Date(invoice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}<br>
            <strong>Due Date</strong>: ${new Date(invoice.createdAt + 15*24*60*60*1000).toLocaleDateString()}<br>
            ${salesPerson ? `<strong>Sales Personnel</strong>: ${salesPerson.name} (${salesPerson.code})<br>` : ''}
          </div>
        </div>
        <div>
          <strong>Bill To:</strong><br>
          ${customer.businessName}<br>
          ${customer.address}<br>
          GSTIN: ${customer.gstin}
        </div>
        <br>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Variant</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>${item.productName}</td>
                <td>${item.size} / ${item.color}</td>
                <td>${item.quantity}</td>
                <td>${item.price}</td>
                <td>${item.total}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total-section">
          <div class="total-row"><span>Subtotal</span> <span>₹${invoice.subtotal.toFixed(2)}</span></div>
          ${settings.taxTypes.filter(t => t.isDefault).map(t => {
            // This is a simple proportional breakdown for demonstration
            // In a real app, you'd calculate this per item based on actual tax configuration
            const proportionalTax = (invoice.taxTotal * (t.rate / settings.taxTypes.filter(dt => dt.isDefault).reduce((sum, dt) => sum + dt.rate, 0)));
            if (isNaN(proportionalTax)) return '';
            return `<div class="total-row text-slate-400" style="font-size: 11px"><span>${t.name} (${t.rate}%)</span> <span>₹${proportionalTax.toFixed(2)}</span></div>`;
          }).join('')}
          <div class="total-row"><span>GST Amount (Total)</span> <span>₹${invoice.taxTotal.toFixed(2)}</span></div>
          <div class="total-row grand-total"><span>Grand Total</span> <span>₹${invoice.grandTotal.toFixed(2)}</span></div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};
