import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function BottomActionPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot="bottom-action-panel"
      className="fixed inset-x-0 bottom-(--mobile-nav-height) z-20 h-(--bottom-action-panel-height) bg-white/20 shadow-[0_-4px_24px] shadow-ink/3 backdrop-blur-[10px] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-line/60 before:content-[''] md:bottom-0"
    >
      <div className={cn('mx-auto h-full w-full max-w-6xl px-(--page-gutter) py-3', className)}>
        {children}
      </div>
    </div>
  );
}
