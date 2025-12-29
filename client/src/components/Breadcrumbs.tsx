import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href: string;
  isActive?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  const filteredItems = (items || []).filter(item => item?.label?.toLowerCase() !== 'dashboard');
  
  return (
    <nav className={cn("flex items-center space-x-1 text-sm text-gray-400 mb-6", className)}>
      {/* Home/Dashboard link */}
      <Link href="/dashboard" className="flex items-center gap-1 hover:text-yellow-400 transition-colors p-1 rounded hover:bg-zinc-800">
        <Home className="h-4 w-4" />
        <span>Dashboard</span>
      </Link>
      
      {filteredItems.map((item, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="h-4 w-4 text-gray-600 mx-1" />
          {item.isActive ? (
            <span className="font-medium text-white">{item.label}</span>
          ) : (
            <Link href={item.href} className="hover:text-yellow-400 transition-colors p-1 rounded hover:bg-zinc-800">
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}