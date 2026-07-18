import { useMutation, useQueryClient } from '@tanstack/react-query'

/**
 * Canale unico per tutte le scritture della Bacheca: espone un solo stato
 * isMutating con cui la UI disabilita i submit (niente doppi invii), e dopo
 * ogni operazione riuscita rinfresca la cache e mostra il toast di successo.
 * Gli errori restano al chiamante, che decide dove mostrarli.
 */
function useBachecaMutations({ onSuccessMessage }) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ run }) => run(),
    onSuccess: async (result, { invalidate = true, successMessage }) => {
      if (invalidate) {
        await queryClient.invalidateQueries({ queryKey: ['bacheca'] })
      }

      if (successMessage) {
        onSuccessMessage(successMessage)
      }
    },
  })

  return {
    isMutating: mutation.isPending,
    mutateBacheca: (run, options = {}) => mutation.mutateAsync({ run, ...options }),
  }
}

export default useBachecaMutations
