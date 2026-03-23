import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Edit } from "lucide-react";
import { format } from "date-fns";

export function ListingsManagement() {
  const { toast } = useToast();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('cask_sales')
        .select(`
          *,
          cask_ownership (
            cask_id,
            casks (
              spirit_name,
              cask_number,
              distilleries (name)
            )
          ),
          profiles (email, first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast({
        title: "Error",
        description: "Failed to load listings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateListingStatus = async (listingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('cask_sales')
        .update({ status: newStatus })
        .eq('id', listingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Listing status updated"
      });

      fetchListings();
    } catch (error) {
      console.error('Error updating listing:', error);
      toast({
        title: "Error",
        description: "Failed to update listing",
        variant: "destructive"
      });
    }
  };

  const filteredListings = listings.filter(listing => {
    const cask = listing.cask_ownership?.casks;
    const matchesSearch = 
      cask?.spirit_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cask?.cask_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cask?.distilleries?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || listing.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Listings Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search listings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cask</TableHead>
                <TableHead>Distillery</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Volume</TableHead>
                <TableHead>Last Gauging</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Listed Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : filteredListings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">No listings found</TableCell>
                </TableRow>
              ) : (
                filteredListings.map((listing) => {
                  const cask = listing.cask_ownership?.casks;
                  return (
                    <TableRow key={listing.id}>
                      <TableCell className="font-medium">
                        {cask?.spirit_name} {cask?.cask_number}
                      </TableCell>
                      <TableCell>{cask?.distilleries?.name}</TableCell>
                      <TableCell>
                        {listing.profiles?.first_name} {listing.profiles?.last_name}
                      </TableCell>
                      <TableCell>£{listing.total_asking_price?.toLocaleString()}</TableCell>
                      <TableCell>{listing.volume_for_sale_liters}L</TableCell>
                      <TableCell>
                        {listing.last_gauging_date 
                          ? format(new Date(listing.last_gauging_date), 'MMM dd, yyyy')
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          listing.status === 'active' ? 'default' :
                          listing.status === 'sold' ? 'secondary' : 'outline'
                        }>
                          {listing.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(listing.listing_date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          defaultValue={listing.status}
                          onValueChange={(value) => updateListingStatus(listing.id, value)}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="sold">Sold</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
