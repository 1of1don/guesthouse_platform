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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api.getGuesthouse(id)
      .then((guesthouse) => {
        setForm(guesthouse);
        setAmenitiesInput(guesthouse.amenities.join(', '));
      })
      .catch((cause: unknown) => {
        setError(
          cause instanceof Error ? cause.message : 'Unable to load guesthouse.',
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      amenities: amenitiesInput
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
    };
    try {
      const images = { logo: logoFile, gallery: galleryFiles };
      if (id) await api.updateGuesthouse(id, payload, images);
      else await api.createGuesthouse(payload, images);
      navigate('/guesthouses');
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to save guesthouse.',
      );
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (id && confirm('Delete this guesthouse?')) {
      setError('');
      try {
        await api.deleteGuesthouse(id);
        navigate('/guesthouses');
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : 'Unable to delete guesthouse.',
        );
      }
    }
  };

  if (loading) return <p>Loading guesthouse...</p>;

  return (
    <div className="form-page">
      <h1 className="page-title">
        {id ? 'Edit Guesthouse' : 'Add Guesthouse'}
      </h1>

      {error && <p className="form-error" role="alert">{error}</p>}
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
              min="0"
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
          <div className="form-row">
            <input
              type="number"
              className="form-input"
              aria-label="Latitude"
              min="-90"
              max="90"
              step="any"
              value={form.coordinates.lat}
              onChange={(e) =>
                setForm({
                  ...form,
                  coordinates: {
                    ...form.coordinates,
                    lat: Number(e.target.value),
                  },
                })
              }
              required
            />
            <input
              type="number"
              className="form-input"
              aria-label="Longitude"
              min="-180"
              max="180"
              step="any"
              value={form.coordinates.lng}
              onChange={(e) =>
                setForm({
                  ...form,
                  coordinates: {
                    ...form.coordinates,
                    lng: Number(e.target.value),
                  },
                })
              }
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="upload-box">
            <p className="upload-box-title">Logo</p>
            {form.logo && !logoFile && (
              <img className="image-preview" src={form.logo} alt="Current logo" />
            )}
            <input
              type="file"
              className="form-input"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
            />
            {logoFile && <p className="form-hint">{logoFile.name}</p>}
          </div>
          <div className="upload-box">
            <p className="upload-box-title">
              Gallery ({(form.gallery?.length || 0) + galleryFiles.length} images)
            </p>
            <input
              type="file"
              className="form-input"
              accept="image/*"
              multiple
              onChange={(e) => setGalleryFiles(Array.from(e.target.files ?? []))}
            />
            <p className="form-hint">Selected gallery images are added to the existing ones.</p>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
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