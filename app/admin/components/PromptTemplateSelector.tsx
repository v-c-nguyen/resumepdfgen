'use client';

import { useEffect, useRef, useState } from 'react';
import { DEFAULT_PROMPT_TEMPLATE } from '@/app/utils/promptBuilder';

export interface DefaultPromptOption {
  id: string;
  name: string;
  content: string;
}

interface PromptTemplateSelectorProps {
  value: string;
  customPrompt?: string;
  defaultPromptId?: string;
  onChange: (update: { promptText: string; customPrompt?: string; defaultPromptId?: string }) => void;
  onDefaultPromptsChange?: () => void;
}

export default function PromptTemplateSelector({
  value,
  customPrompt,
  defaultPromptId,
  onChange,
  onDefaultPromptsChange,
}: PromptTemplateSelectorProps) {
  const [defaultPrompts, setDefaultPrompts] = useState<DefaultPromptOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDefaultId, setSelectedDefaultId] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptContent, setNewPromptContent] = useState('');
  const [saving, setSaving] = useState(false);
  const initializedEmptyPrompt = useRef(false);

  const loadDefaultPrompts = async () => {
    try {
      const response = await fetch('/api/admin/default-prompts', { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Failed to load default prompts');
      }
      const data = await response.json();
      const prompts: DefaultPromptOption[] = data.defaultPrompts ?? [];
      setDefaultPrompts(prompts);
      return prompts;
    } catch {
      setError('Failed to load default prompts');
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDefaultPrompts();
  }, []);

  useEffect(() => {
    if (defaultPrompts.length === 0) return;

    const resolvedId =
      defaultPromptId && defaultPrompts.some((p) => p.id === defaultPromptId)
        ? defaultPromptId
        : defaultPrompts[0].id;

    setSelectedDefaultId(resolvedId);
  }, [defaultPromptId, defaultPrompts]);

  useEffect(() => {
    if (loading || defaultPrompts.length === 0 || initializedEmptyPrompt.current) return;
    if (value.trim()) {
      initializedEmptyPrompt.current = true;
      return;
    }

    const initial =
      (defaultPromptId && defaultPrompts.find((p) => p.id === defaultPromptId)) ||
      defaultPrompts[0];

    if (!initial) return;

    initializedEmptyPrompt.current = true;
    setSelectedDefaultId(initial.id);
    onChange({
      promptText: initial.content,
      customPrompt: undefined,
      defaultPromptId: initial.id,
    });
  }, [loading, defaultPrompts, value, defaultPromptId]);

  const selectedDefault = defaultPrompts.find((p) => p.id === selectedDefaultId);
  const isUsingCustomPrompt = Boolean(customPrompt);
  const matchesSelectedDefault =
    !isUsingCustomPrompt ||
    (selectedDefault != null && value === selectedDefault.content);

  const handleSelectDefault = (id: string) => {
    const prompt = defaultPrompts.find((p) => p.id === id);
    if (!prompt) return;

    setSelectedDefaultId(id);
    onChange({
      promptText: prompt.content,
      customPrompt: undefined,
      defaultPromptId: id,
    });
  };

  const handleTextChange = (newText: string) => {
    const prompt = defaultPrompts.find((p) => p.id === selectedDefaultId);
    if (prompt && newText === prompt.content) {
      onChange({
        promptText: newText,
        customPrompt: undefined,
        defaultPromptId: selectedDefaultId,
      });
      return;
    }

    onChange({
      promptText: newText,
      customPrompt: newText,
      defaultPromptId: selectedDefaultId || defaultPromptId,
    });
  };

  const handleResetToDefault = () => {
    const prompt = defaultPrompts.find((p) => p.id === selectedDefaultId);
    if (!prompt) return;

    onChange({
      promptText: prompt.content,
      customPrompt: undefined,
      defaultPromptId: selectedDefaultId,
    });
  };

  const createDefaultPrompt = async (name: string, content: string) => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/default-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, content }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to save default prompt');
        return null;
      }

      const prompts = await loadDefaultPrompts();
      onDefaultPromptsChange?.();

      const created = data.defaultPrompt as DefaultPromptOption;
      const latest = prompts.find((p) => p.id === created.id) ?? created;
      setSelectedDefaultId(latest.id);
      onChange({
        promptText: latest.content,
        customPrompt: undefined,
        defaultPromptId: latest.id,
      });

      setSuccess(`Default prompt "${latest.name}" saved.`);
      setTimeout(() => setSuccess(''), 3000);
      return latest;
    } catch {
      setError('An error occurred while saving the default prompt.');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleAddDefaultPrompt = async () => {
    const name = newPromptName.trim();
    const content = newPromptContent.trim();
    if (!name || !content) {
      setError('Name and prompt content are required');
      return;
    }

    const created = await createDefaultPrompt(name, content);
    if (created) {
      setShowAddModal(false);
      setNewPromptName('');
      setNewPromptContent('');
    }
  };

  const handleSaveCurrentAsDefault = async () => {
    const name = newPromptName.trim();
    const content = value.trim();
    if (!name) {
      setError('Name is required');
      return;
    }
    if (!content) {
      setError('Prompt content cannot be empty');
      return;
    }

    const created = await createDefaultPrompt(name, content);
    if (created) {
      setShowSaveModal(false);
      setNewPromptName('');
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default prompt template
          </label>
          <select
            value={selectedDefaultId}
            onChange={(e) => handleSelectDefault(e.target.value)}
            disabled={loading || defaultPrompts.length === 0}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 disabled:bg-gray-100"
          >
            {loading ? (
              <option value="">Loading default prompts...</option>
            ) : defaultPrompts.length === 0 ? (
              <option value="">No default prompts available</option>
            ) : (
              defaultPrompts.map((prompt) => (
                <option key={prompt.id} value={prompt.id}>
                  {prompt.name}
                </option>
              ))
            )}
          </select>
        </div>
        <button
          type="button"
          onClick={() => {
            setError('');
            setNewPromptName('');
            setNewPromptContent(DEFAULT_PROMPT_TEMPLATE);
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
        >
          Add default prompt
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleResetToDefault}
          disabled={!selectedDefault || (!isUsingCustomPrompt && matchesSelectedDefault)}
          className="text-sm text-gray-600 hover:text-gray-800 underline disabled:opacity-50 disabled:no-underline"
        >
          Reset to selected default
        </button>
        {isUsingCustomPrompt && (
          <button
            type="button"
            onClick={() => {
              setError('');
              setNewPromptName('');
              setShowSaveModal(true);
            }}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Save to default prompt
          </button>
        )}
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Use <code className="bg-blue-100 px-1 rounded">{"${baseResume}"}</code> or{' '}
          <code className="bg-blue-100 px-1 rounded">{"${profileData}"}</code> for resume text,{' '}
          <code className="bg-blue-100 px-1 rounded">{"${jobDescription}"}</code> for the job description, and{' '}
          <code className="bg-blue-100 px-1 rounded">{"${targetTitle}"}</code> for the target title from profile settings.
        </p>
      </div>

      <textarea
        value={value}
        onChange={(e) => handleTextChange(e.target.value)}
        rows={20}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm text-gray-900"
        placeholder="Enter custom prompt here..."
      />
      <p className="text-xs text-gray-500">
        {value.length} characters
        {isUsingCustomPrompt ? (
          <span className="ml-2 text-blue-600">• Custom prompt is active</span>
        ) : (
          <span className="ml-2 text-gray-500">
            • Using default prompt{selectedDefault ? `: ${selectedDefault.name}` : ''}
          </span>
        )}
      </p>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Add default prompt</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={newPromptName}
                  onChange={(e) => setNewPromptName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                  placeholder="e.g., Technical resume"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prompt content *</label>
                <textarea
                  value={newPromptContent}
                  onChange={(e) => setNewPromptContent(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm text-gray-900"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleAddDefaultPrompt}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg"
              >
                {saving ? 'Saving...' : 'Save default prompt'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Save to default prompt</h3>
            <p className="text-sm text-gray-600 mb-4">
              Save the current custom prompt as a reusable default template.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
            <input
              type="text"
              value={newPromptName}
              onChange={(e) => setNewPromptName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 mb-4"
              placeholder="e.g., Executive summary style"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSaveCurrentAsDefault}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
