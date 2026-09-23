// Policy password unica per registrazione, reset e cambio password,
// a specchio di PASSWORD_MIN_LENGTH/_check_password_policy nel backend
// (server.py): tenerle allineate se una delle due cambia.
export const PASSWORD_MIN_LENGTH = 8;

const SPECIAL_CHARS = /[!@#$%^&*()_+\-=\[\]{};:'"\\|,.<>/?`~]/;

export function validatePassword(pw: string): string | null {
  if (pw.length < PASSWORD_MIN_LENGTH) return `La password deve avere almeno ${PASSWORD_MIN_LENGTH} caratteri`;
  if (!/[0-9]/.test(pw)) return "La password deve contenere almeno un numero";
  if (!SPECIAL_CHARS.test(pw)) return "La password deve contenere almeno un carattere speciale";
  return null;
}

export const PASSWORD_REQUIREMENTS_TITLE = "Requisiti password";
export const PASSWORD_REQUIREMENTS_TEXT =
  "La password deve contenere:\n\n" +
  "• Almeno 8 caratteri\n" +
  "• Almeno un numero (0-9)\n" +
  "• Almeno un carattere speciale (es. ! @ # $ % & *)";
