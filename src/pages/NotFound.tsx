import { Link } from 'react-router-dom'
import { Seo } from '../seo/Seo'

export default function NotFound() {
  return (
    <>
      <Seo />

      <div className="page-shell-empty text-center">
        <p className="text-brand-500 dark:text-brand-300 font-mono text-5xl font-bold">404</p>
        <h1 className="text-ink-900 dark:text-white mt-4 text-2xl font-bold tracking-tight text-balance">This page does not exist</h1>
        <p className="text-ink-500 dark:text-ink-300 mt-3 leading-relaxed">
          The link may be out of date, or the address may have a typo. Nothing is broken on your side.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn-primary">
            Back to home
          </Link>
          <Link to="/mock" className="btn-secondary">
            Start a mock test
          </Link>
        </div>
      </div>
    </>
  )
}
