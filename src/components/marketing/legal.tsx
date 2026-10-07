export function Legal({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="display text-[48px]">{title}</h1>
      <p className="mt-2 text-[13px] text-muted">Last updated {updated}</p>
      <div className="prose-guide mt-8">{children}</div>
    </div>
  );
}
