/**
 * Utility function to display a custom modal message.
 */
const showModal = (id) => {
    const modal = document.getElementById(id);
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

/**
 * List of available Google Fonts for the selector.
 */
const GOOGLE_FONTS = [
    { name: "Inter", value: "Inter, sans-serif" },
    { name: "Roboto", value: "Roboto, sans-serif" },
    { name: "Montserrat", value: "Montserrat, sans-serif" },
    { name: "Playfair Display", value: "'Playfair Display', serif" },
    { name: "Oswald", value: "Oswald, sans-serif" },
    { name: "Merriweather", value: "Merriweather, serif" },
    { name: "Bebas Neue", value: "'Bebas Neue', sans-serif" },
    { name: "Pacifico", value: "Pacifico, cursive" },
    { name: "Space Mono", value: "'Space Mono', monospace" },
    { name: "--- System Fonts ---", value: "", disabled: true },
    { name: "Times New Roman", value: "'Times New Roman', serif" },
    { name: "Courier New", value: "'Courier New', monospace" },
];

/**
 * Populates the font family dropdown selector.
 */
function loadGoogleFonts() {
    const selectEl = document.getElementById('fontFamily');
    selectEl.innerHTML = '';
    
    GOOGLE_FONTS.forEach(font => {
        const option = document.createElement('option');
        option.value = font.value;
        option.textContent = font.name;
        if (font.disabled) {
            option.disabled = true;
        }
        selectEl.appendChild(option);
    });
}

/**
 * Main function to read user inputs, measure text, generate the SVG,
 * and apply the chosen CSS animation.
 */
function generateSVG() {
    // 1. Read input values
    const text = document.getElementById('inputText').value || 'SVG Text';
    const fontFamily = document.getElementById('fontFamily').value;
    const duration = parseFloat(document.getElementById('duration').value) || 3;
    const fontSize = parseInt(document.getElementById('fontSize').value) || 60; 
    const letterSpacing = parseFloat(document.getElementById('letterSpacing').value) || 0;
    const fontWeight = document.getElementById('fontWeight').value || '700';
    const strokeWidth = document.getElementById('strokeWidth').value || '2';
    const strokeColor = document.getElementById('strokeColor').value;
    const fillColor = document.getElementById('fillColor').value;
    const animationStyle = document.getElementById('animationStyle').value;
    const svgContainer = document.getElementById('svgContainer');
    const copyBtn = document.getElementById('copyBtn');
    const placeholderText = document.getElementById('placeholderText');

    // 2. Prepare container and validate input
    if (placeholderText) placeholderText.remove();
    svgContainer.innerHTML = '';
    copyBtn.disabled = true;

    if (!text.trim()) {
        svgContainer.innerHTML = '<p class="text-red-500 italic">Please enter some text.</p>';
        return;
    }
    
    const characters = text.split('');
    const textContentWithoutSpaces = text.replace(/\s/g, '');
    const totalChars = textContentWithoutSpaces.length;

    // 3. Measure Text Metrics (required for stroke-draw path length and letter positioning)
    let textPathLength = 0;
    let textMetrics = { width: 0, height: 0, charWidths: [] };
    
    const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    tempSvg.style.fontSize = `${fontSize}px`; 
    tempSvg.style.fontWeight = fontWeight;
    tempSvg.style.fontFamily = fontFamily;
    tempSvg.style.letterSpacing = `${letterSpacing}px`; 
    tempSvg.style.visibility = 'hidden';
    tempSvg.style.position = 'absolute';
    tempSvg.style.left = '-9999px';
    document.body.appendChild(tempSvg);
    
    const tempFullText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    tempFullText.textContent = text;
    tempSvg.appendChild(tempFullText);

    try {
        // Get path length for stroke animation
        textPathLength = tempFullText.getTotalLength();
    } catch (e) {
        // Fallback if getTotalLength fails
        const BASE_FONT_SIZE = 60;
        const fallbackPathLength = text.length * 150 + (letterSpacing * text.length * 2); 
        textPathLength = Math.ceil((fontSize / BASE_FONT_SIZE) * fallbackPathLength);
        console.warn("Could not calculate accurate text metrics. Using scaled fallback.");
    }
    
    // Calculate individual character widths for 'letters-fade-in' alignment
    let currentX = 0;
    const tempChar = document.createElementNS("http://www.w3.org/2000/svg", "text");
    tempChar.style.letterSpacing = '0px'; 
    tempSvg.appendChild(tempChar);

    for (let i = 0; i < characters.length; i++) {
        const char = characters[i];
        
        if (char.trim() === '') {
            // Estimate space width + spacing
            const spaceWidth = fontSize * 0.4 + letterSpacing;
            textMetrics.charWidths.push(spaceWidth);
            currentX += spaceWidth;
            continue;
        }
        
        tempChar.textContent = char; 
        try {
            // Character width + applied letter spacing
            const charWidth = tempChar.getBBox().width + letterSpacing; 
            textMetrics.charWidths.push(charWidth);
            currentX += charWidth;
        } catch (e) {
            // Fallback for single character measurement
            const charWidthFallback = fontSize * 0.6 + letterSpacing;
            textMetrics.charWidths.push(charWidthFallback);
            currentX += charWidthFallback;
        }
    }
    
    tempSvg.remove();

    // 4. Create final animated SVG element
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute('width', '100%');
    
    const FIXED_VIEWBOX_WIDTH = 600;
    const FIXED_VIEWBOX_HEIGHT = 150;
    const textXPosition = 10; 
    const textYPosition = FIXED_VIEWBOX_HEIGHT / 2; 

    svg.setAttribute('viewBox', `0 0 ${FIXED_VIEWBOX_WIDTH} ${FIXED_VIEWBOX_HEIGHT}`); 
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet'); 

    // 5. Generate Dynamic CSS Styles based on the chosen animation
    let animationStyles = '';

    if (animationStyle === 'stroke-draw') {
        const fillDelay = duration * 0.7;
        const fillDuration = duration - fillDelay;

        animationStyles = `
            #animatedText {
                stroke-dasharray: ${textPathLength};
                stroke-dashoffset: ${textPathLength};
                stroke: ${strokeColor};
                fill: transparent;
                opacity: 1;

                animation:
                    stroke-draw-path ${duration}s ease-in-out forwards,
                    fill-fade-color ${fillDuration.toFixed(2)}s forwards;

                animation-delay: 0s, ${fillDelay.toFixed(2)}s;
            }

            @keyframes stroke-draw-path {
                to {
                    stroke-dashoffset: 0;
                }
            }

            @keyframes fill-fade-color {
                from {
                    fill: transparent;
                }
                to {
                    fill: ${fillColor};
                }
            }
        `;
    } else if (animationStyle === 'fill-fade') {
        animationStyles = `
            #animatedText {
                stroke: transparent;
                fill: ${fillColor};
                opacity: 0;

                animation: fill-fade-opacity ${duration}s ease-out forwards;
            }

            @keyframes fill-fade-opacity {
                to {
                    opacity: 1;
                }
            }
        `;
    } else if (animationStyle === 'letters-fade-in') {
        const charDuration = Math.max(0.2, duration / totalChars * 0.75); 
        const staggerDelay = (duration - charDuration) / totalChars; 

        animationStyles = `
            .fade-char {
                stroke: transparent;
                fill: ${fillColor};
                opacity: 0;
                animation: letter-fade ${charDuration.toFixed(2)}s ease-out forwards;
            }

            @keyframes letter-fade {
                0% { opacity: 0; }
                100% { opacity: 1; }
            }
        `;
    }
    
    // Embed custom styles inside the SVG for portability
    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.setAttribute('type', 'text/css');
    style.textContent = animationStyles;
    svg.appendChild(style);

    // Base styles applied to all text elements
    const baseTextStyle = `
        font-size: ${fontSize}px;
        font-weight: ${fontWeight};
        font-family: ${fontFamily};
        dominant-baseline: central;
        stroke-width: ${strokeWidth};
    `;

    // 6. Create the text elements
    if (animationStyle === 'letters-fade-in') {
        let currentXPosition = textXPosition; 
        let charIndex = 0;
        const staggerDelay = (duration / characters.length) * 0.5; 

        // Create a separate <text> element for each character to enable staggering
        characters.forEach((char, i) => {
            const charWidth = textMetrics.charWidths[i];
            
            const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
            textEl.textContent = char;
            textEl.setAttribute('x', currentXPosition);
            textEl.setAttribute('y', textYPosition); 
            
            let charStyle = baseTextStyle;
            
            if (char.trim() !== '') {
                // Apply individual animation delay for stagger effect
                const delay = staggerDelay * charIndex;
                charStyle += `animation-delay: ${delay.toFixed(3)}s;`;
                textEl.classList.add('fade-char');
                charIndex++; 
            } else {
                // Spaces should be visible immediately
                charStyle += `fill: ${fillColor}; opacity: 1;`;
            }

            textEl.setAttribute('style', charStyle);
            svg.appendChild(textEl);
            
            currentXPosition += charWidth;
        });
    } else {
        // Use a single text element for stroke-draw and fill-fade animations
        const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
        textEl.textContent = text;
        textEl.setAttribute('x', textXPosition); 
        textEl.setAttribute('y', textYPosition); 
        textEl.setAttribute('text-anchor', 'start');
        
        // Apply letter-spacing for the combined text
        textEl.setAttribute('style', baseTextStyle + `letter-spacing: ${letterSpacing}px;`);
        textEl.id = 'animatedText';

        svg.appendChild(textEl);
    }

    // 7. Render and enable copy button
    svgContainer.appendChild(svg);
    copyBtn.disabled = false;
}

/**
 * Generates the correct Google Font @import URL based on the selected font family.
 * @param {string} primaryFontName - The clean name of the font.
 * @returns {string} The CSS @import rule or an empty string.
 */
function getFontImport(primaryFontName) {
    const weights = "100;200;300;400;500;600;700;800;900";
    let url = "";

    switch (primaryFontName) {
        case 'Inter': url = `https://fonts.googleapis.com/css2?family=Inter:wght@${weights}&display=swap`; break;
        case 'Roboto': url = `https://fonts.googleapis.com/css2?family=Roboto:wght@${weights}&display=swap`; break;
        case 'Montserrat': url = `https://fonts.googleapis.com/css2?family=Montserrat:wght@${weights}&display=swap`; break;
        case 'Playfair Display': url = `https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&display=swap`; break;
        case 'Oswald': url = `https://fonts.googleapis.com/css2?family=Oswald:wght@200;300;400;500;600;700&display=swap`; break;
        case 'Merriweather': url = `https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700;900&display=swap`; break;
        case 'Bebas Neue': url = `https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap`; break; 
        case 'Pacifico': url = `https://fonts.googleapis.com/css2?family=Pacifico&display=swap`; break; 
        case 'Space Mono': url = `https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap`; break;
        default: return ""; 
    }
    
    return url ? `@import url('${url}');` : "";
}

/**
 * Constructs a standalone HTML file containing the SVG and copies it to the clipboard.
 */
function copyAnimatedHTML() {
    const svgContainer = document.getElementById('svgContainer');
    const svgEl = svgContainer.querySelector('svg');
    const fontWeight = document.getElementById('fontWeight').value || '700';
    const fontSize = parseInt(document.getElementById('fontSize').value) || 60;
    const strokeWidth = document.getElementById('strokeWidth').value || '2';
    const letterSpacing = parseFloat(document.getElementById('letterSpacing').value) || 0;

    if (!svgEl) {
        console.error("No SVG element found to copy.");
        return;
    }

    // 1. Extract dynamic styles and temporarily remove them from the UI SVG
    const styleEl = svgEl.querySelector('style');
    let dynamicStyles = '';
    if (styleEl) {
        dynamicStyles = styleEl.textContent.trim();
        styleEl.remove();
    }

    // 2. Get the raw SVG content
    const svgContent = svgEl.outerHTML;

    // 3. Get font import for the standalone file
    const fontFamily = document.getElementById('fontFamily').value;
    let primaryFontName = fontFamily.split(',')[0].replace(/['"]/g, '').trim();
    const fontImport = getFontImport(primaryFontName);

    const finalSvgHeight = 150;

    // 4. Construct the complete, self-contained HTML document
    const fullHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Animated Text</title>
    <style>
        ${fontImport}
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background-color: #f3f4f6;
        }
        
        .svg-container {
            width: 100%; 
            max-width: 800px; 
            height: ${finalSvgHeight}px; 
            display: flex; 
            justify-content: center; 
            align-items: center;
        }

        /* Base styles for the SVG text elements */
        #animatedText, .fade-char {
            stroke-width: ${strokeWidth}px; 
            stroke-linecap: round;
            letter-spacing: ${letterSpacing}px;
            font-weight: ${fontWeight}; 
            font-size: ${fontSize}px; 
            font-family: ${fontFamily}; 
            dominant-baseline: central; 
        }

        /* DYNAMIC SVG ANIMATION STYLES: CSS keyframes and selectors generated by the app */
        ${dynamicStyles}
    </style>
</head>
<body>
    <div class="svg-container">
        ${svgContent}
    </div>
</body>
</html>`;

    // 5. Re-append the style element back to the UI SVG
    if (styleEl) {
            svgEl.prepend(styleEl);
    }

    // 6. Copy to clipboard and show modal
    try {
        const tempTextArea = document.createElement('textarea');
        tempTextArea.value = fullHtmlContent;
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        document.execCommand('copy');
        document.body.removeChild(tempTextArea);

        showModal('successModal');
    } catch (err) {
        console.error('Failed to copy text: ', err);
        const errorModal = document.getElementById('successModal');
        errorModal.querySelector('div.text-4xl').textContent = '✕';
        errorModal.querySelector('div.text-4xl').classList.replace('text-green-500', 'text-red-500');
        errorModal.querySelector('p').textContent = 'Copy failed! Check console.';
        showModal('successModal');
    }
}

// Initialization and Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('generateBtn').addEventListener('click', generateSVG);
    document.getElementById('copyBtn').addEventListener('click', copyAnimatedHTML);
    
    loadGoogleFonts();

    // Input validation for font size
    const fontSizeInput = document.getElementById('fontSize');
    fontSizeInput.addEventListener('change', (e) => {
        const input = e.target;
        const min = parseInt(input.min, 10);
        const max = parseInt(input.max, 10);
        let value = parseInt(input.value, 10);
        
        if (isNaN(value)) {
            input.value = 60; 
            return;
        }

        if (value > max) {
            input.value = max;
        } else if (value < min) {
            input.value = min;
        }
    });

    // Generate default SVG on load
    generateSVG();
});
