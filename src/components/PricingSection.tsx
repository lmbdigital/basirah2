"use client";

import React from 'react';
import { Check, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Plan {
    name: string;
    price: number;
    duration: number;
    monthlyPrice: number;
    features: string[];
    savings: string;
    popular: boolean;
  }

interface PricingSectionProps {
    onSelectPlan: (plan: Plan) => void;
}

const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan }) => {
  const plans: Plan[] = [
    {
      name: "Starter",
      price: 479,
      duration: 6,
      monthlyPrice: 80,
      features: [
        "Full Access to Brand Analytics Calculator",
        "Score History & Tracking",
        "Basic Performance Metrics",
        "Data Export Options",
        "Email Support"
      ],
      savings: "Save ₹1,001 compared to monthly",
      popular: false
    },
    {
      name: "Professional",
      price: 879,
      duration: 12,
      monthlyPrice: 73,
      features: [
        "Everything in Starter, plus:",
        "Personalized Brand Recommendations",
        "Detailed Performance Analysis",
        "Priority Email Support",
        "Monthly Brand Health Reports",
        "Custom Metric Weightage"
      ],
      savings: "Save ₹2,591 compared to monthly",
      popular: true
    },
    {
      name: "Enterprise",
      price: 1532,
      duration: 24,
      monthlyPrice: 64,
      features: [
        "Everything in Professional, plus:",
        "Strategic Brand Consulting",
        "Quarterly Strategy Sessions",
        "Premium Support",
        "Competitor Benchmarking",
        "Custom Export Formats"
      ],
      savings: "Save ₹5,728 compared to monthly",
      popular: false
    }
  ];

  return (
    <div className="py-8">
      <div className="text-center space-y-4 mb-8">
        <h2 className="text-3xl font-bold">Choose Your Plan</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Transform your brand strategy with comprehensive analytics and expert insights
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
        {plans.map((plan) => (
          <Card key={plan.name} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
            )}

            <CardHeader>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>
                {plan.duration} months subscription
              </CardDescription>
              <div className="mt-4">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-3xl font-bold">₹{plan.price}</span>
                  <span className="text-muted-foreground">/ {plan.duration} mo</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Just ₹{plan.monthlyPrice}/month
                </div>
                <div className="text-sm text-green-600 dark:text-green-400 font-medium mt-2">
                  {plan.savings}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button 
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
                onClick={() => onSelectPlan(plan)}
              >
                Get Started
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-8 text-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="flex items-center gap-2 mx-auto text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              Secure payment powered by Razorpay
            </TooltipTrigger>
            <TooltipContent>
              <p>256-bit SSL secured payment</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default PricingSection;
