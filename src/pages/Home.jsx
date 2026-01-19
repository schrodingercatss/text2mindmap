import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, FileText, Trash2, Loader, Search, Cpu, BookOpen, GitBranch, X, ClipboardPaste, Image, LogOut } from 'lucide-react';
import { saveMindMap, getMindMaps, deleteMindMap, getApiSettings } from '../utils/storage';
import { generateMindMapFromText, generatePaperReading, repairPaperNotes } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
    const navigate = useNavigate();
    const { user, signOut, loading: authLoading } = useAuth();
    const [maps, setMaps] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModeModal, setShowModeModal] = useState(false);
    const [pendingFile, setPendingFile] = useState(null);
    const [showPasteModal, setShowPasteModal] = useState(false);
    const [pasteContent, setPasteContent] = useState('');
    const [pasteImage, setPasteImage] = useState(null); // { base64: string, type: string }
    const [mapsLoading, setMapsLoading] = useState(true);

    useEffect(() => {
        // Wait for auth to finish loading before fetching maps
        if (authLoading) {
            return;
        }
        const loadMaps = async () => {
            setMapsLoading(true);
            console.log('Home - Loading maps, user:', user?.id);
            const loadedMaps = await getMindMaps(user?.id);
            console.log('Home - Loaded maps:', loadedMaps.length);
            setMaps(loadedMaps);
            setMapsLoading(false);
        };
        loadMaps();
    }, [authLoading, user]);

    const handleFileSelect = (event) => {
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

        // Show mode selection modal
        setPendingFile(file);
        setShowModeModal(true);
    };

    const handlePasteFromClipboard = async () => {
        try {
            // Try to read clipboard items (supports images)
            const clipboardItems = await navigator.clipboard.read();

            for (const item of clipboardItems) {
                // Check for image types
                const imageType = item.types.find(type => type.startsWith('image/'));
                if (imageType) {
                    const blob = await item.getType(imageType);
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const base64 = e.target.result;
                        setPasteImage({ base64, type: imageType });
                        setPasteContent('');
                        setShowPasteModal(true);
                    };
                    reader.readAsDataURL(blob);
                    return;
                }

                // Check for text
                if (item.types.includes('text/plain')) {
                    const blob = await item.getType('text/plain');
                    const text = await blob.text();
                    if (text && text.trim()) {
                        setPasteContent(text);
                        setPasteImage(null);
                        setShowPasteModal(true);
                        return;
                    }
                }
            }

            setError('Clipboard is empty or contains unsupported content.');
        } catch (err) {
            // Fallback: try readText for older browsers
            try {
                const text = await navigator.clipboard.readText();
                if (text && text.trim()) {
                    setPasteContent(text);
                    setPasteImage(null);
                    setShowPasteModal(true);
                } else {
                    // Show modal for manual paste
                    setPasteContent('');
                    setPasteImage(null);
                    setShowPasteModal(true);
                }
            } catch (e) {
                // Show modal for manual paste
                setPasteContent('');
                setPasteImage(null);
                setShowPasteModal(true);
            }
        }
    };

    const handlePasteSubmit = () => {
        if (pasteImage) {
            // Handle image paste - extract base64 data without the data URL prefix
            const base64Data = pasteImage.base64.split(',')[1];
            const virtualFile = {
                name: 'Pasted Image',
                type: 'image',
                content: base64Data,
                mimeType: pasteImage.type
            };
            setPendingFile(virtualFile);
            setShowPasteModal(false);
            setPasteImage(null);
            setShowModeModal(true);
        } else if (pasteContent.trim()) {
            // Handle text paste
            const virtualFile = {
                name: 'Pasted Content.txt',
                type: 'text',
                content: pasteContent.trim()
            };
            setPendingFile(virtualFile);
            setShowPasteModal(false);
            setPasteContent('');
            setShowModeModal(true);
        } else {
            setError('Please paste some content.');
        }
    };

    const handleModeSelect = async (mode) => {
        setShowModeModal(false);
        if (!pendingFile) return;

        const file = pendingFile;
        setPendingFile(null);
        setLoading(true);
        setError('');

        // Check if this is a virtual file (from paste) or a real file
        const isVirtualFile = file.content !== undefined;
        const fileName = file.name.toLowerCase();
        const isPdf = !isVirtualFile && fileName.endsWith('.pdf');

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                let content;
                let fileType;

                // Check for virtual file type first
                if (e.virtualFileType) {
                    content = e.target.result;
                    fileType = e.virtualFileType;
                } else if (isPdf) {
                    const base64 = e.target.result.split(',')[1];
                    content = base64;
                    fileType = 'pdf';
                } else {
                    content = e.target.result;
                    fileType = 'txt';
                }

                const { modelName, paperReadingModelName } = getApiSettings();
                const fallbackTitle = file.name.replace(/\.(txt|pdf)$/i, '');

                let mindMapData = null;
                let processFlowData = [];
                let paperNotesContent = null;
                let finalTitle = fallbackTitle;

                setProgress(10); // Started

                if (mode === 'mindmap' || mode === 'both') {
                    setLoadingMessage('Generating mind map...');
                }
                if (mode === 'paper' || mode === 'both') {
                    setLoadingMessage(mode === 'both' ? 'Generating mind map and paper notes...' : 'Generating paper notes...');
                }

                // Execute API calls based on mode
                if (mode === 'both') {
                    // Parallel calls
                    const [mindMapResult, paperResult] = await Promise.all([
                        generateMindMapFromText(content, fileType),
                        generatePaperReading(content, fileType)
                    ]);

                    setProgress(60); // Generation complete

                    mindMapData = Array.isArray(mindMapResult) ? mindMapResult : mindMapResult.mindMap;
                    processFlowData = Array.isArray(mindMapResult) ? [] : (mindMapResult.processFlow || []);
                    finalTitle = mindMapResult.title?.trim() || fallbackTitle;
                    paperNotesContent = paperResult;
                } else if (mode === 'mindmap') {
                    const generatedData = await generateMindMapFromText(content, fileType);
                    setProgress(90); // Mind map generation complete
                    mindMapData = Array.isArray(generatedData) ? generatedData : generatedData.mindMap;
                    processFlowData = Array.isArray(generatedData) ? [] : (generatedData.processFlow || []);
                    finalTitle = generatedData.title?.trim() || fallbackTitle;
                } else if (mode === 'paper') {
                    paperNotesContent = await generatePaperReading(content, fileType);
                    setProgress(60); // Paper notes generation complete
                }

                // Step 2: Repair formatting for paper notes
                if (paperNotesContent) {
                    setLoadingMessage('Refining formatting (this may take a minute)...');
                    setProgress(70);
                    paperNotesContent = await repairPaperNotes(paperNotesContent);
                    setProgress(95);
                }

                const newMap = {
                    title: finalTitle,
                    originalFilename: file.name,
                    data: mindMapData,
                    processSteps: processFlowData,
                    paperNotes: paperNotesContent,
                    mode: mode,
                    modelName: mode === 'paper' ? paperReadingModelName : modelName,
                    fileType: fileType
                };

                const savedMap = await saveMindMap(newMap);
                setProgress(100);
                const updatedMaps = await getMindMaps();
                setMaps(updatedMaps);
                navigate(`/map/${savedMap.id}`);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
                setLoadingMessage('');
                setProgress(0);
            }
        };

        // Handle virtual file (from paste) vs real file
        if (isVirtualFile) {
            // Determine file type for virtual files
            let virtualFileType = 'txt';
            if (file.type === 'image') {
                virtualFileType = 'image';
            }
            // For virtual files, directly trigger the onload logic with the content
            reader.onload({
                target: { result: file.content },
                virtualFileType: virtualFileType
            });
        } else if (isPdf) {
            reader.readAsDataURL(file);
        } else {
            reader.readAsText(file);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this?')) {
            await deleteMindMap(id);
            const updatedMaps = await getMindMaps();
            setMaps(updatedMaps);
        }
    };

    const filteredMaps = maps
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .filter(map =>
            map.title.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const getModeLabel = (map) => {
        if (map.mode === 'both') return 'Mind Map + Notes';
        if (map.mode === 'paper') return 'Paper Notes';
        return 'Mind Map';
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">text2mindmap</h1>
                        <p className="text-slate-500 mt-1">Generate mind maps and paper notes from documents</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {user && (
                            <span className="text-sm text-slate-500 hidden sm:block">
                                {user.email}
                            </span>
                        )}
                        <button
                            onClick={() => navigate('/settings')}
                            className="p-3 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all"
                            title="Settings"
                        >
                            <SettingsIcon size={24} />
                        </button>
                        <button
                            onClick={signOut}
                            className="p-3 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 transition-all"
                            title="Sign Out"
                        >
                            <LogOut size={24} />
                        </button>
                    </div>
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
                        placeholder="Search..."
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
                            <div className="text-center w-full max-w-xs">
                                <Loader className="animate-spin text-blue-600 mb-4 mx-auto" size={32} />
                                <p className="text-blue-800 font-medium mb-3">{loadingMessage || 'Generating...'}</p>
                                <div className="w-full bg-blue-100 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                <p className="text-blue-400 text-xs mt-2 font-mono">{progress}%</p>
                            </div>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <FileText className="text-blue-600" size={32} />
                                </div>
                                <p className="text-blue-900 font-bold text-lg">Upload Document</p>
                                <p className="text-blue-600/70 text-sm mt-1">PDF or TXT file</p>
                                <input
                                    id="file-upload"
                                    type="file"
                                    accept=".txt,.pdf"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                            </>
                        )}
                    </div>

                    {/* Paste from Clipboard Card */}
                    <div
                        onClick={() => !loading && handlePasteFromClipboard()}
                        className={`
                            relative group cursor-pointer border-2 border-dashed border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-400 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[240px] transition-all duration-300
                            ${loading ? 'opacity-75 pointer-events-none' : ''}
                        `}
                    >
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300">
                            <ClipboardPaste className="text-emerald-600" size={32} />
                        </div>
                        <p className="text-emerald-900 font-bold text-lg">Paste Content</p>
                        <p className="text-emerald-600/70 text-sm mt-1">From clipboard</p>
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
                                const IconComponent = map.mode === 'paper' ? BookOpen : (map.mode === 'both' ? GitBranch : FileText);

                                return (
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colorClass}`}>
                                        <IconComponent size={24} />
                                    </div>
                                );
                            })()}

                            <h3
                                className="font-bold text-slate-800 text-lg mb-1 line-clamp-1"
                                title={map.title}
                            >
                                {map.title}
                            </h3>
                            {map.originalFilename && (
                                <p className="text-slate-400 text-[10px] mb-2 truncate" title={map.originalFilename}>
                                    {map.originalFilename}
                                </p>
                            )}
                            <p className="text-slate-400 text-xs font-medium mb-3">
                                {new Date(map.createdAt).toLocaleString()}
                            </p>

                            <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] rounded-md font-medium">
                                    {getModeLabel(map)}
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

            {/* Mode Selection Modal */}
            {showModeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Choose Generation Mode</h2>
                            <button
                                onClick={() => {
                                    setShowModeModal(false);
                                    setPendingFile(null);
                                }}
                                className="p-2 hover:bg-slate-100 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <p className="text-slate-600 mb-6">
                            Select how you want to process: <strong>{pendingFile?.name}</strong>
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => handleModeSelect('mindmap')}
                                className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center gap-4 text-left"
                            >
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <GitBranch className="text-blue-600" size={24} />
                                </div>
                                <div>
                                    <div className="font-semibold text-slate-800">Mind Map Only</div>
                                    <div className="text-sm text-slate-500">Generate structured mind map</div>
                                </div>
                            </button>

                            <button
                                onClick={() => handleModeSelect('paper')}
                                className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all flex items-center gap-4 text-left"
                            >
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <BookOpen className="text-purple-600" size={24} />
                                </div>
                                <div>
                                    <div className="font-semibold text-slate-800">Paper Notes Only</div>
                                    <div className="text-sm text-slate-500">Generate detailed reading notes</div>
                                </div>
                            </button>

                            <button
                                onClick={() => handleModeSelect('both')}
                                className="w-full p-4 border-2 border-emerald-300 bg-emerald-50 rounded-xl hover:border-emerald-500 hover:bg-emerald-100 transition-all flex items-center gap-4 text-left"
                            >
                                <div className="w-12 h-12 bg-emerald-200 rounded-xl flex items-center justify-center">
                                    <div className="flex">
                                        <GitBranch className="text-emerald-700" size={16} />
                                        <BookOpen className="text-emerald-700 -ml-1" size={16} />
                                    </div>
                                </div>
                                <div>
                                    <div className="font-semibold text-emerald-800">Both (Recommended)</div>
                                    <div className="text-sm text-emerald-600">Generate mind map + paper notes</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Paste Content Modal */}
            {showPasteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">
                                {pasteImage ? 'Image from Clipboard' : 'Paste Your Content'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowPasteModal(false);
                                    setPasteContent('');
                                    setPasteImage(null);
                                }}
                                className="p-2 hover:bg-slate-100 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {pasteImage ? (
                            <>
                                <p className="text-slate-600 mb-4">
                                    Image detected from clipboard. This will be processed for summarization.
                                </p>
                                <div className="border-2 border-slate-200 rounded-xl p-4 bg-slate-50 max-h-80 overflow-auto">
                                    <img
                                        src={pasteImage.base64}
                                        alt="Pasted from clipboard"
                                        className="max-w-full h-auto rounded-lg mx-auto"
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-slate-600 mb-4">
                                    Paste the text content you want to summarize below:
                                </p>
                                <textarea
                                    value={pasteContent}
                                    onChange={(e) => setPasteContent(e.target.value)}
                                    placeholder="Paste your content here... (Ctrl+V / Cmd+V)"
                                    className="w-full h-64 p-4 border-2 border-slate-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none resize-none font-mono text-sm"
                                    autoFocus
                                />
                            </>
                        )}

                        <div className="flex justify-between items-center mt-4">
                            <span className="text-sm text-slate-500">
                                {pasteImage ? 'Image ready' : `${pasteContent.length} characters`}
                            </span>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowPasteModal(false);
                                        setPasteContent('');
                                        setPasteImage(null);
                                    }}
                                    className="px-6 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePasteSubmit}
                                    disabled={!pasteContent.trim() && !pasteImage}
                                    className="px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
