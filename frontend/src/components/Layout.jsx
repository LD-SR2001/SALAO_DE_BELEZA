import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Scissors,
  Users,
  UserCheck,
  MessageCircle,
  Settings,
  LogOut,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/agenda', label: 'Agenda', icon: Calendar },
  { to: '/atendimentos', label: 'Atendimentos', icon: ClipboardList },
  { to: '/profissionais', label: 'Profissionais', icon: UserCheck },
  { to: '/servicos', label: 'Serviços', icon: Scissors },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/conversas', label: 'WhatsApp', icon: MessageCircle },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Scissors size={24} />
          <span>Salão</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button className="nav-item logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
