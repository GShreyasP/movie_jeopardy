'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Clue, ClueType, Question, Difficulty } from '../../types';
import { getQuestion, saveQuestion, generateQuestionId } from '../../utils/storage';
import { compressImage } from '../../utils/imageCompression';

function QuestionEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const questionId = searchParams.get('id') || '';
  const difficulty = searchParams.get('difficulty') as Difficulty | null;
  const column = parseInt(searchParams.get('column') || '0');

  const [initialClue, setInitialClue] = useState<Clue>({ type: 'text', content: '' });
  const [clues, setClues] = useState<Clue[]>([
    { type: 'text', content: '' },
    { type: 'text', content: '' },
    { type: 'text', content: '' },
  ]);
  const [moviePoster, setMoviePoster] = useState('');
  const [movieName, setMovieName] = useState('');
  const [youtubeVideo, setYoutubeVideo] = useState('');

  useEffect(() => {
    const existing = getQuestion(questionId);
    if (existing) {
      const defaultClues: Clue[] = [
        { type: 'text', content: '' },
        { type: 'text', content: '' },
        { type: 'text', content: '' },
      ];
      setInitialClue(existing.initialClue || { type: 'text', content: '', isClip: false });
      setClues(existing.clues.length === 3 ? existing.clues : defaultClues);
      setMoviePoster(existing.moviePoster || '');
      setMovieName(existing.movieName || '');
      setYoutubeVideo(existing.youtubeVideo || '');
    }
  }, [questionId]);

  const handleInitialClueTypeChange = (type: ClueType) => {
    setInitialClue({ type, content: '', isClip: false });
  };

  const handleInitialClueContentChange = (content: string) => {
    setInitialClue({ ...initialClue, content });
  };

  const handleInitialClueIsClipChange = (isClip: boolean) => {
    setInitialClue({ ...initialClue, isClip });
  };

  const handleInitialClueImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processImageFileForClue(file, true);
    }
  };

  const processImageFileForClue = async (file: File, isInitial: boolean) => {
    if (file.type.startsWith('image/')) {
      try {
        const compressedImage = await compressImage(file);
        if (isInitial) {
          setInitialClue({ ...initialClue, content: compressedImage });
        }
      } catch (error) {
        console.error('Error compressing image:', error);
        alert('Error processing image. Please try a smaller image file.');
      }
    }
  };

  const handleInitialClueDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleInitialClueDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleInitialClueDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (initialClue.type === 'image') {
      const file = e.dataTransfer.files?.[0];
      if (file) {
        await processImageFileForClue(file, true);
      }
    }
  };

  const handleClueTypeChange = (index: number, type: ClueType) => {
    const newClues = [...clues];
    newClues[index] = { type, content: '', isClip: false };
    setClues(newClues);
  };

  const handleClueContentChange = (index: number, content: string) => {
    const newClues = [...clues];
    newClues[index].content = content;
    setClues(newClues);
  };

  const handleClueIsClipChange = (index: number, isClip: boolean) => {
    const newClues = [...clues];
    newClues[index] = { ...newClues[index], isClip };
    setClues(newClues);
  };

  const handleImageUpload = async (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processClueImageFile(index, file);
    }
  };

  const processClueImageFile = async (index: number, file: File) => {
    if (file.type.startsWith('image/')) {
      try {
        const compressedImage = await compressImage(file);
        handleClueContentChange(index, compressedImage);
      } catch (error) {
        console.error('Error compressing image:', error);
        alert('Error processing image. Please try a smaller image file.');
      }
    }
  };

  const handleClueDragOver = (index: number, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleClueDragLeave = (index: number, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleClueDrop = async (index: number, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (clues[index].type === 'image') {
      const file = e.dataTransfer.files?.[0];
      if (file) {
        await processClueImageFile(index, file);
      }
    }
  };

  const handlePosterUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = async (file: File) => {
    if (file.type.startsWith('image/')) {
      try {
        const compressedImage = await compressImage(file);
        setMoviePoster(compressedImage);
      } catch (error) {
        console.error('Error compressing image:', error);
        alert('Error processing image. Please try a smaller image file.');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processImageFile(file);
    }
  };

  const handleSave = () => {
    if (!questionId) return;

    // Validate required movie information
    if (!movieName.trim()) {
      alert('Movie Name is required');
      return;
    }
    if (!moviePoster.trim()) {
      alert('Movie Poster is required');
      return;
    }
    if (!youtubeVideo.trim()) {
      alert('YouTube Video is required');
      return;
    }

    const question: Question = {
      id: questionId,
      initialClue: initialClue.content.trim() ? initialClue : undefined,
      clues: clues.filter(clue => clue.content.trim() !== ''),
      answer: movieName.trim(), // Use movie name as answer
      moviePoster: moviePoster.trim(),
      movieName: movieName.trim(),
      youtubeVideo: youtubeVideo.trim(),
    };

    try {
      saveQuestion(question);
      router.push('/create');
    } catch (error) {
      // Error is already handled in saveGameData with alert
      console.error('Failed to save question:', error);
    }
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
          {/* Initial Clue */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Initial Clue</h2>
            <div className="border-2 border-blue-500 rounded-lg p-4 space-y-3 bg-blue-50">
              <label className="block text-sm font-semibold text-gray-700">
                Initial Clue (Shown automatically)
              </label>
              
              {/* Initial Clue Type Selector */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => handleInitialClueTypeChange('text')}
                  className={`px-4 py-2 rounded ${
                    initialClue.type === 'text'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } transition-colors`}
                >
                  Text
                </button>
                <button
                  onClick={() => handleInitialClueTypeChange('image')}
                  className={`px-4 py-2 rounded ${
                    initialClue.type === 'image'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } transition-colors`}
                >
                  Image
                </button>
                <button
                  onClick={() => handleInitialClueTypeChange('link')}
                  className={`px-4 py-2 rounded ${
                    initialClue.type === 'link'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } transition-colors`}
                >
                  Link
                </button>
              </div>

              {/* Initial Clue Content Input */}
              {initialClue.type === 'text' && (
                <textarea
                  value={initialClue.content}
                  onChange={(e) => handleInitialClueContentChange(e.target.value)}
                  placeholder="Enter initial clue text..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  rows={4}
                />
              )}

              {initialClue.type === 'image' && (
                <div
                  onDragOver={handleInitialClueDragOver}
                  onDragLeave={handleInitialClueDragLeave}
                  onDrop={handleInitialClueDrop}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                >
                  {initialClue.content ? (
                    <div className="space-y-2">
                      <img
                        src={initialClue.content}
                        alt="Initial Clue"
                        className="max-w-full h-auto rounded-lg border border-gray-300 mx-auto"
                        style={{ maxHeight: '300px' }}
                      />
                      <p className="text-sm text-gray-600">Drop a new image here or click to upload</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleInitialClueImageUpload}
                        className="hidden"
                        id="initial-clue-upload"
                      />
                      <label
                        htmlFor="initial-clue-upload"
                        className="inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer text-sm font-semibold"
                      >
                        Change Image
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-gray-600">Drag and drop an image here, or</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleInitialClueImageUpload}
                        className="hidden"
                        id="initial-clue-upload"
                      />
                      <label
                        htmlFor="initial-clue-upload"
                        className="inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer text-sm font-semibold"
                      >
                        Choose File
                      </label>
                    </div>
                  )}
                </div>
              )}

              {initialClue.type === 'link' && (
                <div className="space-y-2">
                  <input
                    type="url"
                    value={initialClue.content}
                    onChange={(e) => handleInitialClueContentChange(e.target.value)}
                    placeholder="Enter link URL (e.g., https://example.com)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={initialClue.isClip || false}
                      onChange={(e) => handleInitialClueIsClipChange(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span>This is a YouTube clip</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Additional Clues */}
          <div className="space-y-6 border-t-2 border-gray-300 pt-6">
            <h2 className="text-2xl font-bold text-gray-800">Additional Clues (Enter up to 3 clues)</h2>
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
                  <div
                    onDragOver={(e) => handleClueDragOver(index, e)}
                    onDragLeave={(e) => handleClueDragLeave(index, e)}
                    onDrop={(e) => handleClueDrop(index, e)}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                  >
                    {clue.content ? (
                      <div className="space-y-2">
                        <img
                          src={clue.content}
                          alt={`Clue ${index + 1}`}
                          className="max-w-full h-auto rounded-lg border border-gray-300 mx-auto"
                          style={{ maxHeight: '300px' }}
                        />
                        <p className="text-sm text-gray-600">Drop a new image here or click to upload</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(index, e)}
                          className="hidden"
                          id={`clue-${index}-upload`}
                        />
                        <label
                          htmlFor={`clue-${index}-upload`}
                          className="inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer text-sm font-semibold"
                        >
                          Change Image
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-gray-600">Drag and drop an image here, or</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(index, e)}
                          className="hidden"
                          id={`clue-${index}-upload`}
                        />
                        <label
                          htmlFor={`clue-${index}-upload`}
                          className="inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer text-sm font-semibold"
                        >
                          Choose File
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {clue.type === 'link' && (
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={clue.content}
                      onChange={(e) => handleClueContentChange(index, e.target.value)}
                      placeholder="Enter link URL (e.g., https://example.com)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    />
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={clue.isClip || false}
                        onChange={(e) => handleClueIsClipChange(index, e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span>This is a YouTube clip</span>
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Movie Information */}
          <div className="border-t-2 border-gray-300 pt-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Movie Information</h2>
            
            {/* Movie Poster */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Movie Poster
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
              >
                {moviePoster ? (
                  <div className="space-y-2">
                    <img
                      src={moviePoster}
                      alt="Movie Poster"
                      className="max-w-full h-auto rounded-lg border border-gray-300 mx-auto"
                      style={{ maxHeight: '300px' }}
                    />
                    <p className="text-sm text-gray-600">Drop a new image here or click to upload</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePosterUpload}
                      className="hidden"
                      id="poster-upload"
                    />
                    <label
                      htmlFor="poster-upload"
                      className="inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer text-sm font-semibold"
                    >
                      Change Image
                    </label>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-gray-600">Drag and drop an image here, or</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePosterUpload}
                      className="hidden"
                      id="poster-upload"
                    />
                    <label
                      htmlFor="poster-upload"
                      className="inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer text-sm font-semibold"
                    >
                      Choose File
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Movie Name */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Movie Name
              </label>
              <input
                type="text"
                value={movieName}
                onChange={(e) => setMovieName(e.target.value)}
                placeholder="Enter movie name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              />
            </div>

            {/* YouTube Video */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                YouTube Video URL
              </label>
              <input
                type="url"
                value={youtubeVideo}
                onChange={(e) => setYoutubeVideo(e.target.value)}
                placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=...) or video ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              />
            </div>
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
