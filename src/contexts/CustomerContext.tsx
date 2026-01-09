import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface CustomerProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
}

interface CustomerContextType {
  customerProfile: CustomerProfile | null;
  avatarUrl: string | null;
  loading: boolean;
  refetchProfile: () => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error("useCustomer must be used within a CustomerProvider");
  }
  return context;
};

export const CustomerProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setCustomerProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, user_id, first_name, last_name, email, phone, address, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching customer profile:", error);
      } else {
        setCustomerProfile(data);
      }
    } catch (err) {
      console.error("Error fetching customer profile:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const refetchProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  return (
    <CustomerContext.Provider
      value={{
        customerProfile,
        avatarUrl: customerProfile?.avatar_url || null,
        loading,
        refetchProfile,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};
