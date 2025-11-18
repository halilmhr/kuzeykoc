import React, { useState } from 'react';
import { Homework } from '../../types';

interface HomeworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  onSave: (homework: Omit<Homework, 'id' | 'createdAt'>) => void;
  editing?: Homework | null;
}

const HomeworkModal: React.FC<HomeworkModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onSave,
  editing
}) => {
  const [title, setTitle] = useState(editing?.title || '');
  const [description, setDescription] = useState(editing?.description || '');

  React.useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setDescription(editing.description);
    } else {
      setTitle('');
      setDescription('');
    }
  }, [editing, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedDate) return;

    // Helper function to convert Date to YYYY-MM-DD format without timezone issues
    const formatDateToLocal = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const homework: Omit<Homework, 'id' | 'createdAt'> = {
      studentId: editing?.studentId || '',
      coachId: editing?.coachId || '',
      title: title.trim(),
      description: description.trim(),
      date: formatDateToLocal(selectedDate),
      isCompleted: editing?.isCompleted || false
    };

    onSave(homework);
    onClose();
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div 
        className="bg-[var(--bg-card)] rounded-2xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {editing ? 'Ödevi Düzenle' : 'Yeni Ödev Ekle'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {selectedDate && (
          <div className="mb-4 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
            <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
              📅 Tarih: {selectedDate.toLocaleDateString('tr-TR', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Ödev Başlığı *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Matematik 5. Ünite Problemleri"
              className="w-full p-3 border border-[var(--border-color-light)] rounded-lg focus:border-violet-500 focus:ring-violet-500 bg-[var(--bg-input)] text-[var(--text-primary)]"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Açıklama
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Ödev detaylarını buraya yazın..."
              className="w-full p-3 border border-[var(--border-color-light)] rounded-lg focus:border-violet-500 focus:ring-violet-500 bg-[var(--bg-input)] text-[var(--text-primary)] resize-none"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white rounded-lg hover:from-violet-700 hover:to-fuchsia-600 transition-all shadow-md"
            >
              {editing ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HomeworkModal;