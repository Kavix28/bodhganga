import React from 'react';
import { MapPin } from 'lucide-react';
import StateNavigator from '../components/states/StateNavigator';
import Breadcrumb from '../components/common/Breadcrumb';
import { indianStates } from '../data/states';

/**
 * States Page
 * Browse all 28 Indian States
 */
const States = () => {
    return (
        <div className="min-h-screen bg-gray-50 page-enter">
            {/* Tricolor Top Accent */}
            <div className="tricolor-accent h-1"></div>

            <div className="container-custom py-12">
                {/* Breadcrumb */}
                <Breadcrumb items={[
                    { label: 'States', path: '/states' }
                ]} />

                {/* Page Header */}
                <div className="text-center mb-12 mt-8">
                    <div className="inline-flex items-center gap-3 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-[var(--saffron)] to-[var(--saffron-dark)] rounded-2xl flex items-center justify-center shadow-lg">
                            <MapPin className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-5xl lg:text-6xl font-bold mb-6" style={{ color: 'var(--navy)' }}>
                        Indian States
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        Select your state to access comprehensive preparation materials for state-level government examinations including PSC, Police, Revenue, and other competitive exams.
                    </p>
                </div>

                {/* States Navigator */}
                <StateNavigator
                    items={indianStates}
                    type="state"
                />

                {/* Info Section */}
                <div className="mt-20 bg-white rounded-2xl p-8 md:p-12 shadow-md border-2 border-gray-200">
                    <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--navy)' }}>
                        About State Exam Preparation
                    </h2>
                    <div className="prose prose-lg max-w-none text-gray-600">
                        <p className="mb-4">
                            Each state in India conducts its own Public Service Commission (PSC) examinations to recruit candidates for various government positions. BodhGanga Academy provides comprehensive, state-specific preparation materials designed to help you succeed.
                        </p>
                        <p className="mb-4">
                            Our content is meticulously organized by state, ensuring you get targeted preparation for your specific exam requirements. Each state page includes:
                        </p>
                        <ul className="list-disc list-inside space-y-2 mb-4">
                            <li><strong>Structured Notes:</strong> Topic-wise study materials covering the entire syllabus</li>
                            <li><strong>Practice Questions:</strong> Extensive question banks including previous year papers</li>
                            <li><strong>Detailed Solutions:</strong> Step-by-step explanations for better understanding</li>
                            <li><strong>Exam Information:</strong> Details about specific state recruitment examinations</li>
                        </ul>
                        <p>
                            Select your state above to begin your preparation journey with BodhGanga Academy.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default States;
