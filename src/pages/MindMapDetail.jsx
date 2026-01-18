import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMindMapById } from '../utils/storage';
import MindMapViewer from '../components/MindMapViewer';
import { ArrowLeft } from 'lucide-react';

const MindMapDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [mapData, setMapData] = useState(null);

    useEffect(() => {
        const map = getMindMapById(id);
        if (map) {
            setMapData(map);
        } else {
            navigate('/');
        }
    }, [id, navigate]);

    if (!mapData) return null;

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto p-8">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-6"
                >
                    <ArrowLeft size={20} /> Back to Dashboard
                </button>
            </div>

            <MindMapViewer
                title={mapData.title}
                data={mapData.data}
                processSteps={mapData.processSteps}
            />
        </div>
    );
};

export default MindMapDetail;
