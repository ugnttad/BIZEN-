import { SearchX } from "lucide-react";

export default function EmptyState({ title = "Không có dữ liệu", description = "Điều chỉnh bộ lọc để xem kết quả khác." }) {
  return (
    <div className="grid min-h-48 place-items-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <div>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500">
          <SearchX className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-sm font-semibold text-slate-950">{title}</h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}
