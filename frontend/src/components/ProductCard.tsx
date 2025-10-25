import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShoppingCart, ImageOff } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  showAddButton?: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const ProductCard = ({ product, onAddToCart, showAddButton = true }: ProductCardProps) => {
  const imageSrc = product.image_url ? `${API_BASE_URL}${product.image_url}` : null;

  return (
    <Card className="transition-all hover:shadow-lg overflow-hidden">
      {/* Product Image or Placeholder */}
      <div className="h-48 w-full bg-gray-100 flex items-center justify-center">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={product.name}
            className="h-48 w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const fallback = e.currentTarget.parentElement?.querySelector(".placeholder");
              if (fallback) fallback.classList.remove("hidden");
            }}
          />
        ) : (
          <div className="placeholder flex flex-col items-center text-gray-400">
            <ImageOff className="h-12 w-12 mb-2" />
            <p className="text-sm">No image</p>
          </div>
        )}
      </div>

      <CardHeader>
        <CardTitle>{product.name}</CardTitle>
        <CardDescription className="line-clamp-2">{product.description}</CardDescription>
      </CardHeader>

      <CardContent>
        <p className="text-2xl font-bold text-primary">${product.price.toFixed(2)}</p>
      </CardContent>

      {showAddButton && onAddToCart && (
        <CardFooter>
          <Button className="w-full" onClick={() => onAddToCart(product)}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default ProductCard;
