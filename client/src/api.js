function getToken() {
  return localStorage.getItem('token')
}

async function request(url, options = {}) {
  const headers = { ...options.headers }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(url, { ...options, headers })
  const data = await res.json()
  if (!res.ok) throw { response: { data } }
  return data
}

export function get(url) {
  return request(url)
}

export function post(url, body, isFormData = false) {
  const headers = isFormData ? {} : { 'Content-Type': 'application/json' }
  return request(url, {
    method: 'POST',
    headers,
    body: isFormData ? body : JSON.stringify(body),
  })
}
