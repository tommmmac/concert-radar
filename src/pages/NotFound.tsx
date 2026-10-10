import { Link } from 'react-router-dom'
import './NotFound.css'

function NotFound() {
  return (
    <div className="not-found">
      <img className="not-found-mark" src="/favicon.svg" alt="" aria-hidden="true" />
      <h1>Nothing on the radar here</h1>
      <p>There's no page here. It might have moved, or the link is wrong.</p>
      <Link className="btn btn--solid" to="/">
        Back to home
      </Link>
    </div>
  )
}

export default NotFound
