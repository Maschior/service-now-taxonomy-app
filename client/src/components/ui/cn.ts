export type ClassValue = string | number | false | null | undefined;

/** Junta classes condicionalmente, ignorando valores falsy. */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ');
}
