'use client';

import React, { useState, useRef } from 'react';
import { Upload, Download, FileJson, AlertTriangle, CheckCircle2, RefreshCw, Layers } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { parseAndAnalyzeImport, exportTasksToJSON } from '@/lib/storage/migration';
import { ImportAnalysis } from '@/types/task';
import { NeuModal } from '@/components/ui/NeuModal';
import { NeuButton } from '@/components/ui/NeuButton';
import { NeuCard } from '@/components/ui/NeuCard';
import { NeuBadge } from '@/components/ui/NeuBadge';
import { IconWrapper } from '@/components/ui/IconWrapper';

export const ImportExportModal: React.FC = () => {
  const isOpen = useTaskStore((state) => state.importModalOpen);
  const setIsOpen = useTaskStore((state) => state.setImportModalOpen);
  const tasks = useTaskStore((state) => state.tasks);
  const settings = useTaskStore((state) => state.settings);
  const importTasks = useTaskStore((state) => state.importTasks);
  const addToast = useTaskStore((state) => state.addToast);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setAnalysis(null);

    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setErrorMsg('Format file tidak didukung. Harap unggah file dengan ekstensi .json');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const result = parseAndAnalyzeImport(text);

        if (result.validTasks.length === 0) {
          setErrorMsg('Tidak ada task valid yang dapat diimpor dari file tersebut.');
          return;
        }

        setAnalysis(result);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Gagal memproses file JSON.';
        setErrorMsg(message);
      }
    };

    reader.onerror = () => {
      setErrorMsg('Terjadi kesalahan saat membaca file.');
    };

    reader.readAsText(file);
  };

  const handleApplyImport = async (mode: 'replace' | 'merge') => {
    if (!analysis || analysis.validTasks.length === 0) return;

    setIsProcessing(true);
    try {
      await importTasks(analysis.validTasks, mode);

      if (analysis.skippedCount > 0) {
        addToast({
          type: 'warning',
          title: 'Beberapa Task Dilewati',
          description: `${analysis.skippedCount} task dilewati karena judul kosong atau format tidak valid.`,
        });
      }

      // Close modal and reset state
      setAnalysis(null);
      setErrorMsg(null);
      setIsOpen(false);
    } catch {
      setErrorMsg('Gagal menerapkan data import.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
    try {
      const jsonStr = exportTasksToJSON(tasks, settings.themePalette);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `daily-focus-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addToast({
        type: 'success',
        title: 'Export Berhasil',
        description: `File backup ${tasks.length} task berhasil diunduh.`,
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Export Gagal',
        description: 'Terjadi kesalahan saat menyiapkan file export.',
      });
    }
  };

  const handleClose = () => {
    setAnalysis(null);
    setErrorMsg(null);
    setIsOpen(false);
  };

  return (
    <NeuModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Kelola Data & Backup"
      description="Import file backup JSON lama atau export data harian kamu."
      maxWidth="lg"
    >
      <div className="flex flex-col gap-6 py-2">
        {/* Export Section */}
        <NeuCard padding="sm" className="border border-[var(--shadow-dark)]/15">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-semibold text-base text-text-primary flex items-center gap-2">
                <IconWrapper icon={Download} size="md" color="var(--accent)" />
                Export Backup Data
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Unduh seluruh {tasks.length} task saat ini ke file JSON terstandar.
              </p>
            </div>
            <NeuButton
              variant="default"
              size="md"
              onClick={handleExport}
              disabled={tasks.length === 0}
            >
              <IconWrapper icon={FileJson} size="sm" />
              <span>Export JSON</span>
            </NeuButton>
          </div>
        </NeuCard>

        {/* Import Section */}
        <div className="flex flex-col gap-3">
          <h3 className="font-display font-semibold text-base text-text-primary flex items-center gap-2">
            <IconWrapper icon={Upload} size="md" color="var(--accent)" />
            Import Backup File (.json)
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Mendukung format legacy dengan field <code className="font-mono bg-base px-1.5 py-0.5 rounded-neu-sm neu-inset-sm">completed: boolean</code> maupun skema modern.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />

          {!analysis && (
            <div className="flex flex-col gap-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 px-4 rounded-neu-md neu-inset border-2 border-dashed border-[var(--shadow-dark)]/30 hover:border-accent/50 cursor-pointer flex flex-col items-center justify-center gap-2.5 transition-colors text-center"
              >
                <div className="w-10 h-10 rounded-neu-sm neu-small flex items-center justify-center text-accent">
                  <IconWrapper icon={Upload} size="md" />
                </div>
                <p className="text-sm font-semibold text-text-primary">
                  Klik untuk memilih file backup JSON
                </p>
                <span className="text-xs text-text-secondary font-mono">
                  Format yang diterima: .json (Todoist, Notion, Daily Focus, dll.)
                </span>
              </div>

              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch('/sample-legacy-backup.json');
                      const json = await res.text();
                      const result = parseAndAnalyzeImport(json);
                      setAnalysis(result);
                    } catch {
                      setErrorMsg('Gagal memuat data contoh.');
                    }
                  }}
                  className="text-xs font-semibold text-accent hover:underline py-1 px-3 rounded-neu-sm neu-button"
                >
                  ⚡ Muat Data Contoh (Demo Tasks)
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-neu-md bg-status-urgent/10 border border-status-urgent/30 flex items-start gap-2.5">
              <IconWrapper icon={AlertTriangle} size="md" color="var(--status-urgent)" />
              <span className="text-xs text-status-urgent font-medium leading-relaxed">
                {errorMsg}
              </span>
            </div>
          )}

          {/* Import Preview Modal / Card */}
          {analysis && (
            <div className="p-4 rounded-neu-md bg-[var(--surface-raised)]/60 border border-[var(--shadow-dark)]/20 flex flex-col gap-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[var(--shadow-dark)]/15 pb-3">
                <div className="flex items-center gap-2">
                  <IconWrapper icon={CheckCircle2} size="md" color="var(--status-done)" />
                  <span className="text-sm font-bold text-text-primary">
                    Preview Data File
                  </span>
                </div>
                {analysis.detectedVersion && (
                  <span className="text-[11px] font-mono text-text-secondary">
                    Skema v{analysis.detectedVersion}
                  </span>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-neu-sm neu-small">
                  <span className="text-[10px] text-text-secondary font-body block uppercase">
                    Total Task
                  </span>
                  <span className="font-mono text-base font-bold text-text-primary">
                    {analysis.validTasks.length}
                  </span>
                </div>
                <div className="p-2.5 rounded-neu-sm neu-small">
                  <span className="text-[10px] text-text-secondary font-body block uppercase">
                    Aktif
                  </span>
                  <span className="font-mono text-base font-bold text-accent">
                    {analysis.pendingCount}
                  </span>
                </div>
                <div className="p-2.5 rounded-neu-sm neu-small">
                  <span className="text-[10px] text-text-secondary font-body block uppercase">
                    Selesai
                  </span>
                  <span className="font-mono text-base font-bold text-status-done">
                    {analysis.doneCount}
                  </span>
                </div>
              </div>

              {analysis.exportedAt && (
                <p className="text-xs font-mono text-text-secondary">
                  Tanggal Export File: {new Date(analysis.exportedAt).toLocaleString('id-ID')}
                </p>
              )}

              {analysis.skippedCount > 0 && (
                <div className="p-2.5 rounded-neu-sm bg-status-urgent/10 text-status-urgent text-xs">
                  ⚠️ {analysis.skippedCount} task tanpa judul valid akan dilewati secara otomatis.
                </div>
              )}

              {/* Action Buttons: Replace All vs Merge */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <NeuButton
                  variant="accent-solid"
                  size="md"
                  fullWidth
                  disabled={isProcessing}
                  onClick={() => handleApplyImport('replace')}
                >
                  <IconWrapper icon={RefreshCw} size="sm" color="var(--accent-text)" />
                  <span>Ganti Semua (Replace All)</span>
                </NeuButton>

                <NeuButton
                  variant="default"
                  size="md"
                  fullWidth
                  disabled={isProcessing}
                  onClick={() => handleApplyImport('merge')}
                >
                  <IconWrapper icon={Layers} size="sm" />
                  <span>Gabungkan (Merge)</span>
                </NeuButton>
              </div>

              <button
                type="button"
                onClick={() => setAnalysis(null)}
                className="text-xs text-text-secondary hover:text-text-primary text-center underline mt-1"
              >
                Pilih file lain
              </button>
            </div>
          )}
        </div>
      </div>
    </NeuModal>
  );
};
