import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';

export function App() {
  return window.location.pathname === '/login' ? <LoginPage /> : <HomePage />;
}
