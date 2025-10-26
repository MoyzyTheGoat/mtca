import { useEffect, useState } from "react";
import api from "@/api/axios";
import Navbar from "@/components/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Package, Clock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface OrderItem {
    product_name: string;
    quantity: number;
    price: number;
    subtotal: number;
}

interface OrderGroup {
    code: string;
    total: number;
    collected: boolean;
    created_at: string;
    items: OrderItem[];
}

const MyOrders = () => {
    const [orders, setOrders] = useState<OrderGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchCode, setSearchCode] = useState("");

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await api.get<OrderGroup[]>("/orders/my");
            setOrders(res.data);
        } catch (err: any) {
            toast.error(err.response?.data?.detail || "Failed to load your orders");
        } finally {
            setLoading(false);
        }
    };

    const searchOrder = async () => {
        if (!searchCode.trim()) {
            fetchOrders();
            return;
        }
        try {
            const res = await api.get<OrderGroup>(`/orders/my/${searchCode.trim()}`);
            setOrders([res.data]);
        } catch (err: any) {
            toast.error(err.response?.data?.detail || "Order not found");
            setOrders([]);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto flex min-h-[calc(100vh-80px)] items-center justify-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                    <h1 className="text-4xl font-bold text-foreground mb-4 sm:mb-0">My Orders</h1>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Input
                            type="text"
                            placeholder="Enter order code..."
                            value={searchCode}
                            onChange={(e) => setSearchCode(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && searchOrder()}
                            className="max-w-xs"
                        />
                        <Button onClick={searchOrder}>
                            <Search className="h-4 w-4 mr-1" /> Search
                        </Button>
                    </div>
                </div>

                {orders.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Package className="mb-4 h-16 w-16 text-muted-foreground" />
                            <p className="mb-4 text-xl text-muted-foreground">No matching orders</p>
                            <Button onClick={() => (window.location.href = "/")}>Start Shopping</Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {orders.map((order) => (
                            <Card key={order.code}>
                                <CardHeader>
                                    <CardTitle className="flex justify-between">
                                        <span>#{order.code}</span>
                                        <span
                                            className={`text-sm ${order.collected ? "text-green-600" : "text-yellow-600"
                                                }`}
                                        >
                                            {order.collected ? "Collected" : "Pending"}
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="mb-2">
                                            <p className="font-medium">{item.product_name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                ₦{item.price.toFixed(2)} × {item.quantity}
                                            </p>
                                        </div>
                                    ))}
                                    <hr className="my-2" />
                                    <p className="font-semibold">Total: ₦{order.total.toFixed(2)}</p>
                                    <p className="mt-2 text-sm flex items-center gap-1 text-muted-foreground">
                                        <Clock className="h-4 w-4" />{" "}
                                        {new Date(order.created_at).toLocaleString()}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default MyOrders;
