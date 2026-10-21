// Contact form constants (spec 006). One module so a length or height change needs no other edit.

// Longest message the form accepts, enforced by the textarea maxlength and the validation message (FR-22).
// 2000 characters is about 350 words: ample for an enquiry and still a short paste.
export const CONTACT_MESSAGE_MAX_LENGTH = 2000
// Visible rows of the message textarea (FR-22).
// 4 rows is about 114 px, which keeps the form inside the Contact screen budget with errors shown (plan D-F).
export const CONTACT_MESSAGE_ROWS = 4
