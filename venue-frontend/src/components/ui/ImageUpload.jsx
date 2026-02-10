import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import { Button } from './Button';
import { showToast } from '../NotificationToast';

const ImageUpload = ({ value, onChange, label = "Image", className = "" }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(value);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
        showToast('Please upload an image file', 'error');
        return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should be less than 5MB', 'error');
        return;
    }

    // Upload
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await api.post('/organizer/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        
        const url = response.data?.data?.url;
        if (url) {
            setPreview(url);
            onChange(url);
            showToast('Image uploaded successfully', 'success');
        }
    } catch (error) {
        console.error('Upload failed', error);
        showToast(error.response?.data?.message || 'Failed to upload image', 'error');
    } finally {
        setIsUploading(false);
        // Reset input to allow re-uploading same file if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    setPreview('');
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-textMuted">{label}</label>
      
      <div className="flex items-center gap-4">
        {preview ? (
            <div className="relative w-40 h-40 rounded-xl overflow-hidden border border-white/10 group">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                        type="button"
                        onClick={handleRemove}
                        className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        ) : (
            <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-40 h-40 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-accentOrange/50 hover:bg-white/5 transition-all text-textMuted hover:text-white"
            >
                {isUploading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-accentOrange mb-2" />
                ) : (
                    <Upload className="w-8 h-8 mb-2" />
                )}
                <span className="text-xs text-center px-2">
                    {isUploading ? 'Uploading...' : 'Click to upload'}
                </span>
            </div>
        )}

        <div className="flex-1 text-sm text-textMuted">
            <p>Upload a cover image for your event.</p>
            <p className="text-xs mt-1 opacity-60">Max size: 5MB. Formats: JPG, PNG.</p>
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
};

export default ImageUpload;
