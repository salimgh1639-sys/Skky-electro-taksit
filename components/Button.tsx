import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "px-4 py-3 rounded-xl font-bold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700",
    secondary: "bg-gray-800 text-white shadow-lg hover:bg-gray-900",
    outline: "border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50",
    danger: "bg-red-100 text-red-600 hover:bg-red-200"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;