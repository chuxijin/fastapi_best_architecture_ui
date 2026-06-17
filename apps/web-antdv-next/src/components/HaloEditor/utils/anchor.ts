export function generateAnchor(text: string) {
  return encodeURIComponent(
    String(text).trim().toLowerCase().replaceAll(/\s+/g, '-'),
  );
}

export const generateAnchorId = (text: string, ids: string[]) => {
  const originId = generateAnchor(text);
  let id = originId;
  while (ids.includes(id)) {
    const temporarySuffix = id.replace(originId, '');
    const match = temporarySuffix.match(/-(\d+)$/);
    id = match ? `${originId}-${Number(match[1]) + 1}` : `${originId}-1`;
  }
  return id;
};
