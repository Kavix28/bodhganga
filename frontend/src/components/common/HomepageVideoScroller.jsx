import React, { useCallback, useEffect, useRef, useState } from "react";
import api from "../../services/api";

const AUTO_SCROLL_DELAY = 3500;
const AUTO_SCROLL_RESUME_DELAY = 2000;

const HomepageVideoScroller = () => {
  const feedRef = useRef(null);

  const autoScrollIntervalRef = useRef(null);
  const resumeTimeoutRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // -----------------------------
  // Cleanup
  // -----------------------------

  const clearAutoScroll = useCallback(() => {
    window.clearInterval(autoScrollIntervalRef.current);
    window.clearTimeout(resumeTimeoutRef.current);

    autoScrollIntervalRef.current = null;
    resumeTimeoutRef.current = null;
  }, []);

  // -----------------------------
  // Fetch Videos
  // -----------------------------

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/videos/latest");

      const latestVideos = Array.isArray(response)
        ? response
        : [];

      setVideos(latestVideos);
    } catch (err) {
      console.error(err);

      setError("Unable to load videos.");

      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // -----------------------------
  // Auto Scroll
  // -----------------------------

  const startAutoScroll = useCallback(() => {
    clearAutoScroll();

    const container = feedRef.current;

    if (!container) return;

    autoScrollIntervalRef.current = window.setInterval(() => {

      const card =
        container.querySelector("[data-video-card]");

      if (!card) return;

      const cardHeight =
        card.getBoundingClientRect().height + 20;

      const maxScroll =
        container.scrollHeight -
        container.clientHeight;

      if (
        container.scrollTop + cardHeight >=
        maxScroll
      ) {
        container.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        return;
      }

      container.scrollBy({
        top: cardHeight,
        behavior: "smooth",
      });

    }, AUTO_SCROLL_DELAY);

  }, [clearAutoScroll]);

  // -----------------------------
  // Pause while user scrolls
  // -----------------------------

  const handleManualScroll = useCallback(() => {

    clearAutoScroll();

    resumeTimeoutRef.current =
      window.setTimeout(() => {
        startAutoScroll();
      }, AUTO_SCROLL_RESUME_DELAY);

  }, [clearAutoScroll, startAutoScroll]);

  // -----------------------------
  // Scroll optimisation
  // -----------------------------

  const handleScroll = useCallback(() => {

    if (animationFrameRef.current) return;

    animationFrameRef.current =
      window.requestAnimationFrame(() => {
        animationFrameRef.current = null;
      });

  }, []);

  useEffect(() => {

    if (!loading && !error && videos.length > 1) {
      startAutoScroll();
    }

    return clearAutoScroll;

  }, [
    loading,
    error,
    videos.length,
    startAutoScroll,
    clearAutoScroll,
  ]);

  useEffect(() => {

    return () => {

      clearAutoScroll();

      window.cancelAnimationFrame(
        animationFrameRef.current
      );

    };

  }, [clearAutoScroll]);
    // ----------------------------------
  // Loading State
  // ----------------------------------

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[340px] sm:max-w-[360px] lg:w-[400px]">
        <div className="h-[75vh] lg:h-[700px] rounded-[32px] border border-zinc-800 bg-black p-3 shadow-2xl">
          <div className="h-full overflow-hidden rounded-[24px] bg-black">
            <div className="animate-pulse space-y-8 p-4">

              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="space-y-3"
                >
                  <div className="aspect-video rounded-xl bg-zinc-800" />

                  <div className="h-4 w-11/12 rounded bg-zinc-700" />

                  <div className="h-3 w-2/3 rounded bg-zinc-800" />
                </div>
              ))}

            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------
  // Error State
  // ----------------------------------

  if (error) {
    return (
      <div className="mx-auto w-full max-w-[340px] sm:max-w-[360px] lg:w-[400px]">
        <div className="h-[75vh] lg:h-[700px] rounded-[32px] border border-zinc-800 bg-black p-3 shadow-2xl">

          <div className="flex h-full items-center justify-center rounded-[24px] bg-black">

            <div className="text-center">

              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-3xl font-bold text-white">
                !
              </div>

              <h3 className="text-xl font-semibold text-white">
                Unable to load videos
              </h3>

              <p className="mt-2 text-sm text-zinc-400">
                {error}
              </p>

              <button
                onClick={fetchVideos}
                className="mt-6 rounded-full bg-red-600 px-6 py-3 font-medium text-white transition hover:bg-red-700"
              >
                Retry
              </button>

            </div>

          </div>

        </div>
      </div>
    );
  }

  // ----------------------------------
  // Empty State
  // ----------------------------------

  if (videos.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[340px] sm:max-w-[360px] lg:w-[400px]">
        <div className="h-[75vh] lg:h-[700px] rounded-[32px] border border-zinc-800 bg-black p-3 shadow-2xl">

          <div className="flex h-full items-center justify-center rounded-[24px] bg-black">

            <div className="text-center">

              <h3 className="text-xl font-semibold text-white">
                No Videos Available
              </h3>

              <p className="mt-3 text-zinc-400">
                Latest videos will appear here.
              </p>

            </div>

          </div>

        </div>
      </div>
    );
  }

  // ----------------------------------
  // Main UI
  // ----------------------------------

  return (

    <div className="mx-auto w-full max-w-[340px] sm:max-w-[360px] lg:w-[400px]">

      {/* Phone */}

      <div className="h-[75vh] lg:h-[700px] rounded-[32px] border border-zinc-800 bg-black p-3 shadow-[0_20px_80px_rgba(0,0,0,.45)]">

        <div
          ref={feedRef}
          onScroll={handleScroll}
          onWheel={handleManualScroll}
          onTouchStart={handleManualScroll}
          onTouchMove={handleManualScroll}
          onTouchEnd={handleManualScroll}
          className="
            h-full
            overflow-y-auto
            rounded-[24px]
            bg-black
            px-4
            py-4
            space-y-8
            scroll-smooth
            [&::-webkit-scrollbar]:hidden
          "
          style={{
            scrollbarWidth: "none",
          }}
        >
                      {videos.map((video, index) => (
            <a
              key={video.videoId || video.youtubeUrl || index}
              href={video.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-video-card
              className="group block"
            >
              {/* Thumbnail */}

              <div className="relative overflow-hidden rounded-2xl bg-zinc-900 shadow-lg">

                <img
                  src={video.thumbnailUrl}
                  alt={video.title || "Video Thumbnail"}
                  loading={index < 2 ? "eager" : "lazy"}
                  className="
                    h-[200px]
                    w-full
                    object-cover
                    transition
                    duration-500
                    group-hover:scale-[1.03]
                  "
                />

                {/* Dark Overlay */}

                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition" />

                {/* Duration Badge */}

                {video.duration && (
                  <div
                    className="
                      absolute
                      bottom-3
                      right-3
                      rounded
                      bg-black/80
                      px-2
                      py-1
                      text-[11px]
                      font-medium
                      text-white
                    "
                  >
                    {video.duration}
                  </div>
                )}

                {/* Play Button */}

                <div
                  className="
                    absolute
                    left-1/2
                    top-1/2
                    flex
                    h-16
                    w-16
                    -translate-x-1/2
                    -translate-y-1/2
                    items-center
                    justify-center
                    rounded-full
                    bg-red-600
                    shadow-xl
                    transition
                    duration-300
                    group-hover:scale-110
                    group-hover:bg-red-700
                  "
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="ml-1 h-8 w-8 fill-white"
                  >
                    <path d="M8 5.5v13L18.5 12 8 5.5Z" />
                  </svg>
                </div>

              </div>

              {/* Video Details */}

              <div className="min-w-0">

                

                  <h3
                    className="
                      line-clamp-2
                      text-[15px]
                      font-semibold
                      leading-6
                      text-white
                    "
                  >
                    {video.title || "Latest Video"}
                  </h3>

                  <p className="mt-1 text-xs text-zinc-400">
                    BodhGanga Academy
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    {video.views || "Latest Upload"}
                    {video.uploadedAt && ` • ${video.uploadedAt}`}
                  </p>

                </div>

              

            </a>
          ))}
                </div>
      </div>
    </div>
  );
};

export default HomepageVideoScroller;