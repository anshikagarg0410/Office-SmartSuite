import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAuth } from '../../auth';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertTriangle, UserPlus } from 'lucide-react';

export function SignUp() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        setIsLoading(false);
        return;
    }

    try {
      await signup(email, password);
      // Automatically navigate to dashboard on successful sign up
      navigate('/');
    } catch (err) {
      const firebaseError = err as { code: string, message: string };
      if (firebaseError.code) {
        if (firebaseError.code === 'auth/email-already-in-use') {
          setError('This email is already in use. Try logging in.');
        } else if (firebaseError.code === 'auth/invalid-email') {
            setError('Invalid email address format.');
        } else if (firebaseError.code === 'auth/weak-password') {
            setError('The password is too weak. Please use a stronger password.');
        } else {
          setError('Failed to create account. Please check the details and try again.');
        }
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
      <Card className="w-full flex-shrink-0 shadow-xl" style={{ maxWidth: 380 }}>
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-xl flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Create Account
          </CardTitle>
          <CardDescription className="text-sm">Sign up to use the Smart Office Automation System.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-3 p-4 pt-0">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Sign Up Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="password">Password (min 6 characters)</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3 p-4 pt-0">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Button>
            <div className="text-center text-xs text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="underline hover:text-primary">
                SignIn
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}