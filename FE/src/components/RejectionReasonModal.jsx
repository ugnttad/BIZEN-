import Modal from "./Modal";

export default function RejectionReasonModal({
  open,
  title = "Lý do từ chối",
  description,
  value,
  onChange,
  onClose,
  onSubmit,
  submitting = false,
  submitLabel = "Từ chối"
}) {
  const canSubmit = value.trim().length > 0 && !submitting;

  function handleSubmit(event) {
    event?.preventDefault();
    if (!canSubmit) return;
    onSubmit();
  }

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:text-slate-400"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:bg-slate-300"
          >
            {submitting ? "Đang lưu..." : submitLabel}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {description ? <p className="text-sm text-slate-600">{description}</p> : null}
        <label className="block text-sm font-semibold text-slate-700">
          Lý do
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            rows={4}
            autoFocus
            className="mt-2 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
          />
        </label>
      </form>
    </Modal>
  );
}
