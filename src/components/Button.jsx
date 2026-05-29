const VARIANTS = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 border border-transparent',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent',
  outline: 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300',
  ghost: 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-transparent shadow-none',
  danger: 'bg-red-600 text-white hover:bg-red-700 border border-transparent',
  dangerGhost: 'bg-transparent text-gray-400 hover:text-red-500 hover:bg-red-50 border border-transparent shadow-none'
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  icon: 'p-1' // For icon-only buttons
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed';

  // Use ghost sizes based on variant if no size explicitly provided to match old styles sometimes, or just stick to sizes
  const variantClasses = VARIANTS[variant] || VARIANTS.primary;
  const sizeClasses = SIZES[size] || SIZES.md;

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
