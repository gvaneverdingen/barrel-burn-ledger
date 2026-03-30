import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Shield, Loader2, Coins } from "lucide-react";

interface NftStatusCardProps {
  blockchainHash: string | null;
  nftTokenId: number | null;
  nftContractAddress: string | null;
  nftMintedAt: string | null;
  isMinting?: boolean;
  onMint?: () => void;
  canMint?: boolean;
}

const NftStatusCard = ({
  blockchainHash,
  nftTokenId,
  nftContractAddress,
  nftMintedAt,
  isMinting = false,
  onMint,
  canMint = false,
}: NftStatusCardProps) => {
  const isMinted = !!blockchainHash && nftTokenId !== null;
  const networkName = nftContractAddress?.startsWith("0x") ? "Polygon" : "Unknown";
  const hasBlockchainRecord = !!blockchainHash;
  
  // Use Amoy explorer for testnet (Chain ID 80002)
  const explorerBase = "https://amoy.polygonscan.com";

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Blockchain Provenance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isMinted ? (
          <>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                <Coins className="h-3 w-3 mr-1" />
                NFT Minted
              </Badge>
              <Badge variant="outline">{networkName}</Badge>
            </div>

            {nftTokenId !== null && (
              <div className="text-sm">
                <span className="text-muted-foreground">Token ID:</span>{" "}
                <span className="font-mono font-medium">#{nftTokenId}</span>
              </div>
            )}

            {nftContractAddress && (
              <div className="text-sm">
                <span className="text-muted-foreground">Contract:</span>{" "}
                <a
                  href={`${explorerBase}/address/${nftContractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-primary hover:underline text-xs"
                >
                  {nftContractAddress.slice(0, 6)}...{nftContractAddress.slice(-4)}
                  <ExternalLink className="inline h-3 w-3 ml-1" />
                </a>
              </div>
            )}

            {blockchainHash && (
              <div className="text-sm">
                <span className="text-muted-foreground">Tx Hash:</span>{" "}
                <a
                  href={`${explorerBase}/tx/${blockchainHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-primary hover:underline text-xs"
                >
                  {blockchainHash.slice(0, 10)}...{blockchainHash.slice(-6)}
                  <ExternalLink className="inline h-3 w-3 ml-1" />
                </a>
              </div>
            )}

            {nftMintedAt && (
              <div className="text-sm text-muted-foreground">
                Minted: {new Date(nftMintedAt).toLocaleDateString("en-GB", {
                  day: "numeric", month: "short", year: "numeric"
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Not Minted</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              This cask has not been tokenized on the blockchain yet.
            </p>

            {hasBlockchainRecord && blockchainHash && (
              <div className="text-sm">
                <span className="text-muted-foreground">Tx Hash:</span>{" "}
                <a
                  href={`${explorerBase}/tx/${blockchainHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-primary hover:underline text-xs"
                >
                  {blockchainHash.slice(0, 10)}...{blockchainHash.slice(-6)}
                  <ExternalLink className="inline h-3 w-3 ml-1" />
                </a>
              </div>
            )}

            {canMint && onMint && (
              <Button
                onClick={onMint}
                disabled={isMinting}
                size="sm"
                className="w-full"
              >
                {isMinting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Minting NFT...
                  </>
                ) : (
                  <>
                    <Coins className="h-4 w-4 mr-2" />
                    Mint as NFT
                  </>
                )}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default NftStatusCard;
