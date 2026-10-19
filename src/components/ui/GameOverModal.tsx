import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Home, AlertTriangle, Sparkles } from 'lucide-react';
import { MatchState } from '../../types/game';
import { sound } from '../../services/sound';

interface GameOverModalProps {
  state: MatchState;
  myPlayerId: string | null;
  isLocalMode: boolean;
  onRematch: () => void;
  onBackToMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  state,
  myPlayerId,
  isLocalMode,
  onRematch,
  onBackToMenu,
}) => {
  const isWinner = isLocalMode
    ? true // In local mode, both players are local, show game result
    : Boolean(myPlayerId && state.winnerPlayerId === myPlayerId);

  const winner = state.players.find(p => p.id === state.winnerPlayerId);
  const loser = state.players.find(p => p.id === state.loserPlayerId);

  const winnerName = state.winnerName || winner?.name || 'الفائز';
  const loserName = state.loserName || loser?.name || 'الخاسر';

  // Opponent rematch status in online
  const myPlayer = state.players.find(p => p.id === myPlayerId);
  const otherPlayer = state.players.find(p => p.id !== myPlayerId);
  const hasOpponentRequestedRematch = Boolean(otherPlayer?.rematchRequested);
  const haveIRequestedRematch = Boolean(myPlayer?.rematchRequested);

  useEffect(() => {
    // Fire celebratory confetti burst for winner
    if (isWinner) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#0284c7', '#3b82f6', '#f59e0b', '#10b981'],
        });
      } catch {}
    }
  }, [isWinner]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="relative w-full max-w-md p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-center overflow-hidden">
        {/* Glow accent */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full blur-3xl pointer-events-none ${
            isWinner ? 'bg-cyan-500/20' : 'bg-rose-500/20'
          }`}
        />

        {/* Hero Result Icon */}
        <div
          className={`relative inline-flex items-center justify-center w-20 h-20 mb-4 rounded-3xl text-white shadow-xl ${
            isWinner
              ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-amber-500/30'
              : 'bg-gradient-to-tr from-rose-600 to-red-500 shadow-rose-600/30'
          }`}
        >
          {isWinner ? (
            <Trophy className="w-10 h-10" />
          ) : (
            <AlertTriangle className="w-10 h-10" />
          )}
          <div className="absolute -top-1 -right-1 p-1 bg-white text-slate-950 rounded-full shadow">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Victory/Defeat Announcement */}
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">
          {isLocalMode
            ? 'فاض الكوب وانتهت الجولة!'
            : isWinner
            ? 'مبروك! لقد فزت بالتحدي!'
            : 'فاض الكوب في دورك وخسرت الجولة!'}
        </h2>

        <p className="text-slate-400 text-xs sm:text-sm mb-6 leading-relaxed">
          {isLocalMode
            ? `فاض الكوب في دور (${loserName})، ليحصد (${winnerName}) نقطة الفوز المستحقة!`
            : isWinner
            ? `تجاوز خصمك (${loserName}) حد الكوب بنجاح! فوز مستحق لك.`
            : `تسببت بفيضان الماء من الحافة، فاز خصمك (${winnerName}) بهذه الجولة.`}
        </p>

        {/* Players Match Scoreboard Card */}
        <div className="grid grid-cols-2 gap-3 p-3.5 mb-6 rounded-2xl bg-slate-950/80 border border-slate-800 text-right">
          {/* Winner Card */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <div className="text-[10px] font-bold text-amber-400 mb-0.5">الفائز</div>
            <div className="font-extrabold text-sm text-white truncate">{winnerName}</div>
            <div className="text-xs text-amber-300 font-bold mt-1">
              النقاط: {winner?.score || 1}
            </div>
          </div>

          {/* Loser Card */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 opacity-80">
            <div className="text-[10px] font-bold text-rose-400 mb-0.5">الخاسر (فاض الكوب)</div>
            <div className="font-extrabold text-sm text-slate-300 truncate">{loserName}</div>
            <div className="text-xs text-slate-400 font-semibold mt-1">
              النقاط: {loser?.score || 0}
            </div>
          </div>
        </div>

        {/* Online rematch note if opponent requested */}
        {!isLocalMode && hasOpponentRequestedRematch && !haveIRequestedRematch && (
          <div className="p-2.5 mb-4 bg-cyan-500/15 border border-cyan-400/40 rounded-xl text-xs font-bold text-cyan-300">
            الخصم يطلب إعادة الجولة الآن! اضغط زر «إعادة الجولة» للموافقة والبدء فوراً.
          </div>
        )}

        {!isLocalMode && haveIRequestedRematch && !hasOpponentRequestedRematch && (
          <div className="p-2.5 mb-4 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300">
            تم إرسال طلب إعادة الجولة.. بانتظار موافقة الخصم...
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => {
              sound.playClick();
              onRematch();
            }}
            disabled={!isLocalMode && haveIRequestedRematch}
            className={`w-full py-4 px-6 rounded-xl font-extrabold text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              !isLocalMode && haveIRequestedRematch
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-[0.98] text-white shadow-cyan-500/25'
            }`}
          >
            <RefreshCw className="w-5 h-5" />
            <span>
              {!isLocalMode && haveIRequestedRematch
                ? 'بانتظار موافقة الخصم...'
                : 'إعادة الجولة'}
            </span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onBackToMenu();
            }}
            className="w-full py-3.5 px-6 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>العودة للقائمة الرئيسية</span>
          </button>
        </div>
      </div>
    </div>
  );
};
