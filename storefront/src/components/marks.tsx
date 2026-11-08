// The STOIC wordmark: a high-contrast Didone in capitals.
export function Wordmark({ className = "" }: { className?: string }) {
  return <span className={`wordmark ${className}`}>STOIC</span>;
}
