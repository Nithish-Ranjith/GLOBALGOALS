import React, { useState, FormEvent, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import confetti from 'canvas-confetti';
import './RegistrationModal.css';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RegistrationModal({ isOpen, onClose }: RegistrationModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    otherCollege: '',
    teamName: '',
    teamSize: '1 person',
    source: '',
    otherSource: '',
  });

  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getAmount = () => {
    if (formData.teamSize === '1 person') return 500;
    if (formData.teamSize === '2 person') return 899;
    if (formData.teamSize === '3 person') return 1200;
    if (formData.teamSize === '4 person') return 1499;
    return 500;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    let formattedValue = value;
    
    if (name === 'phone') {
      formattedValue = value.replace(/[^\d+ ]/g, ''); 
      if (formattedValue.length === 10 && !formattedValue.startsWith('+')) {
        formattedValue = '+91 ' + formattedValue;
      }
    } else if (name === 'name' || name === 'teamName') {
      formattedValue = value.replace(/\b\w/g, c => c.toUpperCase());
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!paymentScreenshot) {
        throw new Error('Please upload the payment screenshot.');
      }

      // 1. Compress payment screenshot
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1024,
        useWebWorker: true
      };
      const compressedFile = await imageCompression(paymentScreenshot, options);

      // 2. Upload compressed screenshot to Supabase Storage
      const fileExt = compressedFile.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(filePath, compressedFile);

      if (uploadError) throw new Error('Failed to upload screenshot. Have you created the "payment-screenshots" bucket?');

      const finalCollege = formData.college === 'Other' ? formData.otherCollege : formData.college;
      const finalSource = formData.source === 'Other' ? formData.otherSource : formData.source;

      // 2. Insert data into Supabase Database
      const { error: insertError } = await supabase
        .from('registrations')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            college: finalCollege,
            team_name: formData.teamName,
            team_size: formData.teamSize,
            payment_amount: getAmount(),
            payment_screenshot_path: filePath,
            point_of_contact: finalSource,
          }
        ]);

      if (insertError) {
        console.error("Supabase Insert Error:", insertError);
        throw new Error(`Database error: ${insertError.message}`);
      }

      // 4. Send confirmation email via Make.com
      await fetch('https://hook.eu1.make.com/03dgpq6zim2u22mpyoeawo179bvhrwcs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          teamName: formData.teamName,
          college: finalCollege,
          teamSize: formData.teamSize,
          amount: getAmount(),
        })
      });

      // 3. (Optional) Sync to Google Sheets
      const googleWebhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
      if (googleWebhookUrl && googleWebhookUrl.trim().length > 5) {
        const payload = new FormData();
        payload.append("Date", new Date().toLocaleString());
        payload.append("Name", formData.name);
        payload.append("Email", formData.email);
        payload.append("Phone", formData.phone);
        payload.append("College", finalCollege);
        payload.append("TeamName", formData.teamName);
        payload.append("TeamSize", formData.teamSize);
        payload.append("Amount", getAmount().toString());
        payload.append("Screenshot", filePath);
        payload.append("Source", finalSource);

        fetch(googleWebhookUrl, { method: "POST", mode: "no-cors", body: payload }).catch(e => console.warn("Google Sync Error", e));
      }

      setSuccess(true);
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#fba814', '#ffffff'] // Clean hackathon colors
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="modal-overlay">
        <div className="modal-content success-modal">
          <CheckCircle2 className="success-icon" size={64} />
          <h2>Registration Successful!</h2>
          <p>Thank you for registering for the Global Goals Hackathon. We'll be in touch soon!</p>
          <button className="button button--solid" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Registration Form</h2>
          <button className="close-button" onClick={onClose} aria-label="Close modal">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="registration-form">
          {error && (
            <div className="error-message">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label>Full Name *</label>
            <input type="text" name="name" required value={formData.name} onChange={handleInputChange} placeholder="Your answer" />
          </div>

          <div className="form-group">
            <label>Email ID *</label>
            <input type="email" name="email" required value={formData.email} onChange={handleInputChange} placeholder="Your answer" />
          </div>

          <div className="form-group">
            <label>Phone number (WhatsApp number) *</label>
            <input type="tel" name="phone" required value={formData.phone} onChange={handleInputChange} placeholder="Your answer" />
          </div>

          <div className="form-group radio-group">
            <label>College Name *</label>
            <div className="radio-options">
              {['SRM-AP University', 'VIT-AP University', 'Amrita University', 'KL U', 'Other'].map(opt => (
                <label key={opt} className="radio-label">
                  <input type="radio" name="college" value={opt} checked={formData.college === opt} onChange={handleInputChange} required />
                  {opt}
                </label>
              ))}
            </div>
            {formData.college === 'Other' && (
              <input type="text" name="otherCollege" required value={formData.otherCollege} onChange={handleInputChange} placeholder="Type your college name" className="other-input" />
            )}
          </div>

          <div className="form-group">
            <label>Team Name *</label>
            <input type="text" name="teamName" required value={formData.teamName} onChange={handleInputChange} placeholder="Your answer" />
          </div>

          <div className="form-group radio-group">
            <label>Team Size *</label>
            <div className="radio-options">
              {['1 person', '2 person', '3 person', '4 person'].map(opt => (
                <label key={opt} className="radio-label">
                  <input type="radio" name="teamSize" value={opt} checked={formData.teamSize === opt} onChange={handleInputChange} required />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group payment-section">
            <label>Payment details *</label>
            <div className="payment-instructions">
              <p>For registration, pay to the below scanner as per your team size:</p>
              <ul>
                <li>Solo: ₹500</li>
                <li>Team of 2: ₹899</li>
                <li>Team of 3: ₹1200</li>
                <li>Team of 4: ₹1499</li>
              </ul>
              <p className="highlight-amount">You need to pay: <b>₹{getAmount()}</b></p>
            </div>
            <div className="qr-container">
              {/* Using a placeholder for QR since we don't have the cropped one */}
              <div className="qr-placeholder" style={{ background: '#741D29', padding: '1rem', borderRadius: '1rem', textAlign: 'center', margin: '1rem 0' }}>
               <img src="/payment-qr.png" alt="Scan here to pay" style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', background: '#fff', padding: '0.5rem', borderRadius: '0.5rem' }} />
               <p style={{ marginTop: '1rem', color: '#fff' }}>Please send ₹{getAmount()} to the QR code above.</p>
              </div>
            </div>

            <label className="file-upload-label">
              <span className="file-upload-text">Upload Payment Screenshot *</span>
              <div className="file-upload-box">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setPaymentScreenshot(e.target.files[0]);
                    }
                  }}
                  required
                />
                <Upload size={24} />
                <span>{paymentScreenshot ? paymentScreenshot.name : 'Choose a file or drag it here'}</span>
              </div>
            </label>
          </div>

          <div className="form-group radio-group">
            <label>How did you get to know about the Hackathon? *</label>
            <div className="radio-options">
              {['PR', 'Social media', 'Poster', 'Other'].map(opt => (
                <label key={opt} className="radio-label">
                  <input type="radio" name="source" value={opt} checked={formData.source === opt} onChange={handleInputChange} required />
                  {opt}
                </label>
              ))}
            </div>
            {formData.source === 'Other' && (
              <input type="text" name="otherSource" required value={formData.otherSource} onChange={handleInputChange} placeholder="Specify source" className="other-input" />
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="button button--subtle" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="button button--solid" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="spinner" size={20} />
                  Submitting...
                </>
              ) : 'Submit Registration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
