/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Utensils, Shirt, Sparkles, RefreshCw, ChevronRight, 
  Smile, Frown, Meh, Zap, Moon, Target, Palette, Hash,
  LayoutDashboard, CheckSquare, PenLine, Plus, Trash2, CheckCircle2, Circle,
  BrainCircuit, Loader2, Sparkle, Share2, X, Calendar
} from 'lucide-react';
import { FORTUNE_LOTS, FortuneLot, Recommendation } from './constants';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type AppStep = 'drawing' | 'result' | 'mood' | 'loading' | 'dashboard';
type DashboardTab = 'oracle' | 'todo' | 'review' | 'history';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  completionTime?: string;
  completionMood?: string;
}

interface HistoryEntry {
  date: string; // YYYY-MM-DD
  lot: FortuneLot | null;
  todos: Todo[];
  mood: string | null;
  reflection: string;
  aiReport?: string;
}

const MOODS = [
  { id: 'happy', icon: Smile, label: '喜悦', color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { id: 'calm', icon: Moon, label: '平静', color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'tired', icon: Meh, label: '疲惫', color: 'text-stone-500', bg: 'bg-stone-50' },
  { id: 'energetic', icon: Zap, label: '活力', color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'sad', icon: Frown, label: '低落', color: 'text-indigo-500', bg: 'bg-indigo-50' },
];

export default function App() {
  const [step, setStep] = useState<AppStep>('drawing');
  const [activeTab, setActiveTab] = useState<DashboardTab>('oracle');
  const [isShaking, setIsShaking] = useState(false);
  const [currentLot, setCurrentLot] = useState<FortuneLot | null>(null);
  const [currentRecommendation, setCurrentRecommendation] = useState<Recommendation | null>(null);
  const [aiInterpretation, setAiInterpretation] = useState<string>('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [userIntention, setUserIntention] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<{ label: string; title: string; description: string; icon: any; color: string; bg: string } | null>(null);
  
  // Todo & Review State
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [dailyReview, setDailyReview] = useState('');
  const [aiReport, setAiReport] = useState('');
  const [history, setHistory] = useState<Record<string, HistoryEntry>>({});
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string | null>(null);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('oracle_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Auto-save current day to history
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const entry: HistoryEntry = {
      date: today,
      lot: currentLot,
      todos: todos,
      mood: selectedMood,
      reflection: dailyReview,
      aiReport: aiReport
    };
    
    const newHistory = { ...history, [today]: entry };
    setHistory(newHistory);
    localStorage.setItem('oracle_history', JSON.stringify(newHistory));
  }, [currentLot, todos, selectedMood, dailyReview]);

  const drawLot = useCallback(() => {
    if (step !== 'drawing' || isShaking) return;
    
    setIsShaking(true);
    setCurrentLot(null);
    setCurrentRecommendation(null);
    setAiInterpretation('');

    // Simulate shaking time
    setTimeout(() => {
      setIsShaking(false);
      const randomIndex = Math.floor(Math.random() * FORTUNE_LOTS.length);
      const lot = FORTUNE_LOTS[randomIndex];
      setCurrentLot(lot);
      setStep('result');
    }, 1200);
  }, [step, isShaking]);

  const generateAiInsight = async (moodId: string, intention?: string, retryCount = 0) => {
    if (!currentLot) return;
    
    if (retryCount === 0) setStep('loading');
    setIsLoadingAi(true);
    
    const moodLabel = MOODS.find(m => m.id === moodId)?.label || '平常';
    const intentionContext = intention ? `用户表达了特别的意愿或目标：${intention}。请务必结合这个意愿来调整解读和建议。` : '';
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: `你是一位现代禅意占卜师。用户抽到了签位：${currentLot.title}，描述为：${currentLot.description}。用户当下的心情是：${moodLabel}。
        ${intentionContext}
        请根据这些信息，为用户生成：
        1. 一段100字以内的深度灵感解读（interpretation）。
        2. 四个类别的具体建议：食（eat）、穿（wear）、用（use）、行（action）。
        
        风格要求：
        - 语言风格：日常、简短、生活化，像朋友间的随口建议。
        - 标题（title）：极其简短，3-5个字。
        - 描述（description）：50字以内，具体且有生活气息。
        
        请以 JSON 格式返回，结构如下：
        {
          "interpretation": "...",
          "recommendation": {
            "eat": { "title": "...", "description": "..." },
            "wear": { "title": "...", "description": "..." },
            "use": { "title": "...", "description": "..." },
            "action": { "title": "...", "description": "..." }
          }
        }`,
        config: {
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text || '{}');
      setAiInterpretation(result.interpretation || '静心感受当下的能量流转。');
      setCurrentRecommendation(result.recommendation);
      setStep('dashboard');
    } catch (error) {
      console.error(`AI Generation failed (attempt ${retryCount + 1}):`, error);
      if (retryCount < 2) {
        // Simple exponential backoff
        setTimeout(() => generateAiInsight(moodId, intention, retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      setAiInterpretation("灵感正在酝酿中，请保持内心的平静。目前连接星辰的通道有些拥挤，请稍后再试。");
      setStep('dashboard');
    } finally {
      if (retryCount >= 2 || !isLoadingAi) {
        setIsLoadingAi(false);
      }
    }
  };

  const generateDailyReflection = async (retryCount = 0) => {
    if (!dailyReview && todos.length === 0) return;
    
    setIsLoadingAi(true);
    try {
      const todoList = todos.map(t => {
        const mood = MOODS.find(m => m.id === t.completionMood)?.label || '未记录';
        return `${t.completed ? '[已完成]' : '[未完成]'} ${t.text} ${t.completed ? `(完成时间: ${t.completionTime || '未记录'}, 完成心情: ${mood})` : ''}`;
      }).join('\n');
      
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: `你是一位洞察人心的现代禅意占卜师。请根据以下信息，为用户提供一份极具针对性的“灵魂成长报告”。
        
        【今日背景】
        - 签位启示：${currentLot?.title} (${currentLot?.description})
        - 核心心情：${selectedMood}
        
        【行动轨迹】
        ${todoList}
        
        【内心独白】
        "${dailyReview}"
        
        【复盘要求】
        1. 拒绝空话：必须直接引用或针对“行动轨迹”中的具体任务和“内心独白”中的具体词句进行分析。
        2. 深度共情：如果任务完成得好，请给予真诚且具体的鼓励；如果任务未完成或感悟中带有负面情绪，请给予温柔的化解和支持。
        3. 能量总结：分析今天的能量是散乱的、专注的、还是处于转折点。
        4. 明日微光：给出一个与今天经历紧密相关的、极其具体的明天小建议。
        
        【格式规范】
        - 纯文本格式，绝对禁止使用任何 Markdown 符号（如 *、#、-、>、[ ] 等）。
        - 严禁使用星号（*）加粗。
        - 字数控制在150-200字之间。
        - 结尾处加上一个独特的、与今日主题相关的禅意落款。`,
      });
      
      setAiReport(response.text || '');
    } catch (error) {
      console.error(`AI Reflection failed (attempt ${retryCount + 1}):`, error);
      if (retryCount < 2) {
        setTimeout(() => generateDailyReflection(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
    } finally {
      setIsLoadingAi(false);
    }
  };

  useEffect(() => {
    let lastX = 0, lastY = 0, lastZ = 0;
    let threshold = 15;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;
      const { x, y, z } = acc;
      if (x === null || y === null || z === null) return;
      const deltaX = Math.abs(lastX - x);
      const deltaY = Math.abs(lastY - y);
      const deltaZ = Math.abs(lastZ - z);
      if ((deltaX > threshold && deltaY > threshold) || (deltaX > threshold && deltaZ > threshold) || (deltaY > threshold && deltaZ > threshold)) {
        drawLot();
      }
      lastX = x; lastY = y; lastZ = z;
    };

    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', handleMotion);
    }
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [drawLot]);

  const reset = () => {
    setStep('drawing');
    setCurrentLot(null);
    setSelectedMood(null);
    setIsShaking(false);
    setActiveTab('oracle');
  };

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    setTodos([...todos, { id: crypto.randomUUID(), text: newTodo, completed: false }]);
    setNewTodo('');
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => {
      if (t.id === id) {
        const isCompleting = !t.completed;
        return { 
          ...t, 
          completed: isCompleting,
          completionTime: isCompleting ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
          completionMood: isCompleting ? selectedMood || undefined : undefined
        };
      }
      return t;
    }));
  };

  const updateTodoMetric = (id: string, updates: Partial<Pick<Todo, 'completionTime' | 'completionMood'>>) => {
    setTodos(todos.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex flex-col items-center justify-center p-6 font-sans select-none overflow-hidden">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 w-full pt-12 pb-6 text-center z-40 bg-[#f8f7f4]/80 backdrop-blur-md border-b border-stone-100 pointer-events-none"
      >
        <div className="max-w-md mx-auto px-6">
          <h1 className="text-sm uppercase tracking-[0.3em] text-stone-400 font-medium">Daily Oracle</h1>
          <p className="text-2xl font-serif mt-2 text-stone-800">
            {step === 'drawing' ? '今日灵感' : 
             step === 'result' ? '签文已现' : 
             step === 'mood' ? '此刻心境' : 
             step === 'loading' ? '灵感酝酿' :
             activeTab === 'oracle' ? '今日启示' : 
             activeTab === 'todo' ? '待办清单' : '每日复盘'}
          </p>
        </div>
      </motion.header>

      <main className={cn(
        "relative w-full max-w-md flex flex-col items-center flex-1 overflow-y-auto no-scrollbar pt-40 pb-32",
        step !== 'dashboard' ? "justify-center" : "justify-start"
      )}>
        <AnimatePresence mode="wait">
          {step === 'drawing' && (
            <motion.div
              key="drawing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                rotate: isShaking ? [0, -8, 8, -8, 8, 0] : 0,
                x: isShaking ? [0, -12, 12, -12, 12, 0] : 0,
                y: isShaking ? [0, 5, -5, 5, -5, 0] : 0
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ 
                rotate: { repeat: isShaking ? Infinity : 0, duration: 0.15 },
                x: { repeat: isShaking ? Infinity : 0, duration: 0.15 },
                y: { repeat: isShaking ? Infinity : 0, duration: 0.15 }
              }}
              className="flex flex-col items-center justify-center min-h-[400px]"
              onClick={drawLot}
            >
              {/* Slender Vertical 3D Cylinder */}
              <div className="relative w-24 h-60 flex flex-col items-center cursor-pointer">
                {/* 1. Back Opening / Inside Shadow (Lowest Z) */}
                <div 
                  className="absolute top-6 left-0 w-full h-6 rounded-[100%] z-0"
                  style={{
                    background: '#1a0505',
                    boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.8)'
                  }}
                />

                {/* 2. Sticks (Middle Z) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 flex gap-1 px-4 w-full justify-center z-10">
                  {[
                    { id: 1, h: 'h-24', r: -3 },
                    { id: 2, h: 'h-28', r: 1 },
                    { id: 3, h: 'h-22', r: 4 },
                    { id: 4, h: 'h-26', r: -2 }
                  ].map((stick) => (
                    <div 
                      key={stick.id}
                      className={cn("w-2.5 rounded-t-sm shadow-md", stick.h)}
                      style={{
                        background: 'linear-gradient(to bottom, #d4a373 0%, #a98467 100%)',
                        borderTop: '3px solid #603813',
                        transform: `rotate(${stick.r}deg)`
                      }}
                    />
                  ))}
                </div>

                {/* 3. Tube Body (Front Wall - High Z) */}
                <div 
                  className="absolute inset-x-0 bottom-0 h-52 rounded-b-2xl shadow-[0_25px_50px_rgba(0,0,0,0.4)] overflow-hidden z-20"
                  style={{
                    background: 'linear-gradient(to right, #2d0a0a 0%, #5c1a1a 20%, #8b2a2a 50%, #5c1a1a 80%, #2d0a0a 100%)',
                    borderBottom: '5px solid #1a0505',
                    boxShadow: 'inset 0 0 40px rgba(0,0,0,0.4)'
                  }}
                >
                  {/* Texture Overlay */}
                  <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none" 
                    style={{ 
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
                    }} 
                  />
                  
                  <div className="absolute top-8 w-full h-1 bg-gradient-to-r from-yellow-900 via-yellow-500/20 to-yellow-900 opacity-20" />
                  <div className="absolute bottom-12 w-full h-1 bg-gradient-to-r from-yellow-900 via-yellow-500/20 to-yellow-900 opacity-20" />
                  
                  {/* Muted 'Ji' */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-stone-200/10 flex items-center justify-center bg-stone-100/5 backdrop-blur-[2px]">
                    <span className="text-stone-300/40 font-serif text-base tracking-widest">吉</span>
                  </div>
                </div>

                {/* 4. Front Rim (Highest Z for 3D edge) */}
                <div 
                  className="absolute top-6 left-0 w-full h-6 rounded-[100%] border-2 border-[#1a0505] z-30 pointer-events-none"
                  style={{
                    background: 'transparent',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}
                />
              </div>

              <motion.div 
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mt-12 text-center text-stone-400 text-xs tracking-widest uppercase"
              >
                {isShaking ? "正在摇晃..." : "点击或摇晃手机抽签"}
              </motion.div>
            </motion.div>
          )}

          {step === 'result' && currentLot && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full flex flex-col items-center"
            >
              {/* The Lot Stick */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 0.2 }}
                className="w-14 h-72 rounded-lg shadow-2xl flex flex-col items-center justify-between py-10 border-x border-stone-700"
                style={{ backgroundColor: currentLot.hexColor || '#292524' }}
              >
                <div className="w-1.5 h-14 bg-white/20 rounded-full" />
                <div 
                  className="text-white font-serif text-2xl tracking-[0.6em] h-40 flex items-center justify-center" 
                  style={{ 
                    writingMode: 'vertical-rl',
                    WebkitWritingMode: 'vertical-rl'
                  }}
                >
                  {currentLot.title.split(' ')[0]}
                </div>
                <div className="w-1.5 h-14 bg-white/20 rounded-full" />
              </motion.div>

              <div className="mt-10 text-center px-6">
                <h2 className="text-2xl font-serif text-stone-800 mb-3">{currentLot.title}</h2>
                <p className="text-stone-500 text-sm leading-relaxed max-w-[280px] mx-auto mb-6">
                  {currentLot.description}
                </p>
                
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-stone-100">
                    <Palette size={14} className="text-stone-400" />
                    <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">幸运色</span>
                    <span className="text-xs font-medium" style={{ color: currentLot.hexColor }}>{currentLot.luckyColor}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-stone-100">
                    <Hash size={14} className="text-stone-400" />
                    <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">幸运数</span>
                    <span className="text-xs text-stone-700 font-medium">{currentLot.luckyNumber}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 mt-12 w-full max-w-[280px]">
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  onClick={() => setStep('mood')}
                  className="group flex items-center justify-center gap-3 bg-stone-900 text-white px-10 py-5 rounded-full text-sm tracking-widest uppercase hover:bg-stone-800 transition-all shadow-2xl active:scale-95"
                >
                  查看今日建议 <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
                
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center justify-center gap-3 bg-white text-stone-600 border border-stone-100 px-10 py-5 rounded-full text-sm tracking-widest uppercase hover:bg-stone-50 transition-all shadow-sm active:scale-95"
                >
                  分享今日签文 <Share2 size={18} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 'mood' && (
            <motion.div
              key="mood"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-sm px-6"
            >
              <div className="text-center mb-12">
                <h2 className="text-xl font-serif text-stone-800 mb-2">此刻，你的心情如何？</h2>
                <p className="text-stone-400 text-xs tracking-widest uppercase">选择一个最贴近的状态</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {MOODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedMood(m.id);
                      generateAiInsight(m.id);
                    }}
                    className={cn(
                      "flex items-center gap-6 p-5 rounded-3xl transition-all border border-transparent hover:border-stone-200 active:scale-95",
                      m.bg
                    )}
                  >
                    <div className={cn("w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm", m.color)}>
                      <m.icon size={24} />
                    </div>
                    <span className="text-stone-700 font-medium tracking-wide">{m.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[400px] text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="mb-8 text-stone-300"
              >
                <BrainCircuit size={64} strokeWidth={1} />
              </motion.div>
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <p className="text-stone-500 font-serif text-lg mb-2">正在为您连接星辰与灵感...</p>
                <p className="text-stone-300 text-[10px] uppercase tracking-widest">AI Native Oracle is thinking</p>
              </motion.div>
            </motion.div>
          )}

          {step === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full max-w-md px-6"
            >
              {activeTab === 'oracle' && currentLot && currentRecommendation && (
                <div className="space-y-12">
                  {/* Consolidated Fortune Result */}
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Sparkle size={80} />
                    </div>
                    
                    <div className="inline-block px-4 py-1 bg-stone-900 text-white text-[10px] uppercase tracking-widest rounded-full mb-4">
                      今日运势
                    </div>
                    <h2 className="text-3xl font-serif text-stone-800 mb-4">{currentLot.title}</h2>
                    
                    {/* AI Interpretation Section */}
                    <div className="bg-stone-50/50 p-6 rounded-3xl mb-6 text-left border border-stone-100/50">
                      <div className="flex items-center gap-2 mb-3">
                        <BrainCircuit size={14} className="text-stone-400" />
                        <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">AI 灵感解读</span>
                      </div>
                      <p className="text-stone-600 text-sm leading-relaxed font-serif italic">
                        {aiInterpretation || "正在为您解读今日能量..."}
                      </p>
                    </div>

                    {/* User Intention Input */}
                    <div className="mb-6 text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <PenLine size={12} className="text-stone-400" />
                        <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">注入意愿</span>
                      </div>
                      <div className="relative">
                        <textarea 
                          value={userIntention}
                          onChange={(e) => setUserIntention(e.target.value)}
                          placeholder="输入你今日的特别愿望或目标，让启示更精准..."
                          className="w-full bg-stone-50 p-4 rounded-2xl text-xs text-stone-600 placeholder:text-stone-300 focus:outline-none border border-transparent focus:border-stone-100 transition-all resize-none h-20"
                        />
                        <button 
                          onClick={() => generateAiInsight(selectedMood || 'calm', userIntention)}
                          disabled={isLoadingAi || !userIntention.trim()}
                          className="absolute bottom-3 right-3 p-2 bg-stone-900 text-white rounded-xl shadow-lg hover:bg-stone-800 transition-all disabled:opacity-20 active:scale-90"
                        >
                          <RefreshCw size={14} className={cn(isLoadingAi && "animate-spin")} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-3">
                      <div className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">
                        幸运色: <span style={{ color: currentLot.hexColor }}>{currentLot.luckyColor}</span>
                      </div>
                      <div className="w-1 h-1 bg-stone-200 rounded-full" />
                      <div className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">
                        幸运数: <span className="text-stone-700">{currentLot.luckyNumber}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => setShowShareModal(true)}
                      className="mt-6 flex items-center gap-2 mx-auto text-[10px] uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-colors"
                    >
                      <Share2 size={12} /> 分享启示
                    </button>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-10">
                    {[
                      { key: 'eat', icon: Utensils, label: '今日食', color: 'text-orange-500', bg: 'bg-orange-50' },
                      { key: 'wear', icon: Shirt, label: '今日穿', color: 'text-blue-500', bg: 'bg-blue-50' },
                      { key: 'use', icon: Sparkles, label: '今日用', color: 'text-emerald-500', bg: 'bg-emerald-50' },
                      { key: 'action', icon: Target, label: '今日行', color: 'text-purple-500', bg: 'bg-purple-50' }
                    ].map((item) => {
                      const data = currentRecommendation[item.key as keyof Recommendation];
                      return (
                        <motion.div 
                          key={item.key} 
                          whileHover={{ x: 4 }}
                          onClick={() => setSelectedDetail({ ...item, ...data })}
                          className="flex gap-6 cursor-pointer group"
                        >
                          <div className={cn("w-14 h-14 rounded-[2rem] flex items-center justify-center shrink-0 shadow-sm transition-all group-hover:scale-110", item.bg, item.color)}>
                            <item.icon size={28} />
                          </div>
                          <div className="flex-1 pt-1">
                            <h3 className="text-stone-400 text-[10px] uppercase tracking-[0.2em] mb-2 font-bold flex items-center gap-2">
                              {item.label}
                              <div className="h-px flex-1 bg-stone-100" />
                            </h3>
                            <h4 className="text-stone-800 font-serif text-lg mb-2 leading-tight group-hover:text-stone-600 transition-colors">{data.title}</h4>
                            <p className="text-stone-500 text-sm leading-relaxed line-clamp-2">{data.description}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  <button 
                    onClick={reset}
                    className="w-full py-5 bg-stone-100 text-stone-500 rounded-[2rem] flex items-center justify-center gap-3 text-sm font-medium hover:bg-stone-200 transition-all"
                  >
                    <RefreshCw size={18} />
                    重新抽签
                  </button>
                </div>
              )}

              {activeTab === 'todo' && (
                <div className="space-y-8">
                  <form onSubmit={addTodo} className="relative">
                    <input 
                      type="text" 
                      value={newTodo}
                      onChange={(e) => setNewTodo(e.target.value)}
                      placeholder="添加今日任务..."
                      className="w-full bg-white border border-stone-100 rounded-3xl px-6 py-5 pr-16 text-stone-700 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200 shadow-sm"
                    />
                    <button 
                      type="submit"
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-stone-900 text-white rounded-2xl flex items-center justify-center hover:bg-stone-800 transition-all"
                    >
                      <Plus size={20} />
                    </button>
                  </form>

                  <div className="space-y-3">
                    {todos.length === 0 ? (
                      <div className="text-center py-20 opacity-30">
                        <CheckSquare size={48} className="mx-auto mb-4" />
                        <p className="text-sm tracking-widest uppercase">清单空空如也</p>
                      </div>
                    ) : (
                      todos.map((todo) => (
                        <motion.div 
                          layout
                          key={todo.id}
                          className="bg-white p-4 rounded-3xl border border-stone-50 flex flex-col gap-3 shadow-sm"
                        >
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => toggleTodo(todo.id)}
                              className={cn("shrink-0 transition-colors", todo.completed ? "text-emerald-500" : "text-stone-300")}
                            >
                              {todo.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                            </button>
                            <span className={cn("flex-1 text-stone-700 transition-all", todo.completed && "line-through opacity-40")}>
                              {todo.text}
                            </span>
                            <button 
                              onClick={() => deleteTodo(todo.id)}
                              className="text-stone-200 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>

                          {todo.completed && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="pl-10 flex flex-col gap-4 border-t border-stone-50 pt-3"
                            >
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold flex items-center gap-1">
                                    <Moon size={10} /> 完成时间
                                  </span>
                                  <input 
                                    type="time" 
                                    value={todo.completionTime || ''}
                                    onChange={(e) => updateTodoMetric(todo.id, { completionTime: e.target.value })}
                                    className="text-xs bg-stone-50 px-2 py-1 rounded-lg text-stone-600 focus:outline-none"
                                  />
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold flex items-center gap-1 whitespace-nowrap shrink-0">
                                    <Smile size={10} /> 完成心情
                                  </span>
                                  <div className="flex gap-1 overflow-x-auto no-scrollbar">
                                    {MOODS.map(m => (
                                      <button
                                        key={m.id}
                                        onClick={() => updateTodoMetric(todo.id, { completionMood: m.id })}
                                        className={cn(
                                          "p-1.5 rounded-lg transition-all shrink-0",
                                          todo.completionMood === m.id ? cn(m.bg, m.color) : "text-stone-200 hover:bg-stone-50"
                                        )}
                                      >
                                        <m.icon size={14} />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'review' && (
                <div className="space-y-6">
                  {/* Progress Summary Card */}
                  <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mb-1">今日进度</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-serif text-stone-800">
                          {todos.filter(t => t.completed).length} / {todos.length}
                        </span>
                        <span className="text-xs text-stone-400">任务已完成</span>
                      </div>
                    </div>
                    <div className="w-16 h-16 relative flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          className="text-stone-50"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          strokeDasharray={175.9}
                          strokeDashoffset={175.9 - (175.9 * (todos.length > 0 ? todos.filter(t => t.completed).length / todos.length : 0))}
                          strokeLinecap="round"
                          className="text-stone-900 transition-all duration-1000"
                        />
                      </svg>
                      <span className="absolute text-[10px] font-bold text-stone-900">
                        {todos.length > 0 ? Math.round((todos.filter(t => t.completed).length / todos.length) * 100) : 0}%
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 relative">
                    <h3 className="text-stone-400 text-[10px] uppercase tracking-[0.2em] mb-6 font-bold flex items-center gap-2">
                      今日感悟
                      <div className="h-px flex-1 bg-stone-100" />
                    </h3>
                    <textarea 
                      value={dailyReview}
                      onChange={(e) => setDailyReview(e.target.value)}
                      placeholder="写下今天的收获、遗憾或是想对自己说的话..."
                      className="w-full min-h-[300px] bg-transparent text-stone-700 placeholder:text-stone-300 focus:outline-none leading-relaxed resize-none"
                    />
                    
                    <button
                      onClick={() => generateDailyReflection()}
                      disabled={isLoadingAi || (!dailyReview && todos.length === 0)}
                      className="absolute bottom-6 right-6 p-3 bg-stone-900 text-white rounded-2xl shadow-xl hover:bg-stone-800 transition-all disabled:opacity-20 disabled:scale-95 flex items-center gap-2"
                    >
                      {isLoadingAi ? <Loader2 size={18} className="animate-spin" /> : <BrainCircuit size={18} />}
                      <span className="text-[10px] font-bold uppercase tracking-widest">AI 复盘</span>
                    </button>
                  </div>

                  <AnimatePresence>
                    {aiReport && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100 overflow-hidden"
                      >
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-stone-50 rounded-full -mr-16 -mt-16 opacity-50" />
                        
                        <h3 className="text-stone-400 text-[10px] uppercase tracking-[0.3em] mb-8 font-bold flex items-center gap-2">
                          灵魂成长报告
                          <div className="h-px flex-1 bg-stone-100" />
                        </h3>
                        
                        <div className="relative">
                          <p className="text-stone-700 text-base leading-loose font-serif italic whitespace-pre-wrap">
                            {aiReport}
                          </p>
                        </div>
                        
                        <div className="mt-10 flex justify-end">
                          <div className="w-12 h-px bg-stone-200" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <p className="text-center text-[10px] text-stone-300 uppercase tracking-widest">
                    记录是成长的足迹
                  </p>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-6">
                  <CalendarView 
                    history={history} 
                    onSelectDate={(date) => setSelectedHistoryDate(date)} 
                  />
                  
                  <AnimatePresence>
                    {selectedHistoryDate && history[selectedHistoryDate] && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 space-y-8"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-serif text-stone-800">{selectedHistoryDate} 的记录</h3>
                          <button onClick={() => setSelectedHistoryDate(null)} className="text-stone-300 hover:text-stone-500">
                            <X size={20} />
                          </button>
                        </div>

                        {history[selectedHistoryDate].lot ? (
                          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                            <div className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-2">当日签位</div>
                            <div className="text-xl font-serif text-stone-800" style={{ color: history[selectedHistoryDate].lot?.hexColor }}>
                              {history[selectedHistoryDate].lot?.title}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-stone-300 italic">这一天没有抽签</div>
                        )}

                        <div className="space-y-3">
                          <div className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">任务回顾</div>
                          {history[selectedHistoryDate].todos.length > 0 ? (
                            history[selectedHistoryDate].todos.map(t => (
                              <div key={t.id} className="flex items-center gap-3 text-sm">
                                {t.completed ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Circle size={14} className="text-stone-200" />}
                                <span className={cn("text-stone-600", t.completed && "line-through opacity-50")}>{t.text}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-stone-300 italic">没有记录任务</div>
                          )}
                        </div>

                        {history[selectedHistoryDate].reflection && (
                          <div className="space-y-2">
                            <div className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">当日感悟</div>
                            <p className="text-sm text-stone-600 leading-relaxed font-serif italic">
                              {history[selectedHistoryDate].reflection}
                            </p>
                          </div>
                        )}

                        {history[selectedHistoryDate].aiReport && (
                          <div className="space-y-4 pt-4 border-t border-stone-50">
                            <div className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">灵魂成长报告</div>
                            <p className="text-sm text-stone-500 leading-loose font-serif italic whitespace-pre-wrap">
                              {history[selectedHistoryDate].aiReport}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} lot={currentLot} />
      <DetailModal detail={selectedDetail} onClose={() => setSelectedDetail(null)} />

      {/* Bottom Navigation */}
      {step === 'dashboard' && (
        <motion.nav 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-sm bg-white/80 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-2 flex items-center justify-between shadow-2xl z-50"
        >
          {[
            { id: 'oracle', icon: LayoutDashboard, label: '启示' },
            { id: 'todo', icon: CheckSquare, label: '清单' },
            { id: 'review', icon: PenLine, label: '复盘' },
            { id: 'history', icon: Calendar, label: '历史' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DashboardTab)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3 rounded-3xl transition-all relative",
                activeTab === tab.id ? "text-stone-900" : "text-stone-300 hover:text-stone-500"
              )}
            >
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-stone-50 rounded-3xl -z-10"
                />
              )}
              <tab.icon size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </motion.nav>
      )}

      {/* Footer (Only on drawing/result/mood) */}
      {step !== 'dashboard' && (
        <motion.footer 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 text-stone-300 text-[10px] tracking-widest uppercase"
        >
          Designed for Serenity
        </motion.footer>
      )}
    </div>
  );
}

function CalendarView({ history, onSelectDate }: { history: Record<string, HistoryEntry>, onSelectDate: (date: string) => void }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date());
  
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const monthName = viewDate.toLocaleString('default', { month: 'long' });
  const year = viewDate.getFullYear();

  return (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-stone-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-serif text-stone-800">{monthName} {year}</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))}
            className="p-2 hover:bg-stone-50 rounded-full text-stone-400"
          >
            <ChevronRight size={16} className="rotate-180" />
          </button>
          <button 
            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))}
            className="p-2 hover:bg-stone-50 rounded-full text-stone-400"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['日', '一', '二', '三', '四', '五', '六'].map(d => (
          <div key={d} className="text-[10px] text-center text-stone-300 font-bold uppercase py-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {blanks.map(b => <div key={`b-${b}`} />)}
        {days.map(d => {
          const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const hasData = !!history[dateStr];
          const isToday = dateStr === today.toISOString().split('T')[0];
          const lotColor = history[dateStr]?.lot?.hexColor;

          return (
            <button
              key={d}
              onClick={() => hasData && onSelectDate(dateStr)}
              className={cn(
                "aspect-square flex flex-col items-center justify-center rounded-2xl text-xs transition-all relative",
                hasData ? "hover:bg-stone-50 cursor-pointer" : "text-stone-200 cursor-default",
                isToday && "border border-stone-900"
              )}
            >
              <span className={cn(hasData ? "text-stone-800 font-medium" : "text-stone-200")}>{d}</span>
              {hasData && (
                <div 
                  className="w-1 h-1 rounded-full mt-1" 
                  style={{ backgroundColor: lotColor || '#e5e7eb' }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ShareModal({ isOpen, onClose, lot }: { isOpen: boolean, onClose: () => void, lot: FortuneLot | null }) {
  if (!isOpen || !lot) return null;
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-sm rounded-[3rem] p-10 text-center shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-stone-300 hover:text-stone-500">
          <X size={24} />
        </button>
        <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: lot.hexColor + '20' }}>
          <Share2 className="text-stone-800" size={32} />
        </div>
        <h3 className="text-xl font-serif text-stone-800 mb-4">分享你的今日好运</h3>
        <p className="text-stone-400 text-xs mb-8 leading-relaxed">截图当前页面或复制链接，将这份来自星辰的启示传递给你的朋友。</p>
        <div className="grid grid-cols-2 gap-4">
          <button className="py-4 bg-stone-50 rounded-2xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition-all">复制链接</button>
          <button className="py-4 bg-stone-900 rounded-2xl text-xs font-bold text-white hover:bg-stone-800 transition-all">保存图片</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DetailModal({ detail, onClose }: { detail: any, onClose: () => void }) {
  if (!detail) return null;
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-stone-300 hover:text-stone-500">
          <X size={24} />
        </button>
        <div className={cn("w-20 h-20 rounded-[2.5rem] mb-8 flex items-center justify-center shadow-sm", detail.bg, detail.color)}>
          <detail.icon size={40} />
        </div>
        <h3 className="text-stone-400 text-[10px] uppercase tracking-[0.3em] mb-3 font-bold">{detail.label}</h3>
        <h2 className="text-2xl font-serif text-stone-800 mb-6">{detail.title}</h2>
        <div className="h-px w-12 bg-stone-100 mb-6" />
        <p className="text-stone-600 text-sm leading-relaxed font-serif italic">
          {detail.description}
        </p>
        <button 
          onClick={onClose}
          className="mt-10 w-full py-5 bg-stone-50 text-stone-500 rounded-[2rem] text-xs font-bold uppercase tracking-widest hover:bg-stone-100 transition-all"
        >
          返回启示
        </button>
      </motion.div>
    </motion.div>
  );
}
