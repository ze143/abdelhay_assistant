import { formatDate, formatTime, formatCurrency } from './formatters';

/**
 * يفتح نافذة طباعة فيها كشف حساب كامل للعميل
 */
export function printCustomerStatement({
  customer,
  debts,
  payments,
  logoUrl,
}) {
  const openDebts = debts.filter((d) => d.status === 'open');
  const paidDebts = debts.filter((d) => d.status === 'paid');

  const totalOpen = openDebts.reduce((s, d) => s + Number(d.amount || 0), 0);
  const totalPaid = paidDebts.reduce((s, d) => s + Number(d.amount || 0), 0);
  const totalAll = totalOpen + totalPaid;

  // جدول المديونيات
  const debtsTableHTML =
    debts.length === 0
      ? `<p class="empty">لا توجد مديونيات</p>`
      : `
        <table class="txn-table">
          <thead>
            <tr>
              <th>#</th>
              <th>المبلغ</th>
              <th>الملاحظة</th>
              <th>التاريخ</th>
              <th>الوقت</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${debts
              .map(
                (d, i) => `
              <tr>
                <td>${i + 1}</td>
                <td style="font-weight:700; color:${
                  d.status === 'paid' ? '#16a34a' : '#dc2626'
                }">${formatCurrency(d.amount)}</td>
                <td>${d.note || '—'}</td>
                <td>${formatDate(d.created_at)}</td>
                <td>${formatTime(d.created_at)}</td>
                <td>${
                  d.status === 'paid'
                    ? '<span style="background:#dcfce7;color:#166534;padding:2px 8px;border-radius:10px;font-size:11px;">مسددة</span>'
                    : '<span style="background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:10px;font-size:11px;">مفتوحة</span>'
                }</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="1" style="text-align:left">إجمالي المديونيات</td>
              <td colspan="5" style="color:#b45309">
                ${debts.length} مديونية — ${formatCurrency(totalAll)}
              </td>
            </tr>
          </tfoot>
        </table>
      `;

  // جدول المدفوعات (المديونيات المسددة)
  const paymentsTableHTML =
    paidDebts.length === 0
      ? `<p class="empty">لا توجد مدفوعات</p>`
      : `
        <table class="txn-table">
          <thead>
            <tr>
              <th>#</th>
              <th>المبلغ</th>
              <th>الملاحظة</th>
              <th>التاريخ</th>
              <th>الوقت</th>
            </tr>
          </thead>
          <tbody>
            ${paidDebts
              .map(
                (d, i) => `
              <tr>
                <td>${i + 1}</td>
                <td style="font-weight:700; color:#16a34a">${formatCurrency(d.amount)}</td>
                <td>${d.note || '—'}</td>
                <td>${formatDate(d.created_at)}</td>
                <td>${formatTime(d.created_at)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="1" style="text-align:left">إجمالي المسدد</td>
              <td colspan="4" style="color:#16a34a">
                ${formatCurrency(totalPaid)}
              </td>
            </tr>
          </tfoot>
        </table>
      `;

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>كشف حساب - ${customer.name}</title>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
        body { background: white; padding: 30px; direction: rtl; color: #1e293b; }
        .container { max-width: 800px; margin: 0 auto; }

        .header {
          text-align: center;
          border-bottom: 3px solid #b45309;
          padding-bottom: 20px;
          margin-bottom: 25px;
        }
        .header h1 { color: #b45309; font-size: 26px; margin-bottom: 5px; }
        .header p { color: #64748b; font-size: 15px; }
        .header .logo {
          width: 80px;
          height: 80px;
          object-fit: contain;
          border-radius: 50%;
          background: white;
          border: 3px solid #b45309;
          padding: 6px;
          margin-bottom: 10px;
          display: block;
          margin-left: auto;
          margin-right: auto;
        }

        .info-box {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          background: #f8fafc;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
        }
        .info-box .item { text-align: center; }
        .info-box .label { font-size: 12px; color: #64748b; margin-bottom: 3px; }
        .info-box .value { font-size: 15px; font-weight: 700; color: #1e293b; }

        .summary-box {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
          margin-bottom: 25px;
        }
        .summary-box .box {
          text-align: center;
          padding: 16px;
          border-radius: 12px;
          border-right: 4px solid;
        }
        .summary-box .box .label { font-size: 12px; margin-bottom: 4px; }
        .summary-box .box .value { font-size: 20px; font-weight: 700; }
        .box-open { background: #fef2f2; border-color: #dc2626; color: #991b1b; }
        .box-paid { background: #f0fdf4; border-color: #16a34a; color: #166534; }
        .box-total { background: #fef3c7; border-color: #f59e0b; color: #92400e; }

        .section { margin-bottom: 25px; }
        .section-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 10px;
          padding-bottom: 6px;
          border-bottom: 2px solid #b45309;
          color: #b45309;
        }

        .txn-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .txn-table th {
          background: #f1f5f9;
          padding: 8px;
          border: 1px solid #cbd5e1;
          font-weight: 700;
        }
        .txn-table td {
          padding: 7px;
          border: 1px solid #e2e8f0;
          text-align: center;
        }
        .txn-table .total-row td {
          background: #fef3c7;
          font-weight: 700;
          font-size: 14px;
        }
        .empty {
          color: #94a3b8;
          font-size: 13px;
          padding: 15px;
          text-align: center;
          background: #f8fafc;
          border-radius: 8px;
        }

        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 15px;
          border-top: 2px solid #e2e8f0;
          color: #94a3b8;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${
            logoUrl
              ? `<img src="${logoUrl}" alt="لوجو" class="logo" onerror="this.style.display='none'" />`
              : ''
          }
          <h1>🍽️ مطعم عبدالحي الكبابجي</h1>
          <p>كشف حساب عميل</p>
        </div>

        <div class="info-box">
          <div class="item">
            <div class="label">اسم العميل</div>
            <div class="value">${customer.name}</div>
          </div>
          <div class="item">
            <div class="label">الهاتف</div>
            <div class="value">${customer.phone || '—'}</div>
          </div>
          <div class="item">
            <div class="label">تاريخ الكشف</div>
            <div class="value">${formatDate(new Date().toISOString())}</div>
          </div>
        </div>

        <div class="summary-box">
          <div class="box box-open">
            <div class="label">المديونية الحالية</div>
            <div class="value">${formatCurrency(totalOpen)}</div>
          </div>
          <div class="box box-paid">
            <div class="label">إجمالي المسدد</div>
            <div class="value">${formatCurrency(totalPaid)}</div>
          </div>
          <div class="box box-total">
            <div class="label">إجمالي التعاملات</div>
            <div class="value">${formatCurrency(totalAll)}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">📋 المديونيات (${debts.length})</div>
          ${debtsTableHTML}
        </div>

        <div class="section">
          <div class="section-title">💰 سجل السداد (${paidDebts.length})</div>
          ${paymentsTableHTML}
        </div>

        <div class="footer">
          تم إنشاء هذا الكشف بواسطة نظام مطعم عبدالحي الكبابجي &copy; ${new Date().getFullYear()}
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

  const win = window.open('', '_blank', 'width=900,height=1000');
  if (!win) {
    alert('⚠️ يرجى السماح للنوافذ المنبثقة من المتصفح');
    return;
  }
  win.document.write(html);
  win.document.close();
}