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
            "w-full h-12 px-4 border border-gray-300 rounded-2xl text-base bg-white flex items-center justify-between gap-2 text-left transition-all duration-150 active:scale-[0.98] hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:opacity-60 disabled:active:scale-100",
            className
          )}
        >
          <span className={cn("truncate", !selected && !currentValue && "text-gray-400")}>
            {selected ? selected.label : currentValue || "เลือก"}
          </span>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200",
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
            <div className="w-full sm:w-[360px] max-h-[80vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-xl p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:pb-4 animate-[sheet-in_0.32s_cubic-bezier(0.34,1.56,0.64,1)]">
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-gray-200 sm:hidden" />
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
                        "w-full flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-base text-left transition-all duration-150 active:scale-[0.98]",
                        isSelected
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-gray-700 hover:bg-gray-100",
                        option.disabled && "opacity-40 pointer-events-none"
                      )}
                    >
                      <span className="truncate">{option.label}</span>
                      {isSelected && (
                        <Check className="w-5 h-5 text-blue-600 shrink-0 animate-[pop-in_0.28s_cubic-bezier(0.34,1.56,0.64,1)]" />
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
