import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from './ui/sidebar';
import { Building2, Activity, Shield, Bell, Cpu } from 'lucide-react';

interface AppSidebarProps {
  activeView: 'monitoring' | 'access-safety' | 'alerts';
  onViewChange: (view: 'monitoring' | 'access-safety' | 'alerts') => void;
}

export function AppSidebar({ activeView, onViewChange }: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="border-b border-slate-200 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-white">Smart Office</h2>
            <p className="text-xs text-blue-100">Automation System</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-white">
        <div className="px-3 py-4">
          <p className="px-3 text-xs text-slate-500 mb-2">MODULES</p>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => onViewChange('monitoring')}
                isActive={activeView === 'monitoring'}
                className="w-full"
              >
                <Activity className="w-4 h-4" />
                <span>Monitoring</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => onViewChange('alerts')}
                isActive={activeView === 'alerts'}
                className="w-full"
              >
                <Bell className="w-4 h-4" />
                <span>Alerts</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => onViewChange('access-safety')}
                isActive={activeView === 'access-safety'}
                className="w-full"
              >
                <Shield className="w-4 h-4" />
                <span>Access & Safety</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>

        
      </SidebarContent>
    </Sidebar>
  );
}
