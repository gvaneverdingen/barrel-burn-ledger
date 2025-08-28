// Password security validation utility
export interface PasswordStrength {
  score: number; // 0-4 (weak to very strong)
  feedback: string[];
  isValid: boolean;
}

export const validatePasswordStrength = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;

  // Minimum length check
  if (password.length < 8) {
    feedback.push("Password must be at least 8 characters long");
  } else {
    score += 1;
  }

  // Character variety checks
  if (!/[a-z]/.test(password)) {
    feedback.push("Add lowercase letters");
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push("Add uppercase letters");
  } else {
    score += 1;
  }

  if (!/\d/.test(password)) {
    feedback.push("Add numbers");
  } else {
    score += 1;
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    feedback.push("Add special characters (!@#$%^&* etc.)");
  } else {
    score += 1;
  }

  // Common password patterns check
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    feedback.push("Avoid common passwords");
    score = Math.max(0, score - 2);
  }

  // Sequential characters check
  if (/123|abc|qwe/i.test(password)) {
    feedback.push("Avoid sequential characters");
    score = Math.max(0, score - 1);
  }

  return {
    score: Math.min(score, 4),
    feedback,
    isValid: score >= 3 && password.length >= 8
  };
};

export const getPasswordStrengthText = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return "Very Weak";
    case 2:
      return "Weak";
    case 3:
      return "Good";
    case 4:
      return "Strong";
    default:
      return "Very Weak";
  }
};

export const getPasswordStrengthColor = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return "text-destructive";
    case 2:
      return "text-orange-500";
    case 3:
      return "text-yellow-500";
    case 4:
      return "text-green-500";
    default:
      return "text-destructive";
  }
};