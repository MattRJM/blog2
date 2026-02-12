import { useCallback, useState } from "react";
import * as profileService from "../services/profileService";

export function useProfile(userId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async (id = userId) => {
    if (!id) return;

    setLoading(true);
    try {
      const data = await profileService.getProfileData(id);
      setProfile(data);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar perfil:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateProfile = useCallback(async (updates) => {
    if (!userId) throw new Error("Mandatory user ID");

    setLoading(true);
    try {
      const updated = await profileService.updateProfile(
        userId,
        updates
      );
      setProfile((prev) => ({ ...prev, ...updated }));
      setError(null);
      return updated;
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const toggleSubscribe = useCallback(
    async (profileUserId, isCurrentlySubscribed) => {
      if (!userId) throw new Error("Mandatory user ID");

      try {
        const newSubscribers =
          await profileService.toggleSubscribe(
            profileUserId,
            userId,
            isCurrentlySubscribed
          );
        
        setProfile((prev) => ({
          ...prev,
          subscribers: newSubscribers,
        }));
        
        return newSubscribers;
      } catch (err) {
        console.error("Error:", err);
        throw err;
      }
    },
    [userId]
  );

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    toggleSubscribe,
  };
}