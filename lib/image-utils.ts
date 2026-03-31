/**
 * Processes an image file by resizing/compressing it and returning a Base64 string and its aspect ratio.
 * Limits the maximum dimension to 800px to keep Base64 strings efficient.
 */
export async function processImageFile(file: File): Promise<{ src: string; aspectRatio: number }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const maxDim = 800;
                
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = (height / width) * maxDim;
                        width = maxDim;
                    } else {
                        width = (width / height) * maxDim;
                        height = maxDim;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                
                // Use JPEG with 0.7 quality for good compression-to-quality ratio
                const base64 = canvas.toDataURL('image/jpeg', 0.7);
                const aspectRatio = width / height;

                resolve({ src: base64, aspectRatio });
            };
            img.onerror = reject;
            img.src = event.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
