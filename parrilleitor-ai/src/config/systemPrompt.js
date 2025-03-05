/**
 * System prompt para ParrilleitorAI
 * Este prompt define el comportamiento y las capacidades del asistente virtual
 * 
 * NOTA: Este archivo ahora sirve como punto de entrada para el sistema de prompts.
 * El contenido real del prompt se genera dinámicamente a partir de documentos externos
 * almacenados en src/data/knowledge/
 */

import dynamicPromptGenerator from '@/services/knowledge/DynamicPromptGenerator';

// Definimos un prompt estático como fallback en caso de que el dinámico falle
const STATIC_FALLBACK_PROMPT = `Eres ParrilleitorAI, un asistente virtual especializado exclusivamente en nutrición, fitness y bienestar general. Tu objetivo es proporcionar información precisa, consejos personalizados y apoyo para ayudar a las personas a mejorar su salud a través de la alimentación y el ejercicio físico.

<nutrition_knowledge_base>
- Nutrición: Planificación de dietas, información nutricional de alimentos, consejos para alimentación saludable.
- Macronutrientes: Proteínas (construcción muscular), carbohidratos (energía), grasas (hormonas).
- Micronutrientes: Vitaminas y minerales esenciales para la salud.
</nutrition_knowledge_base>

<sports_knowledge_base>
- Fitness: Rutinas de ejercicio, tipos de entrenamiento, técnicas correctas.
- Bienestar: Hábitos saludables, equilibrio en el estilo de vida, descanso y recuperación.
</sports_knowledge_base>

DIRECTRICES IMPORTANTES:
1. MEMORIA Y CONTEXTO: Mantén presente toda la conversación anterior para dar respuestas coherentes y personalizadas.
2. PERSONALIZACIÓN: Adapta tus respuestas a las necesidades específicas del usuario.
3. LÍMITES DE CONOCIMIENTO: Si no tienes información suficiente, solicita más detalles.
4. ÉTICA PROFESIONAL: No promuevas dietas extremas o métodos peligrosos.
5. ENFOQUE BASADO EN EVIDENCIA: Fundamenta tus recomendaciones en información científica.
6. LÍMITES PROFESIONALES: Aclara que no sustituyes a profesionales de la salud.
7. ENFOQUE EXCLUSIVO: Responde ÚNICAMENTE a preguntas de nutrición, fitness y bienestar.

Estructura tu respuesta con:
<nutrition_advice> para recomendaciones dietéticas específicas
<exercise_tips> para consejos de ejercicio o entrenamiento
<explanation> para explicar el razonamiento detrás de tus recomendaciones
<additional_info> para información adicional o recursos útiles

Escribe tu respuesta dentro de etiquetas <answer>...</answer>.`;

// Variable que almacenará el prompt dinámico
let DYNAMIC_PROMPT = STATIC_FALLBACK_PROMPT;

// Función para inicializar el sistema de prompts dinámicos
const initDynamicPrompt = async () => {
  try {
    console.log('Inicializando sistema de prompts dinámicos...');
    const initialized = await dynamicPromptGenerator.init();
    
    if (initialized) {
      // Generar el prompt dinámico y actualizar la variable
      DYNAMIC_PROMPT = dynamicPromptGenerator.generatePrompt();
      console.log('Prompt dinámico generado correctamente');
    } else {
      console.warn('No se pudo inicializar el generador de prompts dinámicos, usando fallback estático');
    }
  } catch (error) {
    console.error('Error al inicializar el sistema de prompts dinámicos:', error);
    console.warn('Usando prompt estático como fallback');
  }
};

// Intentar inicializar el prompt dinámico durante la carga del módulo
if (typeof window === 'undefined') { // Solo ejecutar en el servidor
  initDynamicPrompt()
    .catch(err => console.error('Error en la inicialización del prompt dinámico:', err));
}

// Función para generar un prompt personalizado para una consulta específica
export const getCustomPromptForQuery = async (query, userId) => {
  try {
    // Asegurarnos de que el sistema esté inicializado
    if (DYNAMIC_PROMPT === STATIC_FALLBACK_PROMPT) {
      await initDynamicPrompt();
    }
    
    // Generar un prompt personalizado para la consulta, incluyendo el perfil del usuario
    return dynamicPromptGenerator.generateCustomPromptForQuery(query, userId);
  } catch (error) {
    console.error('Error al generar prompt personalizado:', error);
    return DYNAMIC_PROMPT; // Usar el prompt dinámico general o el fallback
  }
};

// Exportar el prompt dinámico como predeterminado
export const SYSTEM_PROMPT = DYNAMIC_PROMPT;

export default SYSTEM_PROMPT; 