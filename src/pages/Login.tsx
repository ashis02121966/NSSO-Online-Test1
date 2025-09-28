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
      console.log('Starting database initialization...');
      const result = await DataInitializer.initializeDatabase();
      console.log('Database initialization result:', result);
      
      if (result.success) {
        setError(''); // Clear any previous errors
        alert(`Database initialized successfully! ${result.message}\n\nYou can now login with the demo credentials:\n- admin@esigma.com / password123\n- enumerator@esigma.com / password123`);
      } else {
        console.error('Database initialization failed:', result);
        setError(`Database initialization failed: ${result.message}`);
        if (result.error) {
          console.error('Detailed error:', result.error);
        }
      }
    } catch (error) {
      console.error('Database initialization exception:', error);
      setError(`Failed to initialize database: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your Supabase configuration.`);
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
    { role: 'Admin', email: 'admin@esigma.com', icon: Users, color: 'bg-red-100 text-red-700', password: 'password123', roleId: '550e8400-e29b-41d4-a716-446655440010' },
    { role: 'ZO User', email: 'zo@esigma.com', icon: Building, color: 'bg-purple-100 text-purple-700', password: 'password123', roleId: '550e8400-e29b-41d4-a716-446655440011' },
    { role: 'RO User', email: 'ro@esigma.com', icon: Building, color: 'bg-indigo-100 text-indigo-700', password: 'password123', roleId: '550e8400-e29b-41d4-a716-446655440012' },
    { role: 'Supervisor', email: 'supervisor@esigma.com', icon: UserCheck, color: 'bg-green-100 text-green-700', password: 'password123', roleId: '550e8400-e29b-41d4-a716-446655440013' },
    { role: 'Enumerator', email: 'enumerator@esigma.com', icon: User, color: 'bg-blue-100 text-blue-700', password: 'password123', roleId: '550e8400-e29b-41d4-a716-446655440014' }
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

        </div>
      </div>
    </div>
  );
}