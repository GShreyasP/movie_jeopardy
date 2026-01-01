'use client';

import { useRouter } from 'next/navigation';
import { Difficulty, generateQuestionId } from '../types';
import { getQuestion } from '../utils/storage';

export default function CreatePage() {
  const router = useRouter();

  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
  const difficultyLabels = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
  const columns = 6;

  const handleWidgetClick = (difficulty: Difficulty, column: number) => {
    const questionId = generateQuestionId(difficulty, column);
    router.push(`/create/question?id=${questionId}&difficulty=${difficulty}&column=${column}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-white">Create Your Game</h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Back to Home
          </button>
        </div>

        <div className="space-y-6">
          {difficulties.map((difficulty, rowIndex) => (
            <div key={difficulty}>
              <h2 className="text-2xl font-bold text-white mb-4">
                {difficultyLabels[difficulty]}
              </h2>
              <div className="grid grid-cols-6 gap-4">
                {Array.from({ length: columns }).map((_, colIndex) => {
                  const questionId = generateQuestionId(difficulty, colIndex);
                  const question = getQuestion(questionId);
                  const isFilled = question && question.clues.length > 0;

                  return (
                    <button
                      key={colIndex}
                      onClick={() => handleWidgetClick(difficulty, colIndex)}
                      className={`aspect-square rounded-lg font-bold text-xl transition-all duration-200 transform hover:scale-105 ${
                        isFilled
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-yellow-500 hover:bg-yellow-600 text-black'
                      } shadow-lg`}
                    >
                      {isFilled ? '✓' : '?'}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
