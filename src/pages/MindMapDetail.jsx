import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMindMapById, updateMindMap } from '../utils/storage';
import MindMapViewer from '../components/MindMapViewer';
import { ArrowLeft, Edit3, Save, X } from 'lucide-react';

const MindMapDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [mapData, setMapData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        const map = getMindMapById(id);
        if (map) {
            setMapData(map);
            setEditTitle(map.title);
        } else {
            navigate('/');
        }
    }, [id, navigate]);

    const handleSave = () => {
        if (!editTitle.trim()) return;

        const updated = updateMindMap(id, { title: editTitle.trim() });
        if (updated) {
            setMapData(updated);
            setIsEditing(false);
            setSaveMessage('Saved successfully!');
            setTimeout(() => setSaveMessage(''), 2000);
        }
    };

    const handleCancelEdit = () => {
        setEditTitle(mapData.title);
        setIsEditing(false);
    };

    if (!mapData) return null;

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto p-8">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        <ArrowLeft size={20} /> Back to Dashboard
                    </button>

                    <div className="flex items-center gap-3">
                        {saveMessage && (
                            <span className="text-green-600 text-sm font-medium">{saveMessage}</span>
                        )}
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                <Edit3 size={16} /> Edit
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleCancelEdit}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                                >
                                    <X size={16} /> Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                >
                                    <Save size={16} /> Save
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {isEditing && (
                    <div className="bg-white rounded-xl p-6 border border-slate-200 mb-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Edit Title</label>
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            placeholder="Enter mind map title..."
                        />
                        <p className="mt-2 text-xs text-slate-400">
                            Tip: This is the display title for your mind map.
                        </p>
                    </div>
                )}
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
