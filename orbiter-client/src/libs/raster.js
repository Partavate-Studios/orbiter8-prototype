// Drawing an SVG once into a bitmap, so the camera can slide and scale it for free (the intro's city:
// libs/intro-world.js). The browser rasterizes the SVG as an image, then it's painted into a canvas;
// after that, moving or scaling the canvas costs the GPU nothing.

/** Draws an SVG document into a new canvas of w × h px. */
export async function svgToCanvas(svg, w, h) {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d').drawImage(img, 0, 0, w, h)
    return canvas
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** The same, as an object URL of a PNG (for <img> and SVG <image>); revoke it when done. */
export async function svgToImageUrl(svg, w, h) {
  const canvas = await svgToCanvas(svg, w, h)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  return URL.createObjectURL(blob)
}
