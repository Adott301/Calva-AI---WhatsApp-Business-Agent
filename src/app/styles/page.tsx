'use client';

import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Failed to load settings');
      const data = await res.json();
      setSystemPrompt(data.system_prompt || '');
      setOriginalPrompt(data.system_prompt || '');
    } catch (err) {
      console.error('Failed to load settings:', err);
      setToast({ message: 'Failed to load settings', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system_prompt: systemPrompt }),
      });

      if (!res.ok) throw new Error('Failed to save settings');

      setOriginalPrompt(systemPrompt);
      setToast({ message: '✅ System prompt saved successfully', type: 'success' });
    } catch (err) {
      console.error('Save error:', err);
      setToast({ message: '❌ Failed to save settings', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSystemPrompt(originalPrompt);
  };

  const hasChanges = systemPrompt !== originalPrompt;

  if (loading) {
    return (
      <div className="settings-page">
        <div className="empty-state">
          <div className="spinner lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-card">

        <h1 className="settings-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src="/setting.png"
            alt="Settings Icon"
            style={{ width: '32px', height: '32px', objectFit: 'contain' }}
          />
          Settings
        </h1>
        <p className="settings-subtitle">
          Configure your AI agent&apos;s behavior and personality.
        </p>

        <label className="settings-label" htmlFor="system-prompt">
          AI System Prompt
        </label>
        <textarea
          id="system-prompt"
          className="settings-textarea"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="Enter the system prompt that defines your AI agent's behavior..."
        />

        <div className="settings-actions">
          {hasChanges && (
            <button
              className="btn btn-secondary"
              onClick={handleReset}
              type="button"
            >
              Reset
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            type="button"
            id="save-settings-btn"
          >
            {saving ? (
              <>
                <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Saving...
              </>
            ) : (
              /* 🌟 ĐÃ ĐỔI: Xóa emoji đĩa mềm cũ để nút bấm tinh tế, chuẩn website cao cấp */
              'Save Changes'
            )}
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
