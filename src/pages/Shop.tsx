import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Plus, Minus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const products = [
  { id: 1, name: "Herbal Health Capsules", retail: 850, distributor: 620, rating: 4.5, image: "💊", category: "Health" },
  { id: 2, name: "Organic Face Cream", retail: 1200, distributor: 880, rating: 4.8, image: "🧴", category: "Beauty" },
  { id: 3, name: "Protein Power Shake", retail: 1500, distributor: 1100, rating: 4.3, image: "🥤", category: "Nutrition" },
  { id: 4, name: "Essential Oil Set", retail: 990, distributor: 720, rating: 4.7, image: "🌿", category: "Wellness" },
  { id: 5, name: "Immunity Booster Pack", retail: 1350, distributor: 980, rating: 4.6, image: "💪", category: "Health" },
  { id: 6, name: "Hair Growth Serum", retail: 1100, distributor: 800, rating: 4.4, image: "✨", category: "Beauty" },
  { id: 7, name: "Multivitamin Tablets", retail: 750, distributor: 540, rating: 4.2, image: "💎", category: "Health" },
  { id: 8, name: "Aloe Vera Gel Pack", retail: 650, distributor: 470, rating: 4.9, image: "🌱", category: "Wellness" },
];

type CartItem = { id: number; qty: number };

const Shop = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [filter, setFilter] = useState("All");

  const categories = ["All", ...new Set(products.map((p) => p.category))];

  const filtered = filter === "All" ? products : products.filter((p) => p.category === filter);

  const addToCart = (id: number) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === id);
      if (existing) return prev.map((c) => (c.id === id ? { ...c, qty: c.qty + 1 } : c));
      return [...prev, { id, qty: 1 }];
    });
  };

  const totalItems = cart.reduce((sum, c) => sum + c.qty, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container px-4 pt-24 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Shop Products</h1>
            <p className="text-sm text-muted-foreground mt-1">Quality products at distributor prices</p>
          </div>
          <Button variant="outline" className="relative border-border">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Cart
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                filter === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl bg-card border border-border overflow-hidden group hover:border-primary/30 transition-colors"
            >
              <div className="h-40 bg-secondary flex items-center justify-center text-5xl">
                {product.image}
              </div>
              <div className="p-4">
                <div className="text-xs text-muted-foreground mb-1">{product.category}</div>
                <h3 className="font-display font-semibold text-foreground text-sm mb-2">{product.name}</h3>
                <div className="flex items-center gap-1 mb-3">
                  <Star className="h-3 w-3 text-primary fill-primary" />
                  <span className="text-xs text-muted-foreground">{product.rating}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-display font-bold text-primary">₹{product.distributor}</div>
                    <div className="text-xs text-muted-foreground line-through">₹{product.retail}</div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addToCart(product.id)}
                    className="bg-gradient-gold text-primary-foreground hover:opacity-90"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Shop;
