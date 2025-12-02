import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth';
import '../../styles/auth.css';
import { Building2 } from 'lucide-react';
import { SidebarHeader } from '../ui/sidebar';
import officeImage from '../../assets/office.png';



export function AuthModal() {
  const [isLoginView, setIsLoginView] = React.useState(true);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLoginView) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      navigate('/');
    } catch (err) {
      const firebaseError = err as { code: string, message: string };
      if (firebaseError.code === 'auth/invalid-email') {
        setError('Invalid email format.');
      } else if (firebaseError.code === 'auth/wrong-password' || firebaseError.code === 'auth/user-not-found') {
        setError('Invalid email or password.');
      } else if (firebaseError.code === 'auth/email-already-in-use') {
        setError('Email already in use.');
      } else if (firebaseError.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError('Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Reusable component for the branding side panel
  const BrandingPanel = () => (
    <div className="form-details">
      <SidebarHeader className="border-b border-slate-200 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white text=xl">Smart Office</h3>
            <p className="text-xs text-blue-100">Automation System</p>
          </div>
        </div>
      </SidebarHeader>
      <div className="branding-image-container">
        <img 
          src={officeImage}
          alt="Smart Office Interior" 
          className="auth-image"
        />
      </div>
    </div>
  );

  return (
    <div className="auth-body-container">
      <div className="blur-bg-overlay"></div>
      <div className="form-popup">
        {isLoginView ? (
          <div className="form-box login">
            <BrandingPanel />
            <div className="form-content">
              <h2>LOGIN</h2>
              {error && <p className="text-red-500 text-sm mb-2 text-center">{error}</p>}
              <form onSubmit={handleSubmit}>
                <div className="input-field">
                  <input 
                    type="text" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <label>Email</label>
                </div>
                <div className="input-field">
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <label>Password</label>
                </div>
                <a href="#" className="forgot-pass-link">Forgot password?</a>
                <button type="submit" disabled={isLoading}>
                  {isLoading ? 'Processing...' : 'Log In'}
                </button>
              </form>
              <div className="bottom-link">
                Don't have an account?
                <a href="#" id="signup-link" onClick={(e) => { e.preventDefault(); toggleView(); }}>Signup</a>
              </div>
            </div>
          </div>
        ) : (
          <div className="form-box signup">
            <BrandingPanel />
            <div className="form-content">
              <h2>SIGNUP</h2>
              {error && <p className="text-red-500 text-sm mb-2 text-center">{error}</p>}
              <form onSubmit={handleSubmit}>
                <div className="input-field">
                  <input 
                    type="text" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <label>Enter your email</label>
                </div>
                <div className="input-field">
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <label>Create password</label>
                </div>
                <div className="policy-text">
                  <input type="checkbox" id="policy" required />
                  <label htmlFor="policy">
                    I agree the
                    <a href="#" className="option">Terms & Conditions</a>
                  </label>
                </div>
                <button type="submit" disabled={isLoading}>
                  {isLoading ? 'Processing...' : 'Sign Up'}
                </button>
              </form>
              <div className="bottom-link">
                Already have an account?
                <a href="#" id="login-link" onClick={(e) => { e.preventDefault(); toggleView(); }}>Login</a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}