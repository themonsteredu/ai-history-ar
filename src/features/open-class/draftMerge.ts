/** Three-way merge: only combine independent edits; never guess between two changes to the same value. */
const canonical = (value: unknown): string | undefined => JSON.stringify(value, (_key, item: unknown) => item && typeof item === 'object' && !Array.isArray(item)
  ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);
export const sameContent = (a: unknown, b: unknown) => a === b || canonical(a) === canonical(b);
const conflict = Symbol('conflict');
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

function merge(base: unknown, local: unknown, remote: unknown, atomic = false): unknown | typeof conflict {
  if (sameContent(local, remote) || sameContent(base, remote)) return local;
  if (sameContent(base, local)) return remote;
  if (atomic) return conflict;
  if (object(base) && object(local) && object(remote)) {
    const result: Record<string, unknown> = {};
    for (const key of new Set([...Object.keys(base), ...Object.keys(local), ...Object.keys(remote)])) {
      const value = merge(base[key], local[key], remote[key]);
      if (value === conflict) return conflict;
      if (value !== undefined) result[key] = value;
    }
    return result;
  }
  if (Array.isArray(base) && Array.isArray(local) && Array.isArray(remote)) {
    const lists = [base, local, remote];
    const identity = ['id', 'questionId'].find(key => lists.every(list => list.every(row => object(row) && typeof row[key] === 'string') && new Set(list.map(row => row[key])).size === list.length));
    if (identity) {
      const [before, ours, theirs] = lists.map(list => new Map(list.map(row => [row[identity], row])));
      const result: unknown[] = [];
      for (const key of new Set([...theirs.keys(), ...ours.keys(), ...before.keys()])) {
        // A point/question is one unit: competing edits or deletion vs editing require a choice.
        const row = merge(before.get(key), ours.get(key), theirs.get(key), true);
        if (row === conflict) return conflict;
        if (row !== undefined) result.push(row);
      }
      return result;
    }
    if (base.length === local.length && base.length === remote.length) {
      const result = base.map((value, index) => merge(value, local[index], remote[index]));
      return result.includes(conflict) ? conflict : result;
    }
  }
  return conflict;
}

export function mergeDraftData<T>(base: T, local: T, remote: T): { ok: true; data: T } | { ok: false } {
  // An answer checked against an old question must not be combined with another tablet's new question.
  if (object(base) && object(local) && object(remote) && Array.isArray(base.selfQuestions)) {
    const question = (value: Record<string, unknown>, id: unknown) => Array.isArray(value.selfQuestions) ? value.selfQuestions.find(q => q.id === id) : undefined;
    const item = (value: Record<string, unknown>, id: unknown) => Array.isArray(value.items) ? value.items.find(i => i.questionId === id) : undefined;
    for (const q of base.selfQuestions) {
      if ((!sameContent(q, question(local, q.id)) && !sameContent(item(base, q.id), item(remote, q.id))) ||
          (!sameContent(q, question(remote, q.id)) && !sameContent(item(base, q.id), item(local, q.id)))) return { ok: false };
    }
  }
  const data = merge(base, local, remote);
  return data === conflict ? { ok: false } : { ok: true, data: data as T };
}
