import { LocationData } from "@/hooks/queries";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";

export default function LocationBtn({
  useLocationContext,
  location,
  iconClassName,
  textClassName,
}: {
  useLocationContext?: boolean;
  location?: LocationData;
  iconClassName?: string;
  textClassName?: string;
}) {
  return (
    <>
      {/* {typeof location?.name === "string"
        ? location.name.replace(/^"|"$/g, "")
        : "Unknown Location"} */}
      <span
        className={cn(
          "text-sm text-lishka-blue truncate font-semibold",
          textClassName,
        )}
      >
        {useLocationContext
          ? location?.name || "Getting location..."
          : "Global search"}
      </span>
      <MapPin
        size={16}
        className={cn(
          useLocationContext ? "text-lishka-blue" : "text-gray-400",
          iconClassName,
        )}
      />
    </>
  );
}
