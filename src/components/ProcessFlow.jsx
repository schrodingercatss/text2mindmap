import React from 'react';

const ProcessFlow = ({ title, steps }) => {
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
                        <div className="font-bold text-slate-800 text-sm mb-1">{step.title}</div>
                        {step.desc && (
                            <div className="text-xs text-slate-500 leading-tight">{step.desc}</div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProcessFlow;
