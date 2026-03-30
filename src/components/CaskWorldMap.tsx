import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface CaskLocation {
  name: string;
  location: string | null;
  count: number;
  totalValue: number;
}

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

// Map known whisky regions to approximate lat/lng coordinates
const LOCATION_COORDS: Record<string, { lat: number; lng: number }> = {
  // Scotland regions
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
  // Ireland
  'ireland': { lat: 53.4, lng: -7.7 },
  'dublin': { lat: 53.35, lng: -6.26 },
  'cork': { lat: 51.9, lng: -8.47 },
  // USA
  'kentucky': { lat: 37.8, lng: -85.8 },
  'tennessee': { lat: 35.5, lng: -86.6 },
  'bourbon': { lat: 37.8, lng: -85.8 },
  'texas': { lat: 31.0, lng: -100.0 },
  'new york': { lat: 42.0, lng: -75.0 },
  'colorado': { lat: 39.0, lng: -105.5 },
  'usa': { lat: 39.8, lng: -98.6 },
  // Japan
  'japan': { lat: 36.2, lng: 138.3 },
  'hokkaido': { lat: 43.1, lng: 141.3 },
  'yamazaki': { lat: 34.9, lng: 135.7 },
  // India
  'india': { lat: 20.6, lng: 79.0 },
  'goa': { lat: 15.3, lng: 74.0 },
  // Taiwan
  'taiwan': { lat: 23.7, lng: 121.0 },
  // Australia
  'australia': { lat: -25.3, lng: 133.8 },
  'tasmania': { lat: -42.0, lng: 146.3 },
  // Canada
  'canada': { lat: 56.1, lng: -106.3 },
  // Sweden
  'sweden': { lat: 60.1, lng: 18.6 },
  // France
  'france': { lat: 46.2, lng: 2.2 },
  'cognac': { lat: 45.7, lng: -0.33 },
  // Wales
  'wales': { lat: 52.1, lng: -3.8 },
  // England
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

// Convert lat/lng to SVG viewBox coordinates (simple equirectangular projection)
function toSvgCoords(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng + 180) / 360) * 1000;
  const y = ((90 - lat) / 180) * 500;
  return { x, y };
}

export function CaskWorldMap({ listings, formatPrice }: CaskWorldMapProps) {
  const locationData = useMemo(() => {
    const map = new Map<string, CaskLocation>();
    
    listings.forEach(listing => {
      const loc = listing.distilleries?.location || listing.warehouse_location;
      const name = listing.distilleries?.name || 'Unknown';
      const key = `${name}-${loc}`;
      
      if (!map.has(key)) {
        map.set(key, { name, location: loc || null, count: 0, totalValue: 0 });
      }
      const entry = map.get(key)!;
      entry.count++;
      entry.totalValue += listing.total_price || 0;
    });
    
    return Array.from(map.values())
      .map(entry => ({
        ...entry,
        coords: findCoords(entry.location),
      }))
      .filter(entry => entry.coords !== null);
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
        <div className="relative w-full aspect-[2/1] bg-muted/30 rounded-lg overflow-hidden">
          <svg
            viewBox="0 0 1000 500"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Simple world map outline paths */}
            <g className="fill-muted stroke-border" strokeWidth="0.5">
              {/* North America */}
              <path d="M120,80 L130,75 L160,70 L200,60 L230,65 L260,80 L270,100 L280,120 L275,140 L260,160 L250,180 L240,200 L230,210 L220,200 L200,195 L190,200 L180,210 L170,215 L165,200 L160,180 L150,165 L140,150 L130,140 L120,130 L115,110 Z" />
              {/* Central America */}
              <path d="M180,210 L190,220 L195,230 L200,240 L210,245 L215,250 L220,260 L218,265 L210,262 L205,255 L195,250 L190,245 L185,235 L182,225 Z" />
              {/* South America */}
              <path d="M220,260 L240,255 L260,260 L280,265 L290,280 L295,300 L290,320 L285,340 L280,360 L270,380 L260,395 L250,405 L245,395 L240,380 L235,360 L230,340 L225,320 L220,300 L218,280 Z" />
              {/* Europe */}
              <path d="M440,60 L450,55 L470,58 L490,65 L510,70 L520,80 L515,95 L510,105 L500,115 L490,120 L480,118 L470,112 L460,108 L450,100 L445,90 L440,80 Z" />
              {/* British Isles */}
              <path d="M430,75 L435,70 L440,73 L438,80 L435,85 L430,82 Z" />
              <path d="M425,78 L428,75 L430,78 L428,82 L425,80 Z" />
              {/* Scandinavia */}
              <path d="M475,40 L480,35 L490,30 L500,35 L505,45 L500,55 L495,60 L485,58 L480,50 Z" />
              {/* Africa */}
              <path d="M450,130 L470,125 L500,130 L530,135 L545,150 L550,170 L548,200 L540,230 L530,260 L520,280 L510,300 L500,310 L490,305 L480,290 L470,270 L465,250 L460,220 L455,190 L450,160 Z" />
              {/* Asia */}
              <path d="M530,60 L560,50 L600,45 L650,50 L700,55 L740,60 L770,70 L790,85 L800,100 L790,115 L770,130 L740,140 L710,145 L680,140 L650,135 L620,130 L590,120 L560,110 L540,100 L530,85 Z" />
              {/* India */}
              <path d="M640,140 L660,145 L670,160 L675,180 L670,200 L660,215 L650,220 L640,210 L635,195 L630,175 L632,155 Z" />
              {/* SE Asia */}
              <path d="M700,145 L720,140 L740,145 L750,160 L745,175 L730,180 L715,175 L705,160 Z" />
              {/* Japan */}
              <path d="M810,85 L815,80 L820,85 L818,95 L815,105 L810,100 Z" />
              {/* Australia */}
              <path d="M740,310 L770,300 L800,305 L830,310 L850,320 L855,340 L845,360 L830,370 L800,375 L775,370 L755,355 L745,340 L740,325 Z" />
              {/* New Zealand */}
              <path d="M870,370 L875,365 L880,370 L878,380 L872,385 L868,378 Z" />
            </g>

            {/* Cask location markers */}
            {locationData.map((loc, i) => {
              const { x, y } = toSvgCoords(loc.coords!.lat, loc.coords!.lng);
              const radius = Math.min(Math.max(loc.count * 3, 6), 20);
              return (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <g className="cursor-pointer" style={{ filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.5))' }}>
                      {/* Pulse ring */}
                      <circle
                        cx={x}
                        cy={y}
                        r={radius + 4}
                        className="fill-none stroke-primary"
                        strokeWidth="1"
                        opacity="0.4"
                      >
                        <animate attributeName="r" values={`${radius + 2};${radius + 8};${radius + 2}`} dur="3s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="3s" repeatCount="indefinite" />
                      </circle>
                      {/* Main dot */}
                      <circle
                        cx={x}
                        cy={y}
                        r={radius}
                        className="fill-primary/80 stroke-primary-foreground"
                        strokeWidth="1.5"
                      />
                      {/* Count label */}
                      {loc.count > 1 && (
                        <text
                          x={x}
                          y={y + 1}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-primary-foreground font-bold"
                          fontSize={radius > 10 ? "10" : "8"}
                        >
                          {loc.count}
                        </text>
                      )}
                    </g>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px]">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">{loc.name}</p>
                      <p className="text-xs text-muted-foreground">{loc.location}</p>
                      <p className="text-xs">{loc.count} cask{loc.count > 1 ? 's' : ''}</p>
                      <p className="text-xs font-medium">{formatPrice(loc.totalValue)} total value</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}

            {/* Legend */}
            <g transform="translate(20, 440)">
              <rect x="0" y="0" width="160" height="45" rx="6" className="fill-card/80 stroke-border" strokeWidth="0.5" />
              <circle cx="16" cy="16" r="5" className="fill-primary/80" />
              <text x="28" y="20" className="fill-foreground" fontSize="10">Distillery / Warehouse</text>
              <text x="12" y="36" className="fill-muted-foreground" fontSize="9">Hover markers for details</text>
            </g>
          </svg>

          {locationData.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground text-sm">No location data available for current listings</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
