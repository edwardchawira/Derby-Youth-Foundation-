"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: string;
  type: 'package' | 'equipment' | 'studio' | 'talent';
  price: number;
  quantity: number;
  duration?: number;
  durationUnit?: 'days' | 'hours';
  bookingDate?: string; // For studio: YYYY-MM-DD
  bookingTime?: string; // For studio: HH:mm, blocks slot when confirmed
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('pinnacle-cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load cart', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pinnacle-cart', JSON.stringify(items));
  }, [items]);

  // n8n webhook URL - using API route to avoid CORS issues
  const N8N_WEBHOOK_URL = '/api/cart-notification';

  // Function to notify n8n when items are added to cart
  const notifyCartAddition = async (items: CartItem[]) => {
    try {
      // Calculate total
      const total = items.reduce((sum, item) => {
        if (item.type === 'studio') {
          return sum + item.price * item.quantity;
        }
        return sum + (item.price * item.quantity * (item.duration || 1));
      }, 0);

      const payload = {
        customerName: 'Customer', // You can get this from auth if available
        customerPhone: '+447361971592', // Updated to 07361971592 (UK format converted to international)
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        total: total,
      };

      console.log('Sending cart notification to n8n:', payload);

      // Call n8n webhook
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('n8n webhook error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
      } else {
        const result = await response.json();
        console.log('n8n webhook success:', result);
      }
    } catch (error) {
      console.error('Failed to notify cart addition:', error);
      // Don't block cart functionality if webhook fails
    }
  };

  const addItem = (newItem: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const c = newItem as CartItem;
      const existing = prev.find(item => item.id === newItem.id && item.duration === newItem.duration && item.bookingDate === c.bookingDate && item.bookingTime === c.bookingTime);
      let updatedItems;
      
      if (existing) {
        updatedItems = prev.map(item =>
          item.id === newItem.id && item.duration === newItem.duration && item.bookingDate === c.bookingDate && item.bookingTime === c.bookingTime
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        updatedItems = [...prev, { ...newItem, quantity: 1 }];
      }

      // Notify n8n when item is added (call webhook)
      notifyCartAddition(updatedItems);

      return updatedItems;
    });
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = items.reduce((sum, item) => {
    const itemPrice = item.type === 'studio'
      ? item.price * item.quantity
      : item.price * item.quantity * (item.duration || 1);
    return sum + itemPrice;
  }, 0);

  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
