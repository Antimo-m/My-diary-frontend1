import { useMemo } from 'react'
import { reportError, reportEvent } from '../errorLogger'

/**
 * Accesso al monitoraggio dai componenti, per gli errori che React non
 * propaga ai boundary (event handler, flussi asincroni gestiti):
 *
 *   const { reportError, reportEvent } = useErrorReporter()
 *   try { await upload() } catch (e) { reportError(e, { source: 'upload' }) }
 */
export function useErrorReporter() {
  return useMemo(() => ({ reportError, reportEvent }), [])
}
