"use client";

    import React, { useState } from 'react';
    import { auth } from '@/lib/firebase';
    import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
    import { Input } from "@/components/ui/input";
    import { Button } from "@/components/ui/button";
    import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

    const Login = ({ onLogin }: { onLogin: () => void }) => {
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [isSignUp, setIsSignUp] = useState(false);
      const [error, setError] = useState<string | null>(null);

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
          if (isSignUp) {
            await createUserWithEmailAndPassword(auth, email, password);
          } else {
            await signInWithEmailAndPassword(auth, email, password);
          }
          onLogin();
        } catch (err: any) {
          setError(err.message);
        }
      };

      const handleGoogleSignIn = async () => {
        setError(null);
        try {
          const provider = new GoogleAuthProvider();
          await signInWithPopup(auth, provider);
          onLogin();
        } catch (err: any) {
          setError(err.message);
        }
      };

      const handleSignOut = async () => {
        try {
          await signOut(auth);
          onLogin();
        } catch (err: any) {
          setError(err.message);
        }
      };

      return (
        <div className="flex items-center justify-center h-screen">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>{isSignUp ? 'Sign Up' : 'Login'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Button type="submit" className="w-full">
                  {isSignUp ? 'Sign Up' : 'Login'}
                </Button>
                <Button type="button" variant="link" onClick={() => setIsSignUp(!isSignUp)}>
                  {isSignUp ? 'Already have an account? Login' : 'Need an account? Sign Up'}
                </Button>
                <Button type="button" variant="outline" onClick={handleGoogleSignIn} className="w-full flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                    <path d="M16.51 8H16.5v-.6H16.5c-.03-.3-.08-.6-.15-.8-.07-.2-.17-.4-.28-.5-.11-.1-.24-.2-.38-.2-.14 0-.27.1-.38.2-.11.1-.21.3-.28.5-.07.2-.12.5-.15.8h-.01v.6h.01c.03.3.08.6.15.8.07.2.17.4.28.5.11.1.24.2.38.2.14 0 .27-.1.38-.2.11-.1.21-.3.28-.5.07-.2.12-.5.15-.8h.01zm-1.51 0c0 .8-.2 1.5-.6 2.1-.4.6-.9 1-1.5 1.3-.6.3-1.3.5-2.1.5-.8 0-1.5-.2-2.1-.5-.6-.3-1.1-.7-1.5-1.3-.4-.6-.6-1.3-.6-2.1 0-.8.2-1.5.6-2.1.4-.6.9-1 1.5-1.3.6-.3 1.3-.5 2.1-.5.8 0 1.5.2 2.1.5.6.3 1.1.7 1.5 1.3.4.6.6 1.3.6 2.1zm-3.5 0c0 .5-.1.9-.3 1.2-.2.3-.5.5-.8.6-.3.1-.7.2-1.1.2-.4 0-.7-.1-1.1-.2-.3-.1-.6-.3-.8-.6-.2-.3-.3-.7-.3-1.2 0-.5.1-.9.3-1.2.2-.3.5-.5.8-.6.3-.1.7-.2 1.1-.2.4 0 .7.1 1.1.2.3.1.6.3.8.6.2.3.3.7.3 1.2zm-4.5 0c0 1.1.4 2.1 1.1 2.8.7.7 1.6 1.1 2.8 1.1 1.1 0 2.1-.4 2.8-1.1.7-.7 1.1-1.6 1.1-2.8 0-1.1-.4-2.1-1.1-2.8-.7-.7-1.6-1.1-2.8-1.1-1.1 0-2.1.4-2.8 1.1-.7.7-1.1 1.6-1.1 2.8zm-1.5 0c0 1.4.5 2.6 1.4 3.5.9.9 2.1 1.4 3.5 1.4 1.4 0 2.6-.5 3.5-1.4.9-.9 1.4-2.1 1.4-3.5 0-1.4-.5-2.6-1.4-3.5-.9-.9-2.1-1.4-3.5-1.4-1.4 0-2.6.5-3.5 1.4-.9.9-1.4 2.1-1.4 3.5zM18 8c0 4.4-3.6 8-8 8S2 12.4 2 8 5.6 0 10 0s8 3.6 8 8zM9 15.5c3.9 0 7-3.1 7-7s-3.1-7-7-7-7 3.1-7 7 3.1 7 7 7z"/>
                  </svg>
                  Sign In with Google
                </Button>
                {auth.currentUser && (
                  <Button type="button" variant="outline" onClick={handleSignOut} className="w-full">
                    Sign Out
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      );
    };

    export default Login;
