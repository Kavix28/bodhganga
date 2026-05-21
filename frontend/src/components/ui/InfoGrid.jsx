import React, { memo } from 'react';

const InfoGridItem = ({ icon: Icon, title, value }) => (
    <div className="flex flex-col items-center bg-gray-50 border border-gray-200 rounded p-6 shadow-none hover:border-orange-500 hover:bg-orange-50 transition-colors">
        {Icon && (
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-orange-600" />
            </div>
        )}
        <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider text-center">{title}</h3>
        <p className="text-lg font-bold text-gray-900 mt-2 text-center">{value}</p>
    </div>
);

const InfoGrid = ({ items = [] }) => {
    return (
        <div className="card-grid">
            {items.map((item, index) => (
                <InfoGridItem key={index} {...item} />
            ))}
        </div>
    );
};

export default memo(InfoGrid);
