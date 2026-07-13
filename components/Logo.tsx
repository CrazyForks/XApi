
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  showIcon?: boolean;
  textColor?: string;
}

/**
 * XApi Central Logo Component
 * Design: Logic Prism v5.0
 * Colors: Logic Blue (#00F2FF) & Creative Purple (#FF00E5)
 */
export const Logo: React.FC<LogoProps> = ({
  className = "",
  size = 32,
  showText = true,
  showIcon = true,
  textColor = "text-slate-800"
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`} style={{ height: size }}>
      {showIcon && (
        <img
          src="icons/logo.svg"
          width={size}
          height={size}
          alt="XApi"
          className="flex-shrink-0"
        />
      )}

      {showText && (
        <span
          className={`font-black tracking-tighter select-none ${textColor}`}
          style={{ fontSize: size * 0.75, lineHeight: 1 }}
        >
          X<span className="opacity-40 font-light ml-0.5">Api</span>
        </span>
      )}
    </div>
  );
};
