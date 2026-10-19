import React, { useState } from 'react';
import { Droplets, Sparkles, UserCheck } from 'lucide-react';
import { sound } from '../../services/sound';

interface WelcomeModalProps {
  onSaveName: (name: string) => void;
  initialName?: string;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onSaveName, initialName = '' }) => {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();

    const trimmed = name.trim();
    if (!trimmed) {
      setError('يرجى كتابة اسمك أولاً قبل المتابعة.');
      return;
    }
    if (trimmed.length > 20) {
      setError('الاسم طويل جداً، يرجى اختيار اسم أقل من 20 حرفاً.');
      return;
    }

    setError(null);
    onSaveName(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-md p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-center overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Logo icon */}
        <div className="relative inline-flex items-center justify-center w-20 h-20 mb-5 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 text-white shadow-lg shadow-cyan-500/30">
          <Droplets className="w-10 h-10 animate-bounce" />
          <div className="absolute -top-1 -right-1 p-1 bg-amber-400 text-slate-950 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>

        <h1 className="text-3xl font-black tracking-tight text-white mb-2">
          تحدي الكوب
        </h1>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          أهلاً بك في لعبة التحدي الواقعية لتعبئة كوب الماء. مَن يفيض الكوب في دوره يخسر التحدي!
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-right">
            <label className="block text-xs font-bold text-slate-300 mb-2">
              اسمك في اللعبة
            </label>
            <input
              type="text"
              dir="auto"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="اكتب اسمك هنا (مثال: البطل، علي، سارة)..."
              maxLength={20}
              autoFocus
              className="w-full px-4 py-3.5 bg-slate-950/80 border border-slate-700 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 rounded-xl text-white placeholder-slate-500 text-base outline-none transition-all"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-xl text-right">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-[0.98] text-white font-extrabold text-base rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserCheck className="w-5 h-5" />
            حفظ الاسم والمتابعة
          </button>
        </form>

        <p className="text-[11px] text-slate-500 mt-5">
          يتم حفظ الاسم محلياً على جهازك ويمكنك تغييره لاحقاً من الإعدادات
        </p>
      </div>
    </div>
  );
};
