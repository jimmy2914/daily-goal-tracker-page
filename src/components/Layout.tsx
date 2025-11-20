import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Target, Calendar, TrendingUp, Users, User, LogOut } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-gradient-card backdrop-blur supports-[backdrop-filter]:bg-background/95">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-hero">
              <Target className="h-5 w-5 text-primary-foreground" />
            </div>
            DailyGoals
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Mis Tareas
            </Link>
            <Link
              to="/calendar"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/calendar") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Calendario
            </Link>
            <Link
              to="/stats"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/stats") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Estadísticas
            </Link>
            <Link
              to="/social"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/social") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Social
            </Link>
            <Link
              to="/profile"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/profile") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Perfil
            </Link>
          </nav>

          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Salir
          </Button>
        </div>
      </header>

      <main className="flex-1 container py-6 px-4">{children}</main>

      <nav className="sticky bottom-0 z-50 border-t bg-card md:hidden">
        <div className="flex items-center justify-around px-4 py-3">
          <Link to="/" className={`flex flex-col items-center gap-1 ${isActive("/") ? "text-primary" : "text-muted-foreground"}`}>
            <Target className="h-5 w-5" />
            <span className="text-xs">Tareas</span>
          </Link>
          <Link to="/calendar" className={`flex flex-col items-center gap-1 ${isActive("/calendar") ? "text-primary" : "text-muted-foreground"}`}>
            <Calendar className="h-5 w-5" />
            <span className="text-xs">Calendario</span>
          </Link>
          <Link to="/stats" className={`flex flex-col items-center gap-1 ${isActive("/stats") ? "text-primary" : "text-muted-foreground"}`}>
            <TrendingUp className="h-5 w-5" />
            <span className="text-xs">Stats</span>
          </Link>
          <Link to="/social" className={`flex flex-col items-center gap-1 ${isActive("/social") ? "text-primary" : "text-muted-foreground"}`}>
            <Users className="h-5 w-5" />
            <span className="text-xs">Social</span>
          </Link>
          <Link to="/profile" className={`flex flex-col items-center gap-1 ${isActive("/profile") ? "text-primary" : "text-muted-foreground"}`}>
            <User className="h-5 w-5" />
            <span className="text-xs">Perfil</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
