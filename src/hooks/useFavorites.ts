'use client';

import { useState, useEffect, useCallback } from 'react';
import { PharmacyRaw } from '@/lib/pharmacy-api';

const STORAGE_KEY = 'yakgukchaja_favorites';

function getKey(p: PharmacyRaw) {
  return `${p.dutyName}__${p.dutyAddr}`;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<PharmacyRaw[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setFavorites(JSON.parse(stored));
    } catch {
      // 파싱 실패 시 무시
    }
  }, []);

  const isFavorite = useCallback(
    (pharmacy: PharmacyRaw) => favorites.some((f) => getKey(f) === getKey(pharmacy)),
    [favorites]
  );

  const toggleFavorite = useCallback((pharmacy: PharmacyRaw) => {
    setFavorites((prev) => {
      const key = getKey(pharmacy);
      const exists = prev.some((f) => getKey(f) === key);
      const next = exists ? prev.filter((f) => getKey(f) !== key) : [...prev, pharmacy];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // 스토리지 용량 초과 등 무시
      }
      return next;
    });
  }, []);

  return { favorites, isFavorite, toggleFavorite };
}
