/**
 * Calm loading placeholders used as the `Suspense` fallback on app routes.
 * Each `variant` mirrors the real page's geometry (header row, cards, lists)
 * so the static shell never shifts when the content streams in.
 */
type PageSkeletonVariant =
  | "dashboard"
  | "transactions"
  | "budget"
  | "profile"
  | "chat"
  | "add-transaction";

const PULSE = "animate-pulse motion-reduce:animate-none";

function Bar({ className }: { className: string }) {
  return <div className={`${PULSE} bg-[#F2F2F2] ${className}`} />;
}

function AccountTabSkeleton() {
  return (
    <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:gap-3">
      <Bar className="h-11 w-36 rounded-full" />
      <Bar className="h-12 w-44 rounded-full" />
    </div>
  );
}

function ListRowSkeleton() {
  return (
    <div className={`${PULSE} flex h-[72px] w-full items-center gap-3 rounded-2xl bg-[#F2F2F2] px-4`}>
      <div className="h-10 w-10 shrink-0 rounded-full bg-white/70" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="h-3.5 w-32 rounded-full bg-white/70" />
        <div className="h-3 w-20 rounded-full bg-white/70" />
      </div>
      <div className="h-3.5 w-20 rounded-full bg-white/70" />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <AccountTabSkeleton />
      <Bar className="mt-8 h-[124px] w-full rounded-[35px] md:mt-10" />
      <div className="mt-4 flex w-full gap-2">
        <Bar className="h-12 w-28 rounded-full" />
        <Bar className="h-12 w-36 rounded-full" />
      </div>

      <Bar className="mt-8 h-6 w-40 rounded-full" />
      <div className="mt-3 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className={`${PULSE} flex min-h-[180px] flex-col gap-3 rounded-[35px] bg-[#F2F2F2] px-5 py-5`}
          >
            <div className="h-5 w-28 rounded-full bg-white/70" />
            <div className="h-11 w-full rounded-full bg-white/70" />
            <div className="mt-auto h-6 w-32 rounded-full bg-white/70" />
          </div>
        ))}
      </div>

      <Bar className="mt-8 h-6 w-32 rounded-full" />
      <div className="mt-3 grid w-full grid-cols-1 gap-3 md:grid-cols-2">
        <Bar className="h-[340px] rounded-[35px]" />
        <Bar className="h-[340px] rounded-[35px]" />
      </div>
    </>
  );
}

function TransactionsSkeleton() {
  return (
    <>
      <AccountTabSkeleton />
      <Bar className="mt-6 h-9 w-52 rounded-full md:mt-8" />

      <div className="mt-2 flex w-full flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Bar className="h-11 w-full rounded-full sm:max-w-sm" />
          <div className="flex gap-2">
            <Bar className="h-11 w-24 rounded-full" />
            <Bar className="h-11 w-20 rounded-full" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Bar className="h-3 w-16 rounded-full" />
          {Array.from({ length: 5 }, (_, i) => (
            <ListRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </>
  );
}

function BudgetSkeleton() {
  return (
    <>
      <AccountTabSkeleton />
      <Bar className="mt-6 h-9 w-44 rounded-full md:mt-8" />

      <Bar className="mt-4 h-[176px] w-full rounded-[35px]" />
      <Bar className="mt-6 h-[300px] w-full rounded-[35px]" />

      <div className="mt-8 flex items-center justify-between">
        <Bar className="h-6 w-40 rounded-full" />
        <Bar className="h-11 w-28 rounded-full" />
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {Array.from({ length: 3 }, (_, i) => (
          <ListRowSkeleton key={i} />
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <Bar className="h-6 w-36 rounded-full" />
        <Bar className="h-11 w-32 rounded-full" />
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {Array.from({ length: 2 }, (_, i) => (
          <ListRowSkeleton key={i} />
        ))}
      </div>
    </>
  );
}

function ProfileSkeleton() {
  return (
    <>
      <div className="flex w-full flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <Bar className="h-9 w-40 rounded-full" />
        <div className="flex items-center gap-2">
          <Bar className="h-11 w-24 rounded-full" />
          <Bar className="h-11 w-28 rounded-full" />
        </div>
      </div>
      <Bar className="mt-6 h-[300px] w-full rounded-[35px]" />
      <Bar className="mt-3 h-[240px] w-full rounded-[35px]" />
    </>
  );
}

function ChatSkeleton() {
  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col">
      <div className="flex shrink-0 items-center gap-3 px-4 pt-4 pb-3 sm:px-6">
        <Bar className="h-[30px] w-[30px] rounded-[9px]" />
        <div className="flex flex-col gap-2">
          <Bar className="h-3.5 w-32 rounded-full" />
          <Bar className="h-3 w-44 rounded-full" />
        </div>
        <Bar className="ml-auto h-9 w-9 rounded-full" />
      </div>

      <div className="flex flex-1 min-h-0 flex-col gap-4 px-4 pt-6 sm:px-6">
        <Bar className="ml-auto h-11 w-2/3 max-w-[340px] rounded-[20px]" />
        <div className="flex items-start gap-3">
          <Bar className="h-6 w-6 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Bar className="h-4 w-full rounded-full" />
            <Bar className="h-4 w-5/6 rounded-full" />
            <Bar className="h-4 w-3/5 rounded-full" />
          </div>
        </div>
        <Bar className="h-24 w-full max-w-[440px] rounded-[20px]" />
      </div>

      <div className="shrink-0 px-4 pb-3 sm:px-6">
        <Bar className="h-[92px] w-full rounded-[24px]" />
        <Bar className="mx-auto mt-2 h-3 w-64 rounded-full" />
      </div>
    </div>
  );
}

function AddTransactionSkeleton() {
  return (
    <div className="flex w-full flex-col items-center">
      <Bar className="mb-6 h-9 w-56 rounded-full sm:mb-8" />
      <Bar className="h-[440px] w-full max-w-md rounded-[35px]" />
    </div>
  );
}

const VARIANTS: Record<PageSkeletonVariant, () => React.ReactElement> = {
  dashboard: DashboardSkeleton,
  transactions: TransactionsSkeleton,
  budget: BudgetSkeleton,
  profile: ProfileSkeleton,
  chat: ChatSkeleton,
  "add-transaction": AddTransactionSkeleton,
};

export function PageSkeleton({
  variant = "dashboard",
}: {
  variant?: PageSkeletonVariant;
}) {
  const Variant = VARIANTS[variant];
  const isChat = variant === "chat";
  return (
    <div
      className={isChat ? "h-full w-full" : "w-full flex flex-col gap-3"}
      aria-hidden="true"
    >
      <Variant />
    </div>
  );
}
