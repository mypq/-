import React, { useState } from 'react';
import { Copy, Check, Users, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { MatchState } from '../../types/game';
import { sound } from '../../services/sound';

interface LobbyRoomProps {
  roomCode: string;
  state: MatchState;
  myPlayerId: string | null;
  onLeaveRoom: () => void;
  countdown: number | null;
}

export const LobbyRoom: React.FC<LobbyRoomProps> = ({
  roomCode,
  state,
  myPlayerId,
  onLeaveRoom,
  countdown,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    sound.playClick();
    if (navigator.clipboard && roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const p1 = state.players[0];
  const p2 = state.players[1];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-center">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800 text-right">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              غرفة الانتظار
            </h2>
            <p className="text-xs text-slate-400">تحدي الكوب — مواجهة أونلاين</p>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onLeaveRoom();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            مغادرة الغرفة
          </button>
        </div>

        {/* Room Code Display Box */}
        <div className="p-4 sm:p-5 mb-6 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-cyan-500/30 shadow-inner">
          <div className="text-xs font-bold text-cyan-400 mb-1.5">
            رمز الغرفة الخاص بك
          </div>
          <div className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-white mb-3">
            {roomCode}
          </div>
          <button
            onClick={handleCopy}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300 font-bold text-xs transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>تم نسخ الرمز بنجاح!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>نسخ الرمز لمشاركته مع الخصم</span>
              </>
            )}
          </button>
        </div>

        {/* Players Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-right">
          {/* Player 1 (Host) */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-cyan-500/30 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300">
                منشئ الغرفة
              </span>
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="font-extrabold text-base text-white truncate">
              {p1 ? p1.name : 'اللاعب 1'}
              {p1?.id === myPlayerId && (
                <span className="text-xs text-cyan-400 font-normal mr-1.5">(أنت)</span>
              )}
            </div>
            <div className="text-xs text-emerald-400 font-semibold mt-1">
              متصل وجاهز للعب
            </div>
          </div>

          {/* Player 2 (Challenger) */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              p2
                ? 'bg-slate-800/80 border-blue-500/30'
                : 'bg-slate-950/40 border-dashed border-slate-700 text-slate-500'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                  p2 ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-400'
                }`}
              >
                الخصم المتحدي
              </span>
            </div>
            <div className="font-extrabold text-base text-white truncate">
              {p2 ? (
                <>
                  {p2.name}
                  {p2.id === myPlayerId && (
                    <span className="text-xs text-blue-400 font-normal mr-1.5">(أنت)</span>
                  )}
                </>
              ) : (
                'في انتظار انضمام الخصم...'
              )}
            </div>
            <div className="text-xs mt-1 font-semibold">
              {p2 ? (
                <span className="text-emerald-400">انضم وجاهز للمباراة!</span>
              ) : (
                <span className="text-amber-400/90 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 inline" />
                  أعطِ الرمز لصديقك للدخول
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Countdown Alert when both players are connected */}
        {countdown !== null && countdown > 0 && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-blue-500/20 border border-cyan-400/50 mb-3 animate-pulse">
            <div className="text-sm font-bold text-cyan-200">
              اكتمل اللاعبان! تبدأ المباراة خلال:
            </div>
            <div className="text-3xl font-black text-amber-300 mt-1">
              {countdown}
            </div>
          </div>
        )}

        <div className="text-xs text-slate-400 leading-relaxed">
          {p2
            ? 'اللاعبان جاهزان، يتم الآن نقل الطرفين إلى شاشة المباراة معاً...'
            : 'شارك رمز الغرفة أعلاه مع الطرف الآخر لينضم وتفتح المباراة تلقائياً.'}
        </div>
      </div>
    </div>
  );
};
