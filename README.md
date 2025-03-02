# Parrilleitor AI

A modern chat application with AI integration, user authentication, and conversation management.

## Features

- Auth0 authentication for secure user access
- OpenAI or Anthropic AI provider integration
- MongoDB database for conversation storage
- Real-time chat interface
- Mobile-first responsive design
- Conversation management (create, view, delete)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (free tier is sufficient)
- Auth0 account (free tier is sufficient)
- OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/parrilleitor.git
   cd parrilleitor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env.local
   ```

4. Configure environment variables in `.env.local`:

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
   ANTHROPIC_API_KEY=your_anthropic_api_key

   # MongoDB Configuration
   MONGODB_URI=your_mongodb_uri
   MONGODB_DATA_API_URL=your_mongodb_data_api_url
   MONGODB_DATA_API_KEY=your_mongodb_data_api_key
   MONGODB_DATABASE=your_mongodb_database

   # Allowed Emails
   ALLOWED_EMAILS=email1@example.com,email2@example.com
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

### Deploying to Netlify

1. Push your code to GitHub
2. Connect your GitHub repository to Netlify
3. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `out`
4. Add all environment variables from `.env.local` to Netlify's environment variables section

## Security Considerations

- **NEVER commit your `.env.local` file to version control**
- Regenerate API keys, secrets, and passwords if they've been exposed
- Use environment variables for all sensitive information
- Implement proper access controls through Auth0

## License

[MIT](LICENSE)