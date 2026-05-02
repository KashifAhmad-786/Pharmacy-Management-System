
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Medicines from './pages/Medicines';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import MainLayout from './components/MainLayout';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));

  const login = (token: string) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login onLogin={login} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/" 
          element={isAuthenticated ? <MainLayout onLogout={logout} /> : <Navigate to="/login" />}
        >
          <Route index element={<Dashboard />} />
          <Route path="medicines" element={<Medicines />} />
          <Route path="sales" element={<Sales />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
