export function initials(name='?'){return name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();}
export function prettyDate(value){if(!value)return 'No due date';const d=new Date(value.length===10?`${value}T00:00:00`:value);return Number.isNaN(d.getTime())?value:d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});}
export function errorMessage(e){return e?.message||'Something went wrong';}
