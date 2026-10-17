import type { InputHTMLAttributes } from 'react'

/** Underlined `/ query` field; the outline moves to the wrapper because the input itself has none. */
export function PromptInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <span className={`inline-flex items-center gap-[6px] border-b border-line focus-within:outline focus-within:outline-1 focus-within:outline-offset-2 focus-within:outline-ok ${className}`}>
      <span className="text-ok" aria-hidden>/</span>
      <input className="w-[180px] max-w-full border-0 bg-transparent py-[4px] text-text outline-none placeholder:text-dim" {...props} />
    </span>
  )
}
