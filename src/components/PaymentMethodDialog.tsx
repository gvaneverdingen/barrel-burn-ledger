import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CreditCard, Coins, Wallet, ArrowRight, Shield, Info, CheckCircle, AlertCircle, QrCode } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { connectWallet, type Eip1193Provider } from "@/lib/walletProvider";
import { FundWalletPanel } from "@/components/FundWalletPanel";

type PaymentMethod = "stripe" | "usdc" | "usdt";
type WalletSource = "magic" | "external" | "walletconnect";

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
    id: "usdc",
    label: "USDC Stablecoin",
    icon: Coins,
    description: "Pay with native USDC (Circle) on Polygon — real funds, settles on-chain",
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
  const [walletSource, setWalletSource] = useState<WalletSource>("walletconnect");
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<"method" | "wallet" | "confirm" | "pending">("method");
  const [txDetails, setTxDetails] = useState<any>(null);
  const [approvalRequired, setApprovalRequired] = useState<any>(null);
  const providerRef = useRef<Eip1193Provider | null>(null);
  const [kycStatus, setKycStatus] = useState<string>("loading");

  const resetDialog = () => {
    setSelectedMethod(null);
    setStep("method");
    setProcessing(false);
    setTxDetails(null);
    setApprovalRequired(null);
    providerRef.current = null;
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    if (method === "stripe") {
      onOpenChange(false);
      resetDialog();
      onStripeCheckout();
    } else {
      setStep("wallet");
      setKycStatus("loading");
      supabase.auth.getUser().then(async ({ data }) => {
        if (!data.user) return setKycStatus("not signed in");
        const { data: p } = await supabase
          .from("profiles")
          .select("verification_status")
          .eq("id", data.user.id)
          .maybeSingle();
        setKycStatus(p?.verification_status || "pending");
      });
    }
  };

  const handleWalletSelect = (source: WalletSource) => {
    if (source !== walletSource) providerRef.current = null;
    setWalletSource(source);
    setStep("confirm");
  };

  const handleBlockchainPurchase = async () => {
    if (!selectedMethod || !saleId) return;
    setProcessing(true);

    try {
      if (walletSource === "magic") {
        toast.error("Magic wallet blockchain payments coming soon. Please use an external wallet or Stripe.");
        setProcessing(false);
        return;
      }

      // Connect the chosen wallet (browser extension or WalletConnect QR)
      let provider = providerRef.current;
      let activeWallet: string | null | undefined = null;
      if (!provider) {
        try {
          const conn = await connectWallet(walletSource);
          provider = conn.provider;
          providerRef.current = provider;
          activeWallet = conn.address;
        } catch (e: any) {
          toast.error(e?.message || "Could not connect wallet");
          setProcessing(false);
          return;
        }
      } else {
        // Pay from the wallet the buyer actually connected (and funded)
        const accts: string[] = await provider.request({ method: "eth_accounts" });
        activeWallet = accts?.[0];
      }
      if (!activeWallet) activeWallet = walletAddress;

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

      // Execute the transaction from the user's wallet
      let txHash: string;
      {
        const { ethers } = await import("https://esm.sh/ethers@6.13.4" as any);
        const bp = new ethers.BrowserProvider(provider);
        const signer = await bp.getSigner();

        if (data.txType === "erc20_marketplace") {
          const contract = new ethers.Contract(data.to, data.abi, signer);
          const tx = await contract[data.functionName](...data.args);
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
                  role="button"
                  tabIndex={0}
                  aria-label={`Pay with ${option.label}`}
                  className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onClick={() => handleMethodSelect(option.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleMethodSelect(option.id);
                    }
                  }}
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

        {step === "wallet" && kycStatus !== "verified" && (
          <div className="space-y-3" role="alert">
            <div className="flex gap-2 rounded-md border border-primary/40 bg-primary/10 p-3 text-sm">
              <Shield className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <div>
                <p className="font-medium">Identity verification (KYC) required</p>
                <p className="text-muted-foreground mt-1">
                  Connecting a wallet doesn't replace identity checks. To comply with anti-money-laundering rules,
                  every buyer must complete KYC before paying with USDC.
                  {kycStatus === "loading" ? " Checking your status…" : ` Current status: ${kycStatus}.`}
                </p>
              </div>
            </div>
            {kycStatus === "not signed in" ? (
              <Button className="w-full" onClick={() => { window.location.href = "/auth"; }}>Sign in to verify</Button>
            ) : kycStatus !== "loading" && (
              <div className="max-h-[55vh] overflow-y-auto rounded-md border border-border p-3">
                <KycForm
                  onStatusChange={async () => {
                    const { data } = await supabase.auth.getUser();
                    if (!data.user) return;
                    const { data: p } = await supabase.from("profiles").select("verification_status").eq("id", data.user.id).maybeSingle();
                    setKycStatus(p?.verification_status || "pending");
                  }}
                />
              </div>
            )}
            <Button variant="outline" className="w-full" onClick={() => setStep("method")}>
              Back to payment methods
            </Button>
          </div>
        )}

        {step === "wallet" && kycStatus === "verified" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Choose how to connect your wallet:</p>


            <Card
              role="button"
              tabIndex={0}
              aria-label="Connect an external wallet"
              className="cursor-pointer transition-all hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => handleWalletSelect("external")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleWalletSelect("external");
                }
              }}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <span className="font-medium text-sm">Browser Wallet</span>
                  <p className="text-xs text-muted-foreground">MetaMask, Rabby, Brave, Coinbase extension</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>

            <Card
              role="button"
              tabIndex={0}
              aria-label="Connect a mobile wallet with a QR code"
              className="cursor-pointer transition-all hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => handleWalletSelect("walletconnect")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleWalletSelect("walletconnect");
                }
              }}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <QrCode className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <span className="font-medium text-sm">Mobile Wallet (QR code)</span>
                  <p className="text-xs text-muted-foreground">Trust, Rainbow, MetaMask Mobile, Ledger Live and 300+ more via WalletConnect</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>

            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              Your wallet must be on the Polygon network and hold enough of the chosen stablecoin plus a little POL for network fees.
            </p>

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
                  {selectedMethod?.toUpperCase()}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wallet</span>
                <span className="text-xs">{walletSource === "walletconnect" ? "Mobile Wallet (QR)" : "Browser Wallet"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network</span>
                <span className="text-xs">Polygon</span>
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

            <FundWalletPanel
              requiredUsd={totalPrice}
              getAddress={async () => {
                try {
                  const conn = await connectWallet(walletSource === "walletconnect" ? "walletconnect" : "external");
                  providerRef.current = conn.provider;
                  return conn.address;
                } catch (e: any) {
                  toast.error(e?.message || "Could not connect wallet");
                  return null;
                }
              }}
            />

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
                let wp = providerRef.current;
                if (!wp) { wp = (await connectWallet(walletSource === "walletconnect" ? "walletconnect" : "external")).provider; providerRef.current = wp; }
                {
                  const { ethers } = await import("https://esm.sh/ethers@6.13.4" as any);
                  const provider = new ethers.BrowserProvider(wp);
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