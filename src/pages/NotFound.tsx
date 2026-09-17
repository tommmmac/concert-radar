import { Link } from 'react-router-dom'
import './NotFound.css'

function NotFound() {
  return (
    <div className="not-found">
      <span className="not-found-mark" aria-hidden="true">
        📡
      </span>
      <h1>Nothing on the radar here</h1>
      <p>That page doesn't exist — it might've moved, or the link's just wrong.</p>
      <Link className="not-found-link" to="/">
        Back to News
      </Link>
    </div>
  )
}

export default NotFound
