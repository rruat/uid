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
  alignLeft: "M15 10H3M21 6H3M21 14H3M15 18H3",
  alignCenter: "M18 10H6M21 6H3M21 14H3M18 18H6",
  alignRight: "M21 10H9M21 6H3M21 14H3M21 18H9",
  alignJustify: "M21 6H3M21 10H3M21 14H3M21 18H3",
  alignTop: "M4 4h16M12 20V8M8 12l4-4 4 4",
  alignMiddle: "M4 12h16M12 20V4",
  alignBottom: "M4 20h16M12 4v12M8 12l4 4 4-4",
  bold: "M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z",
  italic: "M19 4h-9M14 20H5M15 4L9 20",
  palette: "M12 2C6.49 2 2 6.49 2 12c0 4.14 2.52 7.7 6.13 9.17.48.2.87-.2.87-.71v-1.46c0-.98.8-1.78 1.78-1.78h1.22c4.97 0 9-4.03 9-9 0-5.51-4.49-10-10-10zM6.5 12c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",
  bringForward: "M15 3H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z M9 9h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-2",
  sendBackward: "M9 9H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4 M15 3h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
  grip: "M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01",
  check: "M20 6L9 17l-5-5",
  sparkles: "m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z",
  layout: "M3 3h18v18H3z M3 9h18 M9 21V9",
  columns: "M4 4h7v16H4z M13 4h7v16h-7z",
  sliders: "M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6",
  ruler: "M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6Zm4 0v3M9 6v2M12 6v3M15 6v2M18 6v3",
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z",
  magnet: "M4 4v7a8 8 0 0 0 16 0V4M4 8h5M15 8h5",
  eyeOff: "M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20",
  move: "M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20",
  arrowUp: "m5 12 7-7 7 7M12 19V5",
  arrowDown: "m19 12-7 7-7-7M12 5v14",
  arrowLeft: "m12 19-7-7 7-7M19 12H5",
  arrowRight: "m12 5 7 7-7 7M5 12h14",
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
