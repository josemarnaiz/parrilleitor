import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

const activityLevels = [
  { value: 'sedentario', label: 'Sedentario (poco o ningún ejercicio)' },
  { value: 'ligeramente_activo', label: 'Ligeramente activo (ejercicio 1-3 días/semana)' },
  { value: 'moderadamente_activo', label: 'Moderadamente activo (ejercicio 3-5 días/semana)' },
  { value: 'muy_activo', label: 'Muy activo (ejercicio 6-7 días/semana)' },
  { value: 'extremadamente_activo', label: 'Extremadamente activo (ejercicio intenso diario)' }
];

const dietaryPreferences = [
  { value: 'omnivoro', label: 'Omnívoro (como de todo)' },
  { value: 'vegetariano', label: 'Vegetariano (no como carne)' },
  { value: 'vegano', label: 'Vegano (sin productos animales)' },
  { value: 'pescetariano', label: 'Pescetariano (vegetariano que come pescado)' }
];

const objetivos = [
  { value: 'perdida_peso', label: 'Pérdida de peso' },
  { value: 'ganancia_muscular', label: 'Ganancia muscular' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'rendimiento_deportivo', label: 'Rendimiento deportivo' },
  { value: 'salud_general', label: 'Salud general' }
];

export default function ProfileForm({ onSubmit, initialData }) {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    peso: { value: '', unit: 'kg' },
    altura: { value: '', unit: 'cm' },
    nivelActividad: '',
    dietaPreferencia: '',
    objetivos: {
      principal: '',
      detalles: ''
    },
    alergias: [],
    restriccionesMedicas: [],
    preferenciaEntrenamiento: []
  });

  // Cargar datos iniciales si existen
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNestedInputChange = (e, parent, field) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const handleArrayInputChange = (e, field) => {
    const { value } = e.target;
    const items = value.split(',').map(item => item.trim());
    setFormData(prev => ({
      ...prev,
      [field]: items
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err.message || 'Error al guardar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Perfil de Usuario</h2>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Datos físicos */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Datos Físicos</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Peso</label>
            <div className="mt-1 flex">
              <input
                type="number"
                name="peso.value"
                value={formData.peso.value}
                onChange={(e) => handleNestedInputChange(e, 'peso', 'value')}
                className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                step="0.1"
                min="0"
                max="300"
                required
              />
              <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                kg
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Altura</label>
            <div className="mt-1 flex">
              <input
                type="number"
                name="altura.value"
                value={formData.altura.value}
                onChange={(e) => handleNestedInputChange(e, 'altura', 'value')}
                className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                step="1"
                min="0"
                max="300"
                required
              />
              <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                cm
              </span>
            </div>
          </div>
        </div>

        {/* Nivel de actividad */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Nivel de Actividad</label>
          <select
            name="nivelActividad"
            value={formData.nivelActividad}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            required
          >
            <option value="">Selecciona un nivel</option>
            {activityLevels.map(level => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        {/* Preferencias dietéticas */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Preferencia Dietética</label>
          <select
            name="dietaPreferencia"
            value={formData.dietaPreferencia}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            required
          >
            <option value="">Selecciona una preferencia</option>
            {dietaryPreferences.map(pref => (
              <option key={pref.value} value={pref.value}>
                {pref.label}
              </option>
            ))}
          </select>
        </div>

        {/* Alergias */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Alergias e Intolerancias
            <span className="text-gray-500 text-xs ml-2">(separadas por comas)</span>
          </label>
          <input
            type="text"
            value={formData.alergias.join(', ')}
            onChange={(e) => handleArrayInputChange(e, 'alergias')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            placeholder="Ej: lactosa, gluten, frutos secos"
          />
        </div>

        {/* Objetivos */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Objetivos</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Objetivo Principal</label>
            <select
              name="objetivos.principal"
              value={formData.objetivos.principal}
              onChange={(e) => handleNestedInputChange(e, 'objetivos', 'principal')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              required
            >
              <option value="">Selecciona un objetivo</option>
              {objetivos.map(obj => (
                <option key={obj.value} value={obj.value}>
                  {obj.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Detalles del Objetivo</label>
            <textarea
              name="objetivos.detalles"
              value={formData.objetivos.detalles}
              onChange={(e) => handleNestedInputChange(e, 'objetivos', 'detalles')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              rows="3"
              placeholder="Describe tus objetivos específicos..."
            />
          </div>
        </div>
      </div>

      <div className="pt-5">
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {isLoading ? 'Guardando...' : 'Guardar Perfil'}
          </button>
        </div>
      </div>
    </form>
  );
} 