"use client";

    import React from 'react';
    import BrandStrategyCalculatorContent from './BrandStrategyCalculatorContent';
    import { auth } from '@/lib/firebase';
    import { Button } from '@/components/ui/button';
    import { signOut } from 'firebase/auth';

    const BrandStrategyCalculator = () => {
      const handleSignOut = async () => {
        try {
          await signOut(auth);
        } catch (err: any) {
          console.error("Error signing out:", err);
        }
      };

      return (
        <>
          <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
            <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-primary">BrandPulse Analytics</h1>
                <p className="text-sm text-gray-500">Brand Strategy Performance Calculator</p>
              </div>
              <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
            </div>
          </div>
          <BrandStrategyCalculatorContent />
        </>
      );
    };

    export default BrandStrategyCalculator;
