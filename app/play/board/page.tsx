'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Difficulty } from '../../types';
import { getQuestion, getPlaySession, generateQuestionId } from '../../utils/storage';

export default function PlayBoardPage() {
  const router = useRouter();
  const [session, setSession] = useState(getPlaySession());

  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
  const difficultyLabels = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
  const columns = 6;

  useEffect(() => {
    const currentSession = getPlaySession();
    if (!currentSession) {
      router.push('/play');
      return;
    }
    setSession(currentSession);
    
    const interval = setInterval(() => {
      const updatedSession = getPlaySession();
      if (updatedSession) {
        setSession(updatedSession);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [router]);

  if (!session) {
    return null;
  }

  const handleWidgetClick = (difficulty: Difficulty, column: number) => {
    const questionId = generateQuestionId(difficulty, column);
    const question = getQuestion(questionId);
    
    if (!question || question.clues.length === 0) {
      alert('This question has not been created yet!');
      return;
    }

    router.push(`/play/question?id=${questionId}&difficulty=${difficulty}&column=${column}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-8 pb-32">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-white">Play Game</h1>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/play')}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Back to Setup
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Back to Home
            </button>
          </div>
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
                  const isAvailable = question && question.clues.length > 0;
                  const isAnswered = session.answeredQuestions.includes(questionId);

                  return (
                    <button
                      key={colIndex}
                      onClick={() => handleWidgetClick(difficulty, colIndex)}
                      disabled={!isAvailable}
                      className={`aspect-square rounded-lg font-bold text-xl transition-all duration-200 transform hover:scale-105 shadow-lg ${
                        !isAvailable
                          ? 'bg-gray-500 cursor-not-allowed opacity-50'
                          : isAnswered
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-yellow-500 hover:bg-yellow-600 text-black'
                      }`}
                    >
                      {!isAvailable ? '' : isAnswered ? '✓' : '?'}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Score Display at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t-4 border-yellow-500 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-around items-center">
            {session.teams.map((team) => (
              <div key={team.id} className="text-center">
                <div className="text-white font-semibold text-lg mb-1">{team.name}</div>
                <div className="text-yellow-400 font-bold text-3xl">{team.score}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
