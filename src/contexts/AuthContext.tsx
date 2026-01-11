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

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Handle sign out event explicitly
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session and validate it
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error || !session) {
        // Clear any stale local data if session is invalid
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

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Welcome back!");
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

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Account created successfully! Please check your email to verify your account.");
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
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            user_type: userType || '',
          },
        },
      });

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

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      // Always clear local state regardless of server response
      setUser(null);
      setSession(null);
      
      // Treat "session not found" or similar as successful logout
      if (error) {
        // If session doesn't exist on server, user is already effectively logged out
        if (error.message?.toLowerCase().includes('session') || 
            error.message?.toLowerCase().includes('missing') ||
            error.status === 403 || 
            error.status === 401) {
          toast.success("Signed out successfully");
          return;
        }
        // For other errors, still show success since local state is cleared
        console.warn("Sign out server warning:", error.message);
        toast.success("Signed out successfully");
      } else {
        toast.success("Signed out successfully");
      }
    } catch (error) {
      // Even on exception, ensure local state is cleared
      setUser(null);
      setSession(null);
      
      // Try to clear local storage as fallback
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {
        // Ignore errors from local signout
      }
      
      // Still show success since the user is effectively logged out locally
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