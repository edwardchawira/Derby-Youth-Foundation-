"use client";

import { useRef, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAudioPlayer } from '@/lib/audio-player-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music,
  X,
  Loader2
} from 'lucide-react';

export function AudioPlayer() {
  const { currentTrack, isPlaying, setIsPlaying, setCurrentTrack } = useAudioPlayer();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentTrack) {
      loadAudioFile();
    } else {
      setAudioUrl(null);
    }
  }, [currentTrack]);

  const loadAudioFile = async () => {
    if (!currentTrack) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('project-files')
        .download(currentTrack.filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      setAudioUrl(url);
    } catch (error) {
      console.error('Error loading audio:', error);
      setCurrentTrack(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying && audioUrl) {
      audio.play().catch(err => {
        console.error('Error playing audio:', err);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleClose = () => {
    setIsPlaying(false);
    setCurrentTrack(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) return null;

  return (
    <Card className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-2xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 p-2 bg-gradient-to-br from-[#0047AB]/10 to-[#0047AB]/5 rounded-lg">
              {loading ? (
                <Loader2 className="h-5 w-5 text-[#0047AB] animate-spin" />
              ) : (
                <Music className="h-5 w-5 text-[#0047AB]" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1A1A1A] truncate">
                {currentTrack.fileName}
              </p>
              <p className="text-xs text-gray-600 truncate">
                {currentTrack.uploaderName}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 flex-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={togglePlayPause}
                disabled={loading}
                className="h-9 w-9 rounded-full bg-[#0047AB] hover:bg-[#003380] text-white p-0"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5" />
                )}
              </Button>
            </div>

            <div className="flex-1 flex items-center gap-2">
              <span className="text-xs text-gray-600 font-medium min-w-[40px] text-right">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="flex-1"
                disabled={loading}
              />
              <span className="text-xs text-gray-600 font-medium min-w-[40px]">
                {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="h-8 w-8 p-0 text-gray-600 hover:text-[#0047AB]"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-24"
              />
            </div>
          </div>

          <div className="sm:hidden flex items-center gap-2">
            <Button
              size="sm"
              onClick={togglePlayPause}
              disabled={loading}
              className="h-9 w-9 rounded-full bg-[#0047AB] hover:bg-[#003380] text-white p-0"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0 text-gray-600 hover:text-red-600 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="sm:hidden mt-2 flex items-center gap-2">
          <span className="text-xs text-gray-600 font-medium min-w-[40px] text-right">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="flex-1"
            disabled={loading}
          />
          <span className="text-xs text-gray-600 font-medium min-w-[40px]">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} preload="auto" />
      )}
    </Card>
  );
}
