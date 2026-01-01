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
  const [revealedClues, setRevealedClues] = useState<Set<number>>(new Set()); // Track which additional clues have been revealed

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

  const getDifficultyPoints = () => {
    if (!difficulty) return { start: 0, deductions: [0, 0, 0] };
    
    switch (difficulty) {
      case 'easy':
        return { start: 500, deductions: [125, 250, 375] };
      case 'medium':
        return { start: 1000, deductions: [250, 500, 750] };
      case 'hard':
        return { start: 1500, deductions: [375, 750, 1125] };
      default:
        return { start: 0, deductions: [0, 0, 0] };
    }
  };

  const calculateCurrentScore = () => {
    const { start, deductions } = getDifficultyPoints();
    
    // Find the highest clue number revealed (1, 2, or 3)
    let maxClueNumber = 0;
    revealedClues.forEach(clueNumber => {
      if (clueNumber >= 1 && clueNumber <= 3 && clueNumber > maxClueNumber) {
        maxClueNumber = clueNumber;
      }
    });
    
    // Use the deduction for the highest revealed clue (replaces previous deductions)
    // clueNumber 1 -> deductions[0], clueNumber 2 -> deductions[1], clueNumber 3 -> deductions[2]
    const currentDeduction = maxClueNumber > 0 ? deductions[maxClueNumber - 1] : 0;
    
    return Math.max(0, start - currentDeduction);
  };

  const getTotalDeduction = () => {
    const { deductions } = getDifficultyPoints();
    
    // Find the highest clue number revealed (1, 2, or 3)
    let maxClueNumber = 0;
    revealedClues.forEach(clueNumber => {
      if (clueNumber >= 1 && clueNumber <= 3 && clueNumber > maxClueNumber) {
        maxClueNumber = clueNumber;
      }
    });
    
    // Return the deduction for the highest revealed clue
    return maxClueNumber > 0 ? deductions[maxClueNumber - 1] : 0;
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

  const getYouTubeEmbedUrl = (url: string): string => {
    if (!url) return '';
    
    // Handle YouTube clip URLs (youtube.com/clip/...)
    // Clips format: youtube.com/clip/[clipId]?v=[videoId]&t=[timestamp]
    if (url.includes('youtube.com/clip/')) {
      try {
        const urlObj = new URL(url);
        // Extract video ID from 'v' query parameter
        const videoId = urlObj.searchParams.get('v');
        
        if (videoId && videoId.length === 11) {
          let embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
          
          // Extract timestamp from 't' parameter
          const tParam = urlObj.searchParams.get('t');
          if (tParam) {
            // Parse timestamp (could be in seconds or format like "125s", "2m5s")
            let seconds = 0;
            if (/^\d+$/.test(tParam)) {
              seconds = parseInt(tParam);
            } else {
              // Handle formats like "125s", "2m5s", "1h2m3s"
              const cleaned = tParam.replace(/s$/, '');
              const hoursMatch = cleaned.match(/(\d+)h/);
              const minutesMatch = cleaned.match(/(\d+)m/);
              const secsMatch = cleaned.match(/(\d+)(?!h|m)/);
              if (hoursMatch) seconds += parseInt(hoursMatch[1]) * 3600;
              if (minutesMatch) seconds += parseInt(minutesMatch[1]) * 60;
              if (secsMatch) seconds += parseInt(secsMatch[1]);
            }
            
            if (seconds > 0) {
              embedUrl += `&start=${seconds}`;
            }
          }
          
          return embedUrl;
        }
      } catch (error) {
        console.error('Error parsing YouTube clip URL:', error);
      }
    }
    
    // Handle YouTube shorts (youtube.com/shorts/...)
    if (url.includes('youtube.com/shorts/')) {
      const shortsMatch = url.match(/youtube\.com\/shorts\/([^?&#]+)/);
      if (shortsMatch && shortsMatch[1]) {
        return `https://www.youtube.com/embed/${shortsMatch[1]}?autoplay=1`;
      }
    }
    
    // Handle YouTube watch URLs with timestamp/clip parameters
    if (url.includes('youtube.com/watch')) {
      // Extract video ID from watch URL
      const watchMatch = url.match(/[?&]v=([^&#]+)/);
      if (watchMatch && watchMatch[1]) {
        // Preserve any timestamp or clip parameters
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.search);
        const videoId = params.get('v');
        if (videoId) {
          let embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
          // Add timestamp if present
          if (params.get('t')) {
            embedUrl += `&start=${params.get('t')}`;
          }
          return embedUrl;
        }
      }
    }
    
    // Extract video ID from various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    
    // If it's already just a video ID
    if (url.length === 11 && !url.includes('/') && !url.includes('?')) {
      return `https://www.youtube.com/embed/${url}?autoplay=1`;
    }
    
    return '';
  };

  const isYouTubeUrl = (url: string): boolean => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be') || (url.length === 11 && !url.includes('/') && !url.includes('watch'));
  };

  const currentClue = currentClueIndex !== null ? question.clues[currentClueIndex] : null;

  const { start } = getDifficultyPoints();
  const currentScore = calculateCurrentScore();
  const totalDeduction = getTotalDeduction();

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-8 pb-32">
      {/* Score Display - Top Right */}
      <div className="fixed top-4 right-4 bg-white rounded-lg shadow-xl p-4 z-40 min-w-[200px]">
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-600 mb-2">
            {difficulty && `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Points`}
          </div>
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {currentScore}
          </div>
          <div className="text-xs text-gray-500">
            Start: {start}
            {totalDeduction > 0 && (
              <span className="text-red-600"> | -{totalDeduction}</span>
            )}
          </div>
        </div>
      </div>

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
          {/* Initial Clue */}
          {question.initialClue && question.initialClue.content && (
            <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
              <h2 className="text-xl font-bold text-gray-800 mb-3">Initial Clue</h2>
              <div className="text-gray-700">
                {question.initialClue.type === 'text' && (
                  <p className="text-lg whitespace-pre-wrap">{question.initialClue.content}</p>
                )}
                {question.initialClue.type === 'image' && (
                  <img
                    src={question.initialClue.content}
                    alt="Initial Clue"
                    className="max-w-full h-auto rounded-lg border border-gray-300"
                    style={{ maxHeight: '400px' }}
                  />
                )}
                {question.initialClue.type === 'link' && question.initialClue.isClip && question.initialClue.content && (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        const width = 800;
                        const height = 600;
                        const left = (window.screen.width - width) / 2;
                        const top = (window.screen.height - height) / 2;
                        window.open(
                          question.initialClue!.content,
                          'YouTubeClip',
                          `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes`
                        );
                      }}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                    >
                      Open YouTube Clip in Browser
                    </button>
                    <p className="text-sm text-gray-600">Click to open the clip in a new window</p>
                  </div>
                )}
                {question.initialClue.type === 'link' && !question.initialClue.isClip && isYouTubeUrl(question.initialClue.content) && (
                  <div className="w-full aspect-video">
                    <iframe
                      width="100%"
                      height="100%"
                      src={getYouTubeEmbedUrl(question.initialClue.content)}
                      title="Initial Clue Video"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="rounded-lg"
                    ></iframe>
                  </div>
                )}
                {question.initialClue.type === 'link' && !question.initialClue.isClip && !isYouTubeUrl(question.initialClue.content) && (
                  <a
                    href={question.initialClue.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline text-lg break-all"
                  >
                    {question.initialClue.content}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Clickable Clues (up to 3 clues) */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Click to Reveal Clues</h2>
            <div className="grid grid-cols-3 gap-4">
              {question.clues.slice(0, 3).map((clue, index) => {
                const clueNumber = index + 1; // Clue 1, 2, or 3
                return (
                  <button
                    key={index}
                    onClick={() => {
                      handleShowClue(index);
                      // Track clue number (1, 2, or 3) for scoring
                      setRevealedClues(prev => {
                        const newSet = new Set(prev);
                        newSet.add(clueNumber);
                        return newSet;
                      });
                    }}
                    className="px-6 py-4 bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg rounded-lg shadow-lg transition-colors"
                  >
                    Clue {clueNumber}
                  </button>
                );
              })}
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
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
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
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl font-bold z-10"
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
              {currentClue.type === 'link' && currentClue.isClip && (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const width = 800;
                      const height = 600;
                      const left = (window.screen.width - width) / 2;
                      const top = (window.screen.height - height) / 2;
                      window.open(
                        currentClue.content,
                        'YouTubeClip',
                        `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes`
                      );
                    }}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                  >
                    Open YouTube Clip in Browser
                  </button>
                  <p className="text-sm text-gray-600">Click to open the clip in a new window</p>
                </div>
              )}
              {currentClue.type === 'link' && !currentClue.isClip && isYouTubeUrl(currentClue.content) && (
                <div className="w-full aspect-video">
                  <iframe
                    width="100%"
                    height="100%"
                    src={getYouTubeEmbedUrl(currentClue.content)}
                    title={`Clue ${currentClueIndex + 1} Video`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="rounded-lg"
                  ></iframe>
                </div>
              )}
              {currentClue.type === 'link' && !currentClue.isClip && !isYouTubeUrl(currentClue.content) && (
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

      {/* Answer Popup Modal */}
      {showAnswer && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              onClick={() => setShowAnswer(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl font-bold z-10"
            >
              ×
            </button>
            <div className="grid grid-cols-2 gap-6">
              {/* Left Half - Movie Poster */}
              <div className="flex items-center justify-center">
                {question.moviePoster ? (
                  <img
                    src={question.moviePoster}
                    alt="Movie Poster"
                    className="max-w-full h-auto rounded-lg shadow-lg"
                    style={{ maxHeight: '70vh' }}
                  />
                ) : (
                  <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">No poster available</p>
                  </div>
                )}
              </div>

              {/* Right Half - Movie Name (Upper) and YouTube Video (Lower) */}
              <div className="flex flex-col gap-4">
                {/* Upper Right - Movie Name */}
                <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg p-6 min-h-[200px]">
                  <div className="text-center">
                    <h3 className="text-3xl font-bold text-gray-800 mb-2">
                      {question.movieName || question.answer}
                    </h3>
                    {!question.movieName && (
                      <p className="text-sm text-gray-500">(Answer: {question.answer})</p>
                    )}
                  </div>
                </div>

                {/* Lower Right - YouTube Video */}
                <div className="flex-1 bg-gray-900 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
                  {question.youtubeVideo ? (
                    <div className="w-full aspect-video">
                      <iframe
                        width="100%"
                        height="100%"
                        src={getYouTubeEmbedUrl(question.youtubeVideo)}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="rounded-lg"
                      ></iframe>
                    </div>
                  ) : (
                    <div className="text-gray-400 text-center">
                      <p>No video available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowAnswer(false)}
              className="mt-6 w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-lg transition-colors"
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
