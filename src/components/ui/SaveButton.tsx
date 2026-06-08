'use client';

import { Heart } from 'lucide-react';
import { useState, useEffect } from 'react';

import { SAVED_PRODUCTS_STORAGE_KEY, SAVED_PRODUCTS_CHANGE_EVENT } from '@/lib/saved-products';

type SaveButtonProps = {
  productId: string;
  className?: string;
};

function initializeSaveState(productId: string): boolean {
  try {
    const saved = localStorage.getItem(SAVED_PRODUCTS_STORAGE_KEY);
    const savedIds = saved ? JSON.parse(saved) : [];
    return savedIds.includes(productId);
  } catch {
    return false;
  }
}

export default function SaveButton({ productId, className = '' }: SaveButtonProps) {
  const [isSaved, setIsSaved] = useState(() => initializeSaveState(productId));

  // Listen for storage changes and custom events
  useEffect(() => {
    const handleStorageChange = () => {
      setIsSaved(initializeSaveState(productId));
    };

    const handleSavedProductsChanged = () => {
      setIsSaved(initializeSaveState(productId));
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(SAVED_PRODUCTS_CHANGE_EVENT, handleSavedProductsChanged);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(SAVED_PRODUCTS_CHANGE_EVENT, handleSavedProductsChanged);
    };
  }, [productId]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const saved = localStorage.getItem(SAVED_PRODUCTS_STORAGE_KEY);
      let savedIds = saved ? JSON.parse(saved) : [];

      if (isSaved) {
        savedIds = savedIds.filter((id: string) => id !== productId);
      } else {
        savedIds.push(productId);
      }

      localStorage.setItem(SAVED_PRODUCTS_STORAGE_KEY, JSON.stringify(savedIds));
      setIsSaved(!isSaved);

      // Dispatch custom event for badge update
      window.dispatchEvent(
        new CustomEvent(SAVED_PRODUCTS_CHANGE_EVENT, { detail: { savedIds } })
      );
    } catch {
      // Silent fail
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`w-7 h-7 rounded-full bg-white/90 flex items-center justify-center transition ${
        isSaved ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
      } ${className}`}
      aria-label="Simpan produk"
      type="button"
    >
      <Heart
        size={16}
        fill={isSaved ? 'currentColor' : 'none'}
        strokeWidth={2}
      />
    </button>
  );
}
