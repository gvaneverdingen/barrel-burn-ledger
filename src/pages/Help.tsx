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
