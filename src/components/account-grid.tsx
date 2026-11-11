"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AccountCard, type Account } from "@/components/account-card";
import { api } from "@/lib/api-client";

interface AccountGridProps {
  accounts: Account[];
  accountSeries: Record<string, number[]>;
  accountTodayChanges: Record<string, number | null>;
}

function SortableAccountCard({
  account,
  series,
  todayChangePct,
}: {
  account: Account;
  series: number[];
  todayChangePct: number | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: account.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={isDragging ? "relative z-10" : ""}
    >
      <AccountCard
        account={account}
        series={series}
        todayChangePct={todayChangePct}
        dragHandleProps={
          { ...attributes, ...listeners } as React.ButtonHTMLAttributes<HTMLButtonElement>
        }
        isDragging={isDragging}
      />
    </div>
  );
}

/**
 * Kanban-style account grid. Dragging the handle reorders locally first, then
 * persists the full id order through `/api/balance-accounts/reorder`.
 */
export function AccountGrid({
  accounts,
  accountSeries,
  accountTodayChanges,
}: AccountGridProps) {
  const router = useRouter();
  const [items, setItems] = useState<Account[]>(accounts);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    const id = window.setTimeout(() => setItems(accounts), 0);
    return () => window.clearTimeout(id);
  }, [accounts]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((account) => account.id === active.id);
    const newIndex = items.findIndex((account) => account.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const previous = items;
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    setError(null);

    try {
      const res = await api["balance-accounts"].reorder.$post({
        json: { ids: next.map((account) => account.id) },
      });
      if (!res.ok) throw new Error("Could not save order");
      router.refresh();
    } catch {
      setItems(previous);
      setError("Could not save the new order. Try again.");
    }
  }

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((account) => account.id)}
          strategy={rectSortingStrategy}
        >
          <div className="w-full h-fit grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
            {items.map((account) => (
              <SortableAccountCard
                key={account.id}
                account={account}
                series={accountSeries[account.id] ?? []}
                todayChangePct={accountTodayChanges[account.id] ?? null}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {error && <p className="mt-2 text-xs text-expense">{error}</p>}
    </div>
  );
}
