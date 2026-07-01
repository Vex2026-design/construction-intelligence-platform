import { useEffect, useState } from "react";
import { getUsers } from "../lib/api";

export default function AdminPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    getUsers().then(setUsers);
  }, []);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Administration</span>
          <h1>Users & Access</h1>
          <p>L'Admin crea utenti, assegna ruoli e limita l'accesso ai progetti.</p>
        </div>
        <button className="primary-button" type="button">+ Nuovo utente</button>
      </header>

      <section className="panel">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Azienda</th>
              <th>Ruolo</th>
              <th>Stato</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.fullName || user.full_name}</td>
                <td>{user.email}</td>
                <td>{user.company}</td>
                <td>{user.role}</td>
                <td>{user.active ? "Attivo" : "Disattivo"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
