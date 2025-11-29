"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useCurrencyStore } from "@/lib/stores/currency-store";
import { useInventoryStore } from "@/lib/stores/inventory-store";
import { SHOP_ITEMS } from "@/lib/constants/shop-items";
import type { ShopItem, ItemId } from "@/lib/types/game";
import { toast } from "sonner";

function EvidenceItemCard({
  item,
  onPurchase,
  canAfford,
}: {
  item: ShopItem;
  onPurchase: () => void;
  canAfford: boolean;
}) {
  const { getQuantity } = useInventoryStore();
  const owned = getQuantity(item.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="relative rounded-lg border border-primary/20 bg-card/80 p-4 shadow-[0_0_20px_oklch(0.75_0.15_70/0.05)] flex flex-col backdrop-blur-sm group"
    >
      {/* Evidence bag effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

      {/* Evidence tag */}
      <div className="absolute -top-2 -right-2 w-16 h-6 bg-primary/20 border border-primary/30 rounded flex items-center justify-center transform rotate-12">
        <span className="text-[10px] font-mono text-primary uppercase tracking-wider">#{item.id.slice(0, 4)}</span>
      </div>

      <div className="flex items-start justify-between mb-3">
        <span className="text-4xl grayscale group-hover:grayscale-0 transition-all duration-300">{item.icon}</span>
        {owned > 0 && (
          <Badge variant="evidence" className="text-xs">
            In Custody: {owned}
          </Badge>
        )}
      </div>
      <h3 className="font-semibold text-foreground mb-1">{item.name}</h3>
      <p className="text-sm text-muted-foreground mb-4 flex-1">
        {item.description}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Cost:</span>
          <span className="font-bold text-primary">{item.price}</span>
          {item.quantity > 1 && (
            <span className="text-xs text-muted-foreground font-mono">
              (x{item.quantity})
            </span>
          )}
        </div>
        <Button
          size="sm"
          onClick={onPurchase}
          disabled={!canAfford}
          variant={canAfford ? "noir" : "outline"}
        >
          {canAfford ? "Requisition" : "Insufficient Funds"}
        </Button>
      </div>
    </motion.div>
  );
}

function RequisitionModal({
  open,
  item,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  item: ShopItem | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { coins } = useCurrencyStore();

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-3xl grayscale">{item.icon}</span>
            <div>
              <div className="text-lg">{item.name}</div>
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Evidence Requisition Form</div>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-3 font-mono text-sm">
          <div className="flex items-center justify-between border-b border-primary/10 pb-2">
            <span className="text-muted-foreground uppercase tracking-wider text-xs">Item Description</span>
          </div>
          <p className="text-muted-foreground text-sm">{item.description}</p>

          <div className="pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground uppercase tracking-wider text-xs">Requisition Cost</span>
              <span className="font-bold text-primary">{item.price}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground uppercase tracking-wider text-xs">Current Funds</span>
              <span className="font-semibold text-foreground">{coins}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-primary/20">
              <span className="text-muted-foreground uppercase tracking-wider text-xs">Remaining Balance</span>
              <span className="font-semibold text-foreground">{coins - item.price}</span>
            </div>
          </div>

          {item.quantity > 1 && (
            <div className="mt-4 p-3 rounded bg-primary/5 border border-primary/20">
              <span className="text-xs uppercase tracking-wider text-primary">Quantity: {item.quantity} units</span>
            </div>
          )}
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button onClick={onConfirm} className="flex-1">
            Authorize Requisition
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ShopPage() {
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const { coins, spendCoins, streak, totalScenariosCompleted, highestStreak } =
    useCurrencyStore();
  const { addItem } = useInventoryStore();

  const handlePurchase = (item: ShopItem) => {
    setSelectedItem(item);
  };

  const confirmPurchase = () => {
    if (!selectedItem) return;

    if (spendCoins(selectedItem.price)) {
      addItem(selectedItem.id as ItemId, selectedItem.quantity);
      toast.success(`Evidence requisitioned: ${selectedItem.name}`, {
        description:
          selectedItem.quantity > 1
            ? `${selectedItem.quantity} units added to inventory.`
            : undefined,
      });
    } else {
      toast.error("Requisition denied: Insufficient funds");
    }
    setSelectedItem(null);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Noir background effects */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, oklch(0.95 0.05 70 / 0.04) 0%, transparent 50%)'
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(0,0,0,0.4) 100%)'
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-primary/20 bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                ← Return to Cases
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight text-glow-gold">Evidence Locker</h1>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Requisition Department</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-card/80 px-4 py-2 border border-primary/30 shadow-[0_0_15px_oklch(0.75_0.15_70/0.1)]">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Funds:</span>
            <span className="font-bold text-primary">{coins}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 relative z-10">
        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 grid grid-cols-3 gap-4"
        >
          <div className="rounded-lg border border-primary/20 bg-card/50 p-4 text-center backdrop-blur-sm">
            <div className="text-2xl font-bold text-primary">
              {totalScenariosCompleted}
            </div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Cases Closed
            </div>
          </div>
          <div className="rounded-lg border border-primary/20 bg-card/50 p-4 text-center backdrop-blur-sm">
            <div className="text-2xl font-bold text-red-400">
              {streak}
            </div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Active Streak
            </div>
          </div>
          <div className="rounded-lg border border-primary/20 bg-card/50 p-4 text-center backdrop-blur-sm">
            <div className="text-2xl font-bold text-foreground">
              {highestStreak}
            </div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Record Streak
            </div>
          </div>
        </motion.div>

        {/* Section Label */}
        <div className="mb-6">
          <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Available Evidence</h2>
          <div className="h-px bg-gradient-to-r from-primary/30 via-primary/10 to-transparent mt-2" />
        </div>

        {/* Evidence Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SHOP_ITEMS.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <EvidenceItemCard
                item={item}
                onPurchase={() => handlePurchase(item)}
                canAfford={coins >= item.price}
              />
            </motion.div>
          ))}
        </div>

        {/* Intel Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 rounded-lg border border-primary/20 bg-card/30 p-6 backdrop-blur-sm"
        >
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="text-primary">📋</span>
            <span>Field Intel</span>
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground font-mono">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Consecutive case closures increase bounty rewards by 10% per streak.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Complex cases yield higher rewards (difficulty multiplier applies).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Skip Tokens preserve your active streak when deployed strategically.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>AI Teammate provides subtle investigative guidance without compromising solutions.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Hint Packs contain 3 progressive clues—use sparingly for maximum efficiency.</span>
            </li>
          </ul>
        </motion.div>
      </main>

      {/* Requisition Modal */}
      <RequisitionModal
        open={!!selectedItem}
        item={selectedItem}
        onConfirm={confirmPurchase}
        onCancel={() => setSelectedItem(null)}
      />
    </div>
  );
}
