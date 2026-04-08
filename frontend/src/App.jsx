import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Agenda from './pages/Agenda';
import Servicos from './pages/Servicos';
import Clientes from './pages/Clientes';
import Conversas from './pages/Conversas';
import Profissionais from './pages/Profissionais';
import Atendimentos from './pages/Atendimentos';
import './index.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Carregando...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="agenda" element={<Agenda />} />
            <Route path="servicos" element={<Servicos />} />
            <Route path="profissionais" element={<Profissionais />} />
            <Route path="atendimentos" element={<Atendimentos />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="conversas" element={<Conversas />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
