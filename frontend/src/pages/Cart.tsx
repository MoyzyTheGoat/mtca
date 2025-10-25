import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axios';
import { CartItem, OrderResponse } from '@/types';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

const Cart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

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

  const updateQuantity = (productId: number, delta: number) => {
    const updatedCart = cart
      .map((item) =>
        item.product.id === productId
          ? { ...item, quantity: item.quantity + delta }
          : item
      )
      .filter((item) => item.quantity > 0);

    saveCart(updatedCart);
  };

  const removeItem = (productId: number) => {
    const updatedCart = cart.filter((item) => item.product.id !== productId);
    saveCart(updatedCart);
    toast.info('Item removed from cart');
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsLoading(true);

    try {
      // Send array of items to match backend `create_orders`
      const orderItems = cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      }));

      const response = await api.post<OrderResponse>('/orders/', orderItems);

      localStorage.removeItem('cart');
      setCart([]);

      // ✅ The backend returns a list of order responses, all with the same code
      const pickupCode = response.data.code;

      toast.success(`Order placed! Your pickup code is: ${pickupCode}`);
      navigate(`/pickup?code=${pickupCode}`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to place order');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-4xl font-bold text-foreground">Shopping Cart</h1>

        {cart.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <ShoppingBag className="mb-4 h-16 w-16 text-muted-foreground" />
              <p className="mb-4 text-xl text-muted-foreground">Your cart is empty</p>
              <Button onClick={() => navigate('/')}>Continue Shopping</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Items ({cart.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.product.name}</h3>
                        <p className="text-sm text-muted-foreground">{item.product.description}</p>
                        <p className="mt-1 font-medium text-primary">
                          ${item.product.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.product.id, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.product.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.product.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.product.name} x{item.quantity}
                        </span>
                        <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleCheckout} disabled={isLoading}>
                    {isLoading ? 'Processing...' : 'Checkout'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;
