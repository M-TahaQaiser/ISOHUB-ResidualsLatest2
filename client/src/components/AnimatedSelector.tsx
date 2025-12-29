import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AnimatedSelectorProps {
  isSelected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  selectedBorderColor?: string;
}

export default function AnimatedSelector({ 
  isSelected, 
  onClick, 
  children, 
  className = "",
  selectedBorderColor = "border-yellow-400"
}: AnimatedSelectorProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative cursor-pointer transition-all duration-300 ease-in-out",
        "border-2 border-transparent rounded-lg",
        "hover:shadow-lg transform hover:scale-[1.02]",
        isSelected && [
          selectedBorderColor,
          "shadow-xl scale-[1.02]",
          "animate-pulse-border"
        ],
        className
      )}
    >
      {/* Animated border overlay for selected state */}
      {isSelected && (
        <>
          <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 rounded-lg blur opacity-75 animate-pulse"></div>
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 rounded-lg animate-spin-slow opacity-30"></div>
        </>
      )}
      
      {/* Content */}
      <div className="relative bg-white rounded-lg">
        {children}
      </div>
      
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-3 h-3 bg-yellow-400 rounded-full animate-bounce">
          <div className="absolute inset-0 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
        </div>
      )}
    </div>
  );
}