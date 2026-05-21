const Button = ({
    children,
    variant = 'primary',
    size = 'medium',
    fullWidth = false,
    loading = false,
    disabled = false,
    type = 'button',
    onClick,
    className = '',
    ...props
}) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';

    const variantClasses = {
        primary: 'bg-gradient-to-r from-emerald to-emerald-dark text-white border border-gold/20 shadow-lg shadow-emerald/10 hover:shadow-emerald/20 hover:border-gold/40 hover:-translate-y-0.5 focus:ring-emerald-light',
        secondary: 'bg-white text-emerald border border-emerald/10 hover:bg-emerald-50 hover:border-emerald/30 focus:ring-emerald-light',
        gold: 'bg-gradient-to-r from-gold to-gold-dark text-emerald-dark border border-white/20 shadow-lg shadow-gold/10 hover:shadow-gold/20 hover:-translate-y-0.5 focus:ring-gold',
        danger: 'bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg hover:shadow-red-600/20 hover:-translate-y-0.5 focus:ring-red-500',
        ghost: 'bg-transparent text-emerald hover:bg-emerald-50/50 hover:text-emerald-light',
    };

    const sizeClasses = {
        small: 'px-3 py-1.5 text-xs',
        medium: 'px-5 py-2.5 text-sm',
        large: 'px-7 py-3.5 text-base',
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`
                ${baseClasses}
                ${variantClasses[variant]}
                ${sizeClasses[size]}
                ${widthClass}
                ${className}
            `}
            {...props}
        >
            {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : null}
            {children}
        </button>
    );
};

export default Button;
