// src/pages/AdminDashboard.tsx
import { useState, useEffect, useMemo } from "react";
import api from "@/api/axios";
import { Product as BaseProduct, OrderDetail } from "@/types";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle2, Package, Search, X } from "lucide-react";
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

// Extend the Product type locally to include fields you reference in UI
interface Product extends BaseProduct {
  quantity?: number;
  image_url?: string;
}

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

  // Edit product state
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<
    Partial<Product & { price: string; quantity: string }> | null
  >(null);
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);

  // Delete product state (track which product is being deleted)
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);

  // Product search state
  const [productQuery, setProductQuery] = useState<string>("");

  // Stats state
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Query control state
  const [range, setRange] = useState<
    "day" | "week" | "month" | "year" | "custom" | ""
  >("");
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
      fetchStats();
      interval = window.setInterval(() => fetchStats(), 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ---------- Fetchers ----------
  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const response = await api.get<Product[]>("/products/");
      setProducts(response.data);
    } catch (error) {
      console.error("Failed to load products", error);
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

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const params: Record<string, string> = {};
      if (range && range !== "") params.range = range;
      if (range === "custom") {
        if (!startDate || !endDate) {
          toast.error("Please provide a start and end date for custom range.");
          setIsLoadingStats(false);
          return;
        }
        params.start_date = startDate;
        params.end_date = endDate;
      }
      // use /stats without a trailing slash if your backend prefers that
      const response = await api.get<StatsResponse>("/stats", { params });
      setStats(response.data);
    } catch (error: any) {
      console.error("Failed to load stats:", error);
      toast.error(error?.response?.data?.detail || "Failed to load statistics.");
      setStats(null);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // ---------- Product create ----------
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

  // ---------- Search order ----------
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

  // ---------- Mark collected ----------
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
      await fetchStats();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to update order");
    } finally {
      setUpdatingOrderCode(null);
    }
  };

  // ---------- Product edit handlers ----------
  const startEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setEditingProduct({
      name: product.name,
      price: String(product.price ?? ""),
      description: (product as any).description ?? "",
      quantity: String((product as any).quantity ?? 0),
    });
  };

  const cancelEditProduct = () => {
    setEditingProductId(null);
    setEditingProduct(null);
  };

  const handleUpdateProduct = async (productId: number) => {
    if (!editingProduct) return;
    setIsUpdatingProduct(true);
    try {
      const payload: any = {};
      if (editingProduct.name !== undefined) payload.name = (editingProduct.name as string).trim();
      if (editingProduct.price !== undefined && editingProduct.price !== "") payload.price = Number(editingProduct.price);
      if (editingProduct.description !== undefined) payload.description = editingProduct.description;
      if (editingProduct.quantity !== undefined && editingProduct.quantity !== "") payload.quantity = Number(editingProduct.quantity);

      const res = await api.patch<Product>(`/products/${productId}`, payload);

      // update local list
      setProducts((prev) => prev.map((p) => (p.id === productId ? res.data : p)));
      toast.success("Product updated");
      cancelEditProduct();
    } catch (err: any) {
      console.error("Update failed", err);
      toast.error(err?.response?.data?.detail || "Failed to update product");
    } finally {
      setIsUpdatingProduct(false);
    }
  };

  // ---------- Delete product handler ----------
  const handleDeleteProduct = async (productId: number) => {
    const product = products.find((p) => p.id === productId);
    const confirmMsg = product
      ? `Delete "${product.name}" permanently? This cannot be undone.`
      : "Delete this product permanently?";
    const ok = window.confirm(confirmMsg);
    if (!ok) return;

    setDeletingProductId(productId);
    try {
      await api.delete(`/products/${productId}`);
      // optimistic update
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      toast.success("Product deleted");
    } catch (err: any) {
      console.error("Delete failed", err);
      toast.error(err?.response?.data?.detail || "Failed to delete product");
    } finally {
      setDeletingProductId(null);
    }
  };

  // ---------- Product filtering (search) ----------
  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const desc = ((p as any).description || "").toLowerCase();
      const idStr = String(p.id || "");
      return name.includes(q) || desc.includes(q) || idStr.includes(q);
    });
  }, [products, productQuery]);

  // ---------- Grouping orders for admin view ----------
  const groupedOrders = useMemo(() => {
    const map = allOrders.reduce((acc, ord) => {
      const code = ord.code || "UNKNOWN";
      if (!acc[code]) acc[code] = [];
      acc[code].push(ord);
      return acc;
    }, {} as Record<string, OrderDetail[]>);

    return Object.entries(map).map(([code, orders]) => {
      const items = orders.flatMap((o) => o.items ?? []);
      // compute total if prices exist
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
      const totalFromRows = orders.reduce((sum, o) => sum + (Number((o as any).total) || 0), 0);
      const total = hasItemPrices ? totalFromItems : totalFromRows;
      const collected = orders.every((o) => !!(o as any).collected);

      // find username if available
      let username: string | null = null;
      const rowWithUser = orders.find((o) => (o as any).user && (o as any).user.username);
      if (rowWithUser) username = (rowWithUser as any).user.username;
      else if ((orders[0] as any).user && (orders[0] as any).user.username) username = (orders[0] as any).user.username;

      return {
        code,
        items,
        total: Number(total || 0),
        collected,
        user: username,
      };
    });
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
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <CardTitle>All Products ({products.length})</CardTitle>
                </div>

                {/* Search box in header */}
                <div className="flex items-center gap-2 w-full md:w-1/2">
                  <div className="relative w-full">
                    <Input
                      placeholder="Search products by name, description or id..."
                      value={productQuery}
                      onChange={(e) => setProductQuery(e.target.value)}
                      aria-label="Search products"
                      className="pr-10"
                    // keep it visually prominent
                    />
                    <Search className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    {productQuery && (
                      <button
                        type="button"
                        onClick={() => setProductQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {isLoadingProducts ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : products.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">No products yet</p>
                ) : (
                  <>
                    {/* show filtered count and query */}
                    {productQuery.trim() !== "" && (
                      <p className="text-sm text-muted-foreground mb-3">
                        Showing {filteredProducts.length} of {products.length} products for "<span className="font-medium text-foreground">{productQuery}</span>"
                      </p>
                    )}

                    <div className="space-y-3">
                      {filteredProducts.map((product) => (
                        <div key={product.id} className="rounded-lg border p-4">
                          {editingProductId === product.id && editingProduct ? (
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4 w-full">
                                  {product.image_url && (
                                    <img
                                      src={`${API_BASE_URL}${product.image_url}`}
                                      alt={product.name}
                                      className="h-16 w-16 rounded object-cover border"
                                    />
                                  )}
                                  <div className="w-full">
                                    <input
                                      className="w-full border rounded-md px-2 py-1"
                                      value={editingProduct.name as string}
                                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                    />
                                    <textarea
                                      className="w-full mt-2 border rounded-md px-2 py-1"
                                      rows={2}
                                      value={editingProduct.description as string}
                                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                                    />
                                  </div>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="w-28 border rounded-md px-2 py-1 text-right"
                                    value={editingProduct.price as any}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                                  />
                                  <input
                                    type="number"
                                    className="w-28 border rounded-md px-2 py-1 text-right"
                                    value={editingProduct.quantity as any}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, quantity: e.target.value })}
                                  />
                                </div>
                              </div>

                              <div className="flex gap-2 justify-end">
                                <Button variant="ghost" onClick={cancelEditProduct}>Cancel</Button>
                                <Button onClick={() => handleUpdateProduct(product.id)} disabled={isUpdatingProduct}>
                                  {isUpdatingProduct ? "Saving..." : "Save"}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-4">
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
                                  <p className="text-sm text-muted-foreground">{(product as any).description}</p>
                                  <p className="text-sm text-muted-foreground">Stock: {product.quantity ?? "—"}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-primary">₦{(product.price ?? 0).toFixed(2)}</span>

                                {/* Edit button */}
                                <Button size="sm" variant="outline" onClick={() => startEditProduct(product)}>Edit</Button>

                                {/* Delete button (shows spinner state when deleting) */}
                                <Button
                                  size="sm"
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                  disabled={deletingProductId === product.id}
                                  aria-label={`Delete ${product.name}`}
                                >
                                  {deletingProductId === product.id ? "Deleting..." : "Delete"}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
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
                  <Button onClick={async () => { setIsApplyingFilters(true); try { await fetchStats(); toast.success("Filters applied"); } finally { setIsApplyingFilters(false); } }} disabled={isApplyingFilters}>
                    {isApplyingFilters ? "Applying..." : "Apply Filters"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setRange("");
                      setStartDate("");
                      setEndDate("");
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
                        <p className="text-xs text-muted-foreground mt-2">
                          {range ? (range === "custom" ? `Custom: ${startDate || "—"} → ${endDate || "—"}` : `Range: ${range}`) : "No range filter"}
                        </p>
                      </div>

                      <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                        <p className="text-2xl font-bold text-primary">₦{Number(stats.total_revenue || 0).toFixed(2)}</p>
                      </div>

                      <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">Top Product (by sold)</p>
                        {stats.top_products && stats.top_products.length > 0 ? (
                          <div>
                            <p className="font-semibold">{stats.top_products[0].name}</p>
                            <p className="text-sm text-muted-foreground">Sold: {stats.top_products[0].total_sold} • Revenue: ₦{Number(stats.top_products[0].revenue || 0).toFixed(2)}</p>
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
                                  <p className="text-sm text-muted-foreground">Sold: {p.total_sold}</p>
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
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingAllOrders ? "animate-spin" : ""}`} />
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
                      <div key={group.code} className="border rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <p className="font-semibold">Code: {group.code}</p>
                          <p className="text-sm text-muted-foreground">By: {group.user ?? "—"}</p>
                          {group.items.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No items</p>
                          ) : (
                            group.items.map((item, i) => (
                              <p key={`${group.code}-${i}`} className="text-sm text-muted-foreground">
                                {item.product_name} × {item.quantity}
                              </p>
                            ))
                          )}
                          <div className="text-sm mt-1">
                            <Badge variant={group.collected ? "secondary" : "outline"} className={group.collected ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                              {group.collected ? "Collected" : "Pending"}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary mb-2">₦{group.total.toFixed(2)}</p>
                          {!group.collected && (
                            <Button size="sm" onClick={() => handleMarkAsCollected(group.code)} disabled={updatingOrderCode === group.code}>
                              {updatingOrderCode === group.code ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Updating...</> : <><CheckCircle2 className="h-4 w-4 mr-2" /> Mark Collected</>}
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
                  <div>
                    <p className="text-sm text-muted-foreground">By: {(order as any).user?.username ?? "—"}</p>
                  </div>

                  <div className="space-y-2">
                    {order.items?.map((item, i) => (
                      <div key={i} className="flex justify-between border-b pb-2 last:border-0">
                        <span className="text-muted-foreground">{item.product_name} × {item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={(order as any).collected ? "secondary" : "outline"} className={(order as any).collected ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                      {(order as any).collected ? "Collected" : "Pending"}
                    </Badge>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-primary">₦{order?.total ? (order.total as number).toFixed(2) : "0.00"}</span>
                    </div>
                  </div>

                  {!(order as any).collected && (
                    <Button onClick={() => handleMarkAsCollected(order.code)} disabled={updatingOrderCode === order.code} className="w-full">
                      {updatingOrderCode === order.code ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Updating...</> : <><CheckCircle2 className="h-4 w-4 mr-2" /> Mark as Collected</>}
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
