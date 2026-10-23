import { Link } from 'react-router-dom';
import { Button } from '../components/ui';
export default function NotFound(){return <div className="not-found"><div className="eyebrow">404 · WRONG TURN</div><h1>This page took a detour.</h1><p>The page you’re looking for doesn’t exist or may have moved.</p><Link to="/dashboard"><Button>Back to dashboard</Button></Link></div>}
