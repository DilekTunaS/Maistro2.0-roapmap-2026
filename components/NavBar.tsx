import Link from "next/link";

const navItems = [
  { href: "/", label: "Home (Maistro Bulten)" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/dashboard", label: "C-Level Dashboard" },
  { href: "/ideas", label: "Ideas" },
  { href: "/archive", label: "Archive" },
];

export function NavBar() {
  return (
    <header className="border-b border-line bg-card/95 backdrop-blur">
      <div className="container-shell flex min-h-16 items-center justify-between gap-6">
        <Link href="/" className="text-sm font-semibold tracking-tight sm:text-base">
          Maistro 2026 Product Strateji
        </Link>
        <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-xs font-medium text-muted transition hover:bg-canvas hover:text-ink sm:text-sm"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
