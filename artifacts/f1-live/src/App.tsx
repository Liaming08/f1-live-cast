import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Races from "@/pages/races";
import RaceDetail from "@/pages/race-detail";
import Standings from "@/pages/standings";
import Drivers from "@/pages/drivers";

import AdminLayout from "@/pages/admin/layout";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminRaces from "@/pages/admin/races";
import AdminCommentary from "@/pages/admin/commentary";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Layout><Home /></Layout>
      </Route>
      <Route path="/races">
        <Layout><Races /></Layout>
      </Route>
      <Route path="/races/:id">
        <Layout><RaceDetail /></Layout>
      </Route>
      <Route path="/standings">
        <Layout><Standings /></Layout>
      </Route>
      <Route path="/drivers">
        <Layout><Drivers /></Layout>
      </Route>
      
      <Route path="/admin" component={() => <AdminLayout><AdminDashboard /></AdminLayout>} />
      <Route path="/admin/races" component={() => <AdminLayout><AdminRaces /></AdminLayout>} />
      <Route path="/admin/commentary" component={() => <AdminLayout><AdminCommentary /></AdminLayout>} />
      <Route path="/admin/:rest*" component={() => <AdminLayout><div className="p-8 text-center text-muted-foreground uppercase tracking-widest">Section under construction</div></AdminLayout>} />
      
      <Route>
        <Layout><NotFound /></Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
