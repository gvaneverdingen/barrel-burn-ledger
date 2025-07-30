-- Create storage bucket for cask images
INSERT INTO storage.buckets (id, name, public) VALUES ('cask-images', 'cask-images', true);

-- Create table for cask images
CREATE TABLE public.cask_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cask_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  image_type TEXT DEFAULT 'barrel_photo',
  description TEXT,
  uploaded_by UUID NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on cask_images
ALTER TABLE public.cask_images ENABLE ROW LEVEL SECURITY;

-- Create policies for cask images
CREATE POLICY "Anyone can view cask images" 
ON public.cask_images 
FOR SELECT 
USING (true);

CREATE POLICY "Distilleries can upload images for their casks" 
ON public.cask_images 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM casks c 
    JOIN distilleries d ON c.distillery_id = d.id 
    WHERE c.id = cask_id AND d.profile_id = auth.uid()
  )
);

CREATE POLICY "Distilleries can update images for their casks" 
ON public.cask_images 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM casks c 
    JOIN distilleries d ON c.distillery_id = d.id 
    WHERE c.id = cask_id AND d.profile_id = auth.uid()
  )
);

CREATE POLICY "Distilleries can delete images for their casks" 
ON public.cask_images 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM casks c 
    JOIN distilleries d ON c.distillery_id = d.id 
    WHERE c.id = cask_id AND d.profile_id = auth.uid()
  )
);

-- Create storage policies for cask images
CREATE POLICY "Anyone can view cask images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'cask-images');

CREATE POLICY "Authenticated users can upload cask images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'cask-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own uploaded images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'cask-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own uploaded images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'cask-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add trigger for updating timestamps
CREATE TRIGGER update_cask_images_updated_at
BEFORE UPDATE ON public.cask_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();