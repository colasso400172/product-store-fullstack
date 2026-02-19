/* ==== Lista de productos para carrito ==== */
//Muestra una tabla de productos para agregar al carrito.
export function renderProductos(tbody, productos, onAdd) {
  tbody.innerHTML = '';
  for (const p of productos) {
    const disabled = p.stock <= 0 || p.estado === 'NO_DISPONIBLE';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.nombre}</td>
      <td>$${Number(p.precio).toFixed(2)}</td>
      <td><span class="badge bg-secondary">${p.stock}</span></td>
      <td><button class="btn btn-sm btn-outline-success" data-id="${p.id}" ${disabled?'disabled':''}>Agregar</button></td>
    `;
    tr.querySelector('button')?.addEventListener('click', () => onAdd(p));
    tbody.appendChild(tr);
  }
}
 //Muestra los controles de paginación: anterior («), página actual y siguiente (»).
export function renderPaginacion(container, page, pageSize, total, onChange) {
  container.innerHTML = '';
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const prev = btn('«', 'btn btn-sm btn-outline-secondary'); prev.disabled = page <= 1; prev.onclick = () => onChange(page - 1);
  const info = document.createElement('span'); info.className='align-self-center'; info.textContent = ` Página ${page} de ${totalPages} `;
  const next = btn('»', 'btn btn-sm btn-outline-secondary'); next.disabled = page >= totalPages; next.onclick = () => onChange(page + 1);
  container.append(prev, info, next);
}
//Renderiza el carrito de compras con:
export function renderCarrito(tbody, totalEl, carrito, onInc, onDec, onRemove) {
  tbody.innerHTML = '';
  let total = 0;
  for (const item of carrito) {
    total += item.subtotal;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.nombre}</td>
      <td>
        <div class="btn-group btn-group-sm" role="group">
          <button class="btn btn-outline-secondary" data-id="${item.productoId}" data-act="dec">-</button>
          <span class="px-2">${item.cantidad}</span>
          <button class="btn btn-outline-secondary" data-id="${item.productoId}" data-act="inc">+</button>
        </div>
      </td>
      <td class="text-end">$${item.subtotal.toFixed(2)}</td>
      <td><button class="btn btn-sm btn-outline-danger" data-id="${item.productoId}" data-act="rm">x</button></td>
    `;
    tr.addEventListener('click', (e) => {
      const btn = e.target.closest('button'); if (!btn) return;
      const id = Number(btn.dataset.id); const act = btn.dataset.act;
      if (act === 'inc') onInc(id);
      else if (act === 'dec') onDec(id);
      else if (act === 'rm') onRemove(id);
    });
    tbody.appendChild(tr);
  }
  totalEl.textContent = total.toFixed(2);
}
//Llena un <select> con los clientes disponibles.
export function renderClientes(select, clientes) {
  select.innerHTML = '<option value="">Seleccione…</option>';
  for (const c of clientes) {
    const opt = document.createElement('option');
    opt.value = c.id; opt.textContent = `${c.nombre} (${c.email})`;
    select.appendChild(opt);
  }
}
//Muestra un mensaje (tipo éxito o error) en un elemento HTML.
export function setMsg(el, text, ok = true) {
  el.className = `mt-2 small ${ok ? 'text-success' : 'text-danger'}`;
  el.textContent = text || '';
}
//Muestra tarjetas/resúmenes de pedidos:
export function renderPedidos(container, pedidos) {
  container.innerHTML = '';
  for (const p of pedidos) {
    const col = document.createElement('div'); col.className='col-md-6 col-lg-4';
    const total = Number(p.total).toFixed(2);
    const items = (p.items || []).map(i => `${i.cantidad}× ${i.producto?.nombre ?? 'Prod'} ($${Number(i.precioUnitario).toFixed(2)})`).join(' • ');
    col.innerHTML = `
      <div class="card h-100">
        <div class="card-body">
          <h4 class="h6 mb-1">Pedido #${p.id} — ${p.cliente?.nombre ?? 'Cliente'}</h4>
          <div class="small text-muted mb-2">${new Date(p.fecha).toLocaleString()} — <span class="badge text-bg-info">${p.estado}</span></div>
          <div class="mb-2">${items || '<em>Sin ítems</em>'}</div>
          <div class="fw-bold text-end">Total: $${total}</div>
        </div>
      </div>
    `;
    container.appendChild(col);
  }
}

/* Tabla Administrar: Clientes */
export function renderClientesAdmin(tbody, clientes, onEdit, onDelete) {
  tbody.innerHTML = '';
  for (const c of clientes) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.id}</td>
      <td>${c.nombre}</td>
      <td>${c.email}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-primary me-1" data-id="${c.id}" data-act="edit">Editar</button>
        <button class="btn btn-sm btn-outline-danger" data-id="${c.id}" data-act="del">Eliminar</button>
      </td>
    `;
    tr.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const id = Number(b.dataset.id);
      if (b.dataset.act === 'edit') onEdit(id); else onDelete(id);
    });
    tbody.appendChild(tr);
  }
}

/* Tabla Administrar: Productos */
export function renderProductosAdmin(tbody, productos, onEdit, onDelete) {
  tbody.innerHTML = '';
  for (const p of productos) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.nombre}</td>
      <td>$${Number(p.precio).toFixed(2)}</td>
      <td>${p.stock}</td>
      <td><span class="badge ${p.estado==='DISPONIBLE'?'text-bg-success':'text-bg-secondary'}">${p.estado ?? 'DISPONIBLE'}</span></td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-primary me-1" data-id="${p.id}" data-act="edit">Editar</button>
        <button class="btn btn-sm btn-outline-danger" data-id="${p.id}" data-act="del">Eliminar</button>
      </td>
    `;
    tr.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const id = Number(b.dataset.id);
      if (b.dataset.act === 'edit') onEdit(id); else onDelete(id);
    });
    tbody.appendChild(tr);
  }
}

/* Admin: Pedidos (lista con Edit/Del y selector de estado inline) */
export function renderPedidosAdmin(tbody, pedidos, onEstado, onDelete, onEditarDetalle) {
  tbody.innerHTML = '';
  for (const p of pedidos) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.cliente?.nombre ?? '—'}</td>
      <td>${new Date(p.fecha).toLocaleString()}</td>
      <td>$${Number(p.total).toFixed(2)}</td>
      <td>
        <select class="form-select form-select-sm" data-id="${p.id}" data-act="estado">
          <option value="CREADO" ${p.estado === 'CREADO' ? 'selected' : ''}>CREADO</option>
          <option value="CONFIRMADO" ${p.estado === 'CONFIRMADO' ? 'selected' : ''}>CONFIRMADO</option>
          <option value="CANCELADO" ${p.estado === 'CANCELADO' ? 'selected' : ''}>CANCELADO</option>
        </select>
      </td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-secondary me-1" data-id="${p.id}" data-act="edit">Editar</button>
        <button class="btn btn-sm btn-outline-danger" data-id="${p.id}" data-act="del">Eliminar</button>
      </td>
    `;
    tr.addEventListener('change', (e) => {
      const sel = e.target.closest('select'); if (!sel) return;
      onEstado(Number(sel.dataset.id), sel.value);
    });
    tr.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const id = Number(b.dataset.id);
      if (b.dataset.act === 'edit') onEditarDetalle(id); else onDelete(id);
    });
    tbody.appendChild(tr);
  }
}

/* === Modal edición de pedido (ítems) === */
export function buildPedidoEditUI({ modal, clientes, productos, pedido, onAddItem, onChangeQty, onRemoveItem, calcTotal }) {
  // Cliente
  const selCli = modal.querySelector('#pedido-edit-cliente');
  selCli.innerHTML = '';
  for (const c of clientes) {
    const opt = document.createElement('option');
    opt.value = c.id; opt.textContent = `${c.nombre} (${c.email})`;
    if (c.id === pedido.clienteId) opt.selected = true;
    selCli.appendChild(opt);
  }

  // Selector de producto a agregar (solo disponibles)
  const selProd = modal.querySelector('#pedido-edit-prod');
  selProd.innerHTML = '';
  for (const p of productos) {
    if (p.estado === 'NO_DISPONIBLE' || p.stock <= 0) continue;
    const opt = document.createElement('option');
    opt.value = p.id; opt.textContent = `${p.nombre} ($${Number(p.precio).toFixed(2)})`;
    selProd.appendChild(opt);
  }

  // Tabla items
  const tbody = modal.querySelector('#pedido-edit-tabla tbody');
  tbody.innerHTML = '';
  for (const it of (pedido.items || [])) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${it.producto?.nombre ?? 'Prod'}</td>
      <td><input type="number" class="form-control form-control-sm" data-id="${it.productoId}" value="${it.cantidad}" min="1" step="1"></td>
      <td class="text-end">$${Number(it.precioUnitario).toFixed(2)}</td>
      <td class="text-end">$${Number(it.subtotal).toFixed(2)}</td>
      <td class="text-end"><button class="btn btn-sm btn-outline-danger" data-id="${it.productoId}">x</button></td>
    `;
    tr.querySelector('input').addEventListener('change', (e) => {
      const id = Number(e.target.dataset.id);
      const qty = Number(e.target.value);
      onChangeQty(id, qty);
    });
    tr.querySelector('button').addEventListener('click', () => onRemoveItem(it.productoId));
    tbody.appendChild(tr);
  }

  // Total
  modal.querySelector('#pedido-edit-total').textContent = calcTotal().toFixed(2);

  return {
    getClienteId: () => Number(selCli.value),
    getProductoAAgregar: () => Number(selProd.value),
    getCantidadAAgregar: () => Number(modal.querySelector('#pedido-edit-cant').value)
  };
}

/* Utils */
function btn(txt, cls) { const b = document.createElement('button'); b.textContent = txt; b.className = cls; return b; }
