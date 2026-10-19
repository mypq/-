import React from 'react';
import {
  Globe,
  PlusCircle,
  LogIn,
  Smartphone,
  Settings,
  HelpCircle,
  Droplets,
  Volume2,
  VolumeX,
  Edit3,
} from 'lucide-react';
import { sound } from '../../services/sound';

interface MainMenuProps {
  playerName: string;
  onSelectMode: (mode: 'online_lobby' | 'create_room' | 'join_room' | 'local' | 'settings' | 'how_to_play') => void;
  onEditName: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  playerName,
  onSelectMode,
  onEditName,
  isMuted,
  onToggleMute,
}) => {
  const handleAction = (mode: 'online_lobby' | 'create_room' | 'join_room' | 'local' | 'settings' | 'how_to_play') => {
    sound.playClick();
    onSelectMode(mode);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 sm:p-6 md:p-8 max-w-xl mx-auto z-10 select-none">
      {/* Top Bar: Player profile & Sound shortcut */}
      <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-4 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center font-black text-white text-base shadow-md shadow-cyan-600/30">
            {playerName.charAt(0).toUpperCase()}
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">اللاعب الحالي</div>
            <div className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
              <span>{playerName}</span>
              <button
                onClick={() => {
                  sound.playClick();
                  onEditName();
                }}
                title="تعديل الاسم"
                className="p-1 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            onToggleMute();
          }}
          title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
            isMuted
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40'
          }`}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Central Branding */}
      <div className="text-center my-auto py-4">
        <div className="inline-flex items-center justify-center w-20 h-20 mb-3 rounded-3xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 text-white shadow-xl shadow-cyan-500/20 border border-cyan-400/30">
          <Droplets className="w-11 h-11 drop-shadow" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-white drop-shadow-sm">
          تحدي الكوب
        </h1>
        <p className="text-xs sm:text-sm text-cyan-200/70 font-semibold mt-1">
          تناوب على الحنفية بحذر.. ولا تجعل الكوب يفيض!
        </p>
      </div>

      {/* Six Primary Buttons: Clear, touch-friendly, robust */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
        {/* 1. لعب أونلاين (Quick Lobby) */}
        <button
          onClick={() => handleAction('online_lobby')}
          className="group relative overflow-hidden p-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-[0.98] border border-cyan-400/30 text-white shadow-lg shadow-cyan-600/25 transition-all text-right flex items-center justify-between cursor-pointer sm:col-span-2"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/15 text-white">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="font-black text-base sm:text-lg">لعب أونلاين</div>
              <div className="text-xs text-cyan-100 font-medium">
                تحدي مباشر مع لاعبين عبر الإنترنت
              </div>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white/20">
            مباشر
          </span>
        </button>

        {/* 2. إنشاء غرفة */}
        <button
          onClick={() => handleAction('create_room')}
          className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 active:scale-[0.98] border border-slate-700/80 hover:border-cyan-500/50 text-white transition-all text-right flex items-center gap-3 cursor-pointer"
        >
          <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm sm:text-base text-slate-100">إنشاء غرفة</div>
            <div className="text-[11px] text-slate-400">احصل على رمز لمشاركته مع صديقك</div>
          </div>
        </button>

        {/* 3. الانضمام إلى غرفة */}
        <button
          onClick={() => handleAction('join_room')}
          className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 active:scale-[0.98] border border-slate-700/80 hover:border-cyan-500/50 text-white transition-all text-right flex items-center gap-3 cursor-pointer"
        >
          <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400">
            <LogIn className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm sm:text-base text-slate-100">الانضمام إلى غرفة</div>
            <div className="text-[11px] text-slate-400">أدخل رمز الغرفة الخاصة بصديقك</div>
          </div>
        </button>

        {/* 4. تجربة محلية (Offline Pass & Play) */}
        <button
          onClick={() => handleAction('local')}
          className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900 hover:from-emerald-900/60 hover:to-slate-800 active:scale-[0.98] border border-emerald-500/40 text-white transition-all text-right flex items-center gap-3 cursor-pointer sm:col-span-2 shadow-md shadow-emerald-950/30"
        >
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="font-black text-sm sm:text-base text-emerald-200 flex items-center justify-between">
              <span>تجربة محلية (بدون إنترنت)</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300">
                جاهزة فوراً
              </span>
            </div>
            <div className="text-[11px] text-emerald-300/80">
              جرّب حركة الماء والتناوب بمفردك أو مع صديق بجانبك على الهاتف نفسه
            </div>
          </div>
        </button>

        {/* 5. الإعدادات */}
        <button
          onClick={() => handleAction('settings')}
          className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 active:scale-[0.98] border border-slate-800 hover:border-slate-700 text-slate-200 transition-all text-right flex items-center gap-2.5 cursor-pointer"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-xs sm:text-sm">الإعدادات</span>
        </button>

        {/* 6. طريقة اللعب */}
        <button
          onClick={() => handleAction('how_to_play')}
          className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 active:scale-[0.98] border border-slate-800 hover:border-slate-700 text-slate-200 transition-all text-right flex items-center gap-2.5 cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-xs sm:text-sm">طريقة اللعب</span>
        </button>
      </div>
    </div>
  );
};
