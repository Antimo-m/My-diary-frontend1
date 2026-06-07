const errorTranslations = {
  it: [
    [/network error/i, 'Backend non raggiungibile. Controlla che Laravel sia avviato.'],
    [/unauthenticated/i, 'Sessione scaduta, effettua di nuovo l accesso.'],
    [/secret diary is locked|diario segreto bloccato/i, 'Diario Segreto bloccato. Inserisci la password per continuare.'],
    [/secret diary password is incorrect|password diario segreto non corretta/i, 'Password Diario Segreto non corretta.'],
    [/secret diary password already exists|password del diario segreto esiste gia/i, 'La password del Diario Segreto esiste gia.'],
    [/these credentials do not match our records/i, 'Email o password non corretti.'],
    [/email field is required/i, 'Inserisci l email.'],
    [/password field is required/i, 'Inserisci la password.'],
    [/name field is required/i, 'Inserisci il nome.'],
    [/title field is required/i, 'Inserisci il titolo.'],
    [/body field is required/i, 'Scrivi il contenuto della nota.'],
    [/date field is required/i, 'Scegli una data.'],
    [/given data was invalid/i, 'Controlla i campi evidenziati e riprova.'],
    [/valid email address/i, 'Inserisci un indirizzo email valido.'],
    [/already been taken/i, 'Questo valore e gia stato utilizzato.'],
    [/confirmation.*does not match|conferma.*non coincide/i, 'La conferma non coincide.'],
    [/at least (\d+) characters|almeno (\d+) caratteri/i, 'La password deve contenere almeno 12 caratteri.'],
    [/uppercase.*lowercase|maiuscola.*minuscola/i, 'La password deve contenere almeno una lettera maiuscola e una minuscola.'],
    [/at least one number|almeno un numero/i, 'La password deve contenere almeno un numero.'],
    [/at least one symbol|carattere speciale/i, 'La password deve contenere almeno un carattere speciale.'],
    [/selected .* is invalid/i, 'Il valore selezionato non e valido.'],
    [/date before or equal to/i, 'La data scelta deve essere precedente o uguale alla scadenza.'],
    [/date after or equal to/i, 'La data scelta deve essere successiva o uguale alla data richiesta.'],
    [/true or false/i, 'Il valore deve essere attivo o disattivo.'],
    [/password reset token is invalid|link di reset non e valido/i, 'Il link di reset non e valido o e scaduto.'],
    [/we can't find a user|se l email e registrata/i, 'Se l email e registrata, riceverai un link per reimpostare la password.'],
    [/please wait before retrying|troppi tentativi|too many/i, 'Troppi tentativi ravvicinati. Riprova tra poco.'],
    [/required|obbligatorio/i, 'Compila tutti i campi obbligatori.'],
    [/invalid|non valido/i, 'Uno dei valori inseriti non e valido.'],
    [/not found/i, 'Elemento non trovato o non piu disponibile.'],
  ],
  en: [
    [/network error/i, 'Backend unreachable. Check that Laravel is running.'],
    [/unauthenticated/i, 'Session expired. Please sign in again.'],
    [/secret diary is locked|diario segreto bloccato/i, 'Secret Diary is locked. Enter the password to continue.'],
    [/secret diary password is incorrect|password diario segreto non corretta/i, 'The Secret Diary password is incorrect.'],
    [/secret diary password already exists|password del diario segreto esiste gia/i, 'The Secret Diary password already exists.'],
    [/these credentials do not match our records/i, 'Email or password is incorrect.'],
    [/email field is required/i, 'Enter your email.'],
    [/password field is required/i, 'Enter your password.'],
    [/name field is required/i, 'Enter your name.'],
    [/title field is required/i, 'Enter a title.'],
    [/body field is required/i, 'Write the note content.'],
    [/date field is required/i, 'Choose a date.'],
    [/given data was invalid/i, 'Check the highlighted fields and try again.'],
    [/valid email address/i, 'Enter a valid email address.'],
    [/already been taken/i, 'This value has already been used.'],
    [/confirmation.*does not match|conferma.*non coincide/i, 'The confirmation does not match.'],
    [/at least (\d+) characters|almeno (\d+) caratteri/i, 'The password must contain at least 12 characters.'],
    [/uppercase.*lowercase|maiuscola.*minuscola/i, 'The password must include uppercase and lowercase letters.'],
    [/at least one number|almeno un numero/i, 'The password must include at least one number.'],
    [/at least one symbol|carattere speciale/i, 'The password must include at least one special character.'],
    [/selected .* is invalid/i, 'The selected value is invalid.'],
    [/date before or equal to/i, 'The selected date must be before or equal to the due date.'],
    [/date after or equal to/i, 'The selected date must be after or equal to the required date.'],
    [/true or false/i, 'The value must be on or off.'],
    [/password reset token is invalid|link di reset non e valido/i, 'The reset link is invalid or expired.'],
    [/we can't find a user|se l email e registrata/i, 'If the email is registered, you will receive a reset link.'],
    [/please wait before retrying|troppi tentativi|too many/i, 'Too many attempts. Try again shortly.'],
    [/required|obbligatorio/i, 'Fill in all required fields.'],
    [/invalid|non valido/i, 'One of the values is invalid.'],
    [/not found/i, 'Item not found or no longer available.'],
  ],
}

function currentLocale() {
  return (localStorage.getItem('my-diary-locale') || document.documentElement.lang || 'it').slice(0, 2) === 'en' ? 'en' : 'it'
}

function translateMessage(message, fallback) {
  if (!message) {
    return fallback
  }

  const normalized = String(message).trim()
  const match = errorTranslations[currentLocale()].find(([pattern]) => pattern.test(normalized))

  return match ? match[1] : normalized
}

export function getApiError(error, fallback) {
  const locale = currentLocale()
  const defaultFallback = fallback ?? (locale === 'en' ? 'Operation failed.' : 'Operazione non riuscita.')

  if (!error?.response) {
    return locale === 'en'
      ? 'Backend unreachable. Check that Laravel is running.'
      : 'Backend non raggiungibile. Controlla che Laravel sia avviato.'
  }

  const data = error?.response?.data

  if (error.response.status === 401) {
    return locale === 'en' ? 'Session expired. Please sign in again.' : 'Sessione scaduta, effettua di nuovo l accesso.'
  }

  if (error.response.status === 403) {
    return locale === 'en' ? 'You do not have permission for this action.' : 'Non hai i permessi per questa operazione.'
  }

  if (error.response.status === 404) {
    return locale === 'en' ? 'Item not found or no longer available.' : 'Elemento non trovato o non piu disponibile.'
  }

  if (error.response.status === 419) {
    return locale === 'en' ? 'Session expired. Reload the page and sign in again.' : 'Sessione scaduta. Ricarica la pagina ed effettua di nuovo l accesso.'
  }

  if (error.response.status === 423) {
    return translateMessage(data?.message, locale === 'en' ? 'Secret Diary is locked. Enter the password to continue.' : 'Diario Segreto bloccato. Inserisci la password per continuare.')
  }

  if (error.response.status >= 500) {
    return locale === 'en' ? 'A temporary error occurred. Try again shortly.' : 'Si e verificato un errore temporaneo. Riprova tra poco.'
  }

  if (data?.errors) {
    return Object.values(data.errors)
      .flat()
      .map((message) => translateMessage(message, defaultFallback))
      .join(' ')
  }

  return translateMessage(data?.message, defaultFallback)
}
