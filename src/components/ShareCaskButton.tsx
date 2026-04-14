import { Share2, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface ShareCaskButtonProps {
  caskName: string;
  caskId: string;
}

export const ShareCaskButton = ({ caskName, caskId }: ShareCaskButtonProps) => {
  const { toast } = useToast();
  const url = `${window.location.origin}/cask/${caskId}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    toast({ title: 'Link copied to clipboard' });
  };

  const nativeShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: caskName, url });
    } else {
      copyLink();
    }
  };

  const shareToX = () =>
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(caskName)}&url=${encodeURIComponent(url)}`, '_blank');

  const shareToLinkedIn = () =>
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');

  const shareToWhatsApp = () =>
    window.open(`https://wa.me/?text=${encodeURIComponent(`${caskName} ${url}`)}`, '_blank');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={copyLink}>
          <Copy className="h-4 w-4 mr-2" /> Copy Link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={nativeShare}>
          <ExternalLink className="h-4 w-4 mr-2" /> Share…
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToX}>𝕏 Post on X</DropdownMenuItem>
        <DropdownMenuItem onClick={shareToLinkedIn}>in LinkedIn</DropdownMenuItem>
        <DropdownMenuItem onClick={shareToWhatsApp}>💬 WhatsApp</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
