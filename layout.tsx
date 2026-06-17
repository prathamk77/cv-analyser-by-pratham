import { Link, useLocation } from "wouter";
import { Clock, BarChart } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-5xl">
          <Link href="/" className="flex items-center gap-3 font-semibold text-lg hover:opacity-90 transition-opacity">
            <div className="bg-primary/10 p-2 rounded-lg">
              <BarChart className="h-5 w-5 text-primary" />
            </div>
            <span className="tracking-tight">CV Analyser</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link
              href="/"
              className={`transition-all hover:text-primary ${location === '/' ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              New Analysis
            </Link>
            <Link
              href="/history"
              className={`flex items-center gap-2 transition-all hover:text-primary ${location === '/history' ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              <Clock className="h-4 w-4" />
              History
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 py-10 container mx-auto px-4 max-w-5xl">
        {children}
      </main>
    </div>
  );
}
