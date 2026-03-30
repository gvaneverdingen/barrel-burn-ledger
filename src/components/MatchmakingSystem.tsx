import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Handshake, MessageCircle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

interface Offer {
  id: string;
  type: 'buy_request' | 'sell_offer';
  userId: string;
  userName: string;
  spiritType: string;
  ageRange: { min: number; max: number };
  abvRange: { min: number; max: number };
  pricePerBarrel: { min: number; max: number };
  location?: string;
  description: string;
  created: Date;
  status: 'active' | 'matched' | 'expired';
}

export const MatchmakingSystem = () => {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [offerMessage, setOfferMessage] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [newOffer, setNewOffer] = useState({
    type: 'buy_request' as 'buy_request' | 'sell_offer',
    spiritType: '',
    ageMin: '',
    ageMax: '',
    abvMin: '',
    abvMax: '',
    priceMin: '',
    priceMax: '',
    description: '',
  });

  useEffect(() => {
    setOffers([
      {
        id: '1',
        type: 'buy_request',
        userId: 'user1',
        userName: 'John MacLeod',
        spiritType: 'Single Malt Scotch',
        ageRange: { min: 18, max: 25 },
        abvRange: { min: 55, max: 65 },
        pricePerBarrel: { min: 15000, max: 35000 },
        location: 'Speyside',
        description: 'Looking for premium Speyside casks with excellent maturation potential.',
        created: new Date('2024-01-15'),
        status: 'active',
      },
      {
        id: '2',
        type: 'sell_offer',
        userId: 'user2',
        userName: 'Highland Distillery Co.',
        spiritType: 'Highland Single Malt',
        ageRange: { min: 12, max: 15 },
        abvRange: { min: 58, max: 63 },
        pricePerBarrel: { min: 18000, max: 22000 },
        description: 'Exceptional Highland cask with rich sherry influence.',
        created: new Date('2024-01-10'),
        status: 'active',
      },
    ]);
  }, []);

  const handleCreateOffer = () => {
    if (!user) {
      toast({ title: "Authentication Required", description: "Please sign in to create offers.", variant: "destructive" });
      return;
    }
    if (!newOffer.spiritType || !newOffer.description) {
      toast({ title: "Missing Information", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    toast({ title: "Offer Created", description: "Your offer has been posted and will be matched with potential partners." });
    setShowCreateForm(false);
    setNewOffer({ type: 'buy_request', spiritType: '', ageMin: '', ageMax: '', abvMin: '', abvMax: '', priceMin: '', priceMax: '', description: '' });
  };

  const handleMakeOffer = (offer: Offer) => {
    if (!user) {
      toast({ title: "Authentication Required", description: "Please sign in to make an offer.", variant: "destructive" });
      return;
    }
    setSelectedOffer(offer);
    setOfferPrice(String(offer.pricePerBarrel.min));
    setOfferMessage('');
    setShowOfferDialog(true);
  };

  const handleSubmitOffer = () => {
    if (!offerPrice) {
      toast({ title: "Missing Information", description: "Please enter a price per barrel.", variant: "destructive" });
      return;
    }
    toast({ title: "Offer Sent!", description: `Your offer of $${Number(offerPrice).toLocaleString()} per barrel has been sent to ${selectedOffer?.userName}.` });
    setShowOfferDialog(false);
    setSelectedOffer(null);
  };

  const handleContact = (offer: Offer) => {
    if (!user) {
      toast({ title: "Authentication Required", description: "Please sign in to contact.", variant: "destructive" });
      return;
    }
    setSelectedOffer(offer);
    setContactMessage('');
    setShowContactDialog(true);
  };

  const handleSendMessage = () => {
    if (!contactMessage.trim()) {
      toast({ title: "Missing Message", description: "Please enter a message.", variant: "destructive" });
      return;
    }
    toast({ title: "Message Sent!", description: `Your message has been sent to ${selectedOffer?.userName}.` });
    setShowContactDialog(false);
    setSelectedOffer(null);
  };

  // Use formatPrice from CurrencyContext for all price display

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Matchmaking & Offers</h3>
          <p className="text-muted-foreground">Connect with buyers and sellers, create custom requests</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Handshake className="h-4 w-4 mr-2" />
          Create Offer
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Offer</CardTitle>
            <CardDescription>Post your buying or selling requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Offer Type</label>
                <select
                  className="w-full p-2 border rounded-md bg-background text-foreground"
                  value={newOffer.type}
                  onChange={(e) => setNewOffer({ ...newOffer, type: e.target.value as 'buy_request' | 'sell_offer' })}
                >
                  <option value="buy_request">Buy Request</option>
                  <option value="sell_offer">Sell Offer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Spirit Type</label>
                <Input placeholder="e.g., Single Malt Scotch" value={newOffer.spiritType} onChange={(e) => setNewOffer({ ...newOffer, spiritType: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Age Range (years)</label>
                <div className="flex space-x-2">
                  <Input placeholder="Min" type="number" value={newOffer.ageMin} onChange={(e) => setNewOffer({ ...newOffer, ageMin: e.target.value })} />
                  <Input placeholder="Max" type="number" value={newOffer.ageMax} onChange={(e) => setNewOffer({ ...newOffer, ageMax: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ABV Range (%)</label>
                <div className="flex space-x-2">
                  <Input placeholder="Min" type="number" value={newOffer.abvMin} onChange={(e) => setNewOffer({ ...newOffer, abvMin: e.target.value })} />
                  <Input placeholder="Max" type="number" value={newOffer.abvMax} onChange={(e) => setNewOffer({ ...newOffer, abvMax: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price per Barrel ($)</label>
                <div className="flex space-x-2">
                  <Input placeholder="Min" type="number" value={newOffer.priceMin} onChange={(e) => setNewOffer({ ...newOffer, priceMin: e.target.value })} />
                  <Input placeholder="Max" type="number" value={newOffer.priceMax} onChange={(e) => setNewOffer({ ...newOffer, priceMax: e.target.value })} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                className="h-24 resize-none"
                placeholder="Describe your requirements or offering..."
                value={newOffer.description}
                onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
              <Button onClick={handleCreateOffer}>Post Offer</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {offers.map((offer) => (
          <Card key={offer.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Badge variant={offer.type === 'buy_request' ? 'default' : 'secondary'}>
                      {offer.type === 'buy_request' ? 'Buy Request' : 'Sell Offer'}
                    </Badge>
                    <span>{offer.spiritType}</span>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Posted by {offer.userName} • {Math.floor((Date.now() - offer.created.getTime()) / (1000 * 60 * 60 * 24))} days ago
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-accent text-accent-foreground border-border">
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <span className="text-sm text-muted-foreground">Age Range:</span>
                  <p className="font-medium">{offer.ageRange.min} - {offer.ageRange.max} years</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">ABV Range:</span>
                  <p className="font-medium">{offer.abvRange.min}% - {offer.abvRange.max}%</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Price per Barrel:</span>
                  <p className="font-medium">{formatPrice(offer.pricePerBarrel.min)} - {formatPrice(offer.pricePerBarrel.max)}</p>
                </div>
              </div>

              <p className="text-sm mb-4">{offer.description}</p>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Expires in 25 days</span>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleContact(offer)}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact
                  </Button>
                  <Button size="sm" onClick={() => handleMakeOffer(offer)}>
                    <Handshake className="h-4 w-4 mr-2" />
                    {offer.type === 'buy_request' ? 'Sell My Cask' : 'Make Offer'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Make Offer Dialog — Price per Barrel */}
      <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make an Offer</DialogTitle>
            <DialogDescription>
              Respond to {selectedOffer?.userName}'s {selectedOffer?.type === 'buy_request' ? 'buy request' : 'sell offer'} for {selectedOffer?.spiritType}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedOffer && (
              <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                <p><span className="text-muted-foreground">Requested range:</span> {formatPrice(selectedOffer.pricePerBarrel.min)} – {formatPrice(selectedOffer.pricePerBarrel.max)} per barrel</p>
                <p><span className="text-muted-foreground">ABV:</span> {selectedOffer.abvRange.min}% – {selectedOffer.abvRange.max}%</p>
                <p><span className="text-muted-foreground">Age:</span> {selectedOffer.ageRange.min} – {selectedOffer.ageRange.max} years</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Your Price per Barrel ($)</label>
              <Input type="number" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} placeholder="e.g., 20000" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message (optional)</label>
              <Textarea value={offerMessage} onChange={(e) => setOfferMessage(e.target.value)} placeholder="Add details about the barrel you're offering..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOfferDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmitOffer}>Send Offer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact {selectedOffer?.userName}</DialogTitle>
            <DialogDescription>
              Send a message about their {selectedOffer?.spiritType} {selectedOffer?.type === 'buy_request' ? 'buy request' : 'listing'}
            </DialogDescription>
          </DialogHeader>
          <div>
            <label className="block text-sm font-medium mb-1">Your Message</label>
            <Textarea value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} placeholder="Write your message..." className="h-32" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactDialog(false)}>Cancel</Button>
            <Button onClick={handleSendMessage}>Send Message</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
