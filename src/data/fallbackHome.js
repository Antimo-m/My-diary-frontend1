export const fallbackHome = {
  app: {
    name: 'My Diary',
    tagline: 'Scrivi la giornata, organizza le attivita, ritrova il filo.',
    description:
      'My Diary unisce note private, pagine visive e una bacheca Kanban fluida per dare forma alla tua giornata.',
    formatted_today: new Intl.DateTimeFormat('it-IT').format(new Date()),
  },
  stats: {
    notes: 0,
    today_tasks: 0,
    projects: 0,
  },
  recent_notes: [],
  recent_projects: [],
  today_tasks: [],
  today_columns: [],
  preview_columns: [],
}
