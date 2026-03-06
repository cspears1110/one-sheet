import { StreamLanguage, StringStream, foldService } from "@codemirror/language";

export const oneSheetSyntax = StreamLanguage.define<{ isStartOfLine: boolean }>({
    name: "oneSheet",
    startState() {
        return { isStartOfLine: true };
    },
    token(stream: StringStream, state: { isStartOfLine: boolean }) {
        if (stream.sol()) {
            state.isStartOfLine = true;
        }

        if (stream.eatSpace()) {
            return null;
        }

        if (state.isStartOfLine) {
            // Match metadata titles at start of line
            if (stream.match(/^(Title|Subtitle|Composer|Created By|Arranger|Transcriber|Tempo|Time|Text):/i)) {
                state.isStartOfLine = false;
                return "keyword";
            }
        }

        // Measure bounds like (1-8) or (1-8*)
        if (stream.match(/\(\d+\s*-\s*\d+\*?\)/)) {
            return "number";
        }

        // Single measure bounds like (1)
        if (stream.match(/\(\d+\*?\)/)) {
            return "number";
        }

        // Notes syntax like [q] or [q.]
        if (stream.match(/\[[whqes]\.?\]/i)) {
            return "string";
        }

        // Time Signatures
        if (stream.match(/\b\d+\/\d+\b/) || stream.match(/\bCut\b/)) {
            return "number";
        }

        state.isStartOfLine = false;
        stream.next();
        return null;
    }
});

export const oneSheetFolding = foldService.of((state, lineStart, lineEnd) => {
    const line = state.doc.lineAt(lineStart);
    const lineText = line.text;

    // Ignore empty lines
    if (!lineText.trim()) return null;

    // Do not start a fold on metadata lines themselves
    if (/^[ \t]*(Title|Subtitle|Composer|Created By|Arranger|Transcriber|Tempo|Time|Text):/i.test(lineText)) {
        return null;
    }

    const getIndent = (text: string) => {
        const match = text.match(/^[ \t]*/);
        if (!match) return 0;
        let spaces = 0;
        let tabs = 0;
        for (let i = 0; i < match[0].length; i++) {
            if (match[0][i] === '\t') tabs++;
            else if (match[0][i] === ' ') spaces++;
        }
        return tabs + Math.floor(spaces / 2);
    };

    const myIndent = getIndent(lineText);
    let endLine = line.number;

    for (let i = line.number + 1; i <= state.doc.lines; i++) {
        const nextLine = state.doc.line(i);
        const nextText = nextLine.text;

        if (!nextText.trim()) {
            continue; // Keep scanning past empty lines
        }

        const nextIndent = getIndent(nextText);

        if (nextIndent > myIndent) {
            // Nested child section -> included in fold
            endLine = i;
        } else if (nextIndent === myIndent) {
            // Same indentation. If it's metadata, it belongs to this section.
            if (/^[ \t]*(Tempo|Time|Text):/i.test(nextText)) {
                endLine = i;
            } else {
                // Sibling section, stop here
                break;
            }
        } else {
            // Parent section, stop here
            break;
        }
    }

    // Shrink endLine to exclude trailing empty lines from the fold range
    while (endLine > line.number && !state.doc.line(endLine).text.trim()) {
        endLine--;
    }

    if (endLine > line.number) {
        return { from: line.to, to: state.doc.line(endLine).to };
    }

    return null;
});
