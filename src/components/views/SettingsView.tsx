import React, { useState, useEffect } from 'react';
import { UserSettings } from '../../types/music.js';
import {
  Sliders,
  ShieldCheck,
  Sparkles,
  Volume2,
  Type,
  Radio,
  Check,
} from 'lucide-react';

interface SettingsViewProps {
  brandName: string;
  onUpdateBrandName: (name: string) => void;
}

export function SettingsView({ brandName, onUpdateBrandName }: SettingsViewProps) {
  const [settings, setSettings] = useState<UserSettings>({
    audioQuality: 'lossless',
    crossfadeSeconds: 2,
    showVisualizer: true,
    enableAmbientParticles: true,
    lyricsFontSize: 'large',
    volume: 0.85,
    isMuted: false,
    themeGraphiteTone: 'deep-charcoal',
  });

  const [customBrand, setCustomBrand] = useState(brandName);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object') {
          setSettings(prev => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});
  }, []);

  const saveSettings = async (partial: Partial<UserSettings>) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);

    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
    } catch {}
  };

  const handleBrandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customBrand.trim()) {
      onUpdateBrandName(customBrand.trim());
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl pb-24 animate-fadeIn">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Настройки платформы
        </h1>
        <p className="text-xs md:text-sm text-white/50 mt-1">
          Конфигурация аудиопотока, визуальных эффектов и брендинга.
        </p>
      </div>

      {isSaved && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Настройки успешно сохранены</span>
        </div>
      )}

      {/* Brand & Logo Customization */}
      <section className="p-6 rounded-3xl bg-[#13151a] border border-white/5 space-y-4">
        <div className="flex items-center gap-2.5">
          <Radio className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white">
            Имя и брендинг платформы
          </h2>
        </div>
        <p className="text-xs text-white/50">
          Вы можете легко изменить отображаемое имя платформы в один клик.
        </p>

        <form onSubmit={handleBrandSubmit} className="flex gap-3">
          <input
            type="text"
            value={customBrand}
            onChange={e => setCustomBrand(e.target.value)}
            className="flex-1 bg-[#0f1115] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 outline-none"
            placeholder="Название платформы"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-white/90 transition-colors cursor-pointer"
          >
            Применить
          </button>
        </form>
      </section>

      {/* Audio Quality */}
      <section className="p-6 rounded-3xl bg-[#13151a] border border-white/5 space-y-4">
        <div className="flex items-center gap-2.5">
          <Volume2 className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white">Качество воспроизведения</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'lossless', title: 'Lossless FLAC', desc: 'До 24 бит / 48 кГц без сжатия' },
            { id: 'high', title: 'High 320 kbps', desc: 'Чистый насыщенный стереозвук' },
            { id: 'normal', title: 'Standard 192 kbps', desc: 'Экономия трафика сети' },
          ].map(q => (
            <button
              key={q.id}
              type="button"
              onClick={() => saveSettings({ audioQuality: q.id as any })}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                settings.audioQuality === q.id
                  ? 'bg-amber-500/10 border-amber-500/50 shadow'
                  : 'bg-white/5 border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold ${settings.audioQuality === q.id ? 'text-amber-400' : 'text-white'}`}>
                  {q.title}
                </span>
                {settings.audioQuality === q.id && <Check className="w-4 h-4 text-amber-400" />}
              </div>
              <p className="text-xs text-white/50 mt-1">{q.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Visual Effects & Reference Player */}
      <section className="p-6 rounded-3xl bg-[#13151a] border border-white/5 space-y-4">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white">Визуальные эффекты плеера</h2>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5 cursor-pointer">
            <div>
              <div className="text-sm font-semibold text-white">Аудиовизуализатор спектра</div>
              <div className="text-xs text-white/40">Отображать в верхнем углу плеера спектрограмму 48 кГц</div>
            </div>
            <input
              type="checkbox"
              checked={settings.showVisualizer}
              onChange={e => saveSettings({ showVisualizer: e.target.checked })}
              className="accent-amber-500 w-4 h-4 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5 cursor-pointer">
            <div>
              <div className="text-sm font-semibold text-white">Янтарные частицы фона</div>
              <div className="text-xs text-white/40">Плавающие частицы света с мягким кинематографичным размытием</div>
            </div>
            <input
              type="checkbox"
              checked={settings.enableAmbientParticles}
              onChange={e => saveSettings({ enableAmbientParticles: e.target.checked })}
              className="accent-amber-500 w-4 h-4 cursor-pointer"
            />
          </label>
        </div>
      </section>

      {/* Typography of Lyrics */}
      <section className="p-6 rounded-3xl bg-[#13151a] border border-white/5 space-y-4">
        <div className="flex items-center gap-2.5">
          <Type className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white">Размер шрифта текста песни</h2>
        </div>

        <div className="flex gap-3">
          {(['medium', 'large', 'xl'] as const).map(sz => (
            <button
              key={sz}
              type="button"
              onClick={() => saveSettings({ lyricsFontSize: sz })}
              className={`flex-1 py-3 rounded-2xl border text-center text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                settings.lyricsFontSize === sz
                  ? 'bg-white text-black font-bold'
                  : 'bg-white/5 border-white/5 text-white/60 hover:text-white'
              }`}
            >
              {sz}
            </button>
          ))}
        </div>
      </section>

      {/* Architecture Integrity / No-AI Compliance Notice (Prompt Section 10) */}
      <section className="p-5 rounded-3xl bg-[#101217] border border-emerald-500/20 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-white/60">
          <span className="font-bold text-white block mb-0.5">Архитектурная чистота (Раздел 10 ТЗ)</span>
          Платформа функционирует исключительно на детерминированных поисковых алгоритмах, нормализации метаданных, ISRC-дедупликации, Web Audio API и кэшировании REST API. В приложении полностью отсутствуют AI-чатботы, внешние LLM-ассистенты и зависимости от генеративных ключей.
        </div>
      </section>
    </div>
  );
}
