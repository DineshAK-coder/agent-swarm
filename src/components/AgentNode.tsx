import { Handle, Position } from '@xyflow/react';
import { Mic, MicOff, Volume2, VolumeX, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AgentData } from '../types';

interface AgentNodeProps {
  data: AgentData & {
    onToggleListening: (id: string) => void;
    onToggleAudio: (id: string) => void;
    onDelete: (id: string) => void;
    onRename: (id: string, newName: string) => void;
    onUpdateConfig: (id: string, field: 'role' | 'personality' | 'tone', value: string) => void;
    role?: string;
    personality?: string;
    tone?: string;
  };
}

export default function AgentNode({ data }: AgentNodeProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="relative group"
    >
      {/* Delete Button (Top Right) */}
      <button
        onClick={() => data.onDelete(data.id)}
        className="absolute -top-2 -right-2 w-8 h-8 bg-white text-rose-500 rounded-full shadow-md border border-rose-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-rose-50 z-20"
        title="Delete Agent"
      >
        <Trash2 size={16} />
      </button>

      {/* Character Body */}
      <div className="relative flex flex-col items-center">
        <div 
          className={`w-32 h-32 rounded-[3.5rem] bg-gradient-to-br ${data.color} shadow-xl border-4 border-white/20 flex items-center justify-center relative overflow-hidden transition-all duration-300 ${
            data.isTalking ? 'ring-4 ring-indigo-400 ring-offset-4 animate-pulse' : 
            data.isThinking ? 'ring-4 ring-amber-400 ring-offset-4 animate-bounce' : ''
          }`}
          style={{ 
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.3)'
          }}
        >
          {/* Eyes */}
          <div className="flex gap-3 mt-[-10px]">
            <div className="w-4 h-8 bg-white rounded-full shadow-sm" />
            <div className="w-4 h-8 bg-white rounded-full shadow-sm" />
          </div>

          {/* Subtle Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
        </div>

        {/* Label & Controls */}
        <div className="mt-4 flex flex-col items-center gap-2">
          <div className="absolute top-[100%] mt-6 left-1/2 -translate-x-1/2 w-56 text-center pointer-events-auto flex flex-col gap-1">
            <input
              type="text"
              value={data.name || ''}
              onChange={(e) => data.onRename(data.id, e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-slate-700 text-center w-full focus:ring-2 focus:ring-indigo-500 rounded px-1 transition-all mb-1"
              placeholder="Agent Name"
            />
            <div className="flex bg-white/60 backdrop-blur-sm border border-slate-200 rounded-lg p-1 shadow-sm flex-col gap-1">
              <input
                type="text"
                value={data.role || ''}
                onChange={(e) => data.onUpdateConfig(data.id, 'role', e.target.value)}
                className="bg-transparent border-none outline-none font-medium text-slate-600 text-[10px] text-center w-full focus:bg-white rounded px-1"
                placeholder="Role (e.g. Analyst)"
                title="Agent Role"
              />
              <div className="h-px w-full bg-slate-200/50" />
              <input
                type="text"
                value={data.personality || ''}
                onChange={(e) => data.onUpdateConfig(data.id, 'personality', e.target.value)}
                className="bg-transparent border-none outline-none font-medium text-slate-500 text-[10px] text-center w-full focus:bg-white rounded px-1"
                placeholder="Personality (e.g. Paranoid)"
                title="Agent Personality"
              />
              <div className="h-px w-full bg-slate-200/50" />
              <input
                type="text"
                value={data.tone || ''}
                onChange={(e) => data.onUpdateConfig(data.id, 'tone', e.target.value)}
                className="bg-transparent border-none outline-none font-medium text-slate-500 text-[10px] text-center w-full focus:bg-white rounded px-1 italic"
                placeholder="Tone (e.g. Casual Friend)"
                title="Agent Tone"
              />
            </div>
          </div>
          
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {/* Listening Toggle */}
            <button
              onClick={() => data.onToggleListening(data.id)}
              className={`p-2 rounded-2xl transition-all duration-200 ${
                data.isListening 
                  ? 'bg-emerald-100 text-emerald-600' 
                  : 'bg-slate-100 text-slate-400'
              } hover:scale-110 active:scale-95 shadow-sm`}
              title={data.isListening ? "Stop Listening" : "Start Listening"}
            >
              {data.isListening ? <Mic size={18} /> : <MicOff size={18} />}
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => data.onToggleAudio(data.id)}
              className={`p-2 rounded-2xl transition-all duration-200 ${
                data.isAudioActive 
                  ? 'bg-indigo-100 text-indigo-600' 
                  : 'bg-slate-100 text-slate-400'
              } hover:scale-110 active:scale-95 shadow-sm`}
              title={data.isAudioActive ? "Mute Audio" : "Unmute Audio"}
            >
              {data.isAudioActive ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* React Flow Handles - Loose Mode handles can connect anywhere */}
      <Handle type="source" position={Position.Top} id="top" className="!bg-slate-400 hover:!bg-indigo-500 !w-3 !h-3 transition-colors" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-slate-400 hover:!bg-indigo-500 !w-3 !h-3 transition-colors" />
      <Handle type="source" position={Position.Left} id="left" className="!bg-slate-400 hover:!bg-indigo-500 !w-3 !h-3 transition-colors" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-slate-400 hover:!bg-indigo-500 !w-3 !h-3 transition-colors" />
    </motion.div>
  );
}
