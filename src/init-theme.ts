import * as monaco from '@/init-monaco';
import { editorThemes } from '@/stores/setting';
import { shikiToMonaco } from '@shikijs/monaco';
import { createHighlighter } from 'shiki';

// 创建一个可复用的语法高亮器
const highlighter = await createHighlighter({
  themes: editorThemes.map((t) => t.id),
  langs: ['sql', 'json'],
});

shikiToMonaco(highlighter, monaco);
