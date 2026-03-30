import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';

// Fix default marker icon issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const goldIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface CaskWorldMapProps {
  listings: Array<{
    distilleries?: {
      name: string;
      location: string | null;
    };
    total_price: number | null;
    warehouse_location?: string | null;
  }>;
  formatPrice: (price: number) => string;
}

interface CaskLocation {
  name: string;
  location: string | null;
  count: number;
  totalValue: number;
  lat: number;
  lng: number;
}

const LOCATION_COORDS: Record<string, { lat: number; lng: number }> = {
  'speyside': { lat: 57.4, lng: -3.2 },
  'highland': { lat: 57.8, lng: -4.5 },
  'highlands': { lat: 57.8, lng: -4.5 },
  'islay': { lat: 55.8, lng: -6.2 },
  'lowland': { lat: 55.9, lng: -3.5 },
  'lowlands': { lat: 55.9, lng: -3.5 },
  'campbeltown': { lat: 55.4, lng: -5.6 },
  'scotland': { lat: 56.5, lng: -4.0 },
  'edinburgh': { lat: 55.95, lng: -3.19 },
  'glasgow': { lat: 55.86, lng: -4.25 },
  'ireland': { lat: 53.4, lng: -7.7 },
  'dublin': { lat: 53.35, lng: -6.26 },
  'cork': { lat: 51.9, lng: -8.47 },
  'kentucky': { lat: 37.8, lng: -85.8 },
  'tennessee': { lat: 35.5, lng: -86.6 },
  'bourbon': { lat: 37.8, lng: -85.8 },
  'texas': { lat: 31.0, lng: -100.0 },
  'new york': { lat: 42.0, lng: -75.0 },
  'colorado': { lat: 39.0, lng: -105.5 },
  'usa': { lat: 39.8, lng: -98.6 },
  'japan': { lat: 36.2, lng: 138.3 },
  'hokkaido': { lat: 43.1, lng: 141.3 },
  'yamazaki': { lat: 34.9, lng: 135.7 },
  'india': { lat: 20.6, lng: 79.0 },
  'goa': { lat: 15.3, lng: 74.0 },
  'taiwan': { lat: 23.7, lng: 121.0 },
  'australia': { lat: -25.3, lng: 133.8 },
  'tasmania': { lat: -42.0, lng: 146.3 },
  'canada': { lat: 56.1, lng: -106.3 },
  'sweden': { lat: 60.1, lng: 18.6 },
  'france': { lat: 46.2, lng: 2.2 },
  'cognac': { lat: 45.7, lng: -0.33 },
  'wales': { lat: 52.1, lng: -3.8 },
  'england': { lat: 52.4, lng: -1.5 },
};

function findCoords(location: string | null | undefined): { lat: number; lng: number } | null {
  if (!location) return null;
  const lower = location.toLowerCase();
  for (const [key, coords] of Object.entries(LOCATION_COORDS)) {
    if (lower.includes(key)) return coords;
  }
  return null;
}

export function CaskWorldMap({ listings, formatPrice }: CaskWorldMapProps) {
  const locationData = useMemo<CaskLocation[]>(() => {
    const map = new Map<string, CaskLocation>();

    listings.forEach(listing => {
      const loc = listing.distilleries?.location || listing.warehouse_location;
      const name = listing.distilleries?.name || 'Unknown';
      const key = `${name}-${loc}`;
      const coords = findCoords(loc);
      if (!coords) return;

      if (!map.has(key)) {
        map.set(key, { name, location: loc || null, count: 0, totalValue: 0, ...coords });
      }
      const entry = map.get(key)!;
      entry.count++;
      entry.totalValue += listing.total_price || 0;
    });

    return Array.from(map.values());
  }, [listings]);

  const totalLocations = new Set(locationData.map(d => d.location)).size;
  const totalCasks = locationData.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" />
            Global Cask Map
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="secondary">{totalLocations} regions</Badge>
            <Badge variant="outline">{totalCasks} casks</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:p-2">
        <div className="w-full h-[500px] sm:h-[600px] rounded-lg overflow-hidden">
          <MapContainer
            center={[54, -2]}
            zoom={3}
            scrollWheelZoom={true}
            className="w-full h-full z-0"
            style={{ background: 'hsl(var(--muted))' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {locationData.map((loc, i) => (
              <Marker key={i} position={[loc.lat, loc.lng]} icon={goldIcon}>
                <Popup>
                  <div className="space-y-1 min-w-[150px]">
                    <p className="font-bold text-sm">{loc.name}</p>
                    <p className="text-xs text-gray-600">{loc.location}</p>
                    <p className="text-xs">{loc.count} cask{loc.count > 1 ? 's' : ''}</p>
                    <p className="text-xs font-semibold">{formatPrice(loc.totalValue)} total value</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        {locationData.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-muted-foreground text-sm">No location data available for current listings</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
