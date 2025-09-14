import { useState, useEffect } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/lib/theme-context";
import { AppSidebar } from "@/components/app-sidebar";
import { AlfredPanel } from "@/components/alfred-panel";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import DashboardPage from "@/pages/dashboard";
import AnalyticsPage from "@/pages/analytics";
import CustomizePage from "@/pages/customize";
import AlfredPage from "@/pages/alfred";
import PlanPage from "@/pages/plan";
import { Tasks } from "@/pages/tasks";
import { Calendar } from "@/pages/calendar";
import PlaceholderPage from "@/pages/placeholder";
import NotFound from "@/pages/not-found";
import { useAuth } from "./lib/auth-context";

function App() {
  const { user, loading } = useAuth();
  const [isAlfredPanelOpen, setIsAlfredPanelOpen] = useState(false);

  // Global CTRL+Space hotkey for ALFRED panel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.code === 'Space') {
        const target = event.target as HTMLElement;
        const isInputField = target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.contentEditable === 'true' ||
                           target.role === 'textbox';
        
        if (!isInputField) {
          event.preventDefault();
          setIsAlfredPanelOpen(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <Switch>
            <Route path="/landing" component={LandingPage} />
            <Route path="/login" component={LoginPage} />
            <Route path="/signup" component={SignupPage} />

            <Route path="/:rest*">
              {user ? (
                <SidebarProvider style={sidebarStyle as React.CSSProperties}>
                  <div className="flex h-screen w-full">
                    <AppSidebar />
                    <div className="flex flex-col flex-1">
                      <header className="flex items-center justify-between p-4 border-b border-border/50 bg-card/95 backdrop-blur-sm">
                        <SidebarTrigger data-testid="button-sidebar-toggle" className="hover-elevate" />
                        <div className="font-orbitron text-sm font-semibold text-primary tracking-wider">
                          BATCAVE v1.0
                        </div>
                      </header>
                      <main className="flex-1 overflow-auto bg-background">
                        <Switch>
                          <Route path="/" component={DashboardPage} />
                          <Route path="/dashboard" component={DashboardPage} />
                          <Route path="/tasks" component={Tasks} />
                          <Route path="/analytics" component={AnalyticsPage} />
                          <Route path="/alfred" component={AlfredPage} />
                          <Route path="/customize" component={CustomizePage} />
                          <Route path="/plan" component={PlanPage} />
                          <Route path="/calendar" component={Calendar} />
                          <Route
                            path="/settings"
                            component={() => (
                              <PlaceholderPage
                                title="System Configuration"
                                description="Profile management, accessibility settings, and system preferences for your BATCAVE experience."
                              />
                            )}
                          />
                          <Route component={NotFound} />
                        </Switch>
                      </main>
                    </div>
                  </div>
                </SidebarProvider>
              ) : (
                <Redirect to="/login" />
              )}
            </Route>
          </Switch>
          <Toaster />
          <AlfredPanel 
            isOpen={isAlfredPanelOpen}
            onClose={() => setIsAlfredPanelOpen(false)}
          />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
