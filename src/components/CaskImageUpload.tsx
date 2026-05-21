import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, ImageIcon } from "lucide-react";

interface CaskImageUploadProps {
  caskId: string;
  onImageUploaded: () => void;
  canUpload: boolean;
}

export const CaskImageUpload = ({ caskId, onImageUploaded, canUpload }: CaskImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [imageType, setImageType] = useState("barrel_photo");
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const uploadImage = async () => {
    if (!selectedFile || !canUpload) return;

    setIsUploading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Upload to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('cask-images')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('cask-images')
        .getPublicUrl(fileName);

      // Save image metadata to database
      const { error: dbError } = await supabase
        .from('cask_images')
        .insert({
          cask_id: caskId,
          image_url: urlData.publicUrl,
          image_type: imageType,
          description: description.trim() || null,
          uploaded_by: user.id,
        });

      if (dbError) throw dbError;

      toast({
        title: "Image uploaded successfully",
        description: "Your barrel photo has been added to the marketplace",
      });

      // Reset form
      setSelectedFile(null);
      setDescription("");
      setImageType("barrel_photo");
      onImageUploaded();

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
  };

  if (!canUpload) {
    return null;
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Upload Barrel Photos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="image-upload">Select Image</Label>
          <div className="flex items-center gap-4">
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="flex-1"
            />
            {selectedFile && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={removeSelectedFile}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {selectedFile && (
            <div className="text-sm text-muted-foreground">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="image-type">Image Type</Label>
          <select
            id="image-type"
            value={imageType}
            onChange={(e) => setImageType(e.target.value)}
            className="w-full p-2 border border-border rounded-md bg-background"
          >
            <option value="barrel_photo">Barrel Photo</option>
            <option value="warehouse_location">Warehouse Location</option>
            <option value="inspection_photo">Inspection Photo</option>
            <option value="certificate">Certificate/Documentation</option>
            <option disabled>── Provenance Documents ──</option>
            <option value="wowgr">WOWGR Certificate</option>
            <option value="cooperage_cert">Cooperage Certificate</option>
            <option value="delivery_order">Delivery Order</option>
            <option value="distillery_cert">Distillery Certificate</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Add a description for this image..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <Button 
          onClick={uploadImage}
          disabled={!selectedFile || isUploading}
          className="w-full"
        >
          {isUploading ? (
            "Uploading..."
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Image
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};