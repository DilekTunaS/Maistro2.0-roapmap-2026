export default async function ArchivePage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sprint Archive</h1>
        <p className="mt-2 text-sm text-muted">Archive currently has no active records.</p>
      </div>
      <article className="rounded-xl2 border border-line bg-card p-5 shadow-card">
        <h2 className="text-lg font-semibold tracking-tight">Demo Empty Sprint</h2>
        <p className="mt-2 text-sm text-muted">Lorem ipsum dolor sit amet, consectetur adipiscing elit. No archived sprint yet.</p>
      </article>
    </div>
  );
}
