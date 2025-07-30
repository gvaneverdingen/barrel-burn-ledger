import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ImageIcon, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface CaskImage {
  id: string;
  image_url: string;
  image_type: string;
  description: string | null;
  uploaded_by: string;
  created_at: string;
}

interface CaskImageGalleryProps {
  caskId: string;
  canManage: boolean;
  refreshTrigger?: number;
}

export const CaskImageGallery = ({ caskId, canManage, refreshTrigger }: CaskImageGalleryProps) => {
  const [images, setImages] = useState<CaskImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('cask_images')
        .select('*')
        .eq('cask_id', caskId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (error: any) {
      console.error('Error fetching images:', error);
      toast({
        title: "Failed to load images",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [caskId, refreshTrigger]);

  const deleteImage = async (imageId: string, imageUrl: string) => {
    setDeletingId(imageId);
    
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const folderName = urlParts[urlParts.length - 2];
      const filePath = `${folderName}/${fileName}`;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('cask-images')
        .remove([filePath]);

      if (storageError) {
        console.warn('Storage deletion failed:', storageError);
        // Continue with database deletion even if storage fails
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('cask_images')
        .delete()
        .eq('id', imageId);

      if (dbError) throw dbError;

      toast({
        title: "Image deleted",
        description: "The image has been removed from the marketplace",
      });

      // Refresh images
      fetchImages();

    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete image",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getImageTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      barrel_photo: "Barrel Photo",
      warehouse_location: "Warehouse",
      inspection_photo: "Inspection",
      certificate: "Certificate"
    };
    return labels[type] || type;
  };

  const getImageTypeVariant = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      barrel_photo: "default",
      warehouse_location: "secondary",
      inspection_photo: "outline",
      certificate: "destructive"
    };
    return variants[type] || "default";
  };

  if (loading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Barrel Photos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading images...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Barrel Photos ({images.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {images.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No photos available for this cask yet.</p>
            {canManage && (
              <p className="text-sm mt-2">Upload photos to showcase your barrel to potential buyers.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square overflow-hidden rounded-lg border border-border">
                  <img
                    src={image.image_url}
                    alt={image.description || "Cask image"}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                
                <div className="absolute top-2 left-2">
                  <Badge variant={getImageTypeVariant(image.image_type)} className="text-xs">
                    {getImageTypeLabel(image.image_type)}
                  </Badge>
                </div>

                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="secondary">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <img
                        src={image.image_url}
                        alt={image.description || "Cask image"}
                        className="w-full h-auto rounded-lg"
                      />
                      {image.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {image.description}
                        </p>
                      )}
                    </DialogContent>
                  </Dialog>

                  {canManage && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteImage(image.id, image.image_url)}
                      disabled={deletingId === image.id}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {image.description && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 rounded-b-lg">
                    <p className="text-xs truncate">{image.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};