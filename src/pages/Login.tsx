import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { DataInitializer } from '../services/dataInitializer';
import { FileText, AlertCircle, Users, Building, UserCheck, User } from 'lucide-react';

export function Login() {
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('admin@esigma.com');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleInitializeDatabase = async () => {
    setIsInitializing(true);
    setError('');

    try {
      const result = await DataInitializer.initializeDatabase();
      if (result.success) {
        setError(''); // Clear any previous errors
        alert('Database initialized successfully! You can now login with the demo credentials.');
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to initialize database. Please check your Supabase configuration.');
    } finally {
      setIsInitializing(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    setError('');

    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.message);
    } else {
      // Login successful, navigation will be handled by the auth context
      console.log('Login successful');
    }
    
    setIsLoading(false);
  };

  const demoCredentials = [
    { role: 'Admin', email: 'admin@esigma.com', icon: Users, color: 'bg-red-100 text-red-700', password: 'password123' },
    { role: 'ZO User', email: 'zo@esigma.com', icon: Building, color: 'bg-purple-100 text-purple-700', password: 'password123' },
    { role: 'RO User', email: 'ro@esigma.com', icon: Building, color: 'bg-indigo-100 text-indigo-700', password: 'password123' },
    { role: 'Supervisor', email: 'supervisor@esigma.com', icon: UserCheck, color: 'bg-green-100 text-green-700', password: 'password123' },
    { role: 'Enumerator', email: 'enumerator@esigma.com', icon: User, color: 'bg-blue-100 text-blue-700', password: 'password123' }
  ];

  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError(''); // Clear any existing errors
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">eSigma Survey Platform</h1>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Database Initialization Section */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Database Setup</h4>
            <p className="text-xs text-blue-800 mb-3">
              If this is your first time, initialize the database with sample data including users, surveys, and settings.
            </p>
            <Button
              onClick={handleInitializeDatabase}
              disabled={isInitializing}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              {isInitializing ? 'Initializing Database...' : 'Initialize Database'}
            </Button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Demo Accounts - Click to Login:</h4>
            <div className="mb-3 p-2 bg-green-100 rounded text-xs text-green-800">
              <strong>Production Mode:</strong> Connected to Supabase database. 
              Initialize database first, then use these credentials.
            </div>
            <div className="space-y-2">
              {demoCredentials.map((cred) => (
                <button
                  key={cred.email}
                  onClick={() => handleDemoLogin(cred.email)}
                  className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all text-left"
                >
                  <div className={`p-1.5 rounded-lg ${cred.color}`}>
                    <cred.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{cred.role}</p>
                    <p className="text-xs text-gray-500">{cred.email}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              All accounts use password: <span className="font-mono">password123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}