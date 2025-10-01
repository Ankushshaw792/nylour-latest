import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useSalonExistence = () => {
  const { user, loading: authLoading } = useAuth();
  const [hasSalon, setHasSalon] = useState<boolean>(false);
  const [salonId, setSalonId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkSalonExistence = async () => {
      if (!user) {
        setHasSalon(false);
        setSalonId(undefined);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('salons')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking salon existence:', error);
          setHasSalon(false);
          setSalonId(undefined);
        } else if (data) {
          setHasSalon(true);
          setSalonId(data.id);
        } else {
          setHasSalon(false);
          setSalonId(undefined);
        }
      } catch (error) {
        console.error('Error checking salon existence:', error);
        setHasSalon(false);
        setSalonId(undefined);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkSalonExistence();
    }
  }, [user, authLoading]);

  return { hasSalon, salonId, loading: loading || authLoading };
};
