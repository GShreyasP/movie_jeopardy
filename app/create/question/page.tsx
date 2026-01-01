'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Clue, ClueType, Question, Difficulty } from '../../types';
import { getQuestion, saveQuestion, generateQuestionId } from '../../utils/storage';

function QuestionEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const questionId = searchParams.get('id') || '';
  const difficulty = searchParams.get('difficulty') as Difficulty | null;
  const column = parseInt(searchParams.get('column') || '0');

  const [clues, setClues] = useState<Clue[]>([
    { type: 'text', content: '' },
    { type: 'text', content: '' },
    { type: 'text', content: '' },
  ]);
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    const existing = getQuestion(questionId);
    if (existing) {
      const defaultClues: Clue[] = [
        { type: 'text', content: '' },
        { type: 'text', content: '' },
        { type: 'text', content: '' },
      ];
      setClues(existing.clues.length === 3 ? existing.clues : defaultClues);
      setAnswer(existing.answer);
    }
  }, [questionId]);

  const handleClueTypeChange = (index: number, type: ClueType) => {
    const newClues = [...clues];
    newClues[index] = { type, content: '' };
    setClues(newClues);
  };

  const handleClueContentChange = (index: number, content: string) => {
    const newClues = [...clues];
    newClues[index].content = content;
    setClues(newClues);
  };

  const handleImageUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        handleClueContentChange(index, imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!questionId) return;

    const question: Question = {
      id: questionId,
      clues: clues.filter(clue => clue.content.trim() !== ''),
      answer: answer.trim(),
    };

    saveQuestion(question);
    router.push('/create');
  };

  const handleCancel = () => {
    router.push('/create');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors mb-4"
          >
            ← Back to Game Board
          </button>
          <h1 className="text-3xl font-bold text-white">
            Edit Question {difficulty && `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} - Column ${column + 1}`}
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6 space-y-6">
          {/* Clues */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Clues (Enter 3 clues)</h2>
            {clues.map((clue, index) => (
              <div key={index} className="border-2 border-gray-300 rounded-lg p-4 space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Clue {index + 1}
                </label>
                
                {/* Clue Type Selector */}
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => handleClueTypeChange(index, 'text')}
                    className={`px-4 py-2 rounded ${
                      clue.type === 'text'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } transition-colors`}
                  >
                    Text
                  </button>
                  <button
                    onClick={() => handleClueTypeChange(index, 'image')}
                    className={`px-4 py-2 rounded ${
                      clue.type === 'image'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } transition-colors`}
                  >
                    Image
                  </button>
                  <button
                    onClick={() => handleClueTypeChange(index, 'link')}
                    className={`px-4 py-2 rounded ${
                      clue.type === 'link'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } transition-colors`}
                  >
                    Link
                  </button>
                </div>

                {/* Clue Content Input */}
                {clue.type === 'text' && (
                  <textarea
                    value={clue.content}
                    onChange={(e) => handleClueContentChange(index, e.target.value)}
                    placeholder="Enter text clue..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    rows={4}
                  />
                )}

                {clue.type === 'image' && (
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(index, e)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {clue.content && (
                      <div className="mt-2">
                        <img
                          src={clue.content}
                          alt={`Clue ${index + 1}`}
                          className="max-w-full h-auto rounded-lg border border-gray-300"
                          style={{ maxHeight: '300px' }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {clue.type === 'link' && (
                  <input
                    type="url"
                    value={clue.content}
                    onChange={(e) => handleClueContentChange(index, e.target.value)}
                    placeholder="Enter link URL (e.g., https://example.com)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Answer */}
          <div className="border-t-2 border-gray-300 pt-6">
            <label className="block text-lg font-semibold text-gray-800 mb-2">
              Answer
            </label>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter the answer..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-black"
            />
          </div>

          {/* Save Button */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-lg shadow-lg transition-colors"
            >
              Save Question
            </button>
            <button
              onClick={handleCancel}
              className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold text-lg rounded-lg shadow-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function QuestionEditorPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-6 text-center">
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </main>
    }>
      <QuestionEditorContent />
    </Suspense>
  );
}
