// Compresión de imágenes en el cliente hasta < 150 KB (canvas + JPEG).

const LIMITE_BYTES = 150 * 1024;

const cargarImagen = (url) =>
  new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = url;
  });

const bytesDeDataUrl = (d) => Math.round(((d.length - d.indexOf(',') - 1) * 3) / 4);

/** @returns {Promise<{dataUrl:string, bytes:number, original:number}>} */
export async function comprimirImagen(archivo, limite = LIMITE_BYTES) {
  const url = URL.createObjectURL(archivo);
  try {
    const img = await cargarImagen(url);
    let lado = 1024;
    let calidad = 0.8;
    let dataUrl = '';
    for (let intento = 0; intento < 12; intento++) {
      const escala = Math.min(1, lado / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * escala));
      c.height = Math.max(1, Math.round(img.height * escala));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      dataUrl = c.toDataURL('image/jpeg', calidad);
      if (bytesDeDataUrl(dataUrl) <= limite) break;
      if (calidad > 0.45) calidad -= 0.1;
      else lado = Math.round(lado * 0.8);
    }
    return { dataUrl, bytes: bytesDeDataUrl(dataUrl), original: archivo.size };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const formatoKB = (b) => (b / 1024).toFixed(b > 1024 * 100 ? 0 : 1) + ' KB';
