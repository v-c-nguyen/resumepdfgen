'use client';

interface AddDefaultPromptModalProps {
  open: boolean;
  name: string;
  content: string;
  saving: boolean;
  error?: string;
  onNameChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function AddDefaultPromptModal({
  open,
  name,
  content,
  saving,
  error,
  onNameChange,
  onContentChange,
  onSave,
  onClose,
}: AddDefaultPromptModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-zinc-900 mb-4">Add default prompt</h3>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 rounded-md text-zinc-900"
              placeholder="e.g., Technical resume"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Prompt content *</label>
            <textarea
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              rows={12}
              className="w-full px-4 py-2 border border-zinc-300 rounded-md font-mono text-sm text-zinc-900"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="flex-1 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white font-semibold py-2 px-4 rounded-md"
          >
            {saving ? 'Saving...' : 'Save default prompt'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-semibold py-2 px-4 rounded-md"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
