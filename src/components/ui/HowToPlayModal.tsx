import React from 'react';
import { HelpCircle, ArrowRight, Droplets, ShieldAlert, Award, Clock } from 'lucide-react';
import { sound } from '../../services/sound';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-right overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-slate-800 text-cyan-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">طريقة اللعب وقواعد التحدي</h2>
              <p className="text-xs text-slate-400">تحدي الكوب — تنافس الذكاء والدقة والتحكم</p>
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

        {/* Steps */}
        <div className="space-y-3.5 text-xs sm:text-sm text-slate-300">
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 shrink-0">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white mb-0.5">1. الكوب المشترك والحنفية الواحدة</div>
              <p className="text-slate-400 leading-relaxed text-xs">
                يتناوب اللاعبان على تشغيل الحنفية نفسها لتعبئة كوب زجاجي واحد. مستوى الماء مستمر بين الجولات ولا يعود للصفر بعد كل دور!
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white mb-0.5">2. السيطرة وتوقيت الإيقاف</div>
              <p className="text-slate-400 leading-relaxed text-xs">
                في دورك، اضغط مع الاستمرار لتشغيل الحنفية وصب الماء. بمجرد أن تفلت الزر أو تنقر عليه للإيقاف، ينتهي دورك وينتقل الدور مباشرة إلى خصمك.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white mb-0.5">3. حد الفيضان وقاعدة الخسارة</div>
              <p className="text-slate-400 leading-relaxed text-xs">
                إذا تجاوز الماء حافة الكوب (100%) أثناء تشغيلك للحنفية، يفيض الماء فوراً وتخسر الجولة، ويحصل خصمك على نقطة الفوز!
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white mb-0.5">4. استراتيجية المحترفين للمكسب</div>
              <p className="text-slate-400 leading-relaxed text-xs">
                أفضل استراتيجية هي ملء الكوب إلى أقصى حد ممكن دون أن يفيض (مثلاً عند 95% إلى 99%)؛ لتترك خصمك أمام خيار مستحيل يضطره إلى التورط في الفيضان!
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="w-full mt-6 py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-sm rounded-xl transition-all cursor-pointer shadow-lg shadow-cyan-600/20"
        >
          فهمت القواعد، فلنبدأ اللعب!
        </button>
      </div>
    </div>
  );
};
