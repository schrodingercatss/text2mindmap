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
    const [editData, setEditData] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        const map = getMindMapById(id);
        if (map) {
            setMapData(map);
            setEditData(map.data);
            setEditTitle(map.title);
        } else {
            navigate('/');
        }
    }, [id, navigate]);

    const handleStartEdit = () => {
        setEditData([...mapData.data]);
        setEditTitle(mapData.title);
        setIsEditing(true);
    };

    const handleSave = () => {
        const updated = updateMindMap(id, {
            title: editTitle.trim() || mapData.title,
            data: editData
        });
        if (updated) {
            setMapData(updated);
            setIsEditing(false);
            setSaveMessage('Saved successfully!');
            setTimeout(() => setSaveMessage(''), 2000);
        }
    };

    const handleCancelEdit = () => {
        setEditData(mapData.data);
        setEditTitle(mapData.title);
        setIsEditing(false);
    };

    const handleDataChange = (newData) => {
        setEditData(newData);
    };

    const handleTitleChange = (newTitle) => {
        setEditTitle(newTitle);
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
                                onClick={handleStartEdit}
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
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                        <p className="text-blue-700 text-sm">
                            <strong>Edit Mode:</strong> Double-click on any text to edit it. Press Enter or click away to confirm. Click Save when finished.
                        </p>
                    </div>
                )}
            </div>

            <MindMapViewer
                title={isEditing ? editTitle : mapData.title}
                data={isEditing ? editData : mapData.data}
                processSteps={mapData.processSteps}
                isEditing={isEditing}
                onDataChange={handleDataChange}
                onTitleChange={handleTitleChange}
            />
        </div>
    );
};

export default MindMapDetail;
