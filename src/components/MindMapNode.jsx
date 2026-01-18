import React, { useState } from 'react';

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

// Editable text component - double click to edit, blur to save
const EditableText = ({ value, onSave, isEditing, className, as = 'span' }) => {
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
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        className={`${className} border-2 border-blue-400 rounded px-2 py-1 outline-none bg-white`}
        style={{ minWidth: '100px' }}
      />
    );
  }

  const Tag = as;
  return (
    <Tag
      className={`${className} ${isEditing ? 'cursor-pointer hover:bg-blue-100 hover:ring-2 hover:ring-blue-300 rounded px-1' : ''}`}
      onDoubleClick={handleDoubleClick}
      title={isEditing ? 'Double-click to edit' : ''}
    >
      {value}
    </Tag>
  );
};

const MindMapNode = ({ theme, title, items, isLast, isEditing, sectionIndex, onUpdateSection }) => {
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

  return (
    <div className="relative mb-12 last:mb-0">
      {/* Topic Badge */}
      <div className={`
        relative z-10 inline-block px-6 py-3 rounded-xl font-bold text-lg shadow-sm border
        ${styles.badge}
      `}>
        <EditableText
          value={title}
          onSave={handleTitleChange}
          isEditing={isEditing}
          className="font-bold"
        />
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
              p-5 rounded-xl text-base leading-relaxed transition-colors duration-200
              ${styles.content}
            `}>
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
                  {item.content && <div className="text-sm text-slate-600 mb-4">{item.content}</div>}

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
                            <li key={pIdx} className="text-xs text-slate-600 leading-relaxed">
                              <EditableText
                                value={point}
                                onSave={(val) => handlePointChange(index, idx, pIdx, val)}
                                isEditing={isEditing}
                                className="text-xs"
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Backward compatibility for simple objects or strings
                (() => {
                  const content = typeof item === 'string' ? item : item.content;
                  if (!content) return null;

                  if (content.includes(':')) {
                    const [label, ...rest] = content.split(':');
                    return (
                      <span>
                        <EditableText
                          value={`${label}:${rest.join(':')}`}
                          onSave={(val) => handleItemChange(index, val)}
                          isEditing={isEditing}
                          className=""
                        />
                      </span>
                    );
                  } else {
                    return (
                      <EditableText
                        value={content}
                        onSave={(val) => handleItemChange(index, val)}
                        isEditing={isEditing}
                        className=""
                      />
                    );
                  }
                })()
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MindMapNode;
