import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";

// Landing Page
import Home from "./pages/Home";
import SalonRegister from "./pages/SalonRegister";

// Customer App Pages
import NearbySalons from "./pages/customer/NearbySalons";
import SalonDetails from "./pages/customer/SalonDetails";
import BookingScreen from "./pages/customer/BookingScreen";
import PaymentPage from "./pages/customer/PaymentPage";
import BookingConfirmation from "./pages/customer/BookingConfirmation";
import QueueStatus from "./pages/customer/QueueStatus";
import BookingsPage from "./pages/customer/BookingsPage";
import ProfilePage from "./pages/customer/ProfilePage";

// Salon Dashboard Pages
import QueueManagement from "./pages/salon/QueueManagement";
import BookingsOverview from "./pages/salon/BookingsOverview";
import CheckInUpdate from "./pages/salon/CheckInUpdate";
import ComprehensiveDashboard from "./pages/salon/ComprehensiveDashboard";

import SalonProfilePage from "./pages/salon/SalonProfilePage";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Landing Page */}
              <Route path="/" element={<Home />} />
              <Route path="/salon-register" element={<SalonRegister />} />
              
              {/* Customer App Routes */}
              <Route path="/customer" element={<MobileLayout><NearbySalons /></MobileLayout>} />
              <Route path="/salon/:id" element={<MobileLayout><SalonDetails /></MobileLayout>} />
              <Route path="/book/:id" element={<MobileLayout><BookingScreen /></MobileLayout>} />
              <Route path="/payment/:bookingId" element={<MobileLayout><PaymentPage /></MobileLayout>} />
              <Route path="/booking-confirmation/:id" element={<MobileLayout><BookingConfirmation /></MobileLayout>} />
              <Route path="/queue-status/:id" element={<MobileLayout><QueueStatus /></MobileLayout>} />
              <Route path="/queue-status" element={<MobileLayout><QueueStatus /></MobileLayout>} />
              <Route path="/bookings" element={<MobileLayout><BookingsPage /></MobileLayout>} />
              <Route path="/profile" element={<MobileLayout><ProfilePage /></MobileLayout>} />
              
              {/* Salon Dashboard Routes */}
            <Route path="/salon-dashboard" element={<MobileLayout><ComprehensiveDashboard /></MobileLayout>} />
            <Route path="/salon-dashboard/queue" element={<MobileLayout><QueueManagement /></MobileLayout>} />
            <Route path="/salon-dashboard/bookings" element={<MobileLayout><BookingsOverview /></MobileLayout>} />
            <Route path="/salon-dashboard/checkin" element={<MobileLayout><CheckInUpdate /></MobileLayout>} />
            <Route path="/salon-dashboard/profile" element={<MobileLayout><SalonProfilePage /></MobileLayout>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;