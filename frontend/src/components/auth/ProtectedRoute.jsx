import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    const role = currentUser.role;
    const roleHome = role === 'admin'
      ? '/admin/dashboard'
      : role === 'requester'
      ? '/requester/dashboard'
      : role === 'volunteer'
      ? '/volunteer/dashboard'
      : '/login';
    return <Navigate to={roleHome} replace />;
  }

  return children;
};

export default ProtectedRoute;
