import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMindMapById, updateMindMap } from '../utils/storage';
import MindMapViewer from '../components/MindMapViewer';
import PaperReadingViewer from '../components/PaperReadingViewer';
import { ArrowLeft, Edit3, Save, X, BookOpen, GitBranch } from 'lucide-react';

const MindMapDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [mapData, setMapData] = useState(null);
    const [activeTab, setActiveTab] = useState('notes'); // 'notes' or 'mindmap'
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(null);
    const [editProcessSteps, setEditProcessSteps] = useState([]);
    const [editTitle, setEditTitle] = useState('');
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        const loadMap = async () => {
            const map = await getMindMapById(id);
            if (map) {
                setMapData(map);
                setEditData(map.data || []);
                setEditTitle(map.title);
                setEditProcessSteps(map.processSteps || []);

                // Set default tab based on available content
                if (map.paperNotes && !map.data) {
                    setActiveTab('notes');
                } else if (map.data && !map.paperNotes) {
                    setActiveTab('mindmap');
                } else {
                    // Both available, default to notes
                    setActiveTab('notes');
                }
            } else {
                navigate('/');
            }
        };
        loadMap();
    }, [id, navigate]);

    const handleStartEdit = () => {
        setEditData([...(mapData.data || [])]);
        setEditTitle(mapData.title);
        setEditProcessSteps([...(mapData.processSteps || [])]);
        setIsEditing(true);
    };

    const handleSave = async () => {
        const updated = await updateMindMap(id, {
            title: editTitle.trim() || mapData.title,
            data: editData,
            processSteps: editProcessSteps
        });
        if (updated) {
            setMapData(updated);
            setIsEditing(false);
            setSaveMessage('Saved successfully!');
            setTimeout(() => setSaveMessage(''), 2000);
        }
    };

    const handleCancelEdit = () => {
        setEditData(mapData.data || []);
        setEditTitle(mapData.title);
        setEditProcessSteps(mapData.processSteps || []);
        setIsEditing(false);
    };

    const handleDataChange = (newData) => {
        setEditData(newData);
    };

    const handleTitleChange = (newTitle) => {
        setEditTitle(newTitle);
    };

    const handleProcessStepsChange = (newSteps) => {
        setEditProcessSteps(newSteps);
    };

    if (!mapData) return null;

    const hasPaperNotes = mapData.paperNotes;
    const hasMindMap = mapData.data && mapData.data.length > 0;
    const showTabs = hasPaperNotes && hasMindMap;

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
                        {activeTab === 'mindmap' && hasMindMap && (
                            !isEditing ? (
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
                            )
                        )}
                    </div>
                </div>

                {/* Tab Bar */}
                {showTabs && (
                    <div className="mb-6">
                        <div className="inline-flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
                            <button
                                onClick={() => {
                                    setActiveTab('notes');
                                    setIsEditing(false);
                                }}
                                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'notes'
                                    ? 'bg-purple-500 text-white shadow-md'
                                    : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <BookOpen size={18} />
                                Paper Notes
                            </button>
                            <button
                                onClick={() => setActiveTab('mindmap')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'mindmap'
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <GitBranch size={18} />
                                Mind Map
                            </button>
                        </div>
                    </div>
                )}

                {isEditing && activeTab === 'mindmap' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                        <p className="text-blue-700 text-sm">
                            <strong>Edit Mode:</strong> Double-click on any text to edit it. Press Enter or click away to confirm. Click Save when finished.
                        </p>
                    </div>
                )}
            </div>

            {/* Content */}
            {activeTab === 'notes' && hasPaperNotes ? (
                <PaperReadingViewer
                    title={mapData.title}
                    content={mapData.paperNotes}
                />
            ) : activeTab === 'mindmap' && hasMindMap ? (
                <MindMapViewer
                    title={isEditing ? editTitle : mapData.title}
                    data={isEditing ? editData : (mapData.data || [])}
                    processSteps={isEditing ? editProcessSteps : mapData.processSteps}
                    isEditing={isEditing}
                    onDataChange={handleDataChange}
                    onTitleChange={handleTitleChange}
                    onProcessStepsChange={handleProcessStepsChange}
                />
            ) : hasPaperNotes ? (
                <PaperReadingViewer
                    title={mapData.title}
                    content={mapData.paperNotes}
                />
            ) : hasMindMap ? (
                <MindMapViewer
                    title={isEditing ? editTitle : mapData.title}
                    data={isEditing ? editData : (mapData.data || [])}
                    processSteps={isEditing ? editProcessSteps : mapData.processSteps}
                    isEditing={isEditing}
                    onDataChange={handleDataChange}
                    onTitleChange={handleTitleChange}
                    onProcessStepsChange={handleProcessStepsChange}
                />
            ) : (
                <div className="text-center py-20 text-slate-500">
                    No content available
                </div>
            )}
        </div>
    );
};

export default MindMapDetail;
