import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Favorite {
  id: string;
  user_id: string;
  salon_id: string;
  created_at: string;
  salons?: {
    id: string;
    name: string;
    address: string;
    image_url?: string;
  };
}

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      const { data: favoritesData, error: favoritesError } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (favoritesError) throw favoritesError;

      // Fetch salon data for each favorite
      const favoritesWithSalons = await Promise.all(
        (favoritesData || []).map(async (favorite) => {
          const { data: salonData } = await supabase
            .from('salons')
            .select('id, name, address, image_url')
            .eq('id', favorite.salon_id)
            .maybeSingle();
          
          return {
            ...favorite,
            salons: salonData
          };
        })
      );

      setFavorites(favoritesWithSalons as Favorite[]);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const addToFavorites = async (salonId: string) => {
    if (!user) {
      toast.error('Please sign in to add favorites');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          salon_id: salonId
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast.error('Salon is already in your favorites');
          return;
        }
        throw error;
      }

      // Fetch salon data
      const { data: salonData } = await supabase
        .from('salons')
        .select('id, name, address, image_url')
        .eq('id', salonId)
        .maybeSingle();

      const favoriteWithSalon = {
        ...data,
        salons: salonData
      };

      setFavorites(prev => [favoriteWithSalon as Favorite, ...prev]);
      toast.success('Added to favorites');
    } catch (error) {
      console.error('Error adding to favorites:', error);
      toast.error('Failed to add to favorites');
    }
  };

  const removeFromFavorites = async (salonId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('salon_id', salonId);

      if (error) throw error;

      setFavorites(prev => prev.filter(fav => fav.salon_id !== salonId));
      toast.success('Removed from favorites');
    } catch (error) {
      console.error('Error removing from favorites:', error);
      toast.error('Failed to remove from favorites');
    }
  };

  const isFavorite = (salonId: string) => {
    return favorites.some(fav => fav.salon_id === salonId);
  };

  const toggleFavorite = async (salonId: string) => {
    if (isFavorite(salonId)) {
      await removeFromFavorites(salonId);
    } else {
      await addToFavorites(salonId);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('favorites-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'favorites',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchFavorites(); // Refetch to get salon data
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'favorites',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const deletedFavorite = payload.old as Favorite;
          setFavorites(prev => prev.filter(fav => fav.id !== deletedFavorite.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    favorites,
    loading,
    favoriteCount: favorites.length,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    refetch: fetchFavorites
  };
};