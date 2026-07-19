import ChambaMCQFeature from '../components/states/ChambaMCQFeature';

export default function DevPreviewChambaMCQ() {
    return (
        <div className="min-h-screen bg-gray-950 text-white px-4 py-10">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6 p-4 bg-red-950/60 border border-red-800 rounded-xl text-center">
                    <p className="text-red-300 font-bold text-sm">
                        TEMPORARY DEV PREVIEW - DO NOT DEPLOY TO PRODUCTION
                    </p>
                </div>
                <ChambaMCQFeature onBack={() => window.alert('Clicked Back to Resources')} />
            </div>
        </div>
    );
}
