import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getBachecaBoard, getBachecaProject, listBachecaProjects } from '../services/kanbanApi'

/**
 * Server state for the Bacheca: the active board (daily or project) plus the
 * project list. Mutations refresh everything through invalidateBacheca().
 */
function useBachecaBoard({ date, enabled, route }) {
  const queryClient = useQueryClient()
  const boardKey = ['bacheca', 'board', route.mode, route.projectIdentifier, route.mode === 'project' ? null : date]
  const boardQuery = useQuery({
    queryKey: boardKey,
    queryFn: () => (route.mode === 'project' && route.projectIdentifier
      ? getBachecaProject(route.projectIdentifier)
      : getBachecaBoard(date)),
    enabled: enabled && route.mode !== 'home',
  })
  const projectsQuery = useQuery({
    queryKey: ['bacheca', 'projects'],
    queryFn: listBachecaProjects,
    enabled,
  })

  const patchBoardTask = (taskId, patch) => {
    queryClient.setQueryData(boardKey, (current) => (current ? {
      ...current,
      columns: current.columns.map((column) => ({
        ...column,
        tasks: column.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
      })),
    } : current))
  }

  return {
    board: {
      columns: boardQuery.data?.columns ?? [],
      labels: boardQuery.data?.labels ?? [],
      date: boardQuery.data?.date ?? date,
    },
    boardError: boardQuery.error,
    boardLoading: boardQuery.isPending && route.mode !== 'home',
    invalidateBacheca: () => queryClient.invalidateQueries({ queryKey: ['bacheca'] }),
    patchBoardTask,
    projects: projectsQuery.data ?? [],
    projectsError: projectsQuery.error,
    selectedProject: route.mode === 'project' ? boardQuery.data?.project ?? null : null,
  }
}

export default useBachecaBoard
