import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Handshake, MessageCircle, TrendingUp, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Offer {
  id: string;
  type: 'buy_request' | 'sell_offer';
  userId: string;
  userName: string;
  spiritType: string;
  ageRange: { min: number; max: number };
  volumeRange: { min: number; max: number };
  priceRange: { min: number; max: number };
  location?: string;
  description: string;
  created: Date;
  status: 'active' | 'matched' | 'expired';
}

export const MatchmakingSystem = () => {
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOffer, setNewOffer] = useState({
    type: 'buy_request' as 'buy_request' | 'sell_offer',
    spiritType: '',
    ageMin: '',
    ageMax: '',
    volumeMin: '',
    volumeMax: '',
    priceMin: '',
    priceMax: '',
    description: '',
  });

  useEffect(() => {
    // Mock data for demonstration
    setOffers([
      {
        id: '1',
        type: 'buy_request',
        userId: 'user1',
        userName: 'John MacLeod',
        spiritType: 'Single Malt Scotch',
        ageRange: { min: 18, max: 25 },
        volumeRange: { min: 200, max: 500 },
        priceRange: { min: 15000, max: 35000 },
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
        volumeRange: { min: 300, max: 400 },
        priceRange: { min: 18000, max: 22000 },
        description: 'Exceptional Highland cask with rich sherry influence.',
        created: new Date('2024-01-10'),
        status: 'active',
      },
    ]);
  }, []);

  const handleCreateOffer = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create offers.",
        variant: "destructive",
      });
      return;
    }

    // Validate form
    if (!newOffer.spiritType || !newOffer.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Create offer (would integrate with backend)
    toast({
      title: "Offer Created",
      description: "Your offer has been posted and will be matched with potential partners.",
    });

    setShowCreateForm(false);
    setNewOffer({
      type: 'buy_request',
      spiritType: '',
      ageMin: '',
      ageMax: '',
      volumeMin: '',
      volumeMax: '',
      priceMin: '',
      priceMax: '',
      description: '',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

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
                  className="w-full p-2 border rounded-md"
                  value={newOffer.type}
                  onChange={(e) => setNewOffer({...newOffer, type: e.target.value as 'buy_request' | 'sell_offer'})}
                >
                  <option value="buy_request">Buy Request</option>
                  <option value="sell_offer">Sell Offer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Spirit Type</label>
                <Input
                  placeholder="e.g., Single Malt Scotch"
                  value={newOffer.spiritType}
                  onChange={(e) => setNewOffer({...newOffer, spiritType: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Age Range (years)</label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Min"
                    type="number"
                    value={newOffer.ageMin}
                    onChange={(e) => setNewOffer({...newOffer, ageMin: e.target.value})}
                  />
                  <Input
                    placeholder="Max"
                    type="number"
                    value={newOffer.ageMax}
                    onChange={(e) => setNewOffer({...newOffer, ageMax: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Volume Range (L)</label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Min"
                    type="number"
                    value={newOffer.volumeMin}
                    onChange={(e) => setNewOffer({...newOffer, volumeMin: e.target.value})}
                  />
                  <Input
                    placeholder="Max"
                    type="number"
                    value={newOffer.volumeMax}
                    onChange={(e) => setNewOffer({...newOffer, volumeMax: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price Range ($)</label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Min"
                    type="number"
                    value={newOffer.priceMin}
                    onChange={(e) => setNewOffer({...newOffer, priceMin: e.target.value})}
                  />
                  <Input
                    placeholder="Max"
                    type="number"
                    value={newOffer.priceMax}
                    onChange={(e) => setNewOffer({...newOffer, priceMax: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                className="w-full p-2 border rounded-md h-24 resize-none"
                placeholder="Describe your requirements or offering..."
                value={newOffer.description}
                onChange={(e) => setNewOffer({...newOffer, description: e.target.value})}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateOffer}>
                Post Offer
              </Button>
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
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
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
                  <span className="text-sm text-muted-foreground">Volume Range:</span>
                  <p className="font-medium">{offer.volumeRange.min} - {offer.volumeRange.max}L</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Price Range:</span>
                  <p className="font-medium">{formatCurrency(offer.priceRange.min)} - {formatCurrency(offer.priceRange.max)}</p>
                </div>
              </div>
              
              <p className="text-sm mb-4">{offer.description}</p>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Expires in 25 days</span>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact
                  </Button>
                  <Button size="sm">
                    <Handshake className="h-4 w-4 mr-2" />
                    Make Offer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};