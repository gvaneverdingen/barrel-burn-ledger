import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, MessageCircle, Phone, Mail, Search, Clock } from "lucide-react";
import { useState } from "react";

const Help = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const faqItems = [
    {
      question: "How does ARIGI use blockchain, and why does it matter for transparency?",
      answer: "Every cask on ARIGI is minted as an NFT on the Polygon blockchain before it can be listed on the marketplace. This NFT acts as a tamper-proof certificate of ownership and provenance: distillery of origin, fill date, cask type, ABV, and a full history of transfers are all recorded on-chain. Because the ledger is public, anyone can independently verify that a cask exists, who currently owns it, and every transaction it has been part of — without having to trust ARIGI as the sole record-keeper. We use server-side minting so you do not need to manage a crypto wallet, but the on-chain link from your cask page (look for the Polygon explorer link) lets you audit the record at any time."
    },
    {
      question: "Can I see the on-chain record of my cask?",
      answer: "Yes. Every cask detail page includes an NFT provenance card with a direct link to the Polygon block explorer. There you can see the contract, token ID, mint transaction, and the full transfer history. Resales executed through ARIGI are also reflected on-chain, giving you a verifiable audit trail from the distillery to the current owner."
    },
    {
      question: "What happens when my cask is bottled?",
      answer: "When a cask reaches maturity you can choose to bottle it instead of selling it on. ARIGI coordinates with the bonded warehouse and an approved bottler to disgorge, reduce to bottling strength, label, and (where applicable) pay duty and VAT. Typical yield depends on cask type and angel's share — a refill hogshead at 12 years often yields around 250–320 bottles at 46% ABV. Bottling, labelling, duty, and shipping are billed separately and quoted before you confirm. Once bottled, the underlying NFT is marked as redeemed so the on-chain record reflects that the cask has left maturation."
    },
    {
      question: "What are the legal rules for Scotch Whisky?",
      answer: "Scotch Whisky is protected by the Scotch Whisky Regulations 2009 (UK). To be called Scotch, the spirit must be: produced at a distillery in Scotland from water and malted barley (other whole grains may be added); processed at that distillery into a mash, fermented only by yeast, and distilled to less than 94.8% ABV; matured in oak casks of no more than 700 litres in an excise warehouse in Scotland for a minimum of three years; bottled at no less than 40% ABV; and contain no added substances other than water and plain caramel colouring (E150A). Any age statement must refer to the youngest whisky in the bottle."
    },
    {
      question: "What is the difference between Single Malt and Single Grain Scotch Whisky?",
      answer: "Single Malt Scotch is made at a single distillery using only malted barley and distilled in copper pot stills, in batches. Single Grain Scotch is also made at a single distillery but may include other malted or unmalted cereals (typically wheat or maize alongside some malted barley) and is usually distilled continuously in column (Coffey) stills, producing a lighter spirit. 'Single' refers to a single distillery, not a single cask. Blended Scotch combines malt and grain whiskies from multiple distilleries; Blended Malt combines malts from multiple distilleries with no grain whisky."
    },
    {
      question: "What about whiskies from other countries?",
      answer: "Whisky is made around the world and each country has its own rules and style. Irish Whiskey must be distilled and matured on the island of Ireland for at least three years and is often triple-distilled and lighter in style. American Bourbon must be made in the USA from a mash of at least 51% corn and aged in new charred oak; Tennessee Whiskey adds the Lincoln County (charcoal) mellowing process. Rye Whiskey requires at least 51% rye. Japanese Whisky, under the JSLMA standard (2021), must be made from malted grains with water sourced in Japan, fermented, distilled, matured at least three years and bottled in Japan at 40% ABV or higher. Canadian Whisky must be mashed, distilled and aged in Canada for at least three years in wood not exceeding 700 litres. Other notable origins include Taiwan, India, Australia and continental Europe — many can be held and traded on ARIGI provided provenance can be verified on-chain."
    },
    {
      question: "How do I make my first cask purchase?",
      answer: "Navigate to the Marketplace, browse available casks, select one that meets your criteria, and follow the secure checkout process. Our team will guide you through verification and payment."
    },
    {
      question: "What are the storage and insurance costs?",
      answer: "Storage and insurance fees are typically £250-£500 per year depending on the cask size and location. These costs are clearly outlined before purchase and billed quarterly."
    },
    {
      question: "How is my cask valued over time?",
      answer: "Cask valuations are updated quarterly based on market conditions, age progression, distillery performance, and industry trends. You can view historical valuations in your portfolio."
    },
    {
      question: "Can I sell my cask before maturity?",
      answer: "Yes, casks can be sold on our marketplace at any time. The selling process involves valuation, listing, and our team facilitating the transfer to new owners."
    },
    {
      question: "What happens if a distillery goes out of business?",
      answer: "Casks from closed distilleries often become more valuable. Your ownership rights remain intact, and the whisky continues to mature. Insurance protects against physical loss."
    }
  ];

  const filteredFaqs = faqItems.filter(item =>
    !searchTerm || 
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Help Center</h1>
        </div>
        <p className="text-muted-foreground">
          Find answers to common questions or get in touch with our support team.
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for help articles..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Methods */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-semibold">Contact Support</h3>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircle className="h-4 w-4" />
                Live Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Get instant help from our team
              </p>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Online now</span>
              </div>
              <Button className="w-full">Start Chat</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-4 w-4" />
                Email Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                We'll respond within 24 hours
              </p>
              <Button variant="outline" className="w-full">
                Send Email
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Phone className="h-4 w-4" />
                Phone Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                +44 (0) 20 7946 0958
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                Mon-Fri 9AM-5PM GMT
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Frequently Asked Questions</h3>
            <Badge variant="secondary">{filteredFaqs.length} results</Badge>
          </div>
          
          {filteredFaqs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No matching questions found. Try a different search term.</p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {filteredFaqs.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </div>

      {/* Contact Form */}
      <Card>
        <CardHeader>
          <CardTitle>Submit a Support Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Subject</label>
              <Input placeholder="Brief description of your issue" />
            </div>
            <div>
              <label className="text-sm font-medium">Priority</label>
              <Input placeholder="Low / Medium / High" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Message</label>
            <Textarea 
              placeholder="Please describe your issue in detail..."
              className="min-h-[120px]"
            />
          </div>
          <Button>Submit Request</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Help;
