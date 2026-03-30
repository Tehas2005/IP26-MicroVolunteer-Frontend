import { useEffect, useState } from 'react';

/**
 * Returnează `true` dacă lățimea ferestrei este mai mică de 768px.
 * Se actualizează automat la resize.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return isMobile;
}