import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingSpinner = ({ size = "md", className }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2", 
    lg: "h-12 w-12 border-4"
  };

  return (
    <div 
      className={cn(
        "animate-spin rounded-full border-primary border-t-transparent",
        sizeClasses[size],
        className
      )}
    />
  );
};

export const LoadingOverlay = ({ children, isLoading }: { 
  children: React.ReactNode; 
  isLoading: boolean; 
}) => (
  <div className="relative">
    {children}
    {isLoading && (
      <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
        <LoadingSpinner />
      </div>
    )}
  </div>
);