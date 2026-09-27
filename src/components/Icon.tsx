const PATHS: Record<string, string> = {
  plus: "M12 5v14M5 12h14",
  undo: "M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-2",
  redo: "M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h2",
  code: "m8 6-6 6 6 6M16 6l6 6-6 6",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  layers: "m12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5",
  chevronDown: "m6 9 6 6 6-6",
  chevronUp: "m18 15-6-6-6 6",
  x: "M18 6 6 18M6 6l12 12",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
  save: "M5 4h11l3 3v13H5V4ZM8 4v5h8V4M8 14h8v6H8z",
  download: "M12 4v12m0 0-4-4m4 4 4-4M5 20h14",
  folderOpen: "M3 7h5l2 2h11v10H3V7Z",
  more: "M12 6h.01M12 12h.01M12 18h.01",
  square: "M5 5h14v14H5z",
  squareDashed: "M5 5h4M15 5h4v4M19 15v4h-4M9 19H5v-4",
  type: "M5 6h14M12 6v12",
  text: "M4 7h16M4 12h16M4 17h10",
  heading: "M6 4v16M18 4v16M6 12h12",
  pointer: "M8 3v10l3-2 2 4 2-1-2-4h4L8 3Z",
  image: "M4 4h16v16H4zM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-4 8 5-5 4 4 3-3 4 4",
  textCursor: "M9 4h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H9M7 4H5M7 20H5",
  smartphone: "M7 2h10v20H7zM11 19h2",
  tablet: "M4 4h16v16H4z",
  monitor: "M3 4h18v12H3zM8 20h8M12 16v4",
  link: "M9 15l6-6M8 8l1-1a4 4 0 0 1 6 6l-1 1M16 16l-1 1a4 4 0 0 1-6-6l1-1",
};

export function Icon({
  name,
  size = 18,
  strokeWidth = 1.75,
}: {
  name: keyof typeof PATHS;
  size?: number;
  strokeWidth?: number;
}) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
