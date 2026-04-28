import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, RotateCcw, Loader2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface SelfieCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCaptured?: (publicUrl: string) => void;
  bucket?: string;
  pathPrefix?: string;
}

/**
 * SelfieCapture
 * Opens the device camera (front-facing when available), lets the user take a
 * still frame, then uploads it to Supabase Storage. Works on desktop browsers
 * and mobile devices that support `navigator.mediaDevices.getUserMedia`.
 */
export const SelfieCapture = ({
  open,
  onOpenChange,
  onCaptured,
  bucket = "cask-images",
  pathPrefix = "selfies",
}: SelfieCaptureProps) => {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [starting, setStarting] = useState(false);
  const [streamReady, setStreamReady] = useState(false);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStreamReady(false);
  };

  const startCamera = async () => {
    setError(null);
    setStarting(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera API not supported in this browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setStreamReady(true);
    } catch (err: any) {
      console.error("Camera error:", err);
      const msg =
        err?.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access in your browser settings."
          : err?.name === "NotFoundError"
          ? "No camera found on this device."
          : err?.message || "Could not access camera.";
      setError(msg);
    } finally {
      setStarting(false);
    }
  };

  // Start camera when dialog opens; clean up when it closes.
  useEffect(() => {
    if (open) {
      setCapturedDataUrl(null);
      startCamera();
    } else {
      stopStream();
      setCapturedDataUrl(null);
      setError(null);
    }
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Mirror so the saved image matches what the user saw on screen
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedDataUrl(dataUrl);
    stopStream();
  };

  const handleRetake = () => {
    setCapturedDataUrl(null);
    startCamera();
  };

  const handleFallbackFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCapturedDataUrl(reader.result as string);
      stopStream();
    };
    reader.readAsDataURL(file);
  };

  const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
    const res = await fetch(dataUrl);
    return await res.blob();
  };

  const handleUpload = async () => {
    if (!capturedDataUrl || !user) return;
    setUploading(true);
    try {
      const blob = await dataUrlToBlob(capturedDataUrl);
      const path = `${pathPrefix}/${user.id}/selfie-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      onCaptured?.(publicUrl);
      toast({ title: "Selfie uploaded", description: "Your selfie has been submitted for review." });
      onOpenChange(false);
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({
        title: "Upload failed",
        description: err?.message || "Could not upload selfie.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" /> Take Identity Selfie
          </DialogTitle>
          <DialogDescription>
            Hold your government ID next to your face and look directly at the camera.
          </DialogDescription>
        </DialogHeader>

        <div className="relative w-full aspect-[4/3] bg-muted rounded-lg overflow-hidden flex items-center justify-center">
          {!capturedDataUrl ? (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover scale-x-[-1]"
              />
              {(starting || !streamReady) && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
              {error && (
                <div className="absolute inset-0 p-4 flex flex-col items-center justify-center text-center bg-background/90">
                  <X className="h-8 w-8 text-destructive mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">{error}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={startCamera}>
                      Try again
                    </Button>
                    <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-1" /> Upload photo
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <img src={capturedDataUrl} alt="Selfie preview" className="w-full h-full object-cover" />
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={handleFallbackFile}
        />

        <DialogFooter className="gap-2 sm:gap-2">
          {!capturedDataUrl ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
                Cancel
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-1" /> Upload instead
              </Button>
              <Button onClick={handleCapture} disabled={!streamReady}>
                <Camera className="h-4 w-4 mr-1" /> Capture
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleRetake} disabled={uploading}>
                <RotateCcw className="h-4 w-4 mr-1" /> Retake
              </Button>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-1" /> Submit selfie
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SelfieCapture;