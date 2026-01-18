import React from 'react';

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

const MindMapNode = ({ theme, title, items, isLast }) => {
  const styles = themeStyles[theme] || themeStyles.blue;

  return (
    <div className="relative mb-12 last:mb-0">
      {/* Topic Badge */}
      <div className={`
        relative z-10 inline-block px-6 py-3 rounded-xl font-bold text-lg shadow-sm border
        ${styles.badge}
      `}>
        {title}
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
                  {item.title && <div className="font-bold text-slate-800 mb-2">{item.title}</div>}
                  {item.content && <div className="text-sm text-slate-600 mb-4">{item.content}</div>}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {item.subSections && item.subSections.map((sub, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-lg">
                        <div className="font-semibold text-slate-700 text-sm mb-2 border-l-2 border-slate-300 pl-2">
                          {sub.title}
                        </div>
                        <ul className="list-disc list-inside space-y-1">
                          {sub.points && sub.points.map((point, pIdx) => (
                            <li key={pIdx} className="text-xs text-slate-600 leading-relaxed">
                              {point}
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

                  return content.includes(':') ? (
                    <span>
                      <span className="font-bold mr-2 text-slate-900">{content.split(':')[0]}:</span>
                      {content.split(':').slice(1).join(':')}
                    </span>
                  ) : (
                    content
                  );
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
