import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/axios";
import { CartItem, OrderResponse } from "@/types";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

/**
 * Cart component:
 * - Allows typing any value into quantity inputs (raw string state)
 * - Commits quantity on blur or Enter keypress (parses, clamps to stock)
 * - If typed quantity > available stock -> clamps to stock and shows toast
 * - Saves to localStorage on commit
 */
const Cart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  // rawInputs holds the free-typing string values per product id
  const [rawInputs, setRawInputs] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const commitTimers = useRef<Record<number, number | null>>({}); // optional debounce if you want

  useEffect(() => {
    loadCart();
  }, []);

  // whenever cart changes, sync rawInputs so inputs reflect current quantities
  useEffect(() => {
    const map: Record<number, string> = {};
    cart.forEach((item) => {
      map[item.product.id] = String(item.quantity);
    });
    setRawInputs(map);
  }, [cart]);

  const loadCart = () => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        const parsed: CartItem[] = JSON.parse(savedCart);
        setCart(parsed);
      } catch {
        setCart([]);
      }
    }
  };

  const saveCart = (updatedCart: CartItem[]) => {
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setCart(updatedCart);
  };

  // update the raw string as user types — allows typing without selecting existing text
  const handleRawInputChange = (productId: number, value: string) => {
    setRawInputs((prev) => ({ ...prev, [productId]: value }));

    // OPTIONAL: debounce auto-commit while typing (commented out)
    // if (commitTimers.current[productId]) window.clearTimeout(commitTimers.current[productId]!);
    // commitTimers.current[productId] = window.setTimeout(() => commitQuantity(productId), 1000);
  };

  // Commit the typed value into the cart (on blur or Enter)
  const commitQuantity = (productId: number) => {
    const raw = rawInputs[productId];
    // parse int, allow commas/spaces etc by removing non-digits
    const cleaned = (raw || "").replace(/[^\d]/g, "");
    let parsed = parseInt(cleaned, 10);
    if (Number.isNaN(parsed) || parsed < 1) parsed = 1;

    // find the cart item
    const idx = cart.findIndex((c) => c.product.id === productId);
    if (idx === -1) {
      // nothing to commit
      setRawInputs((prev) => ({ ...prev, [productId]: String(parsed) }));
      return;
    }

    const availableStock = Number(cart[idx].product.quantity ?? Infinity);

    if (availableStock !== Infinity && parsed > availableStock) {
      toast.error(
        `Only ${availableStock} unit${availableStock === 1 ? "" : "s"} available. Quantity set to ${availableStock}.`
      );
      parsed = availableStock;
    }

    // update cart
    const updated = cart.map((c, i) => (i === idx ? { ...c, quantity: parsed } : c));
    saveCart(updated);

    // sync raw input to committed value
    setRawInputs((prev) => ({ ...prev, [productId]: String(parsed) }));
  };

  const handleQuantityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, productId: number) => {
    if (e.key === "Enter") {
      // commit on Enter
      (e.target as HTMLInputElement).blur(); // triggers onBlur as well
      commitQuantity(productId);
    }
    if (e.key === "Escape") {
      // reset to last committed value
      const item = cart.find((c) => c.product.id === productId);
      setRawInputs((prev) => ({ ...prev, [productId]: item ? String(item.quantity) : "1" }));
      (e.target as HTMLInputElement).blur();
    }
  };

  const removeItem = (productId: number) => {
    const updatedCart = cart.filter((item) => item.product.id !== productId);
    saveCart(updatedCart);
    // clean up raw input
    setRawInputs((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
    toast.info("Item removed from cart");
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsLoading(true);

    try {
      // Send array of items to match backend `create_orders`
      const orderItems = cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      }));

      const response = await api.post<OrderResponse>("/orders/", orderItems);

      localStorage.removeItem("cart");
      setCart([]);
      setRawInputs({});

      // backend returns a code
      const pickupCode = response.data.code;

      toast.success(`Order placed! Your pickup code is: ${pickupCode}`);
      navigate(`/pickup?code=${pickupCode}`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to place order");
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
              <Button onClick={() => navigate("/")}>Continue Shopping</Button>
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
                        <p className="mt-1 font-medium text-primary">₦{item.product.price.toFixed(2)}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* numeric input for quantity — raw string allows free typing */}
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="\d*"
                            value={rawInputs[item.product.id] ?? String(item.quantity)}
                            onChange={(e) => handleRawInputChange(item.product.id, e.target.value)}
                            onBlur={() => commitQuantity(item.product.id)}
                            onKeyDown={(e) => handleQuantityKeyDown(e, item.product.id)}
                            className="w-24 text-center"
                            aria-label={`Quantity for ${item.product.name}`}
                          />
                        </div>

                        <Button variant="ghost" size="icon" onClick={() => removeItem(item.product.id)}>
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
                        <span>₦{(item.product.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">₦{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleCheckout} disabled={isLoading}>
                    {isLoading ? "Processing..." : "Checkout"}
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
