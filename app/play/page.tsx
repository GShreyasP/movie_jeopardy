'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPlaySession, initializePlaySession } from '../utils/storage';

export default function PlayPage() {
  const router = useRouter();
  const [numberOfTeams, setNumberOfTeams] = useState(2);
  const [session, setSession] = useState(getPlaySession());

  useEffect(() => {
    const existingSession = getPlaySession();
    if (existingSession) {
      setSession(existingSession);
    }
  }, []);

  const handleStartGame = () => {
    const newSession = initializePlaySession(numberOfTeams);
    setSession(newSession);
    router.push('/play/board');
  };

  const handleContinueGame = () => {
    router.push('/play/board');
  };

  if (session) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-8">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Game in Progress</h1>
          <div className="space-y-4 mb-6">
            {session.teams.map((team) => (
              <div key={team.id} className="flex justify-between items-center p-4 bg-gray-100 rounded-lg">
                <span className="font-semibold text-gray-700">{team.name}</span>
                <span className="text-2xl font-bold text-blue-600">{team.score}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <button
                onClick={handleContinueGame}
                className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-lg transition-colors"
              >
                Continue Game
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('movie-jeopardy-play-session');
                  setSession(null);
                }}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold text-lg rounded-lg transition-colors"
              >
                New Game
              </button>
            </div>
            <button
              onClick={() => router.push('/')}
              className="w-full px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold text-lg rounded-lg transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-8">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Start New Game</h1>
        <div className="mb-6">
          <label className="block text-lg font-semibold text-gray-700 mb-3">
            Number of Teams
          </label>
          <input
            type="number"
            min="2"
            max="6"
            value={numberOfTeams}
            onChange={(e) => setNumberOfTeams(parseInt(e.target.value) || 2)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-center text-black"
          />
        </div>
        <button
          onClick={handleStartGame}
          className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg rounded-lg transition-colors"
        >
          Start Game
        </button>
        <button
          onClick={() => router.push('/')}
          className="w-full mt-4 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold text-lg rounded-lg transition-colors"
        >
          Back to Home
        </button>
      </div>
    </main>
  );
}
