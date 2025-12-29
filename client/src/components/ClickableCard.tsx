import { ReactNode } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClickableCardProps {
  title: string;
  description?: string;
  value?: string | number;
  href: string;
  icon?: ReactNode;
  isSelected?: boolean;
  className?: string;
  badge?: ReactNode;
  auditStatus?: 'pending' | 'verified' | 'error' | 'needs_upload';
  monthlyData?: boolean;
}

export default function ClickableCard({
  title,
  description,
  value,
  href,
  icon,
  isSelected = false,
  className = "",
  badge,
  auditStatus,
  monthlyData = false
}: ClickableCardProps) {
  return (
    <Link href={href}>
      <a className="block">
        <Card className={cn(
          "relative cursor-pointer transition-all duration-300 ease-in-out",
          "border-2 border-transparent hover:shadow-lg transform hover:scale-[1.02]",
          "group",
          isSelected && [
            "border-yellow-400 shadow-xl scale-[1.02]"
          ],
          className
        )}>
          {/* Static border overlay for selected state */}
          {isSelected && (
            <>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 rounded-lg blur opacity-75"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 rounded-lg opacity-30"></div>
            </>
          )}
          
          <div className="relative bg-white rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {icon}
                {title}
              </CardTitle>
              <div className="flex items-center gap-2">
                {badge}
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-black transition-colors" />
              </div>
            </CardHeader>
            {(value || description) && (
              <CardContent>
                {value && (
                  <div className="text-2xl font-bold mb-1">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                  </div>
                )}
                {description && (
                  <p className="text-xs text-muted-foreground">
                    {description}
                  </p>
                )}
              </CardContent>
            )}
          </div>
          
          {/* Selected indicator */}
          {isSelected && (
            <div className="absolute top-2 right-2 w-3 h-3 bg-yellow-400 rounded-full z-10">
              <div className="absolute inset-0 w-3 h-3 bg-yellow-400 rounded-full"></div>
            </div>
          )}
          
          {/* Audit status indicator for monthly data */}
          {monthlyData && auditStatus && (
            <div className={`absolute bottom-2 left-2 w-2 h-2 rounded-full z-10 ${
              auditStatus === 'verified' ? 'bg-green-500' :
              auditStatus === 'error' ? 'bg-red-500' :
              auditStatus === 'pending' ? 'bg-yellow-500' :
              'bg-gray-400'
            }`}>
            </div>
          )}
        </Card>
      </a>
    </Link>
  );
}