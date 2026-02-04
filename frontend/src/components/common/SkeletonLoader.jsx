import React from 'react';

/**
 * SkeletonLoader Component
 * Animated loading placeholder for better perceived performance
 * Prevents layout shifts and provides visual feedback
 */
const SkeletonLoader = ({ type = 'card', count = 1 }) => {
    const renderSkeleton = () => {
        switch (type) {
            case 'card':
                return (
                    <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6 animate-pulse">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
                            <div className="flex-1">
                                <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        </div>
                    </div>
                );

            case 'list':
                return (
                    <div className="bg-white rounded-lg p-4 mb-3 animate-pulse">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                            <div className="flex-1">
                                <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    </div>
                );

            case 'table':
                return (
                    <div className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="grid grid-cols-5 gap-4">
                                    <div className="h-4 bg-gray-300 rounded"></div>
                                    <div className="h-4 bg-gray-200 rounded"></div>
                                    <div className="h-4 bg-gray-200 rounded"></div>
                                    <div className="h-4 bg-gray-200 rounded"></div>
                                    <div className="h-4 bg-gray-300 rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'text':
                return (
                    <div className="animate-pulse space-y-3">
                        <div className="h-8 bg-gray-300 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                    </div>
                );

            default:
                return (
                    <div className="animate-pulse">
                        <div className="h-32 bg-gray-300 rounded-lg"></div>
                    </div>
                );
        }
    };

    return (
        <>
            {[...Array(count)].map((_, index) => (
                <div key={index} className="mb-4">
                    {renderSkeleton()}
                </div>
            ))}
        </>
    );
};

export default SkeletonLoader;
