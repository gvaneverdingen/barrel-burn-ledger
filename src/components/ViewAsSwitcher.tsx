import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye } from "lucide-react";

export const ViewAsSwitcher = () => {
  const { realRole, viewAsRole, setViewAsRole } = useAuth();

  if (realRole !== "administrator") return null;

  const value = viewAsRole ?? "administrator";

  return (
    <div className="hidden md:flex items-center gap-1 text-xs">
      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
      <Select
        value={value}
        onValueChange={(v) => setViewAsRole(v === "administrator" ? null : (v as any))}
      >
        <SelectTrigger className="h-8 w-[150px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="administrator">View as: Admin</SelectItem>
          <SelectItem value="distillery">View as: Distillery</SelectItem>
          <SelectItem value="consumer">View as: Consumer</SelectItem>
          <SelectItem value="investor">View as: Investor</SelectItem>
          <SelectItem value="facilitator">View as: Warehouse</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};