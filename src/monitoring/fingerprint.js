// Fingerprint stabile di un errore: il backend raggruppa le occorrenze senza
// euristiche proprie. Strategia: sorgente + messaggio normalizzato + frame di
// testa dello stack, depurati da tutto cio che varia tra utenti o tra build.
//
// - dal MESSAGGIO tolgo valori dinamici (numeri, id esadecimali, stringhe
//   quotate, URL): "id 42 non trovato" e "id 97 non trovato" sono lo stesso bug;
// - dello STACK tengo solo il primo frame applicativo, senza riga:colonna
//   (cambiano a ogni build) e senza l'hash che Vite appende ai nomi dei file
//   ("DiaryPage-B9fElw3Y.js" -> "DiaryPage.js"), cosi la release successiva
//   non spezza il gruppo;
// - hash FNV-1a: sincrono, senza dipendenze, collisioni irrilevanti su questi
//   volumi (e il backend puo comunque ricalcolare il proprio).

function normalizeMessage(message) {
  return String(message)
    .replace(/https?:\/\/\S+/g, '<url>')
    .replace(/(["'`]).*?\1/g, '<str>')
    .replace(/\b[0-9a-f]{8,}\b/gi, '<hex>')
    .replace(/\d+/g, '<n>')
    .trim()
    .slice(0, 300)
}

function topStackFrame(stack) {
  if (!stack) {
    return ''
  }

  const frame = String(stack)
    .split('\n')
    .map((line) => line.trim())
    .find((line) => /^at |@|\(/.test(line) && !/^Error/i.test(line))

  if (!frame) {
    return ''
  }

  return frame
    .replace(/https?:\/\/[^/]+/g, '')
    .replace(/:\d+:\d+\)?$/g, '')
    .replace(/-[A-Za-z0-9_-]{8,}\.(m?js|css)/g, '.$1')
    .slice(0, 200)
}

function fnv1aHex(value) {
  let hash = 0x811c9dc5

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }

  return (hash >>> 0).toString(16).padStart(8, '0')
}

export function computeFingerprint({ message, source, stack }) {
  const normalized = `${source}|${normalizeMessage(message)}|${topStackFrame(stack)}`

  // Doppio passaggio (dritto + rovesciato) per allargare lo spazio dei valori
  // mantenendo l'hash sincrono e senza dipendenze.
  return fnv1aHex(normalized) + fnv1aHex([...normalized].reverse().join(''))
}
