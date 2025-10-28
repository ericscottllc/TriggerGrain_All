export function filterBySearchTerm<T extends Record<string, any>>(
  items: T[],
  searchTerm: string,
  searchableFields: (keyof T)[]
): T[] {
  if (!searchTerm.trim()) return items;

  const lowerSearch = searchTerm.toLowerCase();

  return items.filter(item =>
    searchableFields.some(field => {
      const value = item[field];
      if (value == null) return false;
      return String(value).toLowerCase().includes(lowerSearch);
    })
  );
}
