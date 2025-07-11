'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

export default function DocumentUploader({ tenantSlug }: { tenantSlug: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('other');
  const [isPublic, setIsPublic] = useState(true);
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const handleUpload = async () => {
    if (!file || !title) {
      alert('Please select a file and provide a title');
      return;
    }

    setUploading(true);

    const { data: userData } = await supabase.auth.getUser();
    const uploadedBy = userData?.user?.id;

    if (!uploadedBy) {
      alert('You must be signed in to upload documents.');
      setUploading(false);
      return;
    }

    const { data: tenantData } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .single();

    if (!tenantData?.id) {
      alert('Could not resolve tenant ID');
      setUploading(false);
      return;
    }

    const tenantId = tenantData.id;
    const filePath = `${Date.now()}-${file.name}`;
    const bucketName = isPublic
      ? `${tenantSlug}-public`
      : `${tenantSlug}-private`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      alert('Upload failed: ' + uploadError.message);
      console.error(uploadError);
      setUploading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('documents')
      .insert([
        {
          tenant_id: tenantId,
          title,
          filename: file.name,
          storage_path: filePath,
          file_type: file.type,
          uploaded_by: uploadedBy,
          is_public: isPublic,
          doc_type: docType,
        },
      ]);

    if (insertError) {
      alert('Failed to register document: ' + insertError.message);
      console.error(insertError);
    } else {
      alert('Upload successful!');
      setFile(null);
      setTitle('');
      setDocType('other');
      setIsPublic(true);
    }

    setUploading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);

    if (selected) {
      const rawName = selected.name.replace(/\.[^/.]+$/, ''); // remove extension
      const formatted = rawName
        .replace(/[-_]+/g, ' ')     // replace dashes/underscores with spaces
        .replace(/\s+/g, ' ')       // collapse multiple spaces
        .trim()
        .replace(/\w\S*/g, (word) =>
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ); // title case
      setTitle(formatted);
    }
  };

  return (
    <div className="space-y-4">
      <input type="file" onChange={handleFileSelect} />
      <input
        type="text"
        placeholder="Document title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="block w-full border p-2"
      />
      <select
        value={docType}
        onChange={(e) => setDocType(e.target.value)}
        className="block w-full border p-2"
      >
        {[
          'bylaws', 'declaration', 'articles', 'rules',
          'budget', 'financials', 'minutes', 'notices',
          'contracts', 'insurance', 'other'
        ].map((type) => (
          <option key={type} value={type}>
            {type[0].toUpperCase() + type.slice(1)}
          </option>
        ))}
      </select>
      <label className="inline-flex items-center">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={() => setIsPublic(!isPublic)}
          className="mr-2"
        />
        Public document
      </label>
      <button
        onClick={handleUpload}
        disabled={uploading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
}
