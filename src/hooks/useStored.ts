import { useState } from 'react';
export function useStored<T>(key: string, initial: T, validate: (x: unknown) => x is T) {
  const [warning, setWarning] = useState('');
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (validate(parsed)) return parsed;
      }
    } catch {
      /* unavailable storage */
    }
    return initial;
  });
  function save(next: T) {
    setValue(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setWarning('');
    } catch {
      setWarning(
        'Stockage local indisponible : vos changements ne seront pas conservés après fermeture.',
      );
    }
  }
  return [value, save, warning] as const;
}
