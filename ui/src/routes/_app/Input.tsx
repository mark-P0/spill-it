import { ComponentProps, useEffect, useRef } from "react";

// TODO Allow providing refs?
/** Allow specifying custom validity(ies) as props */
export function Input(
  props: Omit<ComponentProps<"input">, "ref"> & {
    validity?: string;
    reportValidity?: boolean;
  },
) {
  const { validity, reportValidity, ...attributes } = props;

  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    const input = inputRef.current;
    if (input === null) return;

    input.setCustomValidity(validity ?? "");
    if (reportValidity) input.reportValidity();
  }, [validity, reportValidity]);

  return <input {...attributes} ref={inputRef} />;
}
