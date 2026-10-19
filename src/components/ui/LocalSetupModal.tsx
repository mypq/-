import React, { useState } from 'react';
import { Smartphone, Play, ArrowRight, User } from 'lucide-react';
import { sound } from '../../services/sound';

interface LocalSetupModalProps {
  p1Name: string;
  onStart: (p1Name: string, p2Name: string) => void;
  onBack: () => void;
}

export const LocalSetupModal: React.FC<LocalSetupModalProps> = ({
  p1Name,
  onStart,
  onBack,
}) => {
  const [p2Name, setP2Name] = useState('المتحدي (محلي)');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    onStart(p1Name, p2Name.trim() || 'اللاعب 2');
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-md p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-center">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-800 text-right">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-400" />
              وضع التجربة المحلية
            </h2>
            <p className="text-xs text-slate-400">لعب مباشر ومستقل دون الحاجة للإنترنت</p>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onBack();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mb-5 text-right">
          {/* Player 1 info */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">اللاعب الأول (أنت)</span>
            <div className="font-bold text-white text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              <span>{p1Name}</span>
            </div>
          </div>

          {/* Player 2 name input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              اسم اللاعب الثاني (التجريبي أو الصديق بجانبك)
            </label>
            <input
              type="text"
              value={p2Name}
              onChange={(e) => setP2Name(e.target.value)}
              maxLength={20}
              placeholder="مثال: المتحدي، الصديق..."
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700 focus:border-emerald-400 rounded-xl text-white text-sm outline-none transition-all"
            />
          </div>

          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 leading-relaxed">
            ستتناوب أنت واللاعب الثاني على نفس الهاتف للتحكم بالحنفية وتعبئة الكوب المشترك واختبار لحظات الفيضان الحماسية!
          </div>

          <button
            type="submit"
            className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-base rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            بدء التجربة المحلية الآن
          </button>
        </form>
      </div>
    </div>
  );
};
