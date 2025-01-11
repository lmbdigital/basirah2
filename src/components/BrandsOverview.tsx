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
    import { auth, db } from '@/lib/firebase';
    import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
    import { Trash2 } from 'lucide-react';
    import {
      Dialog,
      DialogContent,
      DialogDescription,
      DialogHeader,
      DialogTitle,
      DialogFooter,
    } from "@/components/ui/dialog";
    import { Input } from "@/components/ui/input";

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
            <DialogTitle>Delete All Results</DialogTitle>
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

    const BrandsOverview = () => {
      const router = useRouter();
      const [brands, setBrands] = useState<
        { name: string; count: number; latestScore: number | null }[]
      >([]);
      const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
      const [brandToDelete, setBrandToDelete] = useState<string | null>(null);
      const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

      useEffect(() => {
        const fetchBrands = async () => {
          if (!auth.currentUser) return;
          const historyCollection = collection(db, 'history');
          const q = query(historyCollection, where('userId', '==', auth.currentUser.uid));
          try {
            const querySnapshot = await getDocs(q);
            const fetchedHistory = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as HistoryEntry));

            const brandMap = new Map<string, { count: number; latestScore: number | null }>();
            fetchedHistory.forEach(entry => {
              if (brandMap.has(entry.brandName)) {
                const existing = brandMap.get(entry.brandName)!;
                brandMap.set(entry.brandName, {
                  count: existing.count + 1,
                  latestScore: entry.scores.overall,
                });
              } else {
                brandMap.set(entry.brandName, {
                  count: 1,
                  latestScore: entry.scores.overall,
                });
              }
            });

            const brandsArray = Array.from(brandMap.entries()).map(([name, data]) => ({
              name,
              count: data.count,
              latestScore: data.latestScore,
            }));
            setBrands(brandsArray);
          } catch (error) {
            console.error("Error fetching history:", error);
          }
        };

        fetchBrands();
      }, []);

      const handleDeleteBrand = async (brandName: string) => {
        setBrandToDelete(brandName);
        setDeleteDialogOpen(true);
        setDeleteConfirmationText('');
      };

      const confirmDelete = async () => {
        if (brandToDelete && deleteConfirmationText === brandToDelete) {
          if (!auth.currentUser) return;
          const historyCollection = collection(db, 'history');
          const q = query(historyCollection, where('userId', '==', auth.currentUser.uid), where('brandName', '==', brandToDelete));
          try {
            const querySnapshot = await getDocs(q);
            querySnapshot.docs.forEach(async (doc) => {
              await deleteDoc(doc.ref);
            });
            const updatedBrands = brands.filter(brand => brand.name !== brandToDelete);
            setBrands(updatedBrands);
          } catch (error) {
            console.error("Error deleting brand history:", error);
          }
          setDeleteDialogOpen(false);
          setBrandToDelete(null);
          setDeleteConfirmationText('');
        }
      };

      return (
        <Card>
          <CardHeader>
            <CardTitle>Brands Overview</CardTitle>
            <CardDescription>
              List of all brands with their number of saved results and latest overall score
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {brands.length > 0 ? (
              <ul className="space-y-2">
                {brands.map((brand) => (
                  <li key={brand.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="link"
                        onClick={() => router.push(`/brand/${brand.name}`)}
                      >
                        {brand.name}
                      </Button>
                      <span className="text-sm text-gray-500">({brand.count} results)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {brand.latestScore !== null && (
                        <span className="text-sm text-gray-500">
                          Latest Score: {brand.latestScore.toFixed(0)}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-red-500"
                        onClick={() => handleDeleteBrand(brand.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No brands have been evaluated yet.</p>
            )}
          </CardContent>
          <DeleteDialog
            isOpen={deleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false);
              setBrandToDelete(null);
              setDeleteConfirmationText('');
            }}
            onConfirm={confirmDelete}
            brandName={brandToDelete || ''}
            confirmationText={deleteConfirmationText}
            setConfirmationText={setDeleteConfirmationText}
          />
        </Card>
      );
    };

    export default BrandsOverview;
