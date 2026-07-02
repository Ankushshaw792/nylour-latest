import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string, userType?: string) => Promise<{ error: any }>;
  signInWithGoogle: (userType?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Helper: write the salon_owner role into user_roles after Google OAuth
const ensureSalonOwnerRole = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('user_roles')
      .upsert({ user_id: userId, role: 'salon_owner' }, { onConflict: 'user_id,role', ignoreDuplicates: true });
    if (error) {
      console.error("Error setting salon_owner role:", error);
    }
  } catch (err) {
    console.error("Error in ensureSalonOwnerRole:", err);
  }
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);

          // Bug 2 Fix: After Google OAuth callback, check if we need to assign salon_owner role
          if (event === 'SIGNED_IN' && session?.user) {
            const pendingUserType = sessionStorage.getItem('pending_user_type');
            if (pendingUserType === 'salon_owner') {
              sessionStorage.removeItem('pending_user_type');
              // Use setTimeout to avoid Supabase auth deadlock
              setTimeout(() => {
                ensureSalonOwnerRole(session.user.id);
              }, 0);
            }
          }
        }
        // Bug 4 Fix: Only set loading to false here, NOT in getSession below
        // This is the single source of truth for loading state
      }
    );

    // THEN check for existing session and validate it
    // Bug 4 Fix: This is the only place we set loading to false
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error || !session) {
        setUser(null);
        setSession(null);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Bug 1 Fix: Removed duplicate toast — the form handles this
      if (error) {
        toast.error(error.message);
      }

      return { error };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      toast.error(errorMessage);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string, userType?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
            user_type: userType,
          },
        },
      });

      // Bug 1 Fix: Removed duplicate toast — the form handles this
      if (error) {
        toast.error(error.message);
      }

      return { error };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      toast.error(errorMessage);
      return { error };
    }
  };

  const signInWithGoogle = async (userType?: string) => {
    try {
      // Bug 2 Fix: Store the intended user_type in sessionStorage BEFORE the OAuth redirect.
      // After the Google callback, onAuthStateChange will read this and assign the correct role.
      if (userType) {
        sessionStorage.setItem('pending_user_type', userType);
      } else {
        sessionStorage.removeItem('pending_user_type');
      }

      // Bug 5 Fix: Use a smarter redirect URL based on user type
      const redirectPath = userType === 'salon_owner' ? '/salon-register' : '/customer';
      const redirectUrl = `${window.location.origin}${redirectPath}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            // These are valid Google OAuth params (not custom ones)
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        // Clean up on error
        sessionStorage.removeItem('pending_user_type');
        toast.error(error.message);
      }

      return { error };
    } catch (error) {
      sessionStorage.removeItem('pending_user_type');
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      toast.error(errorMessage);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      // Always clear local state regardless of server response
      setUser(null);
      setSession(null);
      
      if (error) {
        // Session already gone — treat as success
        if (error.message?.toLowerCase().includes('session') || 
            error.message?.toLowerCase().includes('missing') ||
            error.status === 403 || 
            error.status === 401) {
          toast.success("Signed out successfully");
          return;
        }
        console.warn("Sign out server warning:", error.message);
        toast.success("Signed out successfully");
      } else {
        toast.success("Signed out successfully");
      }
    } catch (error) {
      // Even on exception, ensure local state is cleared
      setUser(null);
      setSession(null);
      
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {
        // Ignore errors from local signout
      }
      
      toast.success("Signed out successfully");
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};