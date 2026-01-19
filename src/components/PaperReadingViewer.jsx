import React, { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import html2canvas from 'html2canvas';
import { Download } from 'lucide-react';

const PaperReadingViewer = ({ title, content }) => {
    const contentRef = useRef(null);

    const handleExport = async () => {
        if (contentRef.current) {
            const canvas = await html2canvas(contentRef.current, {
                backgroundColor: '#ffffff',
                scale: 2,
            });
            const link = document.createElement('a');
            link.download = `${title || 'paper-notes'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-end mb-6">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg shadow-emerald-200 transition-all"
                    >
                        <Download size={18} /> Export Image
                    </button>
                </div>

                <div
                    ref={contentRef}
                    className="bg-white p-12 rounded-3xl shadow-xl border border-slate-100"
                >
                    {title && (
                        <h1 className="text-3xl font-extrabold text-slate-900 mb-8 pb-4 border-b border-slate-200">
                            {title}
                        </h1>
                    )}

                    <article className="prose prose-slate prose-lg max-w-none
                        prose-headings:text-slate-800 prose-headings:font-bold
                        prose-h1:text-2xl prose-h1:mt-8 prose-h1:mb-4
                        prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3
                        prose-h3:text-lg prose-h3:mt-5 prose-h3:mb-2
                        prose-p:text-slate-700 prose-p:leading-relaxed
                        prose-strong:text-slate-900
                        prose-ul:my-4 prose-ol:my-4
                        prose-li:text-slate-700
                        prose-blockquote:border-l-4 prose-blockquote:border-blue-400 prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:text-slate-700 prose-blockquote:not-italic
                        prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
                        prose-pre:bg-slate-800 prose-pre:text-slate-100
                        prose-table:border-collapse prose-th:bg-slate-100 prose-th:border prose-th:border-slate-300 prose-th:px-3 prose-th:py-2 prose-td:border prose-td:border-slate-300 prose-td:px-3 prose-td:py-2
                        prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                        prose-hr:border-slate-200
                    ">
                        <ReactMarkdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                        >
                            {content}
                        </ReactMarkdown>
                    </article>
                </div>
            </div>
        </div>
    );
};

export default PaperReadingViewer;
