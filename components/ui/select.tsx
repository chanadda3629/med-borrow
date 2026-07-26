"use client"

import { cn } from "@/lib/utils"
import { Check, ChevronDown } from "lucide-react"
import {
  Children,
  forwardRef,
  isValidElement,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type OptionHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react"

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

function extractOptions(children: React.ReactNode): SelectOption[] {
  const options: SelectOption[] = []
  Children.forEach(children, (child) => {
    if (!isValidElement(child) || child.type !== "option") return
    const el = child as ReactElement<OptionHTMLAttributes<HTMLOptionElement>>
    const value = el.props.value != null ? String(el.props.value) : ""
    const label = typeof el.props.children === "string" ? el.props.children : value
    options.push({ value, label, disabled: el.props.disabled })
  })
  return options
}

interface SelectChangeEvent {
  target: { value: string; name?: string }
}

interface SelectProps {
  id?: string
  name?: string
  value?: string
  disabled?: boolean
  className?: string
  children?: ReactNode
  onChange?: (event: SelectChangeEvent) => void
  onBlur?: (event: SelectChangeEvent) => void
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  ({ className, children, value, onChange, onBlur, disabled, id, name }, ref) => {
    const [open, setOpen] = useState(false)
    const triggerRef = useRef<HTMLButtonElement>(null)
    useImperativeHandle(ref, () => triggerRef.current as HTMLButtonElement)

    const options = useMemo(() => extractOptions(children), [children])
    const currentValue = value == null ? "" : String(value)
    const selected = options.find((o) => o.value === currentValue)

    useEffect(() => {
      if (!open) return
      function handleKey(e: KeyboardEvent) {
        if (e.key === "Escape") handleClose()
      }
      document.addEventListener("keydown", handleKey)
      return () => document.removeEventListener("keydown", handleKey)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    function handleClose() {
      setOpen(false)
      onBlur?.({ target: { value: currentValue, name } })
    }

    function handleSelect(option: SelectOption) {
      if (option.disabled) return
      onChange?.({ target: { value: option.value, name } })
      setOpen(false)
      onBlur?.({ target: { value: option.value, name } })
    }

    return (
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          id={id}
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "w-full h-11 px-3.5 border border-border rounded-md text-base text-foreground bg-surface flex items-center justify-between gap-2 text-left transition-all duration-150 ease-apple active:scale-[0.98] focus:outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15 disabled:bg-canvas disabled:opacity-60 disabled:active:scale-100",
            className
          )}
        >
          <span className={cn("truncate", !selected && !currentValue && "text-faint")}>
            {selected ? selected.label : currentValue || "เลือก"}
          </span>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-faint shrink-0 transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>

        {open && (
          <div
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center animate-[overlay-in_0.15s_ease-out]"
            onClick={(e) => {
              if (e.target === e.currentTarget) handleClose()
            }}
          >
            <div className="w-full sm:w-[360px] max-h-[80vh] overflow-y-auto bg-surface rounded-t-[24px] sm:rounded-xl shadow-xl p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:pb-4 animate-[sheet-in_0.35s_var(--ease-apple)]">
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border sm:hidden" />
              <div role="listbox" className="space-y-1.5">
                {options.map((option) => {
                  const isSelected = option.value === currentValue
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={option.disabled}
                      onClick={() => handleSelect(option)}
                      className={cn(
                        "w-full flex items-center justify-between gap-3 rounded-md px-4 py-3.5 text-base text-left transition-all duration-150 active:scale-[0.98]",
                        isSelected
                          ? "bg-accent-50 text-accent-700 font-semibold"
                          : "text-foreground hover:bg-hairline",
                        option.disabled && "opacity-40 pointer-events-none"
                      )}
                    >
                      <span className="truncate">{option.label}</span>
                      {isSelected && (
                        <Check className="w-5 h-5 text-accent-600 shrink-0 animate-[pop-in_0.28s_var(--ease-apple)]" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
)
Select.displayName = "Select"
