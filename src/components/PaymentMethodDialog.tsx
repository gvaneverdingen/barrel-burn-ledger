import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CreditCard, Coins, Wallet, ArrowRight, Shield, Info, CheckCircle, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type PaymentMethod = "stripe" | "usdc" | "usdt";
type WalletSource = "magic" | "external";

interface PaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caskName: string;
  totalPrice: number;
  saleId: string | null;
  caskId: string;
  isPrimary: boolean;
  onStripeCheckout: () => void;
  walletAddress?: string | null;
}

const paymentOptions: { id: PaymentMethod; label: string; icon: any; description: string; badge?: string }[] = [
  {
    id: "stripe",
    label: "Card Payment (Stripe)",
    icon: CreditCard,
    description: "Pay with credit/debit card via Stripe",
    badge: "Fiat",
  },
  {
    id: "native",
    label: "MATIC / POL",
    icon: Coins,
    description: "Pay with native Polygon token",
    badge: "Crypto",
  },
  {
    id: "usdc",
    label: "USDC Stablecoin",
    icon: Coins,
    description: "Pay with USD Coin on Polygon",
    badge: "Stablecoin",
  },
  {
    id: "usdt",
    label: "USDT Stablecoin",
    icon: Coins,
    description: "Pay with Tether on Polygon",
    badge: "Stablecoin",
  },
];

export const PaymentMethodDialog = ({
  open,
  onOpenChange,
  caskName,
  totalPrice,
  saleId,
  caskId,
  isPrimary,
  onStripeCheckout,
  walletAddress,
}: PaymentMethodDialogProps) => {
  const { formatPrice } = useCurrency();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [walletSource, setWalletSource] = useState<WalletSource>("magic");
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<"method" | "wallet" | "confirm" | "pending">("method");
  const [txDetails, setTxDetails] = useState<any>(null);
  const [approvalRequired, setApprovalRequired] = useState<any>(null);

  const resetDialog = () => {
    setSelectedMethod(null);
    setStep("method");
    setProcessing(false);
    setTxDetails(null);
    setApprovalRequired(null);
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    if (method === "stripe") {
      onOpenChange(false);
      resetDialog();
      onStripeCheckout();
    } else {
      setStep("wallet");
    }
  };

  const handleWalletSelect = (source: WalletSource) => {
    setWalletSource(source);
    setStep("confirm");
  };

  const handleBlockchainPurchase = async () => {
    if (!selectedMethod || !saleId) return;
    setProcessing(true);

    try {
      // Determine wallet address
      let activeWallet = walletAddress;

      if (!activeWallet) {
        if (walletSource === "external") {
          // Request external wallet connection
          if (typeof window !== "undefined" && (window as any).ethereum) {
            const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
            activeWallet = accounts[0];

            // Switch to Polygon Amoy
            try {
              await (window as any).ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: "0x13882" }], // 80002 in hex
              });
            } catch (switchError: any) {
              if (switchError.code === 4902) {
                await (window as any).ethereum.request({
                  method: "wallet_addEthereumChain",
                  params: [{
                    chainId: "0x13882",
                    chainName: "Polygon Amoy Testnet",
                    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
                    rpcUrls: ["https://rpc-amoy.polygon.technology"],
                    blockExplorerUrls: ["https://amoy.polygonscan.com"],
                  }],
                });
              }
            }
          } else {
            toast.error("No wallet detected. Please install MetaMask or use Magic wallet.");
            setProcessing(false);
            return;
          }
        } else {
          toast.error("Magic wallet not connected. Please connect your wallet first.");
          setProcessing(false);
          return;
        }
      }

      // Call the blockchain-purchase edge function
      const { data, error } = await supabase.functions.invoke("blockchain-purchase", {
        body: {
          saleId,
          paymentMethod: selectedMethod,
          walletAddress: activeWallet,
        },
      });

      if (error) throw error;

      if (data.requiresApproval) {
        setApprovalRequired(data.approvalDetails);
        setStep("pending");
        setProcessing(false);
        return;
      }

      if (!data.success) throw new Error(data.error || "Purchase preparation failed");

      setTxDetails(data);

      // Now execute the transaction from the user's wallet
      let txHash: string;

      if (walletSource === "external" && (window as any).ethereum) {
        const { ethers } = await import("https://esm.sh/ethers@6.13.4" as any);
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();

        if (data.txType === "native_marketplace" || data.txType === "erc20_marketplace") {
          const contract = new ethers.Contract(data.to, data.abi, signer);
          const tx = data.txType === "native_marketplace"
            ? await contract[data.functionName](...data.args, { value: BigInt(data.value) })
            : await contract[data.functionName](...data.args);
          txHash = tx.hash;
          toast.info("Transaction submitted! Waiting for confirmation...");
          await tx.wait();
        } else if (data.txType === "native_direct") {
          const tx = await signer.sendTransaction({
            to: data.to,
            value: BigInt(data.value),
          });
          txHash = tx.hash;
          toast.info("Transaction submitted! Waiting for confirmation...");
          await tx.wait();
        } else if (data.txType === "erc20_direct") {
          const erc20 = new ethers.Contract(data.tokenAddress, data.abi, signer);
          const tx = await erc20.transfer(data.to, BigInt(data.amount));
          txHash = tx.hash;
          toast.info("Transaction submitted! Waiting for confirmation...");
          await tx.wait();
        } else {
          throw new Error("Unknown transaction type");
        }
      } else {
        // Magic wallet — we'd use Magic SDK provider here
        // For now, show instructions
        toast.error("Magic wallet blockchain payments coming soon. Please use an external wallet or Stripe.");
        setProcessing(false);
        return;
      }

      // Confirm the purchase with the backend
      const { data: confirmData, error: confirmError } = await supabase.functions.invoke("confirm-blockchain-purchase", {
        body: {
          transactionId: data.transactionId,
          blockchainTxHash: txHash!,
        },
      });

      if (confirmError) throw confirmError;

      if (confirmData.confirmed) {
        toast.success("Purchase confirmed! 🎉 The cask has been added to your portfolio.");
        onOpenChange(false);
        resetDialog();
        // Reload the page to show updated ownership
        window.location.reload();
      } else {
        toast.info(confirmData.message || "Transaction is being processed...");
      }
    } catch (error: any) {
      console.error("Blockchain purchase error:", error);
      
      if (error.code === 4001 || error.message?.includes("rejected")) {
        toast.error("Transaction was rejected by the user.");
      } else {
        toast.error(error.message || "Blockchain payment failed. Please try again.");
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetDialog(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Choose Payment Method
          </DialogTitle>
          <DialogDescription>
            Purchase <span className="font-semibold">{caskName}</span> for {formatPrice(totalPrice)}
          </DialogDescription>
        </DialogHeader>

        {step === "method" && (
          <div className="space-y-3">
            {paymentOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Card
                  key={option.id}
                  className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm"
                  onClick={() => handleMethodSelect(option.id)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{option.label}</span>
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                          {option.badge}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              );
            })}

            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
              <Shield className="h-3.5 w-3.5" />
              <span>All transactions are recorded on the Polygon blockchain</span>
            </div>
          </div>
        )}

        {step === "wallet" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Choose how to connect your wallet:</p>

            <Card
              className="cursor-pointer transition-all hover:border-primary/50"
              onClick={() => handleWalletSelect("external")}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <span className="font-medium text-sm">External Wallet</span>
                  <p className="text-xs text-muted-foreground">MetaMask, Rabby, etc.</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>

            {walletAddress && (
              <Card
                className="cursor-pointer transition-all hover:border-primary/50"
                onClick={() => handleWalletSelect("magic")}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Coins className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-sm">Magic Wallet</span>
                    <p className="text-xs text-muted-foreground font-mono">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            )}

            <Button variant="ghost" className="w-full" onClick={() => setStep("method")}>
              ← Back
            </Button>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cask</span>
                <span className="font-medium">{caskName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-medium">{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment</span>
                <Badge variant="outline" className="text-xs">
                  {selectedMethod === "native" ? "MATIC" : selectedMethod?.toUpperCase()}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wallet</span>
                <span className="text-xs">{walletSource === "external" ? "External Wallet" : "Magic Wallet"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network</span>
                <span className="text-xs">Polygon Amoy (Testnet)</span>
              </div>
            </div>

            <TooltipProvider>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5" />
                <span>Platform fee: 5% · Settled on-chain via smart contract escrow</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[250px] text-xs">
                    <p>Blockchain payments go through the CaskMarketplace smart contract which handles escrow, fee splitting, and NFT transfer atomically in a single transaction.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("wallet")} disabled={processing}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleBlockchainPurchase} disabled={processing}>
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Purchase
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "pending" && approvalRequired && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-600">Token Approval Required</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Before purchasing, you need to approve the marketplace contract to spend{" "}
                  <strong>{approvalRequired.amountFormatted} {approvalRequired.tokenSymbol}</strong>.
                </p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1 font-mono">
              <p>Contract: {approvalRequired.spender?.slice(0, 10)}...</p>
              <p>Token: {approvalRequired.tokenAddress?.slice(0, 10)}...</p>
              <p>Amount: {approvalRequired.amountFormatted} {approvalRequired.tokenSymbol}</p>
            </div>

            <Button className="w-full" onClick={async () => {
              try {
                setProcessing(true);
                if ((window as any).ethereum) {
                  const { ethers } = await import("https://esm.sh/ethers@6.13.4" as any);
                  const provider = new ethers.BrowserProvider((window as any).ethereum);
                  const signer = await provider.getSigner();
                  const erc20 = new ethers.Contract(
                    approvalRequired.tokenAddress,
                    ["function approve(address spender, uint256 amount) external returns (bool)"],
                    signer
                  );
                  const tx = await erc20.approve(approvalRequired.spender, BigInt(approvalRequired.amount));
                  toast.info("Approval transaction submitted...");
                  await tx.wait();
                  toast.success("Approval confirmed! You can now proceed with the purchase.");
                  setApprovalRequired(null);
                  setStep("confirm");
                }
              } catch (e: any) {
                toast.error(e.message || "Approval failed");
              } finally {
                setProcessing(false);
              }
            }} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                `Approve ${approvalRequired.tokenSymbol}`
              )}
            </Button>

            <Button variant="ghost" className="w-full" onClick={() => { setStep("method"); setApprovalRequired(null); }}>
              ← Choose Different Payment
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentMethodDialog;