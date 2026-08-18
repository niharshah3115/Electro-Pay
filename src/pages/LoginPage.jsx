import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Lock, Mail, Building2, ArrowRight, ShieldCheck, AlertCircle, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, signup, isAuthenticated, loading: authLoading } = useAuth();
  const { success, error: showError } = useToast();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // If already authenticated, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Map Firebase Auth error codes to user-friendly messages
  const getFirebaseErrorMessage = (error) => {
    const code = error?.code || '';
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email address or password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Please sign in.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/network-request-failed':
        return 'Network connection issue. Please check your internet connection.';
      case 'auth/too-many-requests':
        return 'Too many failed login attempts. Please try again in a few minutes.';
      default:
        return error?.message || 'Authentication failed. Please verify credentials.';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email.trim() || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    if (mode === 'register') {
      if (!businessName.trim()) {
        setFormError('Please enter your Electrical Distributor / Business Name.');
        return;
      }
      if (password.length < 6) {
        setFormError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setFormError('Passwords do not match. Please re-enter.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        await signup(email, password, businessName);
        success('Account Created', `Welcome to ElectroTrack, ${businessName}!`);
      } else {
        await login(email, password);
        success('Signed In', 'Welcome back to ElectroTrack!');
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Firebase Auth Error:', err);
      const friendlyMsg = getFirebaseErrorMessage(err);
      setFormError(friendlyMsg);
      showError('Authentication Failed', friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Header */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-xl shadow-brand-500/30 border border-brand-300/30">
            <Zap className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-center text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          ElectroTrack
        </h1>
        <p className="mt-1 text-center text-xs sm:text-sm text-slate-400">
          Electrical Distributor Credit & 35-Day Payment Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/90 border border-slate-800 py-8 px-6 sm:px-10 rounded-3xl shadow-2xl backdrop-blur-xl space-y-6">
          {/* Sign In / Register Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-950/80 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setFormError('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('register');
                setFormError('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register</span>
            </button>
          </div>

          {/* Form Error Banner */}
          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <Input
                label="Distributor Firm / Business Name"
                type="text"
                placeholder="e.g. Shree Balaji Electricals"
                icon={Building2}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
            )}

            <Input
              label="Distributor Email Address"
              type="email"
              placeholder="distributor@example.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              helperText={mode === 'register' ? 'Minimum 6 characters' : undefined}
            />

            {mode === 'register' && (
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                icon={Lock}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            )}

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full mt-2 font-bold shadow-lg shadow-brand-500/25"
              icon={ArrowRight}
              iconPosition="right"
            >
              {mode === 'register' ? 'Create Distributor Account' : 'Sign In to ElectroTrack'}
            </Button>
          </form>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setFormError('');
              }}
              className="text-xs text-slate-400 hover:text-brand-300 transition-colors cursor-pointer"
            >
              {mode === 'login'
                ? "Don't have an account yet? Register firm"
                : 'Already registered? Sign in here'}
            </button>
          </div>
        </div>

        {/* Security / 39-Day Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Secure Firebase Authentication • Passwords Never Exposed</span>
        </div>
      </div>
    </div>
  );
}
