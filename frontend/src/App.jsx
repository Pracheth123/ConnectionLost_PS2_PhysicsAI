import React, { useState } from 'react';
import axios from 'axios';
import SimulationScene from './SimulationScene';
import 'katex/dist/katex.min.css'; // Import CSS for math
import Latex from 'react-latex-next'; // Import Math Component

// --- LIVE GRAPH ---
const LiveGraph = ({ data, color }) => {
    if (data.length < 2) return <div className="text-xs text-gray-500 text-center h-16 flex items-center justify-center">Waiting for data...</div>;
    
    const width = 200;
    const height = 50;
    const maxVal = Math.max(...data) + 1;
    const minVal = 0;
    
    // Scale points to SVG space
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - minVal) / (maxVal - minVal)) * height;
        return `${x},${y}`;
    }).join(" ");

    return (
        <div className="bg-black/50 p-2 rounded border border-gray-700">
             <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                <span>Speed vs Time</span>
                <span>Max: {maxVal.toFixed(1)}m/s</span>
             </div>
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
            </svg>
        </div>
    );
};

function App() {
  const [inputText, setInputText] = useState("A red ball starts at (0, 10, 0) and drops.");
  const [simulationData, setSimulationData] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sceneKey, setSceneKey] = useState(0); 
  const [energyMetrics, setEnergyMetrics] = useState({});
  const [activeTab, setActiveTab] = useState('student');
  const [showMathModal, setShowMathModal] = useState(false);

  // --- CONTROLS ---
  const [gravityMode, setGravityMode] = useState('EARTH');
  const [customGravity, setCustomGravity] = useState(9.8);
  const [restitution, setRestitution] = useState(0.8);
  const [friction, setFriction] = useState(0.1);
  const [showVectors, setShowVectors] = useState(true);
  const [showGhost, setShowGhost] = useState(true);

  const [graphData, setGraphData] = useState({}); 

  const handleGenerate = async () => {
    try {
      setIsPlaying(false);
      setEnergyMetrics({});
      setGraphData({});
      const res = await axios.post('http://127.0.0.1:8000/parse', { text: inputText });
      
      if (res.data.error) {
        alert("AI Error: " + res.data.error);
      } else {
        setSimulationData(res.data);
        if (res.data.gravity_mode) setGravityMode(res.data.gravity_mode);
        setSceneKey(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
      alert("Backend Error");
    }
  };

  const handleUpdate = (label, metrics) => {
    setEnergyMetrics(prev => ({ ...prev, [label]: metrics }));
    if (isPlaying) {
        setGraphData(prev => {
            const currentHistory = prev[label] || [];
            if (currentHistory.length > 50) currentHistory.shift();
            return { ...prev, [label]: [...currentHistory, metrics.speed] };
        });
    }
  };

  const updateObjectParam = (index, field, axis, value) => {
    if (!simulationData) return;
    const newObjects = [...simulationData.objects];
    newObjects[index][field][axis] = parseFloat(value);
    setSimulationData({ ...simulationData, objects: newObjects });
  };

  const toggleObjectFixed = (index) => {
    if (!simulationData) return;
    const newObjects = [...simulationData.objects];
    newObjects[index].fixed = !newObjects[index].fixed;
    setSimulationData({ ...simulationData, objects: newObjects });
  };

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-white font-sans overflow-hidden">
      
      {/* LEFT PANEL */}
      <div className="w-80 flex flex-col border-r border-gray-800 bg-gray-900 z-10 shadow-2xl">
        <div className="p-4 border-b border-gray-800">
            <h1 className="text-xl font-bold text-blue-400 italic">PhysLab Pro</h1>
            <p className="text-xs text-gray-500">Physics Engine v3.4</p>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
            <textarea 
              className="w-full p-3 bg-black border border-gray-700 rounded-lg text-sm mb-4 h-24 focus:border-blue-500 outline-none resize-none"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Describe scenario..."
            />
            
            <button onClick={handleGenerate} className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded font-bold mb-4 shadow-lg">
              GENERATE SIMULATION
            </button>

            <div className="flex gap-2 mb-4">
                <button onClick={() => setIsPlaying(!isPlaying)} className={`flex-1 py-2 rounded font-bold ${isPlaying ? 'bg-amber-600' : 'bg-green-600'}`}>
                  {isPlaying ? "PAUSE" : "PLAY"}
                </button>
                <button onClick={() => { setSceneKey(k => k+1); setGraphData({}); setIsPlaying(false); }} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded">
                  RESET
                </button>
            </div>

            {/* --- PHYSICS SETTINGS --- */}
            <div className="bg-gray-800 p-3 rounded mb-4 border border-gray-700 space-y-4">
                {/* Gravity */}
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Gravity Mode</label>
                    <select 
                        value={gravityMode} onChange={(e) => setGravityMode(e.target.value)}
                        className="w-full bg-black border border-gray-600 rounded px-2 py-1 text-sm"
                    >
                        <option value="EARTH">🌍 Earth</option>
                        <option value="SPACE">🚀 Space</option>
                        <option value="CUSTOM">⚙️ Custom</option>
                    </select>
                    {gravityMode === 'CUSTOM' && (
                         <input type="range" min="0" max="20" step="0.5" value={customGravity} onChange={(e) => setCustomGravity(parseFloat(e.target.value))} className="w-full h-1 mt-2 bg-blue-500 rounded appearance-none" />
                    )}
                </div>

                {/* Sliders */}
                <div>
                    <div className="flex justify-between text-[10px] uppercase text-gray-400 mb-1">
                        <span>Bounciness</span>
                        <span>{restitution}</span>
                    </div>
                    <input type="range" min="0" max="1.2" step="0.1" value={restitution} onChange={(e) => setRestitution(parseFloat(e.target.value))} className="w-full h-1 bg-green-500 rounded appearance-none" />
                </div>

                <div>
                    <div className="flex justify-between text-[10px] uppercase text-gray-400 mb-1">
                        <span>Friction</span>
                        <span>{friction}</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.05" value={friction} onChange={(e) => setFriction(parseFloat(e.target.value))} className="w-full h-1 bg-red-500 rounded appearance-none" />
                </div>

                {/* Toggles */}
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input type="checkbox" checked={showVectors} onChange={(e) => setShowVectors(e.target.checked)} className="accent-blue-500"/>
                        Vectors
                    </label>
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input type="checkbox" checked={showGhost} onChange={(e) => setShowGhost(e.target.checked)} className="accent-blue-500"/>
                        Prediction
                    </label>
                </div>
            </div>

            {/* OBJECT EDITOR */}
            {simulationData && simulationData.objects.map((obj, i) => (
                <div key={i} className="mb-4 bg-gray-800 p-3 rounded border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-sm" style={{color: obj.color}}>{obj.label}</span>
                        <label className="flex items-center gap-1 text-[10px] uppercase text-gray-400 cursor-pointer">
                            <input type="checkbox" checked={obj.fixed} onChange={() => toggleObjectFixed(i)} className="accent-red-500" />
                            Fixed
                        </label>
                    </div>
                    
                    <div className="mb-2">
                        <label className="text-[10px] uppercase text-gray-500 block mb-1">Position (X, Y, Z)</label>
                        <div className="flex gap-1">
                            {[0,1,2].map(axis => (
                                <input key={axis} type="number" className="w-full bg-black border border-gray-600 rounded px-1 text-xs py-1"
                                    value={obj.pos[axis]} onChange={(e) => updateObjectParam(i, 'pos', axis, e.target.value)} />
                            ))}
                        </div>
                    </div>

                    <div className="mb-2">
                        <label className="text-[10px] uppercase text-gray-500 block mb-1">Velocity (X, Y, Z)</label>
                        <div className="flex gap-1">
                            {[0,1,2].map(axis => (
                                <input key={axis} type="number" className="w-full bg-black border border-gray-600 rounded px-1 text-xs py-1"
                                    value={obj.vel[axis]} onChange={(e) => updateObjectParam(i, 'vel', axis, e.target.value)} />
                            ))}
                        </div>
                    </div>

                    <LiveGraph data={graphData[obj.label] || []} color={obj.color} />
                </div>
            ))}
        </div>
      </div>

      {/* CENTER: SCENE */}
      <div className="flex-1 relative bg-black">
        {simulationData ? (
           <SimulationScene 
             key={sceneKey}
             objects={simulationData.objects}
             isPlaying={isPlaying}
             gravityMode={gravityMode}
             customGravity={customGravity}
             restitution={restitution}
             friction={friction}
             showVectors={showVectors}
             showGhost={showGhost}
             onUpdateEnergy={handleUpdate}
           />
        ) : (
           <div className="h-full flex flex-col items-center justify-center text-gray-600">
              <div className="text-4xl mb-2 opacity-30">⚛️</div>
              <p>Ready to Simulate</p>
           </div>
        )}

        {/* METRICS PANEL */}
        {simulationData && (
            <div className="absolute top-4 right-4 bg-gray-900/90 p-4 rounded-xl border border-gray-700 w-64 backdrop-blur shadow-xl z-20">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 border-b border-gray-700 pb-2">Real-Time Stats</h3>
                {simulationData.objects.map(obj => {
                    const m = energyMetrics[obj.label]; 
                    if (!m) return null;
                    return (
                        <div key={obj.label} className="mb-3">
                             <div className="flex justify-between text-xs font-bold text-white mb-1">
                                <span>{obj.label}</span>
                                <span>{m.speed.toFixed(1)} m/s</span>
                            </div>
                            <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden flex">
                                <div style={{width: `${(m.KE / (m.total + 0.1)) * 100}%`}} className="h-full bg-blue-500" />
                                <div style={{width: `${(m.PE / (m.total + 0.1)) * 100}%`}} className="h-full bg-amber-500" />
                            </div>
                        </div>
                    );
                })}
            </div>
        )}

        {/* ANALYSIS PANEL (UPDATED FOR MATH RENDERING) */}
        {simulationData && simulationData.analysis && (
            <div className="absolute bottom-4 left-4 right-4 bg-gray-900/95 border border-gray-700 rounded-xl p-4 shadow-2xl backdrop-blur max-h-48 overflow-y-auto z-20">
                <div className="flex justify-between items-start mb-2 border-b border-gray-800 pb-2">
                    <div className="flex gap-2">
                        <button onClick={() => setActiveTab('student')} className={`px-3 py-1 rounded text-xs font-bold ${activeTab === 'student' ? 'bg-blue-600' : 'bg-gray-800'}`}>🎓 Student</button>
                        <button onClick={() => setActiveTab('researcher')} className={`px-3 py-1 rounded text-xs font-bold ${activeTab === 'researcher' ? 'bg-purple-600' : 'bg-gray-800'}`}>🔬 Researcher</button>
                    </div>
                    <button onClick={() => setShowMathModal(true)} className="px-3 py-1 rounded text-xs font-bold bg-green-600 hover:bg-green-500 flex items-center gap-1">
                        <span>🧮 Math Solver</span>
                    </button>
                </div>
                
                {/* RENDER MATH WITH LATEX COMPONENT */}
                <div className="text-sm text-gray-200 whitespace-pre-line">
                    <Latex>
                        {activeTab === 'student' ? simulationData.analysis.student_mode : simulationData.analysis.researcher_mode}
                    </Latex>
                </div>
            </div>
        )}
      </div>

      {/* MATH MODAL (UPDATED FOR MATH RENDERING) */}
      {showMathModal && simulationData?.analysis?.math_steps && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl max-w-lg w-full shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-green-400">Step-by-Step Solution</h2>
                    <button onClick={() => setShowMathModal(false)} className="text-gray-400 hover:text-white">✕</button>
                </div>
                <div className="space-y-3">
                    {simulationData.analysis.math_steps.map((step, i) => (
                        <div key={i} className="p-3 bg-black/50 rounded border-l-4 border-blue-500 text-sm font-mono">
                            <Latex>{step}</Latex>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

export default App;