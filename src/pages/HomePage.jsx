import PreviewPanel from '../components/PreviewPanel'
import useHomeOverview from '../hooks/useHomeOverview'
import './HomePage.css'

function HomePage({ onNavigate }) {
  const { overview, status } = useHomeOverview()

  return (
    <section className="home-page page-container">
      <div className="home-page__copy">
        <p className="eyebrow">Diario digitale personale</p>
        <h1>{overview.app?.tagline}</h1>
        <p className="lead">{overview.app?.description}</p>

        <div className="home-page__actions">
          <button className="btn btn-primary" type="button" onClick={() => onNavigate('diary')}>
            Apri diario
          </button>
          <button className="btn btn-outline" type="button" onClick={() => onNavigate('kanban')}>
            Vai al Kanban
          </button>
        </div>

        <div className="home-page__stats" aria-label="Statistiche">
          <div>
            <strong>{overview.stats?.notes ?? 0}</strong>
            <span>Pagine</span>
          </div>
          <div>
            <strong>{overview.stats?.today_tasks ?? 0}</strong>
            <span>Task oggi</span>
          </div>
        </div>

        {status === 'fallback' ? (
          <p className="api-note">Backend non raggiungibile: anteprima locale caricata.</p>
        ) : null}
      </div>

      <PreviewPanel overview={overview} />
    </section>
  )
}

export default HomePage
