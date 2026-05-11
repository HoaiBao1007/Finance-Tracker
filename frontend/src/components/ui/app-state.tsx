"use client";

type AppStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function AppState({
  title,
  description,
  actionLabel,
  onAction,
}: AppStateProps) {
  return (
    <div className="panel rounded-[28px] border-dashed px-6 py-10 text-center sm:px-10">
      <span className="eyebrow">Finance tracker</span>
      <h2 className="mt-3 text-2xl font-semibold text-slate-900">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">
        {description}
      </p>
      {actionLabel && onAction ? (
        <button
          className="mt-6 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          type="button"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}