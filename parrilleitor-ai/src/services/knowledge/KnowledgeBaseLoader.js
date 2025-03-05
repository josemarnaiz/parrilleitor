import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

/**
 * Servicio para cargar y procesar documentos de la base de conocimiento
 * Soporta la extracción de texto de diferentes formatos de archivo
 */
class KnowledgeBaseLoader {
  constructor() {
    // Ruta base para los documentos de conocimiento
    this.basePath = path.join(process.cwd(), 'src', 'data', 'knowledge');
    
    // Divide knowledge por categorías
    this.categories = {
      nutrition: path.join(this.basePath, 'nutrition'),
      sports: path.join(this.basePath, 'sports'),
    };
    
    // Inicializa las bases de conocimiento
    this.knowledgeBase = {
      nutrition: [],
      sports: [],
    };
  }

  /**
   * Inicializa el servicio y carga todos los documentos disponibles
   */
  async init() {
    try {
      console.log('Iniciando carga de bases de conocimiento...');
      
      // Asegurarse de que existen las carpetas necesarias
      await this.ensureDirectories();
      
      // Cargar documentos de nutrición
      await this.loadCategory('nutrition');
      
      // Cargar documentos de deportes
      await this.loadCategory('sports');
      
      console.log('Bases de conocimiento cargadas correctamente');
      return true;
    } catch (error) {
      console.error('Error al inicializar el cargador de conocimiento:', error);
      return false;
    }
  }

  /**
   * Asegura que existen los directorios necesarios
   */
  async ensureDirectories() {
    // Crear directorio base si no existe
    if (!fs.existsSync(this.basePath)) {
      await fsPromises.mkdir(this.basePath, { recursive: true });
    }
    
    // Crear directorios para cada categoría
    for (const category in this.categories) {
      if (!fs.existsSync(this.categories[category])) {
        await fsPromises.mkdir(this.categories[category], { recursive: true });
      }
    }
  }

  /**
   * Carga los documentos de una categoría específica
   * @param {string} category - Categoría a cargar ('nutrition' o 'sports')
   */
  async loadCategory(category) {
    try {
      if (!this.categories[category]) {
        throw new Error(`Categoría desconocida: ${category}`);
      }
      
      const categoryPath = this.categories[category];
      
      // Leer todos los archivos del directorio
      const files = await fsPromises.readdir(categoryPath);
      console.log(`Encontrados ${files.length} archivos en categoría ${category}`);
      
      // Procesar cada archivo según su extensión
      for (const file of files) {
        const filePath = path.join(categoryPath, file);
        const extension = path.extname(file).toLowerCase();
        
        // Comprobar si es un archivo regular
        const stats = await fsPromises.stat(filePath);
        if (!stats.isFile()) continue;
        
        // Extraer texto según el formato del archivo
        let content = '';
        
        try {
          // Actualmente implementamos una versión simplificada que solo lee archivos de texto
          // En un entorno de producción, aquí utilizaríamos librerías para leer PDFs, DOCs, etc.
          if (extension === '.txt' || extension === '.md') {
            content = await fsPromises.readFile(filePath, 'utf8');
          } else if (extension === '.json') {
            const jsonData = await fsPromises.readFile(filePath, 'utf8');
            content = JSON.parse(jsonData).content || '';
          } else {
            // Para otros formatos, en producción usaríamos librerías como:
            // - pdf-parse para PDFs
            // - mammoth para DOCs/DOCX
            // - tesseract.js para OCR en imágenes
            console.log(`No se puede procesar formato ${extension} sin librerías adicionales`);
            content = `[Contenido no procesado de ${file}]`;
          }
          
          // Añadir el contenido a la base de conocimiento correspondiente
          if (content.trim()) {
            this.knowledgeBase[category].push({
              source: file,
              content: content.trim(),
            });
            console.log(`Archivo ${file} cargado correctamente`);
          }
        } catch (fileError) {
          console.error(`Error al procesar archivo ${file}:`, fileError);
        }
      }
      
      console.log(`Categoría ${category} cargada: ${this.knowledgeBase[category].length} documentos`);
    } catch (error) {
      console.error(`Error al cargar la categoría ${category}:`, error);
    }
  }

  /**
   * Obtiene el contenido de la base de conocimiento de nutrición
   * @returns {string} Contenido formateado para el prompt
   */
  getNutritionKnowledge() {
    if (this.knowledgeBase.nutrition.length === 0) {
      return '- No hay documentos de nutrición disponibles.';
    }
    
    return this.knowledgeBase.nutrition
      .map(doc => `- ${doc.content.split('\n').join('\n- ')}`)
      .join('\n');
  }

  /**
   * Obtiene el contenido de la base de conocimiento de deportes
   * @returns {string} Contenido formateado para el prompt
   */
  getSportsKnowledge() {
    if (this.knowledgeBase.sports.length === 0) {
      return '- No hay documentos de deportes disponibles.';
    }
    
    return this.knowledgeBase.sports
      .map(doc => `- ${doc.content.split('\n').join('\n- ')}`)
      .join('\n');
  }

  /**
   * Busca información específica en la base de conocimiento
   * @param {string} query - Consulta a buscar
   * @param {string} category - Categoría donde buscar ('nutrition', 'sports' o 'all')
   * @returns {Array} Resultados encontrados
   */
  search(query, category = 'all') {
    const results = [];
    
    if (category === 'all' || category === 'nutrition') {
      const nutritionResults = this.knowledgeBase.nutrition.filter(doc => 
        doc.content.toLowerCase().includes(query.toLowerCase())
      );
      results.push(...nutritionResults);
    }
    
    if (category === 'all' || category === 'sports') {
      const sportsResults = this.knowledgeBase.sports.filter(doc => 
        doc.content.toLowerCase().includes(query.toLowerCase())
      );
      results.push(...sportsResults);
    }
    
    return results;
  }
}

// Exportar una instancia singleton
const knowledgeBaseLoader = new KnowledgeBaseLoader();
export default knowledgeBaseLoader; 