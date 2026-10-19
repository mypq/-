import React, { useState } from 'react';
import { Settings, Volume2, VolumeX, Monitor, ArrowRight, UserCheck } from 'lucide-react';
import { GraphicQuality, SoundSettings } from '../../types/game';
import { sound } from '../../services/sound';

interface SettingsModalProps {
  playerName: string;
  onUpdateName: (name: string) => void;
  soundSettings: SoundSettings;
  onUpdateSound: (settings: SoundSettings) => void;
  quality: GraphicQuality;
  onUpdateQuality: (quality: GraphicQuality) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  playerName,
  onUpdateName,
  soundSettings,
  onUpdateSound,
  quality,
  onUpdateQuality,
  onClose,
}) => {
  const [name, setName] = useState(playerName);
  const [nameSaved, setNameSaved] = useState(false);

  const handleNameSave = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    const clean = name.trim();
    if (clean && clean.length <= 20) {
      onUpdateName(clean);
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-right overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-slate-800 text-cyan-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">إعدادات اللعبة</h2>
              <p className="text-xs text-slate-400">تخصيص الصوت والرسومات والاسم</p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-5">
          {/* 1. Name Change Section */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <label className="block text-xs font-bold text-slate-300 mb-2">
              اسم اللاعب
            </label>
            <form onSubmit={handleNameSave} className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl text-white text-sm outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
              >
                <UserCheck className="w-3.5 h-3.5" />
                حفظ
              </button>
            </form>
            {nameSaved && (
              <span className="text-[11px] text-emerald-400 font-bold block mt-1.5">
                تم حفظ الاسم الجديد بنجاح!
              </span>
            )}
          </div>

          {/* 2. Sound Settings Section */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                {soundSettings.masterMute ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                )}
                كتم الصوت بالكامل
              </span>
              <input
                type="checkbox"
                checked={soundSettings.masterMute}
                onChange={(e) => {
                  sound.playClick();
                  onUpdateSound({ ...soundSettings, masterMute: e.target.checked });
                }}
                className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
              />
            </div>

            {/* SFX Volume */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>المؤثرات الصوتية والماء</span>
                <span>{Math.round(soundSettings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                disabled={soundSettings.masterMute}
                value={soundSettings.sfxVolume}
                onChange={(e) =>
                  onUpdateSound({
                    ...soundSettings,
                    sfxVolume: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-cyan-500 cursor-pointer disabled:opacity-40"
              />
            </div>

            {/* Music Volume */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>الموسيقى التصويرية التفاعلية</span>
                <span>{Math.round(soundSettings.musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                disabled={soundSettings.masterMute}
                value={soundSettings.musicVolume}
                onChange={(e) =>
                  onUpdateSound({
                    ...soundSettings,
                    musicVolume: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-cyan-500 cursor-pointer disabled:opacity-40"
              />
            </div>
          </div>

          {/* 3. Graphic Quality Section */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2 mb-3">
              <Monitor className="w-4 h-4 text-cyan-400" />
              الجودة الرسومية والأداء
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'low', label: 'منخفضة', desc: 'سريعة جداً' },
                  { id: 'medium', label: 'متوسطة', desc: 'متوازنة' },
                  { id: 'high', label: 'عالية', desc: 'أقصى واقعية' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    sound.playClick();
                    onUpdateQuality(opt.id);
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    quality === opt.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-black'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold">{opt.label}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="w-full mt-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl transition-all cursor-pointer"
        >
          تم وإغلاق الإعدادات
        </button>
      </div>
    </div>
  );
};
