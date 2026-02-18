import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RequesterDashboard from './components/requester/RequesterDashboard';
import RequesterProfile from './components/requester/RequesterProfile';
import VolunteerDashboard from './components/volunteer/VolunteerDashboard';
import VolunteerProfile from './components/volunteer/VolunteerProfile';
import AdminDashboard from './components/admin/AdminDashboard';
import Footer from './components/Footer';
import Landing from './components/Landing';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register/:role" element={<Register />} />

              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/requester/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['requester']}>
                    <RequesterDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/requester/profile"
                element={
                  <ProtectedRoute allowedRoles={['requester']}>
                    <RequesterProfile />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/volunteer/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['volunteer']}>
                    <VolunteerDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/volunteer/profile"
                element={
                  <ProtectedRoute allowedRoles={['volunteer']}>
                    <VolunteerProfile />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
