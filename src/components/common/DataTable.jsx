export function DataTable({ columns, data, onRowClick }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E4ECFF]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-6 py-3 text-left text-xs font-bold text-[#0F172A]"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {data.map((row, idx) => (
                <tr
                  key={idx}
                  onClick={() => onRowClick?.(row)}
                  className="border-b border-[#E4ECFF] hover:bg-[#F9FBFF] cursor-pointer"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 text-sm text-[#475569]">
                      {row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export default DataTable
import { Card, CardContent } from "@/components/ui/Card"
