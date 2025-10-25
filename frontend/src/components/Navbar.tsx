import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Package, LogOut, User, ShieldCheck } from 'lucide-react';

const Navbar = () => {
  const { isAuthenticated, isAdmin, logout, user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b bg-card shadow-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-foreground">FreshMart</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            to="/"
            className={`transition-colors hover:text-primary ${
              isActive('/') ? 'font-semibold text-primary' : 'text-muted-foreground'
            }`}
          >
            Products
          </Link>

          {isAuthenticated && !isAdmin && (
            <Link
              to="/cart"
              className={`transition-colors hover:text-primary ${
                isActive('/cart') ? 'font-semibold text-primary' : 'text-muted-foreground'
              }`}
            >
              <ShoppingCart className="h-5 w-5" />
            </Link>
          )}

          <Link
            to="/pickup"
            className={`transition-colors hover:text-primary ${
              isActive('/pickup') ? 'font-semibold text-primary' : 'text-muted-foreground'
            }`}
          >
            Pickup
          </Link>

          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center gap-1 transition-colors hover:text-primary ${
                isActive('/admin') ? 'font-semibold text-primary' : 'text-muted-foreground'
              }`}
            >
              <ShieldCheck className="h-5 w-5" />
              Admin
            </Link>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                {user?.username}
              </span>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button variant="default">Login</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
