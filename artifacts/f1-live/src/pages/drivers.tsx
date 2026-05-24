import { useListDrivers } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Drivers() {
  const { data: drivers, isLoading } = useListDrivers();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tighter uppercase mb-2">Drivers</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Skeleton key={i} className="h-32 bg-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold tracking-tighter uppercase mb-2">Grid Drivers</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {drivers?.map(driver => (
          <Card key={driver.id} className="bg-card overflow-hidden border-border/50 hover:border-border transition-colors">
            <div className="flex h-full">
              {/* Team color accent bar */}
              <div 
                className="w-2 h-full flex-shrink-0" 
                style={{ backgroundColor: driver.teamColor || '#333' }} 
              />
              <CardContent className="p-5 flex flex-col justify-center flex-1 relative">
                <div className="absolute top-2 right-4 text-4xl font-black italic opacity-10 text-white select-none">
                  {driver.number}
                </div>
                
                <div className="z-10 relative">
                  <div className="text-2xl font-bold tracking-tighter uppercase mb-1">
                    {driver.name}
                  </div>
                  <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">
                    {driver.teamName || 'No Team'}
                  </div>
                  
                  <div className="flex justify-between items-center text-xs mt-auto">
                    <span className="bg-secondary px-2 py-1 rounded font-mono font-bold">
                      {driver.abbreviation}
                    </span>
                    <span className="text-muted-foreground">
                      {driver.nationality}
                    </span>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
