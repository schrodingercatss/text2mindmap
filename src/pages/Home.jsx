import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Settings as SettingsIcon, FileText, Trash2, Loader, Plus, Search, Cpu } from 'lucide-react';
import { saveMindMap, getMindMaps, deleteMindMap, getApiSettings } from '../utils/storage';
import { generateMindMapFromText } from '../services/api';

const Home = () => {
    const navigate = useNavigate();
    const [maps, setMaps] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setMaps(getMindMaps());
    }, []);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Check file extension
        const fileName = file.name.toLowerCase();
        const isPdf = fileName.endsWith('.pdf');
        const isTxt = fileName.endsWith('.txt');

        if (!isPdf && !isTxt) {
            setError('Only .txt and .pdf files are supported.');
            return;
        }

        setLoading(true);
        setError('');

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                let content;
                let fileType;

                if (isPdf) {
                    // For PDF: get base64 data (remove the data URL prefix)
                    const base64 = e.target.result.split(',')[1];
                    content = base64;
                    fileType = 'pdf';
                } else {
                    // For TXT: use plain text
                    content = e.target.result;
                    fileType = 'txt';
                }

                const generatedData = await generateMindMapFromText(content, fileType);
                const { modelName } = getApiSettings();

                // Handle both old (array) and new (object) formats for backward compatibility
                const mindMapData = Array.isArray(generatedData) ? generatedData : generatedData.mindMap;
                const processFlowData = Array.isArray(generatedData) ? [] : (generatedData.processFlow || []);

                const newMap = {
                    title: file.name.replace(/\.(txt|pdf)$/i, ''),
                    data: mindMapData,
                    processSteps: processFlowData,
                    modelName: modelName || 'Unknown Model',
                    fileType: fileType
                };

                const savedMap = saveMindMap(newMap);
                setMaps(getMindMaps());
                navigate(`/map/${savedMap.id}`);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        // Read file based on type
        if (isPdf) {
            reader.readAsDataURL(file);
        } else {
            reader.readAsText(file);
        }
    };

    const handleDelete = (e, id) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this mind map?')) {
            deleteMindMap(id);
            setMaps(getMindMaps());
        }
    };

    const filteredMaps = maps
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .filter(map =>
            map.title.toLowerCase().includes(searchTerm.toLowerCase())
        );

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mind Maps</h1>
                        <p className="text-slate-500 mt-1">Manage and organize your meeting insights</p>
                    </div>
                    <button
                        onClick={() => navigate('/settings')}
                        className="p-3 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all"
                    >
                        <SettingsIcon size={24} />
                    </button>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-xl mb-8 border border-red-100 flex items-center gap-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        {error}
                    </div>
                )}

                {/* Search Bar */}
                <div className="mb-8 relative max-w-md">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search maps..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {/* Upload Card */}
                    <div
                        onClick={() => !loading && document.getElementById('file-upload').click()}
                        className={`
              relative group cursor-pointer border-2 border-dashed border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-400 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[240px] transition-all duration-300
              ${loading ? 'opacity-75 pointer-events-none' : ''}
            `}
                    >
                        {loading ? (
                            <div className="text-center">
                                <Loader className="animate-spin text-blue-600 mb-4 mx-auto" size={32} />
                                <p className="text-blue-800 font-medium">Generating...</p>
                            </div>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <Plus className="text-blue-600" size={32} />
                                </div>
                                <p className="text-blue-900 font-bold text-lg">New Mind Map</p>
                                <p className="text-blue-600/70 text-sm mt-1">Upload .txt or .pdf</p>
                                <input
                                    id="file-upload"
                                    type="file"
                                    accept=".txt,.pdf"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                            </>
                        )}
                    </div>

                    {/* Saved Maps */}
                    {filteredMaps.map((map) => (
                        <div
                            key={map.id}
                            onClick={() => navigate(`/map/${map.id}`)}
                            className="group bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => handleDelete(e, map.id)}
                                    className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            {(() => {
                                const colorMap = {
                                    blue: 'bg-blue-50 text-blue-600',
                                    green: 'bg-emerald-50 text-emerald-600',
                                    orange: 'bg-orange-50 text-orange-600',
                                    purple: 'bg-purple-50 text-purple-600',
                                    pink: 'bg-pink-50 text-pink-600',
                                    cyan: 'bg-cyan-50 text-cyan-600',
                                    emerald: 'bg-emerald-50 text-emerald-600',
                                    indigo: 'bg-indigo-50 text-indigo-600',
                                };
                                const colorClass = colorMap[map.iconColor] || colorMap['green'];

                                return (
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colorClass}`}>
                                        <FileText size={24} />
                                    </div>
                                );
                            })()}

                            <h3 className="font-bold text-slate-800 text-lg mb-2 line-clamp-1">{map.title}</h3>
                            <p className="text-slate-400 text-xs font-medium mb-3">
                                {new Date(map.createdAt).toLocaleString()}
                            </p>

                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] rounded-md font-medium uppercase tracking-wider">
                                    {map.data.length} Sections
                                </span>
                                {map.modelName && (
                                    <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] rounded-md font-medium flex items-center gap-1">
                                        <Cpu size={10} />
                                        {map.modelName}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;
