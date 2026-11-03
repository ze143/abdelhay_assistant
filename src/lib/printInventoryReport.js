import { formatCurrency, formatDate } from './formatters';

/**
 * طباعة تقرير مخزون
 */
export function printInventoryReport({
  title,
  subtitle,
  headers,
  rows,
  footer,
  logoUrl,
}) {
  const footerHTML = footer
    ? `<tfoot><tr class="total-row">${footer.map((c) => `<td>${c}</td>`).join('')}</tr></tfoot>`
    : '';

  const tableHTML = `
    <table>
      <thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>
        ${
          rows.length === 0
            ? `<tr><td colspan="${headers.length}" style="text-align:center;padding:20px;color:#94a3b8;">لا توجد بيانات</td></tr>`
            : rows.map((row) => `<tr>${row.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')
        }
      </tbody>
      ${footerHTML}
    </table>
  `;

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
        body { background: white; padding: 30px; direction: rtl; color: #1e293b; }
        .container { max-width: 1000px; margin: 0 auto; }
        .header {
          text-align: center;
          border-bottom: 3px solid #b45309;
          padding-bottom: 20px;
          margin-bottom: 25px;
        }
        .header .logo {
          width: 70px;
          height: 70px;
          object-fit: contain;
          border-radius: 50%;
          border: 3px solid #b45309;
          padding: 6px;
          margin-bottom: 10px;
          display: block;
          margin-left: auto;
          margin-right: auto;
        }
        .header h1 { color: #b45309; font-size: 24px; margin-bottom: 5px; }
        .header p { color: #64748b; font-size: 14px; }
        .header .subtitle { color: #b45309; font-weight: 700; font-size: 16px; margin-top: 5px; }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          margin-top: 15px;
        }
        th {
          background: #f1f5f9;
          padding: 8px;
          border: 1px solid #94a3b8;
          text-align: center;
          font-weight: 700;
        }
        td {
          padding: 7px;
          border: 1px solid #cbd5e1;
          text-align: center;
        }
        .total-row {
          background: #fef3c7;
          font-weight: 700;
          font-size: 13px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 15px;
          border-top: 2px solid #e2e8f0;
          color: #94a3b8;
          font-size: 12px;
        }
        @media print {
          body { padding: 10px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${logoUrl ? `<img src="${logoUrl}" alt="لوجو" class="logo" onerror="this.style.display='none'" />` : ''}
          <h1>🍽️ مطعم عبدالحي الكبابجي</h1>
          <p>${title}</p>
          ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
          <p style="margin-top:8px;font-size:12px;">تاريخ الطباعة: ${formatDate(new Date().toISOString())}</p>
        </div>
        ${tableHTML}
        <div class="footer">
          تم إنشاء هذا التقرير بواسطة نظام مطعم عبدالحي الكبابجي &copy; ${new Date().getFullYear()}
        </div>
      </div>
      <script>
        window.onload = function() {
          setTimeout(() => window.print(), 600);
        };
      <\/script>
    </body>
    </html>
  `;

  const win = window.open('', '_blank', 'width=1100,height=900');
  if (!win) {
    alert('⚠️ يرجى السماح للنوافذ المنبثقة');
    return;
  }
  win.document.write(html);
  win.document.close();
}