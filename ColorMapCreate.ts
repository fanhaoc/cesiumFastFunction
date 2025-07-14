/**
 *创建色带映射纹理（分层）
 *
 * @export
 * @param {string[]} colors 颜色数组,16进制字符串形式
 * @return {*} 
 */
export default function colorMapCreate(colors: string[]) {
  const len = colors.length
  const colorArray = new Uint8ClampedArray(len * 4)
  for (let i = 0; i < colorArray.length; i += 4) {
    const color = hexToRgb(colors[i / 4])
    colorArray[i] = color[0] // R
    colorArray[i + 1] = color[1] // G
    colorArray[i + 2] = color[2] // B
    colorArray[i + 3] = 255 // A
  }
  const imageData = new ImageData(colorArray, len, 1)
  const canvas = document.createElement('canvas')
  canvas.width = len
  canvas.height = 1
  const ctx = canvas.getContext('2d')
  ctx?.putImageData(imageData, 0, 0, 0, 0, len, 1)
  return canvas
}
function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace('#', '')
  let r = parseInt(hex.slice(0, 2), 16)
  let g = parseInt(hex.slice(2, 4), 16)
  let b = parseInt(hex.slice(4, 6), 16)
  return [r, g, b]
}
function downLoad(canvas: HTMLCanvasElement) {
  const link = document.createElement('a')
  link.href = canvas.toDataURL()
  link.download = 'colorMap.png'
  link.click()
}
