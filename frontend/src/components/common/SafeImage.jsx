import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

const SafeImage = ({ src, alt, className, fallbackIconSize = 'w-8 h-8', ...props }) => {
    const [hasError, setHasError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    if (hasError || !src) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 border border-gray-200 text-gray-400 ${className}`} {...props}>
                <ImageIcon className={fallbackIconSize} />
            </div>
        );
    }

    return (
        <div className={`relative overflow-hidden ${className}`} {...props}>
            {!isLoaded && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center" />
            )}
            <img
                src={src}
                alt={alt || "Image"}
                className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setIsLoaded(true)}
                onError={() => setHasError(true)}
                loading="lazy"
            />
        </div>
    );
};

export default SafeImage;
