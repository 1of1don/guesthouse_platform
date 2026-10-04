import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import type { Guesthouse } from '../types';
import './AddEditGuesthouse.css';

const empty: Guesthouse = {
  name: '',
  city: '',
  country: 'Botswana',
  description: '',
  amenities: [],
  contactDetails: '',
  coordinates: { lat: -24.6282, lng: 25.9231 },
  pricePerNight: 0,
  rating: 0,
  gallery: [],
  logo: '',
};

export default function AddEditGuesthouse() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<Guesthouse>(empty);
  const [amenitiesInput, setAmenitiesInput] = useState('');

  useEffect(() => {
    if (id) {
      api.getGuesthouse(id).then((g) => {
        setForm(g);
        setAmenitiesInput(g.amenities.join(', '));
      });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      amenities: amenitiesInput
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
    };
    if (id) await api.updateGuesthouse(id, payload);
    else await api.createGuesthouse(payload);
    navigate('/guesthouses');
  };

  const handleDelete = async () => {
    if (id && confirm('Delete this guesthouse?')) {
      await api.deleteGuesthouse(id);
      navigate('/guesthouses');
    }
  };

  return (
    <div className="form-page">
      <h1 className="page-title">
        {id ? 'Edit Guesthouse' : 'Add Guesthouse'}
      </h1>

      <form onSubmit={handleSubmit} className="gh-form">
        <div className="form-group">
          <label className="form-label">Name *</label>
          <input
            className="form-input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">City *</label>
            <input
              className="form-input"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Country *</label>
            <input
              className="form-input"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description *</label>
          <textarea
            className="form-input form-textarea"
            rows={3}
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Amenities *</label>
          <input
            className="form-input"
            value={amenitiesInput}
            onChange={(e) => setAmenitiesInput(e.target.value)}
            placeholder="Wifi, Parking, Pool, Breakfast"
          />
          <p className="form-hint">Separate amenities with commas</p>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Contact details *</label>
            <input
              className="form-input"
              value={form.contactDetails}
              onChange={(e) =>
                setForm({ ...form, contactDetails: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Price per night (P) *</label>
            <input
              type="number"
              className="form-input"
              value={form.pricePerNight}
              onChange={(e) =>
                setForm({ ...form, pricePerNight: Number(e.target.value) })
              }
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            Location (Google Maps coordinates) *
          </label>
          <div className="map-placeholder">
            📍 Pin set — {form.coordinates.lat}, {form.coordinates.lng}
          </div>
        </div>

        <div className="form-row">
          <div className="upload-box">
            <p className="upload-box-title">Logo</p>
            <button type="button" className="upload-btn">
              Change image
            </button>
          </div>
          <div className="upload-box">
            <p className="upload-box-title">
              Gallery ({form.gallery?.length || 0} images)
            </p>
            <button type="button" className="upload-btn">
              Change image
            </button>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Save Changes
          </button>
          {id && (
            <button
              type="button"
              onClick={handleDelete}
              className="link-danger"
            >
              Delete Guesthouse
            </button>
          )}
        </div>
      </form>
    </div>
  );
}