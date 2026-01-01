'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Difficulty } from '../../types';
import { getQuestion, getPlaySession, updateTeamScore, markQuestionAnswered } from '../../utils/storage';

function QuestionViewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const questionId = searchParams.get('id') || '';
  const difficulty = searchParams.get('difficulty') as Difficulty | null;
  const column = parseInt(searchParams.get('column') || '0');

  const [question, setQuestion] = useState(getQuestion(questionId));
  const [session, setSession] = useState(getPlaySession());
  const [currentClueIndex, setCurrentClueIndex] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [scoreInput, setScoreInput] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    const q = getQuestion(questionId);
    setQuestion(q);
    setSession(getPlaySession());
  }, [questionId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSession(getPlaySession());
    }, 100);
    return () => clearInterval(interval);
  }, []);

  if (!question || !session) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-6">
          <p className="text-gray-600">Question not found</p>
          <button
            onClick={() => router.push('/play/board')}
            className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            Back to Board
          </button>
        </div>
      </main>
    );
  }

  const handleShowClue = (index: number) => {
    setCurrentClueIndex(index);
  };

  const handleCloseClue = () => {
    setCurrentClueIndex(null);
  };

  const handleScoreChange = (teamId: number, value: string) => {
    setScoreInput({ ...scoreInput, [teamId]: value });
  };

  const handleApplyScore = (teamId: number) => {
    const scoreValue = parseInt(scoreInput[teamId] || '0');
    if (!isNaN(scoreValue)) {
      updateTeamScore(teamId, scoreValue);
      setScoreInput({ ...scoreInput, [teamId]: '' });
      setSession(getPlaySession());
    }
  };

  const handleMarkAnswered = () => {
    markQuestionAnswered(questionId);
    router.push('/play/board');
  };

  const currentClue = currentClueIndex !== null ? question.clues[currentClueIndex] : null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-8 pb-32">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/play/board')}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors mb-4"
          >
            ← Back to Game Board
          </button>
          <h1 className="text-3xl font-bold text-white">
            {difficulty && `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} - Column ${column + 1}`}
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6 space-y-6 mb-6">
          {/* Initial Clue (First Clue) */}
          {question.clues.length > 0 && (
            <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
              <h2 className="text-xl font-bold text-gray-800 mb-3">Initial Clue</h2>
              <div className="text-gray-700">
                {question.clues[0].type === 'text' && (
                  <p className="text-lg whitespace-pre-wrap">{question.clues[0].content}</p>
                )}
                {question.clues[0].type === 'image' && (
                  <img
                    src={question.clues[0].content}
                    alt="Clue 1"
                    className="max-w-full h-auto rounded-lg border border-gray-300"
                    style={{ maxHeight: '400px' }}
                  />
                )}
                {question.clues[0].type === 'link' && (
                  <a
                    href={question.clues[0].content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline text-lg break-all"
                  >
                    {question.clues[0].content}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Clickable Clues (up to 3 clues) */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Click to Reveal Clues</h2>
            <div className="grid grid-cols-3 gap-4">
              {question.clues.slice(0, 3).map((clue, index) => (
                <button
                  key={index}
                  onClick={() => handleShowClue(index)}
                  className="px-6 py-4 bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg rounded-lg shadow-lg transition-colors"
                >
                  Clue {index + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Answer Section */}
          <div className="border-t-2 border-gray-300 pt-6">
            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-lg transition-colors mb-4"
            >
              {showAnswer ? 'Hide Answer' : 'Show Answer'}
            </button>
            {showAnswer && (
              <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
                <p className="text-xl font-bold text-gray-800">{question.answer}</p>
              </div>
            )}
          </div>

          {/* Score Input */}
          <div className="border-t-2 border-gray-300 pt-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Score Teams</h2>
            <div className="grid grid-cols-2 gap-4">
              {session.teams.map((team) => (
                <div key={team.id} className="border-2 border-gray-300 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-700">{team.name}</span>
                    <span className="text-xl font-bold text-blue-600">{team.score}</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={scoreInput[team.id] || ''}
                      onChange={(e) => handleScoreChange(team.id, e.target.value)}
                      placeholder="Score change"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => handleApplyScore(team.id)}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mark as Answered */}
          <div className="border-t-2 border-gray-300 pt-6">
            <button
              onClick={handleMarkAnswered}
              className="w-full px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold text-lg rounded-lg transition-colors"
            >
              Mark as Answered and Return to Board
            </button>
          </div>
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

      {/* Clue Popup Modal */}
      {currentClueIndex !== null && currentClue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              onClick={handleCloseClue}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl font-bold"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Clue {currentClueIndex + 1}</h2>
            <div className="text-gray-700">
              {currentClue.type === 'text' && (
                <p className="text-lg whitespace-pre-wrap">{currentClue.content}</p>
              )}
              {currentClue.type === 'image' && (
                <img
                  src={currentClue.content}
                  alt={`Clue ${currentClueIndex + 1}`}
                  className="max-w-full h-auto rounded-lg border border-gray-300 mx-auto"
                  style={{ maxHeight: '70vh' }}
                />
              )}
              {currentClue.type === 'link' && (
                <div>
                  <a
                    href={currentClue.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline text-lg break-all"
                  >
                    {currentClue.content}
                  </a>
                </div>
              )}
            </div>
            <button
              onClick={handleCloseClue}
              className="mt-6 w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function QuestionViewPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-6 text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    }>
      <QuestionViewContent />
    </Suspense>
  );
}
