import { CardContentType } from '@/types';

export function detectContentType(content: string): CardContentType {
  const trimmed = content.trim();

  // 链接识别
  const urlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
  if (urlPattern.test(trimmed)) {
    return 'link';
  }

  // 代码识别
  const codePatterns = [
    /^(function|const|let|var|class|import|export)\s+/,
    /[{}[\];]+/,
    /^(def|class|import)\s+/,
    /^<\w+>.*<\/\w+>$/s,
    /;\s*$/,
    /=>/
  ];

  if (codePatterns.some((pattern) => pattern.test(trimmed))) {
    return 'code';
  }

  return 'text';
}

export function formatCodeContent(content: string): string {
  const normalized = content.replace(/\t/g, '  ').replace(/\r\n/g, '\n').trimEnd();
  const lines = normalized.split('\n');
  let indentLevel = 0;

  const formatted = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (/^[}\])]/.test(trimmed)) {
      indentLevel = Math.max(0, indentLevel - 1);
    }
    const nextLine = `${'  '.repeat(indentLevel)}${trimmed}`;
    if (/[{\[(]$/.test(trimmed) || /:\s*$/.test(trimmed)) {
      indentLevel += 1;
    }
    return nextLine;
  });

  return formatted.join('\n');
}

export function formatRemaining(expiresAt: number): string {
  const diff = expiresAt - Date.now();
  if (diff <= 0) return '已过期';
  const totalMinutes = Math.ceil(diff / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}分钟`;
  return `${hours}小时${minutes}分钟`;
}
