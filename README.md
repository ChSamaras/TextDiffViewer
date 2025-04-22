# Enhanced Text Diff Viewer

A powerful web application that compares two versions of text and highlights the differences, similar to GitHub's diff viewer but with additional advanced features.

## Features

### Core Functionality
- Line-by-line comparison of text files
- Side-by-side view option
- Support for file uploads
- Text input via text areas
- Highlighting of additions and deletions
- Line numbering

### Advanced Features
- **Syntax Highlighting**: Automatic code highlighting for multiple programming languages
- **Word-Level Diff**: Highlights specific words that changed within modified lines
- **Line Wrapping Toggle**: Switch between wrapped and unwrapped text for long lines
- **Character Encoding Detection**: Automatically detects file encoding based on BOM markers
- **File Format Detection**: Applies appropriate formatting based on file extension
- **Line Navigation**: Click on line numbers to highlight and jump to specific lines
- **Diff Statistics**: Shows summary of additions and deletions
- **Export Functionality**: Save diff results as HTML for sharing

## How to Use

1. Open `index.html` in your web browser
2. Input your text in the following ways:
   - Type or paste directly into the text areas
   - Upload text files using the file input buttons
3. Configure display options:
   - Choose your preferred diff view format (Line-by-line or Side-by-side)
   - Toggle line wrapping for long lines
   - Enable/disable word-level diff highlighting
   - Enable/disable syntax highlighting for code
4. Click "Compare Texts" to see the differences highlighted
5. Use the diff navigation features:
   - Click on line numbers to highlight specific lines
   - View diff statistics at the top of the results
6. Export your diff as HTML using the "Export HTML" button

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- [diff-match-patch](https://github.com/google/diff-match-patch) library for text comparison
- [Prism.js](https://prismjs.com/) for syntax highlighting

## Supported File Types

The application provides syntax highlighting for a variety of file types, including:
- JavaScript
- Python
- HTML/XML
- CSS
- JSON
- Markdown
- C/C++
- C#
- Java
- PHP
- Ruby
- Go
- Rust
- Swift
- SQL
- Shell scripts (Bash)
- Batch files
- TypeScript
- SCSS/LESS

## Implementation Details

### Diff Algorithm
The application uses Google's diff-match-patch library to perform text comparisons. The algorithm:
1. First compares texts at the line level
2. For word-level diffs, it compares changed lines character by character
3. Uses semantic cleanup to produce human-readable diffs

### File Handling
- Files are read using the FileReader API
- Encoding detection tries to identify file encoding from BOMs (Byte Order Marks)
- Supported encodings include UTF-8, UTF-16 (LE/BE), and UTF-32 (LE/BE)

### Performance Considerations
- The diff engine is optimized for typical text files
- For very large files (>1MB), performance may be affected
- Syntax highlighting is only applied to unchanged lines by default to improve performance

## Future Enhancements

- Dark mode support
- Line-level comments and annotations
- Ability to ignore whitespace changes
- Integration with version control systems
- Search within diff results
- Multiple file comparison support
- Custom syntax highlighting themes

## License

This project is open source and available under the MIT License.
