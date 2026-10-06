import { Link } from 'react-router-dom'
import './NotFound.css'

function NotFound() {
  return (
    <div className="not-found">
      <img className="not-found-mark" src="/favicon.svg" alt="" aria-hidden="true" />
      <h1>Nothing on the radar here</h1>
      <p>That page doesn't exist — it might've moved, or the link's just wrong.</p>
      <Link className="btn btn--solid" to="/">
        Back to home
      </Link>
    </div>
  )
}

export default NotFound
