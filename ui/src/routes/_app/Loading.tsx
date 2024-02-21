/**
 * More reliable for showing a cursor over a whole element
 * as interactive elements override it with their respective styles
 */
export function LoadingCursorAbsoluteOverlay() {
  return (
    <div className="absolute top-0 left-0 w-full h-full cursor-wait"></div>
  );
}

export function LoadingIndicator() {
  return (
    <figure className="grid">
      <figcaption className="sr-only">Loading...</figcaption>

      <div className="row-[1] col-[1] animate-[ping_1.5s_ease-out_infinite]">
        <div className="w-9 aspect-square rounded-full animate-palette"></div>
      </div>
      <div className="row-[1] col-[1]">
        <div className="w-9 aspect-square rounded-full animate-palette"></div>
      </div>
    </figure>
  );
}
