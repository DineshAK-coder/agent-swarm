export interface AgentData {
  id: string;
  name: string;
  isListening: boolean;
  isAudioActive: boolean;
  isTalking?: boolean;
  isThinking?: boolean;
  color: string;
  role?: string;
  personality?: string;
  tone?: string;
  currentResponse?: string;
  onToggleListening: (id: string) => void;
  onToggleAudio: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onUpdateConfig: (id: string, field: 'role' | 'personality' | 'tone', value: string) => void;
}

export interface CouncilData {
  id: string;
  name: string;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}
