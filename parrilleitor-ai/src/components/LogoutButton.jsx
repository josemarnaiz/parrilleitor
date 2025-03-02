'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton({ children, className = '' }) {
  const router = useRouter();
  
  const handleLogout = () => {
    router.push('/api/auth/logout');
  };
  
  return (
    <button
      onClick={handleLogout}
      className={`text-accent-dark hover:text-accent transition-colors flex items-center ${className}`}
    >
      {children || (
        <>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="mr-2"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Cerrar Sesión
        </>
      )}
    </button>
  );
} 