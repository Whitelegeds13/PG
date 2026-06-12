import { useEffect, useState } from 'react';

import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import api, { getErrorMessage } from '../services/api';

const emptyTicket = {
  subject: '',
  description: '',
  category: 'hardware',
  priority: 'media',
};

function TicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [draft, setDraft] = useState(emptyTicket);
  const [selected, setSelected] = useState(null);
  const [quote, setQuote] = useState(null);
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [quoteDraft, setQuoteDraft] = useState({
    diagnosis: '',
    description: '',
    quantity: 1,
    unitPrice: '',
    laborCost: '',
    validUntil: '',
  });

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    try {
      const { data } = await api.get('/tickets');
      setTickets(data.tickets);
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function openTicket(ticketId) {
    const { data } = await api.get(`/tickets/${ticketId}`);
    setSelected(data.ticket);
    setQuote(data.quote);
  }

  async function createTicket(event) {
    event.preventDefault();
    try {
      await api.post('/tickets', draft);
      setDraft(emptyTicket);
      setMessage('Ticket creado correctamente');
      loadTickets();
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function sendReply(event) {
    event.preventDefault();
    await api.post(`/tickets/${selected._id}/messages`, { message: reply });
    setReply('');
    openTicket(selected._id);
  }

  async function claimTicket() {
    await api.patch(`/tickets/${selected._id}/assign`, {});
    openTicket(selected._id);
    loadTickets();
  }

  async function changeStatus(status) {
    await api.patch(`/tickets/${selected._id}/status`, { status });
    openTicket(selected._id);
    loadTickets();
  }

  async function createQuote(event) {
    event.preventDefault();
    try {
      await api.post(`/tickets/${selected._id}/quote`, {
        diagnosis: quoteDraft.diagnosis,
        items: [{
          description: quoteDraft.description,
          quantity: Number(quoteDraft.quantity),
          unitPrice: Number(quoteDraft.unitPrice),
        }],
        laborCost: Number(quoteDraft.laborCost || 0),
        validUntil: quoteDraft.validUntil,
      });
      setMessage('Cotizacion enviada');
      openTicket(selected._id);
      loadTickets();
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function respondQuote(status) {
    await api.patch(`/tickets/${selected._id}/quote`, { status });
    openTicket(selected._id);
    loadTickets();
  }

  return (
    <main className="page content-section">
      <div className="page-heading">
        <div><p className="eyebrow">Centro de ayuda</p><h1>Soporte tecnico</h1></div>
      </div>
      {message && <button className="alert info dismissible" onClick={() => setMessage('')} type="button">{message}</button>}

      {user.role === 'cliente' && (
        <details className="admin-panel">
          <summary>Abrir nuevo ticket</summary>
          <form className="form-grid" onSubmit={createTicket}>
            <label>Asunto<input onChange={(event) => setDraft({ ...draft, subject: event.target.value })} required value={draft.subject} /></label>
            <label>Categoria<select onChange={(event) => setDraft({ ...draft, category: event.target.value })} value={draft.category}><option value="hardware">Hardware</option><option value="software">Software</option><option value="mantenimiento">Mantenimiento</option><option value="otro">Otro</option></select></label>
            <label>Prioridad<select onChange={(event) => setDraft({ ...draft, priority: event.target.value })} value={draft.priority}><option value="baja">Baja</option><option value="media">Media</option><option value="alta">Alta</option></select></label>
            <label className="wide">Descripcion<textarea minLength="10" onChange={(event) => setDraft({ ...draft, description: event.target.value })} required value={draft.description} /></label>
            <button className="button primary" type="submit">Crear ticket</button>
          </form>
        </details>
      )}

      <div className="ticket-layout">
        <section className="ticket-list">
          {tickets.map((ticket) => (
            <button className={`ticket-preview ${selected?._id === ticket._id ? 'selected' : ''}`} key={ticket._id} onClick={() => openTicket(ticket._id)} type="button">
              <small>{ticket.ticketNumber}</small>
              <strong>{ticket.subject}</strong>
              <StatusBadge value={ticket.status} />
            </button>
          ))}
        </section>

        <section className="ticket-detail">
          {!selected ? <div className="empty-state"><h2>Selecciona un ticket</h2></div> : (
            <>
              <div className="record-header">
                <div><small>{selected.ticketNumber}</small><h2>{selected.subject}</h2></div>
                <StatusBadge value={selected.status} />
              </div>
              <p>{selected.description}</p>
              <p className="muted">Prioridad {selected.priority} · {selected.category}</p>

              {user.role === 'soporte' && !selected.assignedTo && (
                <button className="button secondary small" onClick={claimTicket} type="button">Tomar ticket</button>
              )}
              {['soporte', 'administrador'].includes(user.role) && (
                <div className="inline-actions">
                  {selected.status === 'abierto' && <button onClick={() => changeStatus('en_revision')} type="button">Revisar</button>}
                  {selected.status === 'aprobado' && <button onClick={() => changeStatus('en_proceso')} type="button">Iniciar trabajo</button>}
                  {selected.status === 'en_proceso' && <button onClick={() => changeStatus('resuelto')} type="button">Resolver</button>}
                  {selected.status === 'resuelto' && <button onClick={() => changeStatus('cerrado')} type="button">Cerrar</button>}
                </div>
              )}

              <div className="message-thread">
                {selected.messages.map((entry) => (
                  <article className={`message ${entry.authorRole}`} key={entry._id}>
                    <strong>{entry.author?.name || entry.authorRole}</strong>
                    <p>{entry.message}</p>
                  </article>
                ))}
              </div>
              {selected.status !== 'cerrado' && (
                <form className="reply-form" onSubmit={sendReply}>
                  <input onChange={(event) => setReply(event.target.value)} placeholder="Escribe un mensaje..." required value={reply} />
                  <button className="button primary small" type="submit">Enviar</button>
                </form>
              )}

              {quote && (
                <article className="quote-card">
                  <div className="record-header"><h3>Cotizacion tecnica</h3><StatusBadge value={quote.status} /></div>
                  <p>{quote.diagnosis}</p>
                  {quote.items.map((item) => <p key={item.description}><span>{item.quantity} × {item.description}</span><strong>S/ {item.subtotal.toFixed(2)}</strong></p>)}
                  <p><span>Mano de obra</span><strong>S/ {quote.laborCost.toFixed(2)}</strong></p>
                  <p className="summary-total"><span>Total</span><strong>S/ {quote.total.toFixed(2)}</strong></p>
                  {user.role === 'cliente' && quote.status === 'pendiente' && (
                    <div className="record-actions">
                      <button className="button primary small" onClick={() => respondQuote('aprobada')} type="button">Aprobar</button>
                      <button className="button ghost small" onClick={() => respondQuote('rechazada')} type="button">Rechazar</button>
                    </div>
                  )}
                </article>
              )}

              {['soporte', 'administrador'].includes(user.role) && !['resuelto', 'cerrado'].includes(selected.status) && (
                <details className="admin-panel compact">
                  <summary>Crear o reemplazar cotizacion</summary>
                  <form className="form-grid" onSubmit={createQuote}>
                    {Object.keys(quoteDraft).map((field) => (
                      <label className={field === 'diagnosis' ? 'wide' : ''} key={field}>
                        {field}
                        <input
                          onChange={(event) => setQuoteDraft({ ...quoteDraft, [field]: event.target.value })}
                          required={!['laborCost'].includes(field)}
                          type={field === 'validUntil' ? 'date' : ['quantity', 'unitPrice', 'laborCost'].includes(field) ? 'number' : 'text'}
                          value={quoteDraft[field]}
                        />
                      </label>
                    ))}
                    <button className="button primary small" type="submit">Enviar cotizacion</button>
                  </form>
                </details>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default TicketsPage;
