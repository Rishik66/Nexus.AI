import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Sparkles,
  LayoutDashboard,
  Package,
  TrendingUp,
  Users,
  Truck,
  Cpu,
  ShieldAlert,
  FileSearch,
  Bot,
  ScrollText,
  Settings,
  Bell,
  ChevronDown,
  Building2,
  UserCheck,
  Activity,
  Menu,
  X,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const DashboardLayout: React.FC = () => {
  const { user, business, role, switchRole, logout, pendingApprovalsCount } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    {
      to: '/command-center',
      label: 'AI Command Center',
      icon: Sparkles,
      highlight: true,
      badge: 'Orchestrator',
    },
    {
      to: '/dashboard',
      label: 'Executive Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/inventory',
      label: 'Operations & Assets',
      icon: Package,
    },
    {
      to: '/finance',
      label: 'Finance & Invoicing',
      icon: TrendingUp,
    },
    {
      to: '/customers',
      label: 'Customers',
      icon: Users,
    },
    {
      to: '/suppliers',
      label: 'Suppliers & POs',
      icon: Truck,
    },
    {
      to: '/workflows',
      label: 'Workflows',
      icon: Cpu,
    },
    {
      to: '/approvals',
      label: 'Approval Center',
      icon: ShieldAlert,
      badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount}` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      to: '/documents',
      label: 'Document Intelligence',
      icon: FileSearch,
    },
    {
      to: '/agents',
      label: 'Agent Activity & Trace',
      icon: Bot,
    },
    {
      to: '/audit-logs',
      label: 'Audit Trail',
      icon: ScrollText,
    },
    {
      to: '/settings',
      label: 'Integrations & Settings',
      icon: Settings,
    },
  ];

  return (
    <div className="flex h-screen bg-[#070b14] text-slate-100 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0d1527] border-r border-[#22345e] flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#22345e] bg-[#0d1527]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-wider text-white">NEXUS</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30">AI</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Autonomous Operations</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Business Selector Pill */}
        <div className="p-3">
          <div className="p-2.5 rounded-lg bg-[#131e38] border border-[#22345e] flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">{business?.name || 'Apex Global Tech & Enterprise'}</p>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] text-slate-400">Demo Enterprise Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                  item.highlight && !isActive
                    ? 'bg-gradient-to-r from-cyan-950/40 to-blue-950/20 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/50'
                    : isActive
                    ? 'bg-[#182442] text-cyan-400 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#131e38]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      item.highlight || isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-300'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      item.badgeColor || 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User / Agent Status Footer */}
        <div className="p-3 border-t border-[#22345e] bg-[#090f1d]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center font-bold text-xs text-cyan-300">
                {user?.full_name?.charAt(0) || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate">{user?.full_name || 'Admin'}</p>
                <p className="text-[10px] text-cyan-400 font-mono font-semibold">{role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 px-4 sm:px-6 bg-[#0d1527] border-b border-[#22345e] flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#131e38]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold">5 Specialist Agents Ready</span>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono">
                Gemini GenAI Subsystem
              </div>
            </div>
          </div>

          {/* Quick Role Switcher for Hackathon Judges */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 p-1 rounded-lg bg-[#131e38] border border-[#22345e]">
              <span className="text-[11px] text-slate-400 px-2 font-medium flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" /> Role:
              </span>
              {(['ADMIN', 'MANAGER', 'EMPLOYEE'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => switchRole(r)}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded transition-all ${
                    role === r
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Notification Bell */}
            <NavLink
              to="/approvals"
              className="relative p-2 rounded-lg bg-[#131e38] border border-[#22345e] text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {pendingApprovalsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-[9px] font-bold text-black flex items-center justify-center animate-bounce">
                  {pendingApprovalsCount}
                </span>
              )}
            </NavLink>

            {/* Sign Out Button */}
            <button
              onClick={logout}
              title="Sign Out"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#131e38] border border-[#22345e] text-slate-400 hover:text-rose-400 hover:border-rose-500/40 text-xs font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto bg-[#070b14] p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
