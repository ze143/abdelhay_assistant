import {
  formatDate,
  formatTime,
  formatCurrency,
  monthLabel,
} from "./formatters";
import { supabase } from "./supabase";

export async function printClosing(closing, workerName) {
  const { data: txns, error } = await supabase
    .from("app_transactions")
    .select("*")
    .eq("closing_id", closing.id)
    .order("created_at", { ascending: true });

  if (error) {
    alert("فشل تحميل تفاصيل الحركات: " + error.message);
    return;
  }

  const logoUrl = `${window.location.origin}/Asset-2.ico`;

  const bonuses = (txns || []).filter((t) => t.type === "مكافأة");
  const discounts = (txns || []).filter((t) => t.type === "خصم");
  const advances = (txns || []).filter((t) => t.type === "سلفة");

  const renderTxnsTable = (items, color, title) => {
    if (!items.length) {
      return `
        <div class="section">
          <h3 class="section-title" style="color:${color}">${title}</h3>
          <p class="empty">لا توجد ${title}</p>
        </div>
      `;
    }
    return `
      <div class="section">
        <h3 class="section-title" style="color:${color}">${title} (${items.length})</h3>
        <table class="txn-table">
          <thead>
            <tr>
              <th>#</th>
              <th>المبلغ</th>
              <th>السبب</th>
              <th>التاريخ</th>
              <th>الوقت</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (t, i) => `
              <tr>
                <td>${i + 1}</td>
                <td style="color:${color}; font-weight:700">${formatCurrency(t.amount)}</td>
                <td>${t.note || "—"}</td>
                <td>${formatDate(t.created_at)}</td>
                <td>${formatTime(t.created_at)}</td>
              </tr>
            `,
              )
              .join("")}
            <tr class="total-row">
              <td colspan="4" style="text-align:left">إجمالي ${title}</td>
              <td style="color:${color}; font-weight:700">
                ${formatCurrency(items.reduce((s, t) => s + Number(t.amount || 0), 0))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  };

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>تقرير قبض ${monthLabel(closing.month)} - ${workerName}</title>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
        body { background: white; padding: 30px; direction: rtl; color: #1e293b; position: relative; }
        .container { max-width: 800px; margin: 0 auto; position: relative; z-index: 1; }
        
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
  object-fit: cover;
  border-radius: 50%;
  background: white;
  border: 3px solid #b45309;
  padding: 6px;
  margin-bottom: 10px;
  display: block;
  margin-left: auto;
  margin-right: auto;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

        .watermark {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-30deg);
  opacity: 0.05;
  width: 400px;
  height: 400px;
  object-fit: cover;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
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
        .info-box .value { font-size: 16px; font-weight: 700; color: #1e293b; }

        .salary-box {
          background: #fef3c7;
          border: 2px solid #f59e0b;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 25px;
        }
        .salary-box .row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 14px;
        }
        .salary-box .row.big {
          border-top: 2px solid #d97706;
          margin-top: 8px;
          padding-top: 10px;
          font-size: 18px;
          font-weight: 700;
          color: #b45309;
        }
        .salary-box .plus { color: #16a34a; }
        .salary-box .minus { color: #dc2626; }

        .section { margin-bottom: 20px; }
        .section-title {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 8px;
          padding-bottom: 4px;
          border-bottom: 2px solid;
          display: inline-block;
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
        }
        .empty {
          color: #94a3b8;
          font-size: 12px;
          padding: 10px;
          text-align: center;
          background: #f8fafc;
          border-radius: 8px;
        }

        .signature {
          display: flex;
          justify-content: flex-start;
          margin-top: 50px;
          font-size: 13px;
          color: #64748b;
        }
        .signature .sig {
          text-align: center;
          min-width: 220px;
        }
        .signature .sig .name {
          font-weight: 700;
          color: #b45309;
          font-size: 16px;
          margin-bottom: 4px;
        }
        .signature .line {
          border-top: 1.5px solid #94a3b8;
          margin: 8px 0 6px 0;
        }
        .signature .sig .role {
          font-size: 12px;
          color: #64748b;
        }

        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 15px;
          border-top: 2px solid #e2e8f0;
          color: #94a3b8;
          font-size: 12px;
        }
        
        .footer-logo {
  width: 28px;
  height: 28px;
  object-fit: cover;
  border-radius: 50%;
  background: white;
  border: 2px solid #b45309;
  padding: 2px;
  vertical-align: middle;
  margin-left: 6px;
  display: inline-block;
}
      </style>
    </head>
    <body>
      <img src="${logoUrl}" alt="" class="watermark" />
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="لوجو" class="logo" onerror="this.style.display='none'" />
          <h1>🍽️ مطعم عبدالحي الكبابجي</h1>
          <p>تقرير قبض راتب - ${monthLabel(closing.month)}</p>
        </div>

        <div class="info-box">
          <div class="item">
            <div class="label">اسم العامل</div>
            <div class="value">${workerName}</div>
          </div>
          <div class="item">
            <div class="label">الشهر</div>
            <div class="value">${monthLabel(closing.month)}</div>
          </div>
          <div class="item">
            <div class="label">تاريخ التقفيل</div>
            <div class="value">${formatDate(closing.closed_at)}</div>
          </div>
        </div>

        <div class="salary-box">
          <div class="row">
            <span>عدد الساعات × سعر الساعة</span>
            <span>${Number(closing.total_hours).toFixed(1)} ساعة × ${formatCurrency(closing.hourly_rate)}</span>
          </div>
          <div class="row">
            <span>الأجر الأساسي</span>
            <span>${formatCurrency(closing.base_pay)}</span>
          </div>
          <div class="row">
            <span>إجمالي المكافآت</span>
            <span class="plus">+${formatCurrency(closing.total_bonuses)}</span>
          </div>
          <div class="row">
            <span>إجمالي الخصومات</span>
            <span class="minus">-${formatCurrency(closing.total_discounts)}</span>
          </div>
          <div class="row">
            <span>إجمالي السلف</span>
            <span class="minus">-${formatCurrency(closing.total_advances)}</span>
          </div>
          <div class="row big">
            <span>💰 صافي الراتب المستحق</span>
            <span>${formatCurrency(closing.net_pay)}</span>
          </div>
        </div>

        ${renderTxnsTable(bonuses, "#16a34a", "المكافآت")}
        ${renderTxnsTable(discounts, "#dc2626", "الخصومات")}
        ${renderTxnsTable(advances, "#d97706", "السلف")}

        <div class="signature">
          <div class="sig">
            <p class="name">سيد عبدالحي</p>
            <div class="line"></div>
            <p class="role">الإدارة</p>
          </div>
        </div>

        <div class="footer">
          <img src="${logoUrl}" alt="" class="footer-logo" onerror="this.style.display='none'" />
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

  const win = window.open("", "_blank", "width=900,height=1000");
  if (!win) {
    alert("⚠️ يرجى السماح للنوافذ المنبثقة من المتصفح");
    return;
  }
  win.document.write(html);
  win.document.close();
}
