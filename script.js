document.addEventListener('DOMContentLoaded', () => {
    const originalTextarea = document.getElementById('original-text');
    const modifiedTextarea = document.getElementById('modified-text');
    const originalFileInput = document.getElementById('original-file');
    const modifiedFileInput = document.getElementById('modified-file');
    const compareBtn = document.getElementById('compare-btn');
    const diffFormatSelect = document.getElementById('diff-format');
    const diffView = document.getElementById('diff-view');
    const wrapLinesCheckbox = document.getElementById('wrap-lines');
    const wordDiffCheckbox = document.getElementById('word-diff');
    const syntaxHighlightCheckbox = document.getElementById('syntax-highlight');
    const exportHtmlBtn = document.getElementById('export-html-btn');
    const diffSummary = document.getElementById('diff-summary');
    
    // Initial file state
    let originalFileName = '';
    let modifiedFileName = '';
    
    // Toggle line wrapping
    wrapLinesCheckbox.addEventListener('change', () => {
        if (wrapLinesCheckbox.checked) {
            diffView.classList.add('wrap');
            diffView.classList.remove('nowrap');
        } else {
            diffView.classList.remove('wrap');
            diffView.classList.add('nowrap');
        }
    });
    
    // Initialize line wrapping
    if (wrapLinesCheckbox.checked) {
        diffView.classList.add('wrap');
    } else {
        diffView.classList.add('nowrap');
    }
    
    // Handle file uploads
    originalFileInput.addEventListener('change', (event) => {
        handleFileUpload(event, originalTextarea, (filename) => {
            originalFileName = filename;
        });
    });

    modifiedFileInput.addEventListener('change', (event) => {
        handleFileUpload(event, modifiedTextarea, (filename) => {
            modifiedFileName = filename;
        });
    });

    // Handle compare button click
    compareBtn.addEventListener('click', () => {
        const originalText = originalTextarea.value;
        const modifiedText = modifiedTextarea.value;
        const diffFormat = diffFormatSelect.value;
        
        if (!originalText || !modifiedText) {
            alert('Please provide both original and modified text.');
            return;
        }
        
        compareDiff(originalText, modifiedText, diffFormat);
    });
    
    // Export HTML button
    exportHtmlBtn.addEventListener('click', () => {
        exportDiffAsHtml();
    });

    // Handle file upload with encoding detection
    function handleFileUpload(event, targetTextarea, fileNameCallback) {
        const file = event.target.files[0];
        if (!file) return;

        // Store file name for later
        if (fileNameCallback) {
            fileNameCallback(file.name);
        }

        // Read as ArrayBuffer to handle encoding
        const reader = new FileReader();
        reader.onload = (e) => {
            const buffer = e.target.result;
            // Try to detect encoding if possible
            const encoding = detectEncoding(buffer) || 'utf-8';
            try {
                const decoder = new TextDecoder(encoding);
                targetTextarea.value = decoder.decode(new Uint8Array(buffer));
            } catch (err) {
                // Fall back to simple text reading
                const textReader = new FileReader();
                textReader.onload = (e) => {
                    targetTextarea.value = e.target.result;
                };
                textReader.readAsText(file);
            }
        };
        reader.onerror = (e) => {
            console.error("Error reading file:", e);
            alert("Error reading file. Please try again.");
        };
        reader.readAsArrayBuffer(file);
        
        // Reset the file input so the same file can be selected again if needed
        event.target.value = '';
    }
    
    // Basic encoding detection based on BOM
    function detectEncoding(buffer) {
        const arr = new Uint8Array(buffer.slice(0, 4));
        
        // UTF-8 BOM
        if (arr[0] === 0xEF && arr[1] === 0xBB && arr[2] === 0xBF) {
            return 'utf-8';
        }
        // UTF-16 LE BOM
        if (arr[0] === 0xFF && arr[1] === 0xFE) {
            return 'utf-16le';
        }
        // UTF-16 BE BOM
        if (arr[0] === 0xFE && arr[1] === 0xFF) {
            return 'utf-16be';
        }
        // UTF-32 LE BOM
        if (arr[0] === 0xFF && arr[1] === 0xFE && arr[2] === 0x00 && arr[3] === 0x00) {
            return 'utf-32le';
        }
        // UTF-32 BE BOM
        if (arr[0] === 0x00 && arr[1] === 0x00 && arr[2] === 0xFE && arr[3] === 0xFF) {
            return 'utf-32be';
        }
        
        // No BOM detected, return null to use default
        return null;
    }

    // File type detection based on extension or content
    function detectFileType(fileName, content) {
        if (!fileName) return 'plaintext';
        
        const extension = fileName.split('.').pop().toLowerCase();
        
        // Map extensions to file types
        const typeMap = {
            'js': 'javascript',
            'ts': 'typescript',
            'py': 'python',
            'html': 'markup',
            'htm': 'markup',
            'xml': 'markup',
            'css': 'css',
            'scss': 'scss',
            'less': 'less',
            'json': 'json',
            'md': 'markdown',
            'txt': 'plaintext',
            'sh': 'bash',
            'bat': 'batch',
            'c': 'c',
            'cpp': 'cpp',
            'cs': 'csharp',
            'java': 'java',
            'php': 'php',
            'rb': 'ruby',
            'go': 'go',
            'rs': 'rust',
            'swift': 'swift',
            'sql': 'sql'
        };
        
        return typeMap[extension] || 'plaintext';
    }

    // Compare and display diff
    function compareDiff(originalText, modifiedText, format) {
        // Use diff_match_patch library for calculating diffs
        const dmp = new diff_match_patch();
        
        // Split the texts into lines for line-by-line comparison
        const originalLines = originalText.split('\n');
        const modifiedLines = modifiedText.split('\n');
        
        // Detect file type based on file name
        const fileType = detectFileType(
            originalFileName || modifiedFileName,
            originalText || modifiedText
        );
        
        if (format === 'line-by-line') {
            displayLineDiff(originalLines, modifiedLines, dmp, fileType);
        } else {
            displaySideBySideDiff(originalLines, modifiedLines, dmp, fileType);
        }
        
        // Setup line navigation after rendering diff
        setTimeout(() => {
            setupLineNavigation();
        }, 100);
    }

    // Display line-by-line diff
    function displayLineDiff(originalLines, modifiedLines, dmp, fileType) {
        diffView.innerHTML = '';
        
        const diff = dmp.diff_main(originalLines.join('\n'), modifiedLines.join('\n'));
        dmp.diff_cleanupSemantic(diff);
        
        // Show diff statistics
        const stats = calculateDiffStats(diff);
        showDiffStats(stats);
        
        let lineNumber = 1;
        let html = '';
        
        // Process each diff item
        for (let i = 0; i < diff.length; i++) {
            const operation = diff[i][0];
            const text = diff[i][1];
            const lines = text.split('\n');
            
            // Process each line
            for (let j = 0; j < lines.length; j++) {
                const line = lines[j];
                // Skip the last empty line if it's just a newline
                if (j === lines.length - 1 && line === '' && j > 0) continue;
                
                let diffClass = '';
                let lineNum = '';
                
                // Determine diff class and line number
                if (operation === 0) { // EQUAL
                    diffClass = 'diff-equal';
                    lineNum = lineNumber++;
                } else if (operation === -1) { // DELETE
                    diffClass = 'diff-remove';
                    lineNum = lineNumber++;
                } else if (operation === 1) { // INSERT
                    diffClass = 'diff-add';
                    lineNum = lineNumber++;
                }
                
                // Apply syntax highlighting if enabled
                let lineContent = '';
                if (syntaxHighlightCheckbox.checked && operation === 0) {
                    // Only apply syntax highlighting to unchanged lines
                    lineContent = applySyntaxHighlighting(line, fileType);
                } else {
                    lineContent = escapeHtml(line);
                }
                
                // Create HTML for the diff line
                html += `<div class="diff-line ${diffClass}">
                    <span class="line-number">${lineNum}</span>
                    <span class="line-content">${lineContent}</span>
                </div>`;
            }
        }
        
        diffView.innerHTML = html;
    }

    // Display side-by-side diff
    function displaySideBySideDiff(originalLines, modifiedLines, dmp, fileType) {
        diffView.innerHTML = '';
        
        // Compute line-by-line diffs
        const lineDiffs = computeLineDiffs(originalLines, modifiedLines, dmp);
        
        // Show diff statistics
        const stats = {
            additions: lineDiffs.filter(item => item.type === 'insert').length,
            deletions: lineDiffs.filter(item => item.type === 'delete').length
        };
        stats.total = stats.additions + stats.deletions;
        showDiffStats(stats);
        
        // Create HTML for side-by-side diff
        let html = '<div class="side-by-side">';
        
        // Original text side
        html += '<div class="side original">';
        html += '<h3>Original</h3>';
        for (const diffItem of lineDiffs) {
            if (diffItem.type === 'equal' || diffItem.type === 'delete') {
                let lineContent = diffItem.originalLine;
                
                // Apply syntax highlighting if enabled
                if (syntaxHighlightCheckbox.checked && diffItem.type === 'equal') {
                    lineContent = applySyntaxHighlighting(lineContent, fileType);
                } else if (wordDiffCheckbox.checked && diffItem.type === 'delete' && diffItem.inlineOriginal) {
                    lineContent = diffItem.inlineOriginal;
                } else {
                    lineContent = escapeHtml(lineContent);
                }
                
                html += `<div class="diff-line ${diffItem.type === 'delete' ? 'diff-remove' : 'diff-equal'}">
                    <span class="line-number">${diffItem.originalIndex + 1}</span>
                    <span class="line-content">${lineContent}</span>
                </div>`;
            } else if (diffItem.type === 'insert') {
                html += `<div class="diff-line empty">
                    <span class="line-number"></span>
                    <span class="line-content"></span>
                </div>`;
            }
        }
        html += '</div>';
        
        // Modified text side
        html += '<div class="side modified">';
        html += '<h3>Modified</h3>';
        for (const diffItem of lineDiffs) {
            if (diffItem.type === 'equal' || diffItem.type === 'insert') {
                let lineContent = diffItem.modifiedLine;
                
                // Apply syntax highlighting if enabled
                if (syntaxHighlightCheckbox.checked && diffItem.type === 'equal') {
                    lineContent = applySyntaxHighlighting(lineContent, fileType);
                } else if (wordDiffCheckbox.checked && diffItem.type === 'insert' && diffItem.inlineModified) {
                    lineContent = diffItem.inlineModified;
                } else {
                    lineContent = escapeHtml(lineContent);
                }
                
                html += `<div class="diff-line ${diffItem.type === 'insert' ? 'diff-add' : 'diff-equal'}">
                    <span class="line-number">${diffItem.modifiedIndex + 1}</span>
                    <span class="line-content">${lineContent}</span>
                </div>`;
            } else if (diffItem.type === 'delete') {
                html += `<div class="diff-line empty">
                    <span class="line-number"></span>
                    <span class="line-content"></span>
                </div>`;
            }
        }
        html += '</div>';
        
        html += '</div>';
        diffView.innerHTML = html;
    }

    // Apply syntax highlighting
    function applySyntaxHighlighting(code, language) {
        if (!code) return '';
        
        try {
            // Use Prism.js for syntax highlighting
            return Prism.highlight(code, Prism.languages[language] || Prism.languages.plaintext, language);
        } catch (e) {
            console.error('Error applying syntax highlighting:', e);
            return escapeHtml(code);
        }
    }

    // Word-level diff highlighting
    function highlightInlineChanges(oldText, newText, dmp) {
        if (!oldText || !newText) return { 
            originalHtml: escapeHtml(oldText || ''), 
            modifiedHtml: escapeHtml(newText || '') 
        };
        
        const charDiff = dmp.diff_main(oldText, newText);
        dmp.diff_cleanupSemantic(charDiff);
        
        let originalHtml = '';
        let modifiedHtml = '';
        
        for (let i = 0; i < charDiff.length; i++) {
            const operation = charDiff[i][0];
            const text = escapeHtml(charDiff[i][1]);
            
            if (operation === 0) { // EQUAL
                originalHtml += text;
                modifiedHtml += text;
            } else if (operation === -1) { // DELETE
                originalHtml += `<span class="highlight-remove">${text}</span>`;
            } else if (operation === 1) { // INSERT
                modifiedHtml += `<span class="highlight-add">${text}</span>`;
            }
        }
        
        return { originalHtml, modifiedHtml };
    }

    // Compute line-by-line diffs with word-level highlighting
    function computeLineDiffs(originalLines, modifiedLines, dmp) {
        const result = [];
        
        // Use the diff_match_patch library's line mode
        const a = originalLines;
        const b = modifiedLines;
        
        // Create a line-to-character map
        const lineToCharMunge = dmp.diff_linesToChars_(a.join('\n'), b.join('\n'));
        const lineText1 = lineToCharMunge.chars1;
        const lineText2 = lineToCharMunge.chars2;
        const lineArray = lineToCharMunge.lineArray;
        
        // Find the diff
        const diffs = dmp.diff_main(lineText1, lineText2, false);
        
        // Convert char-level diff back to line-level
        dmp.diff_charsToLines_(diffs, lineArray);
        
        let originalIndex = 0;
        let modifiedIndex = 0;
        
        // Process each diff operation
        for (let i = 0; i < diffs.length; i++) {
            const operation = diffs[i][0];
            const text = diffs[i][1];
            const lines = text.split('\n');
            
            // Process each line
            for (let j = 0; j < lines.length; j++) {
                const line = lines[j];
                // Skip the last empty line if it's just a newline
                if (j === lines.length - 1 && line === '' && j > 0) continue;
                
                if (operation === 0) { // EQUAL
                    result.push({
                        type: 'equal',
                        originalLine: line,
                        modifiedLine: line,
                        originalIndex: originalIndex,
                        modifiedIndex: modifiedIndex
                    });
                    originalIndex++;
                    modifiedIndex++;
                } else if (operation === -1) { // DELETE
                    // Look ahead for matching INSERT to do word-level diff
                    let insertMatch = null;
                    if (wordDiffCheckbox.checked) {
                        for (let k = i + 1; k < diffs.length && k < i + 3; k++) {
                            if (diffs[k][0] === 1) { // INSERT
                                insertMatch = diffs[k][1].split('\n')[0];
                                break;
                            }
                        }
                    }
                    
                    const diffItem = {
                        type: 'delete',
                        originalLine: line,
                        originalIndex: originalIndex,
                        modifiedIndex: -1
                    };
                    
                    // Add word-level highlights if we have a matching insert
                    if (insertMatch && wordDiffCheckbox.checked) {
                        const inlineChanges = highlightInlineChanges(line, insertMatch, dmp);
                        diffItem.inlineOriginal = inlineChanges.originalHtml;
                    }
                    
                    result.push(diffItem);
                    originalIndex++;
                } else if (operation === 1) { // INSERT
                    // Look back for matching DELETE to do word-level diff
                    let deleteMatch = null;
                    if (wordDiffCheckbox.checked && result.length > 0) {
                        const lastItem = result[result.length - 1];
                        if (lastItem.type === 'delete') {
                            deleteMatch = lastItem.originalLine;
                        }
                    }
                    
                    const diffItem = {
                        type: 'insert',
                        modifiedLine: line,
                        originalIndex: -1,
                        modifiedIndex: modifiedIndex
                    };
                    
                    // Add word-level highlights if we have a matching delete
                    if (deleteMatch && wordDiffCheckbox.checked) {
                        const inlineChanges = highlightInlineChanges(deleteMatch, line, dmp);
                        diffItem.inlineModified = inlineChanges.modifiedHtml;
                    }
                    
                    result.push(diffItem);
                    modifiedIndex++;
                }
            }
        }
        
        return result;
    }

    // Calculate diff statistics
    function calculateDiffStats(diff) {
        let additions = 0;
        let deletions = 0;
        
        for (let i = 0; i < diff.length; i++) {
            const operation = diff[i][0];
            const text = diff[i][1];
            const lineCount = (text.match(/\n/g) || []).length + (text.length > 0 ? 1 : 0);
            
            if (operation === 1) { // INSERT
                additions += lineCount;
            } else if (operation === -1) { // DELETE
                deletions += lineCount;
            }
        }
        
        return {
            additions,
            deletions,
            total: additions + deletions
        };
    }

    // Show diff statistics
    function showDiffStats(stats) {
        diffSummary.innerHTML = `
            <span class="diff-stats-indicator additions">+${stats.additions}</span>
            <span class="diff-stats-indicator deletions">-${stats.deletions}</span>
            <span>changes</span>
        `;
    }

    // Set up line navigation
    function setupLineNavigation() {
        const lineNumbers = document.querySelectorAll('.line-number');
        
        lineNumbers.forEach(line => {
            line.addEventListener('click', () => {
                // Remove current selection
                document.querySelectorAll('.selected-line').forEach(el => {
                    el.classList.remove('selected-line');
                });
                
                // Highlight the selected line
                const parentLine = line.parentElement;
                parentLine.classList.add('selected-line');
                
                // Scroll into view
                parentLine.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            });
        });
    }

    // Export the diff as HTML
    function exportDiffAsHtml() {
        const diffContent = diffView.innerHTML;
        const title = originalFileName && modifiedFileName 
            ? `Diff: ${originalFileName} ↔ ${modifiedFileName}`
            : 'Text Diff Export';
        
        // Get all CSS styles
        const styleSheets = Array.from(document.styleSheets);
        let cssText = '';
        
        for (const sheet of styleSheets) {
            try {
                const rules = sheet.cssRules || sheet.rules;
                for (const rule of rules) {
                    cssText += rule.cssText + '\n';
                }
            } catch (e) {
                // Skip external stylesheets that might cause CORS issues
                console.warn('Could not access stylesheet:', e);
            }
        }
        
        const htmlDocument = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        ${cssText}
    </style>
</head>
<body>
    <div class="exported-diff">
        <h1>${title}</h1>
        <div class="diff-stats">
            ${diffSummary.innerHTML}
        </div>
        <div class="diff-output ${wrapLinesCheckbox.checked ? 'wrap' : 'nowrap'}">
            ${diffContent}
        </div>
    </div>
</body>
</html>`;
        
        // Create download link
        const blob = new Blob([htmlDocument], {type: 'text/html'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Helper function to escape HTML
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
