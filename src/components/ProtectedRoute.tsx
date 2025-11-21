import * as React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { Skeleton } from './ui/skeleton';
import { Card } from './ui/card';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    // Simple loading state while checking Firebase auth status
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
            <Card className="w-full max-w-3xl p-8 space-y-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-1/3" />
                <div className="space-y-4">
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                </div>
            </Card>
        </div>
    );
  }

  if (!user) {
    // Redirect unauthenticated users to the login page
    return <Navigate to="/login" replace />;
  }

  return children;
}