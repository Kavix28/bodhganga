import React, { useState, useEffect } from 'react';
import { Building } from 'lucide-react';
import StateNavigator from '../components/states/StateNavigator';
import Breadcrumb from '../components/common/Breadcrumb';
import { unionTerritories } from '../data/unionTerritories';
import api from '../services/api';

/**
 * Union Territories Page
 * Browse all 8 Indian Union Territories
 */
const UnionTerritories = () => {
    const [availableUts, setAvailableUts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAvailable = async () => {
            try {
                const data = await api.get('/states/available');
                const active = unionTerritories.filter(ut => 
                    data.some(d => d.state?.toLowerCase() === ut.name?.toLowerCase())
                ).map(ut => {
                    const match = data.find(d => d.state?.toLowerCase() === ut.name?.toLowerCase());
                    return {
                        ...ut,
                        notesCount: match?.count || 0
                    };
                });
                setAvailableUts(active);
            } catch (err) {
                console.error("Error loading available UTs:", err);
                setAvailableUts([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAvailable();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 page-enter">
            {/* Tricolor Top Accent */}
            <div className="tricolor-accent h-1"></div>

            <div className="container-custom py-[24px]">
                {/* Breadcrumb */}
                <Breadcrumb items={[
                    { label: 'Union Territories', path: '/union-territories' }
                ]} />

                {/* Page Header */}
                <div className="text-center mb-12 mt-8">
                    <div className="inline-flex items-center gap-3 mb-[12px]">
                        <div className="w-16 h-16 bg-gradient-to-br from-[var(--green)] to-[var(--green-dark)] rounded-2xl flex items-center justify-center shadow-none">
                            <Building className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-5xl lg:text-6xl font-bold mb-[12px]" style={{ color: 'var(--navy)' }}>
                        Union Territories
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        Select a union territory to access comprehensive preparation materials for UT-level government examinations including administrative services, police, and other competitive exams.
                    </p>
                </div>

                {/* Union Territories Navigator */}
                {isLoading ? (
                    <div className="text-center py-10 text-gray-500 font-bold uppercase tracking-wider text-xs">
                        Loading UT portals...
                    </div>
                ) : (
                    <StateNavigator
                        items={availableUts}
                        type="union-territory"
                    />
                )}

                {/* Info Section */}
                <div className="mt-20 bg-white rounded-2xl p-8 md:p-12 shadow-none border-2 border-gray-200">
                    <h2 className="text-3xl font-bold mb-[12px]" style={{ color: 'var(--navy)' }}>
                        About Union Territory Exam Preparation
                    </h2>
                    <div className="prose prose-lg max-w-none text-gray-600">
                        <p className="mb-4">
                            Union Territories in India are governed directly by the Central Government through an Administrator appointed by the President. Each UT conducts its own recruitment examinations for various administrative and service positions.
                        </p>
                        <p className="mb-4">
                            BodhGanga Academy provides specialized preparation materials for all 8 Union Territories, including:
                        </p>
                        <ul className="list-disc list-inside space-y-2 mb-4">
                            <li><strong>Delhi (NCT):</strong> DSSSB, Delhi Police, DTC, DMRC examinations</li>
                            <li><strong>Jammu & Kashmir:</strong> JKPSC, JK Police, JKSSB examinations</li>
                            <li><strong>Puducherry:</strong> Puducherry PSC and related exams</li>
                            <li><strong>Chandigarh:</strong> CHT Administration and Police exams</li>
                            <li><strong>Ladakh:</strong> Ladakh Administration recruitment</li>
                            <li><strong>And more...</strong> Complete coverage for all UTs</li>
                        </ul>
                        <p className="mb-4">
                            Each union territory page includes structured notes, practice questions, and detailed solutions tailored to the specific requirements of that UT's examinations.
                        </p>
                        <p>
                            Select your union territory above to begin your focused preparation with BodhGanga Academy.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnionTerritories;
