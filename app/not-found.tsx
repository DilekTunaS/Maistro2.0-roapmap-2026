import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-xl2 border border-line bg-card p-8 text-center shadow-card">
      <h1 className="text-2xl font-semibold">Sprint Not Found</h1>
      <p className="mt-2 text-sm text-muted">The requested sprint does not exist in local markdown content.</p>
      <Link href="/" className="mt-6 inline-flex rounded-md border border-line px-4 py-2 text-sm hover:bg-canvas">
        Return Home
      </Link>
    </div>
  );
}
