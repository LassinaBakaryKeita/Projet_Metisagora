import React from 'react';
import { Landmark } from 'lucide-react';

/**
 * Métisagora Brand Icon
 * 
 * Symbolisant l'Agora (place du marché, portique classique et espace d'échange)
 * et Mêtis (l'intelligence stratégique et le conseil avisé).
 */
export const MetisagoraIcon = ({ className = "w-5 h-5", strokeWidth = 2, ...props }) => {
  return <Landmark className={className} strokeWidth={strokeWidth} {...props} />;
};
