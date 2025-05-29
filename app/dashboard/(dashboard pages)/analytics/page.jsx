import GoogleMaps from './components/GoogleMaps';

export default function AnalyticsPage() {
    return (
        <div className="flex-1 py-2 flex flex-col max-h-full overflow-y-auto">
            <div className="w-full bg-white rounded-3xl my-3 flex flex-col p-6">
                <h2 className="text-xl font-semibold mb-4">Analytics Map</h2>
                <p className="text-gray-600 mb-6">
                    View geographic data and analytics for your Linktree profile.
                </p>
                <div className="w-full">
                    <GoogleMaps />
                </div>
            </div>
        </div>
    )
}