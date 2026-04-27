import { useEffect, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1'
const TOKEN_STORAGE_KEY = 'inventory_auth_token'

async function apiRequest(path, options = {}, token) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!response.ok) {
    let message = 'Request failed'
    try {
      const payload = await response.json()
      message = payload.error || message
    } catch {
      // Keep fallback message if response body is not JSON.
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || '')
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [infoMessage, setInfoMessage] = useState('')

  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    business_name: '',
  })
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })

  const [createForm, setCreateForm] = useState({
    name: '',
    sku: '',
    price: '',
    quantity: '',
    category: '',
  })

  const [lookupProductId, setLookupProductId] = useState('')
  const [editDrafts, setEditDrafts] = useState({})

  async function loadProducts(activeToken = token) {
    if (!activeToken) return

    setLoadingProducts(true)
    setErrorMessage('')

    try {
      const data = await apiRequest('/products', {}, activeToken)
      setProducts(data.products || [])
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setLoadingProducts(false)
    }
  }

  useEffect(() => {
    if (!token) {
      setProducts([])
      return
    }

    loadProducts(token)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  function applyToken(nextToken) {
    setToken(nextToken)
    if (nextToken) {
      localStorage.setItem(TOKEN_STORAGE_KEY, nextToken)
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
    }
  }

  async function handleRegister(event) {
    event.preventDefault()
    setErrorMessage('')
    setInfoMessage('')

    try {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerForm),
      })

      applyToken(data.token)
      setInfoMessage(`Registration successful. User ID: ${data.user_id}`)
      setRegisterForm({ email: '', password: '', business_name: '' })
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  async function handleLogin(event) {
    event.preventDefault()
    setErrorMessage('')
    setInfoMessage('')

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginForm),
      })

      applyToken(data.token)
      setInfoMessage('Login successful.')
      setLoginForm({ email: '', password: '' })
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  function handleLogout() {
    applyToken('')
    setSelectedProduct(null)
    setErrorMessage('')
    setInfoMessage('Logged out.')
  }

  async function handleCreateProduct(event) {
    event.preventDefault()
    setErrorMessage('')
    setInfoMessage('')

    try {
      const data = await apiRequest(
        '/products',
        {
          method: 'POST',
          body: JSON.stringify({
            ...createForm,
            price: Number(createForm.price),
            quantity: Number(createForm.quantity),
          }),
        },
        token,
      )

      setInfoMessage(`Created product ${data.product_id}`)
      setCreateForm({
        name: '',
        sku: '',
        price: '',
        quantity: '',
        category: '',
      })
      await loadProducts()
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  async function handleLookupProduct(event) {
    event.preventDefault()
    if (!lookupProductId) return

    setErrorMessage('')
    setInfoMessage('')

    try {
      const data = await apiRequest(`/products/${lookupProductId}`, {}, token)
      setSelectedProduct(data)
    } catch (error) {
      setSelectedProduct(null)
      setErrorMessage(error.message)
    }
  }

  async function handleUpdateProduct(id) {
    const draft = editDrafts[id]
    if (!draft) return

    setErrorMessage('')
    setInfoMessage('')

    try {
      await apiRequest(
        `/products/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            name: draft.name,
            category: draft.category,
            price: draft.price === '' ? undefined : Number(draft.price),
            quantity: draft.quantity === '' ? undefined : Number(draft.quantity),
          }),
        },
        token,
      )

      setInfoMessage(`Updated product ${id}.`)
      await loadProducts()
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  async function handleDeleteProduct(id) {
    setErrorMessage('')
    setInfoMessage('')

    try {
      await apiRequest(`/products/${id}`, { method: 'DELETE' }, token)
      setInfoMessage(`Deleted product ${id}.`)
      if (selectedProduct?.id === id) {
        setSelectedProduct(null)
      }
      await loadProducts()
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Shop Inventory Cloud App</h1>
        <p>Real-time inventory management for groceries, pharmacies, and local retailers.</p>
        <div className="meta-row">
          <span>API: {API_BASE_URL}</span>
          <span>{token ? 'Authenticated' : 'Not authenticated'}</span>
          {token ? (
            <button type="button" onClick={handleLogout} className="ghost-button">
              Log out
            </button>
          ) : null}
        </div>
        {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}
        {infoMessage ? <div className="info-banner">{infoMessage}</div> : null}
      </header>

      <main className="grid-layout">
        <section className="panel">
          <h2>Register Business</h2>
          <form className="form-grid" onSubmit={handleRegister}>
            <input
              placeholder="Business name"
              value={registerForm.business_name}
              onChange={(event) =>
                setRegisterForm((prev) => ({ ...prev, business_name: event.target.value }))
              }
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={registerForm.email}
              onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={registerForm.password}
              onChange={(event) =>
                setRegisterForm((prev) => ({ ...prev, password: event.target.value }))
              }
              required
            />
            <button type="submit">Register</button>
          </form>
        </section>

        <section className="panel">
          <h2>Login</h2>
          <form className="form-grid" onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={loginForm.email}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
            <button type="submit">Login</button>
          </form>
        </section>

        <section className="panel panel-wide">
          <h2>Create Product</h2>
          <form className="form-grid product-grid" onSubmit={handleCreateProduct}>
            <input
              placeholder="Name"
              value={createForm.name}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
              required
              disabled={!token}
            />
            <input
              placeholder="SKU"
              value={createForm.sku}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, sku: event.target.value }))}
              required
              disabled={!token}
            />
            <input
              placeholder="Price"
              value={createForm.price}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, price: event.target.value }))}
              required
              disabled={!token}
            />
            <input
              placeholder="Quantity"
              value={createForm.quantity}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, quantity: event.target.value }))}
              required
              disabled={!token}
            />
            <input
              placeholder="Category"
              value={createForm.category}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, category: event.target.value }))}
              required
              disabled={!token}
            />
            <button type="submit" disabled={!token}>
              Create Product
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>Lookup Product By ID</h2>
          <form className="inline-filters" onSubmit={handleLookupProduct}>
            <input
              placeholder="Product UUID"
              value={lookupProductId}
              onChange={(event) => setLookupProductId(event.target.value)}
              disabled={!token}
            />
            <button type="submit" disabled={!token}>
              Get Product
            </button>
          </form>

          {selectedProduct ? (
            <div className="row-card details-card">
              <div>
                <strong>ID:</strong> {selectedProduct.id}
              </div>
              <div>
                <strong>Name:</strong> {selectedProduct.name}
              </div>
              <div>
                <strong>SKU:</strong> {selectedProduct.sku}
              </div>
              <div>
                <strong>Price:</strong> {selectedProduct.price}
              </div>
              <div>
                <strong>Quantity:</strong> {selectedProduct.quantity}
              </div>
              <div>
                <strong>Category:</strong> {selectedProduct.category}
              </div>
            </div>
          ) : (
            <p className="hint">No product selected.</p>
          )}
        </section>

        <section className="panel">
          <h2>Products</h2>
          <div className="inline-filters">
            <button type="button" onClick={() => loadProducts()} disabled={!token || loadingProducts}>
              {loadingProducts ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          <div className="list">
            {products.map((product) => {
              const draft = editDrafts[product.id] || {
                name: product.name,
                price: String(product.price),
                quantity: String(product.quantity),
                category: product.category,
              }

              return (
                <div key={product.id} className="row-card">
                  <div className="product-row-header">
                    <strong>{product.name}</strong>
                    <span>{product.sku}</span>
                  </div>
                  <div className="inline-edit">
                    <input
                      value={draft.name}
                      onChange={(event) =>
                        setEditDrafts((prev) => ({
                          ...prev,
                          [product.id]: { ...draft, name: event.target.value },
                        }))
                      }
                      disabled={!token}
                    />
                    <input
                      value={draft.price}
                      onChange={(event) =>
                        setEditDrafts((prev) => ({
                          ...prev,
                          [product.id]: { ...draft, price: event.target.value },
                        }))
                      }
                      disabled={!token}
                    />
                    <input
                      value={draft.quantity}
                      onChange={(event) =>
                        setEditDrafts((prev) => ({
                          ...prev,
                          [product.id]: { ...draft, quantity: event.target.value },
                        }))
                      }
                      disabled={!token}
                    />
                    <input
                      value={draft.category}
                      onChange={(event) =>
                        setEditDrafts((prev) => ({
                          ...prev,
                          [product.id]: { ...draft, category: event.target.value },
                        }))
                      }
                      disabled={!token}
                    />
                    <button type="button" onClick={() => handleUpdateProduct(product.id)} disabled={!token}>
                      Save
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => handleDeleteProduct(product.id)}
                      disabled={!token}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
            {token && products.length === 0 ? <p className="hint">No products yet.</p> : null}
            {!token ? <p className="hint">Login to manage products.</p> : null}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
