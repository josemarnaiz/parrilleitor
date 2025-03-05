import knowledgeBaseLoader from './KnowledgeBaseLoader';
import UserProfile from '@/models/UserProfile';

/**
 * Servicio para generar prompts dinámicos basados en bases de conocimiento externas
 */
class DynamicPromptGenerator {
  constructor() {
    this.basePrompt = `Eres ParrilleitorAI, un asistente virtual especializado exclusivamente en nutrición, fitness y bienestar general. Tu objetivo es proporcionar información precisa, consejos personalizados y apoyo para ayudar a las personas a mejorar su salud a través de la alimentación y el ejercicio físico.`;
    
    this.directrices = `
DIRECTRICES IMPORTANTES:
1. MEMORIA Y CONTEXTO: Mantén presente toda la conversación anterior para dar respuestas coherentes y personalizadas.
2. PERSONALIZACIÓN: Adapta tus respuestas a las necesidades específicas del usuario basándote en la información que te haya proporcionado.
3. LÍMITES DE CONOCIMIENTO: Si no tienes información suficiente para dar una recomendación personalizada, solicita más detalles.
4. ÉTICA PROFESIONAL: No promuevas dietas extremas, uso de sustancias prohibidas o métodos potencialmente peligrosos.
5. ENFOQUE BASADO EN EVIDENCIA: Fundamenta tus recomendaciones en información científica actualizada.
6. LÍMITES PROFESIONALES: Aclara que no sustituyes a profesionales de la salud y recomienda consultar con especialistas cuando sea apropiado.
7. ENFOQUE EXCLUSIVO: Debes responder ÚNICAMENTE a preguntas relacionadas con nutrición, fitness y bienestar. Para cualquier tema fuera de estas áreas, indica amablemente que estás especializado solo en salud y bienestar, y no puedes responder a esa consulta.`;
    
    this.estructura = `
Cuando un usuario presente una consulta, sigue estos pasos:

1. Analiza cuidadosamente la consulta del usuario para identificar:
   - El deporte o rutina de ejercicio mencionado
   - Preocupaciones o metas dietéticas
   - Hábitos alimenticios o preferencias actuales
   - Condiciones de salud o restricciones

2. Usa el <scratchpad> para organizar tus pensamientos antes de responder:
   <scratchpad>
   Aquí debes:
   - Identificar los elementos clave de la consulta
   - Determinar qué secciones de las bases de conocimiento son relevantes
   - Organizar tus ideas para una respuesta completa y personalizada
   - Considerar posibles restricciones o necesidades especiales
   </scratchpad>

3. Estructura tu respuesta con estas etiquetas:
   <nutrition_advice> para recomendaciones dietéticas específicas
   <exercise_tips> para consejos de ejercicio o entrenamiento
   <explanation> para explicar el razonamiento detrás de tus recomendaciones
   <additional_info> para información adicional o recursos que puedan ser útiles`;
    
    this.estilo = `
ESTILO DE COMUNICACIÓN:
- Comienza con un saludo breve y amigable
- Utiliza un tono motivador y positivo
- Usa lenguaje claro y accesible, evitando jerga técnica innecesaria
- Proporciona respuestas concisas pero completas
- Termina con una frase alentadora

Escribe tu respuesta completa dentro de etiquetas <answer>...</answer>. Recuerda que tu objetivo principal es ayudar a los usuarios a tomar decisiones informadas para mejorar su salud y bienestar a través de la nutrición y el ejercicio físico.`;
  }

  /**
   * Inicializa el generador de prompts, cargando las bases de conocimiento
   */
  async init() {
    try {
      // Inicializar el cargador de la base de conocimiento
      await knowledgeBaseLoader.init();
      console.log('Generador de prompts dinámicos inicializado correctamente');
      return true;
    } catch (error) {
      console.error('Error al inicializar el generador de prompts:', error);
      return false;
    }
  }

  /**
   * Genera un prompt completo con las bases de conocimiento actuales
   * @returns {string} Prompt completo para el modelo de IA
   */
  generatePrompt() {
    // Obtener las bases de conocimiento
    const nutritionKnowledge = knowledgeBaseLoader.getNutritionKnowledge();
    const sportsKnowledge = knowledgeBaseLoader.getSportsKnowledge();
    
    // Construir el prompt completo
    return `${this.basePrompt}

<nutrition_knowledge_base>
${nutritionKnowledge}
</nutrition_knowledge_base>

<sports_knowledge_base>
${sportsKnowledge}
</sports_knowledge_base>
${this.estructura}
${this.directrices}
${this.estilo}`;
  }

  /**
   * Genera un prompt específico para una consulta, incluyendo el perfil del usuario
   * @param {string} query - Consulta del usuario
   * @param {string} userId - ID del usuario
   * @returns {string} Prompt personalizado para la consulta
   */
  async generateCustomPromptForQuery(query, userId) {
    try {
      // Obtener el perfil del usuario
      let userProfileSummary = '';
      if (userId) {
        const userProfile = await UserProfile.findOne({ userId });
        if (userProfile) {
          userProfileSummary = `
<user_profile>
${userProfile.getProfileSummary()}
</user_profile>`;
        }
      }
      
      // Búsqueda de información relevante
      const relevantResults = knowledgeBaseLoader.search(query);
      
      // Si no hay resultados relevantes, usar el prompt completo
      if (relevantResults.length === 0) {
        return `${this.basePrompt}
${userProfileSummary}

<nutrition_knowledge_base>
${knowledgeBaseLoader.getNutritionKnowledge()}
</nutrition_knowledge_base>

<sports_knowledge_base>
${knowledgeBaseLoader.getSportsKnowledge()}
</sports_knowledge_base>
${this.estructura}
${this.directrices}
${this.estilo}`;
      }
      
      // Dividir los resultados por categoría
      const nutritionResults = relevantResults.filter(result => 
        knowledgeBaseLoader.knowledgeBase.nutrition.some(item => item.source === result.source)
      );
      
      const sportsResults = relevantResults.filter(result => 
        knowledgeBaseLoader.knowledgeBase.sports.some(item => item.source === result.source)
      );
      
      // Construir bases de conocimiento personalizadas
      let customNutritionKnowledge = '- No hay información específica relevante.';
      let customSportsKnowledge = '- No hay información específica relevante.';
      
      if (nutritionResults.length > 0) {
        customNutritionKnowledge = nutritionResults
          .map(result => `- ${result.content.split('\n').join('\n- ')}`)
          .join('\n');
      }
      
      if (sportsResults.length > 0) {
        customSportsKnowledge = sportsResults
          .map(result => `- ${result.content.split('\n').join('\n- ')}`)
          .join('\n');
      }
      
      // Construir el prompt personalizado
      return `${this.basePrompt}
${userProfileSummary}

<nutrition_knowledge_base>
${customNutritionKnowledge}
</nutrition_knowledge_base>

<sports_knowledge_base>
${customSportsKnowledge}
</sports_knowledge_base>
${this.estructura}
${this.directrices}
${this.estilo}`;
    } catch (error) {
      console.error('Error al generar prompt personalizado:', error);
      return this.generatePrompt(); // Fallback al prompt general
    }
  }
}

// Exportar una instancia singleton
const dynamicPromptGenerator = new DynamicPromptGenerator();
export default dynamicPromptGenerator; 