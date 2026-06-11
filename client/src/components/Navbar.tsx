import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const links = [
    { path: '/', label: 'Home' },
    { path: '/admin', label: 'Admin Dashboard' },
    { path: '/manage/applications', label: 'Applications' },
    { path: '/manage/modules', label: 'Modules' },
    { path: '/manage/incidents', label: 'Incidents' },
    { path: '/manage/actions', label: 'Actions' },
    { path: '/manage/tags', label: 'Tags' }
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center space-x-3 font-bold text-xl">
          <div className="w-8 h-8 bg-red-600 rounded-md flex items-center justify-center text-white italic">
            C
          </div>
          <span>Taxonomia</span>
        </Link>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`${isOpen ? 'block' : 'hidden'} md:flex absolute md:relative top-16 md:top-0 left-0 right-0 md:left-auto md:right-auto bg-white md:bg-transparent border-b md:border-b-0 flex-col md:flex-row md:space-x-6 p-6 md:p-0`}>
          {links.map(link => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={`py-2 md:py-0 font-medium transition-colors ${location.pathname === link.path
                ? 'text-blue-600 border-b-2 md:border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-800'}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
