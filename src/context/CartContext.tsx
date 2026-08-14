"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/*
 * `id` ist der Warenkorb-Zeilen-Schlüssel: für Stück-Käufe die reine
 * productId, für Karton-Käufe `${productId}::CARTON` — damit landen
 * Stück- und Karton-Käufe desselben Produkts in getrennten Zeilen
 * statt zusammengeführt zu werden. `productId` ist immer die echte
 * Produkt-ID, unabhängig vom Warenkorb-Schlüssel.
 */
export type CartUnit = "PIECE" | "CARTON";

export type CartItem = {
  id: string;
  productId: string;
  unit: CartUnit;
  unitsPerCarton?: number;
  name: string;
  price: number;
  pfandAmount: number;
  image: string;
  packageInfo: string;
  quantity: number;
};

export type PfandCartItem = {
  id: string;
  name: string;
  quantity: number;
  unitAmount: number;
};

type CartContextValue = {
  items: CartItem[];
  pfandItems: PfandCartItem[];
  totalItems: number;
  productSubtotal: number;
  productPfandTotal: number;
  subtotal: number;
  pfandReturnTotal: number;

  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;

  increaseQuantity: (id: string) => void;

  decreaseQuantity: (id: string) => void;

  setItemQuantity: (id: string, quantity: number) => void;

  removeFromCart: (id: string) => void;

  addPfandItem: (item: Omit<PfandCartItem, "id">) => void;

  updatePfandItem: (id: string, item: Omit<PfandCartItem, "id">) => void;

  removePfandItem: (id: string) => void;

  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

type CartProviderProps = {
  children: ReactNode;
};

function createPfandId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `pfand-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);

  const [pfandItems, setPfandItems] = useState<PfandCartItem[]>([]);

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem("paketmarket-cart");

    const savedPfand = localStorage.getItem("paketmarket-pfand");

    if (savedCart) {
      try {
        const parsedItems = JSON.parse(savedCart);

        setItems(
          Array.isArray(parsedItems)
            ? parsedItems.map((item) => ({
                ...item,
                productId: item.productId || item.id,
                unit: item.unit === "CARTON" ? "CARTON" : "PIECE",
                price: Number(item.price || 0),
                pfandAmount: Number(item.pfandAmount || 0),
                quantity: Number(item.quantity || 0),
              }))
            : [],
        );
      } catch {
        localStorage.removeItem("paketmarket-cart");
      }
    }

    if (savedPfand) {
      try {
        setPfandItems(JSON.parse(savedPfand));
      } catch {
        localStorage.removeItem("paketmarket-pfand");
      }
    }

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    localStorage.setItem("paketmarket-cart", JSON.stringify(items));

    localStorage.setItem("paketmarket-pfand", JSON.stringify(pfandItems));
  }, [items, pfandItems, isLoaded]);

  function addToCart(item: Omit<CartItem, "quantity">, quantity = 1) {
    setItems((currentItems) => {
      const existingItem = currentItems.find(
        (currentItem) => currentItem.id === item.id,
      );

      if (existingItem) {
        return currentItems.map((currentItem) =>
          currentItem.id === item.id
            ? {
                ...currentItem,
                ...item,
                quantity: currentItem.quantity + quantity,
              }
            : currentItem,
        );
      }

      return [
        ...currentItems,
        {
          ...item,
          quantity,
        },
      ];
    });
  }

  function increaseQuantity(id: string) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item,
      ),
    );
  }

  function decreaseQuantity(id: string) {
    setItems((currentItems) =>
      currentItems
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function setItemQuantity(id: string, quantity: number) {
    const clamped = Math.max(1, Math.floor(quantity) || 1);

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: clamped,
            }
          : item,
      ),
    );
  }

  function removeFromCart(id: string) {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  }

  function addPfandItem(item: Omit<PfandCartItem, "id">) {
    setPfandItems((currentItems) => [
      ...currentItems,
      {
        id: createPfandId(),
        ...item,
      },
    ]);
  }

  function updatePfandItem(id: string, item: Omit<PfandCartItem, "id">) {
    setPfandItems((currentItems) =>
      currentItems.map((currentItem) =>
        currentItem.id === id
          ? {
              id,
              ...item,
            }
          : currentItem,
      ),
    );
  }

  function removePfandItem(id: string) {
    setPfandItems((currentItems) =>
      currentItems.filter((item) => item.id !== id),
    );
  }

  function clearCart() {
    setItems([]);
    setPfandItems([]);
  }

  const totalItems = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items],
  );

  const productSubtotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items],
  );

  const productPfandTotal = useMemo(
    () =>
      items.reduce(
        (total, item) => total + Number(item.pfandAmount || 0) * item.quantity,
        0,
      ),
    [items],
  );

  const subtotal = useMemo(
    () => productSubtotal + productPfandTotal,
    [productSubtotal, productPfandTotal],
  );

  const pfandReturnTotal = useMemo(
    () =>
      pfandItems.reduce(
        (total, item) => total + item.quantity * item.unitAmount,
        0,
      ),
    [pfandItems],
  );

  return (
    <CartContext.Provider
      value={{
        items,
        pfandItems,
        totalItems,
        productSubtotal,
        productPfandTotal,
        subtotal,
        pfandReturnTotal,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        setItemQuantity,
        removeFromCart,
        addPfandItem,
        updatePfandItem,
        removePfandItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
