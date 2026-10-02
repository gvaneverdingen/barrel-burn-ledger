import type { ReactElement, ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ExplainProps {
  /** One or two plain sentences: what happens when this is used. */
  text: ReactNode;
  /** A single focusable element (a Button, or a Radix trigger rendered asChild). */
  children: ReactElement;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

// Hover/focus explainer for an action. Shows on mouse hover and on keyboard
// focus; relies on the app-level TooltipProvider in App.tsx.
export const Explain = ({ text, children, side = 'top' }: ExplainProps) => (
  <Tooltip delayDuration={300}>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent side={side} className="max-w-[260px] text-xs leading-relaxed">
      {text}
    </TooltipContent>
  </Tooltip>
);
