import React, { memo } from 'react';

/**
 * Reusable ContentSection wrapper.
 * Sections have an id for anchor-link scrolling — use className="scroll-mt-24" handled internally.
 */
const ContentSection = ({ id, title, children, icon: Icon, className = '' }) => {
    return (
        <section
            id={id}
            className={`bg-white border border-gray-200 rounded shadow-none mb-[12px] scroll-mt-24 ${className}`}
        >
            {title && (
                <div className="p-0 border-none flex items-center gap-3">
                    {Icon && (
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4 text-orange-600" />
                        </div>
                    )}
                    <h2 className="text-xl font-bold text-gray-900 border-b-2 border-orange-500 pb-1 -mb-[14px]">
                        {title}
                    </h2>
                </div>
            )}
            <div className="px-6 py-5 text-gray-700 leading-relaxed text-sm md:text-base space-y-3">
                {children}
            </div>
        </section>
    );
};

export default memo(ContentSection);
