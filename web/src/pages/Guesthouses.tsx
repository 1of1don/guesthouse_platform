import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Guesthouse } from '../types';
import './Dashboard.css';

export default function Guesthouses() {
  const [items, setItems] = useState<Guesthouse[]>([]);

  useEffect(() => {
    api.getGuesthouses().then(setItems);
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Guesthouses</h1>
        <Link to="/guesthouses/new" className="btn btn-primary">
          + Add Guesthouse
        </Link>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>City</th>
              <th>Price</th>
              <th>Rating</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((g) => (
              <tr key={g._id}>
                <td className="td-strong">{g.name}</td>
                <td>{g.city}</td>
                <td>P{g.pricePerNight}</td>
                <td>{g.rating}</td>
                <td>
                  <Link
                    to={`/guesthouses/${g._id}/edit`}
                    className="link-action"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}