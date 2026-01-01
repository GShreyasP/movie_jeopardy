'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="text-center space-y-8">
        <h1 className="text-6xl font-bold text-white mb-4">Movie Jeopardy</h1>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link
            href="/create"
            className="px-8 py-4 bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xl rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Create Game
          </Link>
          <Link
            href="/play"
            className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold text-xl rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Play Game
          </Link>
        </div>
      </div>
    </main>
  );
}
