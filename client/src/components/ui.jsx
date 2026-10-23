import { AlertCircle, CheckCircle2, Circle, Clock3, LoaderCircle, Plus, Search } from 'lucide-react';
export function Button({children,variant='primary',...props}){return <button className={`btn btn-${variant} ${props.className||''}`} {...props}>{children}</button>}
export function Field({label,...props}){return <label className="field"><span>{label}</span><input {...props}/></label>}
export function TextArea({label,...props}){return <label className="field"><span>{label}</span><textarea rows="3" {...props}/></label>}
export function SelectField({label,children,...props}){return <label className="field"><span>{label}</span><select {...props}>{children}</select></label>}
export function Status({value}){const cls=value==='Done'?'green':value==='In Progress'?'blue':value==='Archived'?'gray':'amber';return <span className={`pill ${cls}`}>{value||'Todo'}</span>}
export function Priority({value}){return <span className={`priority priority-${String(value||'Medium').toLowerCase()}`}>{value||'Medium'}</span>}
export function Empty({title='Nothing here yet',text='When something is added, it will show up here.'}){return <div className="empty"><Circle size={26}/><strong>{title}</strong><span>{text}</span></div>}
export function Loading(){return <div className="loading"><LoaderCircle className="spin"/> Loading…</div>}
export function ErrorBanner({children}){return <div className="error-banner"><AlertCircle size={17}/>{children}</div>}
export function SuccessBanner({children}){return <div className="success-banner"><CheckCircle2 size={17}/>{children}</div>}
export {Plus,Search,Clock3};
