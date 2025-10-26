import { useState, useEffect, useMemo } from "react";
import api from "@/api/axios";
import { Product, OrderDetail } from "@/types";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle2, Package } from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

type MonthlyStat = {
  month: string;
  revenue: number;
};

type TopProduct = {
  name: string;
  total_sold: number;
  revenue: number;
};

type StatsResponse = {
  total_orders: number;
  total_revenue: number;
  monthly_stats: MonthlyStat[];
  top_products: TopProduct[];
};

const AdminDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [allOrders, setAllOrders] = useState<OrderDetail[]>([]);
  const [orderCode, setOrderCode] = useState("");
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    description: "",
    quantity: "",
    image: null as File | null,
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingAllOrders, setIsLoadingAllOrders] = useState(true);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [updatingOrderCode, setUpdatingOrderCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("products");

  // Stats state
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Query control state
  const [range, setRange] = useState<"day" | "week" | "month" | "year" | "custom" | "">("");
  const [startDate, setStartDate] = useState<string>(""); // YYYY-MM-DD
  const [endDate, setEndDate] = useState<string>(""); // YYYY-MM-DD
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    let interval: number | undefined;

    if (activeTab === "all-orders") {
      fetchAllOrders();
      interval = window.setInterval(fetchAllOrders, 10000);
    }

    if (activeTab === "stats") {
      // when entering stats, fetch current stats with current filters
      fetchStats();
      // refresh stats every 30s while on stats tab
      interval = window.setInterval(() => fetchStats(), 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchProducts = async () => {
    try {
      const response = await api.get<Product[]>("/products/");
      setProducts(response.data);
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchAllOrders = async () => {
    setIsLoadingAllOrders(true);
    try {
      const response = await api.get<OrderDetail[]>("/orders/");
      setAllOrders(response.data);
    } catch (error) {
      console.error("Failed to load orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setIsLoadingAllOrders(false);
    }
  };

  /**
   * Fetch stats from backend using current query control values.
   * - If range is set to day/week/month/year -> pass range param
   * - If range === 'custom' -> require startDate and endDate, pass start_date and end_date
   */
  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const params: Record<string, string> = {};
      if (range && range !== "") {
        params.range = range;
      }
      if (range === "custom") {
        if (!startDate || !endDate) {
          // if custom but missing dates, don't call and show message instead
          toast.error("Please provide a start and end date for custom range.");
          setIsLoadingStats(false);
          return;
        }
        // backend expects ISO-like input; YYYY-MM-DD is accepted by datetime.fromisoformat
        params.start_date = startDate;
        params.end_date = endDate;
      }

      const response = await api.get<StatsResponse>("/stats/", { params });
      setStats(response.data);
    } catch (error: any) {
      console.error("Failed to load stats:", error);
      toast.error(
        error?.response?.data?.detail || "Failed to load statistics. Ensure the /stats/ endpoint exists and auth is set."
      );
      setStats(null);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const applyFilters = async () => {
    // apply current UI filters to stats
    setIsApplyingFilters(true);
    try {
      if (range === "custom") {
        if (!startDate || !endDate) {
          toast.error("Please enter both start and end dates for custom range.");
          return;
        }
        // basic validation: start <= end
        if (new Date(startDate) > new Date(endDate)) {
          toast.error("Start date cannot be after end date.");
          return;
        }
      }
      await fetchStats();
      toast.success("Filters applied");
    } finally {
      setIsApplyingFilters(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const formData = new FormData();
      formData.append("name", newProduct.name);
      formData.append("price", newProduct.price.toString());
      formData.append("quantity", newProduct.quantity.toString());
      formData.append("description", newProduct.description || "");
      if (newProduct.image) {
        formData.append("image", newProduct.image);
      }

      await api.post("/products/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("✅ Product created successfully!");
      setNewProduct({ name: "", price: "", quantity: "", description: "", image: null });
      setPreview(null);
      fetchProducts();
    } catch (error: any) {
      console.error("Upload error:", error.response || error);
      toast.error(error.response?.data?.detail || "❌ Failed to create product");
    } finally {
      setIsCreating(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setNewProduct({ ...newProduct, image: file });
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
    } else {
      setPreview(null);
    }
  };

  const handleSearchOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderCode.trim()) {
      toast.error("Please enter an order code");
      return;
    }

    setIsLoadingOrder(true);
    try {
      const response = await api.get<OrderDetail>(`/orders/${orderCode}`);
      setOrder(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Order not found");
      setOrder(null);
    } finally {
      setIsLoadingOrder(false);
    }
  };

  const handleMarkAsCollected = async (code: string) => {
    setUpdatingOrderCode(code);
    try {
      await api.patch(`/orders/${code}`, { collected: true });
      toast.success("Order marked as collected!");
      await fetchAllOrders();

      if (order?.code === code) {
        const refreshed = await api.get<OrderDetail>(`/orders/${code}`);
        setOrder(refreshed.data);
      }
      // refresh stats as collected orders affect stats
      await fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update order");
    } finally {
      setUpdatingOrderCode(null);
    }
  };

  /**
   * Derive grouped orders from flat allOrders list.
   * Each group:
   *  - code: string
   *  - items: flattened items array from all rows with that code
   *  - total: computed from items (price * qty) when possible, otherwise fallback to sum of row totals
   *  - collected: true if every row for that code is collected
   */
  const groupedOrders = useMemo(() => {
    const map = allOrders.reduce((acc, ord) => {
      const code = ord.code || "UNKNOWN";
      if (!acc[code]) acc[code] = [];
      acc[code].push(ord);
      return acc;
    }, {} as Record<string, OrderDetail[]>);

    const groups = Object.entries(map).map(([code, orders]) => {
      // flatten items
      const items = orders.flatMap((o) => o.items ?? []);

      // try compute total from item prices if available
      let totalFromItems = 0;
      let hasItemPrices = false;
      for (const it of items) {
        const p = Number((it as any).price ?? NaN);
        const q = Number((it as any).quantity ?? 0);
        if (!isNaN(p)) {
          hasItemPrices = true;
          totalFromItems += p * (isNaN(q) ? 0 : q);
        }
      }

      // fallback: sum row totals (some APIs return total on each row)
      const totalFromRows = orders.reduce((sum, o) => sum + (Number((o as any).total) || 0), 0);

      const total = hasItemPrices ? totalFromItems : totalFromRows;

      const collected = orders.every((o) => !!o.collected);

      // Optional: dedupe items by product_name and sum quantities (if you want compact list)
      // For now keep items as-is order-preserving.
      return {
        code,
        items,
        total: Number(total || 0),
        collected,
      };
    });

    // sort newest first if your orders include created_at in nested rows (not assumed here)
    return groups;
  }, [allOrders]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Manage products and view orders</p>
        </div>

        <Tabs defaultValue="products" onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="all-orders">All Orders</TabsTrigger>
            <TabsTrigger value="search">Search Order</TabsTrigger>
          </TabsList>

          {/* PRODUCTS TAB */}
          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Product</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateProduct} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={newProduct.quantity}
                      onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image">Product Image</Label>
                    <Input id="image" type="file" accept="image/*" onChange={handleImageChange} />
                    {preview && (
                      <img
                        src={preview}
                        alt="Preview"
                        className="h-24 w-24 rounded-lg object-cover border mt-2"
                      />
                    )}
                  </div>

                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "Creating..." : "Create Product"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Products ({products.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingProducts ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : products.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">No products yet</p>
                ) : (
                  <div className="space-y-3">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div className="flex items-center gap-4">
                          {product.image_url && (
                            <img
                              src={`${API_BASE_URL}${product.image_url}`}
                              alt={product.name}
                              className="h-16 w-16 rounded object-cover border"
                            />
                          )}
                          <div>
                            <h3 className="font-semibold">{product.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {product.description}
                            </p>
                          </div>
                        </div>
                        <span className="text-lg font-bold text-primary">
                          ₦{product.price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* STATS TAB */}
          <TabsContent value="stats" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Order Statistics</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => fetchStats()} disabled={isLoadingStats}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingStats ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Query Controls */}
                <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <Label>Range</Label>
                    <select
                      value={range}
                      onChange={(e) => {
                        const val = e.target.value as "day" | "week" | "month" | "year" | "custom" | "";
                        setRange(val);
                        // clear custom dates when changing away from custom
                        if (val !== "custom") {
                          setStartDate("");
                          setEndDate("");
                        }
                      }}
                      className="w-full rounded-md border px-3 py-2 bg-input text-foreground"
                    >
                      <option value="">-- Select range --</option>
                      <option value="day">Day</option>
                      <option value="week">Week</option>
                      <option value="month">Month</option>
                      <option value="year">Year</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      disabled={range !== "custom"}
                    />
                  </div>

                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      disabled={range !== "custom"}
                    />
                  </div>
                </div>

                <div className="mb-6 flex gap-3">
                  <Button onClick={applyFilters} disabled={isApplyingFilters}>
                    {isApplyingFilters ? "Applying..." : "Apply Filters"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      // reset filters
                      setRange("");
                      setStartDate("");
                      setEndDate("");
                      // fetch stats without filters
                      fetchStats();
                    }}
                  >
                    Reset
                  </Button>
                </div>

                {isLoadingStats ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : !stats ? (
                  <p className="text-center text-muted-foreground py-8">No statistics available</p>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">Total Orders</p>
                        <p className="text-2xl font-bold">{stats.total_orders}</p>
                        {/* contextual text showing active filter */}
                        <p className="text-xs text-muted-foreground mt-2">
                          {range
                            ? range === "custom"
                              ? `Custom: ${startDate || "—"} → ${endDate || "—"}`
                              : `Range: ${range}`
                            : "No range filter"}
                        </p>
                      </div>

                      <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                        <p className="text-2xl font-bold text-primary">
                          ₦{Number(stats.total_revenue || 0).toFixed(2)}
                        </p>
                      </div>

                      <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">Top Product (by sold)</p>
                        {stats.top_products && stats.top_products.length > 0 ? (
                          <div>
                            <p className="font-semibold">{stats.top_products[0].name}</p>
                            <p className="text-sm text-muted-foreground">
                              Sold: {stats.top_products[0].total_sold} • Revenue: ₦
                              {Number(stats.top_products[0].revenue || 0).toFixed(2)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No top product yet</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg border p-4">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-semibold">Monthly Revenue</p>
                          <p className="text-sm text-muted-foreground">By month</p>
                        </div>
                        {stats.monthly_stats && stats.monthly_stats.length > 0 ? (
                          <div className="space-y-2">
                            {stats.monthly_stats.map((m) => (
                              <div key={m.month} className="flex justify-between">
                                <span className="text-sm text-muted-foreground">{m.month}</span>
                                <span className="font-medium">₦{Number(m.revenue || 0).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No monthly data</p>
                        )}
                      </div>

                      <div className="rounded-lg border p-4">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-semibold">Top Selling Products</p>
                          <p className="text-sm text-muted-foreground">Top 5</p>
                        </div>
                        {stats.top_products && stats.top_products.length > 0 ? (
                          <div className="space-y-2">
                            {stats.top_products.map((p, idx) => (
                              <div key={p.name + idx} className="flex justify-between">
                                <div>
                                  <p className="font-medium">{p.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Sold: {p.total_sold}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">₦{Number(p.revenue || 0).toFixed(2)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No top products yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ALL ORDERS TAB */}
          <TabsContent value="all-orders" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>All Orders ({groupedOrders.length})</CardTitle>
                  <Button variant="outline" onClick={fetchAllOrders} disabled={isLoadingAllOrders}>
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${isLoadingAllOrders ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingAllOrders ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : groupedOrders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No orders yet</p>
                ) : (
                  <div className="space-y-3">
                    {groupedOrders.map((group) => (
                      <div
                        key={group.code}
                        className="border rounded-lg p-4 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-semibold">Code: {group.code}</p>
                          {group.items.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No items</p>
                          ) : (
                            group.items.map((item, i) => (
                              <p key={`${group.code}-${i}`} className="text-sm text-muted-foreground">
                                {item.product_name} × {item.quantity}
                              </p>
                            ))
                          )}
                          <p className="text-sm mt-1">
                            <Badge
                              variant={group.collected ? "secondary" : "outline"}
                              className={
                                group.collected
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {group.collected ? "Collected" : "Pending"}
                            </Badge>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary mb-2">₦{group.total.toFixed(2)}</p>
                          {!group.collected && (
                            <Button
                              size="sm"
                              onClick={() => handleMarkAsCollected(group.code)}
                              disabled={updatingOrderCode === group.code}
                            >
                              {updatingOrderCode === group.code ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Updating...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Collected
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEARCH TAB */}
          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Search Order by Code</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearchOrder} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="orderCode">Order Code</Label>
                    <Input
                      id="orderCode"
                      placeholder="Enter 6-character code"
                      value={orderCode}
                      onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoadingOrder}>
                    {isLoadingOrder ? "Searching..." : "Search"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {order && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Package className="h-6 w-6 text-primary" />
                    <CardTitle>Order Details</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">Code: {order.code}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {order.items?.map((item, i) => (
                      <div
                        key={i}
                        className="flex justify-between border-b pb-2 last:border-0"
                      >
                        <span className="text-muted-foreground">
                          {item.product_name} × {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge
                      variant={order.collected ? "secondary" : "outline"}
                      className={
                        order.collected
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {order.collected ? "Collected" : "Pending"}
                    </Badge>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-primary">
                        ₦{order?.total ? order.total.toFixed(2) : "0.00"}
                      </span>
                    </div>
                  </div>

                  {!order.collected && (
                    <Button
                      onClick={() => handleMarkAsCollected(order.code)}
                      disabled={updatingOrderCode === order.code}
                      className="w-full"
                    >
                      {updatingOrderCode === order.code ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Mark as Collected
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
