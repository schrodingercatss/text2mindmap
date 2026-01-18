import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { Download, Plus } from 'lucide-react';
import MindMapNode from './MindMapNode';
import ProcessFlow from './ProcessFlow';

const MindMapViewer = ({ data, processSteps, title, isEditing, onDataChange, onTitleChange, onProcessStepsChange }) => {
    const mindMapRef = useRef(null);

    const handleExport = async () => {
        if (mindMapRef.current) {
            const canvas = await html2canvas(mindMapRef.current, {
                backgroundColor: '#ffffff',
                scale: 2,
            });
            const link = document.createElement('a');
            link.download = `${title || 'mindmap'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    };

    const handleUpdateSection = (sectionIndex, updates) => {
        if (onDataChange) {
            const newData = [...data];
            newData[sectionIndex] = { ...newData[sectionIndex], ...updates };
            onDataChange(newData);
        }
    };

    const handleDeleteSection = (sectionIndex) => {
        if (onDataChange && window.confirm('确定要删除这个节点吗？')) {
            const newData = data.filter((_, i) => i !== sectionIndex);
            onDataChange(newData);
        }
    };

    const handleAddSection = () => {
        if (onDataChange) {
            const themes = ['orange', 'green', 'pink', 'cyan', 'blue'];
            const newSection = {
                theme: themes[Math.floor(Math.random() * themes.length)],
                title: '新节点',
                items: ['新内容']
            };
            onDataChange([...data, newSection]);
        }
    };

    const handleAddItem = (sectionIndex) => {
        if (onDataChange) {
            const newData = [...data];
            newData[sectionIndex] = {
                ...newData[sectionIndex],
                items: [...newData[sectionIndex].items, '新内容']
            };
            onDataChange(newData);
        }
    };

    const handleDeleteItem = (sectionIndex, itemIndex) => {
        if (onDataChange) {
            const newData = [...data];
            newData[sectionIndex] = {
                ...newData[sectionIndex],
                items: newData[sectionIndex].items.filter((_, i) => i !== itemIndex)
            };
            onDataChange(newData);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-end mb-6">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg shadow-emerald-200 transition-all"
                    >
                        <Download size={18} /> Export Image
                    </button>
                </div>

                <div
                    ref={mindMapRef}
                    className="bg-white p-12 rounded-3xl shadow-xl border border-slate-100 min-h-[800px]"
                >
                    {title && (
                        <h1
                            className={`text-4xl font-extrabold text-slate-900 text-center mb-16 tracking-tight ${isEditing ? 'cursor-pointer hover:bg-blue-100 hover:ring-2 hover:ring-blue-300 rounded px-2' : ''}`}
                            onDoubleClick={() => {
                                if (isEditing && onTitleChange) {
                                    const newTitle = prompt('编辑标题:', title);
                                    if (newTitle && newTitle.trim()) {
                                        onTitleChange(newTitle.trim());
                                    }
                                }
                            }}
                            title={isEditing ? '双击编辑标题' : ''}
                        >
                            {title}
                        </h1>
                    )}

                    <div className="relative pl-8">
                        {/* Main vertical line connecting everything */}
                        <div className="absolute left-[29px] top-8 bottom-8 w-0.5 bg-slate-200"></div>

                        {data.map((section, index) => (
                            <MindMapNode
                                key={index}
                                theme={section.theme}
                                title={section.title}
                                items={section.items}
                                isLast={index === data.length - 1}
                                isEditing={isEditing}
                                sectionIndex={index}
                                onUpdateSection={handleUpdateSection}
                                onDeleteSection={handleDeleteSection}
                                onAddItem={handleAddItem}
                                onDeleteItem={handleDeleteItem}
                            />
                        ))}

                        {/* Add Section Button */}
                        {isEditing && (
                            <div className="mt-8">
                                <button
                                    onClick={handleAddSection}
                                    className="flex items-center gap-2 px-6 py-3 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors font-medium"
                                >
                                    <Plus size={20} /> 添加新节点
                                </button>
                            </div>
                        )}
                    </div>

                    {processSteps && processSteps.length > 0 && (
                        <div className="mt-20 pt-10 border-t border-slate-100">
                            <ProcessFlow
                                title="Process Flow"
                                steps={processSteps}
                                isEditing={isEditing}
                                onStepsChange={onProcessStepsChange}
                            />
                        </div>
                    )}

                    {/* Add Process Flow if empty but in edit mode */}
                    {isEditing && (!processSteps || processSteps.length === 0) && (
                        <div className="mt-20 pt-10 border-t border-slate-100">
                            <ProcessFlow
                                title="Process Flow"
                                steps={[]}
                                isEditing={isEditing}
                                onStepsChange={onProcessStepsChange}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MindMapViewer;
