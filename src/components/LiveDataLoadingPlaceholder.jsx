import { Radar, Plane, Radio, MapPin } from "lucide-react";

const placeholderFlights = [
  "Syncing flight plans",
  "Resolving aircraft positions",
  "Decoding ACARS traffic",
];

export default function LiveDataLoadingPlaceholder() {
  return (
    <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="h-full grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-3 border-r border-border bg-card/50 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Radar className="w-4 h-4 text-primary animate-pulse" />
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider">Flight Plans</div>
              <div className="text-[10px] text-muted-foreground">Loading live data…</div>
            </div>
          </div>
          <div className="space-y-3">
            {placeholderFlights.map((label) => (
              <div key={label} className="rounded-lg border border-border bg-background/70 p-3 animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Plane className="w-3.5 h-3.5 text-primary/70" />
                    <div className="h-3 w-20 rounded bg-muted" />
                  </div>
                  <div className="h-4 w-12 rounded bg-muted" />
                </div>
                <div className="h-3 w-32 rounded bg-muted mb-2" />
                <div className="h-2.5 w-40 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>

        <div className="hidden lg:flex lg:col-span-5 items-center justify-center border-r border-border bg-card/30">
          <div className="flex flex-col items-center gap-4 text-center px-6">
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full border border-primary/30 bg-primary/5">
              <MapPin className="w-8 h-8 text-primary" />
              <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping" />
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider">Building tactical map</h2>
              <p className="text-xs text-muted-foreground mt-1">Fetching live aircraft and plotting confirmed routes</p>
            </div>
          </div>
        </div>

        <div className="hidden lg:block lg:col-span-4 bg-card/50 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Radio className="w-4 h-4 text-primary animate-pulse" />
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider">Free Text</div>
              <div className="text-[10px] text-muted-foreground">Waiting for message feed…</div>
            </div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="rounded-lg border border-border bg-background/70 p-3 animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-3 w-16 rounded bg-muted" />
                  <div className="h-3 w-24 rounded bg-muted" />
                </div>
                <div className="h-3 w-full rounded bg-muted mb-2" />
                <div className="h-3 w-5/6 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}