import React, { useEffect, useRef } from "react";
import "./InternsPage.css";

const interns = [
  {
    id: 1,
    name: "Sarthak Verma",
    post: "AI Engineer Intern",
    photo: "/interns/Sarthak-Verma.jpeg",
  },
  {
    id: 2,
    name: "Aditya Shukhla",
    post: "Machine Learning Intern",
    photo: "/interns/Aditya.jpeg",
  },
];

const InternsPage = () => {
  const cardRefs = useRef([]);

  // Scroll animation
  useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove("show");

          // Restart animation
          void entry.target.offsetWidth;

          entry.target.classList.add("show");
        } else {
          entry.target.classList.remove("show");
        }
      });
    },
    {
      threshold: 0.2,
    }
  );

  cardRefs.current.forEach((card) => {
    if (card) {
      observer.observe(card);
    }
  });

  return () => observer.disconnect();
}, []);

  return (
    <div className="min-h-screen bg-[#06452F] px-5 py-20">

      {/* Header */}
      <div className="mx-auto mb-20 max-w-3xl text-center">
        <p className="mb-4 text-sm font-semibold tracking-[0.3em] text-[#D4AF61]">
          BODHGANGA ACADEMY
        </p>

        <h1 className="text-4xl font-bold text-white md:text-6xl">
          Our Interns
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-green-100/75">
          Recognizing the dedication and contributions of our internship
          program participants.
        </p>

        <div className="mx-auto mt-8 h-[2px] w-16 bg-[#D4AF61]" />
      </div>

      {/* Intern Profiles */}
      <div className="mx-auto max-w-7xl space-y-10">

        {interns.map((intern) => {
          const isEven = intern.id % 2 === 0;

          return (
            <div
              key={intern.id}
              ref={(el) => {
                cardRefs.current[intern.id - 1] = el;
              }}
              className={`intern-card ${
                isEven ? "from-right" : "from-left"
              } flex ${
                isEven ? "justify-end" : "justify-start"
              }`}
            >

              {/* Profile Card */}
              <div
                className={`
                  relative
                  flex
                  w-full
                  max-w-5xl
                  flex-col
                  items-center
                  gap-8
                  overflow-hidden
                  rounded-3xl
                  border
                  border-[#D4AF61]/40
                  bg-[#F8F6EF]
                  p-8
                  shadow-2xl
                  md:flex-row
                  md:p-10
                  ${
                    isEven
                      ? "md:flex-row-reverse"
                      : "md:flex-row"
                  }
                `}
              >

                {/* Number */}
                <div
                  className={`
                    absolute top-5 text-6xl font-black text-[#06452F]/[0.07]
                    ${
                      isEven
                        ? "right-8"
                        : "left-8"
                    }
                  `}
                >
                  {String(intern.id).padStart(2, "0")}
                </div>

                {/* Photo */}
                <div className="relative z-10 flex-shrink-0">

                  <div className="rounded-full border-[5px] border-[#D4AF61] p-2">
                    <img
                      src={intern.photo}
                      alt={intern.name}
                      className="
                        h-36
                        w-36
                        rounded-full
                        object-cover
                        md:h-44
                        md:w-44
                      "
                    />
                  </div>

                  {/* Verified Badge */}
                  <div className="absolute bottom-1 right-2 flex h-9 w-9 items-center justify-center rounded-full border-4 border-[#F8F6EF] bg-[#06452F] text-sm font-bold text-[#D4AF61]">
                    ✓
                  </div>

                </div>

                {/* Information */}
                <div
                  className={`
                    relative
                    z-10
                    flex-1
                    ${
                      isEven
                        ? "text-center md:text-right"
                        : "text-center md:text-left"
                    }
                  `}
                >

                  <div
                    className={`
                      mb-4 flex items-center gap-3
                      ${
                        isEven
                          ? "justify-center md:justify-end"
                          : "justify-center md:justify-start"
                      }
                    `}
                  >
                    <span className="h-2 w-2 rounded-full bg-[#D4AF61]" />

                    <span className="text-xs font-bold tracking-[0.25em] text-[#B18B36]">
                      VERIFIED INTERN
                    </span>
                  </div>

                  <h2 className="text-3xl font-bold tracking-tight text-[#123C2C] md:text-4xl">
                    {intern.name}
                  </h2>

                  <p className="mt-4 text-lg font-medium text-gray-600">
                    {intern.post}
                  </p>

                  <div
                    className={`
                      mt-6 flex flex-wrap items-center gap-3
                      ${
                        isEven
                          ? "justify-center md:justify-end"
                          : "justify-center md:justify-start"
                      }
                    `}
                  >
                    <span className="rounded-full bg-[#06452F] px-4 py-2 text-xs font-semibold text-white">
                      BodhGanga Academy
                    </span>

                    <span className="rounded-full border border-[#D4AF61] px-4 py-2 text-xs font-semibold text-[#927127]">
                      Internship Record
                    </span>
                  </div>

                </div>

                {/* Decorative Gold Edge */}
                <div
                  className={`
                    absolute bottom-0 h-1 w-40 bg-[#D4AF61]
                    ${
                      isEven
                        ? "right-0"
                        : "left-0"
                    }
                  `}
                />

              </div>

            </div>
          );
        })}

      </div>

      {/* Footer */}
      <div className="mt-20 text-center">
        <p className="text-xs tracking-widest text-green-100/50">
          OFFICIAL INTERNSHIP DIRECTORY
        </p>
      </div>

    </div>
  );
};

export default InternsPage;