// src/pages/Pickup.tsx
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "@/api/axios";
import { OrderDetail } from "@/types";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, CheckCircle, XCircle, Copy } from "lucide-react";
import { toast } from "sonner";

const Pickup = () => {
  const [searchParams] = useSearchParams();
  const [orderCode, setOrderCode] = useState(searchParams.get("code") || "");
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      setOrderCode(code);
      fetchOrder(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchOrder = async (code: string) => {
    if (!code.trim()) {
      toast.error("Please enter a pickup code");
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.get<OrderDetail>(`/orders/${code}`);
      setOrder(response.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Order not found");
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(orderCode);
  };

  const copyToClipboard = async (text?: string) => {
    const toCopy = text ?? order?.code ?? "";
    if (!toCopy) {
      toast.error("Nothing to copy");
      return;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(toCopy);
      } else {
        // fallback: create temporary textarea
        const ta = document.createElement("textarea");
        ta.value = toCopy;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      toast.success("Pickup code copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Copy failed", err);
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground">Order Pickup</h1>
            <p className="mt-2 text-muted-foreground">
              Enter your pickup code to view order details
            </p>
          </div>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Pickup Code</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="Enter your 6-character code"
                    value={orderCode}
                    onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Searching..." : "View Order"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {order && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-6 w-6 text-primary" />
                    <CardTitle>Order Details</CardTitle>
                  </div>

                  {order.collected ? (
                    <div className="flex items-center text-green-600 font-medium">
                      <CheckCircle className="h-5 w-5 mr-1" /> Collected
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600 font-medium">
                      <XCircle className="h-5 w-5 mr-1" /> Not Collected
                    </div>
                  )}
                </div>

                {/* Prominent, copyable pickup code area */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1">
                    <div
                      role="status"
                      aria-live="polite"
                      className="inline-flex items-center gap-3"
                    >
                      <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
                        <div className="text-xs text-muted-foreground mb-1">Pickup Code</div>
                        <div className="font-mono text-3xl sm:text-4xl font-semibold tracking-wider text-primary select-all">
                          {order.code}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => copyToClipboard(order.code)}
                      className="flex items-center gap-2"
                      aria-label="Copy pickup code"
                    >
                      <Copy className="h-4 w-4" />
                      {copied ? "Copied" : "Copy Code"}
                    </Button>

                    <button
                      type="button"
                      onClick={() => {
                        // Also put code into the clipboard via copy helper
                        copyToClipboard(order.code);
                      }}
                      className="inline-flex items-center px-3 py-2 border rounded-md text-sm bg-white hover:bg-gray-50"
                      aria-label="Select and copy code input"
                    >
                      <span className="sr-only">Select code</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M8 2a2 2 0 00-2 2v1H5a2 2 0 00-2 2v7a2 2 0 002 2h7a2 2 0 002-2v-1h1a2 2 0 002-2V8l-5-5H8z" />
                      </svg>
                      <span className="font-mono text-sm">{order.code}</span>
                    </button>
                  </div>
                </div>

                <div className="mt-2 text-sm text-muted-foreground">
                  <span>Pickup Code: </span>
                  <span className="font-mono text-primary">{order.code}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between border-b pb-2 last:border-0"
                    >
                      <span className="text-muted-foreground">
                        {item.product_name} x{item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-primary">
                      ₦{(order.total ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg bg-primary/10 p-4 text-center">
                  <p className="text-sm font-medium text-primary">
                    Please present this code at the pickup counter.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Tip: Tap <strong>Copy Code</strong> to quickly give the code to the admin.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Pickup;
