import EmptyState from './EmptyState';

export default function Table({
  columns,
  data,
  emptyMessage = 'لا توجد بيانات',
  emptyIcon = 'fa-inbox',
  renderRow,
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100">
      <table className="w-full min-w-[600px] border-collapse">
        <thead>
          <tr className="bg-slate-100">
            {columns.map((col, i) => (
              <th
                key={i}
                className="px-4 py-3 text-center font-semibold text-sm text-slate-700"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {!data.length ? (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState icon={emptyIcon} message={emptyMessage} />
              </td>
            </tr>
          ) : (
            data.map((row, i) => renderRow(row, i))
          )}
        </tbody>
      </table>
    </div>
  );
}