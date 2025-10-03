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
import ServicesManagement from "./pages/salon/ServicesManagement";

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
              <Route path="/customer" element={<NearbySalons />} />
              <Route path="/salon/:id" element={<SalonDetails />} />
              <Route path="/book/:id" element={<BookingScreen />} />
              <Route path="/payment/:bookingId" element={<PaymentPage />} />
              <Route path="/booking-confirmation/:id" element={<BookingConfirmation />} />
              <Route path="/queue-status/:id" element={<QueueStatus />} />
              <Route path="/queue-status" element={<QueueStatus />} />
              <Route path="/bookings" element={<BookingsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              
              {/* Salon Dashboard Routes */}
            <Route path="/salon-dashboard" element={<MobileLayout><BookingsOverview /></MobileLayout>} />
            <Route path="/salon-dashboard/services" element={<MobileLayout><ServicesManagement /></MobileLayout>} />
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