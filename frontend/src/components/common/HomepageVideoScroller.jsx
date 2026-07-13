import React, { useCallback, useEffect, useRef, useState } from "react";
import api from "../../services/api";

const AUTO_SCROLL_DELAY = 8000;
const AUTO_SCROLL_RESUME_DELAY = 5000;


const HomepageVideoScroller = () => {
  const scrollContainerRef = useRef(null);
  const autoScrollIntervalRef = useRef(null);
  const resumeTimeoutRef = useRef(null);
  const scrollFrameRef = useRef(null);
  const isProgrammaticScrollRef = useRef(false);

  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const clearAutoScroll = useCallback(() => {
    window.clearInterval(autoScrollIntervalRef.current);
    window.clearTimeout(resumeTimeoutRef.current);
    autoScrollIntervalRef.current = null;
    resumeTimeoutRef.current = null;
  }, []);

  const scrollToVideo = useCallback(
    (index, behavior = "smooth") => {
      const container = scrollContainerRef.current;
      if (!container || videos.length === 0) return;

      const nextIndex = ((index % videos.length) + videos.length) % videos.length;

      isProgrammaticScrollRef.current = true;
      container.scrollTo({
        top: container.clientHeight * nextIndex,
        behavior,
      });

      setCurrentIndex(nextIndex);

      window.setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 500);
    },
    [videos.length]
  );

  const startAutoScroll = useCallback(() => {
    window.clearInterval(autoScrollIntervalRef.current);

    if (videos.length < 2) return;

    autoScrollIntervalRef.current = window.setInterval(() => {
      scrollToVideo(currentIndex + 1);
    }, AUTO_SCROLL_DELAY);
  }, [currentIndex, scrollToVideo, videos.length]);

  const handleManualActivity = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;

    window.clearInterval(autoScrollIntervalRef.current);
    window.clearTimeout(resumeTimeoutRef.current);

    resumeTimeoutRef.current = window.setTimeout(() => {
      startAutoScroll();
    }, AUTO_SCROLL_RESUME_DELAY);
  }, [startAutoScroll]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (scrollFrameRef.current) return;

    scrollFrameRef.current = window.requestAnimationFrame(() => {
      const nextIndex = Math.round(container.scrollTop / container.clientHeight);

      setCurrentIndex((previousIndex) =>
        previousIndex === nextIndex ? previousIndex : nextIndex
      );

      scrollFrameRef.current = null;
    });

    handleManualActivity();
  }, [handleManualActivity]);

  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await api.get("/videos/latest");
      setVideos(Array.isArray(response) ? response.slice(0, 3) : []);
      setCurrentIndex(0);
    } catch {
      setErrorMessage("Unable to load the latest stories right now.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  useEffect(() => {
    if (!isLoading && !errorMessage && videos.length > 1) {
      startAutoScroll();
    }

    return clearAutoScroll;
  }, [clearAutoScroll, currentIndex, errorMessage, isLoading, startAutoScroll, videos.length]);

  useEffect(() => {
    return () => {
      window.cancelAnimationFrame(scrollFrameRef.current);
      clearAutoScroll();
    };
  }, [clearAutoScroll]);

  if (isLoading) {
    return (
      <div className="w-full flex flex-col gap-6 mx-auto px-4 sm:px-0 animate-pulse">
        <div className="w-full max-w-[340px] sm:max-w-[380px] md:max-w-[420px] lg:max-w-none lg:w-[460px] mx-auto space-y-3">
          <div className="h-3 w-36 rounded-full bg-white/15" />
          <div className="h-3 w-60 rounded-full bg-white/10" />
          <div className="h-8 w-4/5 rounded-lg bg-white/15" />
        </div>

        <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[380px] md:max-w-[420px] lg:max-w-none lg:w-[460px] h-[420px] sm:h-[500px] md:h-[560px] lg:h-[640px] rounded-[28px] border border-white/10 bg-zinc-950 p-2 shadow-2xl">
          <div className="h-full w-full rounded-[21px] bg-gradient-to-br from-emerald-950 via-zinc-900 to-black">
            <div className="absolute inset-x-10 top-24 h-32 rounded-2xl bg-white/5 blur-2xl" />
            <div className="absolute inset-x-8 bottom-12 h-3 rounded-full bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="w-full flex flex-col gap-6 mx-auto px-4 sm:px-0">
        <div className="w-full max-w-[340px] sm:max-w-[380px] md:max-w-[420px] lg:max-w-none lg:w-[460px] mx-auto text-left space-y-1">
          <div className="text-[10px] sm:text-xs tracking-[0.25em] font-extrabold uppercase text-gold">
            India Unlocked 🇮🇳
          </div>
          <div className="text-[9px] sm:text-[10px] text-white/50 font-bold uppercase tracking-wider">
            Decoding India, District by District
          </div>
        </div>

        <div className="mx-auto flex h-[420px] sm:h-[500px] md:h-[560px] lg:h-[640px] w-full max-w-[340px] sm:max-w-[380px] md:max-w-[420px] lg:max-w-none lg:w-[460px] flex-col items-center justify-center rounded-[28px] border border-red-300/20 bg-gradient-to-b from-zinc-950 to-red-950/40 p-8 text-center shadow-2xl">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-red-300/20 bg-red-400/10 text-2xl">
            !
          </div>
          <h3 className="font-serif text-xl font-semibold text-white">Stories unavailable</h3>
          <p className="mt-2 max-w-[260px] text-sm text-white/55">{errorMessage}</p>
          <button
            type="button"
            onClick={fetchVideos}
            className="mt-6 rounded-full border border-gold/40 bg-gold/10 px-5 py-2 text-xs font-bold uppercase tracking-wider text-gold transition hover:bg-gold/20"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="w-full flex flex-col gap-6 mx-auto px-4 sm:px-0">
        <div className="w-full max-w-[340px] sm:max-w-[380px] md:max-w-[420px] lg:max-w-none lg:w-[460px] mx-auto text-left space-y-1">
          <div className="text-[10px] sm:text-xs tracking-[0.25em] font-extrabold uppercase text-gold">
            India Unlocked 🇮🇳
          </div>
          <div className="text-[9px] sm:text-[10px] text-white/50 font-bold uppercase tracking-wider">
            Decoding India, District by District
          </div>
        </div>

        <div className="mx-auto flex h-[420px] sm:h-[500px] md:h-[560px] lg:h-[640px] w-full max-w-[340px] sm:max-w-[380px] md:max-w-[420px] lg:max-w-none lg:w-[460px] items-center justify-center rounded-[28px] border border-gold/25 bg-gradient-to-b from-emerald-950 to-zinc-950 p-8 text-center shadow-2xl">
          <p className="font-serif text-lg text-gold">No latest videos available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 mx-auto px-4 sm:px-0">
      <div className="w-full max-w-[340px] sm:max-w-[380px] md:max-w-[420px] lg:max-w-none lg:w-[460px] mx-auto text-left space-y-1">
        <div className="text-[10px] sm:text-xs tracking-[0.25em] font-extrabold uppercase text-gold">
          India Unlocked 🇮🇳
        </div>
        <div className="text-[9px] sm:text-[10px] text-white/50 font-bold uppercase tracking-wider">
          Decoding India, District by District
        </div>
        <h3 className="pt-1 text-lg sm:text-2xl font-semibold font-serif text-white tracking-tight leading-tight">
          {videos[currentIndex]?.title}
        </h3>
      </div>

      <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[380px] md:max-w-[420px] lg:max-w-none lg:w-[460px] h-[420px] sm:h-[500px] md:h-[560px] lg:h-[640px] rounded-[40px]  border-[8px]  border-neutral-900 bg-black shadow-[0_30px_80px_rgba(0,0,0,.45)]">
        <div className="pointer-events-none absolute left-1/2 top-3 z-20 flex h-5 w-28 -translate-x-1/2 items-center justify-center rounded-full bg-black">
          <span className="h-1 w-11 rounded-full bg-zinc-700" />
        </div>

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onWheel={handleManualActivity}
          onTouchStart={handleManualActivity}
          onMouseEnter={handleManualActivity}
          className="h-full w-full snap-y snap-mandatory overflow-y-auto rounded-[21px] scroll-smooth [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
        {videos.map((video, index) => (
        <div
                key={video.videoId || `${video.youtubeUrl}-${index}`}
                className="relative h-full w-full snap-start snap-always overflow-hidden bg-zinc-900"
                >
                <a
                    href={video.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Watch on YouTube"
                    className="relative block h-full w-full group cursor-pointer"
                >
                {/* Thumbnail */}
                <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105"
                />

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/30 transition-colors duration-300 group-hover:bg-black/20" />

                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-600 shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:bg-red-500">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="white"
                        className="ml-1 h-10 w-10"
                    >
                        <path d="M8 5v14l11-7z" />
                    </svg>
                    </div>
                </div>

                {/* Bottom Gradient */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

                {/* Click to Watch Badge */}
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/60 backdrop-blur-md px-4 py-2 text-xs font-semibold tracking-wide text-white opacity-0 transition-all duration-300 group-hover:opacity-100">
                    ▶ Watch on YouTube
                </div>
                </a>
            </div>
            ))}
        </div>
        <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/45 px-3 py-2 backdrop-blur-md">
          {videos.map((video, index) => (
            <button
              key={video.videoId || index}
              type="button"
              aria-label={`Go to video ${index + 1}`}
              aria-current={index === currentIndex}
              onClick={() => {
                clearAutoScroll();
                scrollToVideo(index);
                window.setTimeout(startAutoScroll, AUTO_SCROLL_RESUME_DELAY);
              }}
              className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "scale-110 bg-gold shadow-[0_0_10px_rgba(255,215,0,0.8)]"
                  : "bg-white/45 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomepageVideoScroller;