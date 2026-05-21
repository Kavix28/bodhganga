import { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const Input = ({
    label,
    type = 'text',
    name,
    value,
    onChange,
    onBlur,
    placeholder,
    error,
    required = false,
    disabled = false,
    icon: Icon,
    className = '',
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const inputType = type === 'password' && showPassword ? 'text' : type;

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label htmlFor={name} className="block text-sm font-semibold text-emerald-dark mb-1.5 tracking-tight">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                {Icon && (
                    <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-emerald/60">
                        <Icon className="w-5 h-5" />
                    </div>
                )}

                <input
                    id={name}
                    name={name}
                    type={inputType}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    className={`
                        w-full py-3 px-4 rounded-xl border font-medium text-emerald-dark transition-all duration-300 outline-none text-sm
                        ${Icon ? 'pl-11' : 'pl-4'}
                        ${type === 'password' ? 'pr-11' : 'pr-4'}
                        ${error 
                            ? 'border-red-500 bg-red-50/20 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                            : 'border-emerald/10 bg-white/70 backdrop-blur-md focus:border-emerald focus:bg-white focus:ring-4 focus:ring-emerald/10 shadow-sm focus:shadow-md'
                        }
                        ${disabled ? 'bg-gray-100/50 cursor-not-allowed opacity-60' : ''}
                    `}
                    {...props}
                />

                {type === 'password' && (
                    <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-emerald/60 hover:text-emerald transition-colors"
                        tabIndex={-1}
                    >
                        {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                )}
            </div>

            {error && (
                <p className="mt-1.5 text-xs font-semibold text-red-500 animate-fade-in">{error}</p>
            )}
        </div>
    );
};

export default Input;
