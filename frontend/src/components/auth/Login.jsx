import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // If already logged in, send to the proper dashboard immediately
  useEffect(() => {
    if (!currentUser) return;
    const timer = setTimeout(() => {
      switch (currentUser.role) {
        case 'requester':
          navigate('/requester/dashboard', { replace: true });
          break;
        case 'volunteer':
          navigate('/volunteer/dashboard', { replace: true });
          break;
        default:
          navigate('/', { replace: true });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      setRedirecting(true);
      switch (result.user.role) {
        case 'requester':
          navigate('/requester/dashboard');
          break;
        case 'volunteer':
          navigate('/volunteer/dashboard');
          break;
        default:
          navigate('/');
      }
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Local Care Connect App
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connect people in need with helpful volunteers
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-2">
              <span>{error}</span>
              {redirecting && (
                <div className="ml-auto flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-red-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm">Redirecting...</span>
                </div>
              )}
            </div>
          )}
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || redirecting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : redirecting ? (
                'Redirecting...'
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          <div className="text-sm text-center space-y-2">
            <p className="text-gray-600">Don't have an account?</p>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/register/requester"
                className="font-medium text-blue-600 hover:text-blue-500 px-3 py-2 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
              >
                Register as Requester
              </Link>
              <Link
                to="/register/volunteer"
                className="font-medium text-green-600 hover:text-green-500 px-3 py-2 border border-green-300 rounded-md hover:bg-green-50 transition-colors"
              >
                Register as Volunteer
              </Link>
            </div>
          </div>

          {/* <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <p className="text-sm font-semibold text-gray-700 mb-2">Demo Credentials:</p>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Super Admin:</strong> superadmin@app.com / super123</p>
              <p><strong>Admin:</strong> admin@city1.com / admin123</p>
            </div>
          </div> */}
        </form>
      </div>
    </div>
  );
};

export default Login;
