import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone } from "lucide-react";

export default function ResaleContact({ caskId }: { caskId: string }) {
  const { user } = useAuth();
  const [c, setC] = useState<{ contact_email: string | null; contact_phone: string | null; seller_id: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("cask_sales").select("seller_id, contact_email, contact_phone" as any).eq("cask_id", caskId).eq("status", "active").maybeSingle()
      .then(({ data }) => setC((data as any) || null));
  }, [caskId, user]);

  if (!user || !c || (!c.contact_email && !c.contact_phone) || c.seller_id === user.id) return null;
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <p className="font-medium">Contact the seller</p>
        {c.contact_email && <a className="flex items-center gap-2 text-sm text-primary hover:underline" href={`mailto:${encodeURIComponent(c.contact_email)}`}><Mail className="h-4 w-4" />{c.contact_email}</a>}
        {c.contact_phone && <a className="flex items-center gap-2 text-sm text-primary hover:underline" href={`tel:${c.contact_phone.replace(/[^+\d]/g, "")}`}><Phone className="h-4 w-4" />{c.contact_phone}</a>}
      </CardContent>
    </Card>
  );
}
