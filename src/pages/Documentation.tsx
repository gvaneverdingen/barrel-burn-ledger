import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Workflow,
  Coins,
  ShieldCheck,
  ScrollText,
  Boxes,
  ArrowRight,
  Beaker,
  Warehouse,
  Gavel,
} from "lucide-react";
import { Link } from "react-router-dom";

const Documentation = () => {
  return (
    <div className="container mx-auto p-6 space-y-8 max-w-6xl">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary text-primary">For Distilleries</Badge>
          <Badge variant="secondary">Industry-grade reference</Badge>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold luxury-text-gradient">Distillery Documentation</h1>
        <p className="text-muted-foreground max-w-3xl">
          A working reference for production teams, warehouse managers and commercial leads listing
          maturing stock on ARIGI. Assumes familiarity with OFC/RL fills, RW/HMRC bonded warehousing,
          OBSC numbering, regauging and the Scotch Whisky Regulations 2009.
        </p>
      </header>

      {/* Quick navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: "#onboarding", label: "Onboarding & verification", icon: ShieldCheck },
          { href: "#listing", label: "Listing maturing stock", icon: Boxes },
          { href: "#nft", label: "NFT provenance", icon: Coins },
          { href: "#fees", label: "Fees & payouts", icon: Workflow },
          { href: "#data", label: "Data fields reference", icon: FileText },
          { href: "#regulatory", label: "Regulatory notes", icon: Gavel },
          { href: "#warehouse", label: "Warehouse & gauging", icon: Warehouse },
          { href: "#faq", label: "Distiller FAQ", icon: ScrollText },
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

      {/* Onboarding */}
      <section id="onboarding" className="space-y-4 scroll-mt-24">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" /> Onboarding & verification
        </h2>
        <Card className="luxury-card">
          <CardContent className="p-6 space-y-4 text-sm leading-relaxed">
            <p>
              Verification grants the <code>distillery</code> role and unlocks cask creation, NFT
              minting and the marketplace listing flow. Submit:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Distillery name, country and year of establishment</li>
              <li>Spirit producer / rectifier licence number (e.g. HMRC AWRS / SWA membership ref)</li>
              <li>Bonded warehouse keeper (own RW or a third-party general storage warehouse)</li>
              <li>Beneficial owner ID for KYB and the signing officer for sale contracts</li>
              <li>Stripe Connect onboarding for fiat payouts (Express account)</li>
            </ul>
            <p className="text-muted-foreground">
              Review SLA is typically 2–3 business days. Until verified the dashboard runs in demo
              mode with sample inventory so the team can familiarise themselves with the workflow.
            </p>
            <div className="flex gap-2 pt-2">
              <Button asChild size="sm"><Link to="/distillery/verification">Verification status</Link></Button>
              <Button asChild size="sm" variant="outline"><Link to="/distillery/onboarding">Apply / update</Link></Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Listing */}
      <section id="listing" className="space-y-4 scroll-mt-24">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Boxes className="h-6 w-6 text-primary" /> Listing maturing stock
        </h2>
        <Card className="luxury-card">
          <CardContent className="p-6 space-y-3 text-sm leading-relaxed">
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                <strong>Create the cask record.</strong> Capture cask number (your internal reference),
                fill date, original cask type (ex-bourbon barrel, hogshead, sherry butt, puncheon,
                quarter cask, etc.), spirit name, RLA at fill is recommended in notes.
              </li>
              <li>
                <strong>Enter live gauging data.</strong> Current bulk litres (BL), strength (% abv at
                20&deg;C — OIML reference) and last regauging date. The trigger
                <code> validate_cask_pricing</code> rejects sale listings missing BL, abv, total price
                or price-per-litre.
              </li>
              <li>
                <strong>Mint the provenance NFT.</strong> Mandatory before the cask becomes visible on
                the marketplace. Server-side mint on Polygon Amoy via the platform wallet — no
                MetaMask required (see NFT provenance below).
              </li>
              <li>
                <strong>Set the asking price.</strong> Whole-cask total only. Per-litre is derived for
                buyer reference but the platform sells whole casks; partial vat-outs are handled
                off-platform.
              </li>
              <li>
                <strong>Publish.</strong> The listing surfaces in Marketplace, Matchmaking and the
                public distillery profile (<code>distilleries_public</code> view).
              </li>
            </ol>
            <p className="text-muted-foreground">
              Tip: keep finishing notes accurate. <code>has_been_finished</code>,
              <code> finishing_cask_type</code> and <code>finishing_duration_months</code> drive
              filtering and influence buyer-facing rarity grading.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* NFT provenance */}
      <section id="nft" className="space-y-4 scroll-mt-24">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Coins className="h-6 w-6 text-primary" /> NFT provenance (Polygon Amoy)
        </h2>
        <Card className="luxury-card">
          <CardContent className="p-6 space-y-3 text-sm leading-relaxed">
            <p>
              Every cask is tokenised as an ERC-721 (<code>CaskNFT</code>) before sale. Metadata mirrors
              the on-platform record: distillery, fill date, OBSC, cask type, ABV at mint, BL at mint
              and a SHA-256 hash of the regauge document. Transfers (primary sale, resale, bottling
              redemption) are recorded on-chain so buyers can audit chain-of-custody independently.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Network: <strong>Polygon Amoy testnet</strong> (chainId 80002). Mainnet migration is on the roadmap.</li>
              <li>Minting: server-side via Edge Function using the platform private key — distillery does not pay gas.</li>
              <li>Authorisation: <code>distillery</code> and <code>administrator</code> roles only.</li>
              <li>Rarity tier is computed from age, finish and single-barrel flag (Exceptional 21+, Premium 18+, etc.).</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Fees */}
      <section id="fees" className="space-y-4 scroll-mt-24">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Workflow className="h-6 w-6 text-primary" /> Fees, splits & payouts
        </h2>
        <Card className="luxury-card">
          <CardContent className="p-6 space-y-3 text-sm leading-relaxed">
            <p>Pricing is gross of duty. Duty + VAT remain suspended while the cask sits in bond.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-md">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left p-2">Flow</th>
                    <th className="text-left p-2">Platform</th>
                    <th className="text-left p-2">Transaction</th>
                    <th className="text-left p-2">Distillery margin</th>
                    <th className="text-left p-2">Total buyer fee</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td className="p-2">Primary sale</td><td className="p-2">2.5%</td>
                    <td className="p-2">1.5%</td><td className="p-2">5.0%</td><td className="p-2 font-medium">11.5%</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="p-2">Resale (Stripe)</td><td className="p-2">2.5%</td>
                    <td className="p-2">1.5%</td><td className="p-2">—</td><td className="p-2 font-medium">~5%</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="p-2">Resale (USDC/USDT)</td><td className="p-2">2.5% + 3% on-chain</td>
                    <td className="p-2">1.5%</td><td className="p-2">—</td><td className="p-2 font-medium">~8.5% + 3%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Distillery margin is paid out automatically through Stripe Connect on settlement.
              Pending vs completed transfers are visible on the Sales Analytics dashboard. Crypto
              payouts settle to the registered platform treasury and are reconciled to your Stripe
              account in fiat.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Data fields */}
      <section id="data" className="space-y-4 scroll-mt-24">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" /> Cask data field reference
        </h2>
        <Card className="luxury-card">
          <CardContent className="p-6 text-sm">
            <div className="overflow-x-auto">
              <table className="w-full border border-border rounded-md">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left p-2">Field</th>
                    <th className="text-left p-2">Meaning</th>
                    <th className="text-left p-2">Required for sale</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["cask_number", "Distillery's internal OBSC / cask reference", "Yes"],
                    ["distillation_date", "Fill date (ISO). Drives age_years and grading", "Yes"],
                    ["original_cask_type", "First-fill bourbon barrel, refill hogshead, sherry butt, etc.", "Yes"],
                    ["finishing_cask_type", "Secondary maturation wood, if any", "Optional"],
                    ["finishing_duration_months", "Length of finish in months", "Optional"],
                    ["current_volume_liters", "Bulk litres at last regauge (BL)", "Yes"],
                    ["alcohol_percentage", "Strength %abv at last regauge (20°C reference)", "Yes"],
                    ["last_gauging_date", "Date of most recent regauge (HMRC W1/W5 evidence)", "Recommended"],
                    ["warehouse_location", "Bonded warehouse + bay/rack reference", "Yes"],
                    ["price_per_liter", "Derived for display", "Yes"],
                    ["total_price", "Whole-cask asking price (gross of duty/VAT)", "Yes"],
                    ["region", "Speyside, Highland, Islay, Campbeltown, Lowland, Islands", "Recommended"],
                    ["is_single_barrel", "Single-cask provenance flag", "Optional"],
                    ["nft_token_id", "Set automatically on mint", "Auto"],
                  ].map(([f, m, r]) => (
                    <tr key={f} className="border-t border-border align-top">
                      <td className="p-2"><code>{f}</code></td>
                      <td className="p-2">{m}</td>
                      <td className="p-2">{r}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Regulatory */}
      <section id="regulatory" className="space-y-4 scroll-mt-24">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Gavel className="h-6 w-6 text-primary" /> Regulatory & compliance notes
        </h2>
        <Tabs defaultValue="scotch">
          <TabsList>
            <TabsTrigger value="scotch">Scotch Whisky Regs 2009</TabsTrigger>
            <TabsTrigger value="duty">Duty & VAT</TabsTrigger>
            <TabsTrigger value="title">Title & WOWGR</TabsTrigger>
          </TabsList>
          <TabsContent value="scotch">
            <Card className="luxury-card"><CardContent className="p-6 text-sm space-y-2">
              <p>For a spirit to be marketed as Scotch on ARIGI it must comply with the Scotch Whisky Regulations 2009:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Distilled in Scotland from water and malted barley (other whole grains permitted).</li>
                <li>Distilled to less than 94.8% abv.</li>
                <li>Matured in oak casks of capacity not exceeding 700 litres in an excise warehouse in Scotland.</li>
                <li>Minimum maturation of three years; the age statement reflects the youngest spirit.</li>
                <li>Bottled at no less than 40% abv. Only water and plain caramel (E150A) may be added.</li>
              </ul>
              <p className="text-muted-foreground">Equivalent regional rules apply for Irish Whiskey GI, Bourbon (TTB 27 CFR §5), Japanese Whisky JSLMA standard, etc. Tag the spirit accordingly so listings are not mis-categorised.</p>
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="duty">
            <Card className="luxury-card"><CardContent className="p-6 text-sm space-y-2">
              <p>Listings are quoted gross of duty. Duty (UK Spirits Duty £31.64/LPA from Aug 2023, subject to change) and VAT crystallise only on warehouse removal — typically on bottling or on a non-bonded transfer.</p>
              <p>Movements between approved warehouse keepers under EMCS / W8 keep duty suspended. ARIGI never takes physical custody; ownership transfer is recorded against the warehouse keeper's stock record.</p>
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="title">
            <Card className="luxury-card"><CardContent className="p-6 text-sm space-y-2">
              <p>On primary sale, the distillery transfers beneficial ownership to the buyer and a Cask Delivery Order is lodged with the warehouse keeper. The warehouse holds the cask under the buyer's account but the distillery (or another approved person) remains the WOWGR-authorised owner of record where required.</p>
              <p>Resales executed on ARIGI generate an updated CDO and an on-chain transfer event. Bottling instructions are signed by the current owner and routed to the warehouse for disgorging, reduction, labelling, duty payment and despatch.</p>
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </section>

      {/* Warehouse */}
      <section id="warehouse" className="space-y-4 scroll-mt-24">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Warehouse className="h-6 w-6 text-primary" /> Warehouse, gauging & evaporation
        </h2>
        <Card className="luxury-card">
          <CardContent className="p-6 space-y-3 text-sm leading-relaxed">
            <p>
              Maintain regauge cycles on a sensible cadence (annual is conventional; every 2 years is
              acceptable for slow-moving stock). Update <code>current_volume_liters</code>,
              <code> alcohol_percentage</code> and <code>last_gauging_date</code> after each cycle —
              ARIGI surfaces the regauge date on the buyer-facing card.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Angel's share: typically 1.5–2.5% volume p.a. in Scottish dunnage; higher in racked or warmer climates.</li>
              <li>Strength typically drifts down toward 60% abv from a high-strength fill at ~63.5% abv; bourbon casks may climb in arid warehouses.</li>
              <li>RLA (regauged litres of alcohol) = BL × abv ÷ 100. Use this for valuation cross-checks.</li>
              <li>Trigger <code>validate_cask_pricing</code> blocks listings if BL ≤ 0 or abv outside 0–100%.</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* FAQ */}
      <section id="faq" className="space-y-4 scroll-mt-24">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Beaker className="h-6 w-6 text-primary" /> Distiller FAQ
        </h2>
        <Card className="luxury-card">
          <CardContent className="p-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="q1">
                <AccordionTrigger>Can we list partial cask shares?</AccordionTrigger>
                <AccordionContent>
                  No. ARIGI is a whole-cask marketplace by policy — both primary and secondary
                  listings transfer the entire cask. This keeps WOWGR ownership records and CDO
                  routing unambiguous.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q2">
                <AccordionTrigger>What happens to the NFT when a cask is bottled?</AccordionTrigger>
                <AccordionContent>
                  The owner submits a bottling instruction. Once disgorging is confirmed by the
                  warehouse, the token is marked as redeemed on-chain. The metadata retains the
                  history but the token is no longer transferable.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q3">
                <AccordionTrigger>How do we re-finish a cask after listing?</AccordionTrigger>
                <AccordionContent>
                  Pull the listing, perform the finish in your own bonded warehouse, regauge, then
                  update <code>finishing_cask_type</code>, <code>finishing_duration_months</code> and
                  set <code>has_been_finished = true</code>. Re-list at the new asking price; the NFT
                  metadata is refreshed automatically.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q4">
                <AccordionTrigger>Are buyers allowed to inspect or nose the cask?</AccordionTrigger>
                <AccordionContent>
                  At your discretion. The marketplace exposes an enquiry channel on the cask page so
                  buyers can request a sample draw or warehouse visit. Sample draws are billed
                  separately and reduce BL, so update gauging after the draw.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q5">
                <AccordionTrigger>Can we bulk-import an inventory CSV?</AccordionTrigger>
                <AccordionContent>
                  CSV import is available on request from the admin team during onboarding.
                  Required headers mirror the Cask data field reference above. NFT minting is
                  enqueued and runs server-side once the import passes validation.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </section>

      <Card className="luxury-card">
        <CardHeader>
          <CardTitle>Need a human?</CardTitle>
          <CardDescription>The producer relations team handles onboarding, CSV imports, custodial questions and bottling co-ordination.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild><Link to="/help">Open Help Center <ArrowRight className="h-4 w-4 ml-1" /></Link></Button>
          <Button asChild variant="outline"><Link to="/distillery">Back to dashboard</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Documentation;