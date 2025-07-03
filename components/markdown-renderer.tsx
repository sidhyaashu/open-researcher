'use client';

import { memo } from 'react';
import { CitationTooltip } from '@/components/citation-tooltip';

interface MarkdownRendererProps {
  content: string;
  streaming?: boolean;
  sources?: Array<{ url: string; title: string; description?: string }>;
}

export const MarkdownRenderer = memo(function MarkdownRenderer({ 
  content, 
  streaming = false,
  sources = [] 
}: MarkdownRendererProps) {
  // Simple markdown parsing
  const parseMarkdown = (text: string) => {
    // Handle links [text](url) - must come before citations
    let parsed = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-orange-600 hover:text-orange-700 underline">$1</a>');
    
    // Handle citations [1], [2], etc.
    parsed = parsed.replace(/\[(\d+)\]/g, '<sup class="citation text-orange-600 cursor-pointer hover:text-orange-700">[$1]</sup>');
    
    // Bold text
    parsed = parsed.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    
    // Italic text  
    parsed = parsed.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Headers
    parsed = parsed.replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-4 mb-2">$1</h3>');
    parsed = parsed.replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-5 mb-2">$1</h2>');
    parsed = parsed.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-6 mb-3">$1</h1>');
    
    // Handle list blocks
    const listBlocks = parsed.split('\n');
    let inList = false;
    const processedLines = [];
    
    for (let i = 0; i < listBlocks.length; i++) {
      const line = listBlocks[i];
      const isListItem = line.match(/^- (.+)$/) || line.match(/^(\d+)\. (.+)$/);
      
      if (isListItem && !inList) {
        processedLines.push('<ul class="space-y-1 my-3">');
        inList = true;
      } else if (!isListItem && inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      
      if (line.match(/^- (.+)$/)) {
        processedLines.push(line.replace(/^- (.+)$/, '<li class="ml-5 list-disc">$1</li>'));
      } else if (line.match(/^(\d+)\. (.+)$/)) {
        processedLines.push(line.replace(/^(\d+)\. (.+)$/, '<li class="ml-5 list-decimal">$2</li>'));
      } else {
        processedLines.push(line);
      }
    }
    
    if (inList) {
      processedLines.push('</ul>');
    }
    
    parsed = processedLines.join('\n');
    
    // Code blocks
    parsed = parsed.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto my-3"><code>$1</code></pre>');
    
    // Inline code
    parsed = parsed.replace(/`(.+?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
    
    // Handle tables
    const lines = parsed.split('\n');
    const tableProcessed = [];
    let inTable = false;
    let tableContent = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this line is part of a table
      if (line.includes('|') && !line.startsWith('<')) {
        if (!inTable) {
          inTable = true;
          tableContent = [];
        }
        tableContent.push(line);
      } else {
        // End of table
        if (inTable && tableContent.length > 0) {
          // Process the table
          const tableHtml = processTable(tableContent);
          tableProcessed.push(tableHtml);
          inTable = false;
          tableContent = [];
        }
        tableProcessed.push(lines[i]);
      }
    }
    
    // Handle any remaining table content
    if (inTable && tableContent.length > 0) {
      const tableHtml = processTable(tableContent);
      tableProcessed.push(tableHtml);
    }
    
    parsed = tableProcessed.join('\n');
    
    // Paragraphs
    parsed = parsed.split('\n\n').map(para => {
      if (para.trim() && !para.includes('<h') && !para.includes('<ul') && !para.includes('<pre') && !para.includes('<table')) {
        return `<p class="mb-3">${para}</p>`;
      }
      return para;
    }).join('\n');
    
    // Clean up
    parsed = parsed.replace(/<p class="mb-3"><\/p>/g, '');
    parsed = parsed.replace(/\n/g, ' ');
    
    return parsed;
  };

  // Helper function to process table content
  const processTable = (tableLines: string[]) => {
    if (tableLines.length < 2) return tableLines.join('\n');
    
    let html = '<div class="overflow-x-auto my-4"><table class="w-full divide-y divide-gray-200 dark:divide-gray-700">';
    let isHeader = true;
    
    for (let i = 0; i < tableLines.length; i++) {
      const line = tableLines[i];
      
      // Skip separator lines (|---|---|)
      if (line.match(/^\|?\s*[-:]+\s*\|/)) {
        continue;
      }
      
      // Process cells
      const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
      
      if (cells.length > 0) {
        if (isHeader) {
          html += '<thead class="bg-gray-50 dark:bg-gray-800">';
          html += '<tr>';
          cells.forEach(cell => {
            html += `<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">${cell}</th>`;
          });
          html += '</tr>';
          html += '</thead>';
          html += '<tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">';
          isHeader = false;
        } else {
          html += '<tr>';
          cells.forEach(cell => {
            html += `<td class="px-4 py-2 text-sm text-gray-900 dark:text-gray-300">${cell}</td>`;
          });
          html += '</tr>';
        }
      }
    }
    
    html += '</tbody>';
    html += '</table></div>';
    
    return html;
  };

  return (
    <div className="text-sm text-gray-700 dark:text-gray-300">
      <div 
        dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} 
        className="markdown-content leading-relaxed [&>h1]:text-gray-900 [&>h1]:dark:text-gray-100 [&>h2]:text-gray-900 [&>h2]:dark:text-gray-100 [&>h3]:text-gray-900 [&>h3]:dark:text-gray-100"
      />
      {streaming && <span className="animate-pulse text-orange-500">▊</span>}
      {sources.length > 0 && <CitationTooltip sources={sources} />}
    </div>
  );
});