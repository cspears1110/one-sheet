const opentype = require('opentype.js');
const fs = require('fs');

opentype.load('public/fonts/BravuraText.otf', (err, font) => {
    if (err) {
        console.error(err);
        return;
    }

    // We want the SVG path at an arbitrary font size (say, 1000) so we can scale it to whatever we want via viewBox or transform: scale()
    const fontSize = 1000;
    const getPathData = (str) => {
        const path = font.getPath(str, 0, 0, fontSize);
        return {
            d: path.toPathData(2),
            // We can also extract the precise advance width
            advanceWidth: font.getAdvanceWidth(str, fontSize)
        };
    };

    const glyphs = {
        'W_DOT': '\uECA2\uECB7',
        'H_DOT': '\uECA3\uECB7',
        'Q_DOT': '\uECA5\uECB7',
        'E_DOT': '\uECA7\uECB7',
        'S_DOT': '\uECA9\uECB7',
        'W_NOTE': '\uECA2',
        'H_NOTE': '\uECA3',
        'Q_NOTE': '\uECA5',
        'E_NOTE': '\uECA7',
        'S_NOTE': '\uECA9',
        'NUM_0': '\uE080',
        'NUM_1': '\uE081',
        'NUM_2': '\uE082',
        'NUM_3': '\uE083',
        'NUM_4': '\uE084',
        'NUM_5': '\uE085',
        'NUM_6': '\uE086',
        'NUM_7': '\uE087',
        'NUM_8': '\uE088',
        'NUM_9': '\uE089',
        'COMMON': '\uE08A',
        'CUT': '\uE08B',
        'PLUS': '\uE08C',
        'MINUS': '\uE08D',
        'AUG_DOT': '\uECB7',
        'DYN_PPP': '\uE52A',
        'DYN_PP': '\uE52B',
        'DYN_P': '\uE520',
        'DYN_MP': '\uE52C',
        'DYN_MF': '\uE52D',
        'DYN_F': '\uE522',
        'DYN_FF': '\uE52F',
        'DYN_FFF': '\uE530',
        
        // Clefs
        'CLEF_TREBLE': '\uE050',
        'CLEF_BASS': '\uE062',
        'CLEF_ALTO': '\uE05C',

        // Articulations
        'ARTIC_ACCENT': '\uE4A0',
        'ARTIC_MARCATO': '\uE4A6',
        'ARTIC_TENUTO': '\uE4A4',
        'ARTIC_FERMATA': '\uE4C0',
        'ARTIC_CAESURA': '\uE4D1',

        // Bowings
        'BOW_DOWN': '\uE610',
        'BOW_UP': '\uE612'
    };

    let result = 'export const BravuraPaths = {\n';
    for (const [key, str] of Object.entries(glyphs)) {
        const data = getPathData(str);
        result += `    ${key}: {\n`;
        result += `        d: '${data.d}',\n`;
        result += `        width: ${Math.round(data.advanceWidth)}\n`;
        result += `    },\n`;
    }
    result += '};\n';

    fs.writeFileSync('lib/bravura-paths.ts', result);
    console.log('Successfully generated lib/bravura-paths.ts!');
});
