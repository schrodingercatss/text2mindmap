import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const themeStyles = {
  orange: {
    badge: 'bg-orange-50 text-orange-800 border-orange-100',
    line: 'border-orange-300',
    content: 'bg-orange-50/50 text-slate-700 hover:bg-orange-50',
  },
  green: {
    badge: 'bg-green-50 text-green-800 border-green-100',
    line: 'border-green-300',
    content: 'bg-green-50/50 text-slate-700 hover:bg-green-50',
  },
  pink: {
    badge: 'bg-pink-50 text-pink-800 border-pink-100',
    line: 'border-pink-300',
    content: 'bg-pink-50/50 text-slate-700 hover:bg-pink-50',
  },
  cyan: {
    badge: 'bg-cyan-50 text-cyan-800 border-cyan-100',
    line: 'border-cyan-300',
    content: 'bg-cyan-50/50 text-slate-700 hover:bg-cyan-50',
  },
  blue: {
    badge: 'bg-blue-50 text-blue-800 border-blue-100',
    line: 'border-blue-300',
    content: 'bg-blue-50/50 text-slate-700 hover:bg-blue-50',
  },
};

// Auto-resizing textarea for better editing experience
const AutoResizeTextarea = ({ value, onChange, onBlur, onKeyDown, className }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      autoFocus
      className={`${className} w-full border-2 border-blue-400 rounded-lg px-3 py-2 outline-none bg-white resize-none overflow-hidden`}
      rows={1}
    />
  );
};

// Editable text component - double click to edit, blur to save
const EditableText = ({ value, onSave, isEditing, className, multiline = false }) => {
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.target.blur();
    }
    if (e.key === 'Escape') {
      setText(value);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <AutoResizeTextarea
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
      className={`${className} ${isEditing ? 'cursor-pointer hover:bg-blue-100 hover:ring-2 hover:ring-blue-300 rounded px-1 inline-block' : ''}`}
      onDoubleClick={handleDoubleClick}
      title={isEditing ? '双击编辑' : ''}
    >
      {value}
    </span>
  );
};

const MindMapNode = ({ theme, title, items, isLast, isEditing, sectionIndex, onUpdateSection, onDeleteSection, onAddItem, onDeleteItem }) => {
  const styles = themeStyles[theme] || themeStyles.blue;

  const handleTitleChange = (newTitle) => {
    if (onUpdateSection) {
      onUpdateSection(sectionIndex, { title: newTitle });
    }
  };

  const handleItemChange = (itemIndex, newValue) => {
    if (onUpdateSection) {
      const newItems = [...items];
      if (typeof newItems[itemIndex] === 'string') {
        newItems[itemIndex] = newValue;
      } else if (newItems[itemIndex].content !== undefined) {
        newItems[itemIndex] = { ...newItems[itemIndex], content: newValue };
      }
      onUpdateSection(sectionIndex, { items: newItems });
    }
  };

  const handleRichCardTitleChange = (itemIndex, newTitle) => {
    if (onUpdateSection) {
      const newItems = [...items];
      newItems[itemIndex] = { ...newItems[itemIndex], title: newTitle };
      onUpdateSection(sectionIndex, { items: newItems });
    }
  };

  const handleRichCardContentChange = (itemIndex, newContent) => {
    if (onUpdateSection) {
      const newItems = [...items];
      newItems[itemIndex] = { ...newItems[itemIndex], content: newContent };
      onUpdateSection(sectionIndex, { items: newItems });
    }
  };

  const handleSubSectionTitleChange = (itemIndex, subIndex, newTitle) => {
    if (onUpdateSection) {
      const newItems = [...items];
      const newSubSections = [...newItems[itemIndex].subSections];
      newSubSections[subIndex] = { ...newSubSections[subIndex], title: newTitle };
      newItems[itemIndex] = { ...newItems[itemIndex], subSections: newSubSections };
      onUpdateSection(sectionIndex, { items: newItems });
    }
  };

  const handlePointChange = (itemIndex, subIndex, pointIndex, newValue) => {
    if (onUpdateSection) {
      const newItems = [...items];
      const newSubSections = [...newItems[itemIndex].subSections];
      const newPoints = [...newSubSections[subIndex].points];
      newPoints[pointIndex] = newValue;
      newSubSections[subIndex] = { ...newSubSections[subIndex], points: newPoints };
      newItems[itemIndex] = { ...newItems[itemIndex], subSections: newSubSections };
      onUpdateSection(sectionIndex, { items: newItems });
    }
  };

  const handleAddPoint = (itemIndex, subIndex) => {
    if (onUpdateSection) {
      const newItems = [...items];
      const newSubSections = [...newItems[itemIndex].subSections];
      const newPoints = [...newSubSections[subIndex].points, '新内容'];
      newSubSections[subIndex] = { ...newSubSections[subIndex], points: newPoints };
      newItems[itemIndex] = { ...newItems[itemIndex], subSections: newSubSections };
      onUpdateSection(sectionIndex, { items: newItems });
    }
  };

  const handleDeletePoint = (itemIndex, subIndex, pointIndex) => {
    if (onUpdateSection) {
      const newItems = [...items];
      const newSubSections = [...newItems[itemIndex].subSections];
      const newPoints = newSubSections[subIndex].points.filter((_, i) => i !== pointIndex);
      newSubSections[subIndex] = { ...newSubSections[subIndex], points: newPoints };
      newItems[itemIndex] = { ...newItems[itemIndex], subSections: newSubSections };
      onUpdateSection(sectionIndex, { items: newItems });
    }
  };

  return (
    <div className="relative mb-12 last:mb-0">
      {/* Topic Badge */}
      <div className={`
        relative z-10 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-lg shadow-sm border
        ${styles.badge}
      `}>
        <EditableText
          value={title}
          onSave={handleTitleChange}
          isEditing={isEditing}
          className="font-bold"
        />
        {isEditing && onDeleteSection && (
          <button
            onClick={() => onDeleteSection(sectionIndex)}
            className="p-1 text-red-500 hover:bg-red-100 rounded"
            title="删除节点"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Sub-nodes */}
      <div className="mt-6 flex flex-col gap-6">
        {items.map((item, index) => (
          <div key={index} className="relative pl-16">
            {/* Curved Connector */}
            <div className={`
              absolute left-6 top-[-24px] w-8 h-[calc(50%+30px)]
              border-l-2 border-b-2 rounded-bl-2xl
              ${styles.line}
              ${index === 0 ? 'top-[-36px] h-[calc(50%+42px)]' : ''}
            `}></div>

            {/* Content Card */}
            <div className={`
              p-5 rounded-xl text-base leading-relaxed transition-colors duration-200 relative
              ${styles.content}
            `}>
              {isEditing && onDeleteItem && (
                <button
                  onClick={() => onDeleteItem(sectionIndex, index)}
                  className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-100 rounded"
                  title="删除此项"
                >
                  <Trash2 size={14} />
                </button>
              )}

              {/* Handle Rich Card or Simple String */}
              {item.type === 'rich-card' ? (
                <div className="bg-white/80 p-4 rounded-lg border border-slate-100 shadow-sm">
                  {item.title && (
                    <div className="font-bold text-slate-800 mb-2">
                      <EditableText
                        value={item.title}
                        onSave={(val) => handleRichCardTitleChange(index, val)}
                        isEditing={isEditing}
                        className="font-bold"
                      />
                    </div>
                  )}
                  {item.content && (
                    <div className="text-sm text-slate-600 mb-4">
                      <EditableText
                        value={item.content}
                        onSave={(val) => handleRichCardContentChange(index, val)}
                        isEditing={isEditing}
                        className="text-sm"
                        multiline
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {item.subSections && item.subSections.map((sub, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-lg">
                        <div className="font-semibold text-slate-700 text-sm mb-2 border-l-2 border-slate-300 pl-2">
                          <EditableText
                            value={sub.title}
                            onSave={(val) => handleSubSectionTitleChange(index, idx, val)}
                            isEditing={isEditing}
                            className="font-semibold"
                          />
                        </div>
                        <ul className="list-disc list-inside space-y-1">
                          {sub.points && sub.points.map((point, pIdx) => (
                            <li key={pIdx} className="text-xs text-slate-600 leading-relaxed flex items-start gap-1">
                              <span className="flex-1">
                                <EditableText
                                  value={point}
                                  onSave={(val) => handlePointChange(index, idx, pIdx, val)}
                                  isEditing={isEditing}
                                  className="text-xs"
                                />
                              </span>
                              {isEditing && (
                                <button
                                  onClick={() => handleDeletePoint(index, idx, pIdx)}
                                  className="p-0.5 text-red-400 hover:text-red-600"
                                  title="删除"
                                >
                                  <Trash2 size={10} />
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                        {isEditing && (
                          <button
                            onClick={() => handleAddPoint(index, idx)}
                            className="mt-2 flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700"
                          >
                            <Plus size={12} /> 添加内容
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Backward compatibility for simple objects or strings
                (() => {
                  const content = typeof item === 'string' ? item : item.content;
                  if (!content) return null;

                  return (
                    <EditableText
                      value={content}
                      onSave={(val) => handleItemChange(index, val)}
                      isEditing={isEditing}
                      className="block w-full"
                      multiline
                    />
                  );
                })()
              )}
            </div>
          </div>
        ))}

        {/* Add Item Button */}
        {isEditing && onAddItem && (
          <div className="pl-16">
            <button
              onClick={() => onAddItem(sectionIndex)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Plus size={16} /> 添加内容项
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MindMapNode;
