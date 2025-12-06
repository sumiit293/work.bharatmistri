// SVG icons for each recruitment step using public folder images
export function StepIcon({ step }: { step: number }) {
  const icons = {
    1: "/file.svg",      // Step 1: Basic Details
    2: "/globe.svg",     // Step 2: Skills/Category
    3: "/window.svg",    // Step 3: Photos/Upload
    4: "/BMSVG.svg",     // Step 4: Verification
  };

  const iconSrc = icons[step as keyof typeof icons] || "/file.svg";
  const stepLabels = {
    1: "Personal Details",
    2: "Skills & Category",
    3: "Photo Upload",
    4: "Verification",
  };

  return (
    <div className="flex flex-col items-center mb-6">
      <img src={iconSrc} alt={`Step ${step}`} className="w-16 h-16 mb-2" style={{ filter: "brightness(0) saturate(100%) invert(18%) sepia(67%) saturate(1313%) hue-rotate(206deg)" }} />
      <p className="text-sm font-medium text-gray-600">{stepLabels[step as keyof typeof stepLabels]}</p>
    </div>
  );
}
