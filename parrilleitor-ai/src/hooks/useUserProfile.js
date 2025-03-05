import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

export function useUserProfile() {
  const { user, isLoading: isUserLoading } = useUser();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/profile');
        if (!response.ok) {
          if (response.status === 404) {
            // No hay perfil aún, esto es normal para usuarios nuevos
            setProfile(null);
            return;
          }
          throw new Error('Error al cargar el perfil');
        }
        
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadProfile();
    } else {
      setProfile(null);
      setIsLoading(false);
    }
  }, [user]);

  const updateProfile = async (profileData) => {
    if (!user) throw new Error('Usuario no autenticado');
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/profile', {
        method: profile ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el perfil');
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const calculateBMI = () => {
    if (!profile?.peso?.value || !profile?.altura?.value) return null;
    
    const heightInMeters = profile.altura.unit === 'cm' 
      ? profile.altura.value / 100 
      : profile.altura.value / 39.3701;
    
    const weightInKg = profile.peso.unit === 'kg'
      ? profile.peso.value
      : profile.peso.value * 0.453592;
    
    return weightInKg / (heightInMeters * heightInMeters);
  };

  const getCalorieNeeds = () => {
    if (!profile?.metricas?.tmb) return null;
    return profile.metricas.caloriasObjetivo;
  };

  const getMacroDistribution = () => {
    const calories = getCalorieNeeds();
    if (!calories) return null;

    let proteinPercentage, carbPercentage, fatPercentage;

    switch (profile.objetivos.principal) {
      case 'perdida_peso':
        proteinPercentage = 0.35; // 35% proteína
        fatPercentage = 0.35;     // 35% grasa
        carbPercentage = 0.30;    // 30% carbohidratos
        break;
      case 'ganancia_muscular':
        proteinPercentage = 0.30; // 30% proteína
        carbPercentage = 0.45;    // 45% carbohidratos
        fatPercentage = 0.25;     // 25% grasa
        break;
      default:
        proteinPercentage = 0.30; // 30% proteína
        carbPercentage = 0.40;    // 40% carbohidratos
        fatPercentage = 0.30;     // 30% grasa
    }

    return {
      protein: Math.round((calories * proteinPercentage) / 4), // 4 cal/g para proteínas
      carbs: Math.round((calories * carbPercentage) / 4),      // 4 cal/g para carbohidratos
      fat: Math.round((calories * fatPercentage) / 9),         // 9 cal/g para grasas
    };
  };

  return {
    profile,
    isLoading: isLoading || isUserLoading,
    error,
    updateProfile,
    calculateBMI,
    getCalorieNeeds,
    getMacroDistribution,
  };
} 