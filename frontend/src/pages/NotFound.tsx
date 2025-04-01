
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Logo from '@/components/Logo';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-studio-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        
        <h1 className="text-3xl font-bold mb-2 text-studio-error">404</h1>
        <h2 className="text-xl font-semibold mb-4 text-gradient">Page Not Found</h2>
        <p className="text-studio-muted mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        
        <Button 
          onClick={() => navigate('/')}
          variant="outline"
          className="border-studio-border"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
