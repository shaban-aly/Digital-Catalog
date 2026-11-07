import { useState, useEffect, useCallback } from 'react';
import type { CartItemType } from '../../shared/schemas.ts';

export const CART_EXPIRATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours

export function isCartExpired(updatedAt?: string): boolean {
  if (!updatedAt) return false;
  const time = new Date(updatedAt).getTime();
  if (isNaN(time)) return false;
  return Date.now() - time > CART_EXPIRATION_TTL_MS;
}

export function getCartStorageKey(storeSlug: string): string {
  return `digital_menu_cart_${storeSlug.toLowerCase().trim()}`;
}

export function generateCartItemId(
  productId: string,
  variantId?: string,
  selectedOptions?: Array<{ groupId: string; valueId: string }>
): string {
  const optionsKey = (selectedOptions || [])
    .map((o) => `${o.groupId}:${o.valueId}`)
    .sort()
    .join('|');
  return `${productId}_${variantId || 'base'}_${optionsKey}`;
}

export interface CatalogProductSyncItem {
  id: string;
  price?: number;
  effective_price?: number;
  is_available?: boolean;
}

export function syncCartItems(
  items: CartItemType[],
  catalogProducts: CatalogProductSyncItem[]
): { updatedItems: CartItemType[]; hasChanges: boolean } {
  let hasChanges = false;
  const productMap = new Map(catalogProducts.map((p) => [p.id, p]));

  const updatedItems = items.map((item) => {
    const catalogProd = productMap.get(item.productId);
    if (!catalogProd) {
      if (item.isAvailable !== false) {
        hasChanges = true;
        return { ...item, isAvailable: false };
      }
      return item;
    }

    let isAvailable = catalogProd.is_available !== false;
    let unitPrice = item.unitPrice;
    let priceChanged = item.priceChanged;

    let itemChanged = false;
    if (item.isAvailable !== isAvailable) {
      itemChanged = true;
    }

    // Auto-update base item price if it has changed in active catalog
    if (!item.variantId && (!item.selectedOptions || item.selectedOptions.length === 0)) {
      const newPrice = catalogProd.effective_price ?? catalogProd.price;
      if (newPrice !== undefined && newPrice !== item.unitPrice) {
        unitPrice = newPrice;
        priceChanged = true;
        itemChanged = true;
      }
    }

    if (itemChanged) {
      hasChanges = true;
      return {
        ...item,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
        isAvailable,
        priceChanged,
      };
    }

    return item;
  });

  return { updatedItems, hasChanges };
}

export interface UseCartReturn {
  items: CartItemType[];
  isLoaded: boolean;
  totalQuantity: number;
  totalAmount: number;
  customerName: string;
  fulfillmentNotes: string;
  orderSubmitted: boolean;
  hasOutOfStockItems: boolean;
  addItem: (item: Omit<CartItemType, 'id' | 'lineTotal'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setCustomerName: (name: string) => void;
  setFulfillmentNotes: (notes: string) => void;
  setOrderSubmitted: (submitted: boolean) => void;
  syncWithCatalog: (products: CatalogProductSyncItem[]) => void;
}

export function useCart(storeSlug: string): UseCartReturn {
  const storageKey = getCartStorageKey(storeSlug);

  const [items, setItems] = useState<CartItemType[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [fulfillmentNotes, setFulfillmentNotes] = useState<string>('');
  const [orderSubmitted, setOrderSubmitted] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount with 24-hour TTL check
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (isCartExpired(parsed.updatedAt)) {
          // Stale cart expired after 24 hours: auto-purge
          localStorage.removeItem(storageKey);
          setItems([]);
          setCustomerName('');
          setFulfillmentNotes('');
          setOrderSubmitted(false);
        } else {
          if (Array.isArray(parsed.items)) {
            setItems(parsed.items);
          }
          if (typeof parsed.customerName === 'string') {
            setCustomerName(parsed.customerName);
          }
          if (typeof parsed.fulfillmentNotes === 'string') {
            setFulfillmentNotes(parsed.fulfillmentNotes);
          }
          if (typeof parsed.orderSubmitted === 'boolean') {
            setOrderSubmitted(parsed.orderSubmitted);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load cart from localStorage:', err);
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey]);

  // Persist to localStorage on change
  const persist = useCallback(
    (newItems: CartItemType[], newName: string, newNotes: string, submitted: boolean) => {
      if (typeof window === 'undefined') return;
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            items: newItems,
            customerName: newName,
            fulfillmentNotes: newNotes,
            orderSubmitted: submitted,
            updatedAt: new Date().toISOString(),
          })
        );
      } catch (err) {
        console.warn('Failed to save cart to localStorage:', err);
      }
    },
    [storageKey]
  );

  const addItem = useCallback(
    (itemInput: Omit<CartItemType, 'id' | 'lineTotal'>) => {
      const id = generateCartItemId(
        itemInput.productId,
        itemInput.variantId,
        itemInput.selectedOptions
      );

      setItems((prev) => {
        const existingIndex = prev.findIndex((i) => i.id === id);
        let updated: CartItemType[];

        if (existingIndex > -1) {
          const existing = prev[existingIndex];
          const newQty = existing.quantity + itemInput.quantity;
          const updatedItem: CartItemType = {
            ...existing,
            quantity: newQty,
            lineTotal: existing.unitPrice * newQty,
          };
          updated = [...prev];
          updated[existingIndex] = updatedItem;
        } else {
          const newItem: CartItemType = {
            ...itemInput,
            id,
            lineTotal: itemInput.unitPrice * itemInput.quantity,
            isAvailable: true,
          };
          updated = [...prev, newItem];
        }

        setOrderSubmitted(false);
        persist(updated, customerName, fulfillmentNotes, false);
        return updated;
      });
    },
    [customerName, fulfillmentNotes, persist]
  );

  const updateQuantity = useCallback(
    (itemId: string, quantity: number) => {
      setItems((prev) => {
        let updated: CartItemType[];
        if (quantity <= 0) {
          updated = prev.filter((i) => i.id !== itemId);
        } else {
          updated = prev.map((i) =>
            i.id === itemId
              ? { ...i, quantity, lineTotal: i.unitPrice * quantity }
              : i
          );
        }
        setOrderSubmitted(false);
        persist(updated, customerName, fulfillmentNotes, false);
        return updated;
      });
    },
    [customerName, fulfillmentNotes, persist]
  );

  const removeItem = useCallback(
    (itemId: string) => {
      setItems((prev) => {
        const updated = prev.filter((i) => i.id !== itemId);
        setOrderSubmitted(false);
        persist(updated, customerName, fulfillmentNotes, false);
        return updated;
      });
    },
    [customerName, fulfillmentNotes, persist]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    setCustomerName('');
    setFulfillmentNotes('');
    setOrderSubmitted(false);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey);
      } catch (err) {
        // Ignored
      }
    }
  }, [storageKey]);

  const handleSetCustomerName = useCallback(
    (name: string) => {
      setCustomerName(name);
      persist(items, name, fulfillmentNotes, orderSubmitted);
    },
    [items, fulfillmentNotes, orderSubmitted, persist]
  );

  const handleSetFulfillmentNotes = useCallback(
    (notes: string) => {
      setFulfillmentNotes(notes);
      persist(items, customerName, notes, orderSubmitted);
    },
    [items, customerName, orderSubmitted, persist]
  );

  const handleSetOrderSubmitted = useCallback(
    (submitted: boolean) => {
      setOrderSubmitted(submitted);
      persist(items, customerName, fulfillmentNotes, submitted);
    },
    [items, customerName, fulfillmentNotes, persist]
  );

  const syncWithCatalog = useCallback(
    (products: CatalogProductSyncItem[]) => {
      setItems((prev) => {
        if (prev.length === 0) return prev;
        const { updatedItems, hasChanges } = syncCartItems(prev, products);
        if (hasChanges) {
          persist(updatedItems, customerName, fulfillmentNotes, orderSubmitted);
          return updatedItems;
        }
        return prev;
      });
    },
    [customerName, fulfillmentNotes, orderSubmitted, persist]
  );

  const totalQuantity = items.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalAmount = items.reduce((acc, curr) => acc + curr.lineTotal, 0);
  const hasOutOfStockItems = items.some((i) => i.isAvailable === false);

  return {
    items,
    isLoaded,
    totalQuantity,
    totalAmount,
    customerName,
    fulfillmentNotes,
    orderSubmitted,
    hasOutOfStockItems,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setCustomerName: handleSetCustomerName,
    setFulfillmentNotes: handleSetFulfillmentNotes,
    setOrderSubmitted: handleSetOrderSubmitted,
    syncWithCatalog,
  };
}
