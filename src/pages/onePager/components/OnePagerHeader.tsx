import React from "react";

interface OnePagerHeaderProps {
  selectedCropClassName: string;
  selectedCropComparisonName: string;
  selectedDate: string;
}

export const OnePagerHeader: React.FC<OnePagerHeaderProps> = ({
  selectedCropClassName,
  selectedCropComparisonName,
  selectedDate,
}) => {
  const formatDateUTC = (dateString: string) => {
    const d = new Date(`${dateString}T00:00:00.000Z`);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      timeZone: "UTC",
    });
  };

  // Remove trailing "comparison" if present so we can render it on its own line.
  const cropName = (selectedCropComparisonName || "")
    .replace(/\s*comparison\s*$/i, "")
    .trim();

  return (
    <header className="px-4 pt-4 pb-2">
      <div className="grid grid-cols-12 items-start gap-4 md:gap-6">
        {/* Left: Large Logo */}
        <div className="col-span-6 md:col-span-7">
          {/* If your PNG has transparent padding, this scales it a touch so it fills better.
             Replace with a tight-bounds SVG for best results. */}
          <div className="relative h-28 md:h-40 lg:h-48">
            <img
              src="/Trigger-Grain-Marketing_SQUARE.png"
              alt="Trigger Grain Marketing"
              className="absolute inset-0 h-full w-auto max-w-none object-contain md:scale-110 md:translate-x-2"
              loading="eager"
            />
          </div>
        </div>

        {/* Right: Title / Date / Contact */}
        <div className="col-span-6 md:col-span-5">
          <div className="bg-gradient-to-r from-white to-slate-50 rounded-md px-3 md:px-4 py-2 md:py-3">
            <h1 className="text-right text-3xl md:text-5xl font-extrabold leading-tight tracking-tight text-black">
              <span className="block">{cropName}</span>
              <span className="block">Comparison</span>
            </h1>

            <p className="text-right text-sm md:text-lg font-bold text-black mt-2">
              {formatDateUTC(selectedDate)}
            </p>

            <address className="not-italic text-right mt-3 text-[11px] md:text-sm leading-5 text-slate-800">
              <div>
                <span className="font-medium">Phone:</span> (306) 830-6787
              </div>
              <div>
                <span className="font-medium">Email:</span>{" "}
                <a href="mailto:sarah@triggergrain.ca" className="underline">
                  sarah@triggergrain.ca
                </a>
              </div>
              <div>
                <span className="font-medium">Website:</span>{" "}
                <a href="https://www.triggergrain.ca" className="underline">
                  www.triggergrain.ca
                </a>
              </div>
            </address>
          </div>
        </div>
      </div>
    </header>
  );
};
