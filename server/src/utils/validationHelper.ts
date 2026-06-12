export const normalizeName = (name: string): string => {
  if (!name) return '';
  return name.trim().replace(/\s+/g, ' ');
};

export const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const getCaseInsensitiveQuery = (name: string): any => {
  const normalized = normalizeName(name);
  return {
    name: {
      $regex: new RegExp(`^${escapeRegex(normalized)}$`, 'i')
    }
  };
};
