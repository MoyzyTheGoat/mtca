// src/pages/Cart.tsx
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
 * Helper: try to extract friendly message(s) from different API error shapes.
 * But we won't show raw objects; we prefer inline messages.
 */
function formatApiMessage(err: any): string {
  if (!err) return "Request failed";
  const data = err?.response?.data ?? err;
  if (typeof data === "string") return data;
  if (data?.detail && typeof data.detail === "string") return data.detail;
  if (data?.detail && Array.isArray(data.detail)) {
    // a summary for toast only
    const messages = data.detail.map((d: any) => d?.msg ?? JSON.stringify(d));
    return messages.join("; ");
  }
  if (data?.message) return String(data.message);
  return "Request failed";
}

/**
 * Parse FastAPI/Pydantic validation errors (array of objects with loc/msg/...)
 * and return a map from item index (body.N) to friendly message.
 */
function parseValidationErrors(detail: any[]): Record<number, string> {
  const map: Record<number, string> = {};
  if (!Array.isArray(detail)) return map;

  for (const err of detail) {
    if (!err) continue;
    const loc = err.loc;
    const msg = err.msg || (err.message ? err.message : JSON.stringify(err));
    // typical loc shapes: ["body", 2, "quantity"] or ["body", 0, "product_id"]
    if (Array.isArray(loc) && loc.length >= 2 && (loc[0] === "body" || loc[0] === "items")) {
      const maybeIndex = loc[1];
      const idx = typeof maybeIndex === "number" ? maybeIndex : parseInt(maybeIndex, 10);
      if (!Number.isNaN(idx)) {
        // map to index for now; the caller will map index->productId
        map[idx] = msg;
        continue;
      }
    }
    // fallback: put at -1 to indicate general error
    map[-1] = msg;
  }
  return map;
}

const Cart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [rawInputs, setRawInputs] = useState<Record<number, string>>({});
  const [errors, setErrors] = useState<Record<number, string>>({}); // productId -> message
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const commitTimers = useRef<Record<number, number | null>>({});

  useEffect(() => {
    loadCart();
  }, []);

  useEffect(() => {
    const map: Record<number, string> = {};
    cart.forEach((item) => {
      map[item.product.id] = String(item.quantity);
    });
    setRawInputs(map);
    // clear errors for items that were removed
    setErrors((prev) => {
      const next: Record<number, string> = {};
      for (const key of Object.keys(prev)) {
        const pid = Number(key);
        if (cart.find((c) => c.product.id === pid)) next[pid] = prev[pid];
      }
      return next;
    });
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

  const handleRawInputChange = (productId: number, value: string) => {
    setRawInputs((prev) => ({ ...prev, [productId]: value }));
    // clear inline error while typing to avoid flicker — will revalidate on commit
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  const commitQuantity = (productId: number) => {
    const raw = rawInputs[productId] ?? "";
    const cleaned = raw.replace(/[^\d]/g, "");
    let parsed = parseInt(cleaned, 10);
    if (Number.isNaN(parsed) || parsed < 1) parsed = 1;

    const idx = cart.findIndex((c) => c.product.id === productId);
    if (idx === -1) {
      setRawInputs((prev) => ({ ...prev, [productId]: String(parsed) }));
      return;
    }

    const availableStock = Number(cart[idx].product.quantity ?? Infinity);

    // reset previous error for this row
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });

    if (availableStock !== Infinity && parsed > availableStock) {
      // clamp and show inline message (no raw object toast)
      parsed = availableStock;
      setErrors((prev) => ({
        ...prev,
        [productId]: `Only ${availableStock} available — quantity adjusted.`,
      }));
    }

    const updated = cart.map((c, i) => (i === idx ? { ...c, quantity: parsed } : c));
    saveCart(updated);
    setRawInputs((prev) => ({ ...prev, [productId]: String(parsed) }));
  };

  const handleQuantityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, productId: number) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
      commitQuantity(productId);
    }
    if (e.key === "Escape") {
      const item = cart.find((c) => c.product.id === productId);
      setRawInputs((prev) => ({ ...prev, [productId]: item ? String(item.quantity) : "1" }));
      (e.target as HTMLInputElement).blur();
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });
    }
  };

  const removeItem = (productId: number) => {
    const updatedCart = cart.filter((item) => item.product.id !== productId);
    saveCart(updatedCart);
    setRawInputs((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
    toast.info("Item removed from cart");
  };

  const calculateTotal = () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const hasErrors = () => {
    // any inline errors or quantity mismatches
    if (Object.values(errors).some(Boolean)) return true;
    for (const item of cart) {
      const avail = Number(item.product.quantity ?? Infinity);
      if (avail !== Infinity && item.quantity > avail) return true;
      if (!Number.isFinite(item.quantity) || item.quantity < 1) return true;
    }
    return false;
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    // Re-run client-side validations: clamp or mark errors
    const checked: CartItem[] = [...cart];
    const newErrors: Record<number, string> = {};
    for (let i = 0; i < checked.length; i++) {
      const it = checked[i];
      const avail = Number(it.product.quantity ?? Infinity);
      if (!Number.isFinite(it.quantity) || it.quantity < 1) {
        newErrors[it.product.id] = "Quantity must be at least 1";
      } else if (avail !== Infinity && it.quantity > avail) {
        newErrors[it.product.id] = `Only ${avail} available`;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix highlighted quantities before checkout");
      return;
    }

    setIsLoading(true);

    try {
      const orderItems = cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      }));

      const response = await api.post<OrderResponse>("/orders/", orderItems);

      localStorage.removeItem("cart");
      setCart([]);
      setRawInputs({});
      setErrors({});

      const pickupCode = response.data.code;
      toast.success(`Order placed — pickup code: ${pickupCode}`);
      navigate(`/pickup?code=${pickupCode}`);
    } catch (err: any) {
      // Try to extract validation errors and show inline messages instead of raw toast object
      const detail = err?.response?.data?.detail;
      if (Array.isArray(detail)) {
        const byIndex = parseValidationErrors(detail); // idx -> message
        // Map index -> productId using the same order we sent
        const indexToPidMap: Record<number, number> = {};
        cart.forEach((c, idx) => {
          indexToPidMap[idx] = c.product.id;
        });

        const inlineErrors: Record<number, string> = {};
        for (const [idxStr, msg] of Object.entries(byIndex)) {
          const idx = Number(idxStr);
          if (idx >= 0 && indexToPidMap[idx] !== undefined) {
            inlineErrors[indexToPidMap[idx]] = msg;
          } else {
            // general error; put a top-level toast-friendly message (but not the raw object)
            inlineErrors[-1] = msg;
          }
        }

        // set per-product inline messages (ignore any -1 here; show toast instead)
        const productErrors: Record<number, string> = {};
        for (const [pidStr, msg] of Object.entries(inlineErrors)) {
          const pid = Number(pidStr);
          if (pid === -1) continue;
          productErrors[pid] = msg;
        }
        setErrors(productErrors);

        // if there was an unclassified error, show a friendly toast
        if (inlineErrors[-1]) {
          toast.error(String(inlineErrors[-1]));
        } else {
          toast.error("Please fix highlighted fields and try again");
        }
      } else {
        // Generic fallback: friendly toast (no raw object)
        const friendly = formatApiMessage(err);
        toast.error(friendly || "Failed to place order");
      }
      console.error("Checkout error:", err);
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
                  {cart.map((item) => {
                    const pid = item.product.id;
                    const inputError = errors[pid];
                    return (
                      <div
                        key={pid}
                        className="flex items-center justify-between border-b pb-4 last:border-0"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.product.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.product.description}</p>
                          <p className="mt-1 font-medium text-primary">₦{item.product.price.toFixed(2)}</p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-end">
                            <Input
                              type="text"
                              inputMode="numeric"
                              pattern="\d*"
                              value={rawInputs[pid] ?? String(item.quantity)}
                              onChange={(e) => handleRawInputChange(pid, e.target.value)}
                              onBlur={() => commitQuantity(pid)}
                              onKeyDown={(e) => handleQuantityKeyDown(e, pid)}
                              className={`w-24 text-center ${inputError ? "border-red-500 ring-red-200" : ""}`}
                              aria-label={`Quantity for ${item.product.name}`}
                            />
                            {inputError && (
                              <p className="mt-1 text-xs text-red-600 text-right max-w-xs">
                                {inputError}
                              </p>
                            )}
                          </div>

                          <Button variant="ghost" size="icon" onClick={() => removeItem(pid)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
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

                  <Button
                    className="w-full"
                    onClick={handleCheckout}
                    disabled={isLoading || hasErrors()}
                    title={hasErrors() ? "Fix highlighted fields before checkout" : undefined}
                  >
                    {isLoading ? "Processing..." : "Checkout"}
                  </Button>

                  {hasErrors() && (
                    <p className="mt-2 text-sm text-red-600">
                      Fix highlighted quantities above before continuing.
                    </p>
                  )}
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
