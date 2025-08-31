import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { DollarSign, Package, Calendar } from "lucide-react";

interface CaskOwnership {
  id: string;
  ownership_percentage: number;
  volume_liters: number;
  acquired_date: string;
  acquisition_price: number;
  casks: {
    id: string;
    spirit_name: string;
    cask_number: string;
    current_volume_liters: number;
    price_per_liter: number;
    distilleries: {
      name: string;
      location: string;
    };
  };
}

interface SellCaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ownership: CaskOwnership | null;
  onSaleCreated: () => void;
}

export function SellCaskDialog({ open, onOpenChange, ownership, onSaleCreated }: SellCaskDialogProps) {
  const { toast } = useToast();
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pricePerLiter, setPricePerLiter] = useState("");
  const [volumeToSell, setVolumeToSell] = useState("");
  const [notes, setNotes] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("30");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownership) return;

    try {
      setLoading(true);
      console.log("🔄 Starting cask sale submission...");
      console.log("👤 User from context:", user);
      console.log("🏷️ Session from context:", session);

      const priceNum = parseFloat(pricePerLiter);
      const volumeNum = parseFloat(volumeToSell);
      const expiresNum = parseInt(expiresInDays);

      if (isNaN(priceNum) || priceNum <= 0) {
        throw new Error("Please enter a valid price per liter");
      }

      if (isNaN(volumeNum) || volumeNum <= 0 || volumeNum > ownership.volume_liters) {
        throw new Error(`Volume must be between 0 and ${ownership.volume_liters}L`);
      }

      // Get fresh session token
      console.log("🔍 Checking current session...");
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log("📊 Session check result:", { sessionData, sessionError });
      
      if (sessionError) {
        console.error("❌ Session error:", sessionError);
        throw new Error(`Session error: ${sessionError.message}`);
      }
      
      if (!sessionData.session) {
        console.error("❌ No active session found");
        throw new Error("No active session - please log in again");
      }

      console.log("✅ Active session found, proceeding with API call...");

      const { data, error } = await supabase.functions.invoke("create-cask-sale", {
        body: {
          ownershipId: ownership.id,
          askingPricePerLiter: priceNum,
          volumeForSale: volumeNum,
          notes: notes.trim() || undefined,
          expiresInDays: expiresNum > 0 ? expiresNum : undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Success",
        description: "Your cask has been listed for sale!",
      });

      onSaleCreated();
      onOpenChange(false);
      
      // Reset form
      setPricePerLiter("");
      setVolumeToSell("");
      setNotes("");
      setExpiresInDays("30");
    } catch (error: any) {
      console.error("Error creating sale:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create sale listing",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!ownership) return null;

  const totalPrice = pricePerLiter && volumeToSell 
    ? (parseFloat(pricePerLiter) * parseFloat(volumeToSell)).toLocaleString()
    : "0";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="luxury-card max-w-md">
        <DialogHeader>
          <DialogTitle className="luxury-text-gradient">Sell Your Cask</DialogTitle>
          <DialogDescription>
            List your {ownership.casks.spirit_name} for sale on the marketplace
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cask Info Summary */}
          <div className="p-4 rounded-lg bg-muted/30 space-y-2">
            <h4 className="font-semibold">{ownership.casks.spirit_name}</h4>
            <p className="text-sm text-muted-foreground">
              {ownership.casks.distilleries.name} • Cask #{ownership.casks.cask_number}
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <span>You own: {ownership.volume_liters}L</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span>Current: ${ownership.casks.price_per_liter}/L</span>
              </div>
            </div>
          </div>

          {/* Price Per Liter */}
          <div className="space-y-2">
            <Label htmlFor="pricePerLiter">
              Asking Price per Liter ($)
            </Label>
            <Input
              id="pricePerLiter"
              type="number"
              step="0.01"
              min="0.01"
              value={pricePerLiter}
              onChange={(e) => setPricePerLiter(e.target.value)}
              placeholder="Enter price per liter"
              required
            />
          </div>

          {/* Volume to Sell */}
          <div className="space-y-2">
            <Label htmlFor="volumeToSell">
              Volume to Sell (Liters)
            </Label>
            <Input
              id="volumeToSell"
              type="number"
              step="0.01"
              min="0.01"
              max={ownership.volume_liters}
              value={volumeToSell}
              onChange={(e) => setVolumeToSell(e.target.value)}
              placeholder={`Max: ${ownership.volume_liters}L`}
              required
            />
          </div>

          {/* Listing Duration */}
          <div className="space-y-2">
            <Label htmlFor="expiresInDays">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Listing Duration
              </div>
            </Label>
            <Select value={expiresInDays} onValueChange={setExpiresInDays}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="0">No expiration</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Additional Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special notes about this cask..."
              rows={3}
            />
          </div>

          {/* Price Summary */}
          {pricePerLiter && volumeToSell && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Asking Price:</span>
                <span className="text-xl font-bold luxury-text-gradient">
                  ${totalPrice}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Platform fee (5%) will be deducted from your payout
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !pricePerLiter || !volumeToSell}
              className="luxury-button"
            >
              {loading ? "Creating Listing..." : "List for Sale"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}