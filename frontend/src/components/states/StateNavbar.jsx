import { NavLink, useParams } from "react-router-dom";

const tabs = [
  { name: "History", path: "history" },
  { name: "Heritage Sites & Monuments", path: "heritage-sites-monuments" },
  { name: "Geography", path: "geography" },
  { name: "Art & Culture", path: "art-and-culture" },
];

export default function StateNavbar() {
  const { stateSlug } = useParams();

  return (
    <div className="flex justify-center mb-10">
      <div className="flex flex-wrap items-center gap-2 bg-gray-900 border border-gray-700 rounded-xl p-2 shadow-lg">

        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={`/state/${stateSlug}/${tab.path}`}
            className={({ isActive }) =>
              `px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                isActive
                  ? "bg-amber-500 text-black"
                  : "text-gray-300 hover:bg-gray-800 hover:text-amber-400"
              }`
            }
          >
            {tab.name}
          </NavLink>
        ))}

      </div>
    </div>
  );
}