import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn, Lock } from 'lucide-react';

interface SignInPromptProps {
  title?: string;
  description?: string;
}

export const SignInPrompt = ({
  title = 'Sign in required',
  description = 'Please sign in to access this page.',
}: SignInPromptProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-md w-full text-center luxury-card">
        <CardHeader className="space-y-3">
          <div className="mx-auto rounded-full bg-primary/10 p-4 w-fit">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl luxury-text-gradient">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => navigate('/auth')} className="w-full heritage-button gap-2">
            <LogIn className="h-4 w-4" />
            Sign In
          </Button>
          <Button onClick={() => navigate('/marketplace')} variant="outline" className="w-full">
            Browse Marketplace
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
