/** The smallest unit of the brand: a point that announces itself on a
 *  long, quiet cycle. Decorative — never the only carrier of meaning. */
export function Signal() {
  return <span className="signal" aria-hidden="true" />;
}

/** A hairline that carries light instead of drawing a border. */
export function DetectionLine() {
  return <hr className="detection" />;
}
