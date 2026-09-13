import { Fragment } from "react";

interface WordsProps {
  text: string;
  /** Words wrapped in *asterisks* are lit in the signature blue. */
  className?: string;
}

/**
 * Splits a statement into per-word spans so it can arrive the way a
 * signal resolves: one element at a time, left to right.
 */
export function Words({ text, className }: WordsProps) {
  const words = text.split(" ");

  return (
    <p className={["words", className].filter(Boolean).join(" ")}>
      {words.map((word, index) => {
        const lit = word.startsWith("*") && word.endsWith("*");
        const clean = lit ? word.slice(1, -1) : word;

        return (
          <Fragment key={`${clean}-${index}`}>
            <span style={{ "--i": index } as React.CSSProperties}>
              {lit ? <em>{clean}</em> : clean}
            </span>
          </Fragment>
        );
      })}
    </p>
  );
}
