import { Link, useLocation } from 'react-router-dom';
import {
  Home, ClipboardList, Shield, LayoutTemplate,
  AlertTriangle, Wrench, Tags, Menu, X,
  ChevronLeft, ChevronRight, Users, LogOut, User as UserIcon, MoreVertical
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const { token, user, currentWorkspaceId, setCurrentWorkspaceId, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  if (!token) return null;

  const mainLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/closures', label: 'Fechamentos', icon: ClipboardList },
    ...(user?.role === 'ADMIN' ? [{ path: '/admin', label: 'Admin', icon: Shield }] : []),
  ];

  const manageLinks = [
    { path: '/manage/applications', label: 'Aplicações', icon: LayoutTemplate },
    { path: '/manage/modules', label: 'Módulos', icon: Wrench },
    { path: '/manage/incidents', label: 'Incidentes', icon: AlertTriangle },
    { path: '/manage/actions', label: 'Ações', icon: ClipboardList },
    { path: '/manage/tags', label: 'Tags', icon: Tags },
    ...(user?.role === 'ADMIN' ? [{ path: '/manage/users', label: 'Usuários', icon: Users }] : []),
  ];

  const navItemClass = (path: string) => {
    const isActive = location.pathname === path;
    return `text-sm flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 cursor-pointer ${
      isActive
        ? 'bg-brand-tint text-brand font-semibold'
        : 'text-ink-500 hover:bg-hover hover:text-ink-900'
    }`;
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-40 w-10 h-10 rounded-lg flex items-center justify-center bg-surface border border-line shadow-sm text-ink-900"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        onClick={() => !isExpanded && setIsExpanded(true)}
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-surface-2 border-r border-line flex flex-col transition-all duration-300 ease-in-out ${
          isExpanded ? 'w-48' : 'w-[4.5rem] cursor-pointer'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Desktop Only: Floating Collapse/Expand Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full items-center justify-center shadow-md transition-transform duration-150 z-50 hover:scale-110 bg-surface border border-line-strong text-ink-900"
          title={isExpanded ? "Recolher Sidebar" : "Expandir Sidebar"}
        >
          {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* Header & Logo */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-line flex-shrink-0">
          <Link to="/" className={`flex items-center gap-3 overflow-hidden ${!isExpanded ? 'justify-center w-full' : ''}`}>
            <div className="min-w-8 w-8 h-8 rounded-lg flex items-center justify-center bg-brand text-on-brand font-bold text-lg">
              T
            </div>
            {isExpanded && (
              <span className="font-bold text-lg whitespace-nowrap text-ink-900 tracking-tight">
                Taxonomia
              </span>
            )}
          </Link>

          {/* Mobile Close Button */}
          <button
            className="lg:hidden p-1.5 rounded-lg hover:bg-hover text-ink-500"
            onClick={() => setIsMobileOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-6 custom-scrollbar">

          {/* Workspace Switcher */}
          {user && user.workspaces && user.workspaces.length > 0 && (
            <div className="flex flex-col gap-1 mb-2">
              {isExpanded && <span className="px-3 text-[11px] font-mono font-medium uppercase tracking-wider mb-1 text-ink-300">Workspace</span>}

              {isExpanded ? (
                <select
                  value={currentWorkspaceId || ''}
                  onChange={(e) => setCurrentWorkspaceId(e.target.value)}
                  className="form-input block p-2"
                >
                  {user.workspaces.map((ws) => (
                    <option key={ws._id} value={ws._id}>
                      {ws.name} {ws.isGlobal ? '(Global)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div
                  className="w-full flex justify-center py-2"
                  title={user.workspaces.find(w => w._id === currentWorkspaceId)?.name || 'Workspace'}
                >
                  <div className="w-8 h-8 rounded-full bg-sunken flex items-center justify-center border border-line shadow-sm">
                    <span className="text-xs font-bold text-ink-900">
                      {user.workspaces.find(w => w._id === currentWorkspaceId)?.name?.charAt(0).toUpperCase() || 'W'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Main Links */}
          <div className="flex flex-col gap-1">
            {isExpanded && <span className="px-3 text-[11px] font-mono font-medium uppercase tracking-wider mb-2 text-ink-300">Principal</span>}
            {mainLinks.map(link => (
              <Link key={link.path} to={link.path} className={navItemClass(link.path)} title={!isExpanded ? link.label : undefined}>
                <link.icon size={20} className="min-w-[20px]" strokeWidth={1.5} />
                {isExpanded && <span className="whitespace-nowrap">{link.label}</span>}
              </Link>
            ))}
          </div>

          {/* Manage Links */}
          <div className="flex flex-col gap-1">
            {isExpanded && <span className="px-3 text-[11px] font-mono font-medium uppercase tracking-wider mb-2 text-ink-300">Administração</span>}
            {manageLinks.map(link => (
              <Link key={link.path} to={link.path} className={navItemClass(link.path)} title={!isExpanded ? link.label : undefined}>
                <link.icon size={20} className="min-w-[20px]" strokeWidth={1.5} />
                {isExpanded && <span className="whitespace-nowrap">{link.label}</span>}
              </Link>
            ))}
          </div>

        </div>

        {/* User Footer */}
        {user && (
          <div className="border-t border-line p-3 relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center w-full gap-3 p-2 rounded-lg hover:bg-hover transition-colors text-left"
            >
              {user.photoUrl ? (
                <img src={user.photoUrl} alt="Avatar" className="w-10 h-10 min-w-[40px] rounded-full object-cover border border-line" />
              ) : (
                <div className="w-10 h-10 min-w-[40px] rounded-full bg-brand flex items-center justify-center text-on-brand font-bold">
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
              )}

              {isExpanded && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">{user.name}</p>
                  <p className="text-xs text-ink-400 truncate">{user.email}</p>
                </div>
              )}

              {isExpanded && (
                <MoreVertical size={16} className="text-ink-500" />
              )}
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                <div className={`absolute z-50 bottom-full mb-2 bg-surface border border-line rounded-xl shadow-md overflow-hidden py-1 ${isExpanded ? 'left-3 right-3' : 'left-14 w-48'}`}>
                  <Link
                    to="/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-900 hover:bg-hover transition-colors"
                  >
                    <UserIcon size={16} strokeWidth={1.5} /> Meu Perfil
                  </Link>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                    }}
                    className="flex items-center w-full gap-3 px-4 py-2.5 text-sm text-danger-fg hover:bg-danger-bg transition-colors text-left"
                  >
                    <LogOut size={16} strokeWidth={1.5} /> Sair
                  </button>
                </div>
              </>
            )}
          </div>
        )}

      </aside>
    </>
  );
}
