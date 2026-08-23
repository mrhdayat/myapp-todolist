'use client';

import React, { useState } from 'react';
import { Moon, Sun, Volume2, Sparkles, CalendarClock, RotateCcw, AlertTriangle, Palette, Check } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { ThemePalette, ThemeMode } from '@/types/task';
import { NeuModal } from '@/components/ui/NeuModal';
import { NeuToggle } from '@/components/ui/NeuToggle';
import { NeuButton } from '@/components/ui/NeuButton';
import { NeuCard } from '@/components/ui/NeuCard';
import { IconWrapper } from '@/components/ui/IconWrapper';

const THEMES: {
  id: ThemePalette;
  name: string;
  desc: string;
  lightBase: string;
  lightRaised: string;
  lightAccent: string;
  darkBase: string;
  darkRaised: string;
  darkAccent: string;
}[] = [
  {
    id: 'warm-clay',
    name: 'Warm Clay',
    desc: 'Porcelain & Taupe + Cobalt',
    lightBase: '#EDE7DC',
    lightRaised: '#F6F1E7',
    lightAccent: '#2F5FE0',
    darkBase: '#221E19',
    darkRaised: '#2A251F',
    darkAccent: '#6C8CFF',
  },
  {
    id: 'blob-pastel',
    name: 'Blob Pastel',
    desc: 'Candy Soft 3D Bubble & Rose',
    lightBase: '#F5ECE6',
    lightRaised: '#FCF5F1',
    lightAccent: '#E85D75',
    darkBase: '#231A1E',
    darkRaised: '#2D2227',
    darkAccent: '#FF758F',
  },
  {
    id: 'ocean-breeze',
    name: 'Frost Slate',
    desc: 'Cool Ice Slate & Emerald Mint',
    lightBase: '#E6EDF2',
    lightRaised: '#EFF4F8',
    lightAccent: '#0F8B6E',
    darkBase: '#131D24',
    darkRaised: '#1A2730',
    darkAccent: '#34D9A8',
  },
  {
    id: 'midnight-carbon',
    name: 'Midnight Carbon',
    desc: 'Stealth Obsidian & Hot Ember',
    lightBase: '#F0F0EE',
    lightRaised: '#F7F7F5',
    lightAccent: '#F95738',
    darkBase: '#141416',
    darkRaised: '#1C1C1F',
    darkAccent: '#FF6B4A',
  },
];

export const SettingsModal: React.FC = () => {
  const isOpen = useTaskStore((state) => state.settingsModalOpen);
  const setIsOpen = useTaskStore((state) => state.setSettingsModalOpen);
  const settings = useTaskStore((state) => state.settings);
  const updateSettings = useTaskStore((state) => state.updateSettings);
  const setTheme = useTaskStore((state) => state.setTheme);
  const addToast = useTaskStore((state) => state.addToast);
  const [confirmReset, setConfirmReset] = useState(false);

  const isDark = settings.themeMode === 'dark';

  const handlePaletteSelect = (paletteId: ThemePalette) => {
    setTheme(paletteId, settings.themeMode);
    addToast({
      type: 'success',
      title: 'Tema Diterapkan',
      description: `Tema diganti ke ${THEMES.find(t => t.id === paletteId)?.name}.`,
    });
  };

  const handleModeToggle = (dark: boolean) => {
    const nextMode: ThemeMode = dark ? 'dark' : 'light';
    setTheme(settings.themePalette, nextMode);
  };

  const handleReducedMotionChange = (enabled: boolean) => {
    updateSettings({ reducedMotion: enabled });
  };

  const handleSoundChange = (enabled: boolean) => {
    updateSettings({ soundEnabled: enabled });
  };

  const handleAutoResetChange = (behavior: 'carry-over' | 'archive') => {
    updateSettings({ autoResetBehavior: behavior });
    addToast({
      type: 'info',
      title: 'Pengaturan Disimpan',
      description: `Mode pergantian hari diatur ke: ${behavior === 'carry-over' ? 'Bawa task aktif ke hari ini' : 'Arsipkan task kemarin'}.`,
    });
  };

  const handleHardReset = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <NeuModal
      isOpen={isOpen}
      onClose={() => {
        setConfirmReset(false);
        setIsOpen(false);
      }}
      title="Pengaturan Aplikasi"
      description="Pilih dari 4 tema neumorphic khas, mode tampilan, dan preferensi harian."
      maxWidth="lg"
    >
      <div className="flex flex-col gap-5 py-2 max-h-[75vh] overflow-y-auto pr-1">
        {/* 4 Neumorphic Theme Picker */}
        <NeuCard padding="sm" className="border border-[var(--shadow-dark)]/15 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconWrapper icon={Palette} size="md" color="var(--accent)" />
              <div>
                <h4 className="text-sm font-semibold text-text-primary">
                  Pilihan Tema Neumorphic (4 Tema)
                </h4>
                <p className="text-xs text-text-secondary">
                  Setiap tema memiliki palet warna dan bayangan taktil unik
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            {THEMES.map((theme) => {
              const isSelected = settings.themePalette === theme.id;
              const baseColor = isDark ? theme.darkBase : theme.lightBase;
              const raisedColor = isDark ? theme.darkRaised : theme.lightRaised;
              const accentColor = isDark ? theme.darkAccent : theme.lightAccent;

              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handlePaletteSelect(theme.id)}
                  className={`p-3.5 rounded-neu-md text-left transition-all relative flex flex-col gap-2 ${
                    isSelected
                      ? 'neu-inset ring-2 ring-accent'
                      : 'neu-button hover:shadow-[6px_6px_14px_var(--shadow-dark),-6px_-6px_14px_var(--shadow-light)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display font-semibold text-sm text-text-primary">
                      {theme.name}
                    </span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-accent text-accent-text flex items-center justify-center">
                        <IconWrapper icon={Check} size={12} color="var(--accent-text)" />
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-text-secondary line-clamp-1">
                    {theme.desc}
                  </p>

                  {/* Visual Color Swatches */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className="w-5 h-5 rounded-full shadow-inner border border-black/10"
                      style={{ backgroundColor: baseColor }}
                      title="Warna Canvas"
                    />
                    <span
                      className="w-5 h-5 rounded-full shadow-sm border border-black/10"
                      style={{ backgroundColor: raisedColor }}
                      title="Warna Card"
                    />
                    <span
                      className="w-5 h-5 rounded-full shadow-sm"
                      style={{ backgroundColor: accentColor }}
                      title="Warna Aksen"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </NeuCard>

        {/* Appearance & Sound */}
        <NeuCard padding="sm" className="border border-[var(--shadow-dark)]/15 flex flex-col gap-1">
          <NeuToggle
            label="Mode Gelap (Dark Mode)"
            description={`Terapkan pencahayaan gelap untuk tema ${THEMES.find(t => t.id === settings.themePalette)?.name || ''}`}
            icon={isDark ? Moon : Sun}
            checked={isDark}
            onChange={handleModeToggle}
          />

          <div className="h-[1px] bg-[var(--shadow-dark)]/15 my-1" />

          <NeuToggle
            label="Efek Suara Taktil"
            description="Umpan balik audio sintetis Web Audio saat interaksi"
            icon={Volume2}
            checked={settings.soundEnabled}
            onChange={handleSoundChange}
          />

          <div className="h-[1px] bg-[var(--shadow-dark)]/15 my-1" />

          <NeuToggle
            label="Kurangi Animasi (Reduced Motion)"
            description="Transisi instan untuk kenyamanan visual"
            icon={Sparkles}
            checked={settings.reducedMotion}
            onChange={handleReducedMotionChange}
          />
        </NeuCard>

        {/* Daily Auto-Reset Behavior */}
        <NeuCard padding="sm" className="border border-[var(--shadow-dark)]/15 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <IconWrapper icon={CalendarClock} size="md" color="var(--accent)" />
            <div>
              <h4 className="text-sm font-semibold text-text-primary">
                Perilaku Pergantian Hari Otomatis
              </h4>
              <p className="text-xs text-text-secondary">
                Saat membuka aplikasi di tanggal baru:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              type="button"
              onClick={() => handleAutoResetChange('carry-over')}
              className={`p-3 rounded-neu-sm text-left transition-all ${
                settings.autoResetBehavior === 'carry-over'
                  ? 'neu-inset text-accent font-semibold'
                  : 'bg-base neu-button text-text-secondary hover:text-text-primary'
              }`}
            >
              <div className="text-xs font-bold font-body">Carry Over</div>
              <div className="text-[11px] text-text-secondary mt-0.5 leading-tight font-normal">
                Pindahkan task yang belum selesai ke hari ini.
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleAutoResetChange('archive')}
              className={`p-3 rounded-neu-sm text-left transition-all ${
                settings.autoResetBehavior === 'archive'
                  ? 'neu-inset text-accent font-semibold'
                  : 'bg-base neu-button text-text-secondary hover:text-text-primary'
              }`}
            >
              <div className="text-xs font-bold font-body">Mulai Bersih</div>
              <div className="text-[11px] text-text-secondary mt-0.5 leading-tight font-normal">
                Simpan catatan kemarin dan mulai daftar baru.
              </div>
            </button>
          </div>
        </NeuCard>

        {/* Danger Zone: Reset Data */}
        <div className="pt-2 border-t border-[var(--shadow-dark)]/15 flex items-center justify-between">
          {!confirmReset ? (
            <NeuButton
              variant="ghost"
              size="sm"
              onClick={() => setConfirmReset(true)}
              className="text-status-urgent hover:bg-status-urgent/10"
            >
              <IconWrapper icon={RotateCcw} size="sm" />
              <span>Reset Seluruh Data</span>
            </NeuButton>
          ) : (
            <div className="w-full flex items-center justify-between gap-3 p-3 rounded-neu-sm bg-status-urgent/10 border border-status-urgent/30 animate-fadeIn">
              <div className="flex items-center gap-2 text-status-urgent">
                <IconWrapper icon={AlertTriangle} size="sm" />
                <span className="text-xs font-semibold">Yakin hapus semua data?</span>
              </div>
              <div className="flex items-center gap-2">
                <NeuButton
                  variant="danger"
                  size="sm"
                  onClick={handleHardReset}
                >
                  Ya, Hapus
                </NeuButton>
                <NeuButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmReset(false)}
                >
                  Batal
                </NeuButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </NeuModal>
  );
};
