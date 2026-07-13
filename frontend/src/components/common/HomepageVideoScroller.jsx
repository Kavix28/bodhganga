import React, { useCallback, useEffect, useRef, useState } from "react";
import api from "../../services/api";

const AUTO_SCROLL_DELAY = 3000;
const AUTO_SCROLL_RESUME_DELAY = 1000;


const HomepageVideoScroller = () => {
  const feedRef = useRef(null);
  const autoScrollIntervalRef = useRef(null);
  const resumeTimeoutRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [videos, setVideos] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
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
      const feed = feedRef.current;

      if (!feed || videos.length === 0) return;

      const targetIndex = ((index % videos.length) + videos.length) % videos.length;

      feed.scrollTo({
        top: feed.clientHeight * targetIndex,
        behavior,
      });

      setActiveIndex(targetIndex);
    },
    [videos.length]
  );

  const startAutoScroll = useCallback(() => {
    window.clearInterval(autoScrollIntervalRef.current);

    if (videos.length < 2) return;

    autoScrollIntervalRef.current = window.setInterval(() => {
      setActiveIndex((previousIndex) => {
        const nextIndex = (previousIndex + 1) % videos.length;

        feedRef.current?.scrollTo({
          top: feedRef.current.clientHeight * nextIndex,
          behavior: "smooth",
        });

        return nextIndex;
      });
    }, AUTO_SCROLL_DELAY);
  }, [videos.length]);

  const handleManualScroll = useCallback(() => {
    window.clearInterval(autoScrollIntervalRef.current);
    window.clearTimeout(resumeTimeoutRef.current);

    resumeTimeoutRef.current = window.setTimeout(() => {
      startAutoScroll();
    }, AUTO_SCROLL_RESUME_DELAY);
  }, [startAutoScroll]);

  const handleFeedScroll = useCallback(() => {
    const feed = feedRef.current;

    if (!feed || animationFrameRef.current) return;

    animationFrameRef.current = window.requestAnimationFrame(() => {
      const nextIndex = Math.round(feed.scrollTop / feed.clientHeight);

      setActiveIndex((previousIndex) =>
        previousIndex === nextIndex ? previousIndex : nextIndex
      );

      animationFrameRef.current = null;
    });
  }, []);

  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await api.get("/videos/latest");

      const latestVideos = Array.isArray(response)
        ? response.slice(0, 3)
        : [];

      setVideos(latestVideos);
      setActiveIndex(0);

      feedRef.current?.scrollTo({ top: 0, behavior: "auto" });
    } catch {
      setVideos([]);
      setErrorMessage("We could not load the latest videos.");
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
  }, [clearAutoScroll, errorMessage, isLoading, startAutoScroll, videos.length]);

  useEffect(() => {
    return () => {
      window.cancelAnimationFrame(animationFrameRef.current);
      clearAutoScroll();
    };
  }, [clearAutoScroll]);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[280px] sm:max-w-[320px] lg:w-[380px] lg:max-w-none">
        <div className="h-[500px] overflow-hidden rounded-[30px] border border-zinc-200 bg-zinc-950 p-2 shadow-2xl sm:h-[580px] lg:h-[640px]">
          <div className="h-full overflow-hidden rounded-[23px] bg-black">
            

            <div className="animate-pulse space-y-5 p-4">
              <div className="aspect-video w-full rounded-xl bg-zinc-200" />
              <div className="h-5 w-11/12 rounded bg-zinc-200" />
              <div className="h-4 w-2/3 rounded bg-zinc-100" />
              <div className="mt-8 aspect-video w-full rounded-xl bg-zinc-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="mx-auto w-full max-w-[280px] sm:max-w-[320px] lg:w-[380px] lg:max-w-none">
        <div className="h-[500px] overflow-hidden rounded-[30px] border border-zinc-200 bg-zinc-950 p-2 shadow-2xl sm:h-[580px] lg:h-[640px]">
          <div className="flex h-full flex-col overflow-hidden rounded-[23px] bg-black">
            

            <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl text-red-600">
                !
              </div>

              <h3 className="text-lg font-semibold text-white">
                Something went wrong
              </h3>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                {errorMessage}
              </p>

              <button
                type="button"
                onClick={fetchVideos}
                className="mt-6 rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 active:scale-95"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[280px] sm:max-w-[320px] lg:w-[380px] lg:max-w-none">
        <div className="h-[500px] overflow-hidden rounded-[30px] border border-zinc-200 bg-zinc-950 p-2 shadow-2xl sm:h-[580px] lg:h-[640px]">
          <div className="flex h-full flex-col overflow-hidden rounded-[23px] bg-black">
            

            <div className="flex flex-1 items-center justify-center px-8 text-center">
              <p className="text-sm text-zinc-500">
                No videos available right now.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[280px] sm:max-w-[320px] lg:w-[380px] lg:max-w-none">
      <div className="h-[500px] overflow-hidden rounded-[30px] border border-zinc-200 bg-zinc-950 p-2 shadow-2xl sm:h-[580px] lg:h-[640px]">
        <div className="flex h-full flex-col overflow-hidden rounded-[23px] bg-black">
          

          <div className="relative min-h-0 flex-1">
            <div
              ref={feedRef}
              onScroll={handleFeedScroll}
              onWheel={handleManualScroll}
              onTouchStart={handleManualScroll}
              onTouchMove={handleManualScroll}
              onTouchEnd={handleManualScroll}
              className="h-full snap-y snap-mandatory overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none" }}
            >
              {videos.map((video, index) => (
                <a
                  key={video.videoId || `${video.youtubeUrl}-${index}`}
                  href={video.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Watch ${video.title || "video"} on YouTube`}
                  className="group flex h-full snap-start snap-always flex-col justify-center px-3 py-4"
                >
                  <div className="relative overflow-hidden rounded-xl bg-zinc-200 shadow-sm">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title || "YouTube video thumbnail"}
                      loading={index === 0 ? "eager" : "lazy"}
                      className="h-[320px] w-full object-cover transition duration-500 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/20" />

                    <div className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-600 shadow-lg transition duration-300 group-hover:scale-110 group-hover:bg-red-700">
                      <svg
                        viewBox="0 0 24 24"
                        className="ml-1 h-7 w-7 fill-white"
                        aria-hidden="true"
                      >
                        <path d="M8 5.5v13L18.5 12 8 5.5Z" />
                      </svg>
                    </div>
                  </div>

                  <h3 className="mt-3 px-1 text-left text-base font-semibold leading-snug text-white transition group-hover:text-red-600">
                    {video.title || "Latest video from BodhGanga"}
                  </h3>
                </a>
              ))}
            </div>

            <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-zinc-900/80 px-3 py-2 shadow-lg backdrop-blur-sm">
              {videos.map((video, index) => (
                <button
                  key={video.videoId || index}
                  type="button"
                  aria-label={`Go to video ${index + 1}`}
                  aria-current={activeIndex === index}
                  onClick={() => {
                    clearAutoScroll();
                    scrollToVideo(index);

                    resumeTimeoutRef.current = window.setTimeout(() => {
                        startAutoScroll();
                    }, AUTO_SCROLL_RESUME_DELAY);
                    }}
                  className={`pointer-events-auto h-2 w-2 rounded-full transition-all duration-300 ${
                    activeIndex === index
                      ? "w-5 bg-red-600"
                      : "bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomepageVideoScroller;