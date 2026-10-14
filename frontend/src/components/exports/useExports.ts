import { useEffect, useState } from 'react';

import type { ExportGroup } from '@/lib/db';
import { fetchDrafts } from '@/services/draft-storage';
import { fetchExportGroups } from '@/services/export-storage';

export function useExports() {
  const [exportGroups, setExportGroups] = useState<ExportGroup[]>([]);
  const [draftWords, setDraftWords] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [drafts, groups] = await Promise.all([fetchDrafts(), fetchExportGroups()]);
        if (!active) return;

        setDraftWords(
          Object.fromEntries(
            drafts.filter((draft) => draft.id !== undefined).map((draft) => [draft.id, draft.term]),
          ),
        );
        setExportGroups(groups);
      } catch (err) {
        if (!active) return;
        console.warn('Failed to load export data', err);
        setError('Failed to load export data.');
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadData();
    return () => {
      active = false;
    };
  }, []);

  return { exportGroups, draftWords, isLoading, error };
}
