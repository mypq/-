import React, { useState, useEffect } from 'react';
import { LogIn, ArrowRight, RefreshCw, KeyRound, Globe } from 'lucide-react';
import { sound } from '../../services/sound';
import { OpenRoomSummary } from '../../types/game';

interface JoinRoomModalProps {
  onJoinCode: (code: string) => void;
  onBack: () => void;
  error?: string | null;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  onJoinCode,
  onBack,
  error,
}) => {
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [openRooms, setOpenRooms] = useState<OpenRoomSummary[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const fetchOpenRooms = async () => {
    setLoadingRooms(true);
    try {
      const res = await fetch('/api/rooms/open');
      if (res.ok) {
        const data = await res.json();
        setOpenRooms(data.rooms || []);
      }
    } catch {
      // Ignore network errors in offline/local
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchOpenRooms();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setLocalError('يرجى إدخال رمز الغرفة المكون من 5 أحرف أو أرقام.');
      return;
    }
    setLocalError(null);
    onJoinCode(cleanCode);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-md p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-center">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800 text-right">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <LogIn className="w-5 h-5 text-blue-400" />
              الانضمام إلى غرفة
            </h2>
            <p className="text-xs text-slate-400">أدخل الرمز للمنافسة مباشرة</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="text-right">
            <label className="block text-xs font-bold text-slate-300 mb-2">
              رمز الغرفة (5 خانات)
            </label>
            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  if (localError) setLocalError(null);
                }}
                placeholder="مثال: KOB82"
                maxLength={8}
                autoFocus
                className="w-full px-4 py-3.5 bg-slate-950/80 border border-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 rounded-xl text-white placeholder-slate-600 font-mono text-center tracking-widest text-lg font-black uppercase outline-none transition-all"
              />
              <KeyRound className="w-5 h-5 text-slate-600 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {(localError || error) && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-xl text-right">
              {localError || error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white font-extrabold text-base rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-5 h-5" />
            دخول الغرفة
          </button>
        </form>

        {/* Public open waiting rooms */}
        <div className="text-right pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              الغرف المفتوحة حالياً
            </span>
            <button
              onClick={() => {
                sound.playClick();
                fetchOpenRooms();
              }}
              disabled={loadingRooms}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${loadingRooms ? 'animate-spin' : ''}`} />
              تحديث
            </button>
          </div>

          {openRooms.length === 0 ? (
            <div className="p-4 bg-slate-950/40 rounded-xl text-center text-xs text-slate-500">
              لا توجد غرف انتظار مفتوحة حالياً، أنشئ غرفة وادعُ أصدقاءك!
            </div>
          ) : (
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {openRooms.map((r) => (
                <div
                  key={r.code}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:border-cyan-500/40 text-xs"
                >
                  <div>
                    <span className="font-bold text-white ml-2">{r.hostName}</span>
                    <span className="font-mono text-cyan-400 text-[11px]">({r.code})</span>
                  </div>
                  <button
                    onClick={() => {
                      sound.playClick();
                      onJoinCode(r.code);
                    }}
                    className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] transition-all cursor-pointer"
                  >
                    انضمام
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
