import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface TutorialStatus {
  showTutorial: boolean;
  loading: boolean;
  completeTutorial: () => Promise<void>;
}

export const useCustomerTutorialStatus = (): TutorialStatus => {
  const { user } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkTutorialStatus = async () => {
      if (!user) {
        setShowTutorial(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("customers")
          .select("has_completed_tutorial")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error checking tutorial status:", error);
          setShowTutorial(false);
        } else if (data) {
          setShowTutorial(!data.has_completed_tutorial);
        }
      } catch (err) {
        console.error("Error checking tutorial status:", err);
      } finally {
        setLoading(false);
      }
    };

    checkTutorialStatus();
  }, [user]);

  const completeTutorial = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("customers")
        .update({ has_completed_tutorial: true })
        .eq("user_id", user.id);

      if (error) {
        console.error("Error completing tutorial:", error);
      } else {
        setShowTutorial(false);
      }
    } catch (err) {
      console.error("Error completing tutorial:", err);
    }
  }, [user]);

  return { showTutorial, loading, completeTutorial };
};

export const useSalonTutorialStatus = (): TutorialStatus => {
  const { user } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkTutorialStatus = async () => {
      if (!user) {
        setShowTutorial(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("salons")
          .select("has_completed_tutorial")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error checking salon tutorial status:", error);
          setShowTutorial(false);
        } else if (data) {
          setShowTutorial(!data.has_completed_tutorial);
        }
      } catch (err) {
        console.error("Error checking salon tutorial status:", err);
      } finally {
        setLoading(false);
      }
    };

    checkTutorialStatus();
  }, [user]);

  const completeTutorial = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("salons")
        .update({ has_completed_tutorial: true })
        .eq("owner_id", user.id);

      if (error) {
        console.error("Error completing salon tutorial:", error);
      } else {
        setShowTutorial(false);
      }
    } catch (err) {
      console.error("Error completing salon tutorial:", err);
    }
  }, [user]);

  return { showTutorial, loading, completeTutorial };
};
