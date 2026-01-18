import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { Download } from 'lucide-react';
import MindMapNode from './MindMapNode';
import ProcessFlow from './ProcessFlow';

const MindMapViewer = ({ data, processSteps, title }) => {
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
                        <h1 className="text-4xl font-extrabold text-slate-900 text-center mb-16 tracking-tight">
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
                            />
                        ))}
                    </div>

                    {processSteps && processSteps.length > 0 && (
                        <div className="mt-20 pt-10 border-t border-slate-100">
                            <ProcessFlow
                                title="Process Flow"
                                steps={processSteps}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MindMapViewer;
