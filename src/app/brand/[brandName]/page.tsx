"use client";

    import React from 'react';
    import BrandDashboard from '@/components/BrandDashboard';
    import { useParams } from 'next/navigation';

    const BrandPage = () => {
      const params = useParams();
      const { brandName } = params;

      return (
        <BrandDashboard brandName={brandName} />
      );
    };

    export default BrandPage;
