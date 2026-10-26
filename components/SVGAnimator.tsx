import React, { useState, useRef, useMemo, useEffect, useLayoutEffect } from 'react';
import VideoGenerator from './VideoGenerator';
import ExternalTemplates from './ExternalTemplates';
import InternalTemplates from './InternalTemplates';
import { Upload, Play, Download, Code, FileVideo, Check, RefreshCw, X, Copy, Layers, Sliders, ChevronDown, ChevronRight, ChevronUp, RotateCcw, Zap, LayoutTemplate, Info, Trash2, Sparkles, FolderPlus, Folder, FolderOpen, MousePointer2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Effect, LayerConfig, Target } from '../types';
import logo from '../logo.png';

const ROOT_ID = 'motion-pro-root';

// --- 1. Define Animation Library ---
const EFFECTS: Effect[] = [
  {
    id: 'none',
    name: 'None',
    variations: []
  },
  {
    id: 'spin',
    name: 'Spin',
    baseDuration: 2,
    variations: [
      { id: 1, label: 'Clockwise', css: (name, d) => `animation: ${name} ${d}s linear infinite;`, keyframes: (name) => `@keyframes ${name} { to { transform: rotate(360deg); } }` },
      { id: 2, label: 'Counter-clockwise', css: (name, d) => `animation: ${name} ${d}s linear infinite;`, keyframes: (name) => `@keyframes ${name} { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }` },
    ]
  },
  {
    id: 'bounce',
    name: 'Bounce',
    baseDuration: 1,
    variations: [
      { 
        id: 8, 
        label: 'Elastic', 
        maxUp: 1.0, 
        css: (name, d) => `animation: ${name} ${d}s linear infinite;`, 
        keyframes: (name) => `@keyframes ${name} { 
          0% { transform: translateY(0) scale(1.05, 0.95); animation-timing-function: ease-out; }
          10% { transform: translateY(-15%) scale(0.98, 1.02); animation-timing-function: ease-out; }
          50% { transform: translateY(-100%) scale(1, 1); animation-timing-function: ease-in; }
          90% { transform: translateY(-15%) scale(0.98, 1.02); animation-timing-function: ease-in; }
          100% { transform: translateY(0) scale(1.05, 0.95); } 
        }` 
      },
      { 
        id: 5, 
        label: 'Elastic light', 
        maxUp: 0.3, 
        css: (name, d) => `animation: ${name} ${d}s linear infinite;`, 
        keyframes: (name) => `@keyframes ${name} { 
          0% { transform: translateY(0) scale(1.05, 0.95); animation-timing-function: ease-out; }
          10% { transform: translateY(-10%) scale(0.98, 1.02); animation-timing-function: ease-out; }
          50% { transform: translateY(-30%) scale(1, 1); animation-timing-function: ease-in; }
          90% { transform: translateY(-10%) scale(0.98, 1.02); animation-timing-function: ease-in; }
          100% { transform: translateY(0) scale(1.05, 0.95); } 
        }` 
      },
      { 
        id: 3, 
        label: 'Elastic Heavy', 
        maxUp: 1.6, 
        css: (name, d) => `animation: ${name} ${d}s linear infinite;`, 
        keyframes: (name) => `@keyframes ${name} { 
          0% { transform: translateY(0) scale(1.15, 0.85); animation-timing-function: ease-out; }
          10% { transform: translateY(-10%) scale(0.95, 1.05); animation-timing-function: ease-out; }
          50% { transform: translateY(-160%) scale(1, 1); animation-timing-function: ease-in; }
          90% { transform: translateY(-10%) scale(0.95, 1.05); animation-timing-function: ease-in; }
          100% { transform: translateY(0) scale(1.15, 0.85); } 
        }` 
      },
      { 
        id: 6, 
        label: 'Jump', 
        maxUp: 1.0,
        css: (name, d) => `animation: ${name} ${d}s linear infinite;`, 
        keyframes: (name) => `@keyframes ${name} { 
          0% { transform: translateY(0); animation-timing-function: ease-out; }
          10% { transform: translateY(-10%); animation-timing-function: ease-out; }
          50% { transform: translateY(-100%); animation-timing-function: ease-in; }
          90% { transform: translateY(-10%); animation-timing-function: ease-in; }
          100% { transform: translateY(0); } 
        }` 
      },
      { id: 1, label: 'Jump light', maxUp: 0.05, css: (name, d) => `animation: ${name} ${d}s ease-in-out infinite;`, keyframes: (name) => `@keyframes ${name} { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5%); } }` },
      { id: 2, label: 'Jump strong', maxUp: 0.25, css: (name, d) => `animation: ${name} ${d}s ease-in-out infinite;`, keyframes: (name) => `@keyframes ${name} { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-25%); } }` },
      { id: 4, label: 'Horizontal', maxUp: 0, css: (name, d) => `animation: ${name} ${d}s ease-in-out infinite;`, keyframes: (name) => `@keyframes ${name} { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(20%); } }` },
    ]
  },
  {
    id: 'pulse',
    name: 'Pulse',
    baseDuration: 1.5,
    variations: [
      { id: 1, label: 'Uniform', css: (name, d) => `animation: ${name} ${d}s linear infinite;`, keyframes: (name) => `@keyframes ${name} { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }` },
      { id: 2, label: 'Rhythmic', css: (name, d) => `animation: ${name} ${d}s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;`, keyframes: (name) => `@keyframes ${name} { 0% { transform: scale(1); } 14% { transform: scale(1.15); } 28% { transform: scale(1); } 42% { transform: scale(1.15); } 70% { transform: scale(1); } }` },
      { id: 3, label: 'Subtle', css: (name, d) => `animation: ${name} ${d}s ease-in-out infinite;`, keyframes: (name) => `@keyframes ${name} { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } }` },
      { id: 4, label: 'Large', css: (name, d) => `animation: ${name} ${d}s ease-in-out infinite;`, keyframes: (name) => `@keyframes ${name} { 0%, 100% { transform: scale(0.9); } 50% { transform: scale(1.15); } }` },
    ]
  },
  {
    id: 'swing',
    name: 'Swing',
    baseDuration: 2,
    variations: [
      { id: 1, label: 'Hinge', origin: 'top center', css: (name, d) => `animation: ${name} ${d}s ease-in-out infinite;`, keyframes: (name) => `@keyframes ${name} { 0%, 100% { transform: rotate(-10deg); } 50% { transform: rotate(10deg); } }` },
      { id: 2, label: 'Heavy', maxUp: 0.3, maxDown: 0.3, origin: 'top center', css: (name, d) => `animation: ${name} ${d}s ease-in-out infinite;`, keyframes: (name) => `@keyframes ${name} { 0%, 100% { transform: rotate(-25deg); } 50% { transform: rotate(25deg); } }` },
      { id: 3, label: 'Pendulum', origin: 'center', css: (name, d) => `animation: ${name} ${d}s ease-in-out infinite;`, keyframes: (name) => `@keyframes ${name} { 0%, 100% { transform: rotate(-15deg); } 50% { transform: rotate(15deg); } }` },
      { id: 4, label: 'Side Tilt', origin: 'bottom center', css: (name, d) => `animation: ${name} ${d}s ease-in-out infinite;`, keyframes: (name) => `@keyframes ${name} { 0%, 100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }` },
    ]
  },
  {
    id: 'shake',
    name: 'Shake',
    baseDuration: 0.5,
    variations: [
      { id: 1, label: 'Continuous', css: (name, d) => `animation: ${name} ${d * 0.2}s linear infinite;`, keyframes: (name) => `@keyframes ${name} { 0% { transform: translate(1px, 1px) rotate(0deg); } 50% { transform: translate(-1px, -1px) rotate(-1deg); } 100% { transform: translate(-1px, 1px) rotate(1deg); } }` },
      { id: 2, label: 'Intermittent', css: (name, d) => `animation: ${name} ${d * 4}s ease-in-out infinite;`, keyframes: (name) => `@keyframes ${name} { 0%, 80%, 100% { transform: translate(0,0); } 82% { transform: translate(-2px, 1px); } 84% { transform: translate(1px, -1px); } 86% { transform: translate(-1px, 2px); } 88% { transform: translate(2px, -2px); } }` },
      { id: 3, label: 'Mild', css: (name, d) => `animation: ${name} ${d}s ease-in-out infinite;`, keyframes: (name) => `@keyframes ${name} { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(2deg); } 75% { transform: rotate(-2deg); } }` },
      { id: 4, label: 'Wobble', css: (name, d) => `animation: ${name} ${d * 2}s ease-in-out infinite;`, keyframes: (name) => `@keyframes ${name} { 0%, 100% { transform: translateX(0%); } 15% { transform: translateX(-5%) rotate(-5deg); } 30% { transform: translateX(4%) rotate(3deg); } 45% { transform: translateX(-3%) rotate(-3deg); } 60% { transform: translateX(2%) rotate(2deg); } 75% { transform: translateX(-1%) rotate(-1deg); } }` },
    ]
  },
  {
    id: 'float',
    name: 'Float',
    baseDuration: 3,
    variations: [
      { id: 1, label: 'Vertical', maxUp: 0.15, maxDown: 0, css: (name, d) => `animation: ${name} ${d}s ease-in-out infinite;`, keyframes: (name) => `@keyframes ${name} { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15%); } }` },
      { id: 2, label: 'Horizontal', css: (name, d) => `animation: ${name} ${d}s ease-in-out infinite;`, keyframes: (name) => `@keyframes ${name} { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(15%); } }` },
      { id: 3, label: 'Diagonal', maxUp: 0.1, maxDown: 0, css: (name, d) => `animation: ${name} ${d}s ease-in-out infinite;`, keyframes: (name) => `@keyframes ${name} { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(10%, -10%); } }` },
      { id: 4, label: 'Figure 8', css: (name, d) => `animation: ${name} ${d}s linear infinite;`, keyframes: (name) => `@keyframes ${name} { 0% { transform: translate(0,0); } 25% { transform: translate(10%, 10%); } 50% { transform: translate(0, 20%); } 75% { transform: translate(-10%, 10%); } 100% { transform: translate(0,0); } }` },
      { id: 5, label: 'Zigzag', css: (name, d) => `animation: ${name} ${d}s linear infinite;`, keyframes: (name) => `@keyframes ${name} { 0%, 100% { transform: translate(0,0); } 25% { transform: translate(5%, -5%); } 50% { transform: translate(0, 0); } 75% { transform: translate(-5%, 5%); } }` },
    ]
  },
  {
    id: 'falling',
    name: 'Falling',
    baseDuration: 3,
    variations: [
      { 
        id: 5, 
        label: 'Confetti', 
        maxUp: 0.8, maxDown: 0.8, 
        targetChildren: true, 
        childPreset: 'confetti', 
        transformBox: 'view-box', 
        // 基础动画：线性循环
        css: (name, d) => `animation: ${name} ${d}s linear infinite;`,
        // 关键帧：S 型摇摆下落，微小旋转
        keyframes: (name) => `@keyframes ${name} { 
            0% { transform: translate(var(--tx, 0px), -300px) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            25% { transform: translate(calc(var(--tx, 0px) + var(--drift, 0px)), -150px) rotate(20deg); }
            50% { transform: translate(var(--tx, 0px), 0px) rotate(0deg); }
            75% { transform: translate(calc(var(--tx, 0px) - var(--drift, 0px)), 150px) rotate(-20deg); }
            100% { transform: translate(var(--tx, 0px), 300px) rotate(0deg); opacity: 1; } 
        }` 
      },
      { 
        id: 4, 
        label: 'Leaf', 
        maxUp: 0, maxDown: 0, 
        targetChildren: true, 
        childPreset: 'leaf',
        transformBox: 'view-box', 
        css: (name, d) => `animation: ${name} ${d}s ease-in-out infinite;`, 
        keyframes: (name) => `@keyframes ${name} { 
          0% { transform: translate(0, -50%) rotate(0deg); opacity: 0; }
          15% { opacity: 1; }
          25% { transform: translate(6%, -15%) rotate(10deg); }
          50% { transform: translate(-6%, 35%) rotate(-15deg); }
          75% { transform: translate(5%, 80%) rotate(10deg); }
          90% { opacity: 1; }
          100% { transform: translate(0, 120%) rotate(0deg); opacity: 0; } 
        }` 
      },
      { id: 1, label: 'Slow Vertical', maxUp: 0, maxDown: 0, css: (name, d) => `animation: ${name} ${d}s linear infinite;`, keyframes: (name) => `@keyframes ${name} { 0% { transform: translateY(-150%); } 100% { transform: translateY(150%); } }` },
      { id: 2, label: 'Fast Drop', maxUp: 0, maxDown: 0, css: (name, d) => `animation: ${name} ${d * 0.5}s ease-in infinite;`, keyframes: (name) => `@keyframes ${name} { 0% { transform: translateY(-150%); } 100% { transform: translateY(150%); } }` },
      { id: 3, label: 'Zigzag', maxUp: 0, maxDown: 0, css: (name, d) => `animation: ${name} ${d}s linear infinite;`, keyframes: (name) => `@keyframes ${name} { 0% { transform: translate(0, -150%); } 25% { transform: translate(20%, -75%); } 50% { transform: translate(0, 0); } 75% { transform: translate(-20%, 75%); } 100% { transform: translate(0, 150%); } }` },
    ]
  },
  {
    id: 'rising',
    name: 'Rising',
    baseDuration: 3,
    variations: [
      { id: 1, label: 'Slow Rise', maxUp: 0, maxDown: 0, css: (name, d) => `animation: ${name} ${d}s linear infinite;`, keyframes: (name) => `@keyframes ${name} { 0% { transform: translateY(150%); } 100% { transform: translateY(-150%); } }` },
      { id: 2, label: 'Fast Rise', maxUp: 0, maxDown: 0, css: (name, d) => `animation: ${name} ${d * 0.5}s ease-out infinite;`, keyframes: (name) => `@keyframes ${name} { 0% { transform: translateY(150%); } 100% { transform: translateY(-150%); } }` },
      { id: 3, label: 'Zigzag', maxUp: 0, maxDown: 0, css: (name, d) => `animation: ${name} ${d}s linear infinite;`, keyframes: (name) => `@keyframes ${name} { 0% { transform: translate(0, 150%); } 25% { transform: translate(-20%, 75%); } 50% { transform: translate(0, 0); } 75% { transform: translate(20%, -75%); } 100% { transform: translate(0, -150%); } }` },
      { 
        id: 4, 
        label: 'Fireworks', 
        targetChildren: true,
        childPreset: 'fireworks',
        maxUp: 0, maxDown: 0,
        transformBox: 'view-box', 
        css: (name, d) => `animation: ${name} ${d * 1.2}s ease-out infinite;`,
        keyframes: (name) => `@keyframes ${name} { 
            0% { transform: translate(0, 40%) scale(0.1); } 
            30% { transform: translate(0, -10%) scale(0.1); } 
            31% { transform: translate(0, -10%) scale(1); } /* Burst start */
            100% { transform: translate(var(--tx), var(--ty)) scale(1); } /* Drift */
        }`
      },
    ]
  }
];

// --- Helper Components ---

interface LayerTreeProps {
  nodes: Target[];
  selectedId: string;
  onSelect: (id: string) => void;
  layerConfigs: Record<string, LayerConfig>;
  depth?: number;
  onMoveLayer?: (dragId: string, targetId: string) => void;
  onUngroup?: (groupId: string) => void;
  rootId?: string;
}

const LayerTreeView: React.FC<LayerTreeProps> = ({ 
  nodes, 
  selectedId, 
  onSelect, 
  layerConfigs, 
  depth = 0,
  onMoveLayer,
  onUngroup,
  rootId
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, nodeId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', nodeId);
    setDraggedId(nodeId);
  };

  const handleDragOver = (e: React.DragEvent, nodeId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (nodeId !== draggedId) {
      setDragOverId(nodeId);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const dragId = e.dataTransfer.getData('text/plain');
    setDragOverId(null);
    setDraggedId(null);
    
    if (dragId && dragId !== targetId && onMoveLayer) {
      onMoveLayer(dragId, targetId);
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div className="flex flex-col w-full">
      {[...nodes].reverse().map(node => {
        const isGroup = node.children && node.children.length > 0;
        const isExpanded = expandedIds.has(node.id);
        const isSelected = selectedId === node.id;
        const hasConfig = !!layerConfigs[node.id];
        const isRoot = node.id === rootId || node.type === 'root';
        const isDragging = draggedId === node.id;
        const isDragOver = dragOverId === node.id;

        return (
          <div key={node.id} className="flex flex-col">
            <div 
              className={`flex items-center py-1.5 px-2 w-full cursor-pointer transition-all text-sm select-none border-l-[3px]
                ${isSelected 
                  ? 'border-indigo-500 bg-gradient-to-r from-indigo-500/20 to-transparent text-white font-medium' 
                  : 'border-transparent bg-transparent hover:bg-slate-800/50 text-slate-400'
                }
                ${isDragging ? 'opacity-50' : ''}
                ${isDragOver ? 'bg-indigo-500/40' : ''}
              `}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
              onClick={() => onSelect(node.id)}
              draggable={!isRoot}
              onDragStart={(e) => !isRoot && handleDragStart(e, node.id)}
              onDragOver={(e) => handleDragOver(e, node.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, node.id)}
              onDragEnd={handleDragEnd}
            >
              {/* Expander Chevron */}
              <div 
                className={`w-5 h-5 flex items-center justify-center mr-1 transition-colors cursor-pointer ${isGroup ? 'visible' : 'invisible'}`}
                onClick={(e) => isGroup && toggleExpand(e, node.id)}
              >
                {isGroup && (
                  <span className="text-slate-400">
                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </span>
                )}
              </div>

              {/* Icon based on type */}
              <div className={`mr-2 ${isSelected ? 'text-indigo-300' : 'text-slate-500'}`}>
                {isGroup ? (
                  isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />
                ) : (
                  <MousePointer2 size={14} />
                )}
              </div>

              {/* Name */}
              <span className="truncate flex-1">{node.name}</span>

              {/* Motion Tag */}
              {hasConfig && (
                 <span className="ml-auto text-[9px] font-bold uppercase tracking-wider bg-cyan-600 text-white px-1.5 py-0.5 rounded-sm">APPLIED</span>
              )}
            </div>

            {/* Recursive Children */}
            {isGroup && isExpanded && (
              <LayerTreeView 
                nodes={[...(node.children || [])].reverse()} 
                selectedId={selectedId} 
                onSelect={onSelect} 
                layerConfigs={layerConfigs}
                depth={depth + 1}
                onMoveLayer={onMoveLayer}
                onUngroup={onUngroup}
                rootId={rootId}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};


export default function SVGAnimator() {
  const [activeTab, setActiveTab] = useState('ai-generator');
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [targets, setTargets] = useState<Target[]>([]); 
  const [activeTargetId, setActiveTargetId] = useState(ROOT_ID); 
  const [layerConfigs, setLayerConfigs] = useState<Record<string, LayerConfig>>({}); 
  const [originalViewBox, setOriginalViewBox] = useState<number[] | null>(null);
  const [viewBoxUpdateTrigger, setViewBoxUpdateTrigger] = useState(0);
  
  const [isExporting, setIsExporting] = useState(false);
  const [isGrouping, setIsGrouping] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [previewBg, setPreviewBg] = useState('checker'); 
  const [generatedGifUrl, setGeneratedGifUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isTipsOpen, setIsTipsOpen] = useState(false);
  const [exportSize, setExportSize] = useState(512);
  const [svgGroupingState, setSvgGroupingState] = useState<'bitmap' | 'structured' | 'messy' | null>(null);
  const [showSelectionPreview, setShowSelectionPreview] = useState(true);
  const [selectionBBox, setSelectionBBox] = useState<DOMRect | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const highlightRef = useRef<SVGRectElement>(null);

  // Global animation bounds calculation - scan ALL active effects
  const animationBounds = useMemo(() => {
    let maxUpRatio = 0;
    let maxDownRatio = 0;
    let hasBounce = false;
    let hasSpin = false;
    let hasSwing = false;

    // Scan all layer configs globally
    Object.values(layerConfigs).forEach((conf: LayerConfig) => {
        const effect = EFFECTS.find(e => e.id === conf.effectId);
        if (!effect) return;

        // Check for bounce effect
        if (conf.effectId === 'bounce') {
          hasBounce = true;
        }

        // Check for spin effect
        if (conf.effectId === 'spin') {
          hasSpin = true;
        }

        // Check for swing effect
        if (conf.effectId === 'swing') {
          hasSwing = true;
        }

        // Calculate movement bounds
        // Exclude float, falling, rising from auto-scaling calculations
        if (['float', 'falling', 'rising'].includes(conf.effectId)) {
            return; 
        }

        const variation = effect.variations.find(v => v.id === conf.variation);
        if (variation) {
            const vUp = variation.maxUp !== undefined ? variation.maxUp : 0;
            const vDown = variation.maxDown !== undefined ? variation.maxDown : 0;
            if (vUp > maxUpRatio) maxUpRatio = vUp;
            if (vDown > maxDownRatio) maxDownRatio = vDown;
        }
    });
    
    // Default padding if no movement
    if (maxUpRatio === 0 && maxDownRatio === 0) {
        maxUpRatio = 0.1;
        maxDownRatio = 0.1;
    }

    return { maxUpRatio, maxDownRatio, hasBounce, hasSpin, hasSwing };
  }, [layerConfigs]);

  const hasHighMovement = animationBounds.hasBounce || animationBounds.hasSwing || animationBounds.maxUpRatio > 0.2 || animationBounds.maxDownRatio > 0.2;
  const isSpinning = animationBounds.hasSpin;

  // --- Helper Functions ---
  
  const getContainerStyle = (): React.CSSProperties => ({
      width: '100%', 
      height: '100%', 
      position: 'absolute', 
      top: 0, left: 0, 
      overflow: 'visible', 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transform: 'none' 
  });
  const layoutStyle = getContainerStyle();


  const calculateLCM = (numbers: number[]) => {
    if (numbers.length === 0) return 0;
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const lcm = (a: number, b: number): number => (a * b) / gcd(a, b);
    return numbers.reduce((acc, curr) => lcm(acc, curr), numbers[0]);
  };

  const copyToClipboard = () => {
    const textArea = document.createElement("textarea");
    textArea.value = generatedStyles;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try { 
      document.execCommand('copy');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) { console.error(err); }
    document.body.removeChild(textArea);
  };

  // --- CLUSTERING & PARSING LOGIC ---

  const performVisualClustering = (doc: Document, root: SVGSVGElement) => {
      // Create a sandbox to calculate BBoxes
      const sandbox = document.createElement('div');
      sandbox.style.position = 'absolute';
      sandbox.style.visibility = 'hidden';
      sandbox.style.pointerEvents = 'none';
      document.body.appendChild(sandbox);
      
      // Clone the SVG into sandbox
      const sandSvg = root.cloneNode(true) as SVGSVGElement;
      sandbox.appendChild(sandSvg);

      const sandShapes = Array.from(sandSvg.querySelectorAll('path, rect, circle, ellipse, polygon, polyline, line'));
      const originalShapes = Array.from(root.querySelectorAll('path, rect, circle, ellipse, polygon, polyline, line'));

      if (sandShapes.length !== originalShapes.length) {
          document.body.removeChild(sandbox);
          return; // Mismatch, abort clustering
      }

      // Helper: Calculate overlap ratio between two bounding boxes
      const calculateOverlapRatio = (b1: DOMRect, b2: DOMRect): number => {
          const overlapX = Math.max(0, Math.min(b1.x + b1.width, b2.x + b2.width) - Math.max(b1.x, b2.x));
          const overlapY = Math.max(0, Math.min(b1.y + b1.height, b2.y + b2.height) - Math.max(b1.y, b2.y));
          const overlapArea = overlapX * overlapY;
          
          const area1 = b1.width * b1.height;
          const area2 = b2.width * b2.height;
          const minArea = Math.min(area1, area2);
          
          if (minArea === 0) return 0;
          return overlapArea / minArea;
      };

      // Helper: Calculate area of a bounding box
      const getArea = (bbox: DOMRect): number => bbox.width * bbox.height;

      // Helper: Check if two shapes should be merged based on advanced rules
      const shouldMerge = (idx1: number, idx2: number, b1: DOMRect, b2: DOMRect, color1: string, color2: string): boolean => {
          // Rule 1: Same color and touching/close (distance < 15px)
          if (color1 === color2) {
              const THRESHOLD = 15;
              const horizontal = (b1.x + b1.width + THRESHOLD >= b2.x) && (b2.x + b2.width + THRESHOLD >= b1.x);
              const vertical = (b1.y + b1.height + THRESHOLD >= b2.y) && (b2.y + b2.height + THRESHOLD >= b1.y);
              if (horizontal && vertical) return true;
          }

          // Rule 2: Different colors but overlap ratio > 50%
          if (color1 !== color2) {
              const overlapRatio = calculateOverlapRatio(b1, b2);
              if (overlapRatio > 0.5) return true;
          }

          // Rule 3: Attachment adsorption - small object is 30% or less of large object, and overlap > 10%
          const area1 = getArea(b1);
          const area2 = getArea(b2);
          const sizeRatio = Math.min(area1, area2) / Math.max(area1, area2);
          
          if (sizeRatio <= 0.3) {
              const overlapRatio = calculateOverlapRatio(b1, b2);
              if (overlapRatio > 0.1) return true;
          }

          return false;
      };

      // 1. Collect all shapes with their colors and bboxes
      interface ShapeInfo {
          idx: number;
          color: string;
          bbox: DOMRect | null;
      }

      const shapeInfos: ShapeInfo[] = [];
      sandShapes.forEach((shape, idx) => {
          const style = window.getComputedStyle(shape);
          const fill = style.fill || 'none';
          const stroke = style.stroke || 'none';
          const colorKey = `${fill}-${stroke}`;
          
          let bbox: DOMRect | null = null;
          try {
              bbox = (shape as SVGGraphicsElement).getBBox();
          } catch(e) {
              // Skip if can't get bbox
          }
          
          shapeInfos.push({ idx, color: colorKey, bbox });
      });

      const clustersOfIndices: number[][] = [];
      const processedIndices = new Set<number>();

      // 2. Advanced Spatial Clustering (BFS with new rules)
      shapeInfos.forEach((startInfo) => {
          if (processedIndices.has(startInfo.idx) || !startInfo.bbox) return;
          
          const cluster: number[] = [];
          const queue: number[] = [startInfo.idx];
          processedIndices.add(startInfo.idx);
          
          while (queue.length > 0) {
              const currIdx = queue.shift()!;
              cluster.push(currIdx);
              
              const currInfo = shapeInfos[currIdx];
              if (!currInfo.bbox) continue;

              // Check all other shapes
              shapeInfos.forEach((otherInfo) => {
                  if (processedIndices.has(otherInfo.idx) || !otherInfo.bbox) return;
                  
                  // Apply merge rules
                  if (shouldMerge(currIdx, otherInfo.idx, currInfo.bbox, otherInfo.bbox, currInfo.color, otherInfo.color)) {
                      // Exclude edge-only tangency (minimal overlap)
                      const overlapRatio = calculateOverlapRatio(currInfo.bbox, otherInfo.bbox);
                      const minArea = Math.min(getArea(currInfo.bbox), getArea(otherInfo.bbox));
                      const overlapArea = overlapRatio * minArea;
                      
                      // If overlap is too small (edge tangency), skip
                      if (overlapArea < 1) return; // Less than 1 square pixel
                      
                      processedIndices.add(otherInfo.idx);
                      queue.push(otherInfo.idx);
                  }
              });
          }
          
          if (cluster.length > 0) clustersOfIndices.push(cluster);
      });

      document.body.removeChild(sandbox);

      // 3. Apply Clusters to Original DOM
      let groupCounter = 1;
      
      clustersOfIndices.forEach((indices) => {
          if (indices.length === 0) return;
          
          // Only group items with 2 or more elements
          if (indices.length < 2) return;

          const leader = originalShapes[indices[0]];
          if (!leader.parentNode) return;

          const groupName = `ColorGroup-${groupCounter++}`;
          
          const g = doc.createElementNS("http://www.w3.org/2000/svg", "g");
          g.id = groupName;
          
          // Insert group before the first element
          leader.parentNode.insertBefore(g, leader);
          
          indices.forEach(idx => {
              const el = originalShapes[idx];
              if (el && el.parentNode) {
                  g.appendChild(el);
              }
          });
      });
  };

  const parseSvgStructure = (doc: Document, root: SVGSVGElement, isImage: boolean): Target[] => {
      
      // Mode A: Raster
      if (isImage) {
          return [{ id: ROOT_ID, name: 'Whole Image', type: 'root', children: [] }];
      }

      // NOTE: Auto-clustering removed - user must click Smart Grouping button
      // Mode C detection is now handled by detectGroupingState and handleSmartGrouping

      // Mode B / General Parsing
      const buildTree = (node: Element, depth=0): Target | null => {
          // Strict ID preservation - only use existing ID, never modify
          const originalId = node.getAttribute('id');
          let id: string;
          if (originalId && originalId.trim() !== '') {
              // Use original ID exactly as-is, never modify
              id = originalId;
          } else {
              // Only generate if ID completely missing
              id = `layer-${Math.random().toString(36).substr(2,5)}`;
              node.setAttribute('id', id);
          }
          
          // Friendly Name - use original ID as name
          let name = id;
          if (depth === 0 && node === root) name = "Whole Image";

          // Collect children
          const childNodes = Array.from(node.children);
          const childrenTargets: Target[] = [];
          
          childNodes.forEach(child => {
             const tag = child.tagName.toLowerCase();
             if (['defs', 'style', 'metadata', 'title'].includes(tag)) return;
             
             const isGroup = tag === 'g';
             const isShape = ['path', 'rect', 'circle', 'ellipse', 'line', 'text', 'image', 'polygon', 'polyline'].includes(tag);
             
             if (isGroup) {
                 const res = buildTree(child, depth + 1);
                 if (res) childrenTargets.push(res);
             } else if (isShape) {
                 // Leaf - strict ID preservation
                 const originalShapeId = child.getAttribute('id');
                 let shapeId: string;
                 if (originalShapeId && originalShapeId.trim() !== '') {
                     // Use original ID exactly as-is, never modify
                     shapeId = originalShapeId;
                 } else {
                     // Only generate if ID completely missing
                     shapeId = `${tag}-${Math.random().toString(36).substr(2,4)}`;
                     child.setAttribute('id', shapeId);
                 }
                 childrenTargets.push({ id: shapeId, name: shapeId, type: 'shape' });
             }
          });

          // Prune empty non-root groups? Maybe not, user might want to target them.
          if (childrenTargets.length === 0 && node !== root && node.tagName !== 'g') return null;
          
          return {
              id,
              name,
              type: node === root ? 'root' : 'group',
              children: childrenTargets
          };
      };

      // SPECIAL HANDLING FOR STRUCTURED ROOT (Mode B refined)
      // If the SVG root has exactly one group child that contains everything (common in exports),
      // we want that group to be the visual root in the tree.
      
      const directChildren = Array.from(root.children).filter(c => 
        ['g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polygon', 'polyline', 'image'].includes(c.tagName.toLowerCase())
      );

      if (directChildren.length === 1 && directChildren[0].tagName.toLowerCase() === 'g') {
          const singleGroup = directChildren[0];
          const tree = buildTree(singleGroup, 0);
          if (tree) {
              tree.name = `${tree.name} (Whole Image)`;
              return [tree]; // Return as top-level item
          }
      }
      
      // Default: Check for ROOT_ID wrapper
      const wrapper = root.querySelector(`#${ROOT_ID}`);
      if (wrapper) {
          // Enhanced Smart Unwrap: Get direct children (only Element nodes, filter text/comment)
          const wrapperChildren = Array.from(wrapper.children).filter(c => {
            if (c.nodeType !== Node.ELEMENT_NODE) return false;
            const tag = c.tagName.toLowerCase();
            return ['g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polygon', 'polyline', 'image'].includes(tag);
          });
          
          // If wrapper has exactly 1 group child, unwrap it
          if (wrapperChildren.length === 1 && wrapperChildren[0].tagName.toLowerCase() === 'g') {
               const inner = wrapperChildren[0] as Element;
               const tree = buildTree(inner, 0);
               if (tree) {
                   // Use the inner group's ID as the root name
                   const innerId = inner.getAttribute('id');
                   if (innerId && innerId.trim() !== '') {
                     tree.id = innerId; // Preserve original ID
                     tree.name = `${innerId} (Whole Image)`;
                   } else {
                     tree.name = `${tree.id} (Whole Image)`;
                   }
                   tree.type = 'root'; // Mark as root for display
                   return [tree];
               }
          }
          
          // Mode C / Standard
          const tree = buildTree(wrapper, 0);
          if (tree) {
              tree.name = "Whole Image"; // Override the wrapper name
              return [tree]; 
          }
      }

      return [];
  };

  // Detect SVG grouping state for Smart Grouping button
  const detectGroupingState = (svg: SVGSVGElement) => {
    const rootGroup = svg.querySelector(`#${ROOT_ID}`);
    if (!rootGroup) {
      setSvgGroupingState(null);
      return;
    }

    // Get direct children of root group (excluding auto-generated wrapper)
    const directChildren = Array.from(rootGroup.children).filter(c => {
      const tag = c.tagName.toLowerCase();
      return ['g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polygon', 'polyline', 'image'].includes(tag);
    });

    // Count groups and shapes
    const userGroups = directChildren.filter(c => c.tagName.toLowerCase() === 'g' && c.id !== ROOT_ID);
    const shapes = directChildren.filter(c => ['path', 'rect', 'circle', 'ellipse', 'line', 'polygon', 'polyline'].includes(c.tagName.toLowerCase()));

    // Determine state
    if (userGroups.length > 0) {
      // Has user-defined groups -> Structured
      setSvgGroupingState('structured');
    } else if (shapes.length > 0) {
      // Only raw shapes -> Messy
      setSvgGroupingState('messy');
    } else {
      setSvgGroupingState(null);
    }
  };

  const ingestSVG = (content: string, isImage: boolean = false) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'image/svg+xml');
    const svg = doc.querySelector('svg');
    
    if (!svg) { alert("Invalid SVG file"); return; }

    const originalWidth = svg.getAttribute('width') || "300";
    const originalHeight = svg.getAttribute('height') || "300";

    let vb = svg.getAttribute('viewBox');
    if (!vb) {
        let w = parseFloat(originalWidth);
        let h = parseFloat(originalHeight);
        if (isNaN(w)) w = 300;
        if (isNaN(h)) h = 300;
        vb = `0 0 ${w} ${h}`;
        svg.setAttribute('viewBox', vb);
    }
    
    const parts = vb.split(/[\s,]+/).filter(v => v !== '').map(parseFloat);
    if (parts.length === 4) setOriginalViewBox(parts);
    if (!svg.hasAttribute('preserveAspectRatio')) svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.overflow = 'visible';

    // --- UNIFIED GROUP STRATEGY ---
    let rootGroup = svg.querySelector(`#${ROOT_ID}`);
    
    if (!rootGroup) {
        rootGroup = doc.createElementNS("http://www.w3.org/2000/svg", "g");
        rootGroup.setAttribute("id", ROOT_ID);
        while (svg.firstChild) {
            rootGroup.appendChild(svg.firstChild);
        }
        svg.appendChild(rootGroup);
    }

    // Detect grouping state (before clustering)
    if (!isImage) {
      detectGroupingState(svg);
    } else {
      setSvgGroupingState('bitmap');
    }

    // Generate Tree Targets (Clustering happens inside here if needed)
    // NOTE: We don't auto-cluster anymore - user must click Smart Grouping button
    const newTargets = parseSvgStructure(doc, svg, isImage);

    // Serialize back
    const serializer = new XMLSerializer();
    setSvgContent(serializer.serializeToString(svg));
    setTargets(newTargets);
    
    // Set active to the first node's ID
    if (newTargets.length > 0) {
        setActiveTargetId(newTargets[0].id);
    }
    setLayerConfigs({});
  };

  // Helper: Find a target node by ID in the tree
  const findTargetNode = (nodes: Target[], id: string): Target | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findTargetNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper: Remove a target node from the tree
  const removeTargetNode = (nodes: Target[], id: string): Target[] => {
    return nodes.filter(node => {
      if (node.id === id) return false;
      if (node.children) {
        node.children = removeTargetNode(node.children, id);
      }
      return true;
    });
  };

  // Helper: Add a target node to a parent
  const addTargetToParent = (nodes: Target[], parentId: string, newChild: Target): Target[] => {
    return nodes.map(node => {
      if (node.id === parentId) {
        return {
          ...node,
          children: [...(node.children || []), newChild]
        };
      }
      if (node.children) {
        return {
          ...node,
          children: addTargetToParent(node.children, parentId, newChild)
        };
      }
      return node;
    });
  };

  // Helper: Move a target node to a new parent
  const moveTargetInTree = (nodes: Target[], dragId: string, targetId: string): Target[] => {
    // Find the node to move
    const nodeToMove = findTargetNode(nodes, dragId);
    if (!nodeToMove) return nodes;

    // Remove from old location
    let newNodes = removeTargetNode(nodes, dragId);

    // If targetId is ROOT_ID, add to root level
    if (targetId === ROOT_ID) {
      // Find root node and add as child
      newNodes = newNodes.map(node => {
        if (node.id === ROOT_ID || node.type === 'root') {
          return {
            ...node,
            children: [...(node.children || []), nodeToMove]
          };
        }
        return node;
      });
    } else {
      // Add to target parent
      newNodes = addTargetToParent(newNodes, targetId, nodeToMove);
    }

    return newNodes;
  };

  // Helper: Check if element is a group
  const isGroupElement = (element: Element | null): boolean => {
    return element !== null && element.tagName.toLowerCase() === 'g';
  };

  // Helper: Check if element is a shape (path, rect, etc.)
  const isShapeElement = (element: Element | null): boolean => {
    if (!element) return false;
    const tag = element.tagName.toLowerCase();
    return ['path', 'rect', 'circle', 'ellipse', 'line', 'polygon', 'polyline', 'text', 'image'].includes(tag);
  };

  // Helper: Find target node in tree to check type
  const findTargetNodeInTree = (nodes: Target[], id: string): Target | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findTargetNodeInTree(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const handleMoveLayer = (dragId: string, targetId: string) => {
    if (!svgContent || dragId === targetId) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svg = doc.querySelector('svg');
    if (!svg) return;

    // Find the element to move
    const dragElement = svg.querySelector(`#${dragId}`);
    if (!dragElement) return;

    const targetElement = svg.querySelector(`#${targetId}`);
    if (!targetElement) return;

    const rootGroup = svg.querySelector(`#${ROOT_ID}`) || svg;
    const targetNode = findTargetNodeInTree(targets, targetId);
    const targetIsGroup = isGroupElement(targetElement);

      // Check if target is a child of a group (for drop-into-group detection)
      let targetGroup: Element | null = null;
      if (targetIsGroup) {
        targetGroup = targetElement;
      } else {
        // If target is a child, find its parent group
        let parent: Element | null = targetElement.parentElement;
        while (parent && parent !== rootGroup && parent !== svg) {
          if (parent.tagName.toLowerCase() === 'g' && parent.id && parent.id !== ROOT_ID) {
            targetGroup = parent;
            break;
          }
          parent = parent.parentElement;
        }
      }

    // If we found a group to drop into, move into that group
    if (targetGroup && dragElement.parentNode !== targetGroup) {
      // Move to the end of the group (which appears at top in reversed UI)
      targetGroup.appendChild(dragElement);
    } else if (targetId === ROOT_ID) {
      // Moving to root - append to end (appears at top in reversed UI)
      if (dragElement.parentNode && dragElement.parentNode !== rootGroup) {
        rootGroup.appendChild(dragElement);
      }
    } else {
      // Same-level reordering: UI is reversed, so visual "above" = DOM "after"
      const targetParent = targetElement.parentNode;
      if (targetParent && dragElement.parentNode === targetParent) {
        // Same parent - reorder
        // In reversed UI: dragging A above B means A should be after B in DOM
        targetParent.insertBefore(dragElement, targetElement.nextSibling);
      } else if (targetParent) {
        // Different parent - reparent and place after target (appears above in UI)
        targetParent.insertBefore(dragElement, targetElement.nextSibling);
      }
    }

    // Serialize and update
    const serializer = new XMLSerializer();
    const newSvgContent = serializer.serializeToString(svg);
    setSvgContent(newSvgContent);

    // Update targets tree
    const newTargets = parseSvgStructure(doc, svg, false);
    setTargets(newTargets);

    // Update grouping state
    detectGroupingState(svg);
  };

  const handleUngroup = (groupId: string) => {
    if (!svgContent) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svg = doc.querySelector('svg');
    if (!svg) return;

    // Find the group to ungroup
    const groupElement = svg.querySelector(`#${groupId}`) as SVGGElement;
    if (!groupElement || groupElement.tagName.toLowerCase() !== 'g') return;

    const parent = groupElement.parentNode;
    if (!parent) return;

    // Move all children to parent
    const children = Array.from(groupElement.children);
    children.forEach(child => {
      parent.insertBefore(child, groupElement);
    });

    // Remove the empty group
    parent.removeChild(groupElement);

    // Serialize and update
    const serializer = new XMLSerializer();
    const newSvgContent = serializer.serializeToString(svg);
    setSvgContent(newSvgContent);

    // Update targets tree
    const newTargets = parseSvgStructure(doc, svg, false);
    setTargets(newTargets);

    // Clear config for the ungrouped group
    setLayerConfigs(prev => {
      const next = { ...prev };
      delete next[groupId];
      return next;
    });

    // Update grouping state after ungroup
    detectGroupingState(svg);
  };

  const handleCreateGroup = () => {
    if (!svgContent) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svg = doc.querySelector('svg');
    if (!svg) return;

    const rootGroup = svg.querySelector(`#${ROOT_ID}`) || svg;
    
    // Generate unique group ID
    let groupCounter = 1;
    let newGroupId = `Group-${groupCounter}`;
    while (svg.querySelector(`#${newGroupId}`)) {
      groupCounter++;
      newGroupId = `Group-${groupCounter}`;
    }

    // Create new empty group
    const newGroup = doc.createElementNS("http://www.w3.org/2000/svg", "g");
    newGroup.id = newGroupId;

    // Always append to root group at the end (DOM last = UI top in reversed view)
    // This creates an empty group that appears at the top of the UI list
    rootGroup.appendChild(newGroup);

    // Serialize and update
    const serializer = new XMLSerializer();
    const newSvgContent = serializer.serializeToString(svg);
    setSvgContent(newSvgContent);

    // Update targets tree
    const newTargets = parseSvgStructure(doc, svg, false);
    setTargets(newTargets);

    // Select the new group
    setActiveTargetId(newGroupId);

    // Update grouping state
    detectGroupingState(svg);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGeneratedGifUrl(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    const isSvg = file.type === 'image/svg+xml' || extension === 'svg';
    const isImage = file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg' || ['png', 'jpg', 'jpeg'].includes(extension || '');

    if (!isSvg && !isImage) {
        alert("Unsupported file format. Please upload SVG, PNG, or JPG.");
        return;
    }

    setFileName(file.name);
    const reader = new FileReader();

    if (isSvg) {
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (!content.includes('<svg') && !content.includes('<SVG')) {
                 alert("The file does not appear to be a valid SVG.");
                 return;
            }
            ingestSVG(content, false);
        };
        reader.readAsText(file);
    } else {
        reader.onload = (event) => {
            const result = event.target?.result as string;
            const img = new Image();
            img.onload = () => {
                const w = img.width;
                const h = img.height;
                const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="overflow: visible"><image id="${ROOT_ID}" href="${result}" width="${w}" height="${h}" /></svg>`;
                ingestSVG(svgStr, true);
            };
            img.src = result;
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSmartGrouping = async () => {
    // Only allow if state is 'messy'
    if (svgGroupingState !== 'messy' || !svgContent) return;
    
    setIsGrouping(true);

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgContent, 'image/svg+xml');
      const svg = doc.querySelector('svg');
      if (!svg) return;

      // Execute visual clustering (preserves Path IDs, only wraps in <g>)
      performVisualClustering(doc, svg);

      // Serialize and update
      const serializer = new XMLSerializer();
      const newSvgContent = serializer.serializeToString(svg);
      setSvgContent(newSvgContent);

      // Update targets tree
      const newTargets = parseSvgStructure(doc, svg, false);
      setTargets(newTargets);

      // Update grouping state (should now be 'structured')
      detectGroupingState(svg);
      
    } catch (e) {
      console.error("Smart Grouping failed", e);
      alert("Failed to auto-group elements.");
    } finally {
      setIsGrouping(false);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    e.preventDefault();
    setSvgContent(null);
    setTargets([]);
    setLayerConfigs({});
    setGeneratedGifUrl(null);
    setFileName('');
    setActiveTargetId(ROOT_ID);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };
  // --- 补上 AI 漏掉的 GIF 生成函数 ---
  const generateGIF = async () => {
    // 1. Check
    const element = previewRef.current?.querySelector('.svg-root-target') as HTMLElement;
    const originalSvg = element?.querySelector('svg');
    if (!svgContent || !previewRef.current || !originalSvg) return;

    setIsExporting(true);
    setExportProgress(0);

    let workerScript: string | null = null;
    const tempImageUrls: string[] = [];

    try {
        // 2. Load Deps & Fix Vercel CORS
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js');
        const workerUrl = 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js';
        const response = await fetch(workerUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch worker script: ${response.status} ${response.statusText}`);
        }
        const workerBlob = await response.blob();
        workerScript = URL.createObjectURL(workerBlob);

        // 3. Init GIF (30 FPS)
        const TOTAL_FRAMES = 60; 
        const TOTAL_DURATION = 2000;
        const FRAME_DELAY = TOTAL_DURATION / TOTAL_FRAMES;

        const gif = new window.GIF({
            workers: 2,
            quality: 10,
            width: exportSize,
            height: exportSize,
            workerScript: workerScript,
            transparent: 0x000000,
            background: 0x000000
        });

        const serializer = new XMLSerializer();

        // 4. Recording Loop
        for (let i = 0; i < TOTAL_FRAMES; i++) {
            const currentTime = (i / TOTAL_FRAMES) * TOTAL_DURATION;

            // --- Step A: Clone SVG ---
            const clonedSvg = originalSvg.cloneNode(true) as SVGSVGElement;
            
            // --- Step B: Force size ---
            clonedSvg.setAttribute("width", `${exportSize}px`);
            clonedSvg.setAttribute("height", `${exportSize}px`);
            clonedSvg.style.width = `${exportSize}px`;
            clonedSvg.style.height = `${exportSize}px`;
            
            // --- Step C: Inject Keyframes (Critical: must be inside SVG) ---
            const styleElement = document.createElementNS("http://www.w3.org/2000/svg", "style");
            styleElement.textContent = generatedStyles;
            clonedSvg.insertBefore(styleElement, clonedSvg.firstChild);

            // --- Step D: Freeze Time (Flipbook) ---
            const allElements = Array.from(clonedSvg.querySelectorAll('*')) as HTMLElement[];
            allElements.forEach(el => {
                el.style.setProperty('animation-play-state', 'paused', 'important');
                el.style.setProperty('animation-delay', `-${currentTime}ms`, 'important');
            });

            // --- Step E: Serialize to Image ---
            const svgString = serializer.serializeToString(clonedSvg);
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            tempImageUrls.push(url);

            const img = new Image();
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error('Failed to load SVG image'));
                img.src = url;
            });

            // --- Step F: Draw to Canvas ---
            const canvas = document.createElement('canvas');
            canvas.width = exportSize;
            canvas.height = exportSize;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
                ctx.clearRect(0, 0, exportSize, exportSize);
                ctx.drawImage(img, 0, 0, exportSize, exportSize);
                
                // --- Step G: Fix Halo (Remove transparent background artifacts) ---
                const imageData = ctx.getImageData(0, 0, exportSize, exportSize);
                const data = imageData.data;
                for (let j = 0; j < data.length; j += 4) {
                    const alpha = data[j + 3];
                    // If alpha < 128, set to fully transparent (0)
                    // Otherwise, set to fully opaque (255)
                    if (alpha < 128) {
                        data[j + 3] = 0;
                    } else {
                        data[j + 3] = 255;
                    }
                }
                ctx.putImageData(imageData, 0, 0);
                
                gif.addFrame(canvas, { delay: FRAME_DELAY });
            }

            setExportProgress(10 + Math.round((i / TOTAL_FRAMES) * 90));
        }

        // 5. Finish
        gif.on('finished', (blob: any) => {
            setGeneratedGifUrl(URL.createObjectURL(blob));
            setIsExporting(false);
            setExportProgress(100);
            if (workerScript) URL.revokeObjectURL(workerScript);
            tempImageUrls.forEach(u => URL.revokeObjectURL(u));
        });

        gif.on('abort', () => {
            setIsExporting(false);
            if (workerScript) URL.revokeObjectURL(workerScript);
            tempImageUrls.forEach(u => URL.revokeObjectURL(u));
        });

        gif.render();

    } catch (error) {
        console.error("GIF Error:", error);
        setIsExporting(false);
        alert("Export failed.");
        if (workerScript) URL.revokeObjectURL(workerScript);
        tempImageUrls.forEach(u => URL.revokeObjectURL(u));
    }
  };

  // --- ViewBox and DOM Transforms (Combined for correct execution order) ---
  // Use useLayoutEffect to ensure synchronous execution before browser paint
  useLayoutEffect(() => {
      console.log('=== useLayoutEffect running ===');
      console.log('activeTargetId:', activeTargetId);
      console.log('layerConfigs:', layerConfigs);
      
      if (!previewRef.current) {
        console.log('No previewRef');
        return;
      }
      const svgElement = previewRef.current.querySelector('svg');
      if (!svgElement) {
        console.log('No svgElement');
        return;
      }

      // STEP 1: Set ViewBox FIRST (before any getBBox() calls)
      if (originalViewBox) {
          const [vx, vy, vw, vh] = originalViewBox;
          console.log('originalViewBox:', originalViewBox);
          
          // Recalculate animationBounds directly in useEffect to ensure we use latest layerConfigs
          let maxUpRatio = 0;
          let maxDownRatio = 0;
          let hasBounce = false;
          let hasSpin = false;
          let hasSwing = false;

          Object.values(layerConfigs).forEach((conf: LayerConfig) => {
              const effect = EFFECTS.find(e => e.id === conf.effectId);
              if (!effect) return;

              if (conf.effectId === 'bounce') hasBounce = true;
              if (conf.effectId === 'spin') hasSpin = true;
              if (conf.effectId === 'swing') hasSwing = true;

              // Exclude float, falling, rising from auto-scaling
              if (['float', 'falling', 'rising'].includes(conf.effectId)) return;

              const variation = effect.variations.find(v => v.id === conf.variation);
              if (variation) {
                  const vUp = variation.maxUp !== undefined ? variation.maxUp : 0;
                  const vDown = variation.maxDown !== undefined ? variation.maxDown : 0;
                  if (vUp > maxUpRatio) maxUpRatio = vUp;
                  if (vDown > maxDownRatio) maxDownRatio = vDown;
              }
          });

          // Default padding if no movement
          if (maxUpRatio === 0 && maxDownRatio === 0) {
              maxUpRatio = 0.1;
              maxDownRatio = 0.1;
          }
          
          // Calculate derived values
          const currentIsSpinning = hasSpin;
          const currentHasHighMovement = hasBounce || hasSwing || maxUpRatio > 0.2 || maxDownRatio > 0.2;
          
          console.log('Calculated values:');
          console.log('  maxUpRatio:', maxUpRatio, 'maxDownRatio:', maxDownRatio);
          console.log('  hasBounce:', hasBounce, 'hasSwing:', hasSwing, 'hasSpin:', hasSpin);
          console.log('  currentHasHighMovement:', currentHasHighMovement);
          
          // Calculate viewBox
          let zoomFactor = 1.2; 
          let offsetYRatio = 0.5; 
          let finalVB = '';

          // Spin 处理：强制缩放
          if (currentIsSpinning) {
              zoomFactor = 1.5;
          }

          // Bounce/Swing 处理：动态扩展边界
          if (currentHasHighMovement) {
              const padding = 0.1; 
              const expandedHeight = vh * (1 + maxUpRatio + maxDownRatio + padding);
              const expandedWidth = vw * (1 + padding);
              const size = Math.max(expandedHeight, expandedWidth);
              const newW = size;
              const newH = size;
              const motionTop = vy - (vh * maxUpRatio);
              const motionBottom = vy + vh + (vh * maxDownRatio);
              const motionCenterY = (motionTop + motionBottom) / 2;
              const cx = vx + vw / 2;
              const newX = cx - newW / 2;
              const newY = motionCenterY - newH / 2;

              finalVB = `${newX} ${newY} ${newW} ${newH}`;
          } else {
              const newW = vw * zoomFactor;
              const newH = vh * zoomFactor;
              const newX = vx - (newW - vw) / 2;
              const newY = vy - (newH - vh) * offsetYRatio;

              finalVB = `${newX} ${newY} ${newW} ${newH}`;
          }

          const oldViewBox = svgElement.getAttribute('viewBox');
          console.log('ViewBox change:', oldViewBox, '->', finalVB);
          
          svgElement.setAttribute('viewBox', finalVB);
          svgElement.setAttribute('width', '100%');
          svgElement.setAttribute('height', '100%');
          svgElement.style.overflow = 'visible';
      } else {
        console.log('No originalViewBox');
      }

      // STEP 2: Set Transform Origins AFTER viewBox is set
      const activeLayerIds = Object.keys(layerConfigs);
      
      activeLayerIds.forEach(id => {
          if (id === 'root') return;
          const element = svgElement.getElementById(id) as unknown as SVGGraphicsElement;
          if (element) {
              const config = layerConfigs[id];
              const effect = EFFECTS.find(e => e.id === config.effectId);
              const variation = effect?.variations.find(v => v.id === config.variation);
              
              const tBox = variation?.transformBox || 'fill-box';

              if (variation?.targetChildren) {
                  Array.from(element.children).forEach(c => {
                      const child = c as unknown as SVGGraphicsElement;
                      try {
                          const bbox = child.getBBox();
                          const cx = bbox.x + bbox.width / 2;
                          const cy = bbox.y + bbox.height / 2;
                          child.style.transformOrigin = `${cx}px ${cy}px`;
                          child.style.transformBox = tBox; 
                      } catch(e) {}
                  });
              } else {
                  if (['spin', 'shake', 'swing'].includes(config.effectId) || (config.effectId === 'falling' && variation?.label.includes('Leaf'))) {
                    try {
                        const bbox = element.getBBox();
                        const cx = bbox.x + bbox.width / 2;
                        const cy = bbox.y + bbox.height / 2;
                        const originSetting = variation?.origin || 'center';
                        let originX = cx; 
                        let originY = cy;
                        if (originSetting.includes('top')) originY = bbox.y;
                        if (originSetting.includes('bottom')) originY = bbox.y + bbox.height;

                        element.style.transformOrigin = `${originX}px ${originY}px`;
                        element.style.transformBox = 'view-box';
                    } catch (e) {}
                  } else if (['falling', 'rising'].includes(config.effectId)) {
                      element.style.transformBox = variation?.transformBox === 'view-box' ? 'view-box' : 'fill-box';
                  } else {
                      element.style.transformBox = 'fill-box'; 
                  }
              }
          }
      });
  }, [layerConfigs, svgContent, originalViewBox, viewBoxUpdateTrigger]);

  // Reset generated GIF when configuration changes
  useEffect(() => {
      if (generatedGifUrl) {
          setGeneratedGifUrl(null);
      }
  }, [layerConfigs, exportSize]);

  // --- Selection Highlight Logic ---
  useEffect(() => {
    // Hide highlight when effect is added
    if (Object.keys(layerConfigs).length > 0 && activeTargetId && layerConfigs[activeTargetId]) {
      setSelectionBBox(null);
      return;
    }

    // Update highlight when selection changes
    if (!showSelectionPreview || !activeTargetId || activeTargetId === ROOT_ID || !previewRef.current) {
      setSelectionBBox(null);
      return;
    }

    const svgElement = previewRef.current.querySelector('svg');
    if (!svgElement) {
      setSelectionBBox(null);
      return;
    }

    const selectedElement = svgElement.getElementById(activeTargetId);
    if (!selectedElement) {
      setSelectionBBox(null);
      return;
    }

    try {
      const bbox = (selectedElement as SVGGraphicsElement).getBBox();
      // Get SVG viewBox and container dimensions
      const viewBox = svgElement.getAttribute('viewBox');
      const containerRect = previewRef.current.getBoundingClientRect();
      
      if (viewBox) {
        const [vx, vy, vw, vh] = viewBox.split(/\s+/).map(parseFloat);
        const svgRect = svgElement.getBoundingClientRect();
        const scaleX = svgRect.width / vw;
        const scaleY = svgRect.height / vh;
        
        // Calculate position relative to container
        const relativeX = (bbox.x - vx) * scaleX;
        const relativeY = (bbox.y - vy) * scaleY;
        const relativeWidth = bbox.width * scaleX;
        const relativeHeight = bbox.height * scaleY;
        
        // Create a DOMRect relative to the preview container
        const relativeBBox = new DOMRect(
          relativeX,
          relativeY,
          relativeWidth,
          relativeHeight
        );
        setSelectionBBox(relativeBBox);
      } else {
        // Fallback: use bbox directly (less accurate but better than nothing)
        setSelectionBBox(bbox);
      }
    } catch (e) {
      setSelectionBBox(null);
    }
  }, [activeTargetId, showSelectionPreview, layerConfigs, svgContent]);

  const loadScript = (src: string) => {
    return new Promise<void>((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const updateLayerConfig = (key: keyof LayerConfig, value: string | number) => {
    console.log('=== updateLayerConfig called ===');
    console.log('activeTargetId:', activeTargetId);
    console.log('key:', key, 'value:', value);
    
    setGeneratedGifUrl(null);
    
    // Update configs first
    setLayerConfigs(prev => {
      const next = { ...prev };
      const currentLayerConfig = next[activeTargetId] || { effectId: 'none', variation: 1, speed: 1 };
      
      if (key === 'effectId') {
        if (value === 'none') {
            delete next[activeTargetId];
            return next;
        }
        const effectDef = EFFECTS.find(e => e.id === value);
        const defaultVariation = effectDef && effectDef.variations.length > 0 ? effectDef.variations[0].id : 1;
        const newConfig = { effectId: value as string, variation: defaultVariation, speed: 1 };
        next[activeTargetId] = newConfig;
        console.log('New config for', activeTargetId, ':', newConfig);
      } else {
        next[activeTargetId] = { ...currentLayerConfig, [key]: value };
      }
      console.log('All layerConfigs after update:', next);
      return next;
    });
    
    // Force immediate viewBox recalculation using requestAnimationFrame
    requestAnimationFrame(() => {
      setViewBoxUpdateTrigger(prev => prev + 1);
    });
  };

  const currentConfig = layerConfigs[activeTargetId] || { effectId: 'none', variation: 1, speed: 1 };
  const currentEffectDef = EFFECTS.find(e => e.id === currentConfig.effectId) || EFFECTS[0];

  // Helper: Create flat map of target nodes (id -> targetNode)
  const createTargetMap = (nodes: Target[]): Map<string, Target> => {
    const map = new Map<string, Target>();
    const traverse = (nodeList: Target[]) => {
      nodeList.forEach(node => {
        map.set(node.id, node);
        if (node.children) {
          traverse(node.children);
        }
      });
    };
    traverse(nodes);
    return map;
  };

  const generatedStyles = useMemo(() => {
    let css = '';
    let keyframesBlock = '';

    // Create target map for quick lookup
    const targetMap = createTargetMap(targets);

    Object.entries(layerConfigs).forEach(([targetId, config]: [string, LayerConfig]) => {
      const effect = EFFECTS.find(e => e.id === config.effectId);
      if (!effect || effect.id === 'none') return;

      const variation = effect.variations.find(v => v.id === config.variation) || effect.variations[0];
      if (!variation) return;

      const speed = config.speed || 1;
      const baseDur = effect.baseDuration || 1;
      const duration = baseDur / speed;
      const animName = `anim_${effect.id}_v${variation.id}_${targetId.replace(/[^a-zA-Z0-9]/g, '')}`;
      
      if (!keyframesBlock.includes(`@keyframes ${animName}`)) {
        keyframesBlock += variation.keyframes(animName) + '\n';
      }

      const selector = `[id="${targetId}"]`;
      const origin = variation.origin || 'center';
      let animationCss = variation.css(animName, duration);

      const tBox = variation.transformBox || 'fill-box';

      // Check if target is a Group or Shape
      const targetNode = targetMap.get(targetId);
      const isGroup = targetNode && (targetNode.type === 'group' || targetNode.type === 'root') && targetNode.children && targetNode.children.length > 0;
      const isShape = !isGroup; // Shape or empty group

      if (variation.targetChildren) {
          if (isGroup) {
              // Group with children: apply to children as before
              css += `
                ${selector} > * {
                    ${animationCss}
                    transform-origin: ${origin};
                    transform-box: ${tBox};
                    ${variation.childPreset === 'confetti' ? 'opacity: 0;' : ''}
                }
              `;
              if (variation.childPreset === 'fireworks') {
                   css += `
                    ${selector} > *:nth-child(1n) { --tx: 0px; --ty: -60px; animation-delay: 0s; }
                    ${selector} > *:nth-child(2n) { --tx: -40px; --ty: -50px; animation-delay: 0.1s; }
                    ${selector} > *:nth-child(3n) { --tx: 40px; --ty: -50px; animation-delay: 0.2s; }
                    ${selector} > *:nth-child(4n) { --tx: -20px; --ty: -70px; animation-delay: 0.05s; }
                    ${selector} > *:nth-child(5n) { --tx: 20px; --ty: -70px; animation-delay: 0.15s; }
                  `;
              } else if (variation.childPreset === 'explosion') {
                  css += `
                    ${selector} > *:nth-child(1n) { --tx: 0px; --ty: -30px; animation-delay: 0s; }
                    ${selector} > *:nth-child(2n) { --tx: -20px; --ty: -25px; animation-delay: 0.05s; }
                    ${selector} > *:nth-child(3n) { --tx: 20px; --ty: -25px; animation-delay: 0.1s; }
                    ${selector} > *:nth-child(4n) { --tx: -10px; --ty: -35px; animation-delay: 0.02s; }
                    ${selector} > *:nth-child(5n) { --tx: 10px; --ty: -35px; animation-delay: 0.08s; }
                  `;
              } else if (variation.childPreset === 'leaf') {
                 css += `
                    ${selector} > *:nth-child(10n+1) { animation-delay: -${duration * 0.1}s; }
                    ${selector} > *:nth-child(10n+2) { animation-delay: -${duration * 0.4}s; }
                    ${selector} > *:nth-child(10n+3) { animation-delay: -${duration * 0.7}s; }
                    ${selector} > *:nth-child(10n+4) { animation-delay: -${duration * 0.2}s; }
                    ${selector} > *:nth-child(10n+5) { animation-delay: -${duration * 0.8}s; }
                    ${selector} > *:nth-child(10n+6) { animation-delay: -${duration * 0.3}s; }
                    ${selector} > *:nth-child(10n+7) { animation-delay: -${duration * 0.9}s; }
                    ${selector} > *:nth-child(10n+8) { animation-delay: -${duration * 0.5}s; }
                    ${selector} > *:nth-child(10n+9) { animation-delay: -${duration * 0.6}s; }
                    ${selector} > *:nth-child(10n+10) { animation-delay: 0s; }
                 `;
              } else if (variation.childPreset === 'confetti') {
                  // Confetti: 保持原始相对位置（--tx: 0），初始密集下落，通过速度和微小偏移逐渐拉开
                  css += `
                    ${selector} > *:nth-child(9n+1) { --tx: 0px; --drift: 0px; animation-duration: 1.8s; animation-delay: 0s; }
                    ${selector} > *:nth-child(9n+2) { --tx: 0px; --drift: 5px; animation-duration: 2.2s; animation-delay: -0.01s; }
                    ${selector} > *:nth-child(9n+3) { --tx: 0px; --drift: 0px; animation-duration: 2.4s; animation-delay: 0s; }
                    ${selector} > *:nth-child(9n+4) { --tx: 0px; --drift: 8px; animation-duration: 1.6s; animation-delay: -0.02s; }
                    ${selector} > *:nth-child(9n+5) { --tx: 0px; --drift: 3px; animation-duration: 2.0s; animation-delay: 0s; }
                    ${selector} > *:nth-child(9n+6) { --tx: 0px; --drift: 0px; animation-duration: 1.9s; animation-delay: -0.01s; }
                    ${selector} > *:nth-child(9n+7) { --tx: 0px; --drift: 6px; animation-duration: 2.1s; animation-delay: 0s; }
                    ${selector} > *:nth-child(9n+8) { --tx: 0px; --drift: 0px; animation-duration: 1.7s; animation-delay: -0.02s; }
                    ${selector} > *:nth-child(9n+9) { --tx: 0px; --drift: 4px; animation-duration: 2.0s; animation-delay: -0.01s; }
                  `;
              }
          } else {
              // Shape or empty group: fallback to self
              css += `
                ${selector} {
                    ${animationCss}
                    transform-origin: ${origin};
                    transform-box: ${tBox};
                    ${variation.childPreset === 'confetti' ? 'opacity: 0;' : ''}
                }
              `;
              // Apply default animation parameters for single element
              if (variation.childPreset === 'fireworks') {
                  css += `
                    ${selector} { --tx: 0px; --ty: -60px; animation-delay: 0s; }
                  `;
              } else if (variation.childPreset === 'explosion') {
                  css += `
                    ${selector} { --tx: 0px; --ty: -30px; animation-delay: 0s; }
                  `;
              } else if (variation.childPreset === 'leaf') {
                  css += `
                    ${selector} { animation-delay: 0s; }
                  `;
              } else if (variation.childPreset === 'confetti') {
                  css += `
                    ${selector} { --tx: 0px; --drift: 0px; animation-duration: 1.8s; animation-delay: 0s; }
                  `;
              }
          }
      } else {
          css += `
            ${selector} {
                ${animationCss}
                transform-origin: ${origin};
                transform-box: ${tBox};
            }
          `;
      }
    });

    // Add global pause class
    css += `\n.rendering-paused * { animation-play-state: paused !important; }`;

    return `${keyframesBlock}\n${css}`;
  }, [layerConfigs, targets]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      <style>{generatedStyles}</style>

      <header className="bg-slate-800 border-b border-slate-700 p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="h-10 w-auto" />
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              Motion Pro <span className="text-xs bg-indigo-600 px-1.5 py-0.5 rounded text-white ml-1">Beta</span>
            </h1>
          </div>
          <nav className="flex gap-4">
            {[
              { id: 'ai-generator',        label: 'AI Generator' },
              { id: 'svg-motion',          label: 'Preset Effects' },
              { id: 'internal-templates',  label: 'Internal Templates' },
              { id: 'external-templates',  label: 'External Templates' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`text-sm font-medium transition-colors ${activeTab === id ? 'text-white border-b-2 border-indigo-500 pb-1' : 'text-slate-400 hover:text-white'}`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className={activeTab === 'ai-generator' ? '' : 'max-w-7xl mx-auto px-8 py-8'}>
        {activeTab === 'ai-generator' ? (
          <VideoGenerator />
        ) : activeTab === 'svg-motion' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: Preview & CSS */}
            <div className="lg:col-span-7 relative">
              <div className="sticky top-24 flex flex-col gap-6">
                  
                  <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden flex flex-col">
                    <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                      <h2 className="text-md font-semibold flex items-center gap-2 text-slate-300">
                        <FileVideo size={18} className="text-indigo-400" />
                        Live Preview
                      </h2>
                      <div className="flex items-center gap-3">
                        {/* Preview Selection Toggle */}
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-400 cursor-pointer select-none">
                            Preview Selected Layer
                          </label>
                          <button
                            onClick={() => setShowSelectionPreview(!showSelectionPreview)}
                            className={`relative w-10 h-5 rounded-full transition-colors ${
                              showSelectionPreview ? 'bg-indigo-600' : 'bg-slate-600'
                            }`}
                            role="switch"
                            aria-checked={showSelectionPreview}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                                showSelectionPreview ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                        {/* Background Color Toggles */}
                        <div className="flex bg-slate-900 rounded-lg p-1 gap-1">
                          {[{id:'checker',l:'🏁'},{id:'white',l:'⚪'},{id:'black',l:'⚫'}].map(bg => (
                            <button key={bg.id} onClick={()=>setPreviewBg(bg.id)} className={`px-2 py-1 rounded text-xs ${previewBg===bg.id?'bg-slate-700 text-white':'text-slate-500'}`}>{bg.l}</button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="relative w-full mx-auto bg-slate-900 max-w-[512px] aspect-square">
                       <div className="absolute inset-0 w-full h-full overflow-hidden"> 
                         <div className="absolute inset-0 w-full h-full pointer-events-none">
                           {previewBg === 'checker' && (
                             <div className="w-full h-full opacity-20" style={{
                                backgroundImage: 'linear-gradient(45deg, #334155 25%, transparent 25%), linear-gradient(-45deg, #334155 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #334155 75%), linear-gradient(-45deg, transparent 75%, #334155 75%)',
                                backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                             }}></div>
                           )}
                           {previewBg === 'white' && <div className="w-full h-full bg-white"></div>}
                           {previewBg === 'black' && <div className="w-full h-full bg-black"></div>}
                         </div>
                         
                         <div className="absolute top-2 left-2 z-20 pointer-events-none">
                            <span className="bg-slate-900/70 text-slate-400 text-[10px] px-1.5 py-0.5 rounded border border-slate-700">
                              512 x 512px (1:1)
                            </span>
                         </div>

                         {svgContent ? (
                           <div 
                             ref={previewRef} 
                             className={`absolute inset-0 w-full h-full flex items-center justify-center ${isExporting ? 'rendering-paused' : ''}`}
                           >
                              {isExporting && (
                                <div className="absolute inset-0 z-50 bg-slate-900/80 flex flex-col items-center justify-center backdrop-blur-sm animate-fade-in">
                                  <div className="text-xl font-bold text-white mb-2">Rendering GIF...</div>
                                  <div className="text-sm text-slate-400">{exportProgress}%</div>
                                </div>
                              )}

                              {isGrouping && (
                                <div className="absolute inset-0 z-50 bg-slate-900/80 flex flex-col items-center justify-center backdrop-blur-sm animate-fade-in">
                                  <Sparkles size={48} className="text-indigo-500 animate-pulse mb-4" />
                                  <div className="text-xl font-bold text-white mb-2">AI is Organizing...</div>
                                  <div className="text-sm text-slate-400">Grouping elements semantically</div>
                                </div>
                              )}
                              
                              {/* Use shared layout style */}
                              <div 
                                  className="w-full h-full svg-root-target" 
                                  style={layoutStyle} 
                                  dangerouslySetInnerHTML={{ __html: svgContent }}
                              />

                              {/* Selection Highlight Box */}
                              {showSelectionPreview && selectionBBox && (
                                <svg 
                                  className="absolute inset-0 w-full h-full pointer-events-none z-10"
                                  style={{ overflow: 'visible' }}
                                >
                                  <rect
                                    ref={highlightRef}
                                    x={selectionBBox.x}
                                    y={selectionBBox.y}
                                    width={selectionBBox.width}
                                    height={selectionBBox.height}
                                    fill="none"
                                    stroke="rgba(99, 102, 241, 0.5)"
                                    strokeWidth="2"
                                    strokeDasharray="4 4"
                                    rx="2"
                                  />
                                </svg>
                              )}
                           </div>
                         ) : (
                           <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
                              <Upload size={48} className="opacity-20 mb-4" />
                              <p>Waiting for file upload...</p>
                           </div>
                         )}
                       </div>
                    </div>

                    <div className="p-4 border-t border-slate-700 bg-slate-800">
                      
                      {/* Export Size Selector */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-400">Export Size</span>
                        <div className="flex bg-slate-900 rounded-lg p-1 gap-1">
                            {[512, 1024].map(size => (
                            <button
                                key={size}
                                onClick={() => setExportSize(size)}
                                className={`px-3 py-1 rounded text-xs transition-colors ${exportSize === size ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {size}px
                            </button>
                            ))}
                        </div>
                      </div>

                      {generatedGifUrl ? (
                        <div className="flex gap-3 animate-fade-in">
                            <a href={generatedGifUrl} download="animated.gif" className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2">
                                <Download size={18} /> Download GIF
                            </a>
                            <button onClick={() => setGeneratedGifUrl(null)} className="bg-slate-700 hover:bg-slate-600 text-slate-300 p-3 rounded-lg"><X size={18} /></button>
                        </div>
                      ) : (
                          <button
                            onClick={generateGIF}
                            disabled={!svgContent || isExporting || isGrouping}
                            className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${!svgContent ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : isExporting || isGrouping ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                          >
                            {isExporting ? <><RefreshCw size={18} className="animate-spin" /> Rendering ({exportProgress}%)</> : <><Download size={18} /> Render for Export</>}
                          </button>
                      )}
                      {isExporting && <div className="mt-2 h-1 w-full bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${exportProgress}%` }}></div></div>}
                    </div>
                  </div>

                  {/* 2. Code Output */}
                  {svgContent && (
                    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-xl flex-grow flex flex-col min-h-[150px]">
                      <div className="flex justify-between items-center mb-2">
                        <h2 className="text-md font-semibold flex items-center gap-2 text-slate-300">
                          <Code size={18} className="text-indigo-400" />
                          Generated CSS
                        </h2>
                        <button 
                          onClick={copyToClipboard} 
                          className="text-slate-400 hover:text-white flex items-center gap-1 transition-all" 
                          title="Copy CSS"
                        >
                            {isCopied ? (
                                <span className="text-green-400 text-xs flex items-center gap-1">
                                    <Check size={14} /> Copied
                                </span>
                            ) : (
                                <Copy size={16}/>
                            )}
                        </button>
                      </div>
                      <div className="bg-slate-950 rounded-lg p-3 font-mono text-[10px] text-green-400 overflow-auto border border-slate-900 flex-grow whitespace-pre">
                          {generatedStyles || "// No effects applied"}
                      </div>
                    </div>
                  )}

              </div>
            </div>

            {/* RIGHT COLUMN: Controls */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* ... Controls ... */}
              <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-xl">
                <h2 className="text-md font-semibold mb-2 flex items-center gap-2 text-slate-300">
                  <Upload size={18} className="text-indigo-400" />
                  Upload File
                </h2>

                {/* Tips Section */}
                <div className="mb-4">
                  <button 
                    onClick={() => setIsTipsOpen(!isTipsOpen)}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors focus:outline-none"
                  >
                    <Info size={12} />
                    <span>Tips for Enabling Multi-Part Effects</span>
                    {isTipsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  
                  {isTipsOpen && (
                    <div className="mt-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700 text-xs text-slate-400 leading-relaxed animate-fade-in">
                      <ol className="list-decimal pl-4 space-y-2">
                        <li>You can animate the entire image or animate different parts separately.</li>
                        <li>
                          If you want different areas to have separate effects:
                          <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-500">
                            <li>In Figma, select the artwork and wrap it in a <strong>Frame</strong>.</li>
                            <li>Inside the Frame, group together all vectors that should share the same effect. <strong>One Group = One animation target.</strong></li>
                            <li>Frame and group names can be customized (any name).</li>
                          </ul>
                          <div className="mt-2 p-2 bg-slate-950 rounded border border-slate-800 font-mono text-[10px] text-slate-400">
                            Example structure:<br/>
                            Frame<br/>
                            ├── Group A  → effect 1<br/>
                            ├── Group B  → effect 2<br/>
                            ├── Group C  → effect 3<br/>
                            └── ...
                          </div>
                        </li>
                        <li>
                          <strong>Export as SVG:</strong>
                          <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-500">
                            <li>Choose SVG format.</li>
                            <li>In Figma, enable: <strong>“Include ID attribute”</strong>.</li>
                          </ul>
                        </li>
                      </ol>
                    </div>
                  )}
                </div>

                <div className="relative group">
                  <input type="file" accept=".svg, .png, .jpg, .jpeg" ref={fileInputRef} onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${svgContent ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-600 hover:border-indigo-400 hover:bg-slate-700/50'}`}>
                    {svgContent ? (
                      <div className="flex items-center justify-between w-full px-4">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <FileVideo size={20} className="text-indigo-400 flex-shrink-0" />
                            <span className="font-medium text-indigo-300 truncate" title={fileName}>{fileName}</span>
                        </div>
                        <button 
                            onClick={handleRemoveFile}
                            className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-red-400 transition-colors z-20 relative"
                            title="Remove file"
                        >
                            <Trash2 size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="text-slate-400 text-sm">Click to upload SVG, PNG, or JPG</div>
                    )}
                  </div>
                </div>
              </div>

              {svgContent && (
                <>
                  <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-xl">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-md font-semibold flex items-center gap-2 text-slate-300">
                            <Layers size={18} className="text-indigo-400" />
                            Select Layer
                        </h2>
                    </div>

                    {/* Hint Text */}
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                      <em>If you want different areas to have separate effects, it is recommended to organize them into groups before adding motion.</em>
                    </p>

                    {/* Toolbar: Three buttons in one row */}
                    <div className="flex gap-2 w-full mb-3">
                      {/* Smart Grouping Button */}
                      <button 
                          onClick={handleSmartGrouping}
                          disabled={isGrouping || svgGroupingState !== 'messy'}
                          className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all flex-[2] ${
                            isGrouping
                              ? 'bg-indigo-900/50 text-indigo-400 cursor-wait'
                              : svgGroupingState === 'messy'
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-900/20'
                              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                          }`}
                          title={
                            svgGroupingState === 'bitmap'
                              ? 'Only SVG files support smart grouping.'
                              : svgGroupingState === 'structured'
                              ? 'SVG is already grouped. Ungroup layers to use smart grouping.'
                              : svgGroupingState === 'messy'
                              ? 'Automatically group elements by visual similarity'
                              : 'Upload an SVG file to enable smart grouping'
                          }
                      >
                          {isGrouping ? (
                              <RefreshCw size={12} className="animate-spin" />
                          ) : (
                              <Sparkles size={12} />
                          )}
                          {isGrouping ? 'Organizing...' : 'Smart Grouping'}
                      </button>

                      {/* New Group Button */}
                      <button 
                          onClick={handleCreateGroup}
                          disabled={!svgContent || svgGroupingState === 'bitmap'}
                          className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all flex-1 ${
                            !svgContent || svgGroupingState === 'bitmap'
                              ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                              : 'bg-slate-600 hover:bg-slate-500 text-white'
                          }`}
                          title={svgGroupingState === 'bitmap' ? 'Only SVG files support grouping' : 'Create new group'}
                      >
                          <FolderPlus size={12} />
                          New Group
                      </button>

                      {/* Ungroup Button */}
                      {(() => {
                        const selectedNode = findTargetNodeInTree(targets, activeTargetId);
                        const isSelectedGroup = selectedNode && selectedNode.type === 'group' && selectedNode.id !== ROOT_ID;
                        return (
                          <button
                            onClick={() => handleUngroup(activeTargetId)}
                            disabled={!isSelectedGroup}
                            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all flex-1 ${
                              !isSelectedGroup
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                                : 'bg-slate-600 hover:bg-slate-500 text-white'
                            }`}
                            title={isSelectedGroup ? 'Ungroup selected layer' : 'Select a group to ungroup'}
                          >
                            <X size={12} />
                            Ungroup
                          </button>
                        );
                      })()}
                    </div>
                    
                    {/* Layer Tree View */}
                    <div className="relative w-full bg-slate-900 border border-slate-600 rounded-lg max-h-[240px] overflow-y-auto custom-scrollbar">
                        <LayerTreeView 
                           nodes={targets} 
                           selectedId={activeTargetId} 
                           onSelect={setActiveTargetId} 
                           layerConfigs={layerConfigs}
                           onMoveLayer={handleMoveLayer}
                           onUngroup={handleUngroup}
                           rootId={ROOT_ID}
                        />
                    </div>
                  </div>

                  <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-xl">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-md font-semibold flex items-center gap-2 text-slate-300">
                          <Play size={18} className="text-indigo-400" />
                          Select Effect
                        </h2>
                        <button
                          onClick={() => { setLayerConfigs({}); setGeneratedGifUrl(null); }}
                          disabled={Object.keys(layerConfigs).length === 0}
                          className={`text-xs flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
                            Object.keys(layerConfigs).length === 0 
                              ? 'text-slate-600 cursor-not-allowed' 
                              : 'text-red-400 hover:bg-red-500/10 hover:text-red-300 cursor-pointer'
                          }`}
                        >
                          <RotateCcw size={12} />
                          Reset All
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                      {EFFECTS.map((effect) => (
                        <button
                          key={effect.id}
                          onClick={() => updateLayerConfig('effectId', effect.id)}
                          className={`p-2 rounded-lg text-xs font-medium transition-all border ${
                            currentConfig.effectId === effect.id
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          {effect.name}
                        </button>
                      ))}
                    </div>

                    {currentConfig.effectId !== 'none' && (
                      <div className="pt-4 border-t border-slate-700 animate-fade-in">
                        {/* Variations */}
                        <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2 flex items-center gap-1">
                          <Sliders size={12} /> Variations
                        </h3>
                        <div className="flex gap-2 flex-wrap mb-5">
                          {currentEffectDef.variations.map((v) => (
                            <button
                              key={v.id}
                              onClick={() => updateLayerConfig('variation', v.id)}
                              className={`px-3 py-1.5 rounded text-xs border transition-colors ${
                                currentConfig.variation === v.id
                                 ? 'bg-cyan-600 border-cyan-500 text-white shadow shadow-cyan-900/50'
                                 : 'bg-slate-700 border-slate-600 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {v.label}
                            </button>
                          ))}
                        </div>

                        {/* Speed Slider */}
                        <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2 flex items-center gap-1 justify-between">
                          <span className="flex items-center gap-1"><Zap size={12} /> Animation Speed</span>
                          <span className="text-indigo-400">{currentConfig.speed}x</span>
                        </h3>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500">Slow</span>
                            <input 
                                type="range" 
                                min="0.5" 
                                max="3.0" 
                                step="0.5"
                                value={currentConfig.speed}
                                onChange={(e) => updateLayerConfig('speed', parseFloat(e.target.value))}
                                className="flex-grow h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            <span className="text-xs text-slate-500">Fast</span>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : activeTab === 'external-templates' ? (
          <ExternalTemplates />
        ) : (
          <InternalTemplates />
        )}
      </main>
    </div>
  );
}