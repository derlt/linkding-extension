export function getCurrentWordBounds(input) {
  const text = input.value;
  const end = input.selectionStart;
  let start = end;

  let currentChar = text.charAt(start - 1);

  while (currentChar && currentChar !== " " && start > 0) {
    start--;
    currentChar = text.charAt(start - 1);
  }

  return { start, end };
}

export function formatDateTag(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getCurrentWord(input) {
  const bounds = getCurrentWordBounds(input);

  return input.value.substring(bounds.start, bounds.end);
}
