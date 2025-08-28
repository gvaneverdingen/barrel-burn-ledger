import React from 'react';
import { Progress } from '@/components/ui/progress';
import { validatePasswordStrength, getPasswordStrengthText, getPasswordStrengthColor } from '@/utils/passwordValidation';

interface PasswordStrengthIndicatorProps {
  password: string;
  showFeedback?: boolean;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ 
  password, 
  showFeedback = true 
}) => {
  const strength = validatePasswordStrength(password);
  
  if (!password) {
    return null;
  }

  const progressValue = (strength.score / 4) * 100;
  const strengthText = getPasswordStrengthText(strength.score);
  const strengthColor = getPasswordStrengthColor(strength.score);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Password strength:</span>
        <span className={`text-sm font-medium ${strengthColor}`}>
          {strengthText}
        </span>
      </div>
      
      <Progress 
        value={progressValue} 
        className="h-2"
      />
      
      {showFeedback && strength.feedback.length > 0 && (
        <div className="space-y-1">
          {strength.feedback.map((feedback, index) => (
            <p key={index} className="text-xs text-muted-foreground">
              • {feedback}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;