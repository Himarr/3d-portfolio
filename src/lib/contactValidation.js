// Field validation messages for the contact form (spec 006 FR-23, plan D-K). Pure: no DOM access.
// The browser supplies the native checks through `validity` (a ValidityState, or a fake in Node).
import { CONTACT_MESSAGE_MAX_LENGTH } from './contactConfig.js'

// Returns the error message for one field, or null when the field is valid.
// Order: missing or whitespace-only value, then the native email and length checks.
export function fieldMessage(field, validity, value) {
  if (value.trim() === '' || validity.valueMissing) {
    if (field === 'name') return 'Enter your name.'
    if (field === 'email') return 'Enter your email address.'
    if (field === 'message') return 'Write a message.'
  }
  if (field === 'email' && validity.typeMismatch) return 'Enter a valid email address.'
  if (field === 'message' && validity.tooLong) return `Keep your message under ${CONTACT_MESSAGE_MAX_LENGTH} characters.`
  return null
}
