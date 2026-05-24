import { Link } from "react-router-dom";
import { ArrowLeft, ScanFace } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import FaceIDCheckin from "../mobile/FaceIDCheckin";

export default function EmployeeWebCheckin() {
  return (
    <div>
      <Link to="/web/me" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
        <ArrowLeft className="h-4 w-4" />
        Cổng nhân viên
      </Link>
      <PageHeader
        eyebrow="Face ID"
        title="Chấm công trên web"
        description="Dùng camera hoặc tải ảnh lên để đăng ký khuôn mặt, check-in và check-out theo ca."
        actions={
          <span className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">
            <ScanFace className="h-4 w-4" />
            Employee
          </span>
        }
      />
      <div className="mx-auto max-w-3xl">
        <FaceIDCheckin />
      </div>
    </div>
  );
}
