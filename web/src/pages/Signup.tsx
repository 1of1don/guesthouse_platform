import { Link } from 'react-router-dom';
import './Login.css';

export default function Signup() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Admin account setup</h1>
        <p className="auth-subtitle">
          Admin accounts are created by the Firebase project owner. Ask them
          to create your Firebase Authentication account and add your user ID
          to the <code>admins</code> collection.
        </p>
        <p className="auth-footer"><Link to="/login">Back to login</Link></p>
      </div>
    </div>
  );
}