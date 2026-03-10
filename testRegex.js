const lines = [
    "Title: Symphony No. 5",
    "",
    "Intro (1-8)",
    "Time: 4/4",
    "Text: Grand opening.\\nSlowly crescendo to Theme A.",
    "  Theme A (1-4)",
    "\tTheme B (5-8*)"
];

for (const line of lines) {
    if (line.trim() === '') continue;
    const match = line.match(/^([ \t]*)(.*?)(?:[ \t]*\((\d+)\s*-\s*(\d+)(\*?)\))?\s*$/);
    if (match) {
        console.log({
            line,
            indent: match[1].length,
            text: match[2].trim(),
            start: match[3],
            end: match[4],
            star: match[5]
        });
    }
}
