import { AlertTriangle, CalendarCheck2, Clock3, CreditCard, Sparkles } from "lucide-react";
import AiChat from "../../components/AiChat";
import PageHeader from "../../components/PageHeader";
import { aiAlerts } from "../../data/mockData";

const aiActions = [
  { icon: CalendarCheck2, title: "Xếp lịch tuần sau", prompt: "Xếp lịch tuần sau cho bộ phận bán hàng" },
  { icon: Clock3, title: "Phân tích đi trễ", prompt: "Ai đi trễ nhiều nhất tháng này?" },
  { icon: CreditCard, title: "Giải thích lương", prompt: "Tại sao lương của nhân viên A giảm?" },
  { icon: AlertTriangle, title: "Thiếu nhân sự", prompt: "Hôm nay bộ phận nào thiếu người?" }
];

export default function AIAssistantPage() {
  return (
    <div>
      <PageHeader
        eyebrow="AI Assistant Panel"
        title="Trợ lý thông minh cho HR"
        description="Chatbox hỗ trợ truy vấn lịch ca, chấm công, payroll và cảnh báo vận hành."
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-blue-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-950">Prompt nhanh</h2>
              <p className="text-sm text-slate-500">Dữ liệu mẫu phản hồi ngay trong prototype.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {aiActions.map((action) => {
              const Icon = action.icon;
              return (
                <div key={action.title} className="rounded-lg border border-slate-200 p-4">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-950">{action.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">{action.prompt}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-lg border border-slate-200 p-4">
            <h2 className="text-base font-semibold text-slate-950">AI alerts</h2>
            <div className="mt-3 space-y-3">
              {aiAlerts.map((alert) => (
                <div key={alert.id} className="flex gap-3 rounded-lg bg-slate-50 p-3">
                  <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${alert.type === "danger" ? "text-rose-600" : alert.type === "warning" ? "text-amber-600" : "text-blue-600"}`} />
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{alert.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{alert.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <AiChat compact />
      </div>
    </div>
  );
}
