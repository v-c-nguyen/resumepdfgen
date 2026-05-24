'use client';

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_PROMPT_TEMPLATE } from '@/app/utils/promptBuilder';
import AddDefaultPromptModal from './AddDefaultPromptModal';

export interface DefaultPromptOption {
  id: string;
  name: string;
  content: string;
}

interface DefaultPromptPickerProps {
  selectedId: string;
  profileDefaultPromptId?: string;
  onSelect: (prompt: DefaultPromptOption) => void;
  apiPath?: string;
  selectClassName?: string;
  addButtonClassName?: string;
}

export default function DefaultPromptPicker({
  selectedId,
  profileDefaultPromptId,
  onSelect,
  apiPath = '/api/default-prompts',
  selectClassName,
  addButtonClassName,
}: DefaultPromptPickerProps) {
  const [defaultPrompts, setDefaultPrompts] = useState<DefaultPromptOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptContent, setNewPromptContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const loadDefaultPrompts = useCallback(async () => {
    try {
      const response = await fetch(apiPath);
      if (!response.ok) throw new Error('Failed to load');
      const data = await response.json();
      const prompts: DefaultPromptOption[] = data.defaultPrompts ?? [];
      setDefaultPrompts(prompts);
      return prompts;
    } catch {
      setDefaultPrompts([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [apiPath]);

  useEffect(() => {
    loadDefaultPrompts();
  }, [loadDefaultPrompts]);

  useEffect(() => {
    if (defaultPrompts.length === 0) return;

    const preferredId =
      (selectedId && defaultPrompts.some((p) => p.id === selectedId) && selectedId) ||
      (profileDefaultPromptId &&
        defaultPrompts.some((p) => p.id === profileDefaultPromptId) &&
        profileDefaultPromptId) ||
      defaultPrompts[0].id;

    const prompt = defaultPrompts.find((p) => p.id === preferredId);
    if (prompt && preferredId !== selectedId) {
      onSelect(prompt);
    }
  }, [defaultPrompts, profileDefaultPromptId, selectedId, onSelect]);

  const handleSelectChange = (id: string) => {
    const prompt = defaultPrompts.find((p) => p.id === id);
    if (prompt) onSelect(prompt);
  };

  const handleAddDefaultPrompt = async () => {
    const name = newPromptName.trim();
    const content = newPromptContent.trim();
    if (!name || !content) {
      setModalError('Name and prompt content are required');
      return;
    }

    setSaving(true);
    setModalError('');

    try {
      const response = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content }),
      });
      const data = await response.json();
      if (!response.ok) {
        setModalError(data.error || 'Failed to save default prompt');
        return;
      }

      const prompts = await loadDefaultPrompts();
      const created = data.defaultPrompt as DefaultPromptOption;
      const latest = prompts.find((p) => p.id === created.id) ?? created;
      onSelect(latest);
      setShowAddModal(false);
      setNewPromptName('');
      setNewPromptContent('');
    } catch {
      setModalError('An error occurred while saving the default prompt.');
    } finally {
      setSaving(false);
    }
  };

  const defaultSelectClass =
    selectClassName ??
    'min-w-0 flex-1 px-3 py-2 border border-zinc-300 rounded-md text-sm text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400';

  const defaultAddClass =
    addButtonClassName ??
    'shrink-0 text-sm font-medium bg-zinc-100 text-zinc-800 border border-zinc-300 rounded-md py-2 px-3 hover:bg-zinc-200 hover:border-zinc-400 transition-all duration-200';

  return (
    <>
      <select
        value={selectedId || ''}
        onChange={(e) => handleSelectChange(e.target.value)}
        disabled={loading || defaultPrompts.length === 0}
        className={defaultSelectClass}
        aria-label="Default prompt template"
      >
        {loading ? (
          <option value="">Loading…</option>
        ) : defaultPrompts.length === 0 ? (
          <option value="">No prompts</option>
        ) : (
          defaultPrompts.map((prompt) => (
            <option key={prompt.id} value={prompt.id}>
              {prompt.name}
            </option>
          ))
        )}
      </select>

      <button
        type="button"
        onClick={() => {
          setModalError('');
          setNewPromptName('');
          setNewPromptContent(DEFAULT_PROMPT_TEMPLATE);
          setShowAddModal(true);
        }}
        className={defaultAddClass}
      >
        Add prompt
      </button>

      <AddDefaultPromptModal
        open={showAddModal}
        name={newPromptName}
        content={newPromptContent}
        saving={saving}
        error={modalError}
        onNameChange={setNewPromptName}
        onContentChange={setNewPromptContent}
        onSave={handleAddDefaultPrompt}
        onClose={() => setShowAddModal(false)}
      />
    </>
  );
}
