// src/app/page.tsx
    "use client";

    import BrandStrategyCalculator from '../components/BrandStrategyCalculator';
    import Login from '../components/Login';
    import { useState, useEffect } from 'react';
    import { auth } from '@/lib/firebase';
    import { onAuthStateChanged } from 'firebase/auth';
    import BrandsOverview from '@/components/BrandsOverview';

    export default function Home() {
      const [user, setUser] = useState<any>(null);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          setLoading(false);
        });

        return () => unsubscribe();
      }, []);

      const handleLogin = () => {
        setUser(auth.currentUser);
      };

      if (loading) {
        return <div>Loading...</div>;
      }

      return (
        <main className="container mx-auto py-8">
          {user ? (
            <>
              <BrandsOverview />
              <BrandStrategyCalculator />
            </>
          ) : (
            <Login onLogin={handleLogin} />
          )}
        </main>
      );
    }
