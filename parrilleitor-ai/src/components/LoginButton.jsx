'use client';

import { useRouter } from 'next/navigation';

export default function LoginButton() {
  const router = useRouter();
  
  const handleLogin = () => {
    router.push('/api/auth/login');
  };
  
  return (
    <button
      onClick={handleLogin}
      className="btn btn-primary flex items-center gap-2 px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-all"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="mr-1"
      >
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
        <polyline points="10 17 15 12 10 7"></polyline>
        <line x1="15" y1="12" x2="3" y2="12"></line>
      </svg>
      Iniciar Sesión
    </button>
  );
} 