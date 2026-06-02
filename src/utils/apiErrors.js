const translations = [
  [/network error/i, 'Backend non raggiungibile. Controlla che Laravel sia avviato.'],
  [/unauthenticated/i, 'Sessione scaduta, effettua di nuovo l accesso.'],
  [/the given data was invalid/i, 'Controlla i campi evidenziati e riprova.'],
  [/required/i, 'Compila tutti i campi obbligatori.'],
  [/invalid/i, 'Uno dei valori inseriti non e valido.'],
  [/not found/i, 'Elemento non trovato o non piu disponibile.'],
]

function translateMessage(message, fallback) {
  if (!message) {
    return fallback
  }

  const normalized = String(message).trim()
  const match = translations.find(([pattern]) => pattern.test(normalized))

  return match ? match[1] : normalized
}

export function getApiError(error, fallback = 'Operazione non riuscita.') {
  if (!error?.response) {
    return 'Backend non raggiungibile. Controlla che Laravel sia avviato.'
  }

  if (error.response.status === 401) {
    return 'Sessione scaduta, effettua di nuovo l accesso.'
  }

  if (error.response.status === 403) {
    return 'Non hai i permessi per questa operazione.'
  }

  if (error.response.status === 404) {
    return 'Elemento non trovato o non piu disponibile.'
  }

  if (error.response.status === 419) {
    return 'Sessione scaduta. Ricarica la pagina ed effettua di nuovo l accesso.'
  }

  if (error.response.status >= 500) {
    return 'Si e verificato un errore temporaneo. Riprova tra poco.'
  }

  const data = error?.response?.data

  if (data?.errors) {
    return Object.values(data.errors)
      .flat()
      .map((message) => translateMessage(message, fallback))
      .join(' ')
  }

  return translateMessage(data?.message, fallback)
}
