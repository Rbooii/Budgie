import Link from "next/link";

const FOOTER_LINKS = [
  {
    title: "Product",
    items: [
      { label: "Features", href: "#features" },
      { label: "Insights", href: "#insights" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Sign in", href: "/sign-in" },
      { label: "Get started", href: "/sign-in" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-black/[0.06] bg-white">
      <div className="mx-auto max-w-screen-xl px-5 sm:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-2">
            <Link href="/" className="font-bold text-xl tracking-tight text-black">
              Budgie
            </Link>
            <p className="text-sm text-black/45 mt-2 max-w-sm leading-relaxed">
              A calm, minimal personal-finance app for tracking accounts,
              transactions, budgets, and subscriptions — built for the rupiah.
            </p>
          </div>
          {FOOTER_LINKS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-black">{col.title}</p>
              <ul className="mt-3 flex flex-col gap-2">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-black/45 hover:text-black transition"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 pt-6 border-t border-black/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-black/40">
            © {new Date().getFullYear()} Budgie. All rights reserved.
          </p>
          <p className="text-xs text-black/30">
            Built with Next.js · Hono · Prisma
          </p>
        </div>
      </div>
    </footer>
  );
}