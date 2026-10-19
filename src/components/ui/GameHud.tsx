import React, { useState, useEffect } from 'react';
import {
  Droplet,
  Flame,
  Menu,
  X,
  Volume2,
  VolumeX,
  LogOut,
  Play,
  ShieldAlert,
} from 'lucide-react';
import { MatchState } from '../../types/game';
import { sound } from '../../services/sound';

interface GameHudProps {
  state: MatchState;
  myPlayerId: string | null;
  isLocalMode: boolean;
  onStartTap: () => void;
  onStopTap: () => void;
  onLeaveGame: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  state,
  myPlayerId,
  isLocalMode,
  onStartTap,
  onStopTap,
  onLeaveGame,
  isMuted,
  onToggleMute,
}) => {
  const [showDrawer, setShowDrawer] = useState(false);
  const [roundBannerVisible, setRoundBannerVisible] = useState(true);

  const p1 = state.players[0];
  const p2 = state.players[1];

  const isMyTurn = isLocalMode
    ? true
    : Boolean(myPlayerId && state.currentTurnPlayerId === myPlayerId);

  const activePlayer = state.players.find((p) => p.id === state.currentTurnPlayerId);
  const waterPercent = Math.max(0, Math.min(100, state.waterLevel));
  const isNearOverflow = waterPercent >= 80;

  useEffect(() => {
    setRoundBannerVisible(true);
    const timer = setTimeout(() => {
      setRoundBannerVisible(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [state.roundNumber]);

  // دوال التحكم بالضغط المستمر (Hold to pour, Release to stop)
  const handlePressStart = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!isMyTurn || state.status !== 'playing' || state.isOverflowed || state.isTapOpen) return;
    onStartTap();
  };

  const handlePressEnd = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!isMyTurn || state.status !== 'playing' || !state.isTapOpen) return;
    onStopTap();
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between pointer-events-none select-none p-3 sm:p-4">
      {/* ======================================================== */}
      {/* 1. SLIM FLOATING TOP BAR */}
      {/* ======================================================== */}
      <div className="w-full max-w-lg mx-auto pointer-events-auto flex items-center justify-between gap-2 bg-slate-900/85 backdrop-blur-md border border-slate-800/80 rounded-full px-3 py-1.5 shadow-lg">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all text-xs font-bold ${
            state.currentTurnPlayerId === p1?.id
              ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400'
              : 'text-slate-400 opacity-70'
          }`}
        >
          <span className="truncate max-w-[85px] sm:max-w-[120px]">
            {p1?.name || 'اللاعب 1'}
          </span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[11px] font-mono text-white">
            {p1?.score || 0}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-950/70 border border-slate-800">
          <Droplet
            className={`w-3.5 h-3.5 transition-colors ${
              isNearOverflow ? 'text-rose-400' : 'text-cyan-400'
            }`}
          />
          <span
            className={`font-mono text-xs sm:text-sm font-black transition-colors ${
              isNearOverflow ? 'text-rose-300 font-black' : 'text-slate-200'
            }`}
          >
            {waterPercent.toFixed(1)}%
          </span>
          {isNearOverflow && (
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          )}
        </div>

        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all text-xs font-bold ${
            state.currentTurnPlayerId === p2?.id
              ? 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-400'
              : 'text-slate-400 opacity-70'
          }`}
        >
          <span className="truncate max-w-[85px] sm:max-w-[120px]">
            {p2?.name || 'اللاعب 2'}
          </span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[11px] font-mono text-white">
            {p2?.score || 0}
          </span>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            setShowDrawer(true);
          }}
          title="القائمة والإعدادات"
          className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* ======================================================== */}
      {/* 2. TRANSIENT FLOATING ALERTS */}
      {/* ======================================================== */}
      <div className="pointer-events-none flex flex-col items-center justify-center my-auto">
        {roundBannerVisible && (
          <div className="px-4 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/40 text-cyan-200 text-xs font-bold shadow-xl animate-bounce">
            الجولة {state.roundNumber} — ابدأ التعبئة بحذر!
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 3. BOTTOM CONTROL AREA (Hold-to-Pour Button) */}
      {/* ======================================================== */}
      <div className="w-full max-w-sm mx-auto pointer-events-auto space-y-2 pb-2">
        <div className="text-center">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm transition-all ${
              isMyTurn
                ? state.isTapOpen
                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                  : 'bg-cyan-500/15 border border-cyan-400/30 text-cyan-200'
                : 'bg-slate-900/80 border border-slate-800 text-slate-400'
            }`}
          >
            {isMyTurn ? (
              state.isTapOpen ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>الماء يتدفق! ارفع إصبعك للإيقاف والتمرير</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>
                    {isLocalMode
                      ? `دورك الآن (${activePlayer?.name}) - اضغط باستمرار`
                      : 'دورك الآن - اضغط باستمرار للصب'}
                  </span>
                </>
              )
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>دور الخصم ({activePlayer?.name})</span>
              </>
            )}
          </span>
        </div>

        {/* زر الضغط المستمر (Hold to pour / Release to stop) */}
        <button
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          onTouchCancel={handlePressEnd}
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          disabled={!isMyTurn || state.status !== 'playing' || state.isOverflowed}
          className={`w-full py-4 px-6 rounded-2xl font-black text-base flex items-center justify-center gap-2.5 transition-all shadow-xl active:scale-[0.98] cursor-pointer touch-none ${
            !isMyTurn
              ? 'bg-slate-900/60 border border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              : state.isTapOpen
              ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-rose-600/30 border-2 border-rose-400 ring-2 ring-rose-500/20 animate-pulse'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25 border-2 border-cyan-300'
          }`}
        >
          {state.isTapOpen ? (
            <>
              <ShieldAlert className="w-5 h-5 animate-spin" />
              <span>أفلت إصبعك الآن للإيقاف!</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span>
                {isMyTurn ? 'اضغط باستمـــرار للصب' : 'انتظر دور الخصم'}
              </span>
            </>
          )}
        </button>
      </div>

      {/* ======================================================== */}
      {/* 4. SECONDARY INFO DRAWER */}
      {/* ======================================================== */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm pointer-events-auto">
          <div className="relative w-full max-w-xs p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-right space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-extrabold text-sm text-white">معلومات وخيارات اللعب</span>
              <button
                onClick={() => {
                  sound.playClick();
                  setShowDrawer(false);
                }}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300">
                <span>نمط اللعب:</span>
                <span className="font-bold text-cyan-400">
                  {isLocalMode ? 'تجربة محلية' : `غرفة (${state.code || 'أونلاين'})`}
                </span>
              </div>

              <div className="flex justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300">
                <span>الجولة الحالية:</span>
                <span className="font-bold text-white">{state.roundNumber}</span>
              </div>

              <button
                onClick={() => {
                  sound.playClick();
                  onToggleMute();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer font-bold"
              >
                <span className="flex items-center gap-2">
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                  <span>الصوت</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  {isMuted ? 'مكتوم' : 'مفعّل'}
                </span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setShowDrawer(false);
                  onLeaveGame();
                }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 font-bold transition-all cursor-pointer mt-2"
              >
                <LogOut className="w-4 h-4" />
                <span>الانسحاب والعودة للقائمة</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
