function SkeletonCard() {
  return (
    <div className="panel rounded-[28px] p-5">
      <div className="h-7 w-24 animate-pulse rounded-full bg-slate-200" />
      <div className="mt-6 h-10 w-40 animate-pulse rounded-2xl bg-slate-200" />
      <div className="mt-3 h-5 w-56 animate-pulse rounded-xl bg-slate-100" />
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="panel h-64 animate-pulse rounded-[36px] bg-white/70" />
        <div className="panel h-24 animate-pulse rounded-[28px] bg-white/70" />
        <section className="grid gap-4 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </section>
        <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="panel h-[420px] animate-pulse rounded-[32px] bg-white/70" />
          <div className="panel h-[420px] animate-pulse rounded-[32px] bg-white/70" />
        </section>
        <div className="panel h-[340px] animate-pulse rounded-[32px] bg-white/70" />
      </div>
    </main>
  );
}