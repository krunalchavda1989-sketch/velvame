import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type CartItem = { id: string; qty: number };

interface Product {
  id: string;
  name: string;
  category: string;
  distributor_price: number;
  retail_price: number;
  image_url: string | null;
  stock: number;
  rating: number | null;
  active: boolean;
  description: string | null;
}

interface CartContextType {
  cart: CartItem[];
  products: Product[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (id: string, qty?: number) => void;
  updateQty: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  cartProducts: (Product & { qty: number })[];
  isMember: boolean;
  getPrice: (product: Product) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useAuth();
  const isMember = !!profile?.subscription_paid;

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Fetch all active products once
  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("created_at");
      setProducts((data as Product[]) || []);
    };
    fetchProducts();
  }, []);

  const getPrice = (product: Product) => {
    return isMember ? product.distributor_price : product.retail_price;
  };

  const addToCart = (id: string, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === id);
      if (existing) return prev.map((c) => (c.id === id ? { ...c, qty: c.qty + qty } : c));
      return [...prev, { id, qty }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0)
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  };

  const clearCart = () => setCart([]);

  const cartProducts = cart
    .map((c) => {
      const product = products.find((p) => p.id === c.id);
      return product ? { ...product, qty: c.qty } : null;
    })
    .filter(Boolean) as (Product & { qty: number })[];

  const totalItems = cart.length;
  const totalPrice = cartProducts.reduce((sum, p) => sum + getPrice(p) * p.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        products,
        cartOpen,
        setCartOpen,
        addToCart,
        updateQty,
        removeItem,
        clearCart,
        totalItems,
        totalPrice,
        cartProducts,
        isMember,
        getPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
