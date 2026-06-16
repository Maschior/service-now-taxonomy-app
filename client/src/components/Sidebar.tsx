import { Link, useLocation } from 'react-router-dom';
import { 
  Home, ClipboardList, Shield, LayoutTemplate, 
  AlertTriangle, Wrench, Tags, Menu, X, 
  ChevronLeft, ChevronRight, Sun, Moon 
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDarkMode } from '../hooks/useDarkMode';

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useDarkMode();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const mainLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/closures', label: 'Fechamentos', icon: ClipboardList },
    { path: '/admin', label: 'Admin', icon: Shield },
  ];

  const manageLinks = [
    { path: '/manage/applications', label: 'Aplicações', icon: LayoutTemplate },
    { path: '/manage/modules', label: 'Módulos', icon: Wrench },
    { path: '/manage/incidents', label: 'Incidentes', icon: AlertTriangle },
    { path: '/manage/actions', label: 'Ações', icon: ClipboardList }, 
    { path: '/manage/tags', label: 'Tags', icon: Tags },
  ];

  const navItemClass = (path: string) => {
    const isActive = location.pathname === path;
    return `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
      isActive 
        ? 'bg-[var(--accent-primary-bg)] text-[var(--accent-primary)] font-medium shadow-sm' 
        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'
    }`;
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button 
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-40 w-10 h-10 rounded-xl flex items-center justify-center glass-surface"
        style={{ color: 'var(--text-primary)' }}
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
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen glass-surface border-r border-[var(--border-primary)] flex flex-col transition-all duration-300 ease-in-out ${
          isExpanded ? 'w-64' : 'w-[4.5rem]'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Desktop Only: Floating Collapse/Expand Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full items-center justify-center shadow-md transition-all duration-200 z-50 hover:scale-110"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-secondary)', color: 'var(--text-primary)' }}
          title={isExpanded ? "Recolher Sidebar" : "Expandir Sidebar"}
        >
          {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* Header & Logo */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-[var(--border-primary)] flex-shrink-0">
          <Link to="/" className={`flex items-center gap-3 overflow-hidden ${!isExpanded ? 'justify-center w-full' : ''}`}>
            <div className="min-w-8 w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-lg italic shadow-md"
              style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}>
              T
            </div>
            {isExpanded && (
              <span className="font-bold text-lg whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                Taxonomia
              </span>
            )}
          </Link>

          {/* Mobile Close Button */}
          <button 
            className="lg:hidden p-1.5 rounded-lg hover:bg-[var(--bg-secondary)]"
            onClick={() => setIsMobileOpen(false)}
            style={{ color: 'var(--text-secondary)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-6 custom-scrollbar">
          
          {/* Main Links */}
          <div className="flex flex-col gap-1">
            {isExpanded && <span className="px-3 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Principal</span>}
            {mainLinks.map(link => (
              <Link key={link.path} to={link.path} className={navItemClass(link.path)} title={!isExpanded ? link.label : undefined}>
                <link.icon size={20} className="min-w-[20px]" />
                {isExpanded && <span className="whitespace-nowrap">{link.label}</span>}
              </Link>
            ))}
          </div>

          {/* Manage Links */}
          <div className="flex flex-col gap-1">
            {isExpanded && <span className="px-3 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Administração</span>}
            {manageLinks.map(link => (
              <Link key={link.path} to={link.path} className={navItemClass(link.path)} title={!isExpanded ? link.label : undefined}>
                <link.icon size={20} className="min-w-[20px]" />
                {isExpanded && <span className="whitespace-nowrap">{link.label}</span>}
              </Link>
            ))}
          </div>

        </div>

        {/* Footer Actions (Theme Toggle & Expand/Collapse) */}
        <div className="border-t border-[var(--border-primary)] p-3 flex flex-col gap-2 flex-shrink-0">
          <button
            onClick={toggleTheme}
            className={`flex items-center ${isExpanded ? 'justify-start px-3' : 'justify-center'} py-2.5 rounded-xl transition-all duration-200 hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]`}
            title={!isExpanded ? "Alterar Tema" : undefined}
          >
            <div className="relative min-w-[20px] w-5 h-5 flex items-center justify-center">
              <span className="absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out"
                style={{ transform: theme === 'dark' ? 'rotate(90deg) scale(0)' : 'rotate(0) scale(1)', opacity: theme === 'dark' ? 0 : 1 }}>
                <Sun size={20} />
              </span>
              <span className="absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out"
                style={{ transform: theme === 'dark' ? 'rotate(0) scale(1)' : 'rotate(-90deg) scale(0)', opacity: theme === 'dark' ? 1 : 0 }}>
                <Moon size={20} />
              </span>
            </div>
            {isExpanded && <span className="ml-3 whitespace-nowrap font-medium">Alterar Tema</span>}
          </button>

          </button>
        </div>

      </aside>
    </>
  );
}
