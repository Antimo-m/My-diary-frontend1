import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'

const emptyMeta = { current_page: 1, last_page: 1, total: 0, from: null, to: null }

/**
 * Server state for a paginated diary list (public or secret, depending on the
 * injected API module). The query is keyed by scope + filters, so pagination
 * and filtering are cached independently.
 */
function useDiaryNotes({ diaryApi, enabled, filters, scope }) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['diary-notes', scope, filters],
    queryFn: () => diaryApi.listDiaryNotes({ per_page: 8, ...filters }),
    enabled,
    placeholderData: keepPreviousData,
  })

  return {
    invalidateNotes: () => queryClient.invalidateQueries({ queryKey: ['diary-notes', scope] }),
    notes: query.data?.data ?? [],
    notesError: query.error,
    notesLoading: query.isPending,
    notesMeta: query.data?.meta ?? emptyMeta,
  }
}

export default useDiaryNotes
