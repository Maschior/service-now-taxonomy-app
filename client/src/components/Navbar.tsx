import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, Settings } from 'lucide-react';
import { useState } from 'react';
import { useDarkMode } from '../hooks/useDarkMode';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useDarkMode();

  const mainLinks = [
    { path: '/', label: 'Home' },
    { path: '/closures', label: 'Fechamentos' },
    { path: '/admin', label: 'Admin' },
  ];

  const manageLinks = [
    { path: '/manage/applications', label: 'Apps' },
    { path: '/manage/modules', label: 'Módulos' },
    { path: '/manage/incidents', label: 'Incidentes' },
    { path: '/manage/actions', label: 'Ações' },
    { path: '/manage/tags', label: 'Tags' },
  ];

  const allLinks = [...mainLinks, ...manageLinks];

  return (
    <nav className="glass-surface sticky top-0 z-50" style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-lg italic"
            style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}>
            T
          </div>
          <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
            Taxonomia
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-1">
          {mainLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                color: location.pathname === link.path ? 'var(--accent-primary)' : 'var(--text-secondary)',
                background: location.pathname === link.path ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
              }}
            >
              {link.label}
            </Link>
          ))}

          <div className="w-px h-5 mx-2" style={{ background: 'var(--border-primary)' }} />

          <div className="flex items-center gap-0.5 px-1 py-0.5 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
            <Settings size={14} style={{ color: 'var(--text-muted)', marginRight: '4px', marginLeft: '4px' }} />
            {manageLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className="px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200"
                style={{
                  color: location.pathname === link.path ? 'var(--accent-primary)' : 'var(--text-muted)',
                  background: location.pathname === link.path ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              color: 'var(--text-secondary)',
            }}
            aria-label="Toggle Theme"
          >
            <div className="relative w-5 h-5">
              <span
                className="absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out"
                style={{
                  transform: theme === 'dark' ? 'rotate(90deg) scale(0)' : 'rotate(0) scale(1)',
                  opacity: theme === 'dark' ? 0 : 1,
                }}
              >
                <Sun size={18} style={{ color: '#f59e0b' }} />
              </span>
              <span
                className="absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out"
                style={{
                  transform: theme === 'dark' ? 'rotate(0) scale(1)' : 'rotate(-90deg) scale(0)',
                  opacity: theme === 'dark' ? 1 : 0,
                }}
              >
                <Moon size={18} style={{ color: '#818cf8' }} />
              </span>
            </div>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              color: 'var(--text-secondary)',
            }}
          >
            {isOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div
          className="lg:hidden px-6 pb-4 animate-fade-in-up"
          style={{ borderTop: '1px solid var(--border-primary)' }}
        >
          <div className="flex flex-col gap-1 pt-2">
            {allLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  color: location.pathname === link.path ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  background: location.pathname === link.path ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
