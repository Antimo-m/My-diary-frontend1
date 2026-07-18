import { beforeEach, describe, expect, it } from 'vitest'
import { getApiError } from '../../src/utils/apiErrors'

function responseError(status, data = {}) {
  return { response: { status, data } }
}

describe('getApiError', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.lang = 'it'
  })

  it('segnala il backend non raggiungibile quando manca la risposta', () => {
    expect(getApiError(new Error('Network Error'))).toBe('Backend non raggiungibile. Controlla che Laravel sia avviato.')
  })

  it('traduce la sessione scaduta per 401 e 419', () => {
    expect(getApiError(responseError(401))).toBe('Sessione scaduta, effettua di nuovo l accesso.')
    expect(getApiError(responseError(419))).toBe('Sessione scaduta. Ricarica la pagina ed effettua di nuovo l accesso.')
  })

  it('usa il numero minimo di caratteri indicato dal backend', () => {
    const error = responseError(422, {
      errors: { password: ['The password field must be at least 8 characters.'] },
    })

    expect(getApiError(error)).toBe('La password deve contenere almeno 8 caratteri.')

    const secretError = responseError(422, {
      errors: { password: ['The password field must be at least 12 characters.'] },
    })

    expect(getApiError(secretError)).toBe('La password deve contenere almeno 12 caratteri.')
  })

  it('unisce tutti i messaggi di validazione', () => {
    const error = responseError(422, {
      errors: {
        email: ['The email field is required.'],
        password: ['The password field is required.'],
      },
    })

    expect(getApiError(error)).toBe('Inserisci l email. Inserisci la password.')
  })

  it('passa ai messaggi inglesi quando il locale salvato e en', () => {
    localStorage.setItem('my-diary-locale', 'en')

    expect(getApiError(responseError(401))).toBe('Session expired. Please sign in again.')
    expect(getApiError(responseError(422, {
      errors: { password: ['The password field must be at least 8 characters.'] },
    }))).toBe('The password must contain at least 8 characters.')
  })

  it('restituisce il fallback per messaggi sconosciuti', () => {
    expect(getApiError(responseError(422, { message: '' }), 'Fallback dedicato.')).toBe('Fallback dedicato.')
  })
})
