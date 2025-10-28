import { GearItem } from "@/lib/gear";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/routing";

export default function SearchGearCard({ gear }: { gear: GearItem }) {
  return (
    <Link to={ROUTES.GEAR_DETAIL.replace(":gearId", gear.id)} target="_blank">
      <div
        className={cn(
          `bg-white dark:bg-gray-800 rounded-xl shadow-sm cursor-pointer overflow-hidden p-4 w-[500px] flex-shrink-0`,
        )}
      >
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
            <img
              src={gear.imageUrl}
              alt={gear.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-[#191B1F] text-base sm:text-lg leading-tight line-clamp-1">
              {gear.name}
            </h4>
            {gear.brand && (
              <p className="text-sm text-[#191B1FCC] font-normal mb-2 leading-tight line-clamp-1">
                {gear.brand}
                {gear.model && ` ${gear.model}`}
              </p>
            )}

            {/* Main info badges */}
            <div className="flex flex-wrap gap-1 sm:gap-2 overflow-hidden">
              {gear.size && (
                <span className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full font-medium truncate max-w-[60px] sm:max-w-[80px]">
                  {gear.size}
                </span>
              )}
              {gear.weight && (
                <span className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full font-medium truncate w-fit">
                  {gear.weight}
                </span>
              )}
              {gear.targetFish && (
                <span className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full font-medium truncate max-w-[80px] sm:max-w-[200px]">
                  {gear.targetFish}
                </span>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 ml-2"></div>
        </div>
      </div>
    </Link>
  );
}
