import { useState } from 'react';
import { SidebarProvider } from './components/ui/sidebar';
import { AppSidebar } from './components/AppSidebar';
import { MonitoringTab } from './components/MonitoringTab';
import { AccessSafetyTab } from './components/AccessSafetyTab';
import { AlertsTab } from './components/AlertsTab';
import { Menu } from 'lucide-react';
import { Button } from './components/ui/button';

export default function App() {
  const [activeView, setActiveView] = useState<'monitoring' | 'access-safety' | 'alerts'>('monitoring');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const getTitle = () => {
    switch (activeView) {
      case 'monitoring':
        return 'System Monitoring';
      case 'access-safety':
        return 'Access & Safety Control';
      case 'alerts':
        return 'Alert System';
      default:
        return 'Smart Office';
    }
  };

  const getDescription = () => {
    switch (activeView) {
      case 'monitoring':
        return 'Real-time environmental monitoring';
      case 'access-safety':
        return 'RFID authentication and fire safety system';
      case 'alerts':
        return 'PIR motion detection and security monitoring';
      default:
        return '';
    }
  };

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <AppSidebar activeView={activeView} onViewChange={setActiveView} />
        
        <main className="flex-1 overflow-auto">
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200">
            <div className="flex items-center gap-4 px-6 py-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-slate-900">{getTitle()}</h1>
                <p className="text-sm text-slate-600">{getDescription()}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {activeView === 'monitoring' && <MonitoringTab />}
            {activeView === 'access-safety' && <AccessSafetyTab />}
            {activeView === 'alerts' && <AlertsTab />}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
