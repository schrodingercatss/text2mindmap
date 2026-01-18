import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

// Auto-resizing input for better editing experience
const AutoResizeInput = ({ value, onChange, onBlur, onKeyDown, className }) => {
    const inputRef = useRef(null);

    return (
        <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            autoFocus
            className={`${className} border-2 border-blue-400 rounded px-2 py-1 outline-none bg-white text-center`}
            style={{ minWidth: '80px', maxWidth: '150px' }}
        />
    );
};

// Editable text component
const EditableText = ({ value, onSave, isEditing, className }) => {
    const [editing, setEditing] = useState(false);
    const [text, setText] = useState(value);

    const handleDoubleClick = () => {
        if (!isEditing) return;
        setEditing(true);
        setText(value);
    };

    const handleBlur = () => {
        setEditing(false);
        if (text !== value) {
            onSave(text);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
        if (e.key === 'Escape') {
            setText(value);
            setEditing(false);
        }
    };

    if (editing) {
        return (
            <AutoResizeInput
                value={text}
                onChange={(e) => setText(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={className}
            />
        );
    }

    return (
        <span
            className={`${className} ${isEditing ? 'cursor-pointer hover:bg-blue-100 hover:ring-2 hover:ring-blue-300 rounded px-1' : ''}`}
            onDoubleClick={handleDoubleClick}
            title={isEditing ? '双击编辑' : ''}
        >
            {value}
        </span>
    );
};

const ProcessFlow = ({ title, steps, isEditing, onStepsChange }) => {
    const handleStepTitleChange = (index, newTitle) => {
        if (onStepsChange) {
            const newSteps = [...steps];
            newSteps[index] = { ...newSteps[index], title: newTitle };
            onStepsChange(newSteps);
        }
    };

    const handleStepDescChange = (index, newDesc) => {
        if (onStepsChange) {
            const newSteps = [...steps];
            newSteps[index] = { ...newSteps[index], desc: newDesc };
            onStepsChange(newSteps);
        }
    };

    const handleAddStep = () => {
        if (onStepsChange) {
            const colors = ['#87CEFA', '#FFB6C1', '#90EE90', '#DDA0DD', '#F0E68C'];
            const newStep = {
                title: '新步骤',
                desc: '描述',
                color: colors[Math.floor(Math.random() * colors.length)]
            };
            onStepsChange([...steps, newStep]);
        }
    };

    const handleDeleteStep = (index) => {
        if (onStepsChange) {
            const newSteps = steps.filter((_, i) => i !== index);
            onStepsChange(newSteps);
        }
    };

    return (
        <div>
            <h3 className="text-xl font-bold text-slate-800 mb-8">{title}</h3>
            <div className="relative flex justify-between items-start">
                {/* Horizontal dashed line */}
                <div className="absolute top-[7px] left-0 right-0 h-0.5 border-t-2 border-dashed border-slate-200 z-0"></div>

                {steps.map((step, index) => (
                    <div key={index} className="relative z-10 flex-1 px-2 text-center group">
                        <div
                            className="w-4 h-4 rounded-full border-2 border-white shadow-sm mx-auto mb-4 transition-transform group-hover:scale-125"
                            style={{ backgroundColor: step.color || '#87CEFA', boxShadow: `0 0 0 4px white, 0 0 0 5px ${step.color}20` }}
                        ></div>
                        <div className="font-bold text-slate-800 text-sm mb-1">
                            <EditableText
                                value={step.title}
                                onSave={(val) => handleStepTitleChange(index, val)}
                                isEditing={isEditing}
                                className="font-bold text-sm"
                            />
                        </div>
                        {step.desc && (
                            <div className="text-xs text-slate-500 leading-tight">
                                <EditableText
                                    value={step.desc}
                                    onSave={(val) => handleStepDescChange(index, val)}
                                    isEditing={isEditing}
                                    className="text-xs"
                                />
                            </div>
                        )}
                        {isEditing && (
                            <button
                                onClick={() => handleDeleteStep(index)}
                                className="mt-2 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                title="删除步骤"
                            >
                                <Trash2 size={12} />
                            </button>
                        )}
                    </div>
                ))}

                {/* Add Step Button */}
                {isEditing && (
                    <div className="relative z-10 flex-shrink-0 px-2 text-center">
                        <button
                            onClick={handleAddStep}
                            className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 border-2 border-dashed border-blue-300 flex items-center justify-center text-blue-500 transition-colors"
                            title="添加步骤"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProcessFlow;
