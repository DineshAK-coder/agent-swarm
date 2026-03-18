/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Background, BackgroundVariant, ReactFlow, useNodesState, useEdgesState, addEdge, Connection, Edge, Node, useReactFlow, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Send, Search, Layers, ChevronRight, ChevronLeft, Mic, Lock, Globe, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCallback, useState, useRef, useMemo } from 'react';
import AgentNode from './components/AgentNode';
import { AgentData } from './types';

const nodeTypes = {
  agent: AgentNode,
};

const PASTEL_GRADIENTS = [
  'from-pink-400 to-pink-600',
  'from-blue-400 to-blue-600',
  'from-emerald-400 to-emerald-600',
  'from-amber-400 to-amber-600',
  'from-indigo-400 to-indigo-600',
];

const initialNodes: Node[] = [];

const initialEdges: Edge[] = [];

export default function App() {
  return (
    <ReactFlowProvider>
      <AgenticCanvas />
    </ReactFlowProvider>
  );
}

function AgenticCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentSubtitle, setCurrentSubtitle] = useState<{agentName: string, text: string} | null>(null);
  
  // Registration Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAgentConfig, setNewAgentConfig] = useState({ name: '', role: '', personality: '', tone: '' });
  
  // Toggles for new features
  const [isIsolated, setIsIsolated] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Execution Abort Signal
  const abortRef = useRef<boolean>(false);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const chatHistoryRef = useRef<string[]>([]);

  const { setCenter, fitView, screenToFlowPosition } = useReactFlow();

  // -------------------------
  // Handlers
  // -------------------------
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const toggleListening = useCallback((id: string) => {
    setNodes((nds) => nds.map((node) => node.id === id ? { ...node, data: { ...node.data, isListening: !(node.data as any).isListening } } : node));
  }, [setNodes]);

  const toggleAudio = useCallback((id: string) => {
    setNodes((nds) => nds.map((node) => node.id === id ? { ...node, data: { ...node.data, isAudioActive: !(node.data as any).isAudioActive } } : node));
  }, [setNodes]);

  const deleteAgent = useCallback((id: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  }, [setNodes, setEdges]);

  const renameAgent = useCallback((id: string, newName: string) => {
    setNodes((nds) => nds.map((node) => node.id === id ? { ...node, data: { ...node.data, name: newName } } : node));
  }, [setNodes]);

  const updateConfig = useCallback((id: string, field: 'role' | 'personality' | 'tone', value: string) => {
    setNodes((nds) => nds.map((node) => node.id === id ? { ...node, data: { ...node.data, [field]: value } } : node));
  }, [setNodes]);

  const openAddModal = () => {
    setNewAgentConfig({ name: `Agent ${String.fromCharCode(65 + (nodes.length % 26))}`, role: '', personality: '', tone: '' });
    setShowAddModal(true);
  };

  const confirmAddAgent = () => {
    const usedColors = nodes.map(n => (n.data as any).color);
    const availableColor = PASTEL_GRADIENTS.find(c => !usedColors.includes(c)) || PASTEL_GRADIENTS[Math.floor(Math.random() * PASTEL_GRADIENTS.length)];

    const id = `agent-${Date.now()}`;
    const screenCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const flowCenter = screenToFlowPosition(screenCenter);
    
    // Radially scatter around the center
    const angle = Math.random() * Math.PI * 2;
    const radius = 150 + Math.random() * 50;
    
    const newNode: Node = {
      id,
      type: 'agent',
      position: { 
        x: flowCenter.x - 128 + Math.cos(angle) * radius, 
        y: flowCenter.y - 100 + Math.sin(angle) * radius 
      },
      data: {
        id, 
        name: newAgentConfig.name || `Agent ${String.fromCharCode(65 + (nodes.length % 26))}`,
        role: newAgentConfig.role || "Conversationalist",
        personality: newAgentConfig.personality || "Neutral and helpful",
        tone: newAgentConfig.tone || "Friendly",
        isListening: true, isAudioActive: true, color: availableColor,
        onToggleListening: toggleListening, onToggleAudio: toggleAudio, onDelete: deleteAgent, onRename: renameAgent, onUpdateConfig: updateConfig,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setShowAddModal(false);
  };

  // -------------------------
  // Speech & Audio Systems
  // -------------------------
  const handleMicClick = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: any) => setInputValue(prev => prev + " " + event.results[0][0].transcript);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
  };

  const playAudio = async (text: string, voiceId = "en-US-marcus") => {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId })
      });
      const data = await res.json();
      
      if (!res.ok) {
        alert("Murf TTS Error: " + (data.error || "Failed to generate audio"));
        return;
      }

      const audioUrl = data.audioFile || data.audioUrl || data.url || data.file;
      
      if (audioUrl && !abortRef.current) {
        const audio = new Audio(audioUrl);
        activeAudioRef.current = audio;
        await new Promise(resolve => {
          audio.onended = resolve;
          audio.onerror = resolve;
          audio.play().catch(e => {
            console.error("Audio Playback Error:", e);
            resolve(e);
          });
        });
        activeAudioRef.current = null;
      } else if (!audioUrl) {
        alert("Audio URL missing from API response!");
        console.error("Murf API responded with:", data);
      }
    } catch (e: any) { 
      console.error("Murf AI Audio failed:", e); 
      alert("Murf System Error: " + e.message);
    }
  };

  const setNodeTalking = (id: string, isTalking: boolean) => {
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, isTalking } } : n));
  };

  const setNodeThinking = (id: string, isThinking: boolean) => {
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, isThinking } } : n));
  };

  const stopProcessing = () => {
    abortRef.current = true;
    setIsProcessing(false);
    setCurrentSubtitle(null);
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    // Turn off thinking/talking nodes globally
    setNodes(nds => nds.map(n => n.type === 'agent' ? { ...n, data: { ...n.data, isTalking: false, isThinking: false } } : n));
  };

  const handleInterject = () => {
    if (!inputValue.trim()) return;
    const prompt = inputValue.trim();
    setInputValue('');
    
    // Hard kill existing sequence
    abortRef.current = true;
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    setNodes(nds => nds.map(n => n.type === 'agent' ? { ...n, data: { ...n.data, isTalking: false, isThinking: false } } : n));
    
    // Spin up fresh sequence with interjection
    setTimeout(() => {
      sendMessage(prompt);
    }, 500);
  };

  // -------------------------
  // Agentic Council Turn-taking Engine (Global)
  // -------------------------
  const sendMessage = async (interjectedPrompt?: string) => {
    const targetPrompt = typeof interjectedPrompt === 'string' ? interjectedPrompt : inputValue;
    if (!targetPrompt.trim() || (isProcessing && !interjectedPrompt)) return;

    abortRef.current = false;
    setIsProcessing(true);
    setCurrentSubtitle(null);
    if (!interjectedPrompt) setInputValue('');

    chatHistoryRef.current.push(`User says: "${targetPrompt}"`);
    if (chatHistoryRef.current.length > 20) {
      // Keep memory bounded to avoid token overflow
      chatHistoryRef.current = chatHistoryRef.current.slice(-20);
    }

    // All active listening agents are automatically in the Global Council
    const listeningAgents = nodes.filter(n => (n.data as any).isListening && n.type === 'agent');

    if (listeningAgents.length === 0) {
      setIsProcessing(false);
      return;
    }

    // Phase 3: Sequential Turn-taking globally
    let hasMoreToSay = true;
    let turnCount = 0;
    const MAX_TURNS = 4; // Allow full iteration but prevent endless looping

    while (hasMoreToSay && turnCount < MAX_TURNS) {
      hasMoreToSay = false;

      for (const agent of listeningAgents) {
        if (abortRef.current) break;
        setNodeThinking(agent.id, true);
        
        try {
          const agentRole = (agent.data as any).role || 'Conversationalist';
          const agentPersonality = (agent.data as any).personality || 'Neutral';
          const agentTone = (agent.data as any).tone || 'Casual and friendly';

          const context = isIsolated 
            ? `You are ${(agent.data as any).name}. Role: ${agentRole}. Personality: ${agentPersonality}. Tone: ${agentTone}. The user says: "${targetPrompt}". Respond entirely in character, executing your role utilizing the requested tone. Keep it brief.`
            : `You are ${(agent.data as any).name}. Role: ${agentRole}. Personality: ${agentPersonality}. Tone: ${agentTone}. Transcript so far:\n${chatHistoryRef.current.join('\n')}\nAdd your unique response to the discussion. Respond entirely in character utilizing the requested tone and personality. Keep it brief.`;

          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: "llama-3.1-8b-instant",
              messages: [{ role: 'system', content: 'You are an agent with a deeply specific persona. You do NOT restrict yourself to typical AI formalities. Embrace the exact tone, personality, and role provided. Keep answers to 2-3 sentences.' }, { role: 'user', content: context }]
            })
          });

          const data = await res.json();
          setNodeThinking(agent.id, false);
          if (abortRef.current) break;

          if (!res.ok) {
            throw new Error(data.error || "Failed to generate content");
          }

          const textResponse = data.text?.trim() || "Hmm, I have nothing to add at this time.";

          setNodeTalking(agent.id, true);
          hasMoreToSay = true; // Trigger next round
          chatHistoryRef.current.push(`${(agent.data as any).name} says: "${textResponse}"`);
          
          setCurrentSubtitle({ agentName: (agent.data as any).name, text: textResponse });
          
          // Play Audio (halts execution until done)
          if ((agent.data as any).isAudioActive) {
             const voices = ["en-US-marcus", "en-US-natalie"];
             const agentName = (agent.data as any).name as string;
             const vId = voices[agentName.length % voices.length];
             await playAudio(textResponse, vId);
          } else {
             await new Promise(r => setTimeout(r, 2000)); // Read delay
          }
          setNodeTalking(agent.id, false);
          if (abortRef.current) break;

        } catch (err: any) {
          setNodeThinking(agent.id, false);
          console.error(`Error for agent ${(agent.data as any).name}:`, err);
          if (!abortRef.current) {
            alert(`Agent ${(agent.data as any).name} encountered an AI error: ${err.message || err}`);
          }
        }
      }
      turnCount++;
    }

    if (!abortRef.current) {
      setTimeout(() => {
        setCurrentSubtitle(null);
      }, 3000);
      setIsProcessing(false);
    }
  };

  // Inject handlers
  const nodesWithHandlers = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      onToggleListening: toggleListening,
      onToggleAudio: toggleAudio,
      onDelete: deleteAgent,
      onRename: renameAgent,
      onUpdateConfig: updateConfig,
    },
  }));

  const agents = useMemo(() => nodes.filter(n => n.type === 'agent'), [nodes]);

  return (
    <div className="w-screen h-screen bg-slate-50 overflow-hidden relative flex">
      {/* Sidebar */}
      <motion.aside initial={false} animate={{ width: isSidebarOpen ? 280 : 0 }} className="h-full bg-white border-r border-slate-200 shadow-xl z-[60] relative flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white"><Layers size={18} /></div>
            <h2 className="font-bold text-slate-800 tracking-tight">Swarm Explorer</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Active Canvas Mode */}
          <div>
            <div className="px-3 py-3 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center gap-3">
               <Globe className="text-indigo-600" size={18} />
               <div className="flex flex-col">
                 <span className="text-xs font-bold text-indigo-900 uppercase tracking-widest">Global Canvas</span>
                 <span className="text-[10px] text-indigo-500 font-medium">All agents are connected</span>
               </div>
            </div>
          </div>

          {/* Agents Section */}
          <div>
            <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-3 px-2">Active Agents</h3>
            <div className="space-y-1">
              {agents.map(agent => (
                <button key={agent.id} onClick={() => setCenter(agent.position.x + 64, agent.position.y + 64, { zoom: 1.2, duration: 800 })} className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 transition-all text-sm group">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${(agent.data as any).isListening ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className="font-medium">{(agent.data as any).name as string}</span>
                  </div>
                  <Search size={14} className="opacity-0 group-hover:opacity-100 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Sidebar Toggle */}
      <motion.button initial={false} animate={{ left: isSidebarOpen ? 280 : 0 }} onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="absolute top-1/2 -translate-y-1/2 w-6 h-12 bg-white border border-slate-200 rounded-r-xl shadow-md z-[70] flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">
        {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </motion.button>

      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodesWithHandlers}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          connectionMode="loose"
          fitView
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
        </ReactFlow>

        {/* Global Subtitles Array Overlay */}
        <AnimatePresence>
          {currentSubtitle && (
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute bottom-32 left-1/2 -translate-x-1/2 mb-4 w-[700px] max-w-[90vw] p-6 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-[100] text-center pointer-events-none"
            >
              <p className="font-extrabold text-amber-500 text-[10px] mb-2 uppercase tracking-[0.2em] drop-shadow-sm">{currentSubtitle.agentName}</p>
              <p className="text-white text-xl font-medium leading-relaxed drop-shadow-md">{currentSubtitle.text}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Input Overlay */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50">
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-200 p-2 flex flex-col gap-2">
            
            {/* Context Toolbars */}
            <div className="px-4 py-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full">Global Mode</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setIsIsolated(!isIsolated)} className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full transition-colors ${isIsolated ? 'bg-rose-100 text-rose-700' : 'text-slate-400 hover:bg-slate-100'}`} title="If isolated, agents only chat with you and don't debate each other">
                  <Lock size={12}/> Isolate Threads {isIsolated ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={handleMicClick} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isRecording ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                <Mic size={20} />
              </button>

              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={isProcessing ? "Agents are discussing..." : (isRecording ? "Listening..." : "Message the swarm...")}
                disabled={isProcessing}
                className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-slate-800 placeholder:text-slate-400"
              />
              {isProcessing && (
                <div className="flex gap-2">
                  <button
                    onClick={stopProcessing}
                    className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center hover:bg-rose-700 transition-colors shadow-[0_0_15px_rgba(225,29,72,0.4)]"
                    title="Stop Generation"
                  >
                    <div className="w-4 h-4 bg-white rounded-sm" />
                  </button>
                  <button
                    onClick={handleInterject}
                    disabled={!inputValue.trim()}
                    className="w-12 px-2 bg-amber-500 text-white rounded-2xl flex items-center justify-center hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                    title="Interject & Overwrite context"
                  >
                    <Send size={18} />
                  </button>
                </div>
              )}
              
              {!isProcessing && (
                <button
                  onClick={() => sendMessage()}
                  disabled={!inputValue.trim()}
                  className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Floating Action Button */}
        <div className={`fixed flex flex-col gap-4 z-[200] transition-all duration-500 ease-in-out ${nodes.length === 0 ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : 'bottom-8 right-8'}`}>
          <div className="relative group">
            <div className={`absolute bg-slate-900 border border-slate-700 text-white text-xs p-4 rounded-xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all shadow-2xl z-50 ${
                nodes.length === 0 
                  ? 'top-full mt-6 left-1/2 -translate-x-1/2 w-72 text-center origin-top' 
                  : 'right-full mr-4 top-1/2 -translate-y-1/2 w-64 origin-right'
              }`}>
              <b className="text-amber-400 block mb-2 uppercase tracking-wide">Swarm Platform</b>
              Create distinct AI agents to collaboratively research, debate, or solve complex requests automatically.
              {nodes.length === 0 && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 border-l border-t border-slate-700 rotate-45" />
              )}
            </div>
            <motion.button 
              layout
              whileHover={{ scale: 1.1 }} 
              whileTap={{ scale: 0.9 }} 
              onClick={openAddModal} 
              className={`bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-all ring-4 ring-white/20 shadow-[0_0_40px_rgba(79,70,229,0.4)] ${
                nodes.length === 0 ? 'w-24 h-24 rounded-[2rem]' : 'w-16 h-16 rounded-[1.5rem]'
              }`}
              title="Add Agent"
            >
              <Plus size={nodes.length === 0 ? 40 : 32} />
            </motion.button>
          </div>
        </div>

        {/* Add Agent Registration Modal */}
        <AnimatePresence>
          {showAddModal && (
            <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden relative"
              >
                <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-xl">Recruit Agent</h3>
                    <p className="text-indigo-200 text-sm">Define their persona and capabilities</p>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                    <X size={16} />
                  </button>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Display Name</label>
                    <input type="text" value={newAgentConfig.name} onChange={e => setNewAgentConfig({...newAgentConfig, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g. JARVIS" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Primary Role</label>
                    <input type="text" value={newAgentConfig.role} onChange={e => setNewAgentConfig({...newAgentConfig, role: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g. Lead Researcher, Software Engineer" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Personality</label>
                      <input type="text" value={newAgentConfig.personality} onChange={e => setNewAgentConfig({...newAgentConfig, personality: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g. Paranoid, Cheerful" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Vocal Tone</label>
                      <input type="text" value={newAgentConfig.tone} onChange={e => setNewAgentConfig({...newAgentConfig, tone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g. Casual friend, Sarcastic" />
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 mt-2">
                  <button onClick={confirmAddAgent} className="w-full bg-indigo-600 text-white font-bold rounded-xl py-4 shadow-lg hover:bg-indigo-700 transition-colors shadow-indigo-600/30">
                    Deploy to Swarm
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
