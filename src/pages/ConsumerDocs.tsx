import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Compass,
  Coins,
  Wallet,
  ShieldCheck,
  Heart,
  Repeat,
  Beaker,
  ArrowRight,
  Gavel,
} from "lucide-react";
import { Link } from "react-router-dom";

const ConsumerDocs = () => {
  return (
    <div className="container mx-auto p-6 space-y-8 max-w-6xl">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary text-primary">For Cask Owners</Badge>
          <Badge variant="secondary">Plain-English guide</Badge>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold luxury-text-gradient">Owner's Guide to Cask Whisky</h1>
        <p className="text-muted-foreground max-w-3xl">
          Everything you need to confidently buy, hold and eventually bottle or resell a maturing
          cask of whisky on ARIGI. No prior industry knowledge required.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: "#what", label: "What you actually own", icon: BookOpen },
          { href: "#buying", label: "How to buy a cask", icon: Compass },
          { href: "#holding", label: "Holding & maturation", icon: Beaker },
          { href: "#nft", label: "Your NFT certificate", icon: Coins },
          { href: "#selling", label: "Selling or bottling", icon: Repeat },
          { href: "#fees", label: "Fees, duty & tax", icon: Wallet },
          { href: "#safety", label: "Safety & verification", icon: ShieldCheck },
          { href: "#faq", label: "FAQ", icon: Heart },
        ].map((q) => (
          <a key={q.href} href={q.href}>
            <Card className="luxury-card hover:border-primary transition-colors h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <q.icon className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm font-medium">{q.label}</span>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      <section id="what" className="space-y-4 scroll-mt-24">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" /> What you actually own
        </h2>
        <Card className="luxury-card">
          <CardContent className="p-6 text-sm leading-relaxed space-y-3">
            <p>
              When you buy a cask on ARIGI you become the legal owner of a specific oak barrel of
              maturing whisky, identified by its cask number, fill date and warehouse location. The
              cask stays in a government-bonded warehouse — you don't take it home.
            </p>
            <p>
              Three things travel with the cask: the physical barrel itself, a paper trail held by
              the warehouse keeper (a Cask Delivery Order in your name), and a digital certificate
              (an NFT) on the Polygon blockchain that records its history publicly.
            </p>
            <p className="text-muted-foreground">
              You can later choose to sell the cask to another buyer, or instruct ARIGI to bottle it
              for you (typically 250–320 bottles from a hogshead at bottling strength).
            </p>
          </CardContent>
        </Card>
      </section>

      <section id="buying" className="space-y-4 scroll-mt-24">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Compass className="h-6 w-6 text-primary" /> How to buy a cask
        </h2>
        <Card className="luxury-card">
          <CardContent className="p-6 text-sm leading-relaxed space-y-3">
            <ol className="list-decimal pl-6 space-y-2">
              <li><strong>Browse the marketplace.</strong> Filter by region, age, cask type or price.</li>
              <li><strong>Open the cask page.</strong> Read the distillery profile, gauging data and on-chain provenance link.</li>
              <li><strong>Choose your route:</strong> "Buy at asking price" for an immediate purchase, or "Make an offer" to negotiate.</li>
              <li><strong>Pay securely.</strong> Card or bank transfer via Stripe; USDC/USDT on Polygon for crypto buyers.</li>
              <li><strong>Receive your certificate.</strong> Ownership transfers in your portfolio and on the warehouse record within minutes.</li>
            </ol>
            <div className="flex gap-2 pt-2">
              <Button asChild size="sm"><Link to="/marketplace">Browse marketplace</Link></Button>
              <Button asChild size="sm" variant="outline"><Link to="/wishlist">Your wishlist</Link></Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="holding" className="space-y-4 scroll-mt-24">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Beaker className="h-6 w-6 text-primary" /> Holding your cask & maturation
        </h2>
        <Card className="luxury-card">
          <CardContent className="p-6 text-sm leading-relaxed space-y-3">
            <p>While your cask matures in the warehouse, two natural changes happen each year:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Angel's share:</strong> roughly 1.5–2.5% of the liquid evaporates per year in Scottish dunnage warehouses.</li>
              <li><strong>Strength change:</strong> the alcohol percentage usually drifts down toward 60% ABV (lower in damp warehouses, higher in dry ones).</li>
            </ul>
            <p>
              The warehouse re-measures (regauges) your cask periodically — the latest figures show
              up on your cask page. Storage and insurance are included in the purchase price for the
              first agreed period; renewals are quoted before they fall due.
            </p>
          </CardContent>
        </Card>
      </section>

      <section id="nft" className="space-y-4 scroll-mt-24">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Coins className="h-6 w-6 text-primary" /> Your NFT certificate
        </h2>
        <Card className="luxury-card">
          <CardContent className="p-6 text-sm leading-relaxed space-y-3">
            <p>
              Every cask on ARIGI is registered as an NFT on the Polygon blockchain before it can be
              sold. The NFT is a tamper-proof public record of distillery, fill date, cask type and
              every change of ownership. You don't need a crypto wallet to own one — ARIGI custodies
              the token for you.
            </p>
            <p>
              Each cask page links to the Polygon block explorer so you (or anyone) can independently
              verify the certificate. When you eventually bottle the cask, the NFT is marked as
              redeemed so the historical record stays intact but the token can no longer be transferred.
            </p>
          </CardContent>
        </Card>
      </section>

      <section id="selling" className="space-y-4 scroll-mt-24">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Repeat className="h-6 w-6 text-primary" /> Selling on or bottling
        </h2>
        <Tabs defaultValue="resale">
          <TabsList>
            <TabsTrigger value="resale">Resell on the marketplace</TabsTrigger>
            <TabsTrigger value="bottle">Bottle the cask</TabsTrigger>
          </TabsList>
          <TabsContent value="resale">
            <Card className="luxury-card"><CardContent className="p-6 text-sm space-y-2">
              <p>From your portfolio, choose <em>Sell this cask</em>, set an asking price for the whole cask, and the listing goes live in the secondary marketplace. Buyers can purchase outright or send you offers — you'll be notified to accept, decline or counter.</p>
              <p>Resales are for whole casks only. Funds settle to your account after the warehouse confirms the title transfer.</p>
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="bottle">
            <Card className="luxury-card"><CardContent className="p-6 text-sm space-y-2">
              <p>When the spirit is mature you can request bottling. ARIGI co-ordinates with the warehouse and an approved bottler to disgorge, reduce to bottling strength, label and despatch.</p>
              <p>Typical yield from a refill hogshead at 12 years is around 250–320 bottles at 46% ABV. Bottling, labelling, UK Spirits Duty and VAT are quoted upfront before you confirm.</p>
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </section>

      <section id="fees" className="space-y-4 scroll-mt-24">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" /> Fees, duty & tax
        </h2>
        <Card className="luxury-card">
          <CardContent className="p-6 text-sm leading-relaxed space-y-3">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Buyer fee on a primary purchase:</strong> 11.5% combined (platform, transaction and distillery margin).</li>
              <li><strong>Reselling later:</strong> ~5% if paid in fiat, ~8.5% + 3% on-chain costs if paid in crypto.</li>
              <li><strong>Duty &amp; VAT:</strong> not payable while the cask sits in bond. They only apply when you bottle and remove the spirit from the warehouse.</li>
              <li><strong>Storage &amp; insurance:</strong> included in the asking price for the agreed period; renewal quotes are sent before expiry.</li>
            </ul>
            <p className="text-muted-foreground">Tax treatment of cask whisky depends on where you live — speak to a qualified adviser before buying for investment purposes.</p>
          </CardContent>
        </Card>
      </section>

      <section id="safety" className="space-y-4 scroll-mt-24">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" /> Safety & verification
        </h2>
        <Card className="luxury-card">
          <CardContent className="p-6 text-sm leading-relaxed space-y-3">
            <ul className="list-disc pl-6 space-y-1">
              <li>Every distillery on ARIGI is verified — licence number, beneficial owner and warehouse keeper checked before listings go live.</li>
              <li>The cask sits in a government-bonded warehouse, separate from ARIGI's balance sheet. If anything happened to ARIGI, your title with the warehouse keeper is unaffected.</li>
              <li>The NFT certificate gives you a public, independent audit trail you can verify at any time.</li>
              <li>Payments run through Stripe (PCI-DSS) or audited smart contracts on Polygon — ARIGI never sees your card or wallet keys.</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <section id="faq" className="space-y-4 scroll-mt-24">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" /> Owner FAQ
        </h2>
        <Card className="luxury-card">
          <CardContent className="p-6">
            <Accordion type="single" collapsible>
              <AccordionItem value="q1">
                <AccordionTrigger>Do I need a crypto wallet?</AccordionTrigger>
                <AccordionContent>No. ARIGI custodies the NFT for you. Crypto-savvy owners can request transfer to a self-custody wallet at any time.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="q2">
                <AccordionTrigger>Can I visit the cask?</AccordionTrigger>
                <AccordionContent>Often yes — request a warehouse visit or a sample draw from the cask page. Sample draws reduce the volume slightly and are billed separately.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="q3">
                <AccordionTrigger>What if the cask is damaged or leaks?</AccordionTrigger>
                <AccordionContent>Bonded warehouses carry insurance covering loss and damage in storage. Claims are settled to the registered owner of record.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="q4">
                <AccordionTrigger>Can I gift or transfer my cask?</AccordionTrigger>
                <AccordionContent>Yes. Use the transfer flow in your portfolio — the recipient must complete a quick KYC check before the warehouse re-titles the cask.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="q5">
                <AccordionTrigger>Is the asking price gross of duty?</AccordionTrigger>
                <AccordionContent>Yes. All marketplace prices are gross of UK Spirits Duty and VAT, which only crystallise when the cask leaves bond (typically on bottling).</AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </section>

      <Card className="luxury-card">
        <CardHeader>
          <CardTitle>Need a hand?</CardTitle>
          <CardDescription>Our concierge team can walk you through buying, holding and bottling.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild><Link to="/help">Open Help Center <ArrowRight className="h-4 w-4 ml-1" /></Link></Button>
          <Button asChild variant="outline"><Link to="/marketplace">Browse marketplace</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsumerDocs;