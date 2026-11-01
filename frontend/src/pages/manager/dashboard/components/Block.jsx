/**
 * Khung khối nội dung dùng trong trang Dashboard
 */
export default function Block({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={`flex flex-col rounded-xl border border-slate-200 bg-white p-5 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[13px] text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
