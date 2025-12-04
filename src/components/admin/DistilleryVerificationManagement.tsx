import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building2, CheckCircle, XCircle, Clock, ExternalLink, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Distillery {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  license_number: string | null;
  established_year: number | null;
  website: string | null;
  verified: boolean | null;
  created_at: string;
  profile_id: string;
  profiles?: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}

const DistilleryVerificationManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistillery, setSelectedDistillery] = useState<Distillery | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: distilleries, isLoading } = useQuery({
    queryKey: ['admin-distilleries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('distilleries')
        .select(`
          *,
          profiles:profile_id (
            email,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Distillery[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (distilleryId: string) => {
      const distillery = distilleries?.find(d => d.id === distilleryId);
      if (!distillery) throw new Error("Distillery not found");

      // Update distillery to verified
      const { error: updateError } = await supabase
        .from('distilleries')
        .update({ verified: true })
        .eq('id', distilleryId);

      if (updateError) throw updateError;

      // Add distillery role to user
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: distillery.profile_id,
          role: 'distillery'
        });

      // Ignore duplicate role error
      if (roleError && !roleError.message.includes('duplicate')) {
        throw roleError;
      }

      // Notify the distillery owner
      await supabase.from('notifications').insert({
        user_id: distillery.profile_id,
        type: 'distillery_approved',
        title: 'Distillery Approved!',
        message: `Congratulations! Your distillery "${distillery.name}" has been verified. You can now list casks on the marketplace.`,
        link: '/distillery',
      });

      return distillery;
    },
    onSuccess: (distillery) => {
      queryClient.invalidateQueries({ queryKey: ['admin-distilleries'] });
      toast.success(`${distillery.name} has been approved!`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to approve distillery");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ distilleryId, reason }: { distilleryId: string; reason: string }) => {
      const distillery = distilleries?.find(d => d.id === distilleryId);
      if (!distillery) throw new Error("Distillery not found");

      // Delete the distillery application
      const { error: deleteError } = await supabase
        .from('distilleries')
        .delete()
        .eq('id', distilleryId);

      if (deleteError) throw deleteError;

      // Notify the user
      await supabase.from('notifications').insert({
        user_id: distillery.profile_id,
        type: 'distillery_rejected',
        title: 'Distillery Application Rejected',
        message: reason || 'Your distillery application has been rejected. Please contact support for more information.',
        link: '/distillery/onboarding',
      });

      return distillery;
    },
    onSuccess: (distillery) => {
      queryClient.invalidateQueries({ queryKey: ['admin-distilleries'] });
      toast.success(`${distillery.name} application has been rejected`);
      setIsRejectDialogOpen(false);
      setSelectedDistillery(null);
      setRejectReason("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to reject distillery");
    },
  });

  const filteredDistilleries = distilleries?.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.license_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = distilleries?.filter(d => !d.verified).length || 0;
  const verifiedCount = distilleries?.filter(d => d.verified).length || 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Distilleries</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{distilleries?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{verifiedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Distillery List */}
      <Card>
        <CardHeader>
          <CardTitle>Distillery Applications</CardTitle>
          <CardDescription>Review and manage distillery verification requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, location, or license..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Distillery</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>License</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDistilleries?.map((distillery) => (
                <TableRow key={distillery.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{distillery.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {distillery.location || 'No location'}
                        {distillery.established_year && ` • Est. ${distillery.established_year}`}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {distillery.profiles?.first_name} {distillery.profiles?.last_name}
                      <div className="text-muted-foreground">{distillery.profiles?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {distillery.license_number || 'N/A'}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={distillery.verified ? "default" : "secondary"}>
                      {distillery.verified ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(distillery.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {distillery.website && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(distillery.website!, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      {!distillery.verified && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => approveMutation.mutate(distillery.id)}
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedDistillery(distillery);
                              setIsRejectDialogOpen(true);
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredDistilleries?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No distilleries found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Distillery Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject the application from {selectedDistillery?.name}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason for rejection (optional)</label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Provide a reason for the rejection..."
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedDistillery) {
                  rejectMutation.mutate({
                    distilleryId: selectedDistillery.id,
                    reason: rejectReason,
                  });
                }
              }}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DistilleryVerificationManagement;
