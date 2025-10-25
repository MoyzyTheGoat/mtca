import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/api/axios';
import { Product, CartItem } from '@/types';
import ProductCard from '@/components/ProductCard';
import Navbar from '@/components/Navbar';
import { toast } from 'sonner';

const Home = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(''); // 🔍 Search term state
  const { isAuthenticated, isAdmin } = useAuth();

  useEffect(() => {
    fetchProducts();
    loadCart();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get<Product[]>('/products/');
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const loadCart = () => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  const saveCart = (updatedCart: CartItem[]) => {
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    setCart(updatedCart);
  };

  const handleAddToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);

    if (existingItem) {
      const updatedCart = cart.map((item) =>
        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
      saveCart(updatedCart);
    } else {
      saveCart([...cart, { product, quantity: 1 }]);
    }

    toast.success(`${product.name} added to cart!`);
  };

  // 🔍 Filter products by search term
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto flex min-h-[calc(100vh-80px)] items-center justify-center px-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {/* Header and Search Bar */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Fresh Products</h1>
            <p className="mt-2 text-muted-foreground">
              Browse our selection of quality products
            </p>
          </div>

          {/* 🔍 Search Input */}
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Products Display */}
        {filteredProducts.length === 0 ? (
          <div className="rounded-lg bg-muted/50 p-8 text-center">
            <p className="text-muted-foreground">No products found.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                showAddButton={isAuthenticated && !isAdmin}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
