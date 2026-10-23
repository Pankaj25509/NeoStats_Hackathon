export async function api(path, options={}) {
  const response = await fetch(`/api${path}`, {
    credentials:'include',
    headers:{'Content-Type':'application/json', ...(options.headers||{})},
    ...options
  });
  const data = response.status===204 ? {} : await response.json().catch(()=>({error:'Invalid server response'}));
  if (!response.ok) {
    const error = new Error(data.error || `Request failed (${response.status})`);
    error.status=response.status; error.data=data; throw error;
  }
  return data;
}
