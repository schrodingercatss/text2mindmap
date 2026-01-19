import React, { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import html2canvas from 'html2canvas';
import { Download, BookOpen, Quote, Sparkles } from 'lucide-react';

const PaperReadingViewer = ({ title, content }) => {
    const contentRef = useRef(null);

    const handleExport = async () => {
        if (contentRef.current) {
            const canvas = await html2canvas(contentRef.current, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                logging: false,
            });
            const link = document.createElement('a');
            link.download = `${title || 'paper-notes'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    };

    // Custom components for ReactMarkdown to enhance styling
    const components = {
        h1: ({ node, ...props }) => (
            <h1 className="text-3xl font-extrabold text-slate-900 mt-10 mb-6 pb-4 border-b-2 border-slate-100 flex items-center gap-3" {...props}>
                <span className="w-2 h-8 bg-blue-600 rounded-full inline-block"></span>
                {props.children}
            </h1>
        ),
        h2: ({ node, ...props }) => (
            <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4 flex items-center gap-2" {...props}>
                <span className="text-blue-500 opacity-50">#</span>
                {props.children}
            </h2>
        ),
        h3: ({ node, ...props }) => (
            <h3 className="text-xl font-bold text-slate-700 mt-6 mb-3" {...props} />
        ),
        blockquote: ({ node, ...props }) => (
            <div className="my-6 p-6 bg-blue-50/50 border-l-4 border-blue-500 rounded-r-xl relative group">
                <Quote className="absolute top-4 left-4 text-blue-200 w-8 h-8 -z-10 opacity-50" />
                <div className="text-slate-700 italic relative z-10 pl-2" {...props} />
            </div>
        ),
        code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline ? (
                <div className="my-6 rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-[#1e1e1e]">
                    <div className="flex items-center gap-1.5 px-4 py-2 bg-[#2d2d2d] border-b border-[#3d3d3d]">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="ml-2 text-xs text-gray-400 font-mono">{match ? match[1] : 'code'}</span>
                    </div>
                    <div className="p-4 overflow-x-auto">
                        <code className={`${className} text-sm font-mono text-gray-200`} {...props}>
                            {children}
                        </code>
                    </div>
                </div>
            ) : (
                <code className="px-1.5 py-0.5 rounded-md bg-slate-100 text-blue-600 font-mono text-sm border border-slate-200" {...props}>
                    {children}
                </code>
            );
        },
        table: ({ node, ...props }) => (
            <div className="my-6 overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                <table className="min-w-full divide-y divide-slate-200" {...props} />
            </div>
        ),
        th: ({ node, ...props }) => (
            <th className="px-6 py-3 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider" {...props} />
        ),
        td: ({ node, ...props }) => (
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 border-t border-slate-100" {...props} />
        ),
        ul: ({ node, ...props }) => (
            <ul className="my-4 space-y-2 list-none pl-4" {...props} />
        ),
        li: ({ node, ...props }) => (
            <li className="relative pl-6 text-slate-700 leading-relaxed">
                <span className="absolute left-0 top-2.5 w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                {props.children}
            </li>
        ),
        p: ({ node, ...props }) => {
            // Check if the paragraph contains only an image
            const hasImage = node.children.length === 1 && node.children[0].tagName === 'img';
            if (hasImage) return <div className="my-8" {...props} />;

            // Check if paragraph contains a block math formula
            const hasBlockMath = node.children.some(child => child.type === 'element' && child.tagName === 'span' && child.properties?.className?.includes('katex-display'));

            return (
                <p className={`my-4 text-slate-700 leading-7 ${hasBlockMath ? 'overflow-x-auto py-2' : ''}`} {...props} />
            );
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-8">
            <div className="max-w-5xl mx-auto">
                {/* Toolbar */}
                <div className="flex justify-end mb-8 sticky top-4 z-20">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-white/80 backdrop-blur-sm hover:bg-white text-slate-700 px-5 py-2.5 rounded-full font-medium shadow-sm hover:shadow-md border border-slate-200 transition-all transform hover:-translate-y-0.5"
                    >
                        <Download size={18} className="text-blue-600" />
                        <span className="text-sm">Export Image</span>
                    </button>
                </div>

                {/* Main Paper Card */}
                <div
                    ref={contentRef}
                    className="bg-white p-12 md:p-16 rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-white relative overflow-hidden"
                >
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-bl-[100%] -z-0 opacity-50 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-50 to-teal-50 rounded-tr-[100%] -z-0 opacity-50 pointer-events-none"></div>

                    {/* Header Section */}
                    <div className="relative z-10 mb-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl mb-6 text-blue-600 shadow-inner">
                            <BookOpen size={32} />
                        </div>
                        {title && (
                            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                                {title}
                            </h1>
                        )}
                        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm font-medium uppercase tracking-widest">
                            <Sparkles size={14} className="text-yellow-500" />
                            <span>AI Analysis Report</span>
                            <Sparkles size={14} className="text-yellow-500" />
                        </div>
                    </div>

                    {/* Content Section */}
                    <article className="relative z-10 prose prose-slate prose-lg max-w-none">
                        <ReactMarkdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={components}
                        >
                            {content}
                        </ReactMarkdown>
                    </article>

                    {/* Footer */}
                    <div className="mt-16 pt-8 border-t border-slate-100 flex justify-between items-center text-slate-400 text-sm relative z-10">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            Generated by text2mindmap
                        </div>
                        <div className="font-mono opacity-50">
                            {new Date().toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaperReadingViewer;
