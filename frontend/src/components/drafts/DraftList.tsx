import type { DraftEntry } from '@/lib/db';
import type { LLMModel } from '@/stores/llm';
import { DraftCard, type DraftCardActions } from './DraftCard';

type DraftListProps = DraftCardActions & {
  drafts: DraftEntry[];
  selectedIds: ReadonlySet<number>;
  generatingIds: ReadonlySet<number>;
  currentModel: LLMModel;
};

export function DraftList({
  drafts,
  selectedIds,
  generatingIds,
  currentModel,
  ...actions
}: DraftListProps) {
  return (
    <div className="grid min-w-0 gap-3 lg:grid-cols-2">
      {drafts.map((draft) => (
        <DraftCard
          key={draft.id}
          draft={draft}
          selected={draft.id !== undefined && selectedIds.has(draft.id)}
          isGenerating={draft.id !== undefined && generatingIds.has(draft.id)}
          currentModel={currentModel}
          {...actions}
        />
      ))}
    </div>
  );
}
