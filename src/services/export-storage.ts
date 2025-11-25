import { db, type DraftEntry, type DraftNoteType, type ExportGroup } from '@/lib/db';

const escapeCsvValue = (value: unknown) => {
  const str = `${value ?? ''}`.replace(/"/g, '""');
  return `"${str}"`;
};

const buildFileName = (noteType: DraftNoteType, createdAt: string) => {
  const slug = noteType.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/-+/g, '-');
  const timestamp = createdAt.replace(/[:.]/g, '-');
  return `${slug}-${timestamp}.csv`;
};

export const buildCsvContent = (drafts: DraftEntry[], noteType: DraftNoteType) => {
  if (!drafts.length) {
    throw new Error('No drafts to export');
  }

  const firstCard = drafts[0].card;
  if (!firstCard) {
    throw new Error('Draft is missing generated card');
  }

  const fieldOrder = Object.keys(firstCard.fields);
  const header = [
    '#separator:Comma',
    `#notetype column:${fieldOrder.length + 1}`,
    `#columns:${fieldOrder.join(',')},"notetype"`,
  ];

  const rows = drafts.map((draft) => {
    if (!draft.card) {
      throw new Error('Draft is missing generated card');
    }
    const values = fieldOrder.map((field) => escapeCsvValue(draft.card?.fields[field]));
    values.push(escapeCsvValue(noteType));
    return values.join(',');
  });

  return [...header, ...rows].join('\n');
};

export async function createExportGroupFromDrafts(draftIds: number[]): Promise<ExportGroup> {
  if (!draftIds.length) {
    throw new Error('Select at least one draft to export');
  }

  const drafts = (await db.drafts.bulkGet(draftIds)).filter(Boolean) as DraftEntry[];
  const draftsWithCards = drafts.filter((draft) => draft.card);

  if (!draftsWithCards.length) {
    throw new Error('No generated cards to export');
  }

  const createdAt = new Date().toISOString();
  const byNoteType = draftsWithCards.reduce<Record<DraftNoteType, DraftEntry[]>>((acc, draft) => {
    acc[draft.noteType] = acc[draft.noteType] ?? [];
    acc[draft.noteType].push(draft);
    return acc;
  }, {} as Record<DraftNoteType, DraftEntry[]>);

  const files = Object.entries(byNoteType).map(([noteType, entries]) => ({
    noteType: noteType as DraftNoteType,
    fileName: buildFileName(noteType as DraftNoteType, createdAt),
    createdAt,
    content: buildCsvContent(entries, noteType as DraftNoteType),
  }));

  const group: ExportGroup = {
    createdAt,
    draftIds: draftsWithCards.map((draft) => draft.id!) as number[],
    words: draftsWithCards.map((draft) => draft.term),
    files,
  };

  const id = await db.exportGroups.add(group);
  await Promise.all(
    draftsWithCards.map((draft) =>
      db.drafts.update(draft.id!, { exported: true, exportedAt: createdAt }),
    ),
  );

  return { ...group, id };
}

export async function fetchExportGroups(): Promise<ExportGroup[]> {
  const groups = await db.exportGroups.orderBy('createdAt').reverse().toArray();
  return groups.map((group) => ({ ...group, words: group.words ?? [] }));
}

export async function clearExportGroups() {
  await db.exportGroups.clear();
}
