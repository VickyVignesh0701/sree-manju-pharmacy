// Pure validation logic with zero external dependencies - kept separate from
// AppContext.jsx (which imports React) specifically so it can be unit tested
// in isolation, and reused anywhere without pulling in the whole app context.

export const validatePasswordComplexity = (password) => {
  if (!password) {
    return { isValid: false, error: "Password is required." };
  }
  const len = password.length;
  if (len < 8 || len > 16) {
    return { isValid: false, error: `Password length must be 8 to 16 characters (Current: ${len} characters).` };
  }

  const missing = [];
  if (!/[A-Z]/.test(password)) missing.push("1+ Uppercase letter (A-Z)");
  if (!/[a-z]/.test(password)) missing.push("1+ Lowercase letter (a-z)");
  if (!/[0-9]/.test(password)) missing.push("1+ Number (0-9)");
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password)) missing.push("1+ Special character (!@#$%^&*)");

  if (missing.length > 0) {
    return {
      isValid: false,
      error: `Missing required character(s): ${missing.join(', ')}`
    };
  }
  return { isValid: true, error: "" };
};
