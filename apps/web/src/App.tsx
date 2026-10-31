import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { DemoPage } from './pages/DemoPage';

export function App() {
  if (window.location.pathname === '/demo') return <DemoPage />;
  return window.location.pathname === '/login' ? <LoginPage /> : <HomePage />;
}
