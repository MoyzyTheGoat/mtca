import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "@/api/axios";
import { OrderDetail } from "@/types";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

const Pickup = () => {
  const [searchParams] = useSearchParams();
  const [orderCode, setOrderCode] = useState(searchParams.get("code") || "");
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      setOrderCode(code);
      fetchOrder(code);
    }
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
      toast.error(error.response?.data?.detail || "Order not found");
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(orderCode);
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
                    onChange={(e) =>
                      setOrderCode(e.target.value.toUpperCase())
                    }
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
                <div className="mt-2 text-sm text-muted-foreground">
                  Pickup Code:{" "}
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
                      ₦{order.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg bg-primary/10 p-4 text-center">
                  <p className="text-sm font-medium text-primary">
                    Please present this code at pickup counter
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
