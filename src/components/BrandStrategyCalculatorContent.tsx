"use client";

    import React, { useState, useEffect, useCallback, useRef } from 'react';
    import {
      Card,
      CardContent,
      CardDescription,
      CardHeader,
      CardTitle,
    } from "@/components/ui/card";
    import { Input } from "@/components/ui/input";
    import { Label } from "@/components/ui/label";
    import { Checkbox } from "@/components/ui/checkbox";
    import { Button } from "@/components/ui/button";
    import {
      Dialog,
      DialogContent,
      DialogDescription,
      DialogHeader,
      DialogTitle,
      DialogFooter,
    } from "@/components/ui/dialog";
    import {
      Tooltip,
      TooltipContent,
      TooltipProvider,
      TooltipTrigger,
    } from "@/components/ui/tooltip";
    import {
      Collapsible,
      CollapsibleContent,
      CollapsibleTrigger,
    } from "@/components/ui/collapsible";
    import { AlertCircle, CheckCircle2, XCircle, HelpCircle, ChevronDown, ChevronUp, Save, Trash2, ArrowDown, ArrowUp, File } from "lucide-react";
    import {
      RadarChart,
      PolarGrid,
      PolarAngleAxis,
      PolarRadiusAxis,
      Radar,
      ResponsiveContainer,
    } from 'recharts';
    import { auth, db } from '@/lib/firebase';
    import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';

    // Interface for history entries
    interface HistoryEntry {
      id: string;
      brandName: string;
      date: string;
      metrics: Record<string, string>;
      scores: Record<string, number>;
    }

    interface DeleteDialogProps {
      isOpen: boolean;
      onClose: () => void;
      onConfirm: () => void;
      brandName: string;
      confirmationText: string;
      setConfirmationText: (text: string) => void;
    }

    const DeleteDialog: React.FC<DeleteDialogProps> = ({
        isOpen,
        onClose,
        onConfirm,
        brandName,
        confirmationText,
        setConfirmationText,
      }) => (
        <Dialog open={isOpen} onOpenChange={() => onClose()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Entry</DialogTitle>
              <DialogDescription>
                This action cannot be undone. To confirm deletion, please type "{brandName}" below.
              </DialogDescription>
            </DialogHeader>
            <Input
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Type brand name to confirm"
            />
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={onConfirm}
                disabled={confirmationText !== brandName}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    );


    // Move MetricInput to the top level
    const MetricInput: React.FC<{
      category: string;
      metric: string;
      details: { label: string; weight: number; placeholder: string };
      enabledMetrics: Record<string, boolean>;
      handleMetricToggle: (metric: string) => void;
      metrics: Record<string, string>;
      handleInputChange: (metric: string, value: string) => void;
    }> = ({ category, metric, details, enabledMetrics, handleMetricToggle, metrics, handleInputChange }) => (
      <TooltipProvider>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={enabledMetrics[metric]}
              onCheckedChange={() => handleMetricToggle(metric)}
            />
            <Label className="flex items-center gap-2">
              {details.label}
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent className="w-64">
                  <div className="space-y-2">
                    <p>{details.placeholder}</p>
                    <p className="text-sm text-gray-500">
                      Base Weight: {(details.weight * 100).toFixed(1)}%
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </Label>
          </div>
          <Input
            type="text"
            inputMode="decimal"
            value={metrics[metric]}
            onChange={(e) => handleInputChange(metric, e.target.value)}
            placeholder={details.placeholder}
            className="w-full"
            disabled={!enabledMetrics[metric]}
          />
        </div>
      </TooltipProvider>
    );

    const BrandStrategyCalculatorContent = () => {
      // Define all available metrics with their categories and default weights
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

      const [brandName, setBrandName] = useState<string>('');
        const [metrics, setMetrics] = useState<Record<string, string>>(() => {
            const initialMetrics: Record<string, string> = {};
            Object.entries(allMetrics).forEach(([category, categoryMetrics]) => {
                Object.keys(categoryMetrics).forEach(metric => {
                  initialMetrics[metric] = '';
                });
              });
            return initialMetrics;
        });
      const [enabledMetrics, setEnabledMetrics] = useState<Record<string, boolean>>({});
      const [scores, setScores] = useState<Record<string, number>>({});
      const [history, setHistory] = useState<HistoryEntry[]>([]);
      const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
        const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
        const [entryToDelete, setEntryToDelete] = useState<HistoryEntry | null>(null);
        const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
      const inputRef = useRef<HTMLInputElement>(null);
      const suggestionsRef = useRef<HTMLDivElement>(null);
      const [showSuggestions, setShowSuggestions] = useState(false);
      const [sortOrder, setSortOrder] = useState<{ column: string; direction: 'asc' | 'desc' }>({
        column: 'date',
        direction: 'desc',
      });

      // Initialize enabled status
      useEffect(() => {
        const initialEnabled: Record<string, boolean> = {};

        Object.entries(allMetrics).forEach(([category, categoryMetrics]) => {
          Object.keys(categoryMetrics).forEach(metric => {
            initialEnabled[metric] = true;
          });
        });

        setEnabledMetrics(initialEnabled);
        fetchHistory();
      }, []);

      const fetchHistory = async () => {
        if (!auth.currentUser) return;
        const historyCollection = collection(db, 'history');
        const q = query(historyCollection, where('userId', '==', auth.currentUser.uid));
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

      // Save current state to history
      const saveToHistory = async () => {
        if (!brandName.trim()) {
          alert('Please enter a brand name before saving');
          return;
        }

        if (!auth.currentUser) {
          alert('Please log in to save history');
          return;
        }

        const newEntry: HistoryEntry = {
          id: Date.now().toString(),
          brandName: brandName.trim(),
          date: new Date().toISOString(),
          metrics: { ...metrics },
          scores: { ...scores }
        };

        try {
          const historyCollection = collection(db, 'history');
          await addDoc(historyCollection, {
            ...newEntry,
            userId: auth.currentUser.uid
          });
          fetchHistory();
        } catch (error) {
          console.error("Error saving to Firestore:", error);
        }
      };

      // Load a specific history entry
      const loadHistoryEntry = (entry: HistoryEntry) => {
        setBrandName(entry.brandName);
        setMetrics(entry.metrics);
        setScores(entry.scores);
      };

      const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      };

        // Normalization and score calculation logic
        const normalizeMetricScore = (metric: string, value: string): number => {
            if (!value || !enabledMetrics[metric]) return 0;
            const numValue = Number(value);
        
            switch (metric) {
              case 'reachImpressions':
              case 'directTraffic':
              case 'brandSearchVolume':
                return Math.min(numValue * 10, 100);
              case 'npsScore':
                return ((numValue + 100) / 2);
              case 'clv':
              case 'aov':
                return Math.min(numValue / 10, 100);
              case 'timeBetweenPurchases':
                return Math.max(0, 100 - (numValue / 3));
              case 'cac':
                return Math.max(0, 100 - (numValue / 1000));
              case 'revenueGrowth':
              case 'marketingROI':
              case 'roas':
                return Math.min(numValue * 5, 100);
              default:
                return Math.min(Math.max(numValue, 0), 100);
            }
          };

      const calculateAdjustedWeights = () => {
        const enabledWeights: Record<string, number> = {};
        let totalWeight = 0;

        Object.entries(allMetrics).forEach(([category, categoryMetrics]) => {
          Object.entries(categoryMetrics).forEach(([metric, details]) => {
            if (enabledMetrics[metric]) {
              totalWeight += details.weight;
              enabledWeights[metric] = details.weight;
            }
          });
        });

        Object.keys(enabledWeights).forEach(metric => {
          enabledWeights[metric] = enabledWeights[metric] / totalWeight;
        });

        return enabledWeights;
      };

      const calculateScores = () => {
        const adjustedWeights = calculateAdjustedWeights();
        const categoryScores: Record<string, number> = {};
        let overallScore = 0;

        Object.entries(allMetrics).forEach(([category, categoryMetrics]) => {
          let categoryScore = 0;
          let categoryWeight = 0;

          Object.entries(categoryMetrics).forEach(([metric, details]) => {
            if (enabledMetrics[metric]) {
              const normalizedScore = normalizeMetricScore(metric, metrics[metric]);
              categoryScore += normalizedScore * adjustedWeights[metric];
              categoryWeight += adjustedWeights[metric];
            }
          });

          categoryScores[category] = categoryWeight > 0 ? categoryScore / categoryWeight : 0;
          overallScore += categoryScores[category] * categoryWeight;
        });

        categoryScores.overall = overallScore;
        setScores(categoryScores);
      };

      useEffect(() => {
        calculateScores();
      }, [metrics, enabledMetrics]);

      const handleInputChange = (metric: string, value: string) => {
          if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setMetrics(prev => ({
              ...prev,
              [metric]: value
            }));
          }
      };

      const handleMetricToggle = (metric: string) => {
        setEnabledMetrics(prev => ({
          ...prev,
          [metric]: !prev[metric]
        }));
      };

        const getScoreCategory = (score: number): { category: string; color: string } => {
            if (score >= 90) return { category: "Exceptional", color: "text-green-600" };
            if (score >= 80) return { category: "Very Effective", color: "text-green-500" };
            if (score >= 70) return { category: "Effective", color: "text-green-400" };
            if (score >= 60) return { category: "Moderately Effective", color: "text-yellow-500" };
            if (score >= 50) return { category: "Needs Improvement", color: "text-orange-500" };
            return { category: "Ineffective", color: "text-red-500" };
          };

        // Add delete functionality
        const handleDeleteEntry = async (entry: HistoryEntry) => {
            setEntryToDelete(entry);
            setDeleteDialogOpen(true);
            setDeleteConfirmationText('');
        };

        const confirmDelete = async () => {
            if (entryToDelete && deleteConfirmationText === entryToDelete.brandName) {
              try {
                const docRef = doc(db, 'history', entryToDelete.id);
                await deleteDoc(docRef);
                fetchHistory();
              } catch (error) {
                console.error("Error deleting from Firestore:", error);
              }
              setDeleteDialogOpen(false);
              setEntryToDelete(null);
              setDeleteConfirmationText('');
            }
        };

      const uniqueBrandNames = [...new Set(history.map(entry => entry.brandName))];
      const filteredBrandNames = uniqueBrandNames.filter(name =>
        name.toLowerCase().includes(brandName.toLowerCase())
      );

      const handleBrandNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setBrandName(value);
        setShowSuggestions(true);
      };

      const handleSuggestionClick = (name: string) => {
        setBrandName(name);
        setShowSuggestions(false);
        if (inputRef.current) {
          inputRef.current.focus();
        }
      };

      const handleSort = (column: string) => {
        setSortOrder(prev => ({
          column,
          direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
      };

      const sortedHistory = [...history].sort((a, b) => {
        const { column, direction } = sortOrder;
        if (column === 'date') {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return direction === 'asc' ? dateA - dateB : dateB - dateA;
        } else if (column === 'brandName') {
          return direction === 'asc'
            ? a.brandName.localeCompare(b.brandName)
            : b.brandName.localeCompare(a.brandName);
        }
        return 0;
      });

      const exportToCSV = (entry: HistoryEntry) => {
        const csvRows = [];
        const headers = ['Brand Name', 'Date'];
        const metricLabels: Record<string, string> = {};
        Object.entries(allMetrics).forEach(([category, categoryMetrics]) => {
          Object.entries(categoryMetrics).forEach(([metric, details]) => {
            metricLabels[metric] = details.label;
            headers.push(details.label);
          });
        });
        Object.keys(entry.scores).forEach(score => {
          if (score !== 'overall') {
            headers.push(`${score.charAt(0).toUpperCase() + score.slice(1)} Score`);
          }
        });
        csvRows.push(headers.join(','));

        const values = [
          entry.brandName,
          formatDate(entry.date).replace(/,/g, ''),
        ];
        
        // Add metric values in the same order as headers
        Object.keys(metrics).forEach(metric => {
          if (entry.metrics[metric]) {
            values.push(entry.metrics[metric]);
          }
        });

        // Add scores
        Object.entries(entry.scores).forEach(([category, score]) => {
          if (category !== 'overall') {
            values.push(score.toFixed(2));
          }
        });

        csvRows.push(values.join(','));

        const csvData = csvRows.join('\n');
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${entry.brandName.replace(/\s/g, '_')}_${formatDate(entry.date).replace(/,/g, '')}_Brand_Metrics_Results.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      };

      return (
        <>
            <div className="w-full max-w-6xl mx-auto space-y-8 p-4">
          
          <Card>
            <CardHeader>
              <CardTitle>Brand Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-center">
                <div className="flex-grow relative">
                  <Label htmlFor="brandName">Brand Name</Label>
                  <div className="relative">
                    <Input
                      id="brandName"
                      ref={inputRef}
                      value={brandName}
                      onChange={handleBrandNameChange}
                      placeholder="Enter brand name"
                      className="w-full"
                    />
                    {showSuggestions && filteredBrandNames.length > 0 && (
                      <div
                        ref={suggestionsRef}
                        className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto"
                      >
                        {filteredBrandNames.map((name) => {
                          const count = history.filter(entry => entry.brandName === name).length;
                          return (
                            <div
                              key={name}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                              onClick={() => handleSuggestionClick(name)}
                            >
                              <span>{name}</span>
                              <span className="text-sm text-gray-500">
                                {count} results
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={saveToHistory}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save Results
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Brand Strategy Calculator</CardTitle>
              <CardDescription>
                Select metrics to include and enter values to calculate category and overall scores
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(allMetrics).map(([category, categoryMetrics]) => (
                <div key={category} className="space-y-4">
                  <h3 className="font-semibold capitalize">{category}</h3>
                  {Object.entries(categoryMetrics).map(([metric, details]) => (
                    <MetricInput
                      key={metric}
                      category={category}
                      metric={metric}
                      details={details}
                      enabledMetrics={enabledMetrics}
                      handleMetricToggle={handleMetricToggle}
                      metrics={metrics}
                      handleInputChange={handleInputChange}
                    />
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Brand Strategy Scores</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {Object.entries(scores).map(([category, score]) => {
                  const { category: label, color } = getScoreCategory(score);
                  return (
                    <div key={category} className="flex items-center justify-between">
                      <span className="capitalize">{category}</span>
                      <div className="flex items-center gap-2">
                        <span className={color}>{score.toFixed(0)}</span>
                        <span className="text-sm text-gray-500">({label})</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={Object.entries(scores)
                    .filter(([category]) => category !== 'overall')
                    .map(([category, value]) => ({
                      name: category.charAt(0).toUpperCase() + category.slice(1),
                      value: value.toFixed(0)
                    }))}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Brand Metrics"
                      dataKey="value"
                      stroke="#2563eb"
                      fill="#2563eb"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>History</CardTitle>
                <CardDescription>
                  Previous brand evaluations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-end mb-2">
                  <span className="font-medium mr-2">Sort By:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('date')}
                      className="flex items-center gap-1"
                    >
                      Date
                      {sortOrder.column === 'date' && (
                        sortOrder.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('brandName')}
                      className="flex items-center gap-1"
                    >
                      Name
                      {sortOrder.column === 'brandName' && (
                        sortOrder.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
                {sortedHistory.map((entry) => (
                  <Collapsible
                    key={entry.id}
                    open={expandedHistory === entry.id}
                    onOpenChange={() => setExpandedHistory(expandedHistory === entry.id ? null : entry.id)}
                  >
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <CollapsibleTrigger className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className="font-medium">{entry.brandName}</span>
                              <span className="text-sm text-gray-500">
                                {formatDate(entry.date)}
                              </span>
                            </div>
                            {expandedHistory === entry.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </CollapsibleTrigger>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-2 text-gray-500 hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEntry(entry);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <CollapsibleContent className="mt-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            {Object.entries(entry.scores)
                              .map(([category, score]) => {
                                const { category: label, color } = getScoreCategory(score);
                                return (
                                  <div key={category} className="flex items-center justify-between">
                                    <span className="capitalize">{category}</span>
                                    <div className="flex items-center gap-2">
                                      <span className={color}>{score.toFixed(0)}</span>
                                      <span className="text-sm text-gray-500">({label})</span>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart data={Object.entries(entry.scores)
                                .filter(([category]) => category !== 'overall')
                                .map(([category, value]) => ({
                                  name: category.charAt(0).toUpperCase() + category.slice(1),
                                  value: value.toFixed(0)
                                }))}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="name" />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                <Radar
                                  name="Brand Metrics"
                                  dataKey="value"
                                  stroke="#2563eb"
                                  fill="#2563eb"
                                  fillOpacity={0.6}
                                />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => loadHistoryEntry(entry)}
                            className="flex-1"
                          >
                            Load These Results
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => exportToCSV(entry)}
                            className="flex-1 flex items-center gap-2"
                          >
                            <File className="h-4 w-4" />
                            Export to CSV
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </CardContent>
            </Card>
          )}
          
            <CardHeader>
              <CardTitle>© Faizan Rashid Bhat 2025</CardTitle>
            </CardHeader>
          
        </div>
        
        {/* Delete Confirmation Dialog */}
        <DeleteDialog
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setEntryToDelete(null);
            setDeleteConfirmationText('');
          }}
          onConfirm={confirmDelete}
          brandName={entryToDelete?.brandName || ''}
          confirmationText={deleteConfirmationText}
          setConfirmationText={setDeleteConfirmationText}
        />
        </>
      );
    };

    export default BrandStrategyCalculatorContent;
