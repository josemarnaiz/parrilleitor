# ParrilleitorAI

ParrilleitorAI es un asistente de IA especializado en nutrición deportiva y ejercicio físico, diseñado para ayudar a los usuarios a alcanzar sus objetivos de fitness y nutrición.

## Características

- Chat interactivo con IA especializada en nutrición deportiva
- Historial de conversaciones con timestamps
- Autenticación de usuarios con Auth0
- Almacenamiento de conversaciones en MongoDB
- Interfaz responsive y amigable para móviles

## Requisitos Previos

- Node.js 18.x o superior
- Cuenta de MongoDB Atlas
- Cuenta de Auth0
- Clave API de OpenAI

## Configuración

1. **Clonar el repositorio**

```bash
git clone https://github.com/tu-usuario/parrilleitor-ai.git
cd parrilleitor-ai
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

Copia el archivo `.env.example` a `.env.local` y completa las variables:

```bash
cp .env.example .env.local
```

Edita el archivo `.env.local` con tus credenciales:

```
# Auth0 Configuration
AUTH0_SECRET=your_auth0_secret
AUTH0_BASE_URL=your_auth0_base_url
AUTH0_ISSUER_BASE_URL=your_auth0_issuer_base_url
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret
AUTH0_AUDIENCE=your_auth0_audience
AUTH0_SCOPE=openid profile email

# AI Provider Configuration
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key

# MongoDB Configuration
MONGODB_URI=your_mongodb_uri
MONGODB_DATABASE=your_mongodb_database

# Allowed Emails (opcional)
ALLOWED_EMAILS=email1@example.com,email2@example.com
```

4. **Configurar Auth0**

- Crea una aplicación en Auth0
- Configura las URLs de callback: `https://tu-dominio.com/api/auth/callback`
- Configura las URLs de logout: `https://tu-dominio.com`
- Configura las URLs de origen web: `https://tu-dominio.com`

5. **Configurar MongoDB**

- Crea un cluster en MongoDB Atlas
- Crea una base de datos llamada `parrilleitor` (o el nombre que prefieras)
- Obtén la URI de conexión

## Desarrollo

```bash
npm run dev
```

## Producción

```bash
npm run build
npm start
```

## Despliegue

La aplicación está configurada para desplegarse en Vercel, pero también puede desplegarse en otras plataformas como Netlify o Railway.

### Despliegue en Vercel

```bash
npm install -g vercel
vercel
```

### Despliegue en Netlify

Consulta la [documentación de despliegue en Netlify](docs/netlify-deployment.md) para más detalles.

## Estructura del Proyecto

```
parrilleitor-ai/
├── public/            # Archivos estáticos
├── src/
│   ├── app/           # Rutas de Next.js App Router
│   ├── components/    # Componentes React
│   ├── config/        # Configuraciones
│   ├── lib/           # Utilidades y bibliotecas
│   ├── models/        # Modelos de MongoDB
│   ├── pages/         # Páginas y API routes
│   ├── services/      # Servicios (AI, etc.)
│   └── styles/        # Estilos CSS
├── .env.example       # Ejemplo de variables de entorno
├── .gitignore         # Archivos ignorados por Git
├── next.config.mjs    # Configuración de Next.js
└── package.json       # Dependencias y scripts
```

## Seguridad

- **NO** incluyas archivos `.env.local` o cualquier archivo con credenciales en el repositorio
- Revisa regularmente las dependencias en busca de vulnerabilidades con `npm audit`
- Utiliza variables de entorno para todas las credenciales

## Licencia

[MIT](LICENSE)

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o un pull request para sugerencias o mejoras.
