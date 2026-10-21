import { useEffect, useRef, useState } from "react"
import { CONTACT_MESSAGE_MAX_LENGTH, CONTACT_MESSAGE_ROWS } from "../../lib/contactConfig.js"
import { fieldMessage } from "../../lib/contactValidation.js"

const FIELDS = ["name", "email", "message"]
const controlClass =
  "min-h-11 w-full text-base bg-surface text-text border border-rim/50 px-3 py-2 rounded-sm focus:border-accent aria-invalid:border-error aria-invalid:shadow-[inset_0_0_0_1px_var(--color-error)]"
const labelClass = "mb-1 block text-base text-text"

function FieldError({ id, message }) {
  if (!message) return null
  return (
    <p id={`${id}-error`} className="mt-1 text-base leading-6 text-error">
      <span
        aria-hidden="true"
        className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-error text-xs leading-none text-error"
      >
        !
      </span>
      {message}
    </p>
  )
}

export default function ContactForm() {
  const [errors, setErrors] = useState({ name: null, email: null, message: null })
  const [attempted, setAttempted] = useState(false)
  const [status, setStatus] = useState("idle")
  const nameRef = useRef(null)
  const emailRef = useRef(null)
  const messageRef = useRef(null)
  const elementFor = (field) => ({ name: nameRef, email: emailRef, message: messageRef })[field].current

  // Mark the textarea so Lenis leaves its wheel scroll alone when it overflows.
  // Layout reads happen only here: on input, on resize, and once after mount.
  const syncPrevent = () => {
    const el = messageRef.current
    if (!el) return
    el.toggleAttribute("data-lenis-prevent", el.scrollHeight > el.clientHeight + 1)
  }

  useEffect(() => {
    const el = messageRef.current
    if (!el) return undefined
    const observer = new ResizeObserver(() => {
      el.toggleAttribute("data-lenis-prevent", el.scrollHeight > el.clientHeight + 1)
    })
    observer.observe(el)
    el.toggleAttribute("data-lenis-prevent", el.scrollHeight > el.clientHeight + 1)
    return () => observer.disconnect()
  }, [])

  const validateField = (field) => {
    const el = elementFor(field)
    const message = fieldMessage(field, el.validity, el.value)
    setErrors((prev) => ({ ...prev, [field]: message }))
    return message
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setAttempted(true)
    const next = {}
    let firstInvalid = null
    for (const field of FIELDS) {
      const el = elementFor(field)
      next[field] = fieldMessage(field, el.validity, el.value)
      if (next[field] && !firstInvalid) firstInvalid = el
    }
    setErrors(next)
    if (firstInvalid) {
      setStatus("idle")
      firstInvalid.focus()
    } else {
      setStatus("notConnected")
    }
  }

  const handleInput = (field) => () => {
    setStatus("idle")
    if (attempted) validateField(field)
    if (field === "message") syncPrevent()
  }

  const handleBlur = (field) => () => {
    if (attempted) validateField(field)
  }

  const invalidProps = (field) =>
    errors[field]
      ? { "aria-invalid": "true", "aria-describedby": `contact-${field}-error` }
      : {}

  return (
    <form noValidate onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <div>
        <label htmlFor="contact-name" className={labelClass}>
          Name
        </label>
        <input
          ref={nameRef}
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className={controlClass}
          onInput={handleInput("name")}
          onBlur={handleBlur("name")}
          {...invalidProps("name")}
        />
        <FieldError id="contact-name" message={errors.name} />
      </div>
      <div>
        <label htmlFor="contact-email" className={labelClass}>
          Email
        </label>
        <input
          ref={emailRef}
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          className={controlClass}
          onInput={handleInput("email")}
          onBlur={handleBlur("email")}
          {...invalidProps("email")}
        />
        <FieldError id="contact-email" message={errors.email} />
      </div>
      <div>
        <label htmlFor="contact-message" className={labelClass}>
          Message
        </label>
        <textarea
          ref={messageRef}
          id="contact-message"
          name="message"
          rows={CONTACT_MESSAGE_ROWS}
          maxLength={CONTACT_MESSAGE_MAX_LENGTH}
          required
          autoComplete="off"
          className={`${controlClass} resize-none`}
          onInput={handleInput("message")}
          onBlur={handleBlur("message")}
          {...invalidProps("message")}
        />
        <FieldError id="contact-message" message={errors.message} />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          className="min-h-11 rounded-sm border border-accent px-6 text-base text-accent hover:bg-accent hover:text-ink focus-visible:bg-accent focus-visible:text-ink transition-colors duration-200 motion-reduce:transition-none"
        >
          Send message
        </button>
        <p role="status" className="text-base text-muted">
          {status === "notConnected" ? "This form is not connected yet. Nothing was sent." : ""}
        </p>
      </div>
    </form>
  )
}
