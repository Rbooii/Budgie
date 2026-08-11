import Link from "next/link";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    items: [
      { label: "Features", href: "/#features" },
      { label: "Use cases", href: "/#use-cases" },
      { label: "Pricing", href: "/#pricing" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Get started",
    items: [
      { label: "Sign in", href: "/sign-in" },
      { label: "Create an account", href: "/sign-in" },
    ],
  },
] as const;

/**
 * Notion's footer anatomy kept, but trimmed to links that actually exist —
 * every anchor here resolves to a real page or section (no `#` dead ends,
 * no invented language selector or cookie settings).
 */
export function Footer() {
  return (
    <footer className="border-t border-black/[0.06] bg-white">
      <div className="mx-auto max-w-screen-xl px-5 sm:px-8 py-10 md:py-16 flex flex-col gap-10 lg:flex-row lg:gap-8">
        {/* Left block — brand + legal */}
        <div className="flex flex-col gap-4 lg:w-1/4">
          <Link href="/" className="font-bold text-xl tracking-tight text-black w-fit">
            Budgie
          </Link>
          <p className="text-sm text-black/45 max-w-xs">
            A calm, minimal personal-finance app built around the rupiah.
          </p>
          <p className="text-sm text-black/45">
            © {new Date().getFullYear()} Budgie.
          </p>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10 lg:flex-1">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-col">
              <p className="text-sm font-normal text-black/40">{col.title}</p>
              <ul className="mt-3 flex flex-col gap-2.5">
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
      </div>
    </footer>
  );
}
