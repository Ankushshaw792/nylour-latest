import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";

// Customer App Pages
import NearbySalons from "./pages/customer/NearbySalons";
import SalonDetails from "./pages/customer/SalonDetails";
import BookingScreen from "./pages/customer/BookingScreen";
import BookingConfirmation from "./pages/customer/BookingConfirmation";
import QueueStatus from "./pages/customer/QueueStatus";

// Salon Dashboard Pages
import QueueManagement from "./pages/salon/QueueManagement";
import BookingsOverview from "./pages/salon/BookingsOverview";
import CheckInUpdate from "./pages/salon/CheckInUpdate";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Customer App Routes */}
          <Route path="/" element={<MobileLayout><NearbySalons /></MobileLayout>} />
          <Route path="/salon/:id" element={<MobileLayout><SalonDetails /></MobileLayout>} />
          <Route path="/book/:id" element={<MobileLayout><BookingScreen /></MobileLayout>} />
          <Route path="/booking-confirmation/:id" element={<MobileLayout><BookingConfirmation /></MobileLayout>} />
          <Route path="/queue-status" element={<MobileLayout><QueueStatus /></MobileLayout>} />
          
          {/* Salon Dashboard Routes */}
          <Route path="/salon-dashboard" element={<MobileLayout><QueueManagement /></MobileLayout>} />
          <Route path="/salon-dashboard/bookings" element={<MobileLayout><BookingsOverview /></MobileLayout>} />
          <Route path="/salon-dashboard/checkin" element={<MobileLayout><CheckInUpdate /></MobileLayout>} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;