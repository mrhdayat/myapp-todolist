'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, DatabaseBackup, Trash2 } from 'lucide-react';
import { dbClient } from '@/lib/storage/db';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  backupRestored: boolean;
}

export class ErrorRecoveryBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      backupRestored: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorRecoveryBoundary] Caught unhandled render exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleRestoreAutoBackup = async () => {
    const snapshot = dbClient.getAutoBackupSnapshot();
    if (!snapshot || !snapshot.tasks) {
      alert('Tidak ditemukan snapshot auto-backup lokal.');
      return;
    }

    try {
      await dbClient.saveAllTasks(snapshot.tasks);
      if (snapshot.settings) await dbClient.saveSettings(snapshot.settings);
      this.setState({ backupRestored: true });
      setTimeout(() => {
        if (typeof window !== 'undefined') window.location.reload();
      }, 1000);
    } catch {
      alert('Gagal memulihkan dari snapshot.');
    }
  };

  handleClearAndReset = () => {
    if (confirm('PERINGATAN: Tindakan ini akan mengosongkan penyimpanan lokal dan memulai ulang aplikasi dari awal. Lanjutkan?')) {
      if (typeof window !== 'undefined') {
        localStorage.clear();
        indexedDB.deleteDatabase('daily-focus-db');
        window.location.reload();
      }
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--base)] text-[var(--text-primary)] flex items-center justify-center p-4">
          <div className="w-full max-w-lg neu-card p-6 sm:p-8 rounded-neu-lg border border-[var(--border-subtle)] flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-neu-md bg-status-urgent/15 flex items-center justify-center text-status-urgent flex-shrink-0">
                <AlertTriangle size={26} />
              </div>
              <div>
                <h1 className="font-display font-bold text-xl sm:text-2xl text-text-primary">
                  Terjadi Kendala Sistem
                </h1>
                <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                  Aplikasi mendeteksi error tampilan atau kegagalan baca penyimpanan.
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="neu-inset-sm p-3 rounded-neu-sm bg-base border border-[var(--border-subtle)] text-xs font-mono text-status-urgent break-words max-h-28 overflow-y-auto">
                {this.state.error.message || 'Unknown Error'}
              </div>
            )}

            {this.state.backupRestored && (
              <div className="p-3 rounded-neu-sm bg-status-done/15 border border-status-done/30 text-xs font-body text-status-done font-semibold">
                ✓ Berhasil memulihkan data dari auto-backup! Memuat ulang...
              </div>
            )}

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-neu-md neu-button font-body font-semibold text-sm text-text-primary flex items-center justify-center gap-2 hover:text-accent transition-all"
              >
                <RefreshCw size={16} />
                <span>Muat Ulang Halaman</span>
              </button>

              <button
                type="button"
                onClick={this.handleRestoreAutoBackup}
                className="w-full py-3 px-4 rounded-neu-md neu-button font-body font-semibold text-sm text-accent flex items-center justify-center gap-2 hover:shadow-md transition-all"
              >
                <DatabaseBackup size={16} />
                <span>Pulihkan dari Auto-Backup Terakhir</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearAndReset}
                className="w-full py-2.5 px-4 rounded-neu-md text-xs text-text-secondary hover:text-status-urgent transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Reset Penyimpanan & Mulai Bersih</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
