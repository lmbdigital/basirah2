"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface HistoryEntry {
  id: string;
  brandName: string;
  date: string;
  metrics: Record<string, string>;
  scores: Record<string, number>;
}

const BrandDashboard = ({ brandName }: { brandName: string }) => {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [timeRange, setTimeRange] = useState<'1 Week' | '1 Month' | '6 Month' | 'YTD' | '1 Year' | '5 Year' | 'Max'>('1 Month');

  useEffect(() => {
    const fetchHistory = async () => {
      if (!auth.currentUser) return;
      const historyCollection = collection(db, 'history');
      const q = query(historyCollection, where('userId', '==', auth.currentUser.uid), where('brandName', '==', brandName));
      try {
        const querySnapshot = await getDocs(q);
        const fetchedHistory = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as HistoryEntry));
        setHistory(fetchedHistory);
      } catch (error) {
        console.error("Error fetching history:", error);
      }
    };

    fetchHistory();
  }, [brandName]);

  const filterHistoryByTimeRange = (history: HistoryEntry[]) => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '1 Week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '1 Month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '6 Month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case 'YTD':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case '1 Year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      case '5 Year':
        startDate = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
        break;
      case 'Max':
      default:
        return history;
    }

    return history.filter(entry => new Date(entry.date) >= startDate);
  };

  const filteredHistory = filterHistoryByTimeRange(history);

  const overallScoreData = filteredHistory.map(entry => ({
    date: formatDate(entry.date),
    score: entry.scores.overall,
  }));

  const categoryScoreData = filteredHistory.map(entry => {
    const categoryData: Record<string, number> = {};
    Object.keys(entry.scores).forEach(key => {
      if (key !== 'overall') {
        categoryData[key] = entry.scores[key];
      }
    });
    return {
      date: formatDate(entry.date),
      ...categoryData,
    };
  });

  const metricTrendData = filteredHistory.map(entry => {
    const metricData: Record<string, string> = {};
    Object.keys(entry.metrics).forEach(key => {
      metricData[key] = entry.metrics[key];
    });
    return {
      date: formatDate(entry.date),
      ...metricData,
    };
  });

  const allMetrics = {
    awareness: {
      reachImpressions: { label: 'Reach (millions)', weight: 0.04, placeholder: 'Total impressions across channels' },
      brandRecall: { label: 'Brand Recall (%)', weight: 0.04, placeholder: 'Percentage who remember your brand' },
      engagementRate: { label: 'Engagement Rate (%)', weight: 0.04, placeholder: 'Average engagement across channels' },
      directTraffic: { label: 'Direct Traffic (thousands)', weight: 0.04, placeholder: 'Monthly direct website visitors' },
      brandSearchVolume: { label: 'Brand Search Volume (thousands)', weight: 0.04, placeholder: 'Monthly brand searches' }
    },
    perception: {
      brandImageScore: { label: 'Brand Image Score', weight: 0.05, placeholder: 'Overall brand perception (0-100)' },
      sentimentScore: { label: 'Sentiment Score', weight: 0.05, placeholder: 'Positive sentiment percentage' },
      socialMediaGrowth: { label: 'Social Media Growth (%)', weight: 0.05, placeholder: 'Follower growth rate' },
      purchaseIntent: { label: 'Purchase Intent Score', weight: 0.05, placeholder: 'Purchase likelihood (0-100)' },
      socialProof: { label: 'Social Proof Score', weight: 0.05, placeholder: 'Average review rating (0-100)' }
    },
    loyalty: {
      npsScore: { label: 'NPS', weight: 0.05, placeholder: 'Net Promoter Score (-100 to 100)' },
      repeatPurchaseRate: { label: 'Repeat Purchase Rate (%)', weight: 0.05, placeholder: 'Percentage of repeat customers' },
      clv: { label: 'CLV (thousands)', weight: 0.05, placeholder: 'Customer Lifetime Value' },
      aov: { label: 'AOV', weight: 0.05, placeholder: 'Average Order Value' },
      timeBetweenPurchases: { label: 'Purchase Frequency (days)', weight: 0.05, placeholder: 'Average days between purchases' }
    },
    performance: {
      marketShare: { label: 'Market Share (%)', weight: 0.04, placeholder: 'Percentage of market share' },
      revenueGrowth: { label: 'Revenue Growth (%)', weight: 0.04, placeholder: 'Year-over-year growth rate' },
      profitMargins: { label: 'Profit Margins (%)', weight: 0.04, placeholder: 'Net profit margin' },
      cac: { label: 'CAC', weight: 0.04, placeholder: 'Customer Acquisition Cost' },
      marketingROI: { label: 'Marketing ROI (%)', weight: 0.04, placeholder: 'Return on Marketing Investment' }
    },
    distribution: {
      distributionCoverage: { label: 'Distribution Coverage (%)', weight: 0.04, placeholder: 'Market coverage percentage' },
      salesVelocity: { label: 'Sales Velocity', weight: 0.04, placeholder: 'Units sold per period' },
      roas: { label: 'ROAS', weight: 0.04, placeholder: 'Return on Ad Spend' }
    },
    equity: {
      brandValue: { label: 'Brand Valuation (INR)', weight: 0.03, placeholder: 'Overall brand worth in INR' },
      brandStrength: { label: 'Brand Strength', weight: 0.03, placeholder: 'Overall brand strength (0-100)' },
      brandResonance: { label: 'Brand Resonance', weight: 0.03, placeholder: 'Customer connection score (0-100)' },
      mediaCoverage: { label: 'Media Coverage Quality', weight: 0.03, placeholder: 'Media sentiment score (0-100)' },
      influencerAffinity: { label: 'Influencer Brand Affinity', weight: 0.03, placeholder: 'Influencer alignment score (0-100)' }
    }
  };

  const colors = [
    "#2563eb",
    "#16a34a",
    "#c2410c",
    "#7c3aed",
    "#eab308",
    "#0e7490",
    "#9f1239",
    "#06b6d4",
    "#78350f",
    "#059669",
    "#9333ea",
    "#b45309",
    "#0891b2",
    "#9a3412",
    "#047857",
    "#7e22ce",
    "#a16207",
    "#0284c7",
    "#94a3b8",
    "#06b6d4",
    "#78350f",
    "#059669",
    "#9333ea",
    "#b45309",
    "#0891b2",
    "#9a3412",
    "#047857",
    "#7e22ce",
    "#a16207",
    "#0284c7",
    "#94a3b8",
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4 flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Overview
      </Button>

      <div className="flex justify-end mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Time Range: {timeRange}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setTimeRange('1 Week')}>1 Week</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTimeRange('1 Month')}>1 Month</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTimeRange('6 Month')}>6 Month</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTimeRange('YTD')}>YTD</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTimeRange('1 Year')}>1 Year</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTimeRange('5 Year')}>5 Year</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTimeRange('Max')}>Max</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overall Score Trend for {brandName}</CardTitle>
          <CardDescription>
            Trend of overall score over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={overallScoreData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#2563eb" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Category Score Trends for {brandName}</CardTitle>
          <CardDescription>
            Trends of category scores over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={categoryScoreData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              {Object.keys(allMetrics).map((category, index) => (
                <Line
                  key={category}
                  type="monotone"
                  dataKey={category}
                  stroke={colors[index % colors.length]}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {Object.entries(allMetrics).map(([category, categoryMetrics]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle>{category} Metric Trends</CardTitle>
            <CardDescription>
              Trends of individual metrics within the {category} category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metricTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {Object.keys(categoryMetrics).map((metric, index) => (
                  <Line
                    key={metric}
                    type="monotone"
                    dataKey={metric}
                    stroke={colors[index % colors.length]}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BrandDashboard;

