import QRCode from 'qrcode'

export const idQrOptions = {width:480,margin:4,errorCorrectionLevel:'H'}
export const logoBox = {x:204,y:204,size:72,padding:4}

export async function createIdQr(pwdId) {
  const canvas = document.createElement('canvas')
  await QRCode.toCanvas(canvas,pwdId,idQrOptions)
  const logo = new Image()
  await new Promise((resolve,reject) => {
    logo.onload = resolve
    logo.onerror = () => reject(new Error('Could not load the DSWD QR logo. Please reload the page.'))
    logo.src = '/dswd-logo.png'
  })
  const context = canvas.getContext('2d')
  const {x,y,size,padding} = logoBox
  context.fillStyle = '#fff'
  context.fillRect(x,y,size,size)
  const scale = (size - padding * 2) / Math.max(logo.naturalWidth,logo.naturalHeight)
  const width = logo.naturalWidth * scale
  const height = logo.naturalHeight * scale
  context.drawImage(logo,x + (size-width)/2,y + (size-height)/2,width,height)
  return canvas.toDataURL('image/png')
}
