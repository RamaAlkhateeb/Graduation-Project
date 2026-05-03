const IslamicPattern = () => (
  <svg
    className="absolute inset-0 w-full h-full opacity-10"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 400 400"
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <pattern id="islamic" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
        {/* Star pattern */}
        <polygon
          points="50,5 61,35 95,35 67,55 78,85 50,67 22,85 33,55 5,35 39,35"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
        />
        {/* Inner octagon */}
        <polygon
          points="50,20 65,30 70,50 65,70 50,80 35,70 30,50 35,30"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
        />
        {/* Connecting lines */}
        <line x1="0" y1="50" x2="30" y2="50" stroke="currentColor" strokeWidth="0.3" />
        <line x1="70" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.3" />
        <line x1="50" y1="0" x2="50" y2="20" stroke="currentColor" strokeWidth="0.3" />
        <line x1="50" y1="80" x2="50" y2="100" stroke="currentColor" strokeWidth="0.3" />
      </pattern>
    </defs>
    <rect width="400" height="400" fill="url(#islamic)" />
  </svg>
);

export default IslamicPattern;
