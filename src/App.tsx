import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth';
import { RequireAdmin } from '@/components/AppShell';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import ProfileEditor from '@/pages/ProfileEditor';
import BadgeCollection from '@/pages/BadgeCollection';
import Settings from '@/pages/Settings';
import Admin from '@/pages/Admin';
import PublicProfile from '@/pages/PublicProfile';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/editor" element={<ProfileEditor />} />
          <Route path="/badges" element={<BadgeCollection />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
          <Route path="/:username" element={<PublicProfile />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
